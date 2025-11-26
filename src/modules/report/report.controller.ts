import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../core/errors/AppError';
import { formatErrorResponse, formatSuccessResponse } from '../../core/utils/response';
import { reportService } from './report.service';
import { CreateReportBodySchema } from './report.types';

// Controller handling user-generated reports.
export const reportController = {
  createReport: async (req: Request, res: Response) => {
    try {
      const body = CreateReportBodySchema.parse(req.body);
      const reporterId = req.user?.id;
      if (!reporterId) {
        throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
      }

      await reportService.createReport({ reporterId, ...body });
      return res.status(201).json(formatSuccessResponse({ reported: true }));
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
