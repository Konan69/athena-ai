import { zValidator } from "@hono/zod-validator";
import { chatRequestSchema } from "../validators";
import { chatService } from "../chat.service";
import { createApp } from "../../../lib/factory";

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

    // Set the headers
    c.header("X-Vercel-AI-Data-Stream", "v1");
    c.header("Content-Type", "text/plain; charset=utf-8");

    // Return the response body directly
    return new Response(result.body, {
      status: 200,
      headers: {
        "X-Vercel-AI-Data-Stream": "v1",
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
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
