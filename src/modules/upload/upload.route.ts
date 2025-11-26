import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { uploadController } from './upload.controller';

const router = Router();

/**
 * @openapi
 * /uploads/video:
 *   post:
 *     summary: Get pre-signed upload URL for a video file
 *     description: Returns a pre-signed URL for direct upload to S3-compatible storage. Client uploads via HTTP PUT, then calls POST /videos with the returned fileUrl. Backend never handles raw file bytes.
 *     tags:
 *       - Uploads
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentType:
 *                 type: string
 *                 description: MIME type, e.g. video/mp4
 *               extension:
 *                 type: string
 *                 description: File extension, used to form the key. Defaults to mp4.
 *             required: [contentType]
 *           examples:
 *             mp4:
 *               value:
 *                 contentType: video/mp4
 *                 extension: mp4
 *     responses:
 *       200:
 *         description: Signed URL generated
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     uploadUrl: https://s3.example.com/...
 *                     fileUrl: https://cdn.example.com/videos/user-1/...
 *                     key: videos/user-1/...
 *       400:
 *         description: Validation error
 */
router.post('/uploads/video', asyncHandler(uploadController.createVideoUploadUrl));

/**
 * @openapi
 * /uploads/image:
 *   post:
 *     summary: Get pre-signed upload URL for an image file
 *     description: Returns a pre-signed URL for image uploads (thumbnails/profile/etc.). Upload via HTTP PUT, then reference fileUrl in subsequent requests. Backend does not accept file bytes.
 *     tags:
 *       - Uploads
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentType:
 *                 type: string
 *                 description: MIME type, e.g. image/jpeg
 *               extension:
 *                 type: string
 *                 description: File extension, used to form the key. Defaults to jpg.
 *               purpose:
 *                 type: string
 *                 enum: [THUMBNAIL, PROFILE, OTHER]
 *                 description: Helps namespace the key for future uses.
 *             required: [contentType]
 *           examples:
 *             thumbnail:
 *               value:
 *                 contentType: image/jpeg
 *                 extension: jpg
 *                 purpose: THUMBNAIL
 *     responses:
 *       200:
 *         description: Signed URL generated
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     uploadUrl: https://s3.example.com/...
 *                     fileUrl: https://cdn.example.com/thumbnails/user-1/...
 *                     key: thumbnails/user-1/...
 *       400:
 *         description: Validation error
 */
router.post('/uploads/image', asyncHandler(uploadController.createImageUploadUrl));

export default router;
