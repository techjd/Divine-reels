import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler } from './core/middleware/errorHandler';
import { mockAuth } from './core/middleware/mockAuth';
import { requestLogger } from './core/middleware/logger';
import { formatErrorResponse, formatSuccessResponse } from './core/utils/response';
import { setupOpenApi } from './docs/openapi';
import adminRouter from './modules/admin/admin.route';
import authRouter from './modules/auth/auth.route';
import commentRouter from './modules/comment/comment.route';
import godRouter from './modules/god/god.route';
import likeRouter from './modules/like/like.route';
import notificationRouter from './modules/notification/notification.route';
import rankingRouter from './modules/ranking/ranking.route';
import reportRouter from './modules/report/report.route';
import userRouter from './modules/user/user.route';
import videoRouter from './modules/video/video.route';
import followRouter from './modules/follow/follow.route';
import uploadRouter from './modules/upload/upload.route';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(mockAuth);

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Returns the API uptime and status for monitoring purposes.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             examples:
 *               ok:
 *                 value:
 *                   success: true
 *                   data:
 *                     status: ok
 *                     uptimeMs: 12345
 */
app.get('/api/health', (_req, res) => {
  res.json(
    formatSuccessResponse({
      status: 'ok',
      uptimeMs: process.uptime() * 1000
    })
  );
});

app.use('/api/gods', godRouter);
app.use('/api/videos', videoRouter);
app.use('/api', commentRouter);
app.use('/api/likes', likeRouter);
app.use('/api/reports', reportRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api', userRouter);
app.use('/api', followRouter);
app.use('/api', uploadRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/ranking', rankingRouter);

setupOpenApi(app);

// Not-found handler for unmatched routes.
app.use((_req, res) => {
  res.status(404).json(formatErrorResponse('NOT_FOUND', 'Route not found'));
});

app.use(errorHandler);

export { app, env };
