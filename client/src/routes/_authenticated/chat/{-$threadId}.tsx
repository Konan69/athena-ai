import {
  createFileRoute,
  Link,
  notFound,
  redirect,
} from "@tanstack/react-router";
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
import { useRef, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/integrations/tanstack-query/root-provider";
import { TRPCClientError } from "@trpc/client";

export const Route = createFileRoute("/_authenticated/chat/{-$threadId}")({
  component: ChatPage,
  loader: async ({ context, params }) => {
    if (!params.threadId) {
      console.log("returning empty array");
      return { uiMessages: [] };
    }
    const trpc = context.trpc;
    const qc = context.queryClient;

    try {
      const data = await qc.fetchQuery(
        trpc.chat.getChatMessages.queryOptions({
          threadId: params.threadId,
        })
      );

      return { uiMessages: data.uiMessages };
    } catch (error) {
      // Handle different error types differently
      if (error instanceof TRPCClientError) {
        if (
          error.message.includes("not found") ||
          error.message.includes("404")
        ) {
          throw notFound();
        }

        if (
          error.message.includes("unauthorized") ||
          error.message.includes("401")
        ) {
          throw redirect({ to: "/login" });
        }

        if (
          error.message.includes("forbidden") ||
          error.message.includes("403")
        ) {
          throw new Error("Forbidden");
        }
      }

      // For other errors, let errorComponent handle it
      throw error;
    }
  },
  errorComponent: ({ error }) => (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <div className="flex gap-2">
        <button
          // onClick={retry}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
        <Link to="/" className="px-4 py-2 bg-gray-500 text-white rounded">
          Back to Chat
        </Link>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold mb-4">Chat Not Found</h2>
      <Link to="/" className="px-4 py-2 bg-blue-500 text-white rounded">
        Back to Chat
      </Link>
    </div>
  ),
  pendingComponent: () => <ChatPending />,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  return <Chat threadId={threadId} />;
}

function ChatPending() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold mb-4">Loading...</h2>
    </div>
  );
}

export function Chat({ ...props }: { threadId: string | undefined }) {
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    props.threadId
  );
  const [isCreatingAndSending, setIsCreatingAndSending] = useState(false);
  const { uiMessages } = Route.useLoaderData();

  // Store the message that needs to be sent after thread creation
  const pendingMessageRef = useRef<string>("");
  const chatSubmitRef = useRef<(() => void) | null>(null);

  const {
    mutate: createThread,
    isPending: isCreatingThread,
    isError,
  } = useMutation(
    trpc.chat.createChat.mutationOptions({
      onSuccess: (newThread) => {
        const newUrl = `/chat/${newThread.id}`;
        window.history.replaceState(null, "", newUrl);

        setCurrentThreadId(newThread.id);
        // Now trigger the chat submission with the new thread ID
        if (pendingMessageRef.current && chatSubmitRef.current) {
          // The useChat hook will now have the correct threadId
          setTimeout(() => {
            chatSubmitRef.current?.();
            pendingMessageRef.current = "";
            setIsCreatingAndSending(false);
          }, 0);
        }
      },
      onError: (error) => {
        toast.error(`Failed to create chat thread: ${error.message}`, {
          position: "top-right",
        });
        pendingMessageRef.current = "";
        setIsCreatingAndSending(false);
      },
    })
  );

  const { messages, input, handleInputChange, handleSubmit, status, stop } =
    useChat({
      api: `${env.VITE_API_BASE_URL}/api/chat`,
      credentials: "include",
      initialMessages: uiMessages,

      // Configure to send only the latest message along with threadId and resourceId
      experimental_prepareRequestBody: (request) => {
        // Ensure messages array is not empty and get the last message
        const lastMessage =
          request.messages.length > 0
            ? request.messages[request.messages.length - 1]
            : null;

        // Use the current thread ID (which gets updated after thread creation)
        const activeThreadId = currentThreadId;

        // Return the structured body for API route
        return {
          message: lastMessage, // Send only the most recent message content/role. Mastra handles msg history
          threadId: activeThreadId,
        };
      },

      onFinish: async (message, { finishReason }) => {},
    });

  // Store handleSubmit in ref so we can access it in mutation callbacks
  chatSubmitRef.current = handleSubmit;

  const handleSubmitMessage = () => {
    if (status === "streaming" || isCreatingThread || isCreatingAndSending) {
      return;
    }

    if (!currentThreadId) {
      // Store the current input as pending message and show optimistic UI
      pendingMessageRef.current = input;
      setIsCreatingAndSending(true);
      createThread();
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen" {...props}>
      <ChatMessageArea scrollButtonAlignment="center" className="flex-1">
        <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
          {messages.length === 0 && !isCreatingAndSending ? (
            <div className="text-center text-muted-foreground mt-8">
              <h2 className="text-2xl font-bold mb-2 text-foreground">
                Chat with AI Assistant
              </h2>
              <p>Start a conversation by typing a message below.</p>
              {currentThreadId && (
                <p className="text-sm mt-2">Thread ID: {currentThreadId}</p>
              )}
            </div>
          ) : (
            <>
              {/* Show optimistic message when creating thread and sending */}
              {isCreatingAndSending && pendingMessageRef.current && (
                <ChatMessage
                  id="pending-message"
                  variant="bubble"
                  type="outgoing"
                >
                  <ChatMessageContent content={pendingMessageRef.current} />
                </ChatMessage>
              )}

              {messages.map((message) => {
                if (message.role !== "user") {
                  if (isError || status === "error") {
                    return (
                      <ChatMessage key={message.id} id={message.id}>
                        <ChatMessageAvatar />
                        <ChatMessageContent
                          content={
                            message.content ||
                            "An error occurred while generating the AI response."
                          }
                          className="text-destructive"
                        />
                      </ChatMessage>
                    );
                  }

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
              })}
            </>
          )}
        </div>
      </ChatMessageArea>
      <div className="pt-2 flex justify-center">
        <div className="bg-muted/30 rounded-t-lg pt-1 px-1 max-w-3xl w-full mx-2">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmitMessage}
            loading={status === "streaming" || isCreatingThread}
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
