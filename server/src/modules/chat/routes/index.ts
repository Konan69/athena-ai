import { zValidator } from "@hono/zod-validator";
import { chatRequestSchema } from "../validators";
import { chatService } from "../chat.service";
import { createApp, createRuntimeContext } from "../../../lib/factory";


export const validateChatRequest = zValidator("json", chatRequestSchema);

const chatRouter = createApp();

chatRouter.post("/", validateChatRequest, async (c) => {
  try {
    const body = c.req.valid("json");
    const runtimeContext = createRuntimeContext();
    const resourceId = c.var.user?.id;
    const orgId = c.var.activeOrganizationId;
    runtimeContext.set("resourceId", resourceId);
    runtimeContext.set("sessionId", c.var.session.id);
    // Add orgId filter for vector queries to ensure tenant isolation
    // Todo: create filters for user made agents
    runtimeContext.set("filter", JSON.stringify({ orgId }));
    const request = {
      ...body,
      organizationId: orgId!,
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
