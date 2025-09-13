import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText } from "lucide-react";

const textSnippetSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required").max(50000, "Content too long (max 50,000 characters)"),
  description: z.string().optional().default(""),
  tags: z.array(z.string()),
});

export type TextSnippetFormValues = z.infer<typeof textSnippetSchema>;

export function TextSnippetTab({
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  onSubmit: (values: TextSnippetFormValues) => Promise<void> | void;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TextSnippetFormValues>({
    resolver: zodResolver(textSnippetSchema),
    defaultValues: {
      title: "",
      content: "",
      description: "",
      tags: [] as string[],
    },
  });

  const content = watch("content");

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values: TextSnippetFormValues) => onSubmit(values))}
    >
      <div>
        <Label htmlFor="title-input" className="text-sm font-medium mb-2 block">
          Title
        </Label>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
          Give your text snippet a clear, descriptive title
        </p>
        <Input
          id="title-input"
          {...register("title")}
          className="h-10 rounded-lg border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          placeholder="Enter a title for your text snippet"
        />
        {errors.title && (
          <p className="mt-2 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="content-input" className="text-sm font-medium mb-2 block">
          Content
        </Label>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
          Paste your text content here. This will be added to your knowledge base.
        </p>
        <Textarea
          id="content-input"
          {...register("content")}
          className="min-h-[200px] rounded-lg border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          placeholder="Paste your text content here..."
        />
        <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>Maximum 50,000 characters</span>
          <span>{content?.length || 0}/50,000</span>
        </div>
        {errors.content && (
          <p className="mt-2 text-sm text-red-500">{errors.content.message}</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Description (Optional)</Label>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
          Briefly describe what this text snippet contains
        </p>
        <Textarea 
          {...register("description")} 
          className="mt-2 min-h-[90px] rounded-lg border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          placeholder="Brief description of this text snippet"
        />
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
        <Button 
          type="submit" 
          disabled={isSubmitting || !content?.length}
          className="flex items-center gap-2 h-10 rounded-lg"
        >
          <FileText className="h-4 w-4" />
          {isSubmitting ? "Creating..." : "Create Text Snippet"}
        </Button>
      </div>
    </form>
  );
}