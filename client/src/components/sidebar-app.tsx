"use client";

import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { NavUser } from "@/components/nav-user";
import {
  MessageCircle,
  SquarePen,
  BookOpen,
  QrCode,
  PencilLine,
  Trash2,
  Check,
  X as XIcon,
} from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cursorGlowProps } from "@/lib/utils";
import {
  formatDistanceToNow,
  isAfter,
  subWeeks,
  subMonths,
  parseISO,
} from "date-fns";
import { queryClient, trpc } from "@/integrations/tanstack-query/root-provider";
import { SidebarChatListSkeleton } from "@/components/skeletons/sidebar-chat-list-skeleton";
import { useChatStore } from "@/store/chat.store";

type ChatItem = {
  id: string;
  resourceId: string;
  title: string;
  metadata: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  createdAtZ: string | null;
  updatedAtZ: string | null;
};

type Grouped = {
  recent: ChatItem[];
  lastWeek: ChatItem[];
  lastMonth: ChatItem[];
  previous: ChatItem[];
};

function truncateTitle(title: string) {
  return title.replace(/^"+|"+$/g, "").trim();
}

function groupChats(items: ChatItem[]): Grouped {
  const now = new Date();
  const last7 = subWeeks(now, 1);
  const last30 = subMonths(now, 1);

  const groups: Grouped = {
    recent: [],
    lastWeek: [],
    lastMonth: [],
    previous: [],
  };

  for (const it of items) {
    const d = parseISO(it.updatedAt ?? it.createdAt);
    if (isAfter(d, last7)) {
      groups.recent.push(it);
    } else if (isAfter(d, last30)) {
      groups.lastWeek.push(it);
    } else if (isAfter(d, subMonths(now, 12))) {
      groups.lastMonth.push(it);
    } else {
      groups.previous.push(it);
    }
  }

  return groups;
}

function humanizeDate(iso: string) {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

type ChatListItemProps = {
  chat: ChatItem;
  index: number;
};

const ChatListItem = ({ chat, index }: ChatListItemProps) => {
  const router = useRouter();
  const baseGetChats = trpc.chat.getChats.queryOptions();
  const renameMutation = useMutation({
    ...trpc.chat.renameChat.mutationOptions(),
    onMutate: async (vars: { threadId: string; title: string }) => {
      await queryClient.cancelQueries(baseGetChats);
      const prev = queryClient.getQueryData<ChatItem[]>(baseGetChats.queryKey);
      const now = new Date().toISOString();
      queryClient.setQueryData<ChatItem[]>(
        baseGetChats.queryKey,
        (old) =>
          old?.map((c) =>
            c.id === vars.threadId
              ? { ...c, title: vars.title, updatedAt: now, updatedAtZ: now }
              : c
          ) || old
      );
      // Return type must be void for our mutationOptions typing
      return undefined;
    },
    onError: () => {
      queryClient.invalidateQueries(baseGetChats);
    },
    onSettled: () => {
      queryClient.invalidateQueries(baseGetChats);
    },
  });
  const deleteMutation = useMutation({
    ...trpc.chat.deleteChat.mutationOptions(),
    onMutate: async (vars: { threadId: string }) => {
      await queryClient.cancelQueries(baseGetChats);
      const prev = queryClient.getQueryData<ChatItem[]>(baseGetChats.queryKey);
      queryClient.setQueryData<ChatItem[]>(
        baseGetChats.queryKey,
        (old) => old?.filter((c) => c.id !== vars.threadId) || old
      );
      return undefined;
    },
    onError: () => {
      queryClient.invalidateQueries(baseGetChats);
    },
    onSettled: () => {
      queryClient.invalidateQueries(baseGetChats);
    },
    onSuccess: (_res, vars) => {
      const current = router.state.location;
      if (current.pathname === `/chat/${vars.threadId}`) {
        router.navigate({ to: "/" });
      }
    },
  });

  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(truncateTitle(chat.title || ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commitRename = () => {
    const title = truncateTitle(draftTitle.trim());
    if (!title || title === chat.title) {
      setEditing(false);
      setDraftTitle(truncateTitle(chat.title || ""));
      return;
    }
    renameMutation.mutate({ threadId: chat.id, title });
    setEditing(false);
  };

  return (
    <SidebarMenuItem>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{
          delay: index * 0.02,
          duration: 0.18,
          ease: "easeOut",
        }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="relative"
      >
        <Link
          to="/chat/{-$threadId}"
          params={{ threadId: chat.id }}
          preload="intent"
        >
          <SidebarMenuButton
            {...cursorGlowProps()}
            className="group relative overflow-hidden w-full justify-start rounded-md border border-transparent hover:border-[oklch(0.72_0.25_300_/0.28)] hover:bg-[oklch(0.72_0.25_300_/0.06)] transition-[background-color,border-color,transform] duration-150 will-change-transform pr-20"
            tooltip={humanizeDate(chat.updatedAt || chat.createdAt)}
          >
            <span
              data-glow="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150"
              style={{
                background:
                  "radial-gradient(26px 26px at var(--mx) var(--my), oklch(0.72 0.25 300 / 0.10), transparent 55%)",
              }}
            />
            {editing ? (
              <div className="relative w-full flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") {
                      setEditing(false);
                      setDraftTitle(truncateTitle(chat.title || ""));
                    }
                  }}
                  onBlur={commitRename}
                  className="flex-1 bg-transparent outline-none text-left text-sm"
                />
                <div className="ml-auto flex items-center gap-1 pr-2">
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-foreground/5"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={commitRename}
                    aria-label="Save"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-foreground/5"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setEditing(false);
                      setDraftTitle(truncateTitle(chat.title || ""));
                    }}
                    aria-label="Cancel"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <span className="relative truncate transition-transform duration-150">
                {truncateTitle(chat.title || "Untitled chat")}
              </span>
            )}
          </SidebarMenuButton>
        </Link>

        {/* Hover actions */}
        {!editing && (
          <motion.div
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: hovered ? 0 : 16, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1"
          >
            <button
              type="button"
              className="pointer-events-auto p-1.5 rounded-md hover:bg-[oklch(0.72_0.25_300_/0.10)]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditing(true);
              }}
              aria-label="Rename"
              title="Rename"
            >
              <PencilLine className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="pointer-events-auto p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!window.confirm("Delete this chat? This cannot be undone."))
                  return;
                deleteMutation.mutate({ threadId: chat.id });
              }}
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </SidebarMenuItem>
  );
};

function RetryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="text-destructive mb-2">Failed to load chats.</div>
      <Button variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function SidebarApp({ ...props }: ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const navigate = router.navigate;
  const resetChatState = useChatStore((state) => state.resetChatState);
  const bumpNewNonce = useChatStore((s) => s.bumpNewNonce);

  const handleNewChat = () => {
    resetChatState(); // Reset chat state before navigating
    bumpNewNonce(); // Force distinct route identity for /new
    navigate({
      to: "/chat/{-$threadId}",
      params: { threadId: undefined },
      replace: true,
    });
  };

  const baseGetChats = trpc.chat.getChats.queryOptions();
  const { data, isLoading, error, refetch } = useQuery({
    ...baseGetChats,
    // Keep showing current list during refetches to prevent loading flicker
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  });

  const groups = data
    ? groupChats(data)
    : {
        recent: [],
        lastWeek: [],
        lastMonth: [],
        previous: [],
      };

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="relative before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-60 ">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3">
            <div className="hover-tilt flex h-8 w-8 items-center justify-center rounded-lg bg-[oklch(0.72_0.25_300)] text-white shadow-neon-purple">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Athena AI
            </span>
          </div>
        </div>
        <div className="px-2 py-2">
          <motion.div
            whileHover={{ scale: 1.035 }}
            whileTap={{ scale: 0.985 }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 22,
              mass: 0.7,
            }}
          >
            <Button
              {...cursorGlowProps()}
              onClick={(e) => {
                handleNewChat();
              }}
              className="group relative w-full justify-start overflow-hidden rounded-md border border-[oklch(0.72_0.25_300_/0.20)] bg-[oklch(0.72_0.25_300_/0.07)] text-foreground transition-colors hover:bg-[oklch(0.72_0.25_300_/0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.72_0.25_300_/0.40)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              variant="outline"
              style={{ "--rx": "50%", "--ry": "50%" } as React.CSSProperties}
            >
              {/* minimal noise, very subtle */}
              <span
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "url(/noise.png)",
                  backgroundSize: "96px 96px",
                }}
              />
              {/* single crisp 1px inner stroke for definition */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-px rounded-[calc(theme(borderRadius.md)-2px)]"
                style={{
                  boxShadow: "inset 0 0 0 1px oklch(0.72 0.25 300 / 0.22)",
                }}
              />
              {/* compact cursor-follow glow */}
              <span
                data-glow="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150"
                style={{
                  background:
                    "radial-gradient(40px 40px at var(--mx) var(--my), oklch(0.72 0.25 300 / 0.14), transparent 60%)",
                }}
              />
              <SquarePen className="relative mr-2 h-4 w-4 text-[oklch(0.72_0.25_300)] transition-transform duration-150 group-active:scale-[0.98]" />
              <span className="relative">New chat</span>
            </Button>
          </motion.div>
        </div>
        <div className="px-2 pb-2 relative">
          <Link to="/library">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              <Button
                {...cursorGlowProps()}
                className="group relative w-full justify-start border border-[oklch(0.72_0.25_300_/0.22)] hover:bg-[oklch(0.72_0.25_300_/0.05)] transition-[background-color,transform] duration-150"
                variant="outline"
                style={{ "--rx": "50%", "--ry": "50%" } as React.CSSProperties}
              >
                <span
                  data-glow="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150"
                  style={{
                    background:
                      "radial-gradient(39px 39px at var(--mx) var(--my), oklch(0.72 0.25 300 / 0.12), transparent 60%)",
                  }}
                />
                <BookOpen className="relative mr-2 h-4 w-4 text-foreground/80" />
                <span className="relative transition-transform duration-150">
                  Library
                </span>
              </Button>
            </motion.div>
          </Link>
        </div>
        <div className="px-2 pb-2 relative">
          <Link to="/">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              <Button
                {...cursorGlowProps()}
                className="group relative w-full justify-start border border-[oklch(0.72_0.25_300_/0.22)] hover:bg-[oklch(0.72_0.25_300_/0.05)] transition-[background-color,transform] duration-150"
                variant="outline"
                style={{ "--rx": "50%", "--ry": "50%" } as React.CSSProperties}
              >
                <span
                  data-glow="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150"
                  style={{
                    background:
                      "radial-gradient(39px 39px at var(--mx) var(--my), oklch(0.72 0.25 300 / 0.12), transparent 60%)",
                  }}
                />
                <BookOpen className="relative mr-2 h-4 w-4 text-foreground/80" />
                <span className="relative transition-transform duration-150">
                  APPS
                </span>
              </Button>
            </motion.div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="relative before:pointer-events-none before:absolute before:inset-0 before:opacity-50 ">
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <SidebarChatListSkeleton />
          ) : error ? (
            <RetryError onRetry={refetch} />
          ) : data ? (
            <>
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium tracking-wide text-foreground/80">
                  Recent
                </SidebarGroupLabel>
                <SidebarMenu>
                  <AnimatePresence initial={false}>
                    {groups.recent.map((chat, i) => (
                      <ChatListItem chat={chat} index={i} key={chat.id} />
                    ))}
                  </AnimatePresence>
                </SidebarMenu>
              </SidebarGroup>

              {!!groups.lastWeek.length && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-medium tracking-wide text-foreground/80">
                    Past 7 Days
                  </SidebarGroupLabel>
                  <SidebarMenu>
                    <AnimatePresence initial={false}>
                      {groups.lastWeek.map((chat, i) => (
                        <ChatListItem chat={chat} index={i} key={chat.id} />
                      ))}
                    </AnimatePresence>
                  </SidebarMenu>
                </SidebarGroup>
              )}

              {!!groups.lastMonth.length && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-medium tracking-wide text-foreground/80">
                    Past 30 Days
                  </SidebarGroupLabel>
                  <SidebarMenu>
                    <AnimatePresence initial={false}>
                      {groups.lastMonth.map((chat, i) => (
                        <ChatListItem chat={chat} index={i} key={chat.id} />
                      ))}
                    </AnimatePresence>
                  </SidebarMenu>
                </SidebarGroup>
              )}

              {!!groups.previous.length && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-medium tracking-wide text-foreground/80">
                    Previous
                  </SidebarGroupLabel>
                  <SidebarMenu>
                    <AnimatePresence initial={false}>
                      {groups.previous.map((chat, i) => (
                        <ChatListItem chat={chat} index={i} key={chat.id} />
                      ))}
                    </AnimatePresence>
                  </SidebarMenu>
                </SidebarGroup>
              )}
            </>
          ) : null}
        </div>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter className="relative before:pointer-events-none before:absolute before:inset-0 before:opacity-60">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
