import { redisClient } from "../redis/redisClient";
import { sendEvent, closeConnection } from "../sse/connectionManager";
import { removeQueueMapping, addUserToQueue, atomicPopPair } from "../services/queueService";

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

        const sent1 = sendEvent(user1, { type: "MATCH_FOUND", peer: user2, matchedAt });
        const sent2 = sendEvent(user2, { type: "MATCH_FOUND", peer: user1, matchedAt });

        if (sent1 && sent2) {
          // Both users received the match — close their SSE connections
          closeConnection(user1);
          closeConnection(user2);
        } else if (sent1 && !sent2) {
          // user2's connection is dead — re-queue user1
          console.warn(`${user2} connection lost, re-queuing ${user1}`);
          sendEvent(user1, { type: "QUEUE_UPDATE", position: 1, queueLength: 1 });
          await addUserToQueue(user1, queueKey);
        } else if (!sent1 && sent2) {
          // user1's connection is dead — re-queue user2
          console.warn(`${user1} connection lost, re-queuing ${user2}`);
          sendEvent(user2, { type: "QUEUE_UPDATE", position: 1, queueLength: 1 });
          await addUserToQueue(user2, queueKey);
        } else {
          // Both connections dead — nothing to do
          console.warn(`Both ${user1} and ${user2} connections lost`);
          closeConnection(user1);
          closeConnection(user2);
        }

      }

    } catch (err) {
      console.error("Match worker error:", err);
    }

    setTimeout(tick, 1000);
  }

  setTimeout(tick, 1000);

}
