import { and, desc, eq } from "drizzle-orm";
import db from "../../db";
import { mastraThreads, mastraMessages } from "../../db/schemas";
import { mastra } from "../../config/mastra";
import { ChatRequest } from "./validators";
import { composeUserMessage } from "./utils/compose";
import { memory } from "../../config/mastra";
import { HTTPException } from "hono/http-exception";

export class ChatService {
  async processChat(request: ChatRequest) {
    const { message, threadId, resourceId, extras, runtimeContext } = request;

    const effectiveMessage = composeUserMessage(message, extras);


    // Handle cases where message might be null (e.g., initial load or error)
    if (!effectiveMessage) {
      throw new HTTPException(400, { message: "Missing message content" });
    }

    // Get the agent from Mastra
    const agent = mastra.getAgent("athenaAI");
    if (!agent) {
      throw new HTTPException(500, { message: "Agent not found" });
    }

    // Process with memory using the single message content
    const stream = await agent.stream({
      messages: effectiveMessage.content,
      runtimeContext,
      memory: {
        thread: threadId,
        resource: resourceId!,
      },
    });

    return stream;
  }

  async createChat(userId: string) {
    const thread = await memory.createThread({
      resourceId: userId,
    });

    return {
      id: thread.id,
      title: thread.title,
      metadata: thread.metadata,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      createdAtZ: thread.createdAt.toISOString(),
      updatedAtZ: thread.updatedAt?.toISOString(),
    };
  }

  async getChats(userId: string) {
    const chats = await memory.getThreadsByResourceId({
      resourceId: userId,
    });

    return chats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getChatMessages(userId: string, threadId: string) {
    const messages = await memory.query({
      threadId,
      resourceId: userId,
    });
    return messages;
  }

  async getChatsDrizzle(userId: string) {
    const chats = await db
      .select()
      .from(mastraThreads)
      .where(eq(mastraThreads.resourceId, userId))
      .orderBy(desc(mastraThreads.createdAt));

    return chats;
  }

  async renameChat(userId: string, threadId: string, title: string) {
    const now = new Date().toISOString();
    const updated = await db
      .update(mastraThreads)
      .set({
        title,
        updatedAt: now,
        updatedAtZ: now,
      })
      .where(
        and(
          eq(mastraThreads.id, threadId),
          eq(mastraThreads.resourceId, userId)
        )
      )
      .returning();

    if (!updated.length) {
      throw new HTTPException(404, { message: "Thread not found" });
    }
    return updated[0];
  }

  async deleteChat(userId: string, threadId: string) {
    // Delete related messages first
    await db
      .delete(mastraMessages)
      .where(eq(mastraMessages.threadId, threadId));

    // Delete the thread (scoped to user)
    const deleted = await db
      .delete(mastraThreads)
      .where(
        and(
          eq(mastraThreads.id, threadId),
          eq(mastraThreads.resourceId, userId)
        )
      )
      .returning({ id: mastraThreads.id });

    if (!deleted.length) {
      throw new HTTPException(404, { message: "Thread not found" });
    }

    const first = deleted[0]!;
    return { success: true, id: first.id } as const;
  }
}

export const chatService = new ChatService();
