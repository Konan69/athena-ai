"use client";
import {
  ChatInput,
  ChatInputSubmit,
  ChatInputTextArea,
} from "@/components/ui/chat-input";
import {
  ChatMessage,
  ChatMessageAvatar,
  ChatMessageContent,
} from "@/components/ui/chat-message";
import { ChatMessageArea } from "@/components/ui/chat-message-area";
import { useChat } from "@ai-sdk/react";
import type { ComponentPropsWithoutRef } from "react";
import { env } from "@/config/env";
import { useMemo } from "react";
export function Chat({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  const threadId = useMemo(
    () => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    []
  );
  const resourceId = "chat";

  const { messages, input, handleInputChange, handleSubmit, status, stop } =
    useChat({
      api: `${env.VITE_API_BASE_URL}/api/chat`,
      // Configure to send only the latest message along with threadId and resourceId
      experimental_prepareRequestBody: (request) => {
        // Ensure messages array is not empty and get the last message
        const lastMessage =
          request.messages.length > 0
            ? request.messages[request.messages.length - 1]
            : null;

        // Return the structured body for your API route
        return {
          message: lastMessage, // Send only the most recent message content/role
          threadId,
          resourceId,
        };
      },
      onFinish: () => {
        //console.log("onFinish", message, completion);
      },
    });

  const handleSubmitMessage = () => {
    if (status === "streaming") {
      return;
    }
    handleSubmit();
  };

  return (
    <div className="flex-1 flex flex-col h-full" {...props}>
      <ChatMessageArea scrollButtonAlignment="center" className="flex-1">
        <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8">
              <h2 className="text-2xl font-bold mb-2 text-foreground">
                Chat with AI Assistant
              </h2>
              <p>Start a conversation by typing a message below.</p>
              <p className="text-sm mt-2 text-muted-foreground">
                Thread ID: {threadId}
              </p>
            </div>
          ) : (
            messages.map((message) => {
              if (message.role !== "user") {
                return (
                  <ChatMessage key={message.id} id={message.id}>
                    <ChatMessageAvatar />
                    <ChatMessageContent content={message.content} />
                  </ChatMessage>
                );
              }
              return (
                <ChatMessage
                  key={message.id}
                  id={message.id}
                  variant="bubble"
                  type="outgoing"
                >
                  <ChatMessageContent content={message.content} />
                </ChatMessage>
              );
            })
          )}
        </div>
      </ChatMessageArea>
      <div className="pt-2 flex justify-center">
        <div className="bg-muted/30 rounded-t-lg pt-2 px-2 max-w-3xl w-full mx-2">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmitMessage}
            loading={status === "streaming"}
            onStop={stop}
            className="w-full"
          >
            <ChatInputTextArea placeholder="Type your message..." />
            <ChatInputSubmit />
          </ChatInput>
        </div>
      </div>
    </div>
  );
}
