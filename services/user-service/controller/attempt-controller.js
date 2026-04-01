import { createQuestionAttempt, listQuestionAttemptsByUser, findUserById } from "../model/firebase-repository.js";

export async function createAttempt(req, res) {
  try {
    const userId = req.params.id;

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    const attempt = await createQuestionAttempt(userId, req.body);
    return res.status(201).json({ message: "Attempt recorded", data: attempt });
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Unknown error when creating attempt" });
  }
}

export async function listAttempts(req, res) {
  try {
    const userId = req.params.id;

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    const { limit, cursor, topic, difficulty, status } = req.query;
    const result = await listQuestionAttemptsByUser(userId, { limit, cursor, topic, difficulty, status });
    return res.status(200).json({ message: "Found attempts", ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unknown error when listing attempts" });
  }
}
