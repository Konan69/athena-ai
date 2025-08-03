import { createFileRoute } from "@tanstack/react-router";
import { Chat } from "@/components/chat";

export const Route = createFileRoute("/_authenticated/chat/{-$threadId}")({
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  return <Chat initialThreadId={threadId} />;
}
