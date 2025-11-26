import { CommentType } from '@prisma/client';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../core/errors/AppError';
import { formatErrorResponse, formatSuccessResponse } from '../../core/utils/response';
import { commentService } from './comment.service';
import {
  CreateCommentBodySchema,
  CreateCommentParamsSchema,
  CreateReplyBodySchema,
  CreateReplyParamsSchema,
  GetVideoCommentsParamsSchema,
  GetVideoCommentsQuerySchema
} from './comment.types';

// Controller for comment-related endpoints.
export const commentController = {
  createComment: async (req: Request, res: Response) => {
    try {
      const params = CreateCommentParamsSchema.parse(req.params);
      const body = CreateCommentBodySchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      const result = await commentService.createComment({
        userId,
        videoId: params.videoId,
        type: body.type as CommentType,
        text: body.text ?? null,
        stickerId: body.stickerId ?? null
      });
      return res.status(201).json(formatSuccessResponse(result));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  createReply: async (req: Request, res: Response) => {
    try {
      const params = CreateReplyParamsSchema.parse(req.params);
      const body = CreateReplyBodySchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      const result = await commentService.createReply({
        userId,
        parentCommentId: params.commentId,
        type: body.type as CommentType,
        text: body.text ?? null,
        stickerId: body.stickerId ?? null
      });
      return res.status(201).json(formatSuccessResponse(result));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(
          formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
        );
      }
      throw err;
    }
  },

  listForVideo: async (req: Request, res: Response) => {
    try {
      const params = GetVideoCommentsParamsSchema.parse(req.params);
      const query = GetVideoCommentsQuerySchema.parse(req.query);
      const result = await commentService.getVideoComments({ ...params, ...query });
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
