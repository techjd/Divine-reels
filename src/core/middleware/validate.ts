import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';
import { formatErrorResponse } from '../utils/response';

// Reusable validation middleware using Zod schemas.
export const validate = (
  schema: AnyZodObject | ZodEffects<AnyZodObject>,
  property: 'body' | 'query' | 'params' = 'body'
) =>
  (req: Request, res: Response, next: NextFunction): void | Response => {
    const payload = (req as any)[property];
    const result = schema.safeParse(payload);

    if (!result.success) {
      return res.status(400).json(
        formatErrorResponse('VALIDATION_ERROR', 'Request validation failed', result.error.flatten())
      );
    }

    (req as any)[property] = result.data;
    next();
  };
