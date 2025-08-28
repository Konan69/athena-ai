import { createFileRoute, Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { LoaderFive } from "@/components/ui/loader";
import { ErrorState } from "@/components/ui/error-state";
import { useMutation } from "@tanstack/react-query";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/components/ai-elements/message";
import { useUserStore } from "@/store/user.store";
import { useChatStore } from "@/store/chat.store";
import { Response } from "@/components/ai-elements/response";
import { Actions, Action } from "@/components/ai-elements/actions";
import { RefreshCcw as RefreshCcwIcon, Copy as CopyIcon } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { env } from "@/config/env";
import { toast } from "sonner";
import { useEffect, useRef, useMemo } from "react";
import { useQueryErrorResetBoundary, useQuery } from "@tanstack/react-query";
import { trpc, queryClient } from "@/integrations/tanstack-query/root-provider";

import { nanoid } from "nanoid";
import {
  ClaudeChatInput,
  type FileWithPreview,
  type PastedContent,
} from "@/components/claude/claude-input";
import { AVAILABLE_AGENTS } from "@/types/agents";
import { useSessionStore } from "@/store/session.store";
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
  const user = useUserStore((s) => s.user);
  const chatStore = useChatStore();

  const generatedIdRef = useRef<string>(nanoid());
  const effectiveThreadId = threadId ?? generatedIdRef.current;

  // For existing threads, initialize them immediately
  if (threadId) {
    chatStore.initializeExistingThread(threadId);
  }

  // Get thread readiness state from store
  const threadReady = chatStore.threadReady[effectiveThreadId] || false;
  const isCreatingAndSending = chatStore.isCreatingAndSending;

  const chatSubmitRef = useRef<(() => void) | null>(null);
  const extraPayloadRef = useRef<{
    pastedContents?: string[];
    fileTexts?: { name: string; text: string }[];
    agentId?: string;
  }>({});

  const {
    data,
    isLoading,
    isError: isErrorFetching,
  } = useQuery({
    ...trpc.chat.getChatMessages.queryOptions({
      threadId: effectiveThreadId ?? "",
    }),
    enabled: !!threadId && threadReady && !isCreatingAndSending, // Only fetch when thread exists, is ready, and not creating
    placeholderData: (prev) => prev,
    retry: (failureCount) => {
      // Retry up to 3 times with exponential backoff to handle race conditions
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const {
    messages,
    input,
    handleSubmit,
    status,
    stop,
    setInput,
    append,
    error,
  } = useChat({
    id: effectiveThreadId,
    api: `${env.VITE_API_BASE_URL}/api/chat`,
    credentials: "include",
    initialMessages: data?.uiMessages ?? [],

    experimental_prepareRequestBody: (request) => {
      const lastMessage =
        request.messages.length > 0
          ? request.messages[request.messages.length - 1]
          : null;

      const activeThreadId = effectiveThreadId;

      return {
        message: lastMessage,
        threadId: activeThreadId,
        agentId: extraPayloadRef.current.agentId,
        extras: {
          pastedContents: extraPayloadRef.current.pastedContents ?? [],
          fileTexts: extraPayloadRef.current.fileTexts ?? [],
        },
      };
    },

    onFinish: async () => {
      // For new threads, give Mastra extra time to persist the thread
      if (!threadId) {
        await new Promise((resolve) => setTimeout(resolve, 3500));
      }

      // Mark thread as ready for message fetching
      chatStore.setThreadReady(effectiveThreadId, true);

      // Reset creating state when streaming is complete
      chatStore.setIsCreatingAndSending(false);

      // Refresh the sidebar to show the new thread with generated title
      await queryClient.invalidateQueries({
        queryKey: trpc.chat.getChats.queryKey(),
      });
    },

    onError: () => {
      // Reset creating state on error
      chatStore.setIsCreatingAndSending(false);
    },
  });

  chatSubmitRef.current = handleSubmit;

  const handleSubmitMessage = async (
    composedInput: string,
    extrasOnly: boolean
  ) => {
    const contentToSend = composedInput ?? "";

    if (!threadId) {
      // First message: Let Mastra create the thread automatically with title generation
      chatStore.setIsCreatingAndSending(true);

      try {
        const newThreadId = effectiveThreadId;

        // Navigate to the thread URL first for better UX
        router.navigate({
          to: "/chat/{-$threadId}",
          params: { threadId: newThreadId },
          replace: true,
        });

        // Send the message - Mastra will create the thread automatically
        await append({ role: "user", content: contentToSend });
        setInput("");
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message. Please try again.");
      } finally {
        chatStore.setIsCreatingAndSending(false);
      }
      return;
    }

    // Existing thread - just append message
    await append({ role: "user", content: contentToSend });
    setInput("");
  };

  const handleClaudeSend = (
    message: string,
    files: FileWithPreview[],
    pasted: PastedContent[],
    selectedAgent: string
  ) => {
    const base = message.trim();

    const pastedContents = (pasted || []).map((p) => p.content);
    const fileTexts = (files || [])
      .map((f) => {
        const text = f.textContent?.trim();
        if (!text) return null;
        return { name: f.file.name, text };
      })
      .filter(Boolean) as { name: string; text: string }[];

    extraPayloadRef.current = {
      pastedContents,
      fileTexts,
      agentId: selectedAgent,
    };

    if (!base && pastedContents.length === 0 && fileTexts.length === 0) {
      return;
    }

    const extrasOnly =
      !base && (pastedContents.length > 0 || fileTexts.length > 0);
    handleSubmitMessage(base, extrasOnly);
  };

  const showSkeleton = Boolean(
    threadId &&
      threadReady && // Only show skeleton when thread is ready
      isLoading &&
      messages.length === 0 &&
      status !== "streaming"
  );

  // Show loading state when creating and sending first message or when message is being processed
  const shouldShowLoading =
    isCreatingAndSending || (status === "submitted" && !error);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
          {isErrorFetching || error ? (
            <ErrorState
              message={
                error?.message || "Failed to load messages. Please retry."
              }
            />
          ) : showSkeleton ? (
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
            <Conversation className="relative w-full">
              <ConversationContent>
                {messages
                  .filter(
                    (m) =>
                      !(
                        m.role === "user" &&
                        (!m.content || m.content.trim() === "")
                      )
                  )
                  .map((message, messageIndex) => {
                    const isLastMessage = messageIndex === messages.length - 1;
                    return (
                      <div key={message.id}>
                        <Message
                          from={message.role as "user" | "assistant" | "system"}
                        >
                          <MessageContent>
                            {message.role === "assistant" ? (
                              <Response>{message.content}</Response>
                            ) : (
                              message.content
                            )}
                          </MessageContent>
                          {message.role === "user" && (
                            <MessageAvatar
                              src={user?.image || ""}
                              name={user?.name}
                            />
                          )}
                        </Message>
                        {message.role === "assistant" && isLastMessage && (
                          <Actions className="mt-[-25px]">
                            <Action
                              onClick={() => {
                                /* TODO: regenerate */
                              }}
                              label="Retry"
                            >
                              <RefreshCcwIcon className="size-3" />
                            </Action>
                            <Action
                              onClick={() =>
                                navigator.clipboard.writeText(message.content)
                              }
                              label="Copy"
                            >
                              <CopyIcon className="size-3" />
                            </Action>
                          </Actions>
                        )}
                      </div>
                    );
                  })}
                {shouldShowLoading && (
                  <Message from="assistant">
                    <MessageContent>
                      <div className="flex justify-start py-2">
                        <LoaderFive text="Thinking…" />
                      </div>
                    </MessageContent>
                  </Message>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 mb-6">
        <ClaudeChatInput
          onSendMessage={handleClaudeSend}
          agents={AVAILABLE_AGENTS}
        />
      </div>
    </div>
  );
}
