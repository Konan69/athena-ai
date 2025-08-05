import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { SidebarApp } from "@/components/sidebar-app";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useSessionStore } from "@/store/session.store";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // Fast path: check store state first
    const { isAuthenticated } = useSessionStore.getState();

    // If authenticated in store, allow navigation immediately
    if (isAuthenticated) {
      return;
    }

    // Slow path: do async check only if store indicates not authenticated
    const { getSession } = await import("@/lib/auth-client");
    const sessionData = await getSession();

    if (!sessionData.data) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: () => {
    return (
      <SidebarProvider>
        {/* Global inset background behind everything */}
        <div className="absolute inset-0 z-0 dark:bg-sidebar">
          <div className="absolute inset-0 " />
        </div>

        {/* Shell above background */}
        <div className="relative z-10 flex min-h-svh w-full">
          <SidebarApp variant="inset" collapsible="offcanvas" />
          {/* Content wrapper */}
          <main className="relative flex-1 overflow-hidden">
            {/* Fix subtle layout shift: avoid translate transforms that can snap on route/nav user interactions */}
            <div className="min-h-[100svh] border-l sm:border sm:border-chat-border sm:rounded-tl-xl backdrop-blur-md pb-[140px] overflow-hidden transition-[background-color,border-color,box-shadow]">
              <SidebarInset className="bg-noise">
                <Outlet />
              </SidebarInset>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  },
});
