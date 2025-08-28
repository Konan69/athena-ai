import type { TrainingEvent } from "@/src/modules/RAG/events";
import { redisService, RedisService } from "@/src/config/redis";

export interface IEventService {
	publishTrainingEvent(event: TrainingEvent): Promise<void>;
	subscribe(
		orgId: string,
		onEvent: (event: TrainingEvent) => void
	): Promise<() => void>;
}

export class EventService implements IEventService {
	private static _instance: EventService | null = null;
	private subscriptions = new Map<string, Set<(event: TrainingEvent) => void>>();

	private constructor(private readonly redis: RedisService) {
		// Set max listeners to prevent warnings (adjust based on your needs)
		this.redis.subscriber.setMaxListeners(50);

		// Single message handler that delegates to channel-specific handlers
		this.redis.subscriber.on("message", this.handleMessage.bind(this));
	}

	static get instance(): EventService {
		if (!this._instance) {
			this._instance = new EventService(redisService);
		}
		return this._instance;
	}

	private handleMessage(message: string, channel: string): void {
		const handlers = this.subscriptions.get(channel);
		if (!handlers || handlers.size === 0) return;

		try {
			const parsed = JSON.parse(message) as TrainingEvent;
			handlers.forEach(handler => {
				try {
					handler(parsed);
				} catch (error) {
					console.error(`Error in event handler for channel ${channel}:`, error);
				}
			});
		} catch (error) {
			console.error(`Error parsing message for channel ${channel}:`, error);
		}
	}

	async publishTrainingEvent(event: TrainingEvent): Promise<void> {
		const payload = JSON.stringify(event);
		const trainingChannel = this.redis.makeTrainingChannel(event.orgId);
		console.log(`[EventService] Publishing event to channel ${trainingChannel}:`, event);
		// TODO: use effects instead of promises
		const result = await this.redis.publisher.publish(trainingChannel, payload);
		console.log(`[EventService] Published to ${result} subscribers`);
	}

	async subscribe(
		orgId: string,
		onEvent: (event: TrainingEvent) => void
	): Promise<() => void> {
		const channel = this.redis.makeTrainingChannel(orgId);

		// Initialize handlers set for this channel if it doesn't exist
		if (!this.subscriptions.has(channel)) {
			this.subscriptions.set(channel, new Set());
			// Only subscribe to Redis channel if this is the first handler for this channel
			await this.redis.subscriber.subscribe(channel);
		}

		// Add the handler to the channel's set
		const handlers = this.subscriptions.get(channel)!;
		handlers.add(onEvent);

		// Return cleanup function
		return async () => {
			const handlers = this.subscriptions.get(channel);
			if (!handlers) return;

			// Remove this specific handler
			handlers.delete(onEvent);

			// If no more handlers for this channel, clean up completely
			if (handlers.size === 0) {
				this.subscriptions.delete(channel);
				try {
					await this.redis.subscriber.unsubscribe(channel);
				} catch (error) {
					console.error(`Error unsubscribing from channel ${channel}:`, error);
				}
			}
		};
	}

	// Optional: Method to clean up all subscriptions (useful for testing or shutdown)
	async cleanup(): Promise<void> {
		for (const channel of this.subscriptions.keys()) {
			try {
				await this.redis.subscriber.unsubscribe(channel);
			} catch (error) {
				console.error(`Error unsubscribing from channel ${channel}:`, error);
			}
		}
		this.subscriptions.clear();
		this.redis.subscriber.removeAllListeners("message");
	}
}
export default EventService;


