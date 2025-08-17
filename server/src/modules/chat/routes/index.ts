import { zValidator } from "@hono/zod-validator";
import { chatRequestSchema } from "../validators";
import { chatService } from "../chat.service";
import { createApp, createRuntimeContext } from "../../../lib/factory";
import { getIndexName } from "@/src/lib/utils";

export const validateChatRequest = zValidator("json", chatRequestSchema);

const chatRouter = createApp();

chatRouter.post("/", validateChatRequest, async (c) => {
  try {
    const body = c.req.valid("json");
    const runtimeContext = createRuntimeContext();
    const resourceId = c.var.user?.id;
    runtimeContext.set("resourceId", resourceId); // Todo change to org id 
    runtimeContext.set("sessionId", c.var.session.id);
    runtimeContext.set("indexName", getIndexName(resourceId));
    const request = {
      ...body,
      resourceId,
      runtimeContext,
    };


    const result = await chatService.processChat(request);


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
