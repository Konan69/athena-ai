import { createVectorQueryTool } from "@mastra/rag";
import { openai } from "@ai-sdk/openai";

export const vectorQueryTool = createVectorQueryTool(
  {
    vectorStoreName: "vectors",
    indexName: "embeddings", // Todo: source from shared package
    model: openai.embedding("text-embedding-3-small", { dimensions: 1536 }),
  },

);
