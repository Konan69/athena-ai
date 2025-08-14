import { toast } from "sonner";
import { trpc } from "@/integrations/tanstack-query/root-provider";
import type { TrainingEvent, LibraryItem } from "@athena-ai/server/types";
import { useQueryClient } from "@tanstack/react-query";


const EventHandler = () => {
	const qc = useQueryClient();

	trpc.trainingEvents.subscriptionOptions(undefined, {
		onData: (event: TrainingEvent) => {
			switch (event.type) {
				case "job_started": {
					qc.setQueryData(trpc.library.getLibraryItems.queryKey(), (prev: LibraryItem[] | undefined) => {
						if (!Array.isArray(prev)) return prev;
						return prev.map((it) => (it.id === event.jobId ? { ...it, status: "processing" as const } : it));
					});
					break;
				}
				case "job_progress": {
					// Optionally store progress in a separate cache entry if needed
					break;
				}
				case "job_completed": {
					qc.setQueryData(trpc.library.getLibraryItems.queryKey(), (prev: LibraryItem[] | undefined) => {
						if (!Array.isArray(prev)) return prev;
						return prev.map((item) => (item.id === event.jobId ? { ...item, status: "ready" as const } : item));
					});
					toast.success("Document is ready");
					break;
				}
				case "job_failed": {
					qc.setQueryData(trpc.library.getLibraryItems.queryKey(), (prev: LibraryItem[] | undefined) => {
						if (!Array.isArray(prev)) return prev;
						return prev.map((it) => (it.id === event.jobId ? { ...it, status: "failed" as const } : it));
					});
					toast.error(event.error.message);
					break;
				}
			}
		},
	});
}

export default EventHandler



