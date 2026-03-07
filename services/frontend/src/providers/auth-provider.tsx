"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getToken, setToken, clearToken } from "@/lib/auth";
import { login as apiLogin, verifyToken } from "@/lib/api/user";
import type { User } from "@/types/user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, keepSignedIn: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    verifyToken()
      .then((res) => setUser(res.data))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, keepSignedIn: boolean) => {
    const res = await apiLogin(email, password);
    setToken(res.data.accessToken, keepSignedIn);
    setUser({
      id: res.data.id,
      username: res.data.username,
      email: res.data.email,
      role: res.data.role,
      createdAt: res.data.createdAt,
    });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
