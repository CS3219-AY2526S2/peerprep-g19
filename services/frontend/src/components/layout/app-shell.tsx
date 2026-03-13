"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/providers/auth-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#5568EE]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  );
}
