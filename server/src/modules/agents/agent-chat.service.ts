import { streamText } from "ai";
import { createRuntimeContext } from "../../lib/factory";
import { mastra } from "../../config/mastra";
import { agentService } from "./agent.service";
import { TRPCError } from "@trpc/server";
import type { AgentChatRequest } from "./interfaces";

export class AgentChatService {
  async executeAgentChat(request: AgentChatRequest) {
    // Get the agent configuration with knowledge
    const agentConfig = await agentService.getAgentWithKnowledge(
      request.agentId,
      request.organizationId
    );

    if (!agentConfig) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent not found",
      });
    }

    if (!agentConfig.isActive) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Agent is not active",
      });
    }

    // Create runtime context with agent config and knowledge filter
    const runtimeContext = createRuntimeContext();
    runtimeContext.set("agent", agentConfig);
    runtimeContext.set("resourceId", request.userId);
    runtimeContext.set("sessionId", `agent-${request.agentId}-${Date.now()}`);

    // Get agent's knowledge items for RAG filtering
    const knowledgeItems = await agentService.getAgentKnowledgeItemIds(request.agentId);
    const filter = JSON.stringify({
      orgId: request.organizationId,
      libraryItemIds: knowledgeItems
    });
    runtimeContext.set("filter", filter);

    // Select the appropriate agent based on type
    const agentName = this.getAgentNameByType(agentConfig.agentType);
    const agent = mastra.getAgent(agentName);

    if (!agent) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Agent type '${agentConfig.agentType}' not found`,
      });
    }

    // Execute the chat with streaming response using mastra client pattern
    const stream = await agent.stream({
      messages: request.message,
      runtimeContext,
      memory: {
        thread: `agent-${request.agentId}`,
        resource: request.userId,
      },
    });

    return stream;
  }

  private getAgentNameByType(agentType: string): string {
    const agentNameMap: Record<string, string> = {
      support: "supportAgent",
      whatsapp: "whatsappAgent",
    };

    return agentNameMap[agentType] || "supportAgent";
  }
}

export const agentChatService = new AgentChatService();