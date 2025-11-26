import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { commentController } from './comment.controller';

const router = Router();

/**
 * @openapi
 * /videos/{videoId}/comments:
 *   post:
 *     summary: Create a top-level comment on a video
 *     description: Creates a new comment on the specified video.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [TEXT, STICKER, TEXT_AND_STICKER]
 *               text:
 *                 type: string
 *                 nullable: true
 *               stickerId:
 *                 type: string
 *                 nullable: true
 *             required: [type]
 *           examples:
 *             textComment:
 *               value:
 *                 type: TEXT
 *                 text: Beautiful clip
 *     responses:
 *       201:
 *         description: Comment created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Video not found
 */
router.post('/videos/:videoId/comments', asyncHandler(commentController.createComment));

/**
 * @openapi
 * /videos/{videoId}/comments:
 *   get:
 *     summary: List top-level comments for a video
 *     description: Returns paginated top-level comments with one-level replies.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, top]
 *           default: newest
 *     responses:
 *       200:
 *         description: Paginated list of comments with replies
 *       400:
 *         description: Validation error
 *       404:
 *         description: Video not found
 */
router.get('/videos/:videoId/comments', asyncHandler(commentController.listForVideo));

/**
 * @openapi
 * /comments/{commentId}/replies:
 *   post:
 *     summary: Create a reply to a comment (max depth = 1)
 *     description: Adds a reply to a top-level comment.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [TEXT, STICKER, TEXT_AND_STICKER]
 *               text:
 *                 type: string
 *                 nullable: true
 *               stickerId:
 *                 type: string
 *                 nullable: true
 *             required: [type]
 *     responses:
 *       201:
 *         description: Reply created
 *       400:
 *         description: Validation error or depth exceeded
 *       404:
 *         description: Comment not found
 */
router.post('/comments/:commentId/replies', asyncHandler(commentController.createReply));

export default router;
