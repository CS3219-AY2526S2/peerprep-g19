import { describe, it, expect, vi, beforeEach } from "vitest";
import { listQuestions, getQuestion, upsertQuestion, deleteQuestion, fetchRandomQuestion, fetchDeterministicQuestion } from "../question";

vi.mock("../client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../client";
const mockApiFetch = vi.mocked(apiFetch);

const makeQuestion = (title: string, topics: string[], difficulty: string) => ({
  _id: title,
  title,
  description: `desc for ${title}`,
  topics,
  difficulty,
  hints: [],
  version: 1,
});

describe("question API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listQuestions", () => {
    it("calls GET /api/questions-list", async () => {
      mockApiFetch.mockResolvedValue([]);
      const result = await listQuestions();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/questions-list");
      expect(result).toEqual([]);
    });
  });

  describe("getQuestion", () => {
    it("calls GET /api/questions-get/:title with encoded title", async () => {
      mockApiFetch.mockResolvedValue({ title: "Two Sum" });
      await getQuestion("Two Sum");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/questions-get/Two%20Sum");
    });
  });

  describe("upsertQuestion", () => {
    it("calls POST /api/questions-upsert with question data", async () => {
      const data = { title: "Q1", description: "desc", topics: ["Arrays"], difficulty: "Easy" as const };
      mockApiFetch.mockResolvedValue({});
      await upsertQuestion(data);
      expect(mockApiFetch).toHaveBeenCalledWith("/api/questions-upsert", {
        method: "POST",
        body: JSON.stringify(data),
      });
    });
  });

  describe("deleteQuestion", () => {
    it("calls DELETE /api/questions-delete with title", async () => {
      mockApiFetch.mockResolvedValue({});
      await deleteQuestion("Q1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/questions-delete", {
        method: "DELETE",
        body: JSON.stringify({ title: "Q1" }),
      });
    });
  });

  describe("fetchRandomQuestion", () => {
    it("calls GET /api/questions-fetch with query params", async () => {
      mockApiFetch.mockResolvedValue({ title: "Q" });
      await fetchRandomQuestion("Arrays,DP", "Medium");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/questions-fetch?topics=Arrays%2CDP&difficulty=Medium");
    });
  });

  describe("fetchDeterministicQuestion", () => {
    it("filters by topic and difficulty", async () => {
      mockApiFetch.mockResolvedValue([
        makeQuestion("Two Sum", ["Arrays"], "Easy"),
        makeQuestion("Graph BFS", ["Graphs"], "Easy"),
        makeQuestion("Three Sum", ["Arrays"], "Medium"),
      ]);

      const result = await fetchDeterministicQuestion("Arrays", "Easy", "0000000000000000");
      expect(result).not.toBeNull();
      expect(result!.topics).toContain("Arrays");
      expect(result!.difficulty).toBe("Easy");
    });

    it("returns null when no questions match", async () => {
      mockApiFetch.mockResolvedValue([
        makeQuestion("Graph BFS", ["Graphs"], "Hard"),
      ]);

      const result = await fetchDeterministicQuestion("Arrays", "Easy", "abcdef1234567890");
      expect(result).toBeNull();
    });

    it("returns null when question list is empty", async () => {
      mockApiFetch.mockResolvedValue([]);

      const result = await fetchDeterministicQuestion("Arrays", "Easy", "abcdef1234567890");
      expect(result).toBeNull();
    });

    it("sorts by title and picks deterministically based on sessionId", async () => {
      const questions = [
        makeQuestion("Zebra Problem", ["Arrays"], "Easy"),
        makeQuestion("Alpha Problem", ["Arrays"], "Easy"),
        makeQuestion("Middle Problem", ["Arrays"], "Easy"),
      ];
      mockApiFetch.mockResolvedValue(questions);

      const result = await fetchDeterministicQuestion("Arrays", "Easy", "0000000000000000");
      // parseInt("00000000", 16) = 0, 0 % 3 = 0 → first sorted = "Alpha Problem"
      expect(result!.title).toBe("Alpha Problem");
    });

    it("same sessionId always picks the same question", async () => {
      const questions = [
        makeQuestion("Q1", ["DP"], "Hard"),
        makeQuestion("Q2", ["DP"], "Hard"),
        makeQuestion("Q3", ["DP"], "Hard"),
      ];

      mockApiFetch.mockResolvedValue([...questions]);
      const a = await fetchDeterministicQuestion("DP", "Hard", "abcdef1234567890");

      mockApiFetch.mockResolvedValue([...questions]);
      const b = await fetchDeterministicQuestion("DP", "Hard", "abcdef1234567890");

      expect(a!.title).toBe(b!.title);
    });

    it("different sessionIds can pick different questions", async () => {
      const questions = [
        makeQuestion("Q1", ["Arrays"], "Easy"),
        makeQuestion("Q2", ["Arrays"], "Easy"),
        makeQuestion("Q3", ["Arrays"], "Easy"),
      ];

      // sessionId "00000001" → parseInt("00000001", 16) = 1 → 1 % 3 = 1
      mockApiFetch.mockResolvedValue([...questions]);
      const a = await fetchDeterministicQuestion("Arrays", "Easy", "0000000100000000");

      // sessionId "00000002" → parseInt("00000002", 16) = 2 → 2 % 3 = 2
      mockApiFetch.mockResolvedValue([...questions]);
      const b = await fetchDeterministicQuestion("Arrays", "Easy", "0000000200000000");

      expect(a!.title).not.toBe(b!.title);
    });

    it("handles topic appearing in multi-topic questions", async () => {
      mockApiFetch.mockResolvedValue([
        makeQuestion("Multi Topic", ["Arrays", "Graphs"], "Medium"),
        makeQuestion("Single Topic", ["Graphs"], "Medium"),
      ]);

      const result = await fetchDeterministicQuestion("Arrays", "Medium", "0000000000000000");
      expect(result!.title).toBe("Multi Topic");
    });
  });
});
