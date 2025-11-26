import { z } from 'zod';

// Types representing users returned by the API layer.
export interface UserProfile {
  id: string;
  displayName?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
}

// DTO for a god as returned in user selection APIs.
export interface GodDto {
  id: string;
  slug: string;
  name: string | null;
  description: string | null;
  imageUrl?: string | null;
  followerCount: number;
}

export const GetUserGodsQuerySchema = z.object({
  languageCode: z.string().trim().min(1).default('en')
});

export const UpdateUserGodsBodySchema = z.object({
  godIds: z.array(z.string().trim().min(1)).nonempty()
});

export type GetUserGodsQuery = z.infer<typeof GetUserGodsQuerySchema>;
export type UpdateUserGodsBody = z.infer<typeof UpdateUserGodsBodySchema>;
