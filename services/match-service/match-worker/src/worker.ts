import { config } from './config';
import { getAllQueueKeys, tryMatchQueue, publishMatch } from './services/matcher';

async function runMatchCycle() {
  const keys = await getAllQueueKeys();

  for (const key of keys) {
    // key format: queue:{topic}:{difficulty}
    const parts = key.split(':');
    if (parts.length < 3) continue;

    const topic = parts[1];
    const difficulty = parts[2];

    const pair = await tryMatchQueue(topic, difficulty);
    if (pair) {
      const [user1, user2] = pair;
      console.log(`Matched: ${user1} <-> ${user2} [${topic}/${difficulty}]`);
      await publishMatch(user1, user2, topic, difficulty);
    }
  }
}

async function start() {
  console.log('Match worker started');
  setInterval(async () => {
    try {
      await runMatchCycle();
    } catch (err) {
      console.error('Match cycle error:', err);
    }
  }, config.pollIntervalMs);
}

start();