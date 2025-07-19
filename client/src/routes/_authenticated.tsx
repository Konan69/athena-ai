import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { SidebarApp } from "@/components/sidebar-app";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSessionStore } from "@/store/session.store";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // Fast path: check store state first
    const { isAuthenticated, isLoading } = useSessionStore.getState();

    // If authenticated in store, allow navigation immediately
    if (isAuthenticated) {
      return;
    }

    // If store is still loading, wait a bit and check again
    if (isLoading) {
      // Wait a short time for auth to resolve
      await new Promise((resolve) => setTimeout(resolve, 100));
      const { isAuthenticated: authAfterWait } = useSessionStore.getState();

      if (authAfterWait) {
        return;
      }
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
          <SidebarApp />
          <main className="flex-1 flex flex-col overflow-hidden">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    );
  },
});
