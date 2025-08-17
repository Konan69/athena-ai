import Redis from "ioredis";
import { env } from "./env";

export class RedisService {

	private _publisher: Redis;
	private _reader: Redis
	private _subscriber: Redis;

	constructor(url: string) {
		this._publisher = new Redis(url);
		this._subscriber = new Redis(url);
		this._reader = new Redis(url);
	}

	get publisher(): Redis {
		return this._publisher;
	}

	get subscriber(): Redis {
		return this._subscriber;
	}

	get reader(): Redis {
		return this._reader;
	}

	makeVectorIndexCacheKey(indexName: string): string {
		return `vector_index_exists:${indexName}`;
	}

	async setVectorIndexCacheKey(cacheKey: string): Promise<void> {
		await this._publisher.set(cacheKey, 'true');
	}

	makeUserChannel(userId: string): string {
		return `user:${userId}:training`;
	}

	makeJobChannel(jobId: string): string {
		return `job:${jobId}`;
	}

}

export const redisService = new RedisService(env.REDIS_URL);
