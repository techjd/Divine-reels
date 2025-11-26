import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { adminController } from './admin.controller';

const router = Router();

/**
 * @openapi
 * /admin/reports:
 *   get:
 *     summary: List reports (admin only)
 *     description: Returns paginated reports for moderation review.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [VIDEO, COMMENT, USER]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Reports list grouped by entity
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     page: 1
 *                     pageSize: 20
 *                     total: 1
 *                     hasMore: false
 *                     items:
 *                       - entityType: VIDEO
 *                         entityId: 123e4567-e89b-12d3-a456-426614174000
 *                         reportCount: 5
 *                         reasonBreakdown:
 *                           SPAM: 5
 *                           NUDITY: 2
 *                         lastReportedAt: '2025-11-26T17:16:55.194Z'
 *                         isBanned: true
 *                         previewTitle: Video
 *                         previewText: Video caption...
 *                         previewThumbnailUrl: https://cdn.example.com/thumb.jpg
 *                         previewExtra:
 *                           videoCaption: Video caption...
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.get('/reports', asyncHandler(adminController.listReports));

/**
 * @openapi
 * /admin/moderation/{entityType}/{entityId}/ban:
 *   post:
 *     summary: Manually ban an entity
 *     description: Admin-only endpoint to ban a video, comment, or user.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [VIDEO, COMMENT, USER]
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entity banned
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Target not found
 */
router.post('/moderation/:entityType/:entityId/ban', asyncHandler(adminController.manualBan));

/**
 * @openapi
 * /admin/moderation/{entityType}/{entityId}/unban:
 *   post:
 *     summary: Manually unban an entity
 *     description: Admin-only endpoint to unban a video, comment, or user.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [VIDEO, COMMENT, USER]
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entity unbanned
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Target not found
 */
router.post('/moderation/:entityType/:entityId/unban', asyncHandler(adminController.manualUnban));

export default router;
