import { create } from "zustand";

interface ChatStore {
	isCreatingAndSending: boolean;
	pendingMessage: string;
	newNonce: number;

	setIsCreatingAndSending: (isCreating: boolean) => void;
	setPendingMessage: (message: string) => void;
	bumpNewNonce: () => void;

	// Reset function to clear problematic state when navigating
	resetChatState: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
	isCreatingAndSending: false,
	pendingMessage: "",
	newNonce: 0,

	setIsCreatingAndSending: (isCreating) => set({ isCreatingAndSending: isCreating }),
	setPendingMessage: (message) => set({ pendingMessage: message }),
	bumpNewNonce: () => set((s) => ({ newNonce: s.newNonce + 1 })),

	resetChatState: () => set({
		isCreatingAndSending: false,
		pendingMessage: "",
	}),
}));
