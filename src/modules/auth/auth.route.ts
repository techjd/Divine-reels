import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { authController } from './auth.controller';

const router = Router();

router.post('/mock-login', asyncHandler(authController.login));

export default router;
