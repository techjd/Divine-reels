import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../core/errors/AppError';
import { formatErrorResponse, formatSuccessResponse } from '../../core/utils/response';
import { followService } from './follow.service';
import { FollowListQuerySchema, FollowParamsSchema } from './follow.types';

// Controller managing follow/unfollow and listings.
export const followController = {
  follow: async (req: Request, res: Response) => {
    try {
      const params = FollowParamsSchema.parse(req.params);
      const followerId = req.user?.id;
      if (!followerId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      await followService.followUser({ followerId, targetUserId: params.targetUserId });
      return res.json(formatSuccessResponse({ followed: true }));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  unfollow: async (req: Request, res: Response) => {
    try {
      const params = FollowParamsSchema.parse(req.params);
      const followerId = req.user?.id;
      if (!followerId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      await followService.unfollowUser({ followerId, targetUserId: params.targetUserId });
      return res.json(formatSuccessResponse({ unfollowed: true }));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  listFollowers: async (req: Request, res: Response) => {
    try {
      const params = FollowParamsSchema.parse({ targetUserId: req.params.userId });
      const query = FollowListQuerySchema.parse(req.query);

      const result = await followService.listFollowers({
        userId: params.targetUserId,
        page: query.page,
        pageSize: query.pageSize
      });
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

  listFollowing: async (req: Request, res: Response) => {
    try {
      const params = FollowParamsSchema.parse({ targetUserId: req.params.userId });
      const query = FollowListQuerySchema.parse(req.query);

      const result = await followService.listFollowing({
        userId: params.targetUserId,
        page: query.page,
        pageSize: query.pageSize
      });
      return res.json(formatSuccessResponse(result));
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
