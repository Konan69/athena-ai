// Initialize Datadog tracer first
// import "./observability/tracer";

import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../config/trpc";
import { logger } from "../config/logger";
import { env } from "../config/env";
import { requestLogger } from "./middleware/logger.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { auth } from "./modules/auth";
import { pathTraversalProtection } from "./middleware/security.middleware";
import { registerModuleRouters } from "./modules";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";

const app = express();
const PORT = env.PORT;

// Middleware
app.use(
  cors({
    origin: env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(pathTraversalProtection);
app.use(requestLogger);

// tRPC middleware
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({
      logger,
    }),
  })
);

// Register module routers
registerModuleRouters(app);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return res.json(session);
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
