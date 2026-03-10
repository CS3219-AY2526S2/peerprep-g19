import { describe, it, expect, beforeEach } from "vitest";
import { getToken, setToken, clearToken, decodeJwtPayload } from "../auth";

describe("auth", () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      document.cookie = `${name}=; path=/; max-age=0`;
    });
  });

  describe("getToken", () => {
    it("returns null when no token cookie exists", () => {
      expect(getToken()).toBeNull();
    });

    it("returns the token value when cookie exists", () => {
      document.cookie = "token=abc123; path=/";
      expect(getToken()).toBe("abc123");
    });

    it("handles encoded token values", () => {
      document.cookie = `token=${encodeURIComponent("tok=en/val")}; path=/`;
      expect(getToken()).toBe("tok=en/val");
    });

    it("finds token among multiple cookies", () => {
      document.cookie = "other=value; path=/";
      document.cookie = "token=mytoken; path=/";
      document.cookie = "another=val; path=/";
      expect(getToken()).toBe("mytoken");
    });
  });

  describe("setToken", () => {
    it("sets a cookie with the token value", () => {
      setToken("tok123");
      expect(getToken()).toBe("tok123");
      expect(document.cookie).toContain("token=tok123");
    });

    it("overwrites an existing token", () => {
      setToken("old");
      setToken("new");
      expect(getToken()).toBe("new");
    });
  });

  describe("clearToken", () => {
    it("removes the token cookie", () => {
      setToken("remove-me");
      expect(getToken()).toBe("remove-me");
      clearToken();
      expect(getToken()).toBeNull();
    });
  });

  describe("decodeJwtPayload", () => {
    it("decodes a valid JWT payload", () => {
      const payload = { sub: "user123", role: "admin", exp: 9999999999 };
      const base64 = btoa(JSON.stringify(payload));
      const fakeJwt = `header.${base64}.signature`;
      expect(decodeJwtPayload(fakeJwt)).toEqual(payload);
    });

    it("returns null for invalid JWT", () => {
      expect(decodeJwtPayload("notajwt")).toBeNull();
    });

    it("returns null for malformed base64", () => {
      expect(decodeJwtPayload("a.!!!.c")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(decodeJwtPayload("")).toBeNull();
    });
  });
});
