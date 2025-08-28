import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/integrations/tanstack-query/root-provider";
import slugify from "slugify";
import { toast } from "sonner";
import { parseTRPCError, isSpecificTRPCError } from "@/lib/trpc-errors";
import { organization } from "@/lib/auth-client";
import { useRouter } from "@tanstack/react-router";

const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  keepCurrentActiveOrganization: z.boolean().optional(),
});

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      logo: "",
      keepCurrentActiveOrganization: false, // todoo, make dynamic based on wheere were making the request from
    },
  });

  const createOrganizationMutation = useMutation({
    ...trpc.organization.createOrganization.mutationOptions(),
    onError: (error) => {
      console.error("Failed to create organization:", error);

      const parsedError = parseTRPCError(error);
      const { code, message, validationErrors } = parsedError;

      // Handle specific error types
      if (validationErrors) {
        // Set form validation errors
        Object.entries(validationErrors).forEach(([field, messages]) => {
          form.setError(field as keyof CreateOrganizationForm, {
            message: messages?.join(", "),
          });
        });
      } else if (isSpecificTRPCError(error, "CONFLICT")) {
        toast.error("An organization with this slug already exists");
      } else if (isSpecificTRPCError(error, "UNAUTHORIZED")) {
        toast.error("You don't have permission to create organizations");
        router.navigate({ to: "/login" });
      } else {
        toast.error(message || "Failed to create organization");
      }
    },
    onSuccess: async (data) => {
      toast.success("Organization created successfully!");
      // const { data: activeOrganization, error: activeOrganizationError } =
      //   await organization.setActive({
      //     organizationId: data.id,
      //     organizationSlug: data.slug,
      //   });
      onOpenChange(false);
      form.reset();
    },
  });

  const onSubmit = (data: CreateOrganizationForm) => {
    // Transform empty string to undefined for logo (to match API expectations)
    const submitData = {
      ...data,
      logo: data.logo === "" ? undefined : data.logo,
    };
    createOrganizationMutation.mutate(submitData);
  };

  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    const currentSlug = form.getValues("slug");
    const generatedSlug = slugify(value, { lower: true, strict: true });
    if (!currentSlug || currentSlug === generatedSlug) {
      form.setValue("slug", generatedSlug);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Organization"
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="my-organization" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/logo.png"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createOrganizationMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOrganizationMutation.isPending}
              >
                {createOrganizationMutation.isPending
                  ? "Creating..."
                  : "Create Organization"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
