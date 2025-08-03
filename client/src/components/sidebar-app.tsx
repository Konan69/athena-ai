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
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/config/trpc";

// This is sample data.
const data = {
  recentChats: [
    {
      title: "Research Strategy Discussion",
      date: new Date(2024, 2, 20),
      url: "/chat",
    },
    {
      title: "Data Analysis Helper",
      date: new Date(2024, 2, 19),
      url: "/chat",
    },
    {
      title: "Market Research Chat",
      date: new Date(2024, 2, 18),
      url: "/chat",
    },
  ],
  lastWeekChats: [
    {
      title: "Competitive Analysis",
      date: new Date(2024, 2, 15),
      url: "/chat",
    },
    {
      title: "Product Requirements",
      date: new Date(2024, 2, 14),
      url: "/chat",
    },
  ],
  lastMonthChats: [
    {
      title: "Industry Trends Overview",
      date: new Date(2024, 1, 28),
      url: "/chat",
    },
    {
      title: "Technical Deep Dive",
      date: new Date(2024, 1, 25),
      url: "/chat",
    },
  ],
  previousChats: [
    {
      title: "Initial Research Setup",
      date: new Date(2023, 11, 15),
      url: "/chat",
    },
    {
      title: "Knowledge Base Query",
      date: new Date(2023, 11, 10),
      url: "/chat",
    },
  ],
};

export function SidebarApp({ ...props }: ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const chats = useQuery(trpc.chat.getChats.queryOptions());

  // const data = chats.data;
  const handleNewChat = () => {
    navigate({ to: "/chat" });
  };
  // const transformedData = data?.map((chat) => ({
  //   title: chat.title
  // }))

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
          {/* Recent Chats */}
          <SidebarGroup>
            <SidebarGroupLabel>Recent</SidebarGroupLabel>
            <SidebarMenu>
              {data.recentChats.map((chat) => (
                <SidebarMenuItem key={chat.title}>
                  <SidebarMenuButton asChild className="w-full justify-start">
                    <Link to={chat.url}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {chat.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* Previous 7 Days */}
          <SidebarGroup>
            <SidebarGroupLabel>Previous 7 Days</SidebarGroupLabel>
            <SidebarMenu>
              {data.lastWeekChats.map((chat) => (
                <SidebarMenuItem key={chat.title}>
                  <SidebarMenuButton asChild className="w-full justify-start">
                    <Link to={chat.url}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {chat.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* Previous 30 Days */}
          <SidebarGroup>
            <SidebarGroupLabel>Previous 30 Days</SidebarGroupLabel>
            <SidebarMenu>
              {data.lastMonthChats.map((chat) => (
                <SidebarMenuItem key={chat.title}>
                  <SidebarMenuButton asChild className="w-full justify-start">
                    <Link to={chat.url}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {chat.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* Previous Years */}
          <SidebarGroup>
            <SidebarGroupLabel>Previous Years</SidebarGroupLabel>
            <SidebarMenu>
              {data.previousChats.map((chat) => (
                <SidebarMenuItem key={chat.title}>
                  <SidebarMenuButton asChild className="w-full justify-start">
                    <Link to={chat.url}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {chat.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
