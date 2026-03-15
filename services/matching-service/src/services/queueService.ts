import { redisClient } from "../redis/redisClient";

/**
 * Add a user to a queue and record which queue they belong to.
 */
export async function addUserToQueue(email: string, queueKey: string) {

  // Remove any stale entry first to prevent duplicates (e.g. rapid double-join)
  await redisClient.lRem(queueKey, 0, email);

  await redisClient.lPush(queueKey, email);
  await redisClient.set(`user:queue:${email}`, queueKey);

  console.log(`${email} added to ${queueKey}`);
}

/**
 * Remove a user from whichever queue they belong to.
 */
export async function removeUserFromQueue(email: string) {

  const queueKey = await redisClient.get(`user:queue:${email}`);

  if (!queueKey) return;

  await redisClient.lRem(queueKey, 0, email);
  await redisClient.del(`user:queue:${email}`);

  console.log(`${email} removed from ${queueKey}`);
}

/**
 * Remove queue mapping only (used when worker already popped them).
 */
export async function removeQueueMapping(email: string) {
  await redisClient.del(`user:queue:${email}`);
}

/**
 * Get queue key for a user
 */
export async function getUserQueue(email: string) {
  return redisClient.get(`user:queue:${email}`);
}

/**
 * Get queue contents
 */
export async function getQueue(queueKey: string) {
  return redisClient.lRange(queueKey, 0, -1);
}

/**
 * Atomically pop two users from a queue using a Lua script.
 * Guarantees that either both users are popped or neither is,
 * preventing races between the match worker and leave/timeout operations.
 */
const ATOMIC_POP_PAIR_SCRIPT = `
if redis.call('LLEN', KEYS[1]) < 2 then
  return nil
end
return {redis.call('RPOP', KEYS[1]), redis.call('RPOP', KEYS[1])}
`;

export async function atomicPopPair(queueKey: string): Promise<[string, string] | null> {
  const result = await redisClient.eval(ATOMIC_POP_PAIR_SCRIPT, {
    keys: [queueKey],
  });

  if (!result || !Array.isArray(result) || result.length < 2) return null;
  return [result[0] as string, result[1] as string];
}
