import admin from "../config/firebase.js";

function usersRef() {
  return admin.firestore().collection("users");
}

function normalizeUser(snapshot) {
  if (!snapshot?.exists) return null;

  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
  };
}

async function getFirstByQuery(query) {
  const snapshot = await query.limit(1).get();
  if (snapshot.empty) return null;
  return normalizeUser(snapshot.docs[0]);
}

export async function createUser(userData) {
  if (!userData?.firebaseuuid) {
    throw new Error("firebaseuuid is required to create user");
  }

  const now = new Date();
  const payload = {
    firebaseuuid: userData.firebaseuuid,
    email: userData.email,
    username: userData.username,
    role: userData.role || "user",
    createdAt: now,
    updatedAt: now,
  };

  await usersRef().doc(userData.firebaseuuid).set(payload, { merge: true });
  return findUserById(userData.firebaseuuid);
}

export async function findUserByEmail(email) {
  if (!email) return null;
  return getFirstByQuery(usersRef().where("email", "==", email));
}

export async function findUserByFirebaseUuid(firebaseuuid) {
  if (!firebaseuuid) return null;

  const snapshot = await usersRef().doc(firebaseuuid).get();
  return normalizeUser(snapshot);
}

export async function findUserById(userId) {
  return findUserByFirebaseUuid(userId);
}

export async function findUserByUsername(username) {
  if (!username) return null;
  return getFirstByQuery(usersRef().where("username", "==", username));
}

export async function findUserByUsernameOrEmail(username, email) {
  const [userByUsername, userByEmail] = await Promise.all([
    findUserByUsername(username),
    findUserByEmail(email),
  ]);

  return userByUsername || userByEmail;
}

export async function findAllUsers() {
  const snapshot = await usersRef().get();
  return snapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });
}

export async function updateUserByUuid(firebaseuuid, updates) {
  if (!firebaseuuid) return null;

  await usersRef()
    .doc(firebaseuuid)
    .update({ ...updates, updatedAt: new Date() });

  return findUserByFirebaseUuid(firebaseuuid);
}

export async function updateUserById(userId, updates) {
  return updateUserByUuid(userId, updates);
}

export async function updateUserPrivilegeById(userId, role) {
  return updateUserByUuid(userId, { role });
}

export async function promoteUser(firebaseuuid) {
  return updateUserByUuid(firebaseuuid, { role: "admin" });
}

export async function deleteUserByUuid(firebaseuuid) {
  if (!firebaseuuid) return null;
  const existing = await findUserByFirebaseUuid(firebaseuuid);
  if (!existing) return null;

  await usersRef().doc(firebaseuuid).delete();
  return existing;
}

export async function deleteUserById(userId) {
  return deleteUserByUuid(userId);
}
