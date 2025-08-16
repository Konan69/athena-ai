import Redis from "ioredis";
import { env } from "./env";

export class RedisService {
	private static _instance: RedisService | null = null;
	private _publisher: Redis;
	private _subscriber: Redis;

	private constructor(url: string) {
		this._publisher = new Redis(url);
		this._subscriber = new Redis(url);
	}

	static get instance(): RedisService {
		if (!this._instance) {
			this._instance = new RedisService(env.REDIS_URL);
		}
		return this._instance;
	}

	get publisher(): Redis {
		return this._publisher;
	}

	get subscriber(): Redis {
		return this._subscriber;
	}

	makeUserChannel(userId: string): string {
		return `user:${userId}:training`;
	}

	makeJobChannel(jobId: string): string {
		return `job:${jobId}`;
	}

	async disconnect(): Promise<void> {
		await Promise.all([this._publisher.quit(), this._subscriber.quit()]);
	}
}


