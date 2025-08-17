import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { ChunkParams, MDocument } from "@mastra/rag";
import { s3Client, vectorStore } from "@/src/config/storage";
import { jobCompletedEvent, jobFailedEvent, jobProgressEvent, jobStartedEvent } from "@/src/modules/RAG/events";
import { EventService } from "@/src/modules/events/event.service";
import { Effect } from "effect";
import db from "@/src/db";
import { libraryItem } from "@/src/db/schemas";
import { eq } from "drizzle-orm";
import type { TrainingRequest, SupportedExtractor } from "@/src/modules/RAG/types";
import { PdfExtractor } from "@/src/modules/RAG/strategies/pdfExtractor";
import { JsonExtractor } from "@/src/modules/RAG/strategies/jsonExtractor";
import { TextExtractor } from "@/src/modules/RAG/strategies/textExtractor";
import { MarkdownExtractor } from "@/src/modules/RAG/strategies/markdownExtractor";
import { HtmlExtractor } from "@/src/modules/RAG/strategies/htmlExtractor";
import { RAGconstants } from "@/src/lib/constants";
import { redisService } from "@/src/config/redis";
import { getIndexName } from "@/src/lib/utils";


class RAGService {
	private s3;
	private vectorStore;
	private events: EventService;
	private redis
	private constants

	constructor() {
		this.s3 = s3Client;
		this.constants = RAGconstants
		this.vectorStore = vectorStore;
		this.events = EventService.instance;
		this.redis = redisService;
	}

	// TODO: fix metadata and metadata filtering to the document using runtimeContext
	// TODO: add organization tenancy
	// TODO: add doc embedding updates for new versions of the same doc or text based docs


	// TODO: Replace this base method with a robust queue implementation for reliable background job processing.
	// The queue logic should be abstracted behind a generic message broker interface to allow for future portability (e.g., switching to RabbitMQ, SQS, etc.).
	// This interface will define methods for enqueuing, processing, and managing jobs, and the BullMQ implementation will be the v0.
	// The rest of the RAG service will interact only with the interface, not the concrete BullMQ implementation.
	// This approach ensures reliability, scalability, and flexibility for future infrastructure changes.
	async train(input: TrainingRequest) {
		const startTime = performance.now();
		try {
			const { userId, item } = input;
			const jobId = item.id;
			const objectKey = item.uploadLink;
			const title = item.title;

			console.log("[RAGService.train] Step 1: Mark job started and publish event");
			const started = jobStartedEvent.parse({
				type: "job_started",
				jobId,
				userId,
				createdAt: new Date().toISOString(),
				totalSteps: 3,
				title: item.title,
			});
			await Effect.runPromise(Effect.tryPromise({
				try: async () => { // TODO: use effects instead of promises
					await db.update(libraryItem).set({ status: "processing" }).where(eq(libraryItem.id, jobId));
					await this.events.publishTrainingEvent(started);
				},
				catch: (e) => { throw e as Error; }
			}));

			console.log("[RAGService.train] Step 2: Download from S3 and detect content type");
			const { buffer: docBuffer, contentType } = await this.downloadFromS3(objectKey);

			console.log("[RAGService.train] Step 3: Extract text using strategy based on objectKey/optional override");
			await this.publishProgress({ userId, jobId, stage: "chunking", currentStep: 1, totalSteps: 3, percent: 10, message: "Extracting and chunking document" });
			const extractorType = this.deriveExtractorType(objectKey, input.forceExtractor, contentType);
			const text = await this.extractText(extractorType, docBuffer);

			console.log("[RAGService.train] Step 4: Chunk document");
			const doc = this.createMDocument(extractorType, text);
			const chunks = await doc.chunk(this.getChunkingParams(extractorType));

			console.log("[RAGService.train] Step 5: Generate embeddings");
			await this.publishProgress({ userId, jobId, stage: "embedding", currentStep: 2, totalSteps: 3, percent: 50, message: `Generating ${chunks.length} embeddings` });
			const { embeddings, usage } = await embedMany({
				values: chunks.map((chunk) => chunk.text),
				model: openai.embedding("text-embedding-3-small", { dimensions: this.constants.dimensions }),
			});

			console.log("[RAGService.train] Step 6: Index vectors");
			await this.publishProgress({ userId, jobId, stage: "indexing", currentStep: 3, totalSteps: 3, percent: 80, message: "Indexing vectors" });
			const indexName = await this.ensureIndexExists(userId);
			console.log("[RAGService.train] Step 6: Index vectors", usage);

			await this.vectorStore.upsert({
				indexName,
				vectors: embeddings,
				metadata: chunks.map((c) => (
					{
						text: c.text, itemId: jobId,
						source: objectKey,
						title,
						tags: item.tags,
					})),
			});

			console.log("[RAGService.train] Step 7: Mark job complete and publish event");
			await Effect.runPromise(Effect.tryPromise({
				try: async () => {
					await db.update(libraryItem).set({ status: "ready" }).where(eq(libraryItem.id, jobId));
					await this.events.publishTrainingEvent(jobCompletedEvent.parse({
						type: "job_completed",
						jobId,
						userId,
						createdAt: new Date().toISOString(),
						durationMs: performance.now() - startTime,
					}));
				},
				catch: (e) => { throw e as Error; }
			}));

		} catch (error) {
			console.log("[RAGService.train] Step ERROR: Job failed", error);
			// Fail job gracefully
			const err = error as Error;
			try { // TODO: type errors and handle with effects
				// Best effort publish failure; we don't know userId/jobId here unless request parsed
				// The caller always passes TrainingRequest, so we can still reference it
				const anyInput = (arguments?.[0] as any) ?? {};
				const userId = anyInput.userId as string | undefined;
				const jobId = (anyInput.item?.id as string | undefined) ?? anyInput.jobId;
				if (userId && jobId) {
					await this.events.publishTrainingEvent(jobFailedEvent.parse({
						type: "job_failed",
						jobId,
						userId,
						createdAt: new Date().toISOString(),
						error: { name: err.name || "Error", message: err.message, retryable: false },
					}));
					await db.update(libraryItem).set({ status: "failed" }).where(eq(libraryItem.id, jobId)).catch(() => { });
				}
			} catch { }
			throw err;
		}
	}

