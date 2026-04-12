import admin from "../config/firebase.js";
import { USER_ROLES } from "../constants/roles.js";

function usersRef() {
  return admin.firestore().collection("users");
}

function attemptsRef() {
  return admin.firestore().collection("question_attempts");
}

function normalizeUser(snapshot) {
  if (!snapshot?.exists) return null;

  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
  };
}

function normalizeAttempt(snapshot) {
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
    role: userData.role || USER_ROLES.USER,
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
  return updateUserByUuid(firebaseuuid, { role: USER_ROLES.ADMIN });
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

export async function createQuestionAttempt(userId, attemptData) {
  if (!userId) {
    throw new Error("userId is required to create question attempt");
  }

  const now = new Date();
  const payload = {
    userId,
    questionId: attemptData.questionId ?? null,
    questionTitle: attemptData.questionTitle,
    topic: attemptData.topic,
    difficulty: attemptData.difficulty,
    status: attemptData.status || "attempted",
    durationSeconds: attemptData.durationSeconds ?? null,
    language: attemptData.language ?? null,
    sessionId: attemptData.sessionId ?? null,
    attemptedAt: now,
    createdAt: now,
  };

  const createdRef = await attemptsRef().add(payload);
  const created = await createdRef.get();
  return normalizeAttempt(created);
}

export async function listQuestionAttemptsByUser(userId, options = {}) {
  if (!userId) {
    return { attempts: [], nextCursor: null };
  }

  const maxLimit = 100;
  const requestedLimit = Number.parseInt(options.limit, 10);
  const limit =
    Number.isNaN(requestedLimit) || requestedLimit <= 0
      ? 20
      : Math.min(requestedLimit, maxLimit);

  let query = attemptsRef().where("userId", "==", userId);

  if (options.topic) {
    query = query.where("topic", "==", options.topic);
  }

  if (options.difficulty) {
    query = query.where("difficulty", "==", options.difficulty);
  }

  if (options.status) {
    query = query.where("status", "==", options.status);
  }

  query = query.orderBy("attemptedAt", "desc").limit(limit);

  if (options.startAfter) {
    const cursorSnapshot = await attemptsRef().doc(options.startAfter).get();
    if (cursorSnapshot.exists) {
      query = query.startAfter(cursorSnapshot);
    }
  }

  const snapshot = await query.get();
  const attempts = snapshot.docs.map(normalizeAttempt).filter(Boolean);
  const nextCursor = attempts.length === limit ? attempts[attempts.length - 1].id : null;

  return { attempts, nextCursor };
}

export async function getQuestionAttemptSummaryByUser(userId) {
  if (!userId) {
    return {
      totalAttempts: 0,
      solvedCount: 0,
      attemptedCount: 0,
      abandonedCount: 0,
      solvedRate: 0,
      byTopic: {},
      byDifficulty: {},
    };
  }

  const snapshot = await attemptsRef().where("userId", "==", userId).get();
  const attempts = snapshot.docs.map(normalizeAttempt).filter(Boolean);

  const summary = {
    totalAttempts: attempts.length,
    solvedCount: 0,
    attemptedCount: 0,
    abandonedCount: 0,
    solvedRate: 0,
    byTopic: {},
    byDifficulty: {},
  };

  for (const attempt of attempts) {
    if (attempt.status === "solved") summary.solvedCount += 1;
    if (attempt.status === "attempted") summary.attemptedCount += 1;
    if (attempt.status === "abandoned") summary.abandonedCount += 1;

    if (attempt.topic) {
      summary.byTopic[attempt.topic] = (summary.byTopic[attempt.topic] || 0) + 1;
    }

    if (attempt.difficulty) {
      summary.byDifficulty[attempt.difficulty] =
        (summary.byDifficulty[attempt.difficulty] || 0) + 1;
    }
  }

  if (summary.totalAttempts > 0) {
    summary.solvedRate = summary.solvedCount / summary.totalAttempts;
  }

  return summary;
}
