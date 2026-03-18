import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRes } from "./test-utils.js";

const repositoryMocks = {
  deleteUserById: vi.fn(),
  existsUserByRoleExcludingId: vi.fn(),
  findUserById: vi.fn(),
  findUserByUsername: vi.fn(),
  updateUserById: vi.fn(),
  updateUserPrivilegeById: vi.fn(),
};

const setUserRoleClaimMock = vi.fn();

vi.mock("../model/repository.js", () => ({
  deleteUserById: repositoryMocks.deleteUserById,
  existsUserByRoleExcludingId: repositoryMocks.existsUserByRoleExcludingId,
  findAllUsers: vi.fn(),
  findUserById: repositoryMocks.findUserById,
  findUserByUsername: repositoryMocks.findUserByUsername,
  updateUserById: repositoryMocks.updateUserById,
  updateUserPrivilegeById: repositoryMocks.updateUserPrivilegeById,
}));

vi.mock("../helper/firebase-auth-helper.js", () => ({
  setUserRoleClaim: setUserRoleClaimMock,
}));

const { deleteUser, updateUser, updateUserPrivilege } =
  await import("../controller/user-controller.js");

describe("user-controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updateUser returns 400 when username is missing", async () => {
    const req = {
      body: {},
      params: { id: "507f1f77bcf86cd799439011" },
    };
    const res = createMockRes();

    await updateUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "username is missing!" });
  });

  it("updateUser returns 200 when username update succeeds", async () => {
    repositoryMocks.findUserById.mockResolvedValueOnce({
      id: "507f1f77bcf86cd799439011",
    });
    repositoryMocks.findUserByUsername.mockResolvedValueOnce(null);
    repositoryMocks.updateUserById.mockResolvedValueOnce({
      id: "507f1f77bcf86cd799439011",
      username: "newname",
      email: "user@example.com",
      role: "user",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const req = {
      body: { username: "newname" },
      params: { id: "507f1f77bcf86cd799439011" },
    };
    const res = createMockRes();

    await updateUser(req, res);

    expect(repositoryMocks.updateUserById).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      { username: "newname" },
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "Updated data for user 507f1f77bcf86cd799439011",
    );
  });

  it("updateUserPrivilege syncs Firebase claim when role changes", async () => {
    repositoryMocks.findUserById.mockResolvedValueOnce({
      id: "507f1f77bcf86cd799439011",
      firebaseuuid: "firebase-uid-1",
    });
    repositoryMocks.updateUserPrivilegeById.mockResolvedValueOnce({
      id: "507f1f77bcf86cd799439011",
      username: "john",
      email: "john@example.com",
      role: "admin",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    setUserRoleClaimMock.mockResolvedValueOnce();

    const req = {
      body: { role: "admin" },
      params: { id: "507f1f77bcf86cd799439011" },
    };
    const res = createMockRes();

    await updateUserPrivilege(req, res);

    expect(setUserRoleClaimMock).toHaveBeenCalledWith(
      "firebase-uid-1",
      "admin",
    );
    expect(res.statusCode).toBe(200);
  });

  it("updateUserPrivilege blocks demoting an admin", async () => {
    repositoryMocks.findUserById.mockResolvedValueOnce({
      id: "507f1f77bcf86cd799439011",
      firebaseuuid: "firebase-uid-1",
      role: "admin",
    });

    const req = {
      body: { role: "user" },
      params: { id: "507f1f77bcf86cd799439011" },
      user: { uid: "firebase-uid-1", role: "admin" },
    };
    const res = createMockRes();

    await updateUserPrivilege(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "Admins cannot be demoted" });
    expect(repositoryMocks.existsUserByRoleExcludingId).not.toHaveBeenCalled();
    expect(repositoryMocks.updateUserPrivilegeById).not.toHaveBeenCalled();
    expect(setUserRoleClaimMock).not.toHaveBeenCalled();
  });

  it("deleteUser blocks deleting the last admin", async () => {
    repositoryMocks.findUserById.mockResolvedValueOnce({
      id: "507f1f77bcf86cd799439011",
      firebaseuuid: "firebase-uid-1",
      role: "admin",
    });
    repositoryMocks.existsUserByRoleExcludingId.mockResolvedValueOnce(false);

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      user: { uid: "firebase-uid-1", role: "admin" },
    };
    const res = createMockRes();

    await deleteUser(req, res);

    expect(repositoryMocks.existsUserByRoleExcludingId).toHaveBeenCalledWith(
      "admin",
      "507f1f77bcf86cd799439011",
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "Cannot delete the last admin" });
    expect(repositoryMocks.deleteUserById).not.toHaveBeenCalled();
  });

  it("deleteUser allows deleting an admin when other admins still exist", async () => {
    repositoryMocks.findUserById.mockResolvedValueOnce({
      id: "507f1f77bcf86cd799439011",
      firebaseuuid: "firebase-uid-2",
      role: "admin",
    });
    repositoryMocks.existsUserByRoleExcludingId.mockResolvedValueOnce(true);
    repositoryMocks.deleteUserById.mockResolvedValueOnce({
      id: "507f1f77bcf86cd799439011",
    });

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      user: { uid: "firebase-uid-1", role: "admin" },
    };
    const res = createMockRes();

    await deleteUser(req, res);

    expect(repositoryMocks.deleteUserById).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
    );
    expect(res.statusCode).toBe(200);
  });
});
