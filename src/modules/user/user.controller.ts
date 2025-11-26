import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../core/errors/AppError';
import { formatErrorResponse, formatSuccessResponse } from '../../core/utils/response';
import { userService } from './user.service';
import { GetUserGodsQuerySchema, UpdateUserGodsBodySchema } from './user.types';

// Controller for user-related endpoints.
export const userController = {
  getUserById: async (req: Request, res: Response) => {
    const user = await userService.getUserProfile(req.params.id);
    if (!user) {
      throw new AppError('User not found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    return res.json(formatSuccessResponse(user));
  },

  getUserGods: async (req: Request, res: Response) => {
    try {
      const query = GetUserGodsQuerySchema.parse(req.query);
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
      }
      const result = await userService.getUserSelectedGods({ userId, ...query });
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

  setUserGods: async (req: Request, res: Response) => {
    try {
      const body = UpdateUserGodsBodySchema.parse(req.body);
      const query = GetUserGodsQuerySchema.parse(req.query);
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
      }
      const result = await userService.setUserSelectedGods({ userId, ...body, ...query });
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
