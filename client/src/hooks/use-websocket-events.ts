import useWebSocket from 'react-use-websocket';
import React from 'react';
import type {
	WebSocketMessage,
	ClientWebSocketEvent,
	LibraryProcessingEvent,
	TrainingProgressEvent
} from '@athena-ai/server/types/websocket';

export interface WebSocketSubscriptionOptions {
	orgId: string;
	eventTypes?: string[];
	shouldReconnect?: boolean;
	reconnectInterval?: number;
	reconnectAttempts?: number;
}

export interface WebSocketState {
	isConnected: boolean;
	lastMessage: ClientWebSocketEvent | null;
	error: Event | null;
}

export function useWebSocketEvents<T extends ClientWebSocketEvent = ClientWebSocketEvent>(
	options: WebSocketSubscriptionOptions
) {
	const { orgId, eventTypes, shouldReconnect = true, reconnectInterval = 3000, reconnectAttempts = 5 } = options;

	// Construct WebSocket URL with organization ID
	const getWebSocketUrl = React.useCallback(() => {
		const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
		return `${baseUrl.replace('http', 'ws')}/ws?orgId=${orgId}`;
	}, [orgId]);

	// Handle incoming messages
	const onMessage = React.useCallback((event: MessageEvent) => {
		try {
			const data = JSON.parse(event.data) as WebSocketMessage;

			if (data.type === 'event' && data.payload) {
				// Transform server event to client event format
				const clientEvent: ClientWebSocketEvent = {
					type: data.payload.type || 'unknown',
					payload: data.payload.payload || data.payload,
					timestamp: data.payload.timestamp || new Date().toISOString()
				};

				return clientEvent;
			}
		} catch (error) {
			console.error('[WebSocket] Error parsing message:', error);
		}
		return null;
	}, []);

	// Filter events by type if specified
	const shouldHandleMessage = React.useCallback((event: ClientWebSocketEvent) => {
		if (!eventTypes || eventTypes.length === 0) return true;
		return eventTypes.includes(event.type);
	}, [eventTypes]);

	const {
		sendMessage,
		lastMessage,
		readyState,
		getWebSocket
	} = useWebSocket(getWebSocketUrl, {
		shouldReconnect: () => shouldReconnect,
		reconnectInterval,
		reconnectAttempts,
		onMessage: (event) => {
			const clientEvent = onMessage(event);
			if (clientEvent && shouldHandleMessage(clientEvent)) {
				// Store the filtered event
				return clientEvent;
			}
			return null;
		},
		filter: () => true, // Let the onMessage handle filtering
		share: true, // Share connection across components
	});

	const isConnected = readyState === 1; // WebSocket.OPEN

	// Send subscription message when connected
	React.useEffect(() => {
		if (isConnected) {
			sendMessage(JSON.stringify({
				type: 'subscribe',
				orgId
			} as WebSocketMessage));
		}
	}, [isConnected, sendMessage, orgId]);

	// Send unsubscribe message on cleanup
	React.useEffect(() => {
		return () => {
			if (isConnected) {
				sendMessage(JSON.stringify({
					type: 'unsubscribe',
					orgId
				} as WebSocketMessage));
			}
		};
	}, [isConnected, sendMessage, orgId]);

	return {
		isConnected,
		lastMessage: lastMessage as T | null,
		sendMessage,
		readyState,
		getWebSocket
	};
}

// Specific hooks for common event types
export function useLibraryProcessingEvents(
	orgId: string,
	libraryItemId?: string
) {
	const { lastMessage, ...rest } = useWebSocketEvents<LibraryProcessingEvent>({
		orgId,
		eventTypes: [
			'processing_started',
			'processing_progress',
			'processing_completed',
			'processing_failed'
		]
	});

	const filteredMessage = React.useMemo(() => {
		if (!lastMessage || !libraryItemId) return lastMessage;
		return lastMessage.payload.libraryItemId === libraryItemId ? lastMessage : null;
	}, [lastMessage, libraryItemId]);

	return {
		...rest,
		lastMessage: filteredMessage
	};
}

export function useTrainingProgressEvents(
	orgId: string,
	agentId?: string,
	libraryItemId?: string
) {
	const { lastMessage, ...rest } = useWebSocketEvents<TrainingProgressEvent>({
		orgId,
		eventTypes: [
			'training_started',
			'training_progress',
			'training_completed',
			'training_failed'
		]
	});

	const filteredMessage = React.useMemo(() => {
		if (!lastMessage) return null;

		// Filter by agent ID if specified
		if (agentId && lastMessage.payload.agentId !== agentId) {
			return null;
		}

		// Filter by library item ID if specified
		if (libraryItemId && lastMessage.payload.libraryItemId !== libraryItemId) {
			return null;
		}

		return lastMessage;
	}, [lastMessage, agentId, libraryItemId]);

	return {
		...rest,
		lastMessage: filteredMessage
	};
}

// Legacy hook for backward compatibility (can be removed after migration)
export function useWebSocketSubscription<T extends ClientWebSocketEvent>(
	orgId: string,
	eventType?: string,
	onEvent?: (event: T) => void
) {
	const { lastMessage, isConnected } = useWebSocketEvents<T>({
		orgId,
		eventTypes: eventType ? [eventType] : undefined
	});

	React.useEffect(() => {
		if (lastMessage && onEvent) {
			onEvent(lastMessage);
		}
	}, [lastMessage, onEvent]);

	return { isConnected, lastEvent: lastMessage };
}