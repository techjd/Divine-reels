import { z } from 'zod';

// Lightweight reference to a god attached to a video.
export interface GodRefDto {
  id: string;
  slug: string;
}

// Lightweight reference to a video uploader.
export interface UploaderDto {
  id: string;
  displayName: string | null;
}

// DTO returned to clients for video resources.
export interface VideoDto {
  id: string;
  caption: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  uploaderId: string;
  createdAt: Date;
  gods: GodRefDto[];
  uploader?: UploaderDto;
}

// Schema to validate create video payloads.
export const CreateVideoBodySchema = z.object({
  caption: z.string().trim().optional().nullable().transform((v) => (v === undefined ? null : v)),
  videoUrl: z.string().trim().min(1),
  thumbnailUrl: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? null : v)),
  durationSeconds: z.number().int().min(1).max(60),
  godIds: z.array(z.string().trim().min(1)).nonempty().optional().nullable()
});

// Schema for path params of single video fetch.
export const GetVideoByIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

// Schema for feed query parameters.
export const GetFeedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20)
});

export type CreateVideoBody = z.infer<typeof CreateVideoBodySchema>;
export type GetVideoByIdParams = z.infer<typeof GetVideoByIdParamsSchema>;
export type GetFeedQuery = z.infer<typeof GetFeedQuerySchema>;
