import { Express } from "express";
import { chatRouter } from "./chat";
import { persistenceRouter } from "./persistence";

/**
 * Registers all module routers onto the given Express application.
 */
export function registerModuleRouters(app: Express) {
  app.use(chatRouter);
  app.use(persistenceRouter);
  // Add additional module routers here as they are implemented.
}
