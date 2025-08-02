import db from "../../db";
import { library, libraryItem, user } from "../../db/schemas";
import { LibraryItem } from "./libraryInterfaces";
import { CreateLibraryItemPayload } from "./libraryValidator";
import { desc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

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
        libraryId: userLibrary.id,
      })
      .returning();
    return data;
  }
}

export const libraryService = new LibraryService();
