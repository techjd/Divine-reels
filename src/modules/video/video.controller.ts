import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../core/errors/AppError';
import { formatErrorResponse, formatSuccessResponse } from '../../core/utils/response';
import {
  CreateVideoBodySchema,
  GetFeedQuerySchema,
  GetVideoByIdParamsSchema,
  VideoIdParamSchema,
  DailyTopQuerySchema
} from './video.types';
import { videoService, DailyTopMetric } from './video.service';

// Controller for video-related endpoints.
export const videoController = {
  createVideo: async (req: Request, res: Response) => {
    try {
      const body = CreateVideoBodySchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
      }
      const video = await videoService.createVideo({ userId, ...body });
      return res.status(201).json(formatSuccessResponse(video));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  getFeed: async (req: Request, res: Response) => {
    try {
      const query = GetFeedQuerySchema.parse(req.query);
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
      }
      const feed = await videoService.getVideoFeed({ userId, ...query });
      return res.json(formatSuccessResponse(feed));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  getVideoById: async (req: Request, res: Response) => {
    try {
      const params = GetVideoByIdParamsSchema.parse(req.params);
      const video = await videoService.getVideoById(params);
      if (!video) {
        throw new AppError('Video not found', { statusCode: 404, code: 'VIDEO_NOT_FOUND' });
      }
      return res.json(formatSuccessResponse(video));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  getDailyTopVideos: async (req: Request, res: Response) => {
    const parsed = DailyTopQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(400)
        .json(
          formatErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', parsed.error.flatten())
        );
    }

    const { metric = 'all', page, limit } = parsed.data;
    const result = await videoService.getDailyTopVideos(metric as DailyTopMetric, page, limit);
    return res.json(formatSuccessResponse(result));
  },

  registerView: async (req: Request, res: Response) => {
    try {
      const params = VideoIdParamSchema.parse(req.params);
      const updated = await videoService.incrementViewCount(params.id);
      return res.json(
        formatSuccessResponse({
          videoId: updated.id,
          viewCount: updated.viewCount
        })
      );
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  registerShare: async (req: Request, res: Response) => {
    try {
      const params = VideoIdParamSchema.parse(req.params);
      const updated = await videoService.incrementShareCount(params.id);
      return res.json(
        formatSuccessResponse({
          videoId: updated.id,
          shareCount: updated.shareCount
        })
      );
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
