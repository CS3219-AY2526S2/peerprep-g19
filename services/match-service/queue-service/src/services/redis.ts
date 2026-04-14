import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redis);
export const redisSub = new Redis(config.redis);

/**
 * Notify match worker that queue changed and it should run matching algorithm
 */
export async function pingMatchWorker() {
  await redis.publish('queue:activity', '');
}

export const queueKey = (topic: string, difficulty: string) =>
  `queue:${topic}:${difficulty}`;

export const userMetaKey = (userId: string) =>
  `user:meta:${userId}`;

export const queueUpdateChannel = (topic: string, difficulty: string) =>
  `queue:upd:${topic}:${difficulty}`;