import { and, desc, eq, inArray } from "drizzle-orm";
import db from "../../db";
import {
  agent,
  agentKnowledge,
  libraryItem,
  library,
  member,
} from "../../db/schemas";
import type {
  CreateAgentPayload,
  UpdateAgentPayload,
} from "./interfaces";
import { TRPCError } from "@trpc/server";
import type { Database } from "../../types";

export class AgentService {
  private db: Database;

  constructor(database: Database = db) {
    this.db = database;
  }
  // Create a new agent
  async createAgent(
    organizationId: string,
    userId: string,
    payload: CreateAgentPayload
  ) {
    // Validate organization access by checking user membership
    await this.validateUserOrganizationAccess(userId, organizationId);


    const [newAgent] = await this.db.insert(agent).values({
            ...payload,
      organizationId,
    }).returning();

    if (!newAgent) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create agent",
      });
    }

    // Attach knowledge items if provided
    if (payload.knowledgeItems?.length) {
      await this.addKnowledgeToAgent(
        newAgent.id,
        payload.knowledgeItems,
        organizationId
      );
    }

    return newAgent;
  }

  // Get all agents for an organization
  async getOrganizationAgents(organizationId: string) {
    const agents = await this.db.query.agent.findMany({
      where: eq(agent.organizationId, organizationId),
      orderBy: [desc(agent.createdAt)],
    });

    return agents;
  }

  // Get a specific agent with its knowledge
  async getAgentWithKnowledge(
    agentId: string,
    organizationId: string
  ) {
    const agentData = await this.db.query.agent.findFirst({
      where: and(
        eq(agent.id, agentId),
        eq(agent.organizationId, organizationId)
      ),
      with: {
        knowledge: {
          with: {
            libraryItem: true,
          },
          orderBy: [desc(agentKnowledge.createdAt)],
        },
      },
    });

    return agentData;
  }

  // Update an agent
  async updateAgent(
    agentId: string,
    payload: UpdateAgentPayload,
    organizationId: string
  ) {
    // Validate agent ownership
    await this.validateAgentAccess(agentId, organizationId);

    const updateData = {
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    const [updatedAgent] = await this.db
      .update(agent)
      .set(updateData)
      .where(
        and(eq(agent.id, agentId), eq(agent.organizationId, organizationId))
      )
      .returning();

    if (!updatedAgent) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent not found",
      });
    }

    return updatedAgent;
  }

  // Delete an agent
  async deleteAgent(agentId: string, organizationId: string): Promise<void> {
    // Validate agent ownership
    await this.validateAgentAccess(agentId, organizationId);

    const result = await this.db
      .delete(agent)
      .where(
        and(eq(agent.id, agentId), eq(agent.organizationId, organizationId))
      );

    // Handle different database drivers - Neon has rowCount, postgres-js uses array length
    const affectedRows = 'rowCount' in result ? result.rowCount : result.length;
    if (affectedRows === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent not found",
      });
    }
  }

  // Add knowledge to an agent
  async addKnowledgeToAgent(
    agentId: string,
    libraryItemIds: string[],
    organizationId: string
  ): Promise<void> {
    // Validate agent ownership
    await this.validateAgentAccess(agentId, organizationId);

    // Validate library items belong to organization
    const validItems = await this.db.query.libraryItem.findMany({
      where: inArray(libraryItem.id, libraryItemIds),
      with: {
        library: true,
      },
    });

    const validItemsInOrg = validItems.filter(
      (item) => item.library.organizationId === organizationId
    );

    if (validItemsInOrg.length !== libraryItemIds.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Some library items not found or not accessible",
      });
    }

    // Create knowledge associations
    const knowledgeEntries = validItemsInOrg.map((item) => ({
      agentId,
      libraryItemId: item.id,
    }));

    try {
      await this.db.insert(agentKnowledge).values(knowledgeEntries);
    } catch (error) {
      // Handle duplicate entries gracefully
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Some knowledge items are already associated with this agent",
      });
    }
  }

  // Remove knowledge from an agent
  async removeKnowledgeFromAgent(
    agentId: string,
    libraryItemId: string,
    organizationId: string
  ): Promise<void> {
    // Validate agent ownership
    await this.validateAgentAccess(agentId, organizationId);

    const result = await this.db
      .delete(agentKnowledge)
      .where(
        and(
          eq(agentKnowledge.agentId, agentId),
          eq(agentKnowledge.libraryItemId, libraryItemId)
        )
      );

    // Handle different database drivers - Neon has rowCount, postgres-js uses array length
    const affectedRows = 'rowCount' in result ? result.rowCount : result.length;
    if (affectedRows === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Knowledge association not found",
      });
    }
  }

  // Get library items for agent RAG filtering
  async getAgentKnowledgeItemIds(agentId: string): Promise<string[]> {
    const knowledge = await this.db.query.agentKnowledge.findMany({
      where: eq(agentKnowledge.agentId, agentId),
      columns: {
        libraryItemId: true,
      },
    });

    return knowledge.map((k) => k.libraryItemId);
  }

  // Private helper methods
  private async validateUserOrganizationAccess(
    userId: string,
    organizationId: string
  ): Promise<void> {
    const membership = await this.db.query.member.findFirst({
      where: and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId)
      ),
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied to this organization",
      });
    }
  }

  private async validateAgentAccess(
    agentId: string,
    organizationId: string
  ) {
    const agentData = await this.db.query.agent.findFirst({
      where: and(
        eq(agent.id, agentId),
        eq(agent.organizationId, organizationId)
      ),
    });

    if (!agentData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent not found or access denied",
      });
    }

    return agentData;
  }
}

export const agentService = new AgentService();