import { describe, expect, it, vi } from "vitest";

const verifyIdTokenMock = vi.fn();
const findUserByIdMock = vi.fn();

vi.mock("../config/firebase.js", () => ({
  default: {
    auth: () => ({
      verifyIdToken: verifyIdTokenMock,
    }),
  },
}));

vi.mock("../model/repository.js", () => ({
  findUserById: findUserByIdMock,
}));

const { verifyAccessToken, verifyIsAdmin, verifyIsOwnerOrAdmin } = await import(
  "../middleware/basic-access-control.js"
);

const FORBIDDEN_MESSAGE = "Not authorized to access this resource";

function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
  };

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (payload) => {
    res.body = payload;
    return res;
  };

  return res;
}

describe("basic-access-control middleware", () => {
  it("verifyAccessToken returns 401 when auth header is missing", async () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = vi.fn();

    await verifyAccessToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "Authentication failed" });
  });

  it("verifyAccessToken sets req.user and calls next for valid Firebase token", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: "owner-id", role: "user" });

    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = createMockRes();
    const next = vi.fn();

    await verifyAccessToken(req, res, next);

    expect(verifyIdTokenMock).toHaveBeenCalledWith("valid-token");
    expect(req.user).toEqual({ uid: "owner-id", role: "user" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("verifyAccessToken returns 401 when Firebase token is invalid", async () => {
    verifyIdTokenMock.mockRejectedValueOnce(new Error("bad token"));

    const req = { headers: { authorization: "Bearer invalid-token" } };
    const res = createMockRes();
    const next = vi.fn();

    await verifyAccessToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "Authentication failed" });
  });

  it("verifyIsAdmin calls next when user is admin", () => {
    const req = { user: { role: "admin" } };
    const res = createMockRes();
    const next = vi.fn();

    verifyIsAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBeNull();
  });

  it("verifyIsAdmin returns 403 when user is not admin", () => {
    const req = { user: { role: "user" } };
    const res = createMockRes();
    const next = vi.fn();

    verifyIsAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: FORBIDDEN_MESSAGE });
  });

  it("verifyIsOwnerOrAdmin calls next when request user owns target resource", async () => {
    const req = {
      user: { uid: "owner-uid", role: "user" },
      params: { uid: "owner-uid" },
    };
    const res = createMockRes();
    const next = vi.fn();

    await verifyIsOwnerOrAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("verifyIsOwnerOrAdmin calls next when mongo user id maps to token uid", async () => {
    findUserByIdMock.mockResolvedValueOnce({ firebaseuuid: "owner-uid" });
    const req = {
      user: { uid: "owner-uid", role: "user" },
      params: { id: "507f1f77bcf86cd799439011" },
    };
    const res = createMockRes();
    const next = vi.fn();

    await verifyIsOwnerOrAdmin(req, res, next);

    expect(findUserByIdMock).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(next).toHaveBeenCalledOnce();
  });

  it("verifyIsOwnerOrAdmin returns 403 when user is neither owner nor admin", async () => {
    findUserByIdMock.mockResolvedValueOnce({ firebaseuuid: "someone-else" });
    const req = {
      user: { uid: "user-uid", role: "user" },
      params: { id: "507f1f77bcf86cd799439011" },
    };
    const res = createMockRes();
    const next = vi.fn();

    await verifyIsOwnerOrAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: FORBIDDEN_MESSAGE });
  });
});
