import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { SidebarApp } from "@/components/sidebar-app";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSessionStore } from "@/store/session.store";
import EventHandler from "@/components/handlers/eventHandler";
import { useListOrganizations } from "@/lib/auth-client";

import { CreateOrganizationDialog } from "@/components/create-organization-dialog";
import { useState, useEffect } from "react";

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
  errorComponent: () => {
    return <div>Error</div>;
  },
});

const AuthenticatedLayout = () => {
  const { data: organizations, isPending, error } = useListOrganizations();
  const { session } = useSessionStore();

  console.log("organizations", organizations);
  console.log("organizations?.length", organizations?.length);
  console.log("session.activeOrganizationId", session?.activeOrganizationId);
  console.log("error", error);

  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);

  // Show dialog when organizations are loaded and empty
  useEffect(() => {
    // Only act when we have finished loading and have a definitive result
    if (!isPending && organizations !== undefined) {
      if (organizations?.length === 0) {
        setCreateOrgDialogOpen(true);
      } else {
        setCreateOrgDialogOpen(false);
      }
    }
  }, [organizations, isPending]); // Include both dependencies

  // Don't render anything while loading
  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Athena is loading...</div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Error loading organizations: {error.message}</div>
      </div>
    );
  }

  // Check if organizations is still null/undefined after loading
  if (organizations === undefined || organizations === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>No organization data available</div>
      </div>
    );
  }

  const hasOrganizations = organizations.length > 0;
  const hasActiveOrganization = !!session?.activeOrganizationId;

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

      {/* Show create dialog when no organizations exist */}
      {organizations.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <CreateOrganizationDialog
            open={createOrgDialogOpen}
            onOpenChange={setCreateOrgDialogOpen} // Fix: allow dialog to be closed
          />
        </div>
      )}

      {/* Render EventHandler only when there's an active organization */}
      {hasActiveOrganization && <EventHandler />}
    </>
  );
};
