import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { SidebarApp } from "@/components/sidebar-app";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useSessionStore } from "@/store/session.store";
import EventHandler from "@/components/handlers/eventHandler";

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
    return <AuthenticatedLayout />;
  },
});

const AuthenticatedLayout = () => {
  EventHandler();
  return (
    <>
      <SidebarProvider>
        <div className="relative z-10 flex h-screen w-full overflow-hidden">
          <SidebarApp variant="inset" collapsible="offcanvas" />
          <main className="relative flex-1 overflow-hidden min-h-0">
            <div className="sm:translate-y-4 mr-1 translate- bg-noise border-l sm:border sm:border-chat-border sm:rounded-t-md backdrop-blur-md overflow-hidden min-h-0 h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
};
