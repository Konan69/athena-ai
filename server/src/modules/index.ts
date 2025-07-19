import { Express } from "express";
import { chatRouter } from "./chat";

/**
 * Registers all module routers onto the given Express application.
 */
export function registerModuleRouters(app: Express) {
  app.use(chatRouter);
  // Add additional module routers here as they are implemented.
}
