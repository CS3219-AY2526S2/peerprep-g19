import "dotenv/config";
import admin from "firebase-admin";

const firebaseConfig = process.env.FIREBASE_SERVICE_KEY;
if (!firebaseConfig) {
  throw new Error("FIREBASE_SERVICE_KEY environment variable is missing!");
}
const serviceAccount = JSON.parse(firebaseConfig);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
