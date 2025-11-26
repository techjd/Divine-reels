import { ReportEntityType } from '@prisma/client';
import { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { AppError } from '../../core/errors/AppError';
import { formatErrorResponse, formatSuccessResponse } from '../../core/utils/response';
import { adminService } from './admin.service';
import { GetReportsQuerySchema } from './admin.types';

const moderationParamsSchema = z.object({
  entityType: z.nativeEnum(ReportEntityType),
  entityId: z.string().trim().min(1)
});

const moderationBodySchema = z.object({
  reason: z.string().trim().optional()
});

// Controller for admin endpoints.
export const adminController = {
  listReports: async (req: Request, res: Response) => {
    try {
      const query = GetReportsQuerySchema.parse(req.query);
      const adminId = req.user?.id;
      if (!adminId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      const result = await adminService.listReportSummaries(adminId, query);
      return res.json(formatSuccessResponse(result));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  manualBan: async (req: Request, res: Response) => {
    try {
      const params = moderationParamsSchema.parse(req.params);
      const body = moderationBodySchema.parse(req.body);
      const adminId = req.user?.id;
      if (!adminId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      await adminService.manualBan({
        adminId,
        entityType: params.entityType,
        entityId: params.entityId,
        reason: body.reason ?? null
      });
      return res.json(formatSuccessResponse({ banned: true }));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  manualUnban: async (req: Request, res: Response) => {
    try {
      const params = moderationParamsSchema.parse(req.params);
      const body = moderationBodySchema.parse(req.body);
      const adminId = req.user?.id;
      if (!adminId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      await adminService.manualUnban({
        adminId,
        entityType: params.entityType,
        entityId: params.entityId,
        reason: body.reason ?? null
      });
      return res.json(formatSuccessResponse({ unbanned: true }));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  }
};
