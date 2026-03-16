import { apiFetch } from "./client";
import type { Question, QuestionUpsertRequest } from "@/types/question";

export interface ListQuestionsParams {
  skip?: number;
  limit?: number;
  search?: string;
  difficulty?: string;
  topic?: string;
}

export interface ListQuestionsResponse {
  data: Question[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
}

export interface QuestionStats {
  total: number;
  difficulty_counts: Record<string, number>;
  topics: string[];
}

export async function listQuestions(params: ListQuestionsParams = {}): Promise<ListQuestionsResponse> {
  const searchParams = new URLSearchParams();
  if (params.skip != null) searchParams.set("skip", String(params.skip));
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.difficulty) searchParams.set("difficulty", params.difficulty);
  if (params.topic) searchParams.set("topic", params.topic);

  const qs = searchParams.toString();
  const url = qs ? `/api/questions-list?${qs}` : "/api/questions-list";
  return apiFetch<ListQuestionsResponse>(url);
}

export async function getQuestionStats(): Promise<QuestionStats> {
  return apiFetch<QuestionStats>("/api/questions-stats");
}

export async function getQuestion(title: string): Promise<Question> {
  return apiFetch<Question>(`/api/questions-get/${encodeURIComponent(title)}`);
}

export async function upsertQuestion(data: QuestionUpsertRequest) {
  return apiFetch("/api/questions-upsert", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteQuestion(title: string) {
  return apiFetch("/api/questions-delete", {
    method: "DELETE",
    body: JSON.stringify({ title }),
  });
}

export async function fetchRandomQuestion(topics: string, difficulty: string): Promise<Question> {
  return apiFetch<Question>(`/api/questions-fetch?topics=${encodeURIComponent(topics)}&difficulty=${encodeURIComponent(difficulty)}`);
}

/**
 * Deterministically select a question matching the given topic and difficulty.
 * Uses the sessionId as a seed so both matched users independently pick the same question.
 * Returns null if no matching questions exist.
 */
export async function fetchDeterministicQuestion(
  topic: string,
  difficulty: string,
  sessionId: string,
): Promise<Question | null> {
  const response = await listQuestions({ topic, difficulty, limit: 500 });
  const sorted = response.data.sort((a, b) => a.title.localeCompare(b.title));

  if (sorted.length === 0) return null;

  const index = parseInt(sessionId.slice(0, 8), 16) % sorted.length;
  return sorted[index];
}
