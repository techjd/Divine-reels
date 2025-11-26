import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { notificationController } from './notification.controller';

const router = Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: List notifications
 *     description: Returns the most recent notifications for the authenticated user.
 *     tags:
 *       - Notifications
 *     responses:
 *       200:
 *         description: Notifications list
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: notif-1
 *                       type: LIKE
 *                       entityType: VIDEO
 *                       entityId: video-1
 *                       message: mock-user-id received a like
 *                       isRead: false
 */
router.get('/', asyncHandler(notificationController.listNotifications));

export default router;
