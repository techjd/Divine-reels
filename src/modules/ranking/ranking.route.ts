import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { rankingController } from './ranking.controller';

const router = Router();

router.get('/daily', asyncHandler(rankingController.getDailyRanking));

export default router;
