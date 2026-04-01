import express from 'express';
import queueRouter from './routes/queue';
import { initBroadcaster } from './services/broadcaster';

const app = express();
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/queue', queueRouter);

initBroadcaster().catch(console.error);

export default app;