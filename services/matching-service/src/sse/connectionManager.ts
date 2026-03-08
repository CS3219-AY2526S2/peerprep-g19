import { Response } from "express";

const connections = new Map<string, Response>();

export function registerConnection(email: string, res: Response) {

  const existing = connections.get(email);

  if (existing) {
    existing.end();
  }

  connections.set(email, res);
}

export function sendEvent(email: string, data: any) {

  const client = connections.get(email);

  if (!client) return;

  client.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function closeConnection(email: string) {

  const client = connections.get(email);

  if (!client) return;

  client.end();
  connections.delete(email);

}