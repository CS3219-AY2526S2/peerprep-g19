"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";

export function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // TODO: PLACEHOLDER — Implement server-side login attempt tracking & lockout after 5 fails
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setError("Account temporarily locked. Please try again later.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await login(email, password, keepSignedIn);
      router.push("/match");
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (err instanceof ApiError) {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(
          remaining > 0
            ? `Invalid credentials. ${remaining} attempt${remaining !== 1 ? "s" : ""} left before lockout.`
            : "Account temporarily locked. Please try again later.",
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-sm border border-gray-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to PeerPrep</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="rounded border-gray-300"
              />
              Keep me signed in
            </label>
            <button
              type="button"
              className="text-sm text-[#5568EE] hover:underline cursor-pointer"
              // TODO: PLACEHOLDER — Implement forgot password flow with backend endpoint
              onClick={() => alert("Forgot password flow not yet implemented")}
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#5568EE] hover:underline">
            Create one
          </Link>
        </p>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
