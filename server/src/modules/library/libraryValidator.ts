import { z } from "zod";

export const createLibraryItemSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  uploadLink: z.string().min(1, "Upload link is required"),
  fileSize: z.string().min(1, "File size is required"),
});

export type CreateLibraryItemPayload = Omit<
  z.infer<typeof createLibraryItemSchema>,
  "userId"
>;
