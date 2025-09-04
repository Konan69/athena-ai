
import type { SupportConfig, WhatsAppConfig, AgentMetadata } from "../modules/agents/interfaces";

import type { Agent } from "../db/schemas/agent";

export interface AgentOption {
	id: string;
	name: string;
	description: string;
	badge?: string;
}

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
	{
		id: "supportAgent",
		name: "Support Agent",
		description: "Customer support specialist",
	},
	{
		id: "whatsappAgent",
		name: "WhatsApp Agent",
		description: "WhatsApp business assistant",
	},
] as const;


export const AgentIds = ["athenaAI", "ragAgent", "researchAgent", "supportAgent", "whatsappAgent"] as const;

export type {
	Agent,
	AgentMetadata,
	SupportConfig,
	WhatsAppConfig,
}