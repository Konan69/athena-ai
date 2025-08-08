import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const chatRequestSchema = z.object({
  message: chatMessageSchema.nullable(), // Allow null for initial loads or errors
  threadId: z.string().min(1, "Thread ID is required"),
  resourceId: z.string().optional(),
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
export type ChatRequest = z.infer<typeof chatRequestSchema>;
