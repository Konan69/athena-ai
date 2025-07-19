import { mastra } from "../../mastra/index";
import { ChatRequest } from "./validators";

export class ChatService {
  async processChat(request: ChatRequest) {
    const { message, threadId, resourceId } = request;

    // Handle cases where message might be null (e.g., initial load or error)
    if (!message || !message.content) {
      throw new Error("Missing message content");
    }

    // Get the agent from Mastra
    const agent = mastra.getAgent("researchAgent");
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Process with memory using the single message content
    const stream = await agent.stream(message.content, {
      memory: {
        thread: threadId,
        resource: resourceId,
      },
      onStepFinish: ({ text, toolCalls, toolResults }) => {
        console.log("Step completed:", { text, toolCalls, toolResults });
      },
      onFinish: ({
        steps,
        text,
        finishReason, // 'complete', 'length', 'tool', etc.
        usage, // token usage statistics
        reasoningDetails, // additional context about the agent's decisions
      }) => {
        console.log("Stream complete:", {
          totalSteps: steps.length,
          reasoningDetails,
          finishReason,
          usage,
        });
      },
    });

    return stream;
  }
}

export const chatService = new ChatService();
