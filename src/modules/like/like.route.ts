import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { likeController } from './like.controller';

const router = Router();

/**
 * @openapi
 * /likes:
 *   post:
 *     summary: Like an entity (video or comment)
 *     description: Records a like for a video or comment for the authenticated user.
 *     tags:
 *       - Likes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [VIDEO, COMMENT]
 *               entityId:
 *                 type: string
 *             required: [entityType, entityId]
 *           examples:
 *             videoLike:
 *               value:
 *                 entityType: VIDEO
 *                 entityId: video-1
 *     responses:
 *       200:
 *         description: Like recorded
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     liked: true
 *       400:
 *         description: Validation error
 *       404:
 *         description: Target entity not found
 */
router.post('/', asyncHandler(likeController.likeEntity));

/**
 * @openapi
 * /likes:
 *   delete:
 *     summary: Unlike an entity (video or comment)
 *     description: Removes a like for a video or comment for the authenticated user if it exists.
 *     tags:
 *       - Likes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [VIDEO, COMMENT]
 *               entityId:
 *                 type: string
 *             required: [entityType, entityId]
 *           examples:
 *             videoUnlike:
 *               value:
 *                 entityType: VIDEO
 *                 entityId: video-1
 *     responses:
 *       200:
 *         description: Like removed
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     liked: false
 *       400:
 *         description: Validation error
 */
router.delete('/', asyncHandler(likeController.unlikeEntity));

/**
 * @openapi
 * /likes/status:
 *   get:
 *     summary: Check like status for the current user and entity
 *     description: Returns whether the authenticated user has liked the given entity.
 *     tags:
 *       - Likes
 *     parameters:
 *       - in: query
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [VIDEO, COMMENT]
 *       - in: query
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like status
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     liked: true
 *       400:
 *         description: Validation error
 */
router.get('/status', asyncHandler(likeController.getLikeStatus));

export default router;
