import { UserModelMessage } from "../validators/chatValidator";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: UserModelMessage | null;
  threadId: string;
    resourceId: string;
  }
