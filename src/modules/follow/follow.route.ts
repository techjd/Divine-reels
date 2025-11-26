import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { followController } from './follow.controller';

const router = Router();

/**
 * @openapi
 * /users/{targetUserId}/follow:
 *   post:
 *     summary: Follow a user
 *     description: Current authenticated user follows the target user.
 *     tags:
 *       - Follows
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Followed successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
router.post('/users/:targetUserId/follow', asyncHandler(followController.follow));

/**
 * @openapi
 * /users/{targetUserId}/follow:
 *   delete:
 *     summary: Unfollow a user
 *     description: Current authenticated user unfollows the target user.
 *     tags:
 *       - Follows
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unfollowed successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
router.delete('/users/:targetUserId/follow', asyncHandler(followController.unfollow));

/**
 * @openapi
 * /users/{userId}/followers:
 *   get:
 *     summary: List followers of a user
 *     tags:
 *       - Follows
 *     parameters:
 *       - in: path
 *         name: userId
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
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Followers list
 *       400:
 *         description: Validation error
 */
router.get('/users/:userId/followers', asyncHandler(followController.listFollowers));

/**
 * @openapi
 * /users/{userId}/following:
 *   get:
 *     summary: List users that the given user is following
 *     tags:
 *       - Follows
 *     parameters:
 *       - in: path
 *         name: userId
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
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Following list
 *       400:
 *         description: Validation error
 */
router.get('/users/:userId/following', asyncHandler(followController.listFollowing));

export default router;
