import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerUser, getUser, getAllUsers, updateUser, updateUserPrivilege, deleteUser } from "../user";

vi.mock("../client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../client";
const mockApiFetch = vi.mocked(apiFetch);

describe("user API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerUser", () => {
    it("calls POST /api/auth/register with username", async () => {
      mockApiFetch.mockResolvedValue({ message: "ok", data: {} });

      await registerUser("alice");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: "alice" }),
      });
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
