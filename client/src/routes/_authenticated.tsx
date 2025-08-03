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
        <div className="flex h-screen w-full bg-background">
          <SidebarApp variant="inset" collapsible="offcanvas" />
          <SidebarInset className="bg-transparent md:ml-0">
            <Outlet />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  },
});
