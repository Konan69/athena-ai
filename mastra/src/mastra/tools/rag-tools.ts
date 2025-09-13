import { createVectorQueryTool } from "@mastra/rag";
import { openai } from "@ai-sdk/openai";

export const vectorQueryTool = createVectorQueryTool(
  {
    vectorStoreName: "vectors",
    indexName: "embeddings", 
    model: openai.embedding("text-embedding-3-small", ),
    providerOptions: {
      openai: {
        dimensions: 1536,
        metric: 'cosine' as const
      },
    },
  },

);
