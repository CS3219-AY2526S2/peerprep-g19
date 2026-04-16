"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  message: string;
  variant: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, variant?: Toast["variant"]) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: Toast["variant"] = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-md px-4 py-2.5 text-sm font-medium shadow-lg transition-all animate-slide-in",
              {
                "bg-green-600 text-white": t.variant === "success",
                "bg-red-600 text-white": t.variant === "error",
                "bg-gray-800 text-white": t.variant === "info",
              },
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
