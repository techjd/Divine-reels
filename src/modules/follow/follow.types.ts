import { z } from 'zod';

export const FollowParamsSchema = z.object({
  targetUserId: z.string().min(1)
});

export const FollowListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20)
});

export type FollowParams = z.infer<typeof FollowParamsSchema>;
export type FollowListQuery = z.infer<typeof FollowListQuerySchema>;
