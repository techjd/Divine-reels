import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { userController } from './user.controller';

const router = Router();

/**
 * @openapi
 * /user/gods:
 *   get:
 *     summary: Get current user's selected gods
 *     description: Returns the gods currently followed/selected by the authenticated user.
 *     tags:
 *       - User
 *       - Gods
 *     parameters:
 *       - in: query
 *         name: languageCode
 *         schema:
 *           type: string
 *           default: en
 *         description: Language code to filter god translations.
 *     responses:
 *       200:
 *         description: List of selected gods
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     languageCode: en
 *                     items:
 *                       - id: 123e4567-e89b-12d3-a456-426614174000
 *                         slug: shiva
 *                         name: Shiva
 *                         description: Destroyer and transformer within the Trimurti.
 *                         imageUrl: https://cdn.example.com/shiva.png
 *                         followerCount: 1200
 *       400:
 *         description: Validation error
 */
router.get('/user/gods', asyncHandler(userController.getUserGods));

/**
 * @openapi
 * /user/gods:
 *   post:
 *     summary: Replace current user's selected gods
 *     description: Replaces the full set of selected gods for the authenticated user.
 *     tags:
 *       - User
 *       - Gods
 *     parameters:
 *       - in: query
 *         name: languageCode
 *         schema:
 *           type: string
 *           default: en
 *         description: Language code to filter god translations in the response.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               godIds:
 *                 type: array
 *                 items:
 *                   type: string
 *             required: [godIds]
 *           examples:
 *             sample:
 *               value:
 *                 godIds:
 *                   - 123e4567-e89b-12d3-a456-426614174000
 *                   - 223e4567-e89b-12d3-a456-426614174111
 *     responses:
 *       200:
 *         description: Updated selection
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     languageCode: en
 *                     items:
 *                       - id: 123e4567-e89b-12d3-a456-426614174000
 *                         slug: shiva
 *                         name: Shiva
 *                         description: Destroyer and transformer within the Trimurti.
 *                         imageUrl: https://cdn.example.com/shiva.png
 *                         followerCount: 1200
 *       400:
 *         description: Validation error or invalid god IDs
 *         content:
 *           application/json:
 *             examples:
 *               invalidBody:
 *                 value:
 *                   success: false
 *                   error:
 *                     code: VALIDATION_ERROR
 *                     message: Request validation failed
 *               invalidGods:
 *                 value:
 *                   success: false
 *                   error:
 *                     code: INVALID_GOD_IDS
 *                     message: Some gods are invalid or inactive
 *                     details:
 *                       invalidIds:
 *                         - bad-id
 */
router.post('/user/gods', asyncHandler(userController.setUserGods));

router.get('/users/:id', asyncHandler(userController.getUserById));

export default router;
