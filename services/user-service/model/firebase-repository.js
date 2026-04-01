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

// ── Question Attempt History ──────────────────────────────────────────────────

function attemptsRef(userId) {
  return admin.firestore().collection("users").doc(userId).collection("question_attempts");
}

export async function createQuestionAttempt(userId, attemptData) {
  const VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"];
  const VALID_STATUSES = ["attempted", "solved", "abandoned"];

  const { questionTitle, topic, difficulty, status, durationSeconds, language, sessionId } = attemptData;

  if (!questionTitle || !topic || !difficulty) {
    throw Object.assign(new Error("questionTitle, topic, and difficulty are required"), { status: 400 });
  }
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    throw Object.assign(new Error(`difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`), { status: 400 });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    throw Object.assign(new Error(`status must be one of: ${VALID_STATUSES.join(", ")}`), { status: 400 });
  }

  const now = new Date();
  const payload = {
    userId,
    questionTitle,
    topic,
    difficulty,
    status: status || "attempted",
    durationSeconds: typeof durationSeconds === "number" && isFinite(durationSeconds) ? Math.max(0, durationSeconds) : null,
    language: language || null,
    sessionId: sessionId || null,
    attemptedAt: now,
    createdAt: now,
  };

  const docRef = await attemptsRef(userId).add(payload);
  return { id: docRef.id, ...payload };
}

export async function listQuestionAttemptsByUser(userId, { limit = 20, cursor, topic, difficulty, status } = {}) {
  const VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"];
  const VALID_STATUSES = ["attempted", "solved", "abandoned"];

  // Apply equality filters before orderBy — required for Firestore composite index resolution
  let query = attemptsRef(userId);

  if (topic) query = query.where("topic", "==", topic);
  if (difficulty && VALID_DIFFICULTIES.includes(difficulty)) query = query.where("difficulty", "==", difficulty);
  if (status && VALID_STATUSES.includes(status)) query = query.where("status", "==", status);

  query = query.orderBy("attemptedAt", "desc");

  // Apply cursor before limit so the page window starts at the right position
  if (cursor) {
    const cursorDoc = await attemptsRef(userId).doc(cursor).get();
    if (cursorDoc.exists) query = query.startAfter(cursorDoc);
  }

  const pageSize = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
  query = query.limit(pageSize + 1);

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, pageSize);
  const nextCursor = snapshot.docs.length > pageSize ? docs[docs.length - 1].id : null;

  const data = docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return { data, nextCursor };
}
