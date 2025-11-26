import { PrismaClient } from '@prisma/client';
import { env } from './env';

// PrismaClient is a singleton across the app for connection reuse.
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.databaseUrl
    }
  },
  log: env.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});
