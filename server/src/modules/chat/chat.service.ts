import { and, desc, eq, or, isNull } from "drizzle-orm";
import db from "../../db";
import { mastraThreads, mastraMessages } from "../../db/schemas";
import { mastra } from "../../config/mastra";
import { ChatRequest } from "./validators";
import { composeUserMessage } from "./utils/compose";
import { memory } from "../../config/mastra";
import { ServiceErrors } from "../../lib/trpc-errors";
import {
  CreateChatInput,
  GetChatsInput,
  GetChatMessagesInput,
  RenameChatInput,
  DeleteChatInput,
} from "./validators/chatValidator";

export class ChatService {
  async processChat(request: ChatRequest & { resourceId: string; organizationId: string }) {
    const { message, threadId, resourceId, organizationId, extras, runtimeContext, agentId } = request;

    const effectiveMessage = composeUserMessage(message, extras);

    // Get the agent from Mastra using the requested agentId
    const agent = mastra.getAgent(agentId);
    if (!agent) {
      throw ServiceErrors.notFound(`Agent '${agentId}'`);
    }

    // Process with memory using the single message content
    // Mastra will create the thread automatically if it doesn't exist
    const stream = await agent.stream({
      messages: effectiveMessage.content,
      runtimeContext,
      memory: {
        thread: threadId,
        resource: resourceId!,
      },
    });



    db
      .update(mastraThreads)
      .set({
        organizationId: organizationId,
      })
      .where(eq(mastraThreads.id, threadId));

    return stream;
  }




  async getChatMessages(input: GetChatMessagesInput) {
    // Single query: verify thread ownership and set orgId if missing
    // Uses CASE to conditionally update organizationId in one atomic operation
    const thread = await db
      .select({
        id: mastraThreads.id,
        organizationId: mastraThreads.organizationId,
        resourceId: mastraThreads.resourceId,
      })
      .from(mastraThreads)
      .where(
        and(
          eq(mastraThreads.id, input.threadId),
          eq(mastraThreads.resourceId, input.userId),
          // Allow access if: orgId matches OR orgId is null (will be set below)
          or(
            eq(mastraThreads.organizationId, input.organizationId),
            isNull(mastraThreads.organizationId)
          )
        )
      )
      .limit(1);

    if (!thread[0]) {
      throw ServiceErrors.notFound("Thread");
    }

    const currentThread = thread[0]

    // If organizationId is null, update it atomically
    if (!currentThread.organizationId) {
      await db
        .update(mastraThreads)
        .set({ organizationId: input.organizationId })
        .where(
          and(
            eq(mastraThreads.id, input.threadId),
            isNull(mastraThreads.organizationId) // Prevent race conditions
          )
        );
    }

    const messages = await memory.query({
      threadId: input.threadId,
      resourceId: input.userId,
    });
    return messages;
  }


  async getChats(input: GetChatsInput) {
    try {
      // First, bulk update any threads missing organizationId for this user
      // await db
      //   .update(mastraThreads)
      //   .set({ organizationId: input.organizationId })
      //   .where(
      //     and(
      //       eq(mastraThreads.resourceId, input.userId),
      //       isNull(mastraThreads.organizationId)
      //     )
      //   );

      // fetch all threads for this user and organization in a single query
      const chats = await db
        .select()
        .from(mastraThreads)
        .where(
          and(
            eq(mastraThreads.resourceId, input.userId),
            eq(mastraThreads.organizationId, input.organizationId)
          )
        )
        .orderBy(desc(mastraThreads.createdAt));

      return chats;
    } catch (error) {
      console.error("Failed to get chats:", error);
      throw ServiceErrors.internal("Failed to get chats");
    }
  }


  async renameChat(input: RenameChatInput) {

    const now = new Date().toISOString();
    const updated = await db
      .update(mastraThreads)
      .set({
        title: input.title,
        updatedAt: now,
        updatedAtZ: now,
      })
      .where(
        and(
          eq(mastraThreads.id, input.threadId),
          eq(mastraThreads.resourceId, input.userId),
          eq(mastraThreads.organizationId, input.organizationId)
        )
      )
      .returning();

    if (!updated.length) {
      throw ServiceErrors.notFound("Thread");
    }
    return updated[0];
  }


  async deleteChat(input: DeleteChatInput) {

    // Delete related messages first
    await db
      .delete(mastraMessages)
      .where(eq(mastraMessages.threadId, input.threadId));

    // Delete the thread (scoped to user and organization)
    const deleted = await db
      .delete(mastraThreads)
      .where(
        and(
          eq(mastraThreads.id, input.threadId),
          eq(mastraThreads.resourceId, input.userId),
          eq(mastraThreads.organizationId, input.organizationId)
        )
      )
      .returning({ id: mastraThreads.id });

    if (!deleted.length) {
      throw ServiceErrors.notFound("Thread");
    }

    const first = deleted[0]!;
    return { success: true, id: first.id } as const;
  }

}

export const chatService = new ChatService();
