import { serve } from "@hono/node-server";
import { requestId } from "hono/request-id";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { logger } from "./config/logger";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";
import { auth } from "./modules/auth";
import { pathTraversalProtection } from "./middleware/security.middleware";
import { createApp } from "./lib/factory";
import { createTRPCContext } from "./trpc/base";
import { appRouter } from "./trpc";
import { modules } from "./modules";
import { authMiddleware } from "./middleware/auth.middleware";

const PORT = env.PORT;

export const app = createApp()
  .use(requestId())
  .use(logger)
  .use(
    "/api/*",
    cors({
      origin: env.CLIENT_URL,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      maxAge: 600,
      credentials: true,
    })
  )
  .use(pathTraversalProtection)
  .get("/health", (c) => {
    return c.json({ status: "ok" });
  })
  .on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
  })
  .use(authMiddleware);
//register authenticated routes
const routes = modules.map((m) => {
  return app.route(m.path, m.router);
});
routes;
app
  .use(
    "/trpc/*",
    cors({
      origin: env.CLIENT_URL,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      maxAge: 600,
      credentials: true,
    }),
    trpcServer({
      router: appRouter,
      createContext: createTRPCContext,
    })
  )
  .use(errorHandler);

console.log(`Server is running on port http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: parseInt(PORT),
});
