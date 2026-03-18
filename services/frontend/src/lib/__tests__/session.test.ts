import { describe, it, expect, vi, afterEach } from "vitest";
import { generateSessionId } from "../session";

describe("generateSessionId", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("produces the same ID regardless of email order", async () => {
    const a = await generateSessionId("alice@test.com", "bob@test.com");
    const b = await generateSessionId("bob@test.com", "alice@test.com");
    expect(a).toBe(b);
  });

  it("is case-insensitive", async () => {
    const a = await generateSessionId("Alice@Test.com", "BOB@test.com");
    const b = await generateSessionId("alice@test.com", "bob@test.com");
    expect(a).toBe(b);
  });

  it("returns a 16-character hex string", async () => {
    const id = await generateSessionId("a@b.com", "c@d.com");
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it("produces different IDs for different email pairs", async () => {
    const a = await generateSessionId("alice@test.com", "bob@test.com");
    const b = await generateSessionId("alice@test.com", "charlie@test.com");
    expect(a).not.toBe(b);
  });

  it("produces different IDs in different time buckets", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-03-09T12:00:00Z"));
    const a = await generateSessionId("a@b.com", "c@d.com");

    vi.setSystemTime(new Date("2026-03-09T12:06:00Z")); // 6 min later = different bucket
    const b = await generateSessionId("a@b.com", "c@d.com");

    expect(a).not.toBe(b);
  });

  it("produces the same ID within the same time bucket", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-03-09T12:00:00Z"));
    const a = await generateSessionId("a@b.com", "c@d.com");

    vi.setSystemTime(new Date("2026-03-09T12:04:00Z")); // 4 min later = same 5-min bucket
    const b = await generateSessionId("a@b.com", "c@d.com");

    expect(a).toBe(b);
  });
});
