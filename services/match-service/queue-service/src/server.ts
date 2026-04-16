import app from './app';
import { config } from './config';
import { initializeFirebase } from './config/firebase';

initializeFirebase();

app.listen(config.port, () => {
  console.log(`Queue service running on port ${config.port}`);
});
