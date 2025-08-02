import db from "@/src/db";
import { library, libraryItem, user } from "@/src/db/schemas";

export class LibraryService {
  // async createLibrary(userData: typeof user) {
  //   const data = await db
  //     .insert(libraryItem)
  //     .values({
  //       id: crypto.randomUUID(),
  //       libraryId: userData,
  //       title: "New Library",
  //       description: "New Library",
  //       uploadLink: "New Library",
  //     })
  //     .returning();
  //   return data;
  // }
}
