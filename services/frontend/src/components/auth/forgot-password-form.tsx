"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await forgotPassword(email);
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-sm border border-gray-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-1 text-sm text-gray-500">Enter your email to receive a reset link</p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="rounded-md border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-700">
              If an account with this email exists, a password reset link has been sent.
            </p>
          </div>
        )}

        {error && !success && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-2 text-center text-sm text-gray-500">
          <p>
            Remember your password?{" "}
            <Link href="/login" className="text-[#5568EE] hover:underline">
              Sign in
            </Link>
          </p>
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#5568EE] hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
