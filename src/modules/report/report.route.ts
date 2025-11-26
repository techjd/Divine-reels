import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { reportController } from './report.controller';

const router = Router();

/**
 * @openapi
 * /reports:
 *   post:
 *     summary: Report a video, comment, or user
 *     description: Allows users to report content for moderation review.
 *     tags:
 *       - Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [VIDEO, COMMENT, USER]
 *               entityId:
 *                 type: string
 *               reasonCode:
 *                 type: string
 *                 enum: [SPAM, ABUSE, NUDITY, HATE, OTHER]
 *               reasonText:
 *                 type: string
 *             required: [entityType, entityId, reasonCode]
 *           examples:
 *             videoReport:
 *               value:
 *                 entityType: VIDEO
 *                 entityId: video-1
 *                 reasonCode: SPAM
 *                 reasonText: Looks like spam.
 *     responses:
 *       201:
 *         description: Report accepted
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     reported: true
 *       400:
 *         description: Validation error
 *       404:
 *         description: Target not found
 */
router.post('/', asyncHandler(reportController.createReport));

export default router;
