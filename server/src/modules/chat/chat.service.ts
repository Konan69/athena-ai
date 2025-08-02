import { desc, eq } from "drizzle-orm";
import db from "../../db";
import { mastra as mastraSchema } from "../../db/schemas";
import { mastra } from "../../mastra";
import { ChatRequest } from "./validators";
import { memory } from "../../config/memory";

export class ChatService {
  async processChat(request: ChatRequest) {
    const { message, threadId, resourceId } = request;

    // Handle cases where message might be null (e.g., initial load or error)
    if (!message || !message.content) {
      throw new Error("Missing message content");
    }

    // Get the agent from Mastra
    const agent = mastra.getAgents().athenaAI;
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Process with memory using the single message content
    const stream = await agent.stream(message.content, {
      memory: {
        thread: threadId,
        resource: resourceId!,
      },
      onStepFinish: ({ text, toolCalls, toolResults }) => {
        console.log("Step completed:", { text, toolCalls, toolResults });
      },
      onFinish: ({
        steps,
        text,
        finishReason, // 'complete', 'length', 'tool', etc.
        usage, // token usage statistics
        reasoningDetails, // additional context about the agent's decisions
      }) => {
        console.log("Stream complete:", {
          totalSteps: steps.length,
          reasoningDetails,
          finishReason,
          usage,
        });
      },
    });

    return stream;
  }

  async createChat(userId: string) {
    const thread = await memory.createThread({
      resourceId: userId,
    });

    return thread.id;
  }

  async getChats(userId: string) {
    const chats = await memory.getThreadsByResourceId({
      resourceId: userId,
    });

    return chats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getChatsDrizzle(userId: string) {
    const chats = await db
      .select()
      .from(mastraSchema.mastraThreads)
      .where(eq(mastraSchema.mastraThreads.resourceId, userId))
      .orderBy(desc(mastraSchema.mastraThreads.createdAt));

    return chats;
  }
}

export const chatService = new ChatService();
