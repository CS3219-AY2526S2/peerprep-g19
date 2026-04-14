import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { redis } from './services/redis';
import queueRouter from './routes/queue';

// Mock auth middleware to return fixed test user
vi.mock('./middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.userId = 'test@example.com';
    next();
  },
}));

const app = express();
app.use('/', queueRouter);

describe('Queue Service API', () => {
  beforeEach(async () => {
    // Clear all redis keys before each test
    const keys = await redis.keys('*');
    if (keys.length > 0) await redis.del(keys);
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  describe('POST /leave', () => {
    it('should return success even when user not in queue', async () => {
      const res = await request(app).post('/leave');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Left queue');
    });
  });

  describe('Queue lifecycle', () => {
    it('should reject join without topic and difficulty', async () => {
      const res = await request(app).get('/join');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('topic and difficulty query params are required');
    });

    it('should reject invalid difficulty', async () => {
      const res = await request(app).get('/join?topic=arrays&difficulty=invalid');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('difficulty must be easy, medium, or hard');
    });
  });
});