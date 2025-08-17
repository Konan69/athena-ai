import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AgentState {
	selectedAgent: string;
	setSelectedAgent: (agentId: string) => void;
}

export const useAgentStore = create<AgentState>()(
	persist(
		(set) => ({
			selectedAgent: "athenaAI",
			setSelectedAgent: (agentId: string) => set({ selectedAgent: agentId }),
		}),
		{
			name: "agent-store",
		}
	)
);
