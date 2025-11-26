import { AppError } from '../../core/errors/AppError';
import { prisma } from '../../config/prisma';
import { FollowListQuery } from './follow.types';

// Service for follow/unfollow logic and listings.
export const followService = {
  followUser: async (params: { followerId: string; targetUserId: string }): Promise<void> => {
    const { followerId, targetUserId } = params;
    if (followerId === targetUserId) {
      throw new AppError('Cannot follow yourself', { statusCode: 400, code: 'VALIDATION_ERROR' });
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new AppError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.userFollow.findUnique({
        where: { followerId_followingId: { followerId, followingId: targetUserId } }
      });
      if (existing) return; // idempotent

      await tx.userFollow.create({
        data: { followerId, followingId: targetUserId }
      });

      await tx.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } }
      });
      await tx.user.update({
        where: { id: targetUserId },
        data: { followersCount: { increment: 1 } }
      });
    });
  },

  unfollowUser: async (params: { followerId: string; targetUserId: string }): Promise<void> => {
    const { followerId, targetUserId } = params;
    if (followerId === targetUserId) {
      throw new AppError('Cannot unfollow yourself', { statusCode: 400, code: 'VALIDATION_ERROR' });
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.userFollow.findUnique({
        where: { followerId_followingId: { followerId, followingId: targetUserId } }
      });
      if (!existing) return; // idempotent

      await tx.userFollow.delete({
        where: { followerId_followingId: { followerId, followingId: targetUserId } }
      });

      await tx.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } }
      });
      await tx.user.update({
        where: { id: targetUserId },
        data: { followersCount: { decrement: 1 } }
      });
    });
  },

  listFollowers: async (
    params: { userId: string } & FollowListQuery
  ): Promise<{
    items: Array<{ userId: string; displayName: string | null; followedAt: Date }>;
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  }> => {
    const { userId, page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const [total, rows] = await Promise.all([
      prisma.userFollow.count({ where: { followingId: userId } }),
      prisma.userFollow.findMany({
        where: { followingId: userId },
        include: { follower: { select: { id: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      })
    ]);

    const items = rows.map((r) => ({
      userId: r.follower.id,
      displayName: r.follower.displayName ?? null,
      followedAt: r.createdAt
    }));
    const hasMore = page * pageSize < total;
    return { items, page, pageSize, total, hasMore };
  },

  listFollowing: async (
    params: { userId: string } & FollowListQuery
  ): Promise<{
    items: Array<{ userId: string; displayName: string | null; followedAt: Date }>;
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  }> => {
    const { userId, page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const [total, rows] = await Promise.all([
      prisma.userFollow.count({ where: { followerId: userId } }),
      prisma.userFollow.findMany({
        where: { followerId: userId },
        include: { following: { select: { id: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      })
    ]);

    const items = rows.map((r) => ({
      userId: r.following.id,
      displayName: r.following.displayName ?? null,
      followedAt: r.createdAt
    }));
    const hasMore = page * pageSize < total;
    return { items, page, pageSize, total, hasMore };
  }
};
