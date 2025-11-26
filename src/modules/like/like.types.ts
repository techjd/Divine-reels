import { LikeEntityType } from '@prisma/client';
import { z } from 'zod';

// Zod schema for like/unlike payloads.
export const LikeBodySchema = z.object({
  entityType: z.nativeEnum(LikeEntityType),
  entityId: z.string().trim().min(1)
});

// Zod schema for like status query params.
export const LikeStatusQuerySchema = z.object({
  entityType: z.nativeEnum(LikeEntityType),
  entityId: z.string().trim().min(1)
});

export type LikeBody = z.infer<typeof LikeBodySchema>;
export type LikeStatusQuery = z.infer<typeof LikeStatusQuerySchema>;
