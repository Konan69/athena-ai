// Agent metadata types 
export type AgentMetadata =
	| { type: "support"; config: SupportConfig }
	| { type: "whatsapp"; config: WhatsAppConfig };

export interface SupportConfig {
	availableHours?: string;
	escalationRules?: string[];
	ticketingSystemId?: string;
}

export interface WhatsAppConfig {
	phoneNumber?: string;
	businessHours?: string;
	autoResponseEnabled?: boolean;
	mediaHandling?: boolean;
}

// Request payload types
export interface CreateAgentPayload {
	name: string;
	agentType: "support" | "whatsapp";
	companyName?: string;
	description?: string;
	personalityTraits?: string[];
	customInstructions?: string;
	metadata?: AgentMetadata;
	knowledgeItems?: string[]; // libraryItem IDs
}

export interface UpdateAgentPayload {
	id: string;
	name?: string;
	description?: string;
	personalityTraits?: string[];
	customInstructions?: string;
	metadata?: AgentMetadata;
	isActive?: boolean;
}

export interface AgentChatRequest {
	agentId: string;
	message: string;
	organizationId: string;
	userId: string;
}