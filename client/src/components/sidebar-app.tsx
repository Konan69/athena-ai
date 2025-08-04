"use client";

import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NavUser } from "@/components/nav-user";
import { MessageCircle, SquarePen, BookOpen } from "lucide-react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  formatDistanceToNow,
  isAfter,
  subDays,
  subWeeks,
  subMonths,
  parseISO,
} from "date-fns";
import { trpc } from "@/integrations/tanstack-query/root-provider";
import { toast } from "sonner";

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
  const handleNewChat = () => {
    // Navigate to root and reset any chat state
    navigate({
      to: "/",
      replace: true, // This will replace current history entry
    });
  };

  const { data, isLoading, error, refetch } = useQuery(
    trpc.chat.getChats.queryOptions()
  );

  const preloadChat = (id: string) => {
    router.preloadRoute({
      to: "/chat/{-$threadId}",
      params: { threadId: id },
    });
  };

  const navigateToChat = (id: string) => {
    navigate({
      to: "/chat/{-$threadId}",
      params: { threadId: id },
    });
  };

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Athena AI</span>
          </div>
        </div>
        <div className="px-2 py-2">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start"
            variant="outline"
          >
            <SquarePen className="mr-2 h-4 w-4" />
            Start new chat
          </Button>
        </div>
        <div className="px-2 pb-2">
          <Link to="/library">
            <Button className="w-full justify-start" variant="ghost">
              <BookOpen className="mr-2 h-4 w-4" />
              Library
            </Button>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-4">
          {isLoading && <div>Loading...</div>}
          {error && <RetryError onRetry={refetch} />}
          {data &&
            Array.isArray(data) &&
            (() => {
              const groups = groupChats(data as ChatItem[]);
              return (
                <>
                  <SidebarGroup>
                    <SidebarGroupLabel>Recent</SidebarGroupLabel>
                    <SidebarMenu>
                      {groups.recent.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            className="w-full justify-start"
                            tooltip={humanizeDate(
                              chat.updatedAt || chat.createdAt
                            )}
                            onMouseEnter={() => preloadChat(chat.id)}
                            onClick={() => navigateToChat(chat.id)}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span className="truncate">
                              {chat.title || "Untitled chat"}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>

                  <SidebarGroup>
                    <SidebarGroupLabel>Previous 7 Days</SidebarGroupLabel>
                    <SidebarMenu>
                      {groups.lastWeek.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            className="w-full justify-start"
                            tooltip={humanizeDate(
                              chat.updatedAt || chat.createdAt
                            )}
                            onClick={() =>
                              navigate({
                                to: "/chat/{-$threadId}",
                                params: { threadId: chat.id },
                              })
                            }
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span className="truncate">
                              {chat.title || "Untitled chat"}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>

                  <SidebarGroup>
                    <SidebarGroupLabel>Previous 30 Days</SidebarGroupLabel>
                    <SidebarMenu>
                      {groups.lastMonth.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            className="w-full justify-start"
                            tooltip={humanizeDate(
                              chat.updatedAt || chat.createdAt
                            )}
                            onClick={() =>
                              navigate({
                                to: "/chat/{-$threadId}",
                                params: { threadId: chat.id },
                              })
                            }
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span className="truncate">
                              {chat.title || "Untitled chat"}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>

                  <SidebarGroup>
                    <SidebarGroupLabel>Previous</SidebarGroupLabel>
                    <SidebarMenu>
                      {groups.previous.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            className="w-full justify-start"
                            tooltip={humanizeDate(
                              chat.updatedAt || chat.createdAt
                            )}
                            onClick={() =>
                              navigate({
                                to: "/chat/{-$threadId}",
                                params: { threadId: chat.id },
                              })
                            }
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span className="truncate">
                              {chat.title || "Untitled chat"}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>
                </>
              );
            })()}
        </div>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
