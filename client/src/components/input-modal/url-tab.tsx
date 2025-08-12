import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const urlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  tags: z.array(z.string()),
});

export type UrlFormValues = z.infer<typeof urlSchema>;

export function UrlTab({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: UrlFormValues) => Promise<void> | void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema) as any,
    defaultValues: {
      url: "",
      title: "",
      description: "",
      tags: [] as string[],
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values: UrlFormValues) => onSubmit(values))}
    >
      <div>
        <Label htmlFor="url-input" className="text-sm font-medium">
          Website URL
        </Label>
        <Input
          id="url-input"
          type="url"
          {...register("url")}
          className="mt-2"
        />
        {errors.url && (
          <p className="mt-2 text-sm text-red-500">{errors.url.message}</p>
        )}
      </div>
      <div>
        <Label className="text-sm font-medium">Title</Label>
        <Input {...register("title")} className="mt-2" />
        {errors.title && (
          <p className="mt-2 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>
      <div>
        <Label className="text-sm font-medium">Description</Label>
        <Textarea {...register("description")} className="mt-2" />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Import URL"}
        </Button>
      </div>
    </form>
  );
}
