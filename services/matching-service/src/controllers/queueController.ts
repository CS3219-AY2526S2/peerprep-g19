import { Request, Response } from "express";
import { registerConnection, closeConnection, isActiveConnection, setCleanup } from "../sse/connectionManager";
import {
  addUserToQueue,
  removeUserFromQueue,
  getUserQueue,
  getQueue
} from "../services/queueService";

const TIMEOUT_MS = parseInt(process.env.MATCHING_TIMEOUT_MS || process.env.TIMEOUT_MS || "60000", 10);

/**
 * User joins matchmaking queue and opens SSE stream.
 */
export async function joinQueue(req: Request, res: Response) {

  const email = (req as any).user!.email;
  const { topic, difficulty } = req.body;

  const queueKey = `queue:${topic}:${difficulty}`;

  const existingQueue = await getUserQueue(email);
  if (existingQueue) {
    // Clean up stale queue entry from a previous connection
    await removeUserFromQueue(email);
    closeConnection(email);
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  registerConnection(email, res);

  await addUserToQueue(email, queueKey);

  const startTime = Date.now();
  console.log(`${email} joined ${queueKey}`);

  let cleaned = false;

  // Attach an error handler to prevent unhandled 'error' events
  // if res.write() is called after res.end() in a narrow race window
  res.on("error", (err) => {
    console.error(`SSE response error for ${email}:`, err.message);
  });

  const interval = setInterval(async () => {

    if (cleaned) return;

    try {
      const queue = await getQueue(queueKey);

      // Re-check after await: matchWorker may have cleaned up while we yielded
      if (cleaned) return;

      const position = queue.indexOf(email) + 1;

      // User no longer in queue (matched or removed) — skip silently
      if (position === 0) return;

      res.write(`data: ${JSON.stringify({
        type: "QUEUE_UPDATE",
        position,
        top5: queue.slice(-5).reverse(),
        queueLength: queue.length
      })}\n\n`);
    } catch (err) {
      console.error(`QUEUE_UPDATE error for ${email}:`, err);
    }

  }, 3000);

  const timeoutCheck = setInterval(async () => {

    if (cleaned) return;

    try {
      if (Date.now() - startTime > TIMEOUT_MS) {

        console.log(`${email} timeout`);

        await removeUserFromQueue(email);

        // Re-check after await: matchWorker may have cleaned up while we yielded
        if (cleaned) return;

        res.write(`data: ${JSON.stringify({
          type: "TIMEOUT"
        })}\n\n`);

        cleanup();

      }
    } catch (err) {
      console.error(`Timeout check error for ${email}:`, err);
    }

  }, 2000);

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    clearInterval(interval);
    clearInterval(timeoutCheck);
    res.end();
  }

  // Register cleanup so matchWorker can trigger it via closeConnection()
  setCleanup(email, cleanup);

  res.on("close", async () => {

    // Always clear intervals for THIS connection, even if stale
    cleanup();

    // Only clean up queue if this response is still the active connection.
    // A newer connection may have replaced us — don't nuke their queue entry.
    if (!isActiveConnection(email, res)) {
      console.log(`${email} stale connection closed (ignored)`);
      return;
    }

    console.log(`${email} disconnected`);

    await removeUserFromQueue(email);

    closeConnection(email);

  });
}

/**
 * User manually leaves the queue
 */
export async function leaveQueue(req: Request, res: Response) {

  const email = (req as any).user!.email;

  const queueKey = await getUserQueue(email);

  if (!queueKey) {
    return res.json({ message: "User not in queue" });
  }

  await removeUserFromQueue(email);

  res.json({ message: "Left queue" });

  closeConnection(email);
}
