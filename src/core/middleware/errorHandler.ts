import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { formatErrorResponse } from '../utils/response';

// Global error handler to ensure consistent JSON error shape.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): Response {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(formatErrorResponse(err.code, err.message, err.details));
  }

  if (err instanceof ZodError) {
    return res.status(400).json(
      formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', err.flatten())
    );
  }

  console.error('Unhandled error', err);
  return res.status(500).json(formatErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'));
}
