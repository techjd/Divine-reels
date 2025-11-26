import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../core/errors/AppError';
import { formatErrorResponse, formatSuccessResponse } from '../../core/utils/response';
import { uploadService } from './upload.service';
import {
  CreateImageUploadUrlBodySchema,
  CreateVideoUploadUrlBodySchema
} from './upload.types';

// Controller for issuing pre-signed upload URLs. Backend never receives raw file bytes.
export const uploadController = {
  createVideoUploadUrl: async (req: Request, res: Response) => {
    try {
      const body = CreateVideoUploadUrlBodySchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      const result = await uploadService.createVideoUploadUrl({ userId, ...body });
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

  createImageUploadUrl: async (req: Request, res: Response) => {
    try {
      const body = CreateImageUploadUrlBodySchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

      const result = await uploadService.createImageUploadUrl({ userId, ...body });
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
