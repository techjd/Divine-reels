import {
  ModerationActionType,
  ReportEntityType,
  ReportReasonCode,
  UserRole
} from '@prisma/client';
import { AppError } from '../../core/errors/AppError';
import { prisma } from '../../config/prisma';
import { GetReportsQuery, ReportSummaryDto } from './admin.types';

const getBanAction = (entityType: ReportEntityType): ModerationActionType => {
  if (entityType === ReportEntityType.VIDEO) return ModerationActionType.BAN_VIDEO;
  if (entityType === ReportEntityType.COMMENT) return ModerationActionType.BAN_COMMENT;
  return ModerationActionType.BAN_USER;
};

const getUnbanAction = (entityType: ReportEntityType): ModerationActionType => {
  if (entityType === ReportEntityType.VIDEO) return ModerationActionType.UNBAN_VIDEO;
  if (entityType === ReportEntityType.COMMENT) return ModerationActionType.UNBAN_COMMENT;
  return ModerationActionType.UNBAN_USER;
};

async function assertAdmin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== UserRole.ADMIN) {
    throw new AppError('Forbidden', { statusCode: 403, code: 'FORBIDDEN' });
  }
}

// Fetch target existence for moderation actions.
async function ensureEntityExists(entityType: ReportEntityType, entityId: string) {
  if (entityType === ReportEntityType.VIDEO) {
    const video = await prisma.video.findUnique({ where: { id: entityId } });
    if (!video) throw new AppError('Video not found', { statusCode: 404, code: 'VIDEO_NOT_FOUND' });
    return video;
  }
  if (entityType === ReportEntityType.COMMENT) {
    const comment = await prisma.comment.findUnique({ where: { id: entityId } });
    if (!comment) throw new AppError('Comment not found', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
    return comment;
  }
  const user = await prisma.user.findUnique({ where: { id: entityId } });
  if (!user) throw new AppError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });
  return user;
}

