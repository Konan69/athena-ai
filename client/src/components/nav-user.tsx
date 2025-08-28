"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Building2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/use-sidebar";
import { signOut, useActiveOrganization } from "@/lib/auth-client";
import { useSessionStore } from "@/store/session.store";
import { useUserStore } from "@/store/user.store";
import { useNavigate } from "@tanstack/react-router";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { clearSession } = useSessionStore();
  const user = useUserStore((state) => state.user);
  const { data: activeOrganization } = useActiveOrganization();

  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    clearSession();
    navigate({ to: "/login" });
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="group relative overflow-hidden rounded-lg border border-neon-purple/40 bg-sidebar/60 backdrop-blur-md transition-colors data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hocus:opacity-100"
                  style={{
                    backgroundImage:
                      "radial-gradient(40% 60% at 0% 0%, oklch(0.72 0.25 300 / 0.10) 0%, transparent 60%)",
                  }}
                />
                <Avatar className="h-8 w-8 rounded-lg ring-1 ring-border/60 group-hocus:ring-neon-purple/50 transition">
                  <AvatarImage src={user?.image!} alt={user?.name!} />
                  <AvatarFallback className="rounded-lg bg-muted text-foreground/70">
                    {(user?.name || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">
                    {activeOrganization?.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground/80">
                    {user?.name}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground transition group-hocus:text-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border border-neon-purple/30 bg-sidebar/80 backdrop-blur-xl shadow-lg shadow-black/5"
              side={isMobile ? "bottom" : "right"}
              align="start"
              sideOffset={8}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg ring-1 ring-border/60">
                    <AvatarImage src={user?.image!} alt={user?.name!} />
                    <AvatarFallback className="rounded-lg bg-muted text-foreground/70">
                      {(user?.name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeOrganization?.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground/80">
                      {user?.name}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="gap-2 rounded-md transition-colors hover:bg-[oklch(0.72_0.25_300_/0.08)]">
                  <Sparkles className="size-4 text-[oklch(0.72_0.25_300)]" />
                  <div className="flex flex-col">
                    <span className="text-sm">Upgrade to Pro</span>
                    <span className="text-[11px] text-muted-foreground/80">
                      Unlock faster models and RAG
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="gap-2 rounded-md transition-colors hover:bg-[oklch(0.72_0.25_300_/0.08)]">
                  <BadgeCheck className="size-4 text-muted-foreground" />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 rounded-md transition-colors hover:bg-[oklch(0.72_0.25_300_/0.08)]">
                  <CreditCard className="size-4 text-muted-foreground" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 rounded-md transition-colors hover:bg-[oklch(0.72_0.25_300_/0.08)]">
                  <Bell className="size-4 text-muted-foreground" />
                  <span>Notifications</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="gap-2 rounded-md transition-colors hover:bg-[oklch(0.72_0.25_300_/0.08)]"
                  onClick={() => navigate({ to: "/organizations" })}
                >
                  <Building2 className="size-4 text-muted-foreground" />
                  <span>Companies</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="gap-2 rounded-md text-red-600 hover:bg-red-600/10"
              >
                <LogOut className="size-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
