import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch, ApiError } from "../client";

// Mock auth module
vi.mock("@/lib/auth", () => ({
  getToken: vi.fn(() => null),
}));

import { getToken } from "@/lib/auth";
const mockGetToken = vi.mocked(getToken);

describe("ApiError", () => {
  it("has correct name and status", () => {
    const err = new ApiError(404, "Not found");
    expect(err.name).toBe("ApiError");
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetToken.mockReturnValue(null);
  });

  it("makes a GET request with JSON content-type", async () => {
    const mockData = { message: "ok" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await apiFetch("/api/test");
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith("/api/test", {
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("includes Authorization header when token exists", async () => {
    mockGetToken.mockReturnValue("mytoken");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiFetch("/api/test");
    expect(fetch).toHaveBeenCalledWith("/api/test", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer mytoken",
      },
    });
  });

  it("passes through custom options", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiFetch("/api/test", {
      method: "POST",
      body: JSON.stringify({ data: true }),
    });

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[1].method).toBe("POST");
    expect(callArgs[1].body).toBe('{"data":true}');
  });

  it("throws ApiError on non-ok response with message", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Bad request" }),
    });

    await expect(apiFetch("/api/test")).rejects.toThrow(ApiError);
    await expect(apiFetch("/api/test")).rejects.toMatchObject({
      status: 400,
      message: "Bad request",
    });
  });

  it("throws ApiError with detail field fallback", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ detail: "Service unavailable" }),
    });

    await expect(apiFetch("/api/test")).rejects.toMatchObject({
      status: 503,
      message: "Service unavailable",
    });
  });

  it("throws ApiError with default message when body parse fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("parse error")),
    });

    await expect(apiFetch("/api/test")).rejects.toMatchObject({
      status: 500,
      message: "Request failed",
    });
  });
});
