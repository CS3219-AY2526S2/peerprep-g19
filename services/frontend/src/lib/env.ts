/**
 * Utility to fetch environment variables at runtime.
 * This is necessary because Next.js bakes process.env variables into the 
 * bundle at build time, but we need to inject them at container startup.
 */
export const getEnv = (key: string): string | undefined => {
  // Check if we are in the browser and if the runtime config exists
  if (typeof window !== "undefined" && (window as any)._env_) {
    return (window as any)._env_[key] || process.env[key];
  }
  
  // Fallback to standard process.env for server-side or build-time execution
  return process.env[key];
};