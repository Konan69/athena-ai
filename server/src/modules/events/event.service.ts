import type { TrainingEvent } from "@/src/modules/RAG/events";
import { redisService, RedisService } from "@/src/config/redis";

export interface IEventService {
	publishTrainingEvent(event: TrainingEvent): Promise<void>;
	subscribeUser(
		userId: string,
		onEvent: (event: TrainingEvent) => void
	): Promise<() => void>;
}

export class EventService implements IEventService {
	private static _instance: EventService | null = null;

	private constructor(private readonly redis: RedisService) { }

	static get instance(): EventService {
		if (!this._instance) {
			this._instance = new EventService(redisService);
		}
		return this._instance;
	}

	async publishTrainingEvent(event: TrainingEvent): Promise<void> {
		const payload = JSON.stringify(event);
		const userChannel = this.redis.makeUserChannel(event.userId);
		// TODO: use effects instead of promises
		await this.redis.publisher.publish(userChannel, payload)
	}

	async subscribeUser(
		userId: string,
		onEvent: (event: TrainingEvent) => void
	) {
		const channel = this.redis.makeUserChannel(userId);
		const handler = (message: string, ch: string) => {
			if (ch !== channel) return;
			const parsed = JSON.parse(message) as TrainingEvent;
			onEvent(parsed);
		};
		await this.redis.subscriber.subscribe(channel);
		this.redis.subscriber.on("message", handler);
		return async () => {
			this.redis.subscriber.off("message", handler);
			await this.redis.subscriber.unsubscribe(channel).catch(() => { });
		};
	}


}

export default EventService;


