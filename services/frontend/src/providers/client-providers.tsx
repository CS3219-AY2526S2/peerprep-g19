"use client";

import { AuthProvider } from "@/providers/auth-provider";
import { ToastProvider } from "@/components/ui/toast";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
