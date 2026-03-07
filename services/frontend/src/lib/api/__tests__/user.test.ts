import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, register, verifyToken, getUser, getAllUsers, updateUser, updateUserPrivilege, deleteUser } from "../user";

// Mock the client module
vi.mock("../client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../client";
const mockApiFetch = vi.mocked(apiFetch);

describe("user API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("calls POST /api/auth/login with email and password", async () => {
      const mockResponse = { message: "ok", data: { accessToken: "tok", id: "1", username: "u", email: "e@e.com", role: "user", createdAt: "" } };
      mockApiFetch.mockResolvedValue(mockResponse);

      const result = await login("e@e.com", "pass");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "e@e.com", password: "pass" }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("register", () => {
    it("calls POST /api/users with user data", async () => {
      mockApiFetch.mockResolvedValue({ message: "ok", data: {} });

      await register("user1", "u@e.com", "pw");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/users", {
        method: "POST",
        body: JSON.stringify({ username: "user1", email: "u@e.com", password: "pw" }),
      });
    });
  });

  describe("verifyToken", () => {
    it("calls GET /api/auth/verify-token", async () => {
      mockApiFetch.mockResolvedValue({ message: "ok", data: {} });
      await verifyToken();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/auth/verify-token");
    });
  });

  describe("getUser", () => {
    it("calls GET /api/users/:id", async () => {
      mockApiFetch.mockResolvedValue({ message: "ok", data: {} });
      await getUser("abc");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/users/abc");
    });
  });

  describe("getAllUsers", () => {
    it("calls GET /api/users", async () => {
      mockApiFetch.mockResolvedValue({ message: "ok", data: [] });
      await getAllUsers();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/users");
    });
  });

  describe("updateUser", () => {
    it("calls PATCH /api/users/:id with data", async () => {
      mockApiFetch.mockResolvedValue({ message: "ok", data: {} });
      await updateUser("id1", { username: "newname" });
      expect(mockApiFetch).toHaveBeenCalledWith("/api/users/id1", {
        method: "PATCH",
        body: JSON.stringify({ username: "newname" }),
      });
    });
  });

  describe("updateUserPrivilege", () => {
    it("calls PATCH /api/users/:id/privilege with role", async () => {
      mockApiFetch.mockResolvedValue({ message: "ok", data: {} });
      await updateUserPrivilege("id2", "admin");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/users/id2/privilege", {
        method: "PATCH",
        body: JSON.stringify({ role: "admin" }),
      });
    });
  });

  describe("deleteUser", () => {
    it("calls DELETE /api/users/:id", async () => {
      mockApiFetch.mockResolvedValue({ message: "deleted" });
      await deleteUser("id3");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/users/id3", { method: "DELETE" });
    });
  });
});
