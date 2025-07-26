// Initialize Datadog tracer first
// import "./observability/tracer";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { appRouter } from "./config/trpc";
import { trpcServer } from "@hono/trpc-server";
import { logger } from "./config/logger";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";
import { auth } from "./modules/auth";
import { pathTraversalProtection } from "./middleware/security.middleware";

const PORT = env.PORT;
export const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>().use(logger);

// Middleware

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

app.use(
  "/api/*",
  cors({
    origin: env.CLIENT_URL,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    maxAge: 600,
    credentials: true,
  })
);

// TODO: Add typesafety for logger
// app.use(requestLogger);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.use(pathTraversalProtection);

// tRPC middleware
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: () => ({
      logger,
    }),
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Error handling middleware (must be last)
app.use(errorHandler);

console.log(`Server is running on port http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: parseInt(PORT),
});
