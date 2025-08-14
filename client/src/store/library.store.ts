import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { LibraryItem } from "@athena-ai/server/types";


type LibraryStatus = LibraryItem["status"];

export interface LibraryItemUI {
	id: string;
	title: string;
	description: string;
	uploadLink: string;
	fileSize: string;
	createdAt: string | Date | null;
	status: LibraryStatus;
	tags?: string[] | null;
}

interface LibraryState {
	items: LibraryItemUI[];
	jobProgress: Record<string, { percent: number; stage: string; message?: string }>;
}

interface LibraryActions {
	setItems: (items: LibraryItemUI[]) => void;
	addProcessingItem: (payload: {
		title: string;
		description: string;
		fileSize: string;
		tags?: string[];
		uploadLink: string;
	}) => void;
	updateItemStatus: (id: string, status: LibraryStatus) => void;
	upsertJobProgress: (
		jobId: string,
		progress: { percent: number; stage: string; message?: string }
	) => void;
}

export const useLibraryStore = create(
	immer<LibraryState & LibraryActions>((set) => ({
		items: [],
		jobProgress: {},
		setItems: (items) => set((s) => {
			s.items = items;
		}),
		addProcessingItem: (payload) =>
			set((s) => {
				const optimistic: LibraryItemUI = {
					id: Date.now().toString(),
					title: payload.title,
					description: payload.description,
					uploadLink: payload.uploadLink,
					fileSize: payload.fileSize,
					tags: payload.tags ?? [],
					createdAt: new Date(),
					status: "processing",
				};
				s.items.push(optimistic);
			}),
		updateItemStatus: (id, status) =>
			set((s) => {
				const target = s.items.find((i: LibraryItemUI) => i.id === id);
				if (target) target.status = status;
			}),
		upsertJobProgress: (jobId, progress) =>
			set((s) => {
				s.jobProgress[jobId] = progress;
			}),
	}))
);


