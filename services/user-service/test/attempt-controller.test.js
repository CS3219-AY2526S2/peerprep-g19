import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRes } from "./test-utils.js";

const repositoryMocks = {
  createQuestionAttempt: vi.fn(),
  findUserById: vi.fn(),
  getQuestionAttemptSummaryByUser: vi.fn(),
  listQuestionAttemptsByUser: vi.fn(),
};

vi.mock("../model/firebase-repository.js", () => ({
  createQuestionAttempt: repositoryMocks.createQuestionAttempt,
  findUserById: repositoryMocks.findUserById,
  getQuestionAttemptSummaryByUser: repositoryMocks.getQuestionAttemptSummaryByUser,
  listQuestionAttemptsByUser: repositoryMocks.listQuestionAttemptsByUser,
}));

const { createAttempt, getAttemptHistory, getAttemptSummary } =
  await import("../controller/attempt-controller.js");

describe("attempt-controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createAttempt returns 404 when user does not exist", async () => {
    repositoryMocks.findUserById.mockResolvedValueOnce(null);

    const req = {
      params: { id: "uid-missing" },
      body: {
        questionTitle: "Two Sum",
        topic: "Arrays",
        difficulty: "Easy",
      },
    };
    const res = createMockRes();

    await createAttempt(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "User uid-missing not found" });
  });

  it("createAttempt returns 400 when required fields are missing", async () => {
    repositoryMocks.findUserById.mockResolvedValueOnce({ id: "uid-1" });

    const req = {
      params: { id: "uid-1" },
      body: { questionTitle: "Two Sum" },
    };
    const res = createMockRes();

    await createAttempt(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("createAttempt records attempt and returns 201", async () => {
    repositoryMocks.findUserById.mockResolvedValueOnce({ id: "uid-1" });
    repositoryMocks.createQuestionAttempt.mockResolvedValueOnce({
      id: "attempt-1",
      userId: "uid-1",
      questionTitle: "Two Sum",
      topic: "Arrays",
      difficulty: "Easy",
      status: "solved",
    });

    const req = {
      params: { id: "uid-1" },
      body: {
        questionTitle: "Two Sum",
        topic: "Arrays",
        difficulty: "Easy",
        status: "solved",
      },
    };
    const res = createMockRes();

    await createAttempt(req, res);

    expect(repositoryMocks.createQuestionAttempt).toHaveBeenCalledWith("uid-1", {
      questionId: undefined,
      questionTitle: "Two Sum",
      topic: "Arrays",
      difficulty: "Easy",
      status: "solved",
      durationSeconds: undefined,
      language: undefined,
      sessionId: undefined,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Question attempt recorded");
  });

  it("getAttemptHistory returns paginated attempts", async () => {
    repositoryMocks.findUserById.mockResolvedValueOnce({ id: "uid-1" });
    repositoryMocks.listQuestionAttemptsByUser.mockResolvedValueOnce({
      attempts: [{ id: "attempt-1", questionTitle: "Two Sum" }],
      nextCursor: "attempt-1",
    });

    const req = {
      params: { id: "uid-1" },
      query: { limit: "10", topic: "Arrays" },
    };
    const res = createMockRes();

    await getAttemptHistory(req, res);

    expect(repositoryMocks.listQuestionAttemptsByUser).toHaveBeenCalledWith(
      "uid-1",
      {
        limit: 10,
        startAfter: undefined,
        topic: "Arrays",
        difficulty: undefined,
        status: undefined,
      },
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination.nextCursor).toBe("attempt-1");
  });

  it("getAttemptSummary returns aggregated stats", async () => {
    repositoryMocks.findUserById.mockResolvedValueOnce({ id: "uid-1" });
    repositoryMocks.getQuestionAttemptSummaryByUser.mockResolvedValueOnce({
      totalAttempts: 3,
      solvedCount: 2,
      solvedRate: 2 / 3,
      byTopic: { Arrays: 2, Graphs: 1 },
      byDifficulty: { Easy: 2, Medium: 1 },
    });

    const req = {
      params: { id: "uid-1" },
    };
    const res = createMockRes();

    await getAttemptSummary(req, res);

    expect(repositoryMocks.getQuestionAttemptSummaryByUser).toHaveBeenCalledWith(
      "uid-1",
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Found question attempt summary");
  });
});
