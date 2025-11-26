import { Request, Response } from 'express';
import { formatSuccessResponse } from '../../core/utils/response';
import { notificationService } from './notification.service';

// Controller for notification-related endpoints.
export const notificationController = {
  listNotifications: async (req: Request, res: Response) => {
    const userId = req.user?.id ?? 'anonymous';
    const notifications = await notificationService.listForUser(userId);
    return res.json(formatSuccessResponse(notifications));
  }
};
