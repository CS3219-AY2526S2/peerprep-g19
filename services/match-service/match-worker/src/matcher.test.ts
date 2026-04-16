import { describe, it, expect, beforeEach } from 'vitest';
import { redis } from './services/redis';
import { queueKey } from './services/redis';
import { tryMatchQueue } from './services/matcher';

describe('Match Worker Matcher', () => {
  beforeEach(async () => {
    // Clear all redis keys before each test
    const keys = await redis.keys('*');
    if (keys.length > 0) await redis.del(keys);
  });

  it('should return null when queue is empty', async () => {
    const result = await tryMatchQueue('arrays', 'medium');
    expect(result).toBeNull();
  });

  it('should return null when only one user in queue', async () => {
    const key = queueKey('arrays', 'medium');
    await redis.zadd(key, Date.now(), 'user1@example.com');

    const result = await tryMatchQueue('arrays', 'medium');
    expect(result).toBeNull();
  });

  it('should return matched pair when two users in queue', async () => {
    const key = queueKey('arrays', 'medium');
    const now = Date.now();
    await redis.zadd(key, now, 'user1@example.com');
    await redis.zadd(key, now + 100, 'user2@example.com');

    const pair = await tryMatchQueue('arrays', 'medium');

    expect(pair).not.toBeNull();
    expect(pair).toContain('user1@example.com');
    expect(pair).toContain('user2@example.com');

    // Verify both users were removed from queue
    const remaining = await redis.zcard(key);
    expect(remaining).toBe(0);
  });

  it('should return oldest two users when multiple are waiting', async () => {
    const key = queueKey('arrays', 'medium');
    const now = Date.now();
    await redis.zadd(key, now, 'user1@example.com');
    await redis.zadd(key, now + 100, 'user2@example.com');
    await redis.zadd(key, now + 200, 'user3@example.com');

    const pair = await tryMatchQueue('arrays', 'medium');

    expect(pair).toEqual(['user1@example.com', 'user2@example.com']);

    // Verify only the matched users were removed
    const remaining = await redis.zrange(key, 0, -1);
    expect(remaining).toEqual(['user3@example.com']);
  });
});