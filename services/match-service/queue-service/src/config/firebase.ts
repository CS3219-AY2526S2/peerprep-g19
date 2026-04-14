import admin from 'firebase-admin';
import { config } from './index';

export function initializeFirebase() {
  if (admin.apps.length === 0) {
    if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin SDK initialized successfully');
    } else {
      console.warn('Firebase credentials not configured - authentication will reject all requests');
    }
  }
}

export default admin;