import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { agentChatService } from "../agent-chat.service";
import { createApp } from "../../../lib/factory";

const agentChatSchema = z.object({
  agentId: z.string(),
  message: z.string().min(1),
});

const validateAgentChatRequest = zValidator("json", agentChatSchema);

const agentChatRouter = createApp();

agentChatRouter.post("/", validateAgentChatRequest, async (c) => {
  try {
    const body = c.req.valid("json");
    const userId = c.var.user?.id;
    const orgId = c.var.activeOrganizationId;

    if (!userId || !orgId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const request = {
      ...body,
      organizationId: orgId,
      userId,
    };

    const result = await agentChatService.executeAgentChat(request);

    // Extract the response body from the stream
    return new Response(result.body, {
      status: 200,
      headers: {
        "X-Vercel-AI-Data-Stream": "v1",
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Agent chat error:", error);
    if (error instanceof Error) {
      return c.json(
        {
          error: "Internal Server Error",
          message: error.message,
        },
        500
      );
    }
    return c.json(
      {
        error: "Internal Server Error",
        message: "Unknown error occurred",
      },
      500
    );
  }
});

export default agentChatRouter;