import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Settings } from "lucide-react";
import { CreateOrganizationDialog } from "@/components/create-organization-dialog";
import { Link } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/organizations/")({
  component: OrganizationsPage,
  loader: async ({ context }) => {
    const trpc = context.trpc;
    const qc = context.queryClient;
    const data = await qc.ensureQueryData(
      trpc.organization.getUserOrganizations.queryOptions()
    );
    return { data };
  },
  pendingComponent: () => <div>Loading...</div>,
  errorComponent: ({ error, reset }) => {
    return <div>Error: {error.message}</div>;
  },
});

const getRoleColor = (role: string) => {
  switch (role) {
    case "owner":
      return "bg-purple-100 text-purple-800";
    case "admin":
      return "bg-blue-100 text-blue-800";
    case "member":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function OrganizationsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: organizations} = Route.useLoaderData();

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Organizations</h1>
              <p className="text-muted-foreground">
                Manage your organizations and team members
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </div>

          {/* Organizations list */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations?.map((org) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {org.slug}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className={getRoleColor(org.role)}
                    >
                      {org.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {org.memberCount} member{org.memberCount !== 1 ? "s" : ""}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Manage
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link
                        to={`/organizations/$orgId/members`}
                        params={{ orgId: org.id }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Members
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {organizations.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-muted-foreground">
                <Users className="h-12 w-12" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No organizations</h3>
              <p className="text-muted-foreground">
                Get started by creating your first organization.
              </p>
              <Button
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreateOrganizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
