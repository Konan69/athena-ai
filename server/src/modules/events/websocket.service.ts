import type { TrainingEvent } from "@/src/modules/RAG/events";
import { EventService } from "./event.service";
import type {
	WebSocketMessage,
	WebSocketLike,
	ClientInfo,
	ClientWebSocketEvent,
	LibraryProcessingEvent,
	TrainingProgressEvent
} from "@/src/types/websocket";

// Re-export the types for convenience
export type {
	WebSocketMessage,
	WebSocketLike,
	ClientInfo,
	ClientWebSocketEvent,
	LibraryProcessingEvent,
	TrainingProgressEvent
};

export class WebSocketService {
	private static _instance: WebSocketService | null = null;
	private connections = new Map<WebSocketLike, ClientInfo>();
	private channels = new Map<string, Set<WebSocketLike>>();

	private constructor() {}

	static get instance(): WebSocketService {
		if (!this._instance) {
			this._instance = new WebSocketService();
		}
		return this._instance;
	}

	/**
	 * Handle incoming WebSocket messages
	 */
	public async handleMessage(ws: WebSocketLike, message: WebSocketMessage): Promise<void> {
		switch (message.type) {
			case "subscribe":
				await this.handleSubscribe(ws, message);
				break;
			case "unsubscribe":
				await this.handleUnsubscribe(ws, message);
				break;
			case "ping":
				this.sendMessage(ws, { type: "pong" });
				break;
			case "pong":
				// Update last ping time
				const clientInfo = this.connections.get(ws);
				if (clientInfo) {
					clientInfo.lastPing = Date.now();
				}
				break;
			default:
				console.warn(`[WebSocket] Unknown message type: ${message.type}`);
		}
	}

	/**
	 * Handle subscription to organization events
	 */
	private async handleSubscribe(ws: WebSocketLike, message: WebSocketMessage): Promise<void> {
		if (!message.orgId) {
			this.sendError(ws, "Organization ID is required for subscription");
			return;
		}

		const orgId = message.orgId;
		const channel = this.getChannelName(orgId);

		// Get or create client info
		let clientInfo = this.connections.get(ws);
		if (!clientInfo) {
			clientInfo = {
				orgId,
				channels: new Set(),
				lastPing: Date.now()
			};
			this.connections.set(ws, clientInfo);
		}

		// Add channel to client's subscriptions
		clientInfo.channels.add(channel);

		// Add client to channel
		if (!this.channels.has(channel)) {
			this.channels.set(channel, new Set());
		}
		this.channels.get(channel)!.add(ws);

		// Subscribe to Redis events for this organization
		EventService.instance.subscribe(orgId, (event: TrainingEvent) => {
			this.broadcastToChannel(channel, {
				type: "event",
				payload: event
			});
		});

		console.log(`[WebSocket] Client subscribed to events for org: ${orgId}`);
		this.sendMessage(ws, {
			type: "event",
			payload: { message: `Subscribed to events for organization ${orgId}` }
		});
	}

	/**
	 * Handle unsubscription from organization events
	 */
	private async handleUnsubscribe(ws: WebSocketLike, message: WebSocketMessage): Promise<void> {
		if (!message.orgId) {
			this.sendError(ws, "Organization ID is required for unsubscription");
			return;
		}

		const orgId = message.orgId;
		const channel = this.getChannelName(orgId);
		const clientInfo = this.connections.get(ws);

		if (clientInfo && clientInfo.channels.has(channel)) {
			// Remove channel from client
			clientInfo.channels.delete(channel);

			// Remove client from channel
			const channelClients = this.channels.get(channel);
			if (channelClients) {
				channelClients.delete(ws);
				if (channelClients.size === 0) {
					this.channels.delete(channel);
				}
			}

			// Remove client if no more subscriptions
			if (clientInfo.channels.size === 0) {
				this.connections.delete(ws);
			}

			console.log(`[WebSocket] Client unsubscribed from events for org: ${orgId}`);
			this.sendMessage(ws, {
				type: "event",
				payload: { message: `Unsubscribed from events for organization ${orgId}` }
			});
		}
	}

	/**
	 * Broadcast message to all clients in a channel
	 */
	private broadcastToChannel(channel: string, message: WebSocketMessage): void {
		const channelClients = this.channels.get(channel);
		if (!channelClients || channelClients.size === 0) return;

		const messageStr = JSON.stringify(message);
		channelClients.forEach((ws) => {
			try {
				if (ws.readyState === 1) { // WebSocket.OPEN
					ws.send(messageStr);
				}
			} catch (error) {
				console.error(`[WebSocket] Error broadcasting to client:`, error);
				// Remove problematic client
				this.handleDisconnection(ws);
			}
		});
	}

	/**
	 * Handle WebSocket disconnection (simplified for Hono)
	 */
	public handleDisconnection(ws?: WebSocketLike): void {
		if (ws) {
			this.cleanupConnection(ws);
		}
		console.log(`[WebSocket] Connection closed`);
	}

	/**
	 * Clean up a specific WebSocket connection
	 */
	private cleanupConnection(ws: WebSocketLike): void {
		const clientInfo = this.connections.get(ws);
		if (clientInfo) {
			// Remove client from all channels
			clientInfo.channels.forEach((channel) => {
				const channelClients = this.channels.get(channel);
				if (channelClients) {
					channelClients.delete(ws);
					if (channelClients.size === 0) {
						this.channels.delete(channel);
					}
				}
			});

			// Remove client
			this.connections.delete(ws);
		}
	}

	/**
	 * Send message to specific client
	 */
	private sendMessage(ws: WebSocketLike, message: WebSocketMessage): void {
		try {
			ws.send(JSON.stringify(message));
		} catch (error) {
			console.error(`[WebSocket] Error sending message:`, error);
		}
	}

	/**
	 * Send error message to client
	 */
	private sendError(ws: WebSocketLike, error: string): void {
		this.sendMessage(ws, {
			type: "error",
			payload: { error }
		});
	}

	/**
	 * Get channel name for organization
	 */
	private getChannelName(orgId: string): string {
		return `training:${orgId}`;
	}

	/**
	 * Get statistics
	 */
	public getStats() {
		return {
			totalConnections: this.connections.size,
			totalChannels: this.channels.size,
			channels: Object.fromEntries(
				Array.from(this.channels.entries()).map(([name, clients]) => [
					name,
					clients.size
				])
			)
		};
	}

	/**
	 * Clean up all connections (for shutdown)
	 */
	cleanup(): void {
		console.log(`[WebSocket] Cleaning up ${this.connections.size} connections`);
		this.connections.forEach((_, ws) => {
			try {
				ws.close(1000, "Server shutdown");
			} catch (error) {
				console.error(`[WebSocket] Error closing connection:`, error);
			}
		});
		this.connections.clear();
		this.channels.clear();
	}
}

export default WebSocketService;