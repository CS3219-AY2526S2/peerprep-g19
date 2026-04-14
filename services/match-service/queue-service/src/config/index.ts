import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3001,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  matchingTimeoutMs: Number(process.env.MATCHING_TIMEOUT_MS) || 60_000,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }
};
