import { z } from "zod";

export const createLibraryItemSchema = z.object({

  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  uploadLink: z.string().min(1, "Upload link is required"),
  fileSize: z.string().min(1, "File size is required"),
});

export type CreateLibraryItemPayload = Omit<
  z.infer<typeof createLibraryItemSchema>,
  "userId"
>;

export const presignedUrlSchema = z.object({
  key: z.string().min(1).max(255),
  contentType: z.enum([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'text/plain',
    'application/vnd.oasis.opendocument.text',
  ]), // .mime when upgrade to v4
});