	// make this useable by the library service
	async removeDocument(input: { userId: string, itemId: string }) {
		const { userId, itemId } = input;
		await this.vectorStore.deleteVector({
			indexName: `user_${userId}`,
			id: itemId,
		}); // TODO: add org support
		await db.update(libraryItem).set({ status: "pending" }).where(eq(libraryItem.id, itemId));
	}

	private async downloadFromS3(objectKey: string): Promise<{ buffer: ArrayBuffer; contentType?: string }> {
		const file = this.s3.file(objectKey);
		const buffer = await file.arrayBuffer();
		const type = file.type
		return { buffer, contentType: type };
	}

	private deriveExtractorType(objectKey: string, override?: SupportedExtractor, contentType?: string): SupportedExtractor {
		if (override) return override;

		// Prefer contentType when available
		if (contentType) {
			const ct = contentType.toLowerCase();
			if (ct.includes("pdf")) return "pdf";
			if (ct.includes("markdown") || ct === "text/md" || ct === "text/x-markdown") return "markdown";
			if (ct.includes("html") || ct.includes("xhtml")) return "html";
			if (ct.includes("json")) return "json";
			if (ct.startsWith("text/")) return "text";
		}

		// Fallback to file extension
		const ext = objectKey.split(".").pop()?.toLowerCase();
		switch (ext) {
			case "pdf":
				return "pdf";
			case "md":
			case "markdown":
				return "markdown";
			case "htm":
			case "html":
				return "html";
			case "json":
				return "json";
			default:
				return "text";
		}
	}

	private async extractText(type: SupportedExtractor, buffer: ArrayBuffer): Promise<string> {
		const strategy = this.resolveExtractor(type);
		const { text } = await strategy.extract(buffer);
		return text;
	}

	private resolveExtractor(type: SupportedExtractor) {
		switch (type) {
			case "pdf":
				return new PdfExtractor();
			case "markdown":
				return new MarkdownExtractor();
			case "html":
				return new HtmlExtractor();
			case "json":
				return new JsonExtractor();
			case "text":
			default:
				return new TextExtractor();
		}
	}

	private createMDocument(type: SupportedExtractor, text: string): MDocument {
		switch (type) {
			case "markdown":
				return MDocument.fromMarkdown(text);
			case "html":
				return MDocument.fromHTML(text);
			case "json":
				return MDocument.fromJSON(text);
			default:
				return MDocument.fromText(text);
		}
	}

	private async publishProgress(params: {
		userId: string;
		jobId: string;
		stage: "chunking" | "embedding" | "indexing";
		currentStep: number;
		totalSteps: number;
		percent: number;
		message?: string;
	}) {
		const { userId, jobId, stage, currentStep, totalSteps, percent, message } = params;
		await this.events.publishTrainingEvent(jobProgressEvent.parse({
			type: "job_progress",
			jobId,
			userId,
			createdAt: new Date().toISOString(),
			stage,
			currentStep,
			totalSteps,
			percent,
			message,
		}));
	}

	async ensureIndexExists(userId: string) {
		const indexName = getIndexName(userId);

		const cacheKey = this.redis.makeVectorIndexCacheKey(indexName)

		// Check Redis cache first
		const cached = await this.redis.reader.get(cacheKey);
		if (cached === 'true') {
			return indexName;
		}

		// Check if index exists first
		const indexes = await this.vectorStore.listIndexes();
		const exists = indexes.some(index => index === indexName);

		if (!exists) {
			await this.vectorStore.createIndex({
				indexName,
				dimension: this.constants.dimensions,
				metric: this.constants.metric,
			});
		}

		await this.redis.setVectorIndexCacheKey(cacheKey)

		return indexName;
	}

	private getChunkingParams(type: SupportedExtractor): ChunkParams {
		const baseParams = { maxSize: 1200, overlap: 150 };

		switch (type) {
			case "markdown":
				return { strategy: "markdown" as const, ...baseParams };
			case "json":
				return { strategy: "json" as const, ...baseParams };
			case "html":
				return {
					strategy: "html" as const, ...baseParams, headers:
						[["h1", "h6"], ["div", "div"], ["p", "p"], ["article", "article"], ["section", "section"]]
				};
			default:
				return { strategy: "recursive" as const, ...baseParams };
		}
	}
}

const ragService = new RAGService();
export default ragService;