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
import { motion, AnimatePresence } from "framer-motion";
import { cursorGlowProps } from "@/lib/utils";
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
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <Button
              {...cursorGlowProps()}
              onClick={handleNewChat}
              className="group relative w-full justify-start overflow-hidden rounded-md border border-[oklch(0.72_0.25_300_/0.20)] bg-[oklch(0.72_0.25_300_/0.08)] text-foreground hover:bg-[oklch(0.72_0.25_300_/0.12)] transition-colors"
              variant="outline"
            >
              <span
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage: "url(/noise.png)",
                  backgroundSize: "96px 96px",
                }}
              />
              {/* Ringed purple layered glow around button edges */}
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-0.5 rounded-lg opacity-60 transition-opacity duration-300"
                style={{
                  background:
                    "radial-gradient(120% 180% at 50% 100%, transparent 45%, oklch(0.72 0.25 300 / 0.14) 58%, oklch(0.72 0.25 300 / 0.06) 75%, transparent 88%)",
                  mask: "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
                  WebkitMask:
                    "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
                  padding: "1px",
                }}
              />
              <span
                data-glow="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150"
                style={{
                  background:
                    "radial-gradient(44px 44px at var(--mx) var(--my), oklch(0.72 0.25 300 / 0.16), transparent 60%)",
                }}
              />
              <SquarePen className="relative mr-2 h-4 w-4 text-[oklch(0.72_0.25_300)] transition-transform duration-200 group-hover:scale-105" />
              <span className="relative">New chat</span>
            </Button>
          </motion.div>
        </div>
        <div className="px-2 pb-2 relative">
          <Link to="/library">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
            >
              <Button
                onMouseMove={(e) => {
                  const target = e.currentTarget as HTMLButtonElement;
                  const rect = target.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  target.style.setProperty("--mx", `${x}px`);
                  target.style.setProperty("--my", `${y}px`);
                  // smoothly reveal the glow
                  const glow = target.querySelector(
                    '[data-glow="true"]'
                  ) as HTMLElement | null;
                  if (glow) glow.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLButtonElement;
                  target.style.setProperty("--mx", "-200px");
                  target.style.setProperty("--my", "-200px");
                  const glow = target.querySelector(
                    '[data-glow="true"]'
                  ) as HTMLElement | null;
                  if (glow) glow.style.opacity = "0";
                }}
                className="group relative w-full justify-start border border-[oklch(0.72_0.25_300_/0.22)] hover:bg-[oklch(0.72_0.25_300_/0.05)] transition-colors"
                style={
                  {
                    "--mx": "-200px",
                    "--my": "-200px",
                  } as React.CSSProperties
                }
                variant="outline"
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "url(/noise.png)",
                    backgroundSize: "96px 96px",
                  }}
                />
                <span
                  data-glow="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150"
                  style={{
                    background:
                      "radial-gradient(39px 39px at var(--mx) var(--my), oklch(0.72 0.25 300 / 0.12), transparent 60%)",
                  }}
                />
                <BookOpen className="relative mr-2 h-4 w-4 text-foreground/80 transition-colors duration-200 group-hover:text-foreground" />
                <span className="relative">Library</span>
              </Button>
            </motion.div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="relative before:pointer-events-none before:absolute before:inset-0 before:opacity-50 ">
        <div className="flex flex-col gap-4">
          {isLoading && (
            <div className="px-2">
              <div className="h-8 w-full animate-pulse rounded-md bg-muted/40" />
            </div>
          )}
          {error && <RetryError onRetry={refetch} />}
          {data &&
            Array.isArray(data) &&
            (() => {
              const groups = groupChats(data as ChatItem[]);
              return (
                <>
                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium tracking-wide text-foreground/80">
                      Recent
                    </SidebarGroupLabel>
                    <SidebarMenu>
                      <AnimatePresence initial={false}>
                        {groups.recent.map((chat, i) => (
                          <SidebarMenuItem key={chat.id}>
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{
                                delay: i * 0.02,
                                duration: 0.18,
                                ease: "easeOut",
                              }}
                            >
                              <Link
                                to={`/chat/{-$threadId}`}
                                params={{ threadId: chat.id }}
                              >
                                <SidebarMenuButton
                                  className="group relative overflow-hidden w-full justify-start rounded-md border border-transparent hover:border-[oklch(0.72_0.25_300_/0.28)] hover:bg-[oklch(0.72_0.25_300_/0.06)] transition-colors"
                                  tooltip={humanizeDate(
                                    chat.updatedAt || chat.createdAt
                                  )}
                                  onMouseMove={(e) => {
                                    const target =
                                      e.currentTarget as HTMLButtonElement;
                                    const rect = target.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    target.style.setProperty("--mx", `${x}px`);
                                    target.style.setProperty("--my", `${y}px`);
                                    const glow = target.querySelector(
                                      '[data-glow="true"]'
                                    ) as HTMLElement | null;
                                    if (glow) glow.style.opacity = "1";
                                  }}
                                  onMouseLeave={(e) => {
                                    const target =
                                      e.currentTarget as HTMLButtonElement;
                                    target.style.setProperty("--mx", "-200px");
                                    target.style.setProperty("--my", "-200px");
                                    const glow = target.querySelector(
                                      '[data-glow="true"]'
                                    ) as HTMLElement | null;
                                    if (glow) glow.style.opacity = "0";
                                  }}
                                  style={
                                    {
                                      "--mx": "-200px",
                                      "--my": "-200px",
                                    } as React.CSSProperties
                                  }
                                >
                                  <span
                                    data-glow="true"
                                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150"
                                    style={{
                                      background:
                                        "radial-gradient(26px 26px at var(--mx) var(--my), oklch(0.72 0.25 300 / 0.10), transparent 55%)",
                                    }}
                                  />
                                  <MessageCircle className="relative mr-2 h-4 w-4 text-foreground/80 transition-transform group-hover:scale-105" />
                                  <span className="relative truncate">
                                    {chat.title || "Untitled chat"}
                                  </span>
                                </SidebarMenuButton>
                              </Link>
                            </motion.div>
                          </SidebarMenuItem>
                        ))}
                      </AnimatePresence>
                    </SidebarMenu>
                  </SidebarGroup>

                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium tracking-wide text-foreground/80">
                      Previous 7 Days
                    </SidebarGroupLabel>
                    <SidebarMenu>
                      <AnimatePresence initial={false}>
                        {groups.lastWeek.map((chat, i) => (
                          <SidebarMenuItem key={chat.id}>
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{
                                delay: i * 0.02,
                                duration: 0.18,
                                ease: "easeOut",
                              }}
                            >
                              <SidebarMenuButton
                                className="group relative overflow-hidden w-full justify-start rounded-md border border-transparent hover:border-[oklch(0.72_0.25_300_/0.28)] hover:bg-[oklch(0.72_0.25_300_/0.06)] transition-colors"
                                tooltip={humanizeDate(
                                  chat.updatedAt || chat.createdAt
                                )}
                                onMouseMove={(e) => {
                                  const target =
                                    e.currentTarget as HTMLButtonElement;
                                  const rect = target.getBoundingClientRect();
                                  const x = e.clientX - rect.left;
                                  const y = e.clientY - rect.top;
                                  target.style.setProperty("--mx", `${x}px`);
                                  target.style.setProperty("--my", `${y}px`);
                                  const glow = target.querySelector(
                                    '[data-glow="true"]'
                                  ) as HTMLElement | null;
                                  if (glow) glow.style.opacity = "1";
                                }}
                                onMouseLeave={(e) => {
                                  const target =
                                    e.currentTarget as HTMLButtonElement;
                                  target.style.setProperty("--mx", "-200px");
                                  target.style.setProperty("--my", "-200px");
                                  const glow = target.querySelector(
                                    '[data-glow="true"]'
                                  ) as HTMLElement | null;
                                  if (glow) glow.style.opacity = "0";
                                }}
                                onClick={() =>
                                  navigate({
                                    to: "/chat/{-$threadId}",
                                    params: { threadId: chat.id },
                                  })
                                }
                                style={
                                  {
                                    "--mx": "50%",
                                    "--my": "50%",
                                  } as React.CSSProperties
                                }
                              >
                                <span
                                  data-glow="true"
                                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150"
                                  style={{
                                    background:
                                      "radial-gradient(26px 26px at var(--mx) var(--my), oklch(0.72 0.25 300 / 0.10), transparent 55%)",
                                  }}
                                />
                                <MessageCircle className="relative mr-2 h-4 w-4 text-foreground/80 transition-transform duration-200 group-hover:scale-105" />
                                <span className="relative truncate">
                                  {chat.title || "Untitled chat"}
                                </span>
                              </SidebarMenuButton>
                            </motion.div>
                          </SidebarMenuItem>
                        ))}
                      </AnimatePresence>
                    </SidebarMenu>
                  </SidebarGroup>

                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium tracking-wide text-foreground/80">
                      Previous 30 Days
                    </SidebarGroupLabel>
                    <SidebarMenu>
                      <AnimatePresence initial={false}>
                        {groups.lastMonth.map((chat, i) => (
                          <SidebarMenuItem key={chat.id}>
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{
                                delay: i * 0.02,
                                duration: 0.18,
                                ease: "easeOut",
                              }}
                            >
                              <SidebarMenuButton
                                className="group relative overflow-hidden w-full justify-start rounded-md border border-transparent hover:border-[oklch(0.72_0.25_300_/0.28)] hover:bg-[oklch(0.72_0.25_300_/0.06)] transition-colors"
                                tooltip={humanizeDate(
                                  chat.updatedAt || chat.createdAt
                                )}
                                onMouseMove={(e) => {
                                  const target =
                                    e.currentTarget as HTMLButtonElement;
                                  const rect = target.getBoundingClientRect();
                                  const x = e.clientX - rect.left;
                                  const y = e.clientY - rect.top;
                                  target.style.setProperty("--mx", `${x}px`);
                                  target.style.setProperty("--my", `${y}px`);
                                  const glow = target.querySelector(
                                    '[data-glow="true"]'
                                  ) as HTMLElement | null;
                                  if (glow) glow.style.opacity = "1";
                                }}
                                onMouseLeave={(e) => {
                                  const target =
                                    e.currentTarget as HTMLButtonElement;
                                  target.style.setProperty("--mx", "-200px");
                                  target.style.setProperty("--my", "-200px");
                                  const glow = target.querySelector(
                                    '[data-glow="true"]'
                                  ) as HTMLElement | null;
                                  if (glow) glow.style.opacity = "0";
                                }}
                                onClick={() =>
                                  navigate({
                                    to: "/chat/{-$threadId}",
                                    params: { threadId: chat.id },
                                  })
                                }
                                style={
                                  {
                                    "--mx": "50%",
                                    "--my": "50%",
                                  } as React.CSSProperties
                                }
                              >
                                <span
                                  data-glow="true"
                                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150"
                                  style={{
                                    background:
                                      "radial-gradient(34px 34px at var(--mx) var(--my), oklch(0.72 0.25 300 / 0.12), transparent 60%)",
                                  }}
                                />
                                <MessageCircle className="relative mr-2 h-4 w-4 text-foreground/80 transition-transform duration-200 group-hover:scale-105" />
                                <span className="relative truncate">
                                  {chat.title || "Untitled chat"}
                                </span>
                              </SidebarMenuButton>
                            </motion.div>
                          </SidebarMenuItem>
                        ))}
                      </AnimatePresence>
                    </SidebarMenu>
                  </SidebarGroup>

                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium tracking-wide text-foreground/80">
                      Previous
                    </SidebarGroupLabel>
                    <SidebarMenu>
                      <AnimatePresence initial={false}>
                        {groups.previous.map((chat, i) => (
                          <SidebarMenuItem key={chat.id}>
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{
                                delay: i * 0.02,
                                duration: 0.18,
                                ease: "easeOut",
                              }}
                            >
                              <SidebarMenuButton
                                className="group relative overflow-hidden w-full justify-start rounded-md border border-transparent hover:border-[oklch(0.72_0.25_300_/0.28)] hover:bg-[oklch(0.72_0.25_300_/0.06)] transition-colors"
                                tooltip={humanizeDate(
                                  chat.updatedAt || chat.createdAt
                                )}
                                onMouseMove={(e) => {
                                  const target =
                                    e.currentTarget as HTMLButtonElement;
                                  const rect = target.getBoundingClientRect();
                                  const x = e.clientX - rect.left;
                                  const y = e.clientY - rect.top;
                                  target.style.setProperty("--mx", `${x}px`);
                                  target.style.setProperty("--my", `${y}px`);
                                  const glow = target.querySelector(
                                    '[data-glow="true"]'
                                  ) as HTMLElement | null;
                                  if (glow) glow.style.opacity = "1";
                                }}
                                onMouseLeave={(e) => {
                                  const target =
                                    e.currentTarget as HTMLButtonElement;
                                  target.style.setProperty("--mx", "-200px");
                                  target.style.setProperty("--my", "-200px");
                                  const glow = target.querySelector(
                                    '[data-glow="true"]'
                                  ) as HTMLElement | null;
                                  if (glow) glow.style.opacity = "0";
                                }}
                                onClick={() =>
                                  navigate({
                                    to: "/chat/{-$threadId}",
                                    params: { threadId: chat.id },
                                  })
                                }
                                style={
                                  {
                                    "--mx": "-200px",
                                    "--my": "-200px",
                                  } as React.CSSProperties
                                }
                              >
                                <span
                                  data-glow="true"
                                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150"
                                  style={{
                                    background:
                                      "radial-gradient(28px 28px at var(--mx) var(--my), oklch(0.72 0.25 300 / 0.10), transparent 55%)",
                                  }}
                                />
                                <MessageCircle className="relative mr-2 h-4 w-4 text-foreground/80 transition-transform duration-200 group-hover:scale-105" />
                                <span className="relative truncate">
                                  {chat.title || "Untitled chat"}
                                </span>
                              </SidebarMenuButton>
                            </motion.div>
                          </SidebarMenuItem>
                        ))}
                      </AnimatePresence>
                    </SidebarMenu>
                  </SidebarGroup>
                </>
              );
            })()}
        </div>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter className="relative before:pointer-events-none before:absolute before:inset-0 before:opacity-60">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