export const adminService = {
  // Aggregated report summaries for admin UX: one item per entity with breakdowns.
  listReportSummaries: async (
    adminId: string,
    params: GetReportsQuery
  ): Promise<{
    items: ReportSummaryDto[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  }> => {
    await assertAdmin(adminId);
    const { entityType, page, pageSize } = params;
    const where = entityType ? { entityType } : {};
    const skip = (page - 1) * pageSize;

    // Group reports by entity to get counts and last reported timestamps.
    const grouped = await prisma.report.groupBy({
      by: ['entityType', 'entityId'],
      where,
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      skip,
      take: pageSize
    });

    // Total number of groups for pagination.
    const totalGroups = await prisma.report.groupBy({
      by: ['entityType', 'entityId'],
      where,
      _count: { _all: true }
    });
    const total = totalGroups.length;
    const hasMore = page * pageSize < total;

    if (grouped.length === 0) {
      return { items: [], page, pageSize, total, hasMore };
    }

    const whereForReasons = {
      OR: grouped.map((g) => ({ entityType: g.entityType, entityId: g.entityId }))
    };

    // Reason breakdown per entity.
    const reasonGroups = await prisma.report.groupBy({
      by: ['entityType', 'entityId', 'reasonCode'],
      where: whereForReasons,
      _count: { _all: true }
    });
    const reasonMap = new Map<string, Record<string, number>>();
    reasonGroups.forEach((rg) => {
      const key = `${rg.entityType}:${rg.entityId}`;
      const existing = reasonMap.get(key) ?? {};
      existing[rg.reasonCode] = rg._count._all;
      reasonMap.set(key, existing);
    });

    // Collect entity IDs by type for preview and ban status.
    const videoIds = grouped.filter((g) => g.entityType === ReportEntityType.VIDEO).map((g) => g.entityId);
    const commentIds = grouped.filter((g) => g.entityType === ReportEntityType.COMMENT).map((g) => g.entityId);
    const userIds = grouped.filter((g) => g.entityType === ReportEntityType.USER).map((g) => g.entityId);

    const [videos, comments, users] = await prisma.$transaction([
      prisma.video.findMany({
        where: { id: { in: videoIds } },
        select: { id: true, isBanned: true, caption: true, thumbnailUrl: true }
      }),
      prisma.comment.findMany({
        where: { id: { in: commentIds } },
        select: { id: true, isBanned: true, text: true, videoId: true }
      }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, isBanned: true, displayName: true }
      })
    ]);

    const videoMap = new Map(videos.map((v) => [v.id, v]));
    const commentMap = new Map(comments.map((c) => [c.id, c]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    const items: ReportSummaryDto[] = grouped.map((g) => {
      const key = `${g.entityType}:${g.entityId}`;
      const reasons = reasonMap.get(key) ?? {};

      let isBanned = false;
      let previewTitle = '';
      let previewText: string | null = null;
      let previewThumbnailUrl: string | null = null;
      let previewExtra: Record<string, unknown> = {};

      if (g.entityType === ReportEntityType.VIDEO) {
        const v = videoMap.get(g.entityId);
        isBanned = v?.isBanned ?? false;
        previewTitle = 'Video';
        previewText = v?.caption ?? null;
        previewThumbnailUrl = v?.thumbnailUrl ?? null;
        previewExtra = { videoCaption: v?.caption ?? null };
      } else if (g.entityType === ReportEntityType.COMMENT) {
        const c = commentMap.get(g.entityId);
        isBanned = c?.isBanned ?? false;
        previewTitle = 'Comment';
        previewText = c?.text ?? null;
        previewThumbnailUrl = null;
        previewExtra = { commentText: c?.text ?? null, videoId: c?.videoId ?? null };
      } else if (g.entityType === ReportEntityType.USER) {
        const u = userMap.get(g.entityId);
        isBanned = u?.isBanned ?? false;
        previewTitle = 'User';
        previewText = u?.displayName ?? null;
        previewThumbnailUrl = null;
        previewExtra = { userDisplayName: u?.displayName ?? null };
      }

      return {
        entityType: g.entityType,
        entityId: g.entityId,
        reportCount: g._count._all,
        reasonBreakdown: reasons,
        lastReportedAt: g._max.createdAt!,
        isBanned,
        previewTitle,
        previewText,
        previewThumbnailUrl,
        previewExtra
      };
    });

    return { items, page, pageSize, total, hasMore };
  },

  manualBan: async (params: {
    adminId: string;
    entityType: ReportEntityType;
    entityId: string;
    reason?: string | null;
  }): Promise<void> => {
    const { adminId, entityType, entityId, reason } = params;
    await assertAdmin(adminId);
    const entity = await ensureEntityExists(entityType, entityId);

    if ((entity as any).isBanned) return;

    await prisma.$transaction(async (tx) => {
      if (entityType === ReportEntityType.VIDEO) {
        await tx.video.update({ where: { id: entityId }, data: { isBanned: true, banReason: reason ?? 'MANUAL_BAN' } });
      } else if (entityType === ReportEntityType.COMMENT) {
        await tx.comment.update({ where: { id: entityId }, data: { isBanned: true, banReason: reason ?? 'MANUAL_BAN' } });
      } else {
        await tx.user.update({ where: { id: entityId }, data: { isBanned: true } });
      }

      await tx.moderationAction.create({
        data: {
          adminId,
          entityType,
          entityId,
          actionType: getBanAction(entityType),
          reason: reason ?? 'Manual ban',
          previousStateJson: entity,
          newStateJson: { ...entity, isBanned: true }
        }
      });
    });
  },

  manualUnban: async (params: {
    adminId: string;
    entityType: ReportEntityType;
    entityId: string;
    reason?: string | null;
  }): Promise<void> => {
    const { adminId, entityType, entityId, reason } = params;
    await assertAdmin(adminId);
    const entity = await ensureEntityExists(entityType, entityId);

    if (!(entity as any).isBanned) return;

    await prisma.$transaction(async (tx) => {
      if (entityType === ReportEntityType.VIDEO) {
        await tx.video.update({ where: { id: entityId }, data: { isBanned: false, banReason: null } });
      } else if (entityType === ReportEntityType.COMMENT) {
        await tx.comment.update({ where: { id: entityId }, data: { isBanned: false, banReason: null } });
      } else {
        await tx.user.update({ where: { id: entityId }, data: { isBanned: false } });
      }

      await tx.moderationAction.create({
        data: {
          adminId,
          entityType,
          entityId,
          actionType: getUnbanAction(entityType),
          reason: reason ?? 'Manual unban',
          previousStateJson: entity,
          newStateJson: { ...entity, isBanned: false }
        }
      });
    });
  }
};
