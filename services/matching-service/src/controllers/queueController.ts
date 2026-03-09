import { Request, Response } from "express";
import { registerConnection, closeConnection } from "../sse/connectionManager";
import {
  addUserToQueue,
  removeUserFromQueue,
  getUserQueue,
  getQueue
} from "../services/queueService";

const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || "60000", 10);

/**
 * User joins matchmaking queue and opens SSE stream.
 */
export async function joinQueue(req: Request, res: Response) {

  const email = (req as any).user!.email;
  const { topic, difficulty } = req.body;

  const queueKey = `queue:${topic}:${difficulty}`;

  const existingQueue = await getUserQueue(email);
  if (existingQueue) {
    return res.status(400).json({ error: "Already in queue" });
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

  const interval = setInterval(async () => {

    const queue = await getQueue(queueKey);

    const position = queue.indexOf(email) + 1;
    const top5 = queue.slice(-5).reverse();

    res.write(`data: ${JSON.stringify({
      type: "QUEUE_UPDATE",
      position,
      top5,
      queueLength: queue.length
    })}\n\n`);

  }, 3000);

  const timeoutCheck = setInterval(async () => {

    if (Date.now() - startTime > TIMEOUT_MS) {

      console.log(`${email} timeout`);

      await removeUserFromQueue(email);

      res.write(`data: ${JSON.stringify({
        type: "TIMEOUT"
      })}\n\n`);

      cleanup();

    }

  }, 2000);

  res.on("close", async () => {

    console.log(`${email} disconnected`);

    await removeUserFromQueue(email);

    closeConnection(email);

    cleanup();

  });

  function cleanup() {
    clearInterval(interval);
    clearInterval(timeoutCheck);
    res.end();
  }
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