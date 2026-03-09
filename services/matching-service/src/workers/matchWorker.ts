import { redisClient } from "../redis/redisClient";
import { sendEvent, closeConnection } from "../sse/connectionManager";
import { removeQueueMapping } from "../services/queueService";

/**
 * Background worker responsible for matching users in queues.
 */
export function startMatchWorker() {

  setInterval(async () => {

    const keys = await redisClient.keys("queue:*");

    for (const queueKey of keys) {

      const length = await redisClient.lLen(queueKey);

      if (length < 2) continue;

      const user1 = await redisClient.rPop(queueKey);
      const user2 = await redisClient.rPop(queueKey);

      if (!user1 || !user2) continue;

      await removeQueueMapping(user1);
      await removeQueueMapping(user2);

      console.log("MATCH FOUND");
      console.log(user1, "<->", user2);

      sendEvent(user1, {
        type: "MATCH_FOUND",
        peer: user2
      });

      sendEvent(user2, {
        type: "MATCH_FOUND",
        peer: user1
      });

      // close SSE connections after match
      closeConnection(user1);
      closeConnection(user2);

    }

  }, 1000);

}