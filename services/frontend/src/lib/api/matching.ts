// TODO: PLACEHOLDER — Replace entire file with real matching service API calls
// The matching service does not exist yet. All functions below are stubs that
// simulate matching behaviour with timeouts and mock data.

export interface MatchResult {
  sessionId: string;
  partnerId: string;
  partnerName: string;
  questionTitle: string;
}

let aborted = false;

export async function startMatching(
  _difficulty: string,
  _topic: string,
): Promise<MatchResult | null> {
  aborted = false;

  // TODO: PLACEHOLDER — Replace with WebSocket connection to matching service
  const delay = 3000 + Math.random() * 2000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (aborted) return null;

  return {
    sessionId: Math.random().toString(16).slice(2, 8),
    partnerId: "mock-partner-id",
    partnerName: "Partner",
    // TODO: PLACEHOLDER — Question should come from matching service after pairing
    questionTitle: "Course Schedule",
  };
}

export function cancelMatching() {
  // TODO: PLACEHOLDER — Send cancel request to matching service
  aborted = true;
}
