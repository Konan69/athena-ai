import { z } from "zod";
import { MastraRuntimeContext } from "../../../types";
import { RuntimeContext } from "@mastra/core/di";
import { AgentIds } from "@/src/types/agents";

export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const chatRequestSchema = z.object({
  message: chatMessageSchema.nullable(), // Allow null for initial loads or errors
  threadId: z.string().min(1, "Thread ID is required"),
  agentId: z.enum(AgentIds),
  extras: z
    .object({
      pastedContents: z.array(z.string()).optional(),
      fileTexts: z
        .array(
          z.object({
            name: z.string(),
            text: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema> & {
  runtimeContext: RuntimeContext<MastraRuntimeContext>
};

// Service method input schemas
export const createChatInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
});

export const getChatsInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
});

export const getChatMessagesInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
  threadId: z.string().min(1, "Thread ID is required"),
});

export const renameChatInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
  threadId: z.string().min(1, "Thread ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
});

export const deleteChatInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
  threadId: z.string().min(1, "Thread ID is required"),
});

// Export types
export type CreateChatInput = z.infer<typeof createChatInputSchema>;
export type GetChatsInput = z.infer<typeof getChatsInputSchema>;
export type GetChatMessagesInput = z.infer<typeof getChatMessagesInputSchema>;
export type RenameChatInput = z.infer<typeof renameChatInputSchema>;
export type DeleteChatInput = z.infer<typeof deleteChatInputSchema>;
