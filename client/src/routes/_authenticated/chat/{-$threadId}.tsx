import { createFileRoute, Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { LoaderFive } from "@/components/ui/loader";
import { ErrorState } from "@/components/ui/error-state";
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
import { Response } from "@/components/ai-elements/response";
import { Actions, Action } from "@/components/ai-elements/actions";
import { RefreshCcw as RefreshCcwIcon, Copy as CopyIcon } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { env } from "@/config/env";
import { toast } from "sonner";
import { useEffect, useRef, useState, useMemo } from "react";
import { useQueryErrorResetBoundary, useQuery } from "@tanstack/react-query";
import { trpc, queryClient } from "@/integrations/tanstack-query/root-provider";

import { nanoid } from "nanoid";
import {
  ClaudeChatInput,
  type FileWithPreview,
  type PastedContent,
} from "@/components/claude/claude-input";
import { AVAILABLE_AGENTS } from "@/types/agents";
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

  const [isCreatingAndSending, setIsCreatingAndSending] = useState(false);
  const firstMessageSubmittedRef = useRef(false);

  const generatedIdRef = useRef<string>(nanoid());
  const effectiveThreadId = threadId ?? generatedIdRef.current;

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
    enabled: !!threadId,
    placeholderData: (prev) => prev,
  });

  const { messages, input, handleSubmit, status, stop, setInput, append } =
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
          agentId: extraPayloadRef.current.agentId,
          extras: {
            pastedContents: extraPayloadRef.current.pastedContents ?? [],
            fileTexts: extraPayloadRef.current.fileTexts ?? [],
          },
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

  const handleSubmitMessage = async (
    composedInput: string,
    extrasOnly: boolean
  ) => {
    // Prefer append to bypass handleSubmit's internal empty-input guard
    const contentToSend = composedInput ?? "";

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
      await append({ role: "user", content: contentToSend });
      setInput("");
      router.navigate({
        to: "/chat/{-$threadId}",
        params: { threadId: effectiveThreadId },
        replace: true,
      });
      setIsCreatingAndSending(false);
      return;
    }

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

    // Build extras payload for server
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

    // Only send when there is base text or extras
    if (!base && pastedContents.length === 0 && fileTexts.length === 0) {
      return;
    }

    const extrasOnly =
      !base && (pastedContents.length > 0 || fileTexts.length > 0);
    handleSubmitMessage(base, extrasOnly);
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
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
          {isErrorFetching ? (
            <ErrorState message="Failed to load messages. Please retry." />
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
                {(isCreatingAndSending || status === "submitted") && (
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
