import { LikeEntityType } from '@prisma/client';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../core/errors/AppError';
import { formatErrorResponse, formatSuccessResponse } from '../../core/utils/response';
import { likeService } from './like.service';
import { LikeBodySchema, LikeStatusQuerySchema } from './like.types';

// Controller for polymorphic likes.
export const likeController = {
  likeEntity: async (req: Request, res: Response) => {
    try {
      const body = LikeBodySchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      await likeService.likeEntity({ userId, entityType: body.entityType, entityId: body.entityId });
      return res.json(formatSuccessResponse({ liked: true }));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  unlikeEntity: async (req: Request, res: Response) => {
    try {
      const body = LikeBodySchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      await likeService.unlikeEntity({ userId, entityType: body.entityType, entityId: body.entityId });
      return res.json(formatSuccessResponse({ liked: false }));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  getLikeStatus: async (req: Request, res: Response) => {
    try {
      const query = LikeStatusQuerySchema.parse(req.query);
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      const status = await likeService.getLikeStatus({
        userId,
        entityType: query.entityType,
        entityId: query.entityId
      });
      return res.json(formatSuccessResponse(status));
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
