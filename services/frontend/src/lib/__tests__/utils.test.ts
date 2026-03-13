import { describe, it, expect } from "vitest";
import { cn, getDifficultyColor } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "end")).toBe("base end");
  });

  it("merges tailwind classes correctly", () => {
    const result = cn("px-4 py-2", "px-6");
    expect(result).toContain("px-6");
    expect(result).toContain("py-2");
    expect(result).not.toContain("px-4");
  });

  it("handles undefined and null", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b");
  });
});

describe("getDifficultyColor", () => {
  it("returns green classes for Easy", () => {
    const result = getDifficultyColor("Easy");
    expect(result).toContain("green");
  });

  it("returns orange classes for Medium", () => {
    const result = getDifficultyColor("Medium");
    expect(result).toContain("orange");
  });

  it("returns red classes for Hard", () => {
    const result = getDifficultyColor("Hard");
    expect(result).toContain("red");
  });

  it("returns gray classes for unknown difficulty", () => {
    const result = getDifficultyColor("Unknown");
    expect(result).toContain("gray");
  });
});
