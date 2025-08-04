import { zValidator } from "@hono/zod-validator";
import { chatRequestSchema } from "../validators";
import { chatService } from "../chat.service";
import { createApp } from "../../../lib/factory";
import { stream } from "hono/streaming";

export const validateChatRequest = zValidator("json", chatRequestSchema);

const chatRouter = createApp();

chatRouter.post("/", validateChatRequest, async (c) => {
  try {
    const body = c.req.valid("json");
    const resourceId = c.var.user?.id;
    const request = {
      ...body,
      resourceId,
    };
    const result = await chatService.processChat(request);

    c.status(200);
    c.header("X-Vercel-AI-Data-Stream", "v1");
    c.header("Content-Type", "text/plain; charset=utf-8");

    return stream(c, (stream) => stream.pipe(result.toDataStream()));
  } catch (error) {
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
