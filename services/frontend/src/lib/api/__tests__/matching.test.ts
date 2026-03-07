import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { startMatching, cancelMatching } from "../matching";

describe("matching API (placeholder)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a mock MatchResult after delay", async () => {
    const promise = startMatching("Easy", "Arrays");
    // Advance past the max delay (5000ms)
    await vi.advanceTimersByTimeAsync(6000);
    const result = await promise;
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("sessionId");
    expect(result).toHaveProperty("partnerId", "mock-partner-id");
    expect(result).toHaveProperty("partnerName", "Partner");
    expect(result).toHaveProperty("questionTitle", "Course Schedule");
  });

  it("returns null when cancelled", async () => {
    const promise = startMatching("Hard", "Graphs");
    cancelMatching();
    await vi.advanceTimersByTimeAsync(6000);
    const result = await promise;
    expect(result).toBeNull();
  });
});
