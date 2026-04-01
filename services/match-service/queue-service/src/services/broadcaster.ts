import { redis, redisSub, queueKey, queueUpdateChannel } from './redis';
import { sendEvent } from './sse';
import { QueueUpdateEvent } from '../types';

// queueKey → Set of userIds watching that queue
const watchers = new Map<string, Set<string>>();

// Redis channels we have already subscribed to
const subscribedChannels = new Set<string>();

// Call once at app startup — wires up the single Redis message listener
export async function initBroadcaster() {
  redisSub.on('message', async (channel: string) => {
    const parts = channel.split(':');
    // channel format: queue:upd:{topic}:{difficulty}
    if (parts.length < 4 || parts[0] !== 'queue' || parts[1] !== 'upd') return;

    const topic = parts[2];
    const difficulty = parts[3];
    await broadcastQueueUpdate(topic, difficulty);
  });
}

// Register a user as watching a queue; subscribe to its Redis channel if needed
export async function watchQueue(userId: string, topic: string, difficulty: string) {
  const key = queueKey(topic, difficulty);
  const channel = queueUpdateChannel(topic, difficulty);

  if (!watchers.has(key)) {
    watchers.set(key, new Set());
  }
  watchers.get(key)!.add(userId);

  if (!subscribedChannels.has(channel)) {
    await redisSub.subscribe(channel);
    subscribedChannels.add(channel);
  }
}

// Unregister a user; unsubscribe from Redis if no watchers remain
export async function unwatchQueue(userId: string, topic: string, difficulty: string) {
  const key = queueKey(topic, difficulty);
  const channel = queueUpdateChannel(topic, difficulty);

  const set = watchers.get(key);
  if (!set) return;
  set.delete(userId);

  if (set.size === 0) {
    watchers.delete(key);
    await redisSub.unsubscribe(channel);
    subscribedChannels.delete(channel);
  }
}

// One Redis read, then fan out in memory to all watchers of that queue
async function broadcastQueueUpdate(topic: string, difficulty: string) {
  const key = queueKey(topic, difficulty);
  const set = watchers.get(key);
  if (!set || set.size === 0) return;

  const [members, queueLength] = await Promise.all([
    redis.zrange(key, 0, 4),
    redis.zcard(key),
  ]);

  // Batch all ZRANK lookups into one Redis round-trip
  const pipeline = redis.pipeline();
  const userIds = [...set];
  for (const uid of userIds) {
    pipeline.zrank(key, uid);
  }
  const ranks = await pipeline.exec();

  userIds.forEach((uid, i) => {
    const rank = ranks?.[i]?.[1] as number | null;
    if (rank === null || rank === undefined) return;

    const payload: QueueUpdateEvent = {
      type: 'QUEUE_UPDATE',
      position: rank + 1,
      top5: members,
      queueLength,
    };
    sendEvent(uid, payload);
  });
}