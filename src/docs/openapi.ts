import { Express } from 'express';
import swaggerJsdoc, { Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config/env';

// Generates Swagger/OpenAPI spec via JSDoc blocks in route files.
const options: Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Divine Reels API',
      version: '0.1.0',
      description: 'Backend API for the Divine Reels application.'
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api`,
        description: 'Local dev server'
      }
    ],
    components: {
      schemas: {
        StandardSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' }
          }
        },
        StandardError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object', nullable: true }
              }
            }
          }
        }
      }
    }
  },
  apis: ['src/modules/**/*.ts', 'src/app.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export function setupOpenApi(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs-json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
