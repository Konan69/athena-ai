import { PgVector, PostgresStore } from "@mastra/pg";
import { env } from "./env";

export const sharedPgStore = new PostgresStore({
  connectionString: env.DATABASE_URL,
});

export const vectorStore = new PgVector({
  connectionString: env.DATABASE_URL,
});

// Only create S3 client if we're in Bun runtime
export const s3Client =
  typeof Bun !== "undefined"
    ? new (globalThis).Bun.S3Client({
      accessKeyId: env.CLOUDFLARE_API_KEY,
      secretAccessKey: env.CLOUDFLARE_SECRET_KEY,
      bucket: env.S3_BUCKET_NAME,
      endpoint: env.S3_API_URL,
    })
    : null;

// Helper function Bun code
export function getS3Client() {
  if (!s3Client) {
    throw new Error("S3Client only available in Bun runtime");
  }
  return s3Client;
}
