import { apiFetch } from "./client";
import type { Question, QuestionUpsertRequest } from "@/types/question";

export async function listQuestions(): Promise<Question[]> {
  return apiFetch<Question[]>("/api/questions-list");
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
