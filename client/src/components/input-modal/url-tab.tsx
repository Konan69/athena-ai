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
  onCancel,
}: {
  onSubmit: (values: UrlFormValues) => Promise<void> | void;
  isSubmitting: boolean;
  onCancel: () => void;
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
        <Label htmlFor="url-input" className="text-sm font-medium mb-2 block">
          Website URL
        </Label>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
          Enter the URL of the website you want to crawl and add to your knowledge base
        </p>
        <Input
          id="url-input"
          type="url"
          {...register("url")}
          placeholder="https://example.com"
          className="mt-2 h-10 rounded-lg border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
        />
        {errors.url && (
          <p className="mt-2 text-sm text-red-500">{errors.url.message}</p>
        )}
      </div>
      <div>
        <Label className="text-sm font-medium mb-2 block">Title</Label>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
          Give this web page a descriptive title
        </p>
        <Input {...register("title")} placeholder="Enter a title" className="mt-2 h-10 rounded-lg border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
        {errors.title && (
          <p className="mt-2 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>
      <div>
        <Label className="text-sm font-medium mb-2 block">Description</Label>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
          Briefly describe what this web page contains
        </p>
        <Textarea {...register("description")} placeholder="Describe this web page..." className="mt-2 min-h-[90px] rounded-lg border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-lg border-neutral-300 dark:border-neutral-700 bg-transparent"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="h-10 rounded-lg">
          {isSubmitting ? "Submitting..." : "Import URL"}
        </Button>
      </div>
    </form>
  );
}
