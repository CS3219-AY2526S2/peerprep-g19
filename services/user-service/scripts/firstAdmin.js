import "dotenv/config";
import admin from "../config/firebase.js";
import {
  connectToDB,
  findUserByFirebaseUuid,
  updateUserPrivilegeById,
} from "../model/repository.js";

const setRole = async (uid, role = "admin") => {
  await connectToDB();

  const mongoUser = await findUserByFirebaseUuid(uid);
  if (!mongoUser) {
    throw new Error(`No MongoDB user found for firebaseuuid=${uid}`);
  }

  await updateUserPrivilegeById(mongoUser.id, role);
  await admin.auth().setCustomUserClaims(uid, { role });

  console.log(`Updated MongoDB role to '${role}' for user ${mongoUser.id}`);
  console.log(`Updated Firebase custom claim role='${role}' for uid ${uid}`);
};

const uid = process.argv[2];
const role = process.argv[3] || "admin";

if (!uid) {
  console.error("Usage: node scripts/firstAdmin.js <firebase_uid> [role]");
  process.exit(1);
}

setRole(uid, role)
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
