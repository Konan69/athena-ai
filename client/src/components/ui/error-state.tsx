import { cn } from "@/lib/utils";

export function ErrorState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-red-300 bg-red-50 text-red-800 p-4",
        className
      )}
    >
      {message}
    </div>
  );
}
