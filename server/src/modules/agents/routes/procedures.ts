import { createTRPCRouter, protectedProcedure } from "../../../trpc/base";
import { AgentService, agentService } from "../agent.service";
import {
  createAgentSchema,
  updateAgentSchema,
  getAgentSchema,
  addKnowledgeSchema,
  removeKnowledgeSchema,
} from "../validators/agentValidator";

// Create agent router factory that accepts service dependency
export const createAgentProcedures = (service: AgentService = agentService) => {
  return createTRPCRouter({
    // Create new agent
    createAgent: protectedProcedure
      .input(createAgentSchema)
      .mutation(async ({ ctx, input }) => {
        const agent = await service.createAgent(
          ctx.activeOrganizationId,
          ctx.user.id,
          input
        );
        return agent;
      }),

    // List organization agents
    getAgents: protectedProcedure.query(async ({ ctx }) => {
      const agents = await service.getOrganizationAgents(
        ctx.activeOrganizationId
      );
      return agents;
    }),

    // Get specific agent with knowledge
    getAgent: protectedProcedure
      .input(getAgentSchema)
      .query(async ({ ctx, input }) => {
        const agent = await service.getAgentWithKnowledge(
          input.id,
          ctx.activeOrganizationId
        );
        return agent;
      }),

    // Update agent configuration
    updateAgent: protectedProcedure
      .input(updateAgentSchema)
      .mutation(async ({ ctx, input }) => {
        const agent = await service.updateAgent(
          input.id,
          input,
          ctx.activeOrganizationId
        );
        return agent;
      }),

    // Delete agent
    deleteAgent: protectedProcedure
      .input(getAgentSchema)
      .mutation(async ({ ctx, input }) => {
        await service.deleteAgent(input.id, ctx.activeOrganizationId);
        return { success: true };
      }),

    // Add knowledge to agent
    addKnowledge: protectedProcedure
      .input(addKnowledgeSchema)
      .mutation(async ({ ctx, input }) => {
        await service.addKnowledgeToAgent(
          input.agentId,
          input.libraryItemIds,
          ctx.activeOrganizationId
        );
        return { success: true };
      }),

    // Remove knowledge from agent
    removeKnowledge: protectedProcedure
      .input(removeKnowledgeSchema)
      .mutation(async ({ ctx, input }) => {
        await service.removeKnowledgeFromAgent(
          input.agentId,
          input.libraryItemId,
          ctx.activeOrganizationId
        );
        return { success: true };
      }),
  });
};

// Default export using production service
export const agentProcedures = createAgentProcedures();