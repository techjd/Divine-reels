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
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
  gods: GodRefDto[];
  uploader?: UploaderDto;
}

// Schema to validate create video payloads.
export const CreateVideoBodySchema = z.object({
  caption: z.string().trim().optional().nullable().transform((v) => (v === undefined ? null : v)),
  videoUrl: z.string().trim().min(1),
  thumbnailUrl: z.string().trim().min(1),
  durationSeconds: z.number().int().min(1).max(60),
  godIds: z.array(z.string().trim().min(1)).nonempty()
});

// Schema for path params of single video fetch.
export const VideoIdParamSchema = z.object({
  id: z.string().trim().uuid()
});

export const GetVideoByIdParamsSchema = VideoIdParamSchema;

// Schema for feed query parameters.
export const GetFeedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20)
});

export const DailyTopQuerySchema = z.object({
  metric: z.enum(['all', 'likes', 'comments', 'views', 'shares']).optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .refine((n) => !Number.isNaN(n) && n >= 1, { message: 'page must be >= 1' }),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .refine((n) => !Number.isNaN(n) && n >= 1 && n <= 100, {
      message: 'limit must be between 1 and 100'
    })
});

export type CreateVideoBody = z.infer<typeof CreateVideoBodySchema>;
export type VideoIdParams = z.infer<typeof VideoIdParamSchema>;
export type GetVideoByIdParams = VideoIdParams;
export type GetFeedQuery = z.infer<typeof GetFeedQuerySchema>;
export type DailyTopQuery = z.infer<typeof DailyTopQuerySchema>;
