import { Request, Response } from 'express';
import { formatSuccessResponse } from '../../core/utils/response';
import { authService } from './auth.service';

// Controller for auth endpoints (mocked).
export const authController = {
  login: async (_req: Request, res: Response) => {
    const session = await authService.loginWithMock();
    return res.json(formatSuccessResponse(session));
  }
};
