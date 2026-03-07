import admin from "../config/firebase.js";

export async function setUserRoleClaim(uid, role) {
  await admin.auth().setCustomUserClaims(uid, { role });
}
