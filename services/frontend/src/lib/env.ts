// Define the interface for the global window object
declare global {
  interface Window {
    _env_?: Record<string, string>;
  }
}

export const getEnv = (key: string): string | undefined => {
  if (typeof window !== "undefined" && window._env_) {
    return window._env_[key] || process.env[key];
  }
  return process.env[key];
};