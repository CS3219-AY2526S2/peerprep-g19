import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRes } from "./test-utils.js";

const verifyIdTokenMock = vi.fn();
const setCustomUserClaimsMock = vi.fn();
const createUserMock = vi.fn();
const findUserByFirebaseUuidMock = vi.fn();

vi.mock("../config/firebase.js", () => ({
  default: {
    auth: () => ({
      verifyIdToken: verifyIdTokenMock,
      setCustomUserClaims: setCustomUserClaimsMock,
    }),
  },
}));

vi.mock("../model/repository.js", () => ({
  createUser: createUserMock,
  findUserByFirebaseUuid: findUserByFirebaseUuidMock,
}));

vi.mock("../controller/user-controller.js", () => ({
  formatUserResponse: (user) => user,
}));

const { handleRegister } = await import("../controller/auth-controller.js");

describe("auth-controller Firebase flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handleRegister returns 201 when Firebase token is valid", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({
      uid: "firebase-uid-1",
      email: "user@example.com",
    });
    findUserByFirebaseUuidMock.mockResolvedValueOnce(null);
    setCustomUserClaimsMock.mockResolvedValueOnce();
    createUserMock.mockResolvedValueOnce({
      id: "mongo-id-1",
      username: "Test User",
      email: "user@example.com",
      firebaseuuid: "firebase-uid-1",
      role: "user",
    });

    const req = {
      body: { name: "Test User" },
      headers: { authorization: "Bearer id-token" },
    };
    const res = createMockRes();

    await handleRegister(req, res);

    expect(verifyIdTokenMock).toHaveBeenCalledWith("id-token");
    expect(setCustomUserClaimsMock).toHaveBeenCalledWith("firebase-uid-1", {
      role: "user",
    });
    expect(createUserMock).toHaveBeenCalledWith({
      firebaseuuid: "firebase-uid-1",
      email: "user@example.com",
      username: "Test User",
      role: "user",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User registered");
  });

  it("handleRegister returns 200 when user already exists", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({
      uid: "firebase-uid-1",
      email: "user@example.com",
    });
    findUserByFirebaseUuidMock.mockResolvedValueOnce({
      id: "mongo-id-1",
      username: "Test User",
      email: "user@example.com",
      firebaseuuid: "firebase-uid-1",
      role: "user",
    });

    const req = {
      body: { name: "Test User" },
      headers: { authorization: "Bearer existing-token" },
    };
    const res = createMockRes();

    await handleRegister(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User already registered");
    expect(setCustomUserClaimsMock).not.toHaveBeenCalled();
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("handleRegister returns 500 when Firebase token verification fails", async () => {
    verifyIdTokenMock.mockRejectedValueOnce(new Error("invalid token"));

    const req = {
      body: { name: "Test User" },
      headers: { authorization: "Bearer bad-token" },
    };
    const res = createMockRes();

    await handleRegister(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("invalid token");
  });
});
