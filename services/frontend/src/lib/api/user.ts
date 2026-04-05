import { apiFetch } from "./client";
import type { UserResponse, UsersResponse } from "@/types/user";

export async function registerUser(username: string): Promise<UserResponse> {
  return apiFetch<UserResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function getUser(id: string): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/api/users/${id}`);
}

export async function getAllUsers(): Promise<UsersResponse> {
  return apiFetch<UsersResponse>("/api/users");
}

export async function updateUser(
  id: string,
  data: { username?: string; email?: string; password?: string },
): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateUserPrivilege(id: string, role: "admin" | "user"): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/api/users/${id}/privilege`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/users/${id}`, { method: "DELETE" });
}

export interface CreateAttemptPayload {
  questionTitle: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status?: "attempted" | "solved" | "abandoned";
  durationSeconds?: number;
  language?: string;
  sessionId?: string;
}

export async function createAttempt(userId: string, payload: CreateAttemptPayload): Promise<{ message: string; data: unknown }> {
  return apiFetch(`/api/users/${userId}/attempts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
