import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../auth-provider";

// Mock Firebase auth
const mockOnIdTokenChanged = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignOut = vi.fn();

vi.mock("firebase/auth", () => ({
  onIdTokenChanged: (...args: unknown[]) => mockOnIdTokenChanged(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUserWithEmailAndPassword(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  getAuth: vi.fn(() => ({ currentUser: null })),
}));

vi.mock("@/lib/firebase", () => ({
  auth: { currentUser: null },
}));

vi.mock("@/lib/auth", () => ({
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock("@/lib/api/user", () => ({
  registerUser: vi.fn(),
}));

import { setToken, clearToken } from "@/lib/auth";
import { registerUser } from "@/lib/api/user";
const mockSetToken = vi.mocked(setToken);
const mockClearToken = vi.mocked(clearToken);
const mockRegisterUser = vi.mocked(registerUser);

function TestConsumer() {
  const { user, loading, login, register, logout } = useAuth();
  return (
    <div>
      <p data-testid="loading">{loading ? "loading" : "ready"}</p>
      <p data-testid="user">{user ? user.username : "none"}</p>
      <button onClick={() => login("e@e.com", "pw")}>Login</button>
      <button onClick={() => register("bob", "b@e.com", "Pw123456")}>Register</button>
      <button onClick={() => void logout()}>Logout</button>
    </div>
  );
}

const mockUser = { id: "1", username: "alice", email: "a@e.com", role: "user" as const, createdAt: "" };

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: onIdTokenChanged calls callback with null (no user)
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      callback(null);
      return vi.fn(); // unsubscribe
    });
  });

  it("starts in loading state and resolves to no user when no Firebase user", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });
    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(mockClearToken).toHaveBeenCalled();
  });

  it("sets user when Firebase user is present on mount", async () => {
    const firebaseUser = { getIdToken: vi.fn().mockResolvedValue("firebase-token"), displayName: "alice", email: "a@e.com" };
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      callback(firebaseUser);
      return vi.fn();
    });
    mockRegisterUser.mockResolvedValue({ message: "ok", data: mockUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("alice");
    });
    expect(mockSetToken).toHaveBeenCalledWith("firebase-token");
    expect(mockRegisterUser).toHaveBeenCalledWith("alice");
  });

  it("uses email prefix as username fallback when displayName is null", async () => {
    const firebaseUser = { getIdToken: vi.fn().mockResolvedValue("tok"), displayName: null, email: "bob@test.com" };
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      callback(firebaseUser);
      return vi.fn();
    });
    mockRegisterUser.mockResolvedValue({ message: "ok", data: { ...mockUser, username: "bob" } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith("bob");
    });
  });

  it("clears user if registerUser fails", async () => {
    const firebaseUser = { getIdToken: vi.fn().mockResolvedValue("tok"), displayName: "x", email: "x@e.com" };
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      callback(firebaseUser);
      return vi.fn();
    });
    mockRegisterUser.mockRejectedValue(new Error("backend down"));

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

  it("handles login flow", async () => {
    const user = userEvent.setup();
    // Start with no user
    let authCallback: ((user: unknown) => void) | null = null;
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      authCallback = callback;
      callback(null); // initially no user
      return vi.fn();
    });

    const firebaseUser = { getIdToken: vi.fn().mockResolvedValue("new-token"), displayName: "bob", email: "b@e.com" };
    mockSignInWithEmailAndPassword.mockImplementation(async () => {
      // Simulate Firebase calling onIdTokenChanged after sign-in
      authCallback?.(firebaseUser);
    });
    mockRegisterUser.mockResolvedValue({ message: "ok", data: { ...mockUser, username: "bob" } });

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
    expect(mockSetToken).toHaveBeenCalledWith("new-token");
  });

  it("throws mapped error on login failure", async () => {
    const user = userEvent.setup();
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      callback(null);
      return vi.fn();
    });
    mockSignInWithEmailAndPassword.mockRejectedValue({ code: "auth/wrong-password" });

    // Capture the error from login
    let loginError: Error | null = null;
    function ErrorTestConsumer() {
      const { login } = useAuth();
      return (
        <button
          onClick={async () => {
            try {
              await login("e@e.com", "bad");
            } catch (err) {
              loginError = err as Error;
            }
          }}
        >
          Login
        </button>
      );
    }

    render(
      <AuthProvider>
        <ErrorTestConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByText("Login"));
    await waitFor(() => {
      expect(loginError).not.toBeNull();
    });
    expect(loginError!.message).toBe("Invalid email or password");
  });

  it("handles logout flow", async () => {
    const user = userEvent.setup();
    const firebaseUser = { getIdToken: vi.fn().mockResolvedValue("tok"), displayName: "alice", email: "a@e.com" };
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      callback(firebaseUser);
      return vi.fn();
    });
    mockRegisterUser.mockResolvedValue({ message: "ok", data: mockUser });
    mockSignOut.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("alice");
    });

    await user.click(screen.getByText("Logout"));

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("none");
    });
    expect(mockClearToken).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("throws mapped Firebase error on register failure", async () => {
    const user = userEvent.setup();
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      callback(null);
      return vi.fn();
    });
    mockCreateUserWithEmailAndPassword.mockRejectedValue({ code: "auth/email-already-in-use" });

    let registerError: Error | null = null;
    function ErrorTestConsumer() {
      const { register } = useAuth();
      return (
        <button
          onClick={async () => {
            try {
              await register("bob", "b@e.com", "Pw123456");
            } catch (err) {
              registerError = err as Error;
            }
          }}
        >
          Register
        </button>
      );
    }

    render(
      <AuthProvider>
        <ErrorTestConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByText("Register"));
    await waitFor(() => {
      expect(registerError).not.toBeNull();
    });
    expect(registerError!.message).toBe("An account with this email already exists");
  });

  it("throws API error when registerUser fails after Firebase account creation", async () => {
    const user = userEvent.setup();
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      callback(null);
      return vi.fn();
    });

    const firebaseUser = { getIdToken: vi.fn().mockResolvedValue("reg-token") };
    mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser });
    mockRegisterUser.mockRejectedValue(new Error("Backend unavailable"));

    let registerError: Error | null = null;
    function ErrorTestConsumer() {
      const { register } = useAuth();
      return (
        <button
          onClick={async () => {
            try {
              await register("bob", "b@e.com", "Pw123456");
            } catch (err) {
              registerError = err as Error;
            }
          }}
        >
          Register
        </button>
      );
    }

    render(
      <AuthProvider>
        <ErrorTestConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByText("Register"));
    await waitFor(() => {
      expect(registerError).not.toBeNull();
    });
    expect(registerError!.message).toBe("Backend unavailable");
  });

  it("handles register flow without triggering onIdTokenChanged race", async () => {
    const user = userEvent.setup();
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      callback(null);
      return vi.fn();
    });

    const firebaseUser = { getIdToken: vi.fn().mockResolvedValue("reg-token") };
    mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser });
    mockRegisterUser.mockResolvedValue({ message: "ok", data: { ...mockUser, username: "bob" } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    await user.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("bob");
    });
    expect(mockSetToken).toHaveBeenCalledWith("reg-token");
    // registerUser should be called once with the chosen username, not with email prefix
    expect(mockRegisterUser).toHaveBeenCalledWith("bob");
    expect(mockRegisterUser).toHaveBeenCalledTimes(1);
  });

  it("throws when useAuth is used outside provider", () => {
    function Bad() {
      useAuth();
      return null;
    }
    expect(() => render(<Bad />)).toThrow("useAuth must be used within AuthProvider");
  });
});
