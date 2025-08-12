import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type LibraryStatus = "processing" | "ready" | "failed";

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
}

export const useLibraryStore = create(
	immer<LibraryState & LibraryActions>((set) => ({
		items: [],
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
	}))
);


