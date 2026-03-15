import { Response } from "express";

interface ManagedConnection {
  res: Response;
  cleanup?: () => void;
}

const connections = new Map<string, ManagedConnection>();

export function registerConnection(email: string, res: Response) {

  const existing = connections.get(email);

  if (existing) {
    existing.cleanup?.();
    existing.res.end();
  }

  connections.set(email, { res });
}

/**
 * Attach a cleanup callback (clears intervals) so that closeConnection()
 * can stop the per-connection timers created in queueController.
 */
export function setCleanup(email: string, fn: () => void) {
  const conn = connections.get(email);
  if (conn) conn.cleanup = fn;
}

/**
 * Check if a specific Response is still the active connection for this email.
 */
export function isActiveConnection(email: string, res: Response): boolean {
  return connections.get(email)?.res === res;
}

export function sendEvent(email: string, data: any) {

  const conn = connections.get(email);

  if (!conn) return;

  conn.res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function closeConnection(email: string) {

  const conn = connections.get(email);

  if (!conn) return;

  conn.cleanup?.();
  conn.res.end();
  connections.delete(email);
}
