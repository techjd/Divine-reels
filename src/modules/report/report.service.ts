import { ModerationActionType, ReportEntityType } from '@prisma/client';
import { REPORT_AUTO_BAN_THRESHOLD } from '../../core/constants/moderation';
import { AppError } from '../../core/errors/AppError';
import { prisma } from '../../config/prisma';
import { CreateReportBody } from './report.types';

const getBanActionForEntity = (entityType: ReportEntityType): ModerationActionType => {
  if (entityType === ReportEntityType.VIDEO) return ModerationActionType.BAN_VIDEO;
  if (entityType === ReportEntityType.COMMENT) return ModerationActionType.BAN_COMMENT;
  return ModerationActionType.BAN_USER;
};

// Service handling report submission and auto-ban escalation.
export const reportService = {
  createReport: async (params: { reporterId: string } & CreateReportBody): Promise<void> => {
    const { reporterId, entityId, entityType, reasonCode, reasonText } = params;

    // Ensure target exists before proceeding.
    if (entityType === ReportEntityType.VIDEO) {
      const video = await prisma.video.findUnique({ where: { id: entityId } });
      if (!video) {
        throw new AppError('Video not found', { statusCode: 404, code: 'VIDEO_NOT_FOUND' });
      }
    } else if (entityType === ReportEntityType.COMMENT) {
      const comment = await prisma.comment.findUnique({ where: { id: entityId } });
      if (!comment) {
        throw new AppError('Comment not found', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
      }
    } else if (entityType === ReportEntityType.USER) {
      const user = await prisma.user.findUnique({ where: { id: entityId } });
      if (!user) {
        throw new AppError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.report.create({
        data: { reporterId, entityType, entityId, reasonCode, reasonText: reasonText ?? null }
      });

      // Increment report counters when applicable.
      if (entityType === ReportEntityType.VIDEO) {
        await tx.video.update({ where: { id: entityId }, data: { reportCount: { increment: 1 } } });
      } else if (entityType === ReportEntityType.COMMENT) {
        await tx.comment.update({ where: { id: entityId }, data: { reportCount: { increment: 1 } } });
      }

      const totalReports = await tx.report.count({ where: { entityType, entityId } });

      // Auto-ban when threshold is exceeded and entity is not already banned.
      if (totalReports >= REPORT_AUTO_BAN_THRESHOLD) {
        const actor = await tx.user.findUnique({ where: { id: reporterId } });
        const adminId = actor ? reporterId : undefined;
        const actionType = getBanActionForEntity(entityType);
        const autoBanReason = `Auto-banned after ${totalReports} reports`;

        if (entityType === ReportEntityType.VIDEO) {
          const video = await tx.video.findUnique({ where: { id: entityId } });
          if (video && !video.isBanned) {
            await tx.video.update({
              where: { id: entityId },
              data: { isBanned: true, banReason: 'AUTO_BANNED_DUE_TO_REPORTS' }
            });
            if (adminId) {
              await tx.moderationAction.create({
                data: {
                  adminId,
                  entityType,
                  entityId,
                  actionType,
                  reason: autoBanReason,
                  previousStateJson: video,
                  newStateJson: { ...video, isBanned: true }
                }
              });
            }
          }
        } else if (entityType === ReportEntityType.COMMENT) {
          const comment = await tx.comment.findUnique({ where: { id: entityId } });
          if (comment && !comment.isBanned) {
            await tx.comment.update({
              where: { id: entityId },
              data: { isBanned: true, banReason: 'AUTO_BANNED_DUE_TO_REPORTS' }
            });
            if (adminId) {
              await tx.moderationAction.create({
                data: {
                  adminId,
                  entityType,
                  entityId,
                  actionType,
                  reason: autoBanReason,
                  previousStateJson: comment,
                  newStateJson: { ...comment, isBanned: true }
                }
              });
            }
          }
        } else if (entityType === ReportEntityType.USER) {
          const user = await tx.user.findUnique({ where: { id: entityId } });
          if (user && !user.isBanned) {
            await tx.user.update({
              where: { id: entityId },
              data: { isBanned: true }
            });
            if (adminId) {
              await tx.moderationAction.create({
                data: {
                  adminId,
                  entityType,
                  entityId,
                  actionType,
                  reason: autoBanReason,
                  previousStateJson: user,
                  newStateJson: { ...user, isBanned: true }
                }
              });
            }
          }
        }
      }
    });
  }
};
