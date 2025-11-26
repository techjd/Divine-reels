import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { videoController } from './video.controller';

const router = Router();

/**
 * @openapi
 * /videos:
 *   post:
 *     summary: Create a video
 *     description: Uploads a new video record and links it to selected gods when provided.
 *     tags:
 *       - Videos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *                 nullable: true
 *               videoUrl:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *                 nullable: true
 *               durationSeconds:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 60
 *               godIds:
 *                 type: array
 *                 items:
 *                   type: string
 *             required: [videoUrl, durationSeconds]
 *           examples:
 *             sample:
 *               value:
 *                 caption: Divine sunrise vibes
 *                 videoUrl: https://cdn.example.com/video.mp4
 *                 thumbnailUrl: https://cdn.example.com/thumb.jpg
 *                 durationSeconds: 23
 *                 godIds:
 *                   - 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: Video created
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     id: video-1
 *                     caption: Divine sunrise vibes
 *                     videoUrl: https://cdn.example.com/video.mp4
 *                     thumbnailUrl: https://cdn.example.com/thumb.jpg
 *                     durationSeconds: 23
 *                     uploaderId: mock-user-id
 *                     createdAt: '2024-01-01T00:00:00.000Z'
 *                     gods:
 *                       - id: 123e4567-e89b-12d3-a456-426614174000
 *                         slug: shiva
 *       400:
 *         description: Validation error or invalid god ids
 */
router.post('/', asyncHandler(videoController.createVideo));

/**
 * @openapi
 * /videos/feed:
 *   get:
 *     summary: Get personalized video feed
 *     description: Retrieves feed for the user
 *     tags:
 *       - Videos
 *     responses:
 *       200:
 *         description: Feed items
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     page: 1
 *                     pageSize: 20
 *                     total: 100
 *                     hasMore: true
 *                     items:
 *                       - id: video-1
 *                         caption: Divine sunrise vibes
 *                         videoUrl: https://cdn.example.com/video-1.mp4
 *                         thumbnailUrl: https://cdn.example.com/video-1.jpg
 *                         durationSeconds: 23
 *                         uploaderId: mock-user-id
 *                         createdAt: '2024-01-01T00:00:00.000Z'
 *                         gods:
 *                           - id: 123e4567-e89b-12d3-a456-426614174000
 *                             slug: shiva
 *       404:
 *         description: Video not found
 */
router.get('/feed', asyncHandler(videoController.getFeed));

/**
 * @openapi
 * /videos/{id}:
 *   get:
 *     summary: Get video by ID
 *     description: Retrieves a video with basic uploader info and attached gods.
 *     tags:
 *       - Videos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video identifier
 *     responses:
 *       200:
 *         description: Video found
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     id: video-1
 *                     caption: Divine sunrise vibes
 *                     videoUrl: https://cdn.example.com/video.mp4
 *                     thumbnailUrl: https://cdn.example.com/thumb.jpg
 *                     durationSeconds: 23
 *                     uploaderId: mock-user-id
 *                     createdAt: '2024-01-01T00:00:00.000Z'
 *                     gods:
 *                       - id: 123e4567-e89b-12d3-a456-426614174000
 *                         slug: shiva
 *       404:
 *         description: Video not found
 */
router.get('/:id', asyncHandler(videoController.getVideoById));

export default router;
