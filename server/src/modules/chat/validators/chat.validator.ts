import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1, "Message content cannot be empty"),
});

export const chatRequestSchema = z.object({
  message: chatMessageSchema.nullable(), // Allow null for initial loads or errors
  // threadId: z.string().min(1, "Thread ID is required"),
  // resourceId: z.string().min(1, "Resource ID is required").default("chat"),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
