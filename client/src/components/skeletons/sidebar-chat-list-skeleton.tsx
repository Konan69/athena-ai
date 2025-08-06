import { Skeleton } from "@/components/ui/skeleton";

export function SidebarChatListSkeleton() {
  const Row = () => (
    <div
      data-slot="sidebar-menu-button"
      className="peer/menu-button flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm"
    >
      <Skeleton className="h-4 w-2/3" />
    </div>
  );

  const Group = ({
    labelWidth = "w-20",
    rows = 2,
  }: {
    labelWidth?: string;
    rows?: number;
  }) => (
    <div
      data-slot="sidebar-group"
      className="relative flex w-full min-w-0 flex-col p-2"
    >
      <div
        data-slot="sidebar-group-label"
        className="flex h-8 shrink-0 items-center rounded-md px-2"
      >
        <div className={labelWidth}>
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div
        data-slot="sidebar-menu"
        className="flex w-full min-w-0 flex-col gap-1"
      >
        {Array.from({ length: rows }).map((_, i) => (
          <Row key={i} />
        ))}
      </div>
    </div>
  );

  return (
    <div
      data-slot="sidebar-content"
      className="flex min-h-0 flex-1 flex-col gap-2"
    >
      <Group labelWidth="w-16" rows={3} /> {/* Recent */}
      <Group labelWidth="w-24" rows={2} /> {/* Previous 7 Days */}
      <Group labelWidth="w-28" rows={2} /> {/* Previous 30 Days */}
    </div>
  );
}
