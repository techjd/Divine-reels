import { CommentType } from '@prisma/client';
import { AppError } from '../../core/errors/AppError';
import { prisma } from '../../config/prisma';
import {
  CommentAuthorDto,
  CommentDto,
  GetVideoCommentsQuery,
  GetVideoCommentsParams
} from './comment.types';

const mapComment = (comment: any): CommentDto => ({
  id: comment.id,
  videoId: comment.videoId,
  parentCommentId: comment.parentCommentId,
  type: comment.type,
  text: comment.text ?? null,
  stickerId: comment.stickerId ?? null,
  likeCount: comment.likeCount,
  replyCount: comment.replyCount,
  reportCount: comment.reportCount,
  createdAt: comment.createdAt,
  author: {
    id: comment.user.id,
    displayName: comment.user.displayName ?? null
  }
});

export const commentService = {
  createComment: async (params: {
    userId: string;
    videoId: string;
    type: CommentType;
    text?: string | null;
    stickerId?: string | null;
  }): Promise<CommentDto> => {
    const { userId, videoId, type, text = null, stickerId = null } = params;

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video || video.isBanned) {
      throw new AppError('Video not found', { statusCode: 404, code: 'VIDEO_NOT_FOUND' });
    }

    const created = await prisma.comment.create({
      data: {
        userId,
        videoId,
        type,
        text,
        stickerId,
        parentCommentId: null
      },
      include: {
        user: { select: { id: true, displayName: true } }
      }
    });

    return mapComment(created);
  },

  createReply: async (params: {
    userId: string;
    parentCommentId: string;
    type: CommentType;
    text?: string | null;
    stickerId?: string | null;
  }): Promise<CommentDto> => {
    const { userId, parentCommentId, type, text = null, stickerId = null } = params;

    const parent = await prisma.comment.findUnique({
      where: { id: parentCommentId },
      include: { user: true, video: { select: { id: true, isBanned: true } } }
    });

    if (!parent) {
      throw new AppError('Comment not found', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
    }

    if (parent.parentCommentId) {
      throw new AppError('Max reply depth exceeded', {
        statusCode: 400,
        code: 'MAX_REPLY_DEPTH_EXCEEDED'
      });
    }

    if (!parent.video || parent.video.isBanned) {
      throw new AppError('Video not found', { statusCode: 404, code: 'VIDEO_NOT_FOUND' });
    }

    const created = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          userId,
          videoId: parent.videoId,
          parentCommentId,
          type,
          text,
          stickerId
        },
        include: {
          user: { select: { id: true, displayName: true } }
        }
      });

      await tx.comment.update({
        where: { id: parentCommentId },
        data: { replyCount: { increment: 1 } }
      });

      return newComment;
    });

    return mapComment(created);
  },

  getVideoComments: async (
    params: GetVideoCommentsParams & GetVideoCommentsQuery
  ): Promise<{
    items: CommentDto[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  }> => {
    const { videoId, page, pageSize, sort } = params;

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video || video.isBanned) {
      throw new AppError('Video not found', { statusCode: 404, code: 'VIDEO_NOT_FOUND' });
    }

    const orderBy =
      sort === 'top'
        ? [{ likeCount: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const skip = (page - 1) * pageSize;
    const [total, topLevel] = await Promise.all([
      prisma.comment.count({ where: { videoId, parentCommentId: null, isBanned: false } }),
      prisma.comment.findMany({
        where: { videoId, parentCommentId: null, isBanned: false },
        orderBy,
        skip,
        take: pageSize,
        include: {
          user: { select: { id: true, displayName: true } }
        }
      })
    ]);

    const topLevelIds = topLevel.map((c) => c.id);
    const replies = topLevelIds.length
      ? await prisma.comment.findMany({
          where: { parentCommentId: { in: topLevelIds }, isBanned: false },
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, displayName: true } } }
        })
      : [];

    const replyMap = new Map<string, CommentDto[]>();
    replies.forEach((reply) => {
      const dto = mapComment(reply);
      const bucket = replyMap.get(reply.parentCommentId!) ?? [];
      bucket.push(dto);
      replyMap.set(reply.parentCommentId!, bucket);
    });

    const items: CommentDto[] = topLevel.map((comment) => {
      const dto = mapComment(comment);
      dto.replies = replyMap.get(comment.id) ?? [];
      return dto;
    });

    const hasMore = page * pageSize < total;
    return { items, page, pageSize, total, hasMore };
  }
};
