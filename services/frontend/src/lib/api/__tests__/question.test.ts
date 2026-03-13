import { describe, it, expect, vi, beforeEach } from "vitest";
import { listQuestions, getQuestion, upsertQuestion, deleteQuestion, fetchRandomQuestion } from "../question";

vi.mock("../client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../client";
const mockApiFetch = vi.mocked(apiFetch);

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
});
