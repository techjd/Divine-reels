import { Request, Response } from 'express';
import { formatSuccessResponse } from '../../core/utils/response';
import { rankingService } from './ranking.service';

// Controller for ranking endpoints.
export const rankingController = {
  getDailyRanking: async (_req: Request, res: Response) => {
    const ranking = await rankingService.getDailyRanking();
    return res.json(formatSuccessResponse(ranking));
  }
};
