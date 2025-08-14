import { getS3Client, s3Client } from "../../config/storage";
import db from "../../db";
import { library, libraryItem, user } from "../../db/schemas";
import { CreateLibraryItemPayload } from "./libraryValidator";
import { desc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import ragService from "../RAG/ragService";

export class LibraryService {
  async getLibraryItems(userId: string) {
    const userLibrary = await db.query.library.findFirst({
      where: eq(library.userId, userId),
      with: {
        items: {
          orderBy: [desc(libraryItem.createdAt)],
        },
      },
    });
    return userLibrary?.items ?? [];
  }

  async createLibraryItem(userId: string, payload: CreateLibraryItemPayload) {
    const userLibrary = await db.query.library.findFirst({
      where: eq(library.userId, userId),
    });

    if (!userLibrary) {
      throw new HTTPException(404, { message: "User library not found" });
    }
    const data = await db
      .insert(libraryItem)
      .values({
        title: payload.title,
        description: payload.description,
        uploadLink: payload.uploadLink,
        status: "processing",
        libraryId: userLibrary.id,
        fileSize: payload.fileSize,
        tags: payload.tags,
      })
      .returning();

    const created = data[0]!;
    // Fire-and-forget background training with events; pass only essentials
    ragService
      .train({ userId, item: created })
      .catch(() => { });

    return data;
  }

  async getPresignedUrl(userId: string, input: { key: string; contentType: string }) {
    const objectKey = `library/${userId}/${input.key}`;

    const presignedUrl = getS3Client().presign(objectKey, {
      method: 'PUT',
      expiresIn: 300,
      type: input.contentType,
      acl: "private",
    });

    return {
      uploadUrl: presignedUrl,
      objectKey,
    };
  }
}

export const libraryService = new LibraryService();
