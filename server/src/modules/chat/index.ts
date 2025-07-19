import { Router } from "express";
import { validateChatRequest, chatHandler } from "./chat.controller";

const chatRouter = Router();

// Register chat routes
chatRouter.post("/api/chat", validateChatRequest, chatHandler);

export { chatRouter };
export default chatRouter;
