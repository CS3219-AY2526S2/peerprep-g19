import { Response } from 'express';
import { QueueUpdateEvent, MatchFoundEvent, TimeoutEvent } from '../types';

type SSEPayload = QueueUpdateEvent | MatchFoundEvent | TimeoutEvent;

const connections = new Map<string, Response>();

export function addConnection(userId: string, res: Response) {
  const existing = connections.get(userId);
  if (existing) {
    try { existing.end(); } catch (_) {}
  }
  connections.set(userId, res);
}

export function removeConnection(userId: string) {
  connections.delete(userId);
}

// NEW — lets other modules reach the active response for a user
export function getResponse(userId: string): Response | undefined {
  return connections.get(userId);
}

export function sendEvent(userId: string, payload: SSEPayload): boolean {
  const res = connections.get(userId);
  if (!res) return false;
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  return true;
}

export function closeConnection(userId: string) {
  const res = connections.get(userId);
  if (res) {
    try { res.end(); } catch (_) {}
    connections.delete(userId);
  }
}