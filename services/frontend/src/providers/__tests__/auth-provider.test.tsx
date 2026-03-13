import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../auth-provider";

// Mock auth and user API
vi.mock("@/lib/auth", () => ({
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock("@/lib/api/user", () => ({
  login: vi.fn(),
  verifyToken: vi.fn(),
}));

import { getToken, setToken, clearToken } from "@/lib/auth";
import { login as apiLogin, verifyToken } from "@/lib/api/user";

const mockGetToken = vi.mocked(getToken);
const mockSetToken = vi.mocked(setToken);
const mockClearToken = vi.mocked(clearToken);
const mockApiLogin = vi.mocked(apiLogin);
const mockVerifyToken = vi.mocked(verifyToken);

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <p data-testid="loading">{loading ? "loading" : "ready"}</p>
      <p data-testid="user">{user ? user.username : "none"}</p>
      <button onClick={() => login("e@e.com", "pw", false)}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockReturnValue(null);
  });

  it("starts in loading state and resolves to no user when no token", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("verifies existing token on mount", async () => {
    mockGetToken.mockReturnValue("existing-token");
    mockVerifyToken.mockResolvedValue({
      message: "ok",
      data: { id: "1", username: "alice", email: "a@e.com", role: "user", createdAt: "" },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("alice");
    });
    expect(mockVerifyToken).toHaveBeenCalledOnce();
  });

  it("clears token on verify failure", async () => {
    mockGetToken.mockReturnValue("bad-token");
    mockVerifyToken.mockRejectedValue(new Error("invalid"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });
    expect(mockClearToken).toHaveBeenCalledOnce();
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("handles login flow", async () => {
    const user = userEvent.setup();
    mockApiLogin.mockResolvedValue({
      message: "ok",
      data: {
        accessToken: "new-token",
        id: "2",
        username: "bob",
        email: "b@e.com",
        role: "user",
        createdAt: "",
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    await user.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("bob");
    });
    expect(mockSetToken).toHaveBeenCalledWith("new-token", false);
  });

  it("handles logout flow", async () => {
    const user = userEvent.setup();
    mockGetToken.mockReturnValue("tok");
    mockVerifyToken.mockResolvedValue({
      message: "ok",
      data: { id: "1", username: "alice", email: "a@e.com", role: "user", createdAt: "" },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("alice");
    });

    await user.click(screen.getByText("Logout"));
    expect(mockClearToken).toHaveBeenCalled();
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("throws when useAuth is used outside provider", () => {
    function Bad() {
      useAuth();
      return null;
    }
    expect(() => render(<Bad />)).toThrow("useAuth must be used within AuthProvider");
  });
});
