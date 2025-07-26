import { zValidator } from "@hono/zod-validator";
import { chatRequestSchema } from "./validators";
import { chatService } from "./chat.service";
import { stream } from "hono/streaming";
import { app } from "@/src/server";

// Validation middleware
export const validateChatRequest = zValidator("json", chatRequestSchema);

// Chat handler
const chatRouter = app.post("/", validateChatRequest, async (c) => {
  try {
    const body = c.req.valid("json");
    const result = await chatService.processChat(body);

    c.header("X-Vercel-AI-Data-Stream", "v1");
    c.header("Content-Type", "text/plain; charset=utf-8");

    stream(c, (stream) => stream.pipe(result.toDataStream()));
  } catch (error) {
    console.error("Chat error:", error);

    // Handle specific error cases
    if (error instanceof Error && error.message === "Missing message content") {
      return c.json(
        {
          error: "Bad Request",
          message: "Message content is required",
        },
        400
      );
    }
  }
});

export default chatRouter;
