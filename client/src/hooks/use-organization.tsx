import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/integrations/tanstack-query/root-provider";
import { organization } from "@/lib/auth-client";
import { parseTRPCError, isSpecificTRPCError } from "@/lib/trpc-errors";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

// Hook for getting organization members
export function useOrganizationMembers(organizationId: string) {
  return useQuery(
    trpc.organization.getOrganizationMembers.queryOptions(
      { organizationId },
      { enabled: !!organizationId }
    )
  );
}

// Hook for inviting members
export function useInviteMember() {
  const router = useRouter();

  return useMutation({
    ...trpc.organization.inviteMember.mutationOptions(),
    onError: (error) => {
      const parsedError = parseTRPCError(error);
      const { code, message } = parsedError;

      if (isSpecificTRPCError(error, "UNAUTHORIZED")) {
        toast.error("You don't have permission to invite members");
        router.navigate({ to: "/login" });
      } else if (isSpecificTRPCError(error, "FORBIDDEN")) {
        toast.error(
          "You don't have permission to invite members to this organization"
        );
      } else if (isSpecificTRPCError(error, "NOT_FOUND")) {
        toast.error("The organization or user was not found");
      } else {
        toast.error(message || "Failed to invite member");
      }
    },
    onSuccess: () => {
      toast.success("Member invited successfully!");
    },
  });
}

// Hook for accepting invitations
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    ...trpc.organization.acceptInvitation.mutationOptions(),
    onError: (error) => {
      const parsedError = parseTRPCError(error);
      const { code, message } = parsedError;

      if (isSpecificTRPCError(error, "UNAUTHORIZED")) {
        toast.error("You need to be logged in to accept invitations");
        router.navigate({ to: "/login" });
      } else if (isSpecificTRPCError(error, "NOT_FOUND")) {
        toast.error("The invitation was not found or has expired");
      } else if (isSpecificTRPCError(error, "CONFLICT")) {
        toast.error("You're already a member of this organization");
      } else {
        toast.error(message || "Failed to accept invitation");
      }
    },
    onSuccess: () => {
      toast.success("Invitation accepted successfully!");
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
    },
  });
}

// Hook for setting active organization
export function useSetActiveOrganization() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { organizationId: string | null }) => {
      const result = await organization.setActive(data);
      return result;
    },
    onError: (error) => {
      const parsedError = parseTRPCError(error);
      const { code, message } = parsedError;

      if (isSpecificTRPCError(error, "UNAUTHORIZED")) {
        toast.error("You need to be logged in to switch organizations");
        router.navigate({ to: "/login" });
      } else if (isSpecificTRPCError(error, "NOT_FOUND")) {
        toast.error("The organization was not found");
      } else if (isSpecificTRPCError(error, "FORBIDDEN")) {
        toast.error("You don't have access to this organization");
      } else {
        toast.error(message || "Failed to switch organization");
      }
    },
    onSuccess: () => {
      toast.success("Organization switched successfully!");
      queryClient.invalidateQueries();
    },
  });
}
