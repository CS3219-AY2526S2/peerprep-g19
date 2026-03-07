import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../toast";

function TestConsumer() {
  const { toast } = useToast();
  return (
    <div>
      <button onClick={() => toast("Success message", "success")}>Show Success</button>
      <button onClick={() => toast("Error message", "error")}>Show Error</button>
      <button onClick={() => toast("Info message")}>Show Info</button>
    </div>
  );
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children", () => {
    render(
      <ToastProvider>
        <p>App content</p>
      </ToastProvider>,
    );
    expect(screen.getByText("App content")).toBeInTheDocument();
  });

  it("shows toast on trigger", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText("Show Success").click();
    });
    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("auto-dismisses toast after 3 seconds", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText("Show Info").click();
    });
    expect(screen.getByText("Info message")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.queryByText("Info message")).not.toBeInTheDocument();
  });

  it("throws when useToast is used outside provider", () => {
    function BadComponent() {
      useToast();
      return null;
    }
    expect(() => render(<BadComponent />)).toThrow("useToast must be used within ToastProvider");
  });
});
