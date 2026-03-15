import { describe, it, expect, beforeEach } from "vitest";
import {
  createSession,
  addUser,
  removeUser,
  endSession,
  changeLanguage,
  getUserCount,
  type SessionState,
} from "../src/session.js";

describe("createSession", () => {
  it("creates session with empty users, python3 language, ended=false", () => {
    const session = createSession();
    expect(session.users.size).toBe(0);
    expect(session.language).toBe("python3");
    expect(session.ended).toBe(false);
  });
});

describe("addUser", () => {
  let session: SessionState;

  beforeEach(() => {
    session = createSession();
  });

  it("adds first user successfully", () => {
    const result = addUser(session, "conn-1", "user-1", "Alice");
    expect(result).toEqual({ ok: true });
    expect(session.users.size).toBe(1);
    expect(session.users.get("conn-1")?.username).toBe("Alice");
  });

  it("adds second user successfully", () => {
    addUser(session, "conn-1", "user-1", "Alice");
    const result = addUser(session, "conn-2", "user-2", "Bob");
    expect(result).toEqual({ ok: true });
    expect(session.users.size).toBe(2);
  });

  it("rejects third user (session full)", () => {
    addUser(session, "conn-1", "user-1", "Alice");
    addUser(session, "conn-2", "user-2", "Bob");
    const result = addUser(session, "conn-3", "user-3", "Charlie");
    expect(result).toEqual({ ok: false, error: "Session full" });
    expect(session.users.size).toBe(2);
  });

  it("rejects if session has ended", () => {
    endSession(session);
    const result = addUser(session, "conn-1", "user-1", "Alice");
    expect(result).toEqual({ ok: false, error: "Session has ended" });
  });
});

describe("removeUser", () => {
  let session: SessionState;

  beforeEach(() => {
    session = createSession();
    addUser(session, "conn-1", "user-1", "Alice");
    addUser(session, "conn-2", "user-2", "Bob");
  });

  it("removes existing user and returns user object", () => {
    const removed = removeUser(session, "conn-1");
    expect(removed).toEqual({ userId: "user-1", username: "Alice", connectionId: "conn-1" });
    expect(session.users.size).toBe(1);
  });

  it("returns null for unknown connectionId", () => {
    const removed = removeUser(session, "conn-999");
    expect(removed).toBeNull();
    expect(session.users.size).toBe(2);
  });

  it("decrements user count", () => {
    expect(getUserCount(session)).toBe(2);
    removeUser(session, "conn-1");
    expect(getUserCount(session)).toBe(1);
  });
});

describe("endSession", () => {
  it("sets ended to true", () => {
    const session = createSession();
    expect(session.ended).toBe(false);
    endSession(session);
    expect(session.ended).toBe(true);
  });

  it("subsequent addUser calls fail", () => {
    const session = createSession();
    endSession(session);
    const result = addUser(session, "conn-1", "user-1", "Alice");
    expect(result).toEqual({ ok: false, error: "Session has ended" });
  });
});

describe("changeLanguage", () => {
  let session: SessionState;

  beforeEach(() => {
    session = createSession();
  });

  it("changes to valid language python3", () => {
    expect(changeLanguage(session, "python3")).toBe(true);
    expect(session.language).toBe("python3");
  });

  it("changes to valid language java", () => {
    expect(changeLanguage(session, "java")).toBe(true);
    expect(session.language).toBe("java");
  });

  it("changes to valid language cpp", () => {
    expect(changeLanguage(session, "cpp")).toBe(true);
    expect(session.language).toBe("cpp");
  });

  it("changes to valid language c", () => {
    expect(changeLanguage(session, "c")).toBe(true);
    expect(session.language).toBe("c");
  });

  it("rejects invalid language, returns false", () => {
    expect(changeLanguage(session, "ruby")).toBe(false);
    expect(session.language).toBe("python3"); // unchanged
  });

  it("rejects empty language", () => {
    expect(changeLanguage(session, "")).toBe(false);
  });
});

describe("getUserCount", () => {
  it("returns 0 for empty session", () => {
    const session = createSession();
    expect(getUserCount(session)).toBe(0);
  });

  it("returns 1 after one user added", () => {
    const session = createSession();
    addUser(session, "conn-1", "user-1", "Alice");
    expect(getUserCount(session)).toBe(1);
  });

  it("returns 0 after user removed", () => {
    const session = createSession();
    addUser(session, "conn-1", "user-1", "Alice");
    removeUser(session, "conn-1");
    expect(getUserCount(session)).toBe(0);
  });
});
