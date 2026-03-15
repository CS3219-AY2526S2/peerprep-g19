import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "../input";

describe("Input", () => {
  it("renders without label", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("generates id from label", () => {
    render(<Input label="First Name" />);
    const input = screen.getByLabelText("First Name");
    expect(input.id).toBe("first-name");
  });

  it("uses provided id over generated one", () => {
    render(<Input label="Email" id="custom-id" />);
    expect(screen.getByLabelText("Email").id).toBe("custom-id");
  });

  it("shows error message", () => {
    render(<Input label="Email" error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("applies error styling when error exists", () => {
    render(<Input label="Email" error="Invalid" />);
    const input = screen.getByLabelText("Email");
    expect(input.className).toContain("border-red-500");
  });

  it("does not show error styling without error", () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input.className).not.toContain("border-red-500");
  });

  it("passes through HTML attributes", () => {
    render(<Input type="password" required />);
    const input = document.querySelector("input[type=password]");
    expect(input).not.toBeNull();
    expect(input).toHaveAttribute("required");
  });
});
