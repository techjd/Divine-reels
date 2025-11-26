import { CommentType } from '@prisma/client';
import { z } from 'zod';

export interface CommentAuthorDto {
  id: string;
  displayName: string | null;
}

export interface CommentDto {
  id: string;
  videoId: string;
  parentCommentId: string | null;
  type: CommentType;
  text: string | null;
  stickerId: string | null;
  likeCount: number;
  replyCount: number;
  reportCount: number;
  createdAt: Date;
  author: CommentAuthorDto;
  replies?: CommentDto[];
}

// Helper to validate content rules for comments/replies based on type.
const commentContentSchema = z
  .object({
    type: z.nativeEnum(CommentType),
    text: z.string().trim().optional().nullable(),
    stickerId: z.string().trim().optional().nullable()
  })
  .superRefine((data, ctx) => {
    if (data.type === CommentType.TEXT) {
      if (!data.text) ctx.addIssue({ code: 'custom', message: 'text is required for TEXT comments' });
      if (data.stickerId) ctx.addIssue({ code: 'custom', message: 'stickerId must be empty for TEXT comments' });
    }
    if (data.type === CommentType.STICKER) {
      if (!data.stickerId) ctx.addIssue({ code: 'custom', message: 'stickerId is required for STICKER comments' });
      if (data.text) ctx.addIssue({ code: 'custom', message: 'text must be empty for STICKER comments' });
    }
    if (data.type === CommentType.TEXT_AND_STICKER) {
      if (!data.text) ctx.addIssue({ code: 'custom', message: 'text is required for TEXT_AND_STICKER comments' });
      if (!data.stickerId) ctx.addIssue({ code: 'custom', message: 'stickerId is required for TEXT_AND_STICKER comments' });
    }
  });

export const CreateCommentParamsSchema = z.object({
  videoId: z.string().trim().min(1)
});

export const CreateCommentBodySchema = commentContentSchema;

export const CreateReplyParamsSchema = z.object({
  commentId: z.string().trim().min(1)
});

export const CreateReplyBodySchema = commentContentSchema;

export const GetVideoCommentsParamsSchema = z.object({
  videoId: z.string().trim().min(1)
});

export const GetVideoCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['newest', 'top']).default('newest')
});

export type CreateCommentParams = z.infer<typeof CreateCommentParamsSchema>;
export type CreateCommentBody = z.infer<typeof CreateCommentBodySchema>;
export type CreateReplyParams = z.infer<typeof CreateReplyParamsSchema>;
export type CreateReplyBody = z.infer<typeof CreateReplyBodySchema>;
export type GetVideoCommentsParams = z.infer<typeof GetVideoCommentsParamsSchema>;
export type GetVideoCommentsQuery = z.infer<typeof GetVideoCommentsQuerySchema>;
