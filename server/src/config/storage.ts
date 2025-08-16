import { env } from "./env";
import { PgVector, PostgresStore } from "@mastra/pg";

export const pg = new PostgresStore({
  connectionString: env.DATABASE_URL,
});

export const vectorStore = new PgVector({
  connectionString: env.DATABASE_URL,
});

export const s3Client = new Bun.S3Client({
  accessKeyId: env.CLOUDFLARE_API_KEY,
  secretAccessKey: env.CLOUDFLARE_SECRET_KEY,
  bucket: env.S3_BUCKET_NAME,
  endpoint: env.S3_API_URL,
})

