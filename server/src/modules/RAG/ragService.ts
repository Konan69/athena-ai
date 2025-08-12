import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { extractText } from 'unpdf';
import { PgVector } from "@mastra/pg";
import { MDocument } from "@mastra/rag";
import { getS3Client, vectorStore } from "@/src/config/storage";
import { z } from "zod";


class RAGService {
	private s3;
	private vectorStore;

	constructor() {
		this.s3 = getS3Client();
		this.vectorStore = vectorStore;
	}

	async train(docLink: string, docType: string, userId: string) {

		const docBuffer = await this.s3.file(docLink, {
			type: docType
		}).arrayBuffer()

		// TODO: probably extract with a python service cc:mupdf4rag
		const text = (await extractText(docBuffer)).text.map(page => page).join('\n');

		const doc = MDocument.fromText(text)

		// 2. Create chunks
		const chunks = await doc.chunk({
			strategy: "recursive",
			size: 512,
			overlap: 50,
		});

		const { embeddings } = await embedMany({
			values: chunks.map((chunk) => chunk.text),
			model: openai.embedding("text-embedding-3-small", {
				dimensions: 512,
			}),
		});

		const result = await this.vectorStore.upsert({
			indexName: `user_${userId}`,
			vectors: embeddings,
		});

		return result;
	}
}