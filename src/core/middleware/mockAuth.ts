import { NextFunction, Request, Response } from 'express';

// Mock auth middleware injects a placeholder user for downstream handlers.
export function mockAuth(req: Request, _res: Response, next: NextFunction): void {
  req.user = { id: 'user-1' };
  next();
}
