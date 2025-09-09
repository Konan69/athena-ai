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
import { useEffect, useRef, useMemo, useState, Fragment } from "react";
import { useQueryErrorResetBoundary, useQuery } from "@tanstack/react-query";
import { trpc, queryClient } from "@/integrations/tanstack-query/root-provider";

import { nanoid } from "nanoid";
import {
  ClaudeChatInput,
  type FileWithPreview,
  type PastedContent,
} from "@/components/claude/claude-input";
import { AVAILABLE_AGENTS } from "@/types/agents";

import { EmptyChatState } from "@/components/ai-elements/empty-chat-state";
import { DefaultChatTransport } from "ai";
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

  // Track pending navigation for new threads
  const pendingNavigationRef = useRef<string | null>(null);

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
    placeholderData: (prev:any) => prev,
    retry: (failureCount:any) => {
      // Retry up to 3 times with exponential backoff to handle race conditions
      return failureCount < 3;
    },
    retryDelay: (attemptIndex:any) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const [input, setInput] = useState('');

  const {
    messages,
    setMessages,
    status,
    stop,
    sendMessage,
    regenerate,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: `${env.VITE_API_BASE_URL}/api/chat`,
      credentials: 'include',
      // Only send the last message to the server
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            threadId: effectiveThreadId,
            agentId: extraPayloadRef.current.agentId,
            extras: {
              pastedContents: extraPayloadRef.current.pastedContents ?? [],
              fileTexts: extraPayloadRef.current.fileTexts ?? [],
            },
          }
        };
      }
    }),
    id: effectiveThreadId,
    messages: data,

    onFinish: async () => {
      // For new threads, give Mastra extra time to persist the thread
      if (!threadId) {
        await new Promise((resolve) => setTimeout(resolve, 3500));

        // Navigate to the new thread URL now that message was successfully sent
        if (pendingNavigationRef.current) {
          router.navigate({
            to: "/chat/{-$threadId}",
            params: { threadId: pendingNavigationRef.current },
            replace: true,
          });
          pendingNavigationRef.current = null;
        }
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

    onError: (error) => {
      // Reset creating state on error
      chatStore.setIsCreatingAndSending(false);
      // Clear any pending navigation since we failed
      pendingNavigationRef.current = null;
      // Show error to user
      console.error("Chat error:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    },
  })

  // Synchronize messages when data changes
  useEffect(() => {
    if (data && data.length > 0 && messages.length === 0) {
      setMessages(data);
    }
  }, [data, messages.length, setMessages]);

  const handleSubmitMessage = async (
    composedInput: string,
    extrasOnly: boolean
  ) => {
    const contentToSend = composedInput ?? "";

    if (!threadId) {
      chatStore.setIsCreatingAndSending(true);
      pendingNavigationRef.current = effectiveThreadId;
    }

    console.log(contentToSend, "contentToSend");
    try {
      await sendMessage(
        { text: contentToSend },
        {
          body: {
            threadId: effectiveThreadId,
            agentId: extraPayloadRef.current.agentId,
            extras: {
              pastedContents: extraPayloadRef.current.pastedContents ?? [],
              fileTexts: extraPayloadRef.current.fileTexts ?? [],
            },
          },
        }
      );
      
      setInput("");
    } catch (error) {
      if (threadId) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message. Please try again.");
      }
    }
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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const showSkeleton = Boolean(
    threadId &&
      threadReady && // Only show skeleton when thread is ready
      isLoading &&
      messages.length === 0 &&
      status !== "streaming"
  );

  // Show loading state when creating and sending first message or when message is being processed
  const shouldShowLoading = (status === "submitted" && !error);

  return (
    <div className="flex flex-col h-screen">
      {/* Conversation fills all available space above the input */}
      <div className="flex-1 min-h-0">
        <Conversation className="w-full h-full">
          <ConversationContent className="h-full">
            <div className="max-w-[60%] mx-auto w-full py-2 space-y-4">
              {isErrorFetching || error ? (
                <ErrorState
                  message={
                    error?.message || "Failed to load messages. Please retry."
                  }
                />
              ) : showSkeleton ? (
                <div className="flex items-center justify-center">
                  <div className="w-full space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ) : messages.length === 0 && !isLoading && !isCreatingAndSending ? (

                <EmptyChatState
                  onSuggestionClick={handleSuggestionClick}
                  threadId={threadId}
                />
              ) : (
                <>
                  {messages
                    .map((message, messageIndex) => {
                      return (
                        <div key={message.id} className={`flex gap-3  ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className="flex items-center justify-center">
                            {message.role === "assistant" && (
                            <MessageAvatar
                              src="" // Assistant doesn't need an avatar
                              name="Assistant"
                            />
                          )}
                          </div>
                          <div className="flex-1">
                            {message.parts.map((part, i) => {
                              switch (part.type) {
                                case 'text':
                                  return (
                                    <Fragment key={`${message.id}-${i}`}>
                                      <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                          <Message from={message.role}>
                                            <MessageContent>
                                              <Response>
                                                {part.text}
                                              </Response>
                                            </MessageContent>
                                          </Message>
                                          {message.role === 'assistant' && i === message.parts.length - 1 && (
                                            <Actions className="-mt-6 pl-1">
                                              <Action
                                                onClick={() => regenerate()}
                                                label="Retry"
                                              >
                                                <RefreshCcwIcon className="size-3" />
                                              </Action>
                                              <Action
                                                onClick={() =>
                                                  navigator.clipboard.writeText(part.text)
                                                }
                                                label="Copy"
                                              >
                                                <CopyIcon className="size-3" />
                                              </Action>
                                            </Actions>
                                          )}
                                        </div>
                                      </div>
                                    </Fragment>
                                  );
                              }
                            })}
                          </div>
                          <div className="flex items-center justify-center">
                            {message.role === "user" && (
                              <MessageAvatar
                                src={user?.image || ""}
                                name={user?.name}
                              />
                            )}
                          </div>
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
                </>
              )}
            </div>
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="max-w-4xl mx-auto w-full bg-transparent px-4 mb-8">
        <ClaudeChatInput
          onSendMessage={handleClaudeSend}
          agents={AVAILABLE_AGENTS}
          prefill={input}
          status={status}
          onStop={() => stop()}
        />
      </div>
    </div>
  );
}
