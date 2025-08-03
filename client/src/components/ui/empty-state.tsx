import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface EmptyStateProps {
  title: string;
  description: string;
  icons?: LucideIcon[];
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icons = [],
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "bg-background border-border hover:border-border/80 text-center",
        "border-2 border-dashed rounded-xl p-14 w-full max-w-[620px]",
        "group hover:bg-muted/50 transition duration-500 hover:duration-200",
        className
      )}
    >
      <div className="flex justify-center isolate">
        {icons.length === 3 ? (
          <>
            <div className="bg-background size-12 grid place-items-center rounded-xl relative left-2.5 top-1.5 -rotate-6 shadow-lg ring-1 ring-border group-hover:-translate-x-3 group-hover:-rotate-12 group-hover:-translate-y-0.5 transition duration-800 group-hover:duration-500">
              {React.createElement(icons[0], {
                className: "w-6 h-6 text-muted-foreground",
              })}
            </div>
            <div className="bg-background size-12 grid place-items-center rounded-xl relative z-10 shadow-lg ring-1 ring-border group-hover:-translate-y-0.5 transition duration-800 group-hover:duration-500">
              {React.createElement(icons[1], {
                className: "w-6 h-6 text-muted-foreground",
              })}
            </div>
            <div className="bg-background size-12 grid place-items-center rounded-xl relative right-2.5 top-1.5 rotate-6 shadow-lg ring-1 ring-border group-hover:translate-x-3 group-hover:rotate-12 group-hover:-translate-y-0.5 transition duration-800 group-hover:duration-500">
              {React.createElement(icons[2], {
                className: "w-6 h-6 text-muted-foreground",
              })}
            </div>
          </>
        ) : (
          <motion.div
            className="bg-background size-12 grid place-items-center rounded-xl shadow-lg ring-1 ring-border"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {icons[0] &&
              React.createElement(icons[0], {
                className: "w-6 h-6 text-muted-foreground",
              })}
          </motion.div>
        )}
      </div>
      <h2 className="text-foreground font-medium mt-6">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
        {description}
      </p>
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.15 }}
        >
          <Button
            type="button"
            onClick={action.onClick}
            variant="outline"
            className={cn("mt-4", "shadow-sm active:shadow-none")}
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
