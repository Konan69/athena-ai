// Import shared types from the server
export type {
	WebSocketMessage,
	ClientWebSocketEvent,
	LibraryProcessingEvent,
	TrainingProgressEvent,
	WebSocketEventPayload,
	isLibraryProcessingEvent,
	isTrainingProgressEvent
} from '@athena-ai/server/types/websocket';

// Client-specific types and utilities
export interface WebSocketSubscriptionOptions {
	orgId: string;
	eventTypes?: string[];
	onEvent?: (event: ClientWebSocketEvent) => void;
	shouldReconnect?: boolean;
	reconnectInterval?: number;
	reconnectAttempts?: number;
}

export interface WebSocketState {
	isConnected: boolean;
	lastMessage: ClientWebSocketEvent | null;
	error: Event | null;
}