require('dotenv').config();
const admin = require('../firebase');

const setAdmin = async (uid) => {
  await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
  console.log(`Admin role set for user ${uid}`);
  process.exit();
};

// Find it in Firebase Console → Authentication → Users
// And run node firstAdmin.js to set the role of the user to admin
setAdmin('PASTE_UID_HERE');