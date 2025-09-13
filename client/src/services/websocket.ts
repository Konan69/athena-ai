import React from 'react';
import type { TrainingEvent } from "@/types/training";

export interface WebSocketMessage {
	type: "subscribe" | "unsubscribe" | "event" | "error" | "ping" | "pong";
	payload?: any;
	channel?: string;
	orgId?: string;
}

export interface ClientWebSocketEvent {
	type: string;
	payload: any;
	timestamp: string;
}

export class WebSocketService {
	private ws: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;
	private isAuthenticated = false;
	private subscriptions = new Map<string, Set<(event: ClientWebSocketEvent) => void>>();
	private pingInterval: NodeJS.Timeout | null = null;
	private orgId: string | null = null;

	constructor(private baseUrl: string) {}

	/**
	 * Connect to WebSocket server
	 */
	async connect(authToken: string, orgId?: string): Promise<void> {
		if (this.ws?.readyState === WebSocket.OPEN) {
			return;
		}

		this.orgId = orgId || null;
		const wsUrl = `${this.baseUrl.replace('http', 'ws')}/ws?orgId=${orgId || ''}`;

		return new Promise((resolve, reject) => {
			try {
				this.ws = new WebSocket(wsUrl);

				this.ws.onopen = () => {
					console.log('[WebSocket] Connected to server');
					this.isAuthenticated = true;
					this.reconnectAttempts = 0;
					this.startPingInterval();
					resolve();
				};

				this.ws.onmessage = (event) => {
					this.handleMessage(event);
				};

				this.ws.onclose = () => {
					console.log('[WebSocket] Disconnected from server');
					this.isAuthenticated = false;
					this.cleanup();
					this.attemptReconnect();
				};

				this.ws.onerror = (error) => {
					console.error('[WebSocket] Error:', error);
					reject(error);
				};

				// Send authentication
				if (authToken) {
					// Note: In a real implementation, you might send auth in headers or
					// use a separate auth message. For now, we rely on the auth middleware
					// in the WebSocket route which will validate the session.
				}
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Disconnect from WebSocket server
	 */
	disconnect(): void {
		if (this.ws) {
			this.ws.close(1000, 'Client disconnect');
			this.cleanup();
		}
	}

	/**
	 * Subscribe to organization events
	 */
	async subscribeToOrgEvents(orgId: string, onEvent: (event: ClientWebSocketEvent) => void): Promise<() => void> {
		if (!this.isAuthenticated || !this.ws) {
			throw new Error('WebSocket not connected');
		}

		const subscriptionKey = `org:${orgId}`;

		if (!this.subscriptions.has(subscriptionKey)) {
			this.subscriptions.set(subscriptionKey, new Set());
		}

		const handlers = this.subscriptions.get(subscriptionKey)!;
		handlers.add(onEvent);

		// Send subscription message
		this.sendMessage({
			type: 'subscribe',
			orgId
		});

		console.log(`[WebSocket] Subscribed to events for org: ${orgId}`);

		// Return unsubscribe function
		return () => {
			const handlers = this.subscriptions.get(subscriptionKey);
			if (handlers) {
				handlers.delete(onEvent);
				if (handlers.size === 0) {
					this.subscriptions.delete(subscriptionKey);
					// Send unsubscribe message
					this.sendMessage({
						type: 'unsubscribe',
						orgId
					});
				}
			}
		};
	}

	/**
	 * Send message to server
	 */
	private sendMessage(message: WebSocketMessage): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		}
	}

	/**
	 * Handle incoming messages
	 */
	private handleMessage(event: MessageEvent): void {
		try {
			const data = JSON.parse(event.data) as WebSocketMessage;

			switch (data.type) {
				case 'event':
					if (data.payload) {
						const clientEvent: ClientWebSocketEvent = {
							type: data.payload.type || 'unknown',
							payload: data.payload.payload || data.payload,
							timestamp: data.payload.timestamp || new Date().toISOString()
						};

						// Broadcast to all relevant subscriptions
						this.broadcastEvent(clientEvent);
					}
					break;

				case 'error':
					console.error('[WebSocket] Server error:', data.payload);
					break;

				case 'ping':
					this.sendMessage({ type: 'pong' });
					break;

				case 'pong':
					// Server acknowledged our ping
					break;

				default:
					console.warn('[WebSocket] Unknown message type:', data.type);
			}
		} catch (error) {
			console.error('[WebSocket] Error parsing message:', error);
		}
	}

	/**
	 * Broadcast event to relevant subscribers
	 */
	private broadcastEvent(event: ClientWebSocketEvent): void {
		// If event has org information, broadcast to org-specific subscribers
		if (event.payload?.orgId) {
			const orgKey = `org:${event.payload.orgId}`;
			const handlers = this.subscriptions.get(orgKey);
			if (handlers) {
				handlers.forEach(handler => {
					try {
						handler(event);
					} catch (error) {
						console.error('[WebSocket] Error in event handler:', error);
					}
				});
			}
		}

		// Broadcast to global subscribers if any
		const globalHandlers = this.subscriptions.get('global');
		if (globalHandlers) {
			globalHandlers.forEach(handler => {
				try {
					handler(event);
				} catch (error) {
					console.error('[WebSocket] Error in global event handler:', error);
				}
			});
		}
	}

	/**
	 * Start ping interval for connection health
	 */
	private startPingInterval(): void {
		this.cleanupPingInterval();

		this.pingInterval = setInterval(() => {
			if (this.ws?.readyState === WebSocket.OPEN) {
				this.sendMessage({ type: 'ping' });
			} else {
				this.cleanupPingInterval();
			}
		}, 30000); // Ping every 30 seconds
	}

	/**
	 * Attempt to reconnect to server
	 */
	private attemptReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('[WebSocket] Max reconnection attempts reached');
			return;
		}

		this.reconnectAttempts++;
		const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

		console.log(`[WebSocket] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

		setTimeout(() => {
			if (this.orgId) {
				// Reconnect with the same org ID
				this.connect('', this.orgId).catch((error) => {
					console.error('[WebSocket] Reconnection failed:', error);
				});
			}
		}, delay);
	}

	/**
	 * Cleanup resources
	 */
	private cleanup(): void {
		this.cleanupPingInterval();
		this.ws = null;
		this.isAuthenticated = false;
	}

	/**
	 * Cleanup ping interval
	 */
	private cleanupPingInterval(): void {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
	}

	/**
	 * Get connection status
	 */
	get isConnected(): boolean {
		return this.isAuthenticated && this.ws?.readyState === WebSocket.OPEN;
	}
}

// Global WebSocket service instance
export const wsService = new WebSocketService(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');

// React hook for WebSocket subscriptions
export function useWebSocketSubscription<T extends ClientWebSocketEvent>(
	orgId: string,
	eventType?: string,
	onEvent?: (event: T) => void
) {
	const [isConnected, setIsConnected] = React.useState(false);
	const [lastEvent, setLastEvent] = React.useState<T | null>(null);

	React.useEffect(() => {
		let unsubscribe: (() => void) | null = null;

		const setupSubscription = async () => {
			try {
				// Connect if not already connected
				if (!wsService.isConnected) {
					await wsService.connect('', orgId);
				}

				setIsConnected(wsService.isConnected);

				// Subscribe to events
				unsubscribe = await wsService.subscribeToOrgEvents(orgId, (event) => {
					if (!eventType || event.type === eventType) {
						setLastEvent(event as T);
						onEvent?.(event as T);
					}
				});
			} catch (error) {
				console.error('[WebSocket] Failed to set up subscription:', error);
				setIsConnected(false);
			}
		};

		setupSubscription();

		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, [orgId, eventType, onEvent]);

	return { isConnected, lastEvent };
}