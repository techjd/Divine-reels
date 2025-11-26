import { z } from 'zod';

export const CreateVideoUploadUrlBodySchema = z.object({
  contentType: z.string().min(1),
  extension: z.string().min(1).default('mp4')
});

export const CreateImageUploadUrlBodySchema = z.object({
  contentType: z.string().min(1),
  extension: z.string().min(1).default('jpg'),
  purpose: z.enum(['THUMBNAIL', 'PROFILE', 'OTHER']).default('THUMBNAIL')
});

export type CreateVideoUploadUrlBody = z.infer<typeof CreateVideoUploadUrlBodySchema>;
export type CreateImageUploadUrlBody = z.infer<typeof CreateImageUploadUrlBodySchema>;
