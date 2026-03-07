import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_FILE_EXTENSIONS,
} from "../collaboration";

describe("collaboration types", () => {
  it("has all expected supported languages", () => {
    expect(SUPPORTED_LANGUAGES).toContain("python3");
    expect(SUPPORTED_LANGUAGES).toContain("java");
    expect(SUPPORTED_LANGUAGES).toContain("cpp");
    expect(SUPPORTED_LANGUAGES).toContain("c");
    expect(SUPPORTED_LANGUAGES).toHaveLength(4);
  });

  it("has labels for all supported languages", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(LANGUAGE_LABELS[lang]).toBeDefined();
      expect(typeof LANGUAGE_LABELS[lang]).toBe("string");
    }
  });

  it("has file extensions for all supported languages", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(LANGUAGE_FILE_EXTENSIONS[lang]).toBeDefined();
      expect(LANGUAGE_FILE_EXTENSIONS[lang]).toContain(".");
    }
  });

  it("maps correct labels", () => {
    expect(LANGUAGE_LABELS.python3).toBe("Python 3");
    expect(LANGUAGE_LABELS.java).toBe("Java");
    expect(LANGUAGE_LABELS.cpp).toBe("C++");
    expect(LANGUAGE_LABELS.c).toBe("C");
  });

  it("maps correct file extensions", () => {
    expect(LANGUAGE_FILE_EXTENSIONS.python3).toBe("solution.py");
    expect(LANGUAGE_FILE_EXTENSIONS.java).toBe("Solution.java");
    expect(LANGUAGE_FILE_EXTENSIONS.cpp).toBe("solution.cpp");
    expect(LANGUAGE_FILE_EXTENSIONS.c).toBe("solution.c");
  });
});
