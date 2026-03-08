import { redisClient } from "../redis/redisClient";

/**
 * Add a user to a queue and record which queue they belong to.
 */
export async function addUserToQueue(email: string, queueKey: string) {

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