import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../core/middleware/validate';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { godController } from './god.controller';

const router = Router();

const listGodsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  languageCode: z.string().min(2).max(5).default('en')
});

/**
 * @openapi
 * /api/gods:
 *   get:
 *     summary: List active gods
 *     description: Returns active gods with localized names and descriptions.
 *     tags:
 *       - Gods
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of records per page
 *       - in: query
 *         name: languageCode
 *         schema:
 *           type: string
 *           default: en
 *         description: Language code to select translations (e.g., en, hi)
 *     responses:
 *       200:
 *         description: Paginated list of gods
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     items:
 *                       - id: 123e4567-e89b-12d3-a456-426614174000
 *                         slug: shiva
 *                         name: Shiva
 *                         description: Destroyer and transformer within the Trimurti.
 *                         imageUrl: https://cdn.example.com/shiva.png
 *                         followerCount: 1200
 *                     page: 1
 *                     pageSize: 20
 *                     total: 42
 *                     hasMore: true
 *       400:
 *         description: Validation error
 *       500:
 *         description: Unexpected error
 */
router.get('/', validate(listGodsQuerySchema, 'query'), asyncHandler(godController.getGods));

/**
 * @openapi
 * /api/gods/{id}:
 *   get:
 *     summary: Get a god by ID
 *     description: Retrieves full details for a specific god record.
 *     tags:
 *       - Gods
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: God identifier
 *     responses:
 *       200:
 *         description: God found
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     id: god-1
 *                     name: Shiva
 *                     slug: shiva
 *                     description: Destroyer and transformer within the Trimurti.
 *       404:
 *         description: God not found
 */
router.get('/:id', asyncHandler(godController.getGodById));

export default router;
