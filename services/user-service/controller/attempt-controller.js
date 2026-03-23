import {
  createQuestionAttempt,
  findUserById,
  getQuestionAttemptSummaryByUser,
  listQuestionAttemptsByUser,
} from "../model/firebase-repository.js";

const VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"];
const VALID_ATTEMPT_STATUSES = ["attempted", "solved", "abandoned"];

function normalizeLimit(limitParam) {
  const parsed = Number.parseInt(limitParam, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 20;
  return Math.min(parsed, 100);
}

export async function createAttempt(req, res) {
  try {
    const userId = req.params.id;
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    const {
      questionId,
      questionTitle,
      topic,
      difficulty,
      status,
      durationSeconds,
      language,
      sessionId,
    } = req.body || {};

    if (!questionTitle || !topic || !difficulty) {
      return res.status(400).json({
        message: "questionTitle, topic, and difficulty are required",
      });
    }

    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ message: "Invalid difficulty" });
    }

    if (status && !VALID_ATTEMPT_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (
      durationSeconds !== undefined &&
      (!Number.isFinite(durationSeconds) || durationSeconds < 0)
    ) {
      return res.status(400).json({ message: "Invalid durationSeconds" });
    }

    const createdAttempt = await createQuestionAttempt(userId, {
      questionId,
      questionTitle,
      topic,
      difficulty,
      status,
      durationSeconds,
      language,
      sessionId,
    });

    return res.status(201).json({
      message: "Question attempt recorded",
      data: createdAttempt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Unknown error when recording question attempt!",
    });
  }
}

export async function getAttemptHistory(req, res) {
  try {
    const userId = req.params.id;
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    const limit = normalizeLimit(req.query.limit);
    const options = {
      limit,
      startAfter: req.query.cursor,
      topic: req.query.topic,
      difficulty: req.query.difficulty,
      status: req.query.status,
    };

    const { attempts, nextCursor } = await listQuestionAttemptsByUser(
      userId,
      options,
    );

    return res.status(200).json({
      message: "Found question attempts",
      data: attempts,
      pagination: {
        limit,
        nextCursor,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Unknown error when getting question attempt history!",
    });
  }
}

export async function getAttemptSummary(req, res) {
  try {
    const userId = req.params.id;
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    const summary = await getQuestionAttemptSummaryByUser(userId);

    return res.status(200).json({
      message: "Found question attempt summary",
      data: summary,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Unknown error when getting question attempt summary!",
    });
  }
}
