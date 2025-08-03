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
import { useRouter } from "@tanstack/react-router";
import { ChatMessageArea } from "@/components/ui/chat-message-area";
import { useChat } from "@ai-sdk/react";
import type { ComponentPropsWithoutRef } from "react";
import { env } from "@/config/env";
import { toast } from "sonner";
import { useUserStore } from "@/store/user.store";
import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/integrations/tanstack-query/root-provider";
interface ChatProps extends ComponentPropsWithoutRef<"div"> {
  initialThreadId?: string;
}

export async function Chat({
  className,
  initialThreadId,
  ...props
}: ChatProps) {
  const { threadId: threadIdParam } = useParams({
    from: "/_authenticated/chat/{-$threadId}",
  });
  const user = useUserStore((state) => state.user);
  const resourceId = user?.id!;
  const router = useRouter();
  const [threadId, setThreadId] = useState<string | null>(
    threadIdParam || initialThreadId || null
  );

  const createThread = useMutation(
    trpc.chat.createChat.mutationOptions({
      onSuccess: (data) => {
        setThreadId(data);
      },
      onError: (error) => {
        toast.error(`Failed to create chat thread: ${error.message}`, {
          position: "top-right",
        });
      },
    })
  );

  const { messages, input, handleInputChange, handleSubmit, status, stop } =
    useChat({
      api: `${env.VITE_API_BASE_URL}/api/chat`,
      credentials: "include",

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

      onFinish: async (message, { finishReason }) => {
        // If this is the first message and we don't have a threadId yet,
        // create a new chat and navigate to the dynamic route
      },
    });

  if (!threadId) {
    try {
      const newThreadId = await createThread.mutateAsync();

      setThreadId(newThreadId);

      router.history.replace(`/chat/${newThreadId}`);
    } catch (error) {
      console.error("Failed to create chat thread:", error);
    }
  }

  const handleSubmitMessage = () => {
    if (status === "streaming") {
      return;
    }
    handleSubmit();
  };

  return (
    <div className="flex flex-col h-screen" {...props}>
      <ChatMessageArea scrollButtonAlignment="center" className="flex-1">
        <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8">
              <h2 className="text-2xl font-bold mb-2 text-foreground">
                Chat with AI Assistant
              </h2>
              <p>Start a conversation by typing a message below.</p>
              {threadId && (
                <p className="text-sm mt-2">Thread ID: {threadId}</p>
              )}
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
        <div className="bg-muted/30 rounded-t-lg pt-1 px-1 max-w-3xl w-full mx-2">
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
