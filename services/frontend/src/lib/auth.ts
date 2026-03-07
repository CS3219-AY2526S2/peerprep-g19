export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setToken(token: string, keepSignedIn: boolean) {
  const maxAge = keepSignedIn ? 86400 : ""; // 1 day or session cookie
  document.cookie = `token=${encodeURIComponent(token)}; path=/; SameSite=Lax${maxAge ? `; max-age=${maxAge}` : ""}`;
}

export function clearToken() {
  document.cookie = "token=; path=/; max-age=0";
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
