# AI Usage Log Marcus Ang Jing Heng

Below are the key prompts used during development. These represent actual conversations with the AI assistant. In all cases architecture was defined first manually. AI was only used for implementation support after design was finalised.

Many prompts required providing full context of existing codebase and architectural constraints. For brevity log entries show only the core request command.

---

## Log Entry 1
# Date/Time:
2026-03-11 00:37
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> switch the matching service auth from the custom JWT middleware to Firebase Admin SDK verifyIdToken so it matches user-service
**Output Summary:**
Replaced the custom middleware with `admin.auth().verifyIdToken(token)` in `queue-service/src/middleware/auth.ts`, added Firebase admin config, wired initializeFirebase into server startup.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Kept the core verify call but tightened the error shape returned to clients so it matches the other services, and added a dev-mode warning when FIREBASE_CLIENT_EMAIL is unset so mis-configs fail loudly instead of silently rejecting every request.

---

## Log Entry 2
# Date/Time:
2026-03-11 00:38
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> find the race conditions in queue-service and match-worker — users are sometimes matched twice or removed from the queue without a match event
**Output Summary:**
Identified that the non-atomic ZRANGE + ZREM in the worker allowed two workers to read the same pair, and that the queue-service cleanup could run between a match and its publish. Proposed a Lua script for atomic pop and moving user metadata DEL inside the matched branch.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Took the Lua approach but rewrote the script to also short-circuit when ZCARD < 2 so we avoid the extra ZRANGE roundtrip on an empty queue. Verified by spinning up three workers locally and confirming each user is paired exactly once.

---

## Log Entry 3
# Date/Time:
2026-03-11 00:38
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> replace the home-grown auth context in the frontend with the Firebase client SDK, keep the existing AuthProvider API so components do not change
**Output Summary:**
Swapped the custom login/signup calls for `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`, moved token retrieval to `getIdToken()`, kept the same `useAuth()` hook shape.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
The generated code stored the ID token in localStorage on every render, which was wasteful. I changed it to rely on `onIdTokenChanged` so tokens auto-refresh. Also added a small `getToken()` helper so non-React code (like SSE connection logic) can grab the current token without pulling in React.

---

## Log Entry 4
# Date/Time:
2026-03-11 00:38
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> wire the /match/finding page to the real SSE endpoint on queue-service, handle QUEUE_UPDATE / MATCH_FOUND / TIMEOUT events
**Output Summary:**
Generated a `connectToMatchingQueue` helper using `fetch` + `ReadableStream` (EventSource doesn't support custom headers), parsed the SSE frames, exposed callbacks for each event type.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
The parser concatenated chunks without handling partial frames split across TCP packets, which showed up as dropped events when the server flushed small updates. I rewrote the chunk parser to buffer a remainder across reads and return only complete `data:` lines.

---

## Log Entry 5
# Date/Time:
2026-03-11 00:40
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> write the websocket protocol spec for the collaboration service readme — both client→server and server→client messages, plus error codes
**Output Summary:**
Generated the full message table, error code table, session state table, and supported languages table.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Reworded several descriptions to match how the code actually behaves (the AI assumed stronger guarantees than the implementation had at the time — e.g. it claimed the `token` field was verified). Left "TODO" placeholders at the bottom for items the team hadn't agreed on yet.

---

## Log Entry 6
# Date/Time:
2026-03-16 17:51
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> move the search / filter / pagination logic from the frontend list view into the question-service backend — frontend should just pass params and render
**Output Summary:**
Added `skip` / `limit` / `search` / `difficulty` / `topic` query params on FastAPI, implemented paginated MongoDB queries with a `hasMore` flag, updated the frontend `listQuestions` to pass them through.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Kept the backend signature but capped `limit` at 100 server-side to stop the UI from accidentally requesting the whole bank. Also switched the frontend from in-memory filtering to forwarding the search box into the query param so it works on paginated data.

---

## Log Entry 7
# Date/Time:
2026-04-01 20:02
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> when a session ends in the collaboration service, record the attempt to user-service so it shows up in history
**Output Summary:**
Added a `saveAttempt` call in the session-room client that POSTs `{questionTitle, topic, difficulty, status, durationSeconds, language, sessionId}` to `/api/users/<uid>/attempts` on end-session or session-ended.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
The initial version POSTed twice (once on local end-session, once on the server broadcast echoing back). Added a `recordAttempt` ref guard so it fires exactly once per tab. Also moved the duration calculation to use a `sessionStartRef` captured on mount instead of using `Date.now()` at end time so it reflects total session length.

---

## Log Entry 8
# Date/Time:
2026-04-05 12:57
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> set up a root docker compose that runs all services plus redis and mongo, with firebase env vars threaded through, and health checks
**Output Summary:**
Produced a compose.yaml with redis, mongo, user-service, question-service, match-queue-service, match-worker, collaboration, ai-service, and frontend — each with healthchecks and a shared peerprep bridge network.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Fixed the frontend service — the generated version exposed backend URLs via env at runtime, but Next.js bakes `NEXT_PUBLIC_*` at build time, so I moved those to build args. Also changed the mongo image pin from `latest` to `mongo:7` to make CI reproducible.

---

## Log Entry 9
# Date/Time:
2026-04-05 13:03
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> the collaboration server currently trusts the `userId` field in the join message — make it derive identity from the verified firebase token instead
**Output Summary:**
Proposed verifying the token inside the join handler and rejecting joins where `msg.userId` doesn't match the uid in the token.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Rewrote this to verify the token once at WS upgrade time instead of per message — much cheaper and avoids the case where a malicious client sends a valid token but spoofs someone else's userId in the join body. Also added a per-connection `uid` in `connMeta` so downstream handlers use the authenticated identity.

---

## Log Entry 10
# Date/Time:
2026-04-05 22:11
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> end-session is closing both websockets before the session-ended event reaches the frontend — clients see a raw disconnect instead of the event
**Output Summary:**
Suggested flushing the broadcast before closing, and adding a short delay between `endSession()` and the actual WS close.
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
Implemented a 500 ms `setTimeout` between the broadcast and the close loop. Confirmed in devtools that both clients now receive the session-ended event and show the "ended by X" toast before their WS closes.

---

## Log Entry 11
# Date/Time:
2026-04-06 01:47
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> ai-service is returning `confidence: "0.8"` instead of a number, the rate limiter blocks tests, and firebase init throws in CI
**Output Summary:**
Proposed casting confidence with `Number()` after parsing, skipping the rate limiter when `NODE_ENV=test`, and catching the firebase init error with a warning instead of crashing.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
The cast approach worked for confidence. For the rate limiter I switched from skipping in tests to injecting a configurable limiter so the test can pass its own instance. For firebase init I made the skip conditional on a dedicated `FIREBASE_SKIP_INIT` env var so CI behaviour is explicit instead of auto-degrading.

---

## Log Entry 12
# Date/Time:
2026-04-06 02:10
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> ai-service default port conflicts with macOS AirPlay on 5000 — pick a new port and update everywhere it is referenced
**Output Summary:**
Suggested 5050, updated the service's `PORT` default, the compose file, the frontend proxy, and the health check curl examples.
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
No changes needed. Verified the local dev flow works end-to-end after the port swap.

---

## Log Entry 13
# Date/Time:
2026-04-14 20:48
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> replace the partykit server with a plain Node.js `ws` server — keep the Yjs sync semantics and the same JSON message protocol, but drop the partykit runtime dependency. also the two clients are deriving different session ids because they use local `Date.now()` as the bucket
**Output Summary:**
Rewrote `ws-server.ts` using `ws` + a manual HTTP upgrade handler, preserved the Yjs sync + awareness broadcast logic, kept the custom JSON protocol. Fixed the session id by having the match worker include `matchedAt` in the `MATCH_FOUND` event so both clients hash the same timestamp.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Accepted the architectural rewrite but rewrote the awareness broadcast loop to track which client IDs each WS owns (the generated version leaked ghost cursors on disconnect because it cleared nothing). Also audited the Yjs protocol handling to make sure SyncStep1/2 still work with the raw ws library instead of partykit's helpers.

---

## Log Entry 14
# Date/Time:
2026-04-15 13:41
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> when user A ends the session and user B tries to rejoin the same roomId, they get stuck in a reconnect loop instead of being told the session ended
**Output Summary:**
Traced the issue to the in-memory `sessions` map outliving the Yjs room, so a new connection saw `ended=true` but the y-websocket provider auto-reconnected forever. Suggested deleting the session entry when the room's last conn disconnects, and having the client call `provider.disconnect()` on receiving session-ended.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Both fixes were right in spirit. I implemented them but also added an explicit `if (room.conns.size === 0) sessions.delete(roomId)` branch in the close handler so there's a single clear invariant: session state dies with the room.

---

## Log Entry 15
# Date/Time:
2026-04-15 13:54
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> harden the collab server — dropped connections stay in memory forever, and a malicious client sending malformed frames can keep the socket open indefinitely
**Output Summary:**
Added a 30 s ping/pong heartbeat that terminates dead sockets, a per-connection error counter that closes the WS with code 4002 after 50 malformed messages, and replaced direct `process.exit` with a SIGTERM/SIGINT graceful shutdown that drains active WSs.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Accepted the structure but tuned the numbers — 50 errors/conn and 30 s heartbeat were reasonable defaults, but the generated graceful shutdown waited 30 s before killing the process which stalled Docker restarts. Reduced that to 5 s with a hard exit after the window.

---

## Log Entry 16
# Date/Time:
2026-04-15 14:24
**Tool:** Claude Code (Claude Opus 4.6)
**Prompt/Command:**
> if there are no questions matching a topic+difficulty, users match successfully but then crash on the session page with an unhandled null — surface this error before they leave the queue
**Output Summary:**
Added a pre-queue check that hits question-service with the topic+difficulty and returns a 400 if the bank is empty, and a post-match client-side check that shows a toast if `fetchDeterministicQuestion` returns null before attempting the redirect.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Good call on both fronts, but the pre-queue check doubled the latency on every `/queue/join`. I moved the question-availability check to a cached lookup with a 30 s TTL so repeated joins for the same (topic, difficulty) don't re-hit the question service every time.

---
