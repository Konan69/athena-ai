import { create } from "zustand";

interface ChatStore {
	// Thread readiness state
	threadReady: Record<string, boolean>; // threadId -> ready state
	isCreatingAndSending: boolean;
	initializedThreads: Record<string, boolean>; // Track which threads we've initialized

	// Actions
	setThreadReady: (threadId: string, ready: boolean) => void;
	setIsCreatingAndSending: (isCreating: boolean) => void;
	resetChatState: (threadId: string) => void;
	initializeExistingThread: (threadId: string) => boolean; // Returns true if was already ready
}

export const useChatStore = create<ChatStore>((set, get) => ({
	threadReady: {},
	isCreatingAndSending: false,
	initializedThreads: {},

	setThreadReady: (threadId: string, ready: boolean) => set((state) => ({
		threadReady: {
			...state.threadReady,
			[threadId]: ready,
		},
	})),

	setIsCreatingAndSending: (isCreating: boolean) => set({
		isCreatingAndSending: isCreating,
	}),

	resetChatState: (threadId: string) => set((state) => ({
		threadReady: {
			...state.threadReady,
			[threadId]: false,
		},
		initializedThreads: {
			...state.initializedThreads,
			[threadId]: false,
		},
		isCreatingAndSending: false,
	})),

	initializeExistingThread: (threadId: string) => {
		const state = get();

		// If already initialized, return current ready state
		if (state.initializedThreads[threadId]) {
			return state.threadReady[threadId] || false;
		}

		// Mark as initialized and ready
		set((prevState) => ({
			initializedThreads: {
				...prevState.initializedThreads,
				[threadId]: true,
			},
			threadReady: {
				...prevState.threadReady,
				[threadId]: true,
			},
		}));

		return true;
	},
}));
