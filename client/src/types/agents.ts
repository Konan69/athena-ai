export interface AgentOption {
	id: string;
	name: string;
	description: string;
	badge?: string;
}
//TODO: export type from server
export const AVAILABLE_AGENTS: AgentOption[] = [
	{
		id: "athenaAI",
		name: "Athena AI",
		description: "Intelligent assistant with web search and memory",
		badge: "Primary",
	},
	{
		id: "ragAgent",
		name: "RAG Agent",
		description: "Document retrieval and analysis specialist",
	},
	{
		id: "researchAgent",
		name: "Research Agent",
		description: "Comprehensive web research assistant",
	},
];
