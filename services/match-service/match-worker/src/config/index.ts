import 'dotenv/config';

export const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS) || 1_500,
};