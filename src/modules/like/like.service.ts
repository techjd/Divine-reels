import { LikeEntityType } from '@prisma/client';
import { AppError } from '../../core/errors/AppError';
import { prisma } from '../../config/prisma';

// Service encapsulating generic like/unlike behavior.
export const likeService = {
  // Idempotent like creation with counter increment in the same transaction.
  likeEntity: async (params: { userId: string; entityType: LikeEntityType; entityId: string }): Promise<void> => {
    const { userId, entityType, entityId } = params;

    const exists = await prisma.like.findUnique({
      where: { userId_entityType_entityId: { userId, entityType, entityId } }
    });
    if (exists) return;

    await prisma.$transaction(async (tx) => {
      if (entityType === LikeEntityType.VIDEO) {
        const video = await tx.video.findUnique({ where: { id: entityId } });
        if (!video) {
          throw new AppError('Video not found', { statusCode: 404, code: 'VIDEO_NOT_FOUND' });
        }
        await tx.like.create({ data: { userId, entityType, entityId } });
        await tx.video.update({
          where: { id: entityId },
          data: { likeCount: { increment: 1 } }
        });
      } else if (entityType === LikeEntityType.COMMENT) {
        const comment = await tx.comment.findUnique({ where: { id: entityId } });
        if (!comment) {
          throw new AppError('Comment not found', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
        }
        await tx.like.create({ data: { userId, entityType, entityId } });
        await tx.comment.update({
          where: { id: entityId },
          data: { likeCount: { increment: 1 } }
        });
      }
    });
  },

  // Idempotent unlike with safe counter decrement in the same transaction.
  unlikeEntity: async (params: { userId: string; entityType: LikeEntityType; entityId: string }): Promise<void> => {
    const { userId, entityType, entityId } = params;

    const existing = await prisma.like.findUnique({
      where: { userId_entityType_entityId: { userId, entityType, entityId } }
    });
    if (!existing) return;

    await prisma.$transaction(async (tx) => {
      await tx.like.delete({ where: { userId_entityType_entityId: { userId, entityType, entityId } } });

      if (entityType === LikeEntityType.VIDEO) {
        await tx.video.update({
          where: { id: entityId },
          data: { likeCount: { decrement: 1 } }
        });
      } else if (entityType === LikeEntityType.COMMENT) {
        await tx.comment.update({
          where: { id: entityId },
          data: { likeCount: { decrement: 1 } }
        });
      }
    });
  },

  // Returns whether the user has liked the target entity.
  getLikeStatus: async (params: {
    userId: string;
    entityType: LikeEntityType;
    entityId: string;
  }): Promise<{ liked: boolean }> => {
    const { userId, entityType, entityId } = params;
    const exists = await prisma.like.findUnique({
      where: { userId_entityType_entityId: { userId, entityType, entityId } }
    });
    return { liked: Boolean(exists) };
  }
};
