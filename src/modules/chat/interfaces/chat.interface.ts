export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: ChatMessage | null;
  threadId: string;
  resourceId: string;
}

export interface StreamingChatResponse {
  stream: AsyncIterable<string>;
}
