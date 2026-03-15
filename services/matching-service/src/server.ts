import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

import app from "./app";
import { connectRedis } from "./redis/redisClient";
import { startMatchWorker } from "./workers/matchWorker";

const PORT = parseInt(process.env.PORT || "3002", 10);

async function start() {
  await connectRedis();
  startMatchWorker();

  app.listen(PORT, () => {
    console.log(`Matching Service running on port ${PORT}`);
  });
}

start();