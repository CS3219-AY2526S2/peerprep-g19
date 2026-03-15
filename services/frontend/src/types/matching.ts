export interface QueueUpdateEvent {
  type: "QUEUE_UPDATE";
  position: number;
  top5: string[];
  queueLength: number;
}

export interface MatchFoundEvent {
  type: "MATCH_FOUND";
  peer: string;
}

export interface TimeoutEvent {
  type: "TIMEOUT";
}

export type MatchingSSEEvent = QueueUpdateEvent | MatchFoundEvent | TimeoutEvent;
