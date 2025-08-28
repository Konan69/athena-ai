import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import { CreateOrganizationDialog } from "@/components/create-organization-dialog";
import { useSetActiveOrganization } from "@/hooks/use-organization";
import { useActiveOrganization } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/integrations/tanstack-query/root-provider";
import { useSessionStore } from "@/store/session.store";

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

export function OrganizationSwitcher() {
  const { session } = useSessionStore();
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();
  const {
    data: organizations,
    isLoading,
    error,
  } = useQuery({
    ...trpc.organization.getUserOrganizations.queryOptions(),
  });
  const { data: activeOrganization } = useActiveOrganization();

  const userRole = activeOrganization?.members?.find(
    (member) => member.userId === session?.userId
  )?.role;

  const setActiveOrganizationMutation = useSetActiveOrganization();

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            aria-label="Select organization"
            className={cn(
              "w-full justify-between px-3 py-2 text-left font-normal",
              "hover:bg-accent hover:text-accent-foreground"
            )}
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium">
                  {isLoading
                    ? "..."
                    : activeOrganization?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">
                  {isLoading ? "Loading..." : activeOrganization?.name}
                </span>
                <span className="text-xs text-muted-foreground leading-none">
                  {isLoading ? "..." : activeOrganization?.slug}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Badge
                variant="secondary"
                className={cn("text-xs", getRoleColor(userRole!))}
              >
                {isLoading ? "..." : userRole}
              </Badge>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search organizations..." />
            <CommandList>
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup>
                {organizations?.map((org: any) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => {
                      setActiveOrganizationMutation.mutate({
                        organizationId: org.id,
                      });
                      setOpen(false);
                      // navigate({
                      //   to: "/organizations/$orgId",
                      //   params: { orgId: org.id },
                      // });
                    }}
                    className="flex items-center justify-between p-2"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">
                          {org.name}
                        </span>
                        <span className="text-xs text-muted-foreground leading-none">
                          {org.slug}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", getRoleColor(org.role))}
                      >
                        {org.role}
                      </Badge>
                      {org.id === activeOrganization?.id && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <Separator className="my-2" />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setCreateDialogOpen(true);
                  }}
                  className="flex items-center space-x-2 p-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Organization</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateOrganizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
