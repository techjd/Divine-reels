import { Request, Response } from 'express';
import { AppError } from '../../core/errors/AppError';
import { formatSuccessResponse } from '../../core/utils/response';
import { godService } from './god.service';

// Controller translates HTTP requests into service calls.
export const godController = {
  getGods: async (req: Request, res: Response) => {
    const { page, pageSize, languageCode } = req.query as unknown as {
      page: number;
      pageSize: number;
      languageCode: string;
    };

    const gods = await godService.listGods({ page, pageSize, languageCode });
    return res.json(formatSuccessResponse(gods));
  },
  getGodById: async (req: Request, res: Response) => {
    const god = await godService.getGodById(req.params.id);
    if (!god) {
      throw new AppError('God not found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    return res.json(formatSuccessResponse(god));
  }
};
