// Server-side WebSocket types that will be shared with the client

export interface WebSocketMessage {
	type: "subscribe" | "unsubscribe" | "event" | "error" | "ping" | "pong";
	payload?: any;
	channel?: string;
	orgId?: string;
}

export interface ClientInfo {
	orgId: string;
	channels: Set<string>;
	lastPing: number;
}

export interface ClientWebSocketEvent {
	type: string;
	payload: any;
	timestamp: string;
}

export interface LibraryProcessingEvent {
	type: 'processing_started' | 'processing_progress' | 'processing_completed' | 'processing_failed';
	payload: {
		libraryItemId: string;
		status: 'processing' | 'ready' | 'failed';
		progress?: number;
		error?: string;
		message?: string;
	};
	orgId: string;
	timestamp: string;
}

export interface TrainingProgressEvent {
	type: 'training_started' | 'training_progress' | 'training_completed' | 'training_failed';
	payload: {
		agentId?: string;
		libraryItemId?: string;
		progress: number;
		message: string;
		error?: string;
	};
	orgId: string;
	timestamp: string;
}

export interface WebSocketLike {
	send(data: string | Uint8Array): void;
	close(code?: number, reason?: string): void;
	readyState: number;
}

// Union type of all possible events
export type WebSocketEventPayload =
	| LibraryProcessingEvent
	| TrainingProgressEvent
	| ClientWebSocketEvent;

// Helper type guards
export function isLibraryProcessingEvent(event: ClientWebSocketEvent): event is LibraryProcessingEvent {
	return [
		'processing_started',
		'processing_progress',
		'processing_completed',
		'processing_failed'
	].includes(event.type);
}

export function isTrainingProgressEvent(event: ClientWebSocketEvent): event is TrainingProgressEvent {
	return [
		'training_started',
		'training_progress',
		'training_completed',
		'training_failed'
	].includes(event.type);
}