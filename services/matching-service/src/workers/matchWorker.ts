import { redisClient } from "../redis/redisClient";
import { sendEvent, closeConnection } from "../sse/connectionManager";
import { removeQueueMapping, atomicPopPair } from "../services/queueService";

/**
 * Background worker responsible for matching users in queues.
 *
 * Uses setTimeout recursion (not setInterval) to guarantee the previous
 * tick finishes before the next one starts, preventing overlapping iterations
 * that could double-pop and silently lose users.
 */
export function startMatchWorker() {

  async function tick() {
    try {

      // SCAN is non-blocking, unlike KEYS which blocks the Redis event loop
      const keys: string[] = [];
      for await (const batch of redisClient.scanIterator({ MATCH: "queue:*", COUNT: 100 })) {
        if (Array.isArray(batch)) {
          keys.push(...batch);
        } else {
          keys.push(batch);
        }
      }

      for (const queueKey of keys) {

        // Atomically check length and pop two users in a single Lua script.
        // This prevents races where a user leaves between lLen and rPop,
        // or overlapping ticks double-pop from the same queue.
        const pair = await atomicPopPair(queueKey);
        if (!pair) continue;

        const [user1, user2] = pair;

        await removeQueueMapping(user1);
        await removeQueueMapping(user2);

        console.log("MATCH FOUND");
        console.log(user1, "<->", user2);

        // Share the same timestamp so both users compute identical session IDs
        const matchedAt = Date.now();

        sendEvent(user1, {
          type: "MATCH_FOUND",
          peer: user2,
          matchedAt
        });

        sendEvent(user2, {
          type: "MATCH_FOUND",
          peer: user1,
          matchedAt
        });

        // closeConnection triggers the per-connection cleanup callback,
        // which clears the QUEUE_UPDATE and timeout intervals
        closeConnection(user1);
        closeConnection(user2);

      }

    } catch (err) {
      console.error("Match worker error:", err);
    }

    setTimeout(tick, 1000);
  }

  setTimeout(tick, 1000);

}
