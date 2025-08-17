import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFileSize } from "@/lib/utils";
import { Upload, X, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  tags: z.array(z.string()),
  file: z
    .instanceof(File)
    .refine((f) => f.size <= 10 * 1024 * 1024, "Max 10MB")
    .refine(
      (f) =>
        /\.(pdf|docx|txt|md|doc|csv)$/i.test(f.name) &&
        [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/markdown",
          "text/plain",
          "application/vnd.oasis.opendocument.text",
        ].includes(f.type),
      "Unsupported type"
    ),
});

export type UploadFormValues = z.infer<typeof uploadSchema>;

export function UploadTab({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: UploadFormValues) => Promise<void> | void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
    getValues,
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { title: "", description: "", tags: [] as string[] },
  });

  const tags = watch("tags");
  const file = watch("file");
  const title = watch("title");
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file && !title) {
      setValue("title", file.name.replace(/\.[^/.]+$/, ""));
    }
  }, [file, title, setValue]);

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values: UploadFormValues) => {
        await onSubmit(values);
      })}
    >
      <div
        onDragEnter={(e) => e.preventDefault()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (!f) return;
          setValue("file", f, { shouldValidate: true });
        }}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center",
          "bg-neutral-50 dark:bg-neutral-900/50 border-neutral-300 dark:border-neutral-700"
        )}
      >
        {!file ? (
          <>
            <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-neutral-900 dark:text-neutral-100">
              Drag & drop your file here
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              PDF, DOCX, TXT, CSV, MD up to 10MB
            </p>
            <div>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,.txt,.md,.doc,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setValue("file", f, { shouldValidate: true });
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="border-neutral-300 dark:border-neutral-700 bg-transparent"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                Browse Files
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800 grid place-items-center flex-shrink-0"></div>
              <div className="min-w-0">
                <div className="font-medium text-neutral-900 dark:text-neutral-100 break-words">
                  {file.name}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  {formatFileSize(file.size)}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setValue("file", undefined as unknown as File)}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
        {errors.file && (
          <p className="mt-2 text-sm text-red-500">{errors.file.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Title
          </Label>
          <Input
            {...register("title")}
            placeholder="Enter a title"
            className="mt-2 h-10 rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          />
          {errors.title && (
            <p className="mt-2 text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Description
          </Label>
          <Textarea
            {...register("description")}
            placeholder="Describe this document..."
            className="mt-2 min-h-[90px] rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Tags
          </Label>
          <div
            className="mt-2 flex items-center flex-wrap gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5"
            onClick={() => tagInputRef.current?.focus()}
          >
            {tags.map((t, idx) => (
              <span
                key={`${t}-${idx}`}
                className="inline-flex items-center gap-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2 py-0.5 text-xs"
              >
                {t}
                <button
                  type="button"
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    const current = getValues("tags");
                    const next = current.filter((x) => x !== t);
                    setValue("tags", next, { shouldDirty: true });
                  }}
                  aria-label={`Remove ${t}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              placeholder={tags.length ? "" : "Type a tag and press Enter"}
              className="flex-1 min-w-[120px] bg-transparent outline-none h-7 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const input = (e.target as HTMLInputElement).value.trim();
                  if (!input) return;
                  const next = Array.from(
                    new Set([...(getValues("tags") || []), input.toLowerCase()])
                  );
                  setValue("tags", next, { shouldDirty: true });
                  (e.target as HTMLInputElement).value = "";
                }
                if (
                  e.key === "Backspace" &&
                  !(e.target as HTMLInputElement).value &&
                  tags.length
                ) {
                  const current = getValues("tags");
                  setValue("tags", current.slice(0, -1), { shouldDirty: true });
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Uploading..." : "Upload Document"}
        </Button>
      </div>
    </form>
  );
}
