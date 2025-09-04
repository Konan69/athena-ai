import { s3Client } from "../../config/storage";
import db from "../../db";
import { library, libraryItem, user } from "../../db/schemas";
import { CreateLibraryItemPayload } from "./libraryValidator";
import { desc, eq } from "drizzle-orm";
import { ServiceErrors } from "../../lib/trpc-errors";
import ragService from "../RAG/ragService";
import type { Database } from "../../types";

export class LibraryService {
  private db: Database;

  constructor(database: Database = db) {
    this.db = database;
  }
  async getLibraryItems(organizationId: string) {
    const userLibrary = await this.db.query.library.findFirst({
      where: eq(library.organizationId, organizationId),
      with: {
        items: {
          orderBy: [desc(libraryItem.createdAt)],
          with: {
            agentKnowledge: {
              with: {
                agent: {
                  columns: {
                    id: true,
                    name: true,
                    agentType: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return userLibrary?.items ?? [];
  }

  async createLibraryItem(organizationId: string, payload: CreateLibraryItemPayload) {
    const orgLibrary = await this.db.query.library.findFirst({
      where: eq(library.organizationId, organizationId),
    });

    if (!orgLibrary) {
      throw ServiceErrors.notFound("Organization library");
    }

    const data = await this.db
      .insert(libraryItem)
      .values({
        title: payload.title,
        description: payload.description,
        uploadLink: payload.uploadLink,
        status: "processing",
        libraryId: orgLibrary.id,
        fileSize: payload.fileSize,
        tags: payload.tags,
      })
      .returning();

    const created = data[0]!;
    // Fire-and-forget background training with events; pass only essentials
    ragService
      .train({ orgId: organizationId, item: created })
      .catch(() => { });

    return data;
  }

  async getPresignedUrl(orgId: string, input: { key: string; contentType: string }) {
    const objectKey = `library/${orgId}/${input.key}`;

    const presignedUrl = s3Client.presign(objectKey, {
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
