import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Skeleton } from "@/components/ui/skeleton";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useChat } from "@ai-sdk/react";
import { env } from "@/config/env";
import { toast } from "sonner";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  useMutation,
  useQueryErrorResetBoundary,
  useQuery,
} from "@tanstack/react-query";
import { trpc, queryClient } from "@/integrations/tanstack-query/root-provider";

import { nanoid } from "nanoid";
export const Route = createFileRoute("/_authenticated/chat/{-$threadId}")({
  component: ChatPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    const queryErrorResetBoundary = useQueryErrorResetBoundary();

    useEffect(() => {
      // Reset the query error boundary
      queryErrorResetBoundary.reset();
    }, [queryErrorResetBoundary]);
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
          <Link to="/" className="px-4 py-2 bg-gray-500 text-white rounded">
            Back to Chat
          </Link>
        </div>
      </div>
    );
  },
  shouldReload: false,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const search = Route.useSearch() as { session?: string };
  // Key only for brand-new chats via `session` search param; existing threads keep instance stable
  const chatIdentity = useMemo(
    () => (threadId ? `thread:${threadId}` : `new:${search?.session ?? "0"}`),
    [threadId, search?.session]
  );
  return <Chat key={chatIdentity} threadId={threadId} />;
}

export function Chat({ threadId }: { threadId: string | undefined }) {
  const router = useRouter();

  const [isCreatingAndSending, setIsCreatingAndSending] = useState(false);
  const firstMessageSubmittedRef = useRef(false);

  const generatedIdRef = useRef<string>(nanoid());
  const effectiveThreadId = threadId ?? generatedIdRef.current;

  const chatSubmitRef = useRef<(() => void) | null>(null);

  const {
    data,
    isLoading,
    isError: isErrorFetching,
  } = useQuery({
    ...trpc.chat.getChatMessages.queryOptions({
      threadId: effectiveThreadId ?? "",
    }),
    enabled: !!threadId,
    placeholderData: (prev) => prev,
  });

  const isError = isErrorFetching;

  const { messages, input, handleInputChange, handleSubmit, status, stop } =
    useChat({
      id: effectiveThreadId, // Single ID for both chat session and server thread
      api: `${env.VITE_API_BASE_URL}/api/chat`,
      credentials: "include",
      initialMessages: data?.uiMessages ?? [],

      // Configure to send only the latest message along with threadId and resourceId
      experimental_prepareRequestBody: (request) => {
        // Ensure messages array is not empty and get the last message
        const lastMessage =
          request.messages.length > 0
            ? request.messages[request.messages.length - 1]
            : null;

        // Use the effective thread ID (generated for new chats)
        const activeThreadId = effectiveThreadId;

        // Return the structured body for API route
        return {
          message: lastMessage,
          threadId: activeThreadId,
        };
      },

      onFinish: async () => {
        if (messages.length > 0) {
          await queryClient.invalidateQueries({
            queryKey: trpc.chat.getChats.queryKey(),
          });
        }
      },
    });

  // Store handleSubmit in ref so we can access it in mutation callbacks
  chatSubmitRef.current = handleSubmit;

  const handleSubmitMessage = () => {
    if (status === "streaming" || isCreatingAndSending) {
      return;
    }

    if (!threadId) {
      // First message in a brand-new chat: send with generated thread id, then navigate
      firstMessageSubmittedRef.current = true;
      // Optimistically prepend to sidebar chats cache with placeholder title
      queryClient.setQueryData(trpc.chat.getChats.queryKey(), (prev: any) => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.find((c: any) => c.id === effectiveThreadId)) return list;
        const nowIso = new Date().toISOString();
        return [
          {
            id: effectiveThreadId,
            resourceId: "",
            title: "New Thread",
            metadata: null,
            createdAt: nowIso,
            updatedAt: nowIso,
            createdAtZ: nowIso,
            updatedAtZ: nowIso,
          },
          ...list,
        ];
      });
      setIsCreatingAndSending(true);
      handleSubmit();
      router.navigate({
        to: "/chat/{-$threadId}",
        params: { threadId: effectiveThreadId },
        replace: true,
      });
      setIsCreatingAndSending(false);
      return;
    }
    handleSubmit();
  };

  // Distinct loading states: show skeleton only for initial fetch of existing chat without messages
  const showSkeleton = Boolean(
    threadId &&
      isLoading &&
      messages.length === 0 &&
      !firstMessageSubmittedRef.current &&
      status !== "streaming"
  );

  return (
    <div className="flex flex-col h-full">
      <ChatMessageArea scrollButtonAlignment="center" className="flex-1">
        <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
          {showSkeleton ? (
            <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : messages.length === 0 && !isCreatingAndSending ? (
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
            <>
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
            loading={status === "streaming" || isCreatingAndSending}
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
