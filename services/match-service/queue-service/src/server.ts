import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`Queue service running on port ${config.port}`);
});