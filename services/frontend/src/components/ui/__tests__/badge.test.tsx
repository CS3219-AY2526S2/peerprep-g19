import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Arrays</Badge>);
    expect(screen.getByText("Arrays")).toBeInTheDocument();
  });

  it("applies default variant styling", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge.className).toContain("bg-gray-100");
  });

  it("applies difficulty variant with Easy", () => {
    render(
      <Badge variant="difficulty" difficulty="Easy">
        Easy
      </Badge>,
    );
    const badge = screen.getByText("Easy");
    expect(badge.className).toContain("green");
  });

  it("applies difficulty variant with Medium", () => {
    render(
      <Badge variant="difficulty" difficulty="Medium">
        Medium
      </Badge>,
    );
    expect(screen.getByText("Medium").className).toContain("orange");
  });

  it("applies difficulty variant with Hard", () => {
    render(
      <Badge variant="difficulty" difficulty="Hard">
        Hard
      </Badge>,
    );
    expect(screen.getByText("Hard").className).toContain("red");
  });

  it("falls back to default when difficulty variant has no difficulty prop", () => {
    render(<Badge variant="difficulty">No Diff</Badge>);
    expect(screen.getByText("No Diff").className).toContain("bg-gray-100");
  });

  it("merges custom className", () => {
    render(<Badge className="extra">Tag</Badge>);
    expect(screen.getByText("Tag").className).toContain("extra");
  });
});
