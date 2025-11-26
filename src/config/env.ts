import dotenv from 'dotenv';

dotenv.config();

// Central place to read and default environment variables.
export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/divine_reels'
};
