import type { MatchingSSEEvent } from "@/types/matching";

const MATCHING_SERVICE_URL =
  process.env.NEXT_PUBLIC_MATCHING_SERVICE_URL || "http://localhost:3002";

export interface MatchingCallbacks {
  onQueueUpdate: (position: number, queueLength: number) => void;
  onMatchFound: (peerEmail: string) => void;
  onTimeout: () => void;
  onError: (error: Error) => void;
}

/**
 * Parse raw SSE text into individual event data strings.
 * Handles partial chunks by returning unconsumed remainder via buffer.
 */
export function parseSSEChunk(raw: string): { events: string[]; remainder: string } {
  const events: string[] = [];
  const parts = raw.split("\n\n");
  // Last part may be incomplete — keep as remainder
  const remainder = parts.pop() ?? "";

  for (const part of parts) {
    for (const line of part.split("\n")) {
      if (line.startsWith("data: ")) {
        events.push(line.slice(6));
      }
    }
  }

  return { events, remainder };
}

/**
 * Connect to the matching service SSE stream.
 * Calls leaveQueue first to handle stale queue entries.
 * Returns an AbortController to cancel the connection.
 */
export function connectToMatchingQueue(
  topic: string,
  difficulty: string,
  token: string,
  callbacks: MatchingCallbacks,
): AbortController {
  const controller = new AbortController();
  let eventHandled = false; // true after MATCH_FOUND or TIMEOUT

  (async () => {
    let response: Response;
    try {
      response = await fetch(`${MATCHING_SERVICE_URL}/api/v1/queue/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic, difficulty }),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      callbacks.onError(err instanceof Error ? err : new Error("Connection failed"));
      return;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      callbacks.onError(new Error(body.error || `HTTP ${response.status}`));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError(new Error("No response stream"));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, remainder } = parseSSEChunk(buffer);
        buffer = remainder;

        for (const raw of events) {
          try {
            const event = JSON.parse(raw) as MatchingSSEEvent;

            switch (event.type) {
              case "QUEUE_UPDATE":
                callbacks.onQueueUpdate(event.position, event.queueLength);
                break;
              case "MATCH_FOUND":
                eventHandled = true;
                callbacks.onMatchFound(event.peer);
                break;
              case "TIMEOUT":
                eventHandled = true;
                callbacks.onTimeout();
                break;
            }
          } catch {
            // Malformed JSON — skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Stream closed unexpectedly — only report if we haven't already handled a terminal event
      if (!eventHandled) {
        callbacks.onError(err instanceof Error ? err : new Error("Stream error"));
      }
    }
  })();

  return controller;
}

/**
 * Leave the matching queue. Swallows errors since the server may have
 * already cleaned up via the SSE connection close event.
 */
export async function leaveQueue(token: string): Promise<void> {
  await fetch(`${MATCHING_SERVICE_URL}/api/v1/queue/leave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => {});
}
