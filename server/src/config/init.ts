import { vectorStore } from './storage';
import db from '../db';
import { RAGconstants } from '../lib/constants';
import { sql } from 'drizzle-orm';
import { redisService } from './redis';
import { createLogger } from './logger';

const logger = createLogger().child({ service: 'initialization' });

/**
 * Check Redis connectivity
 */
async function checkRedisConnectivity(): Promise<boolean> {
	try {
		const result = await redisService.publisher.ping();
		return result === 'PONG';
	} catch (error) {
		logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Redis connection failed');
		return false;
	}
}

/**
 * Check if vector store has been initialized using Redis cache
 */
async function checkVectorStoreCache(): Promise<boolean> {
	try {
		const cacheKey = redisService.makeVectorIndexCacheKey(RAGconstants.indexName);
		const cached = await redisService.publisher.get(cacheKey);
		return cached === 'true';
	} catch (error) {
		logger.warn({ error: error instanceof Error ? error.message : String(error) }, 'Could not check vector store cache');
		return false;
	}
}

/**
 * Cache the vector store initialization status in Redis
 */
async function setVectorStoreCache(initialized: boolean): Promise<void> {
	try {
		const cacheKey = redisService.makeVectorIndexCacheKey(RAGconstants.indexName);
		if (initialized) {
			await redisService.setVectorIndexCacheKey(cacheKey);
		} else {
			await redisService.publisher.del(cacheKey);
		}
	} catch (error) {
		logger.warn({ error: error instanceof Error ? error.message : String(error) }, 'Could not update vector store cache');
	}
}

/**
 * Check if a PostgreSQL table exists
 */
async function checkTableExists(tableName: string): Promise<boolean> {
	try {
		const result = await db.execute(sql`
			SELECT EXISTS (
				SELECT 1
				FROM information_schema.tables
				WHERE table_schema = 'public'
				AND table_name = ${tableName}
			)
		`);
		return result.rows[0]?.exists as boolean || false;
	} catch (error) {
		logger.warn({ error: error instanceof Error ? error.message : String(error) }, 'Could not check table existence');
		return false;
	}
}

/**
 * Initialize the vector store index
 */
async function initializeVectorStore(): Promise<void> {
	try {
		// Check cache first
		const isCached = await checkVectorStoreCache();
		if (isCached) {
			logger.info('Vector store already initialized (cached)');
			return;
		}

		// Fallback to checking table existence
		const tableExists = await checkTableExists(RAGconstants.indexName);
		if (tableExists) {
			logger.info('Vector store index exists, updating cache');
			await setVectorStoreCache(true);
			return;
		}

		logger.info('Creating vector store index');
		await vectorStore.createIndex({
			indexName: RAGconstants.indexName,
			dimension: RAGconstants.dimensions,
			metric: RAGconstants.metric
		});

		await setVectorStoreCache(true);
		logger.info('Vector store index created successfully');

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		// Handle race condition where index was created by another process
		if (errorMessage.includes('already exists')) {
			logger.info('Index created by another process, updating cache');
			await setVectorStoreCache(true);
			return;
		}

		logger.warn({ error: errorMessage }, 'Vector store initialization failed, continuing');
	}
}

/**
 * Initialize all services on server startup
 */
export async function initializeServices(): Promise<void> {
	logger.info('Starting service initialization');

	try {
		// Check Redis connectivity
		const redisConnected = await checkRedisConnectivity();
		if (!redisConnected) {
			logger.fatal('Redis connection failed - cannot proceed');
			process.exit(1);
		}

		// Initialize vector store
		await initializeVectorStore();


	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.fatal({ error: errorMessage }, 'Service initialization failed');
		process.exit(1);
	}
}
