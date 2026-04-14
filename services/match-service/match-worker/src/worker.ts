import { redis, redisSub } from './services/redis';
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
  console.log('Match worker started in event driven mode');

  // Subscribe to queue activity events
  await redisSub.subscribe('queue:activity');

  // Run matching algorithm whenever queue changes
  redisSub.on('message', async (channel) => {
    if (channel === 'queue:activity') {
      try {
        await runMatchCycle();
      } catch (err) {
        console.error('Match cycle error:', err);
      }
    }
  });

  // Also run once on startup to clean up any pending matches
  try {
    await runMatchCycle();
  } catch (err) {
    console.error('Initial match cycle failed:', err);
  }
}

start();