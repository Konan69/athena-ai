import { z } from "zod";

// Zod v4 MIME type constants - use enum for type safety
export const SupportedMimeTypes = z.enum([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
  'text/plain',
  'text/csv',
  'application/vnd.oasis.opendocument.text',
]);

export type SupportedMimeType = z.infer<typeof SupportedMimeTypes>;

export const createLibraryItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  uploadLink: z.string().min(1, "Upload link is required"),
  fileSize: z.number().min(1, "File size is required").max(10 * 1024 * 1024, "Max 10MB"),
  tags: z.array(z.string()).default([]),
});

export type CreateLibraryItemPayload = z.infer<typeof createLibraryItemSchema>;

export const presignedUrlSchema = z.object({
  key: z.string().min(1, "Max 255 characters").max(255),
  contentType: SupportedMimeTypes,
});

// For File validation use z.mime()
export const fileSchema = z.file()
  .mime([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'text/plain',
    'text/csv',
    'application/vnd.oasis.opendocument.text',
  ])
  .min(1, "File is required")
  .max(10 * 1024 * 1024, "Max 10MB");
