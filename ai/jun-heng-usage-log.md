# AI Usage Log Jun Heng

Below are the key prompts used during development. These represent actual conversations with the AI assistant. In all cases architecture was defined first manually. AI was only used for implementation support after design was finalised.

Many prompts required providing full context of existing codebase and architectural constraints. For brevity log entries show only the core request command.


---

## Log Entry !
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Prompt for Initial combined worker + queue service implementation boilerplate code
**Output Summary:**
Generated single service with both http endpoints and matching loop
**Action Taken:**
- [ ] Accepted as-is
- [ ] Modified
- [x] Rejected
**Author Notes:**
Rejected this design. Realised this will not scale horizontally. Refactored into separate queue service and match worker processes


---

## Log Entry 2
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Explain what are lua scripts in redis and why we use them
**Output Summary:**
Explained atomic execution guarantees, single transaction property, no intermediate state exposure
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Used this explanation to implement the atomic matching script correctly

---

## Log Entry 3
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> How to modify match worker to add timeout handling
**Output Summary:**
Suggested ZRANGEBYSCORE with current timestamp, automatic removal of expired users
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Implemented timeout cleanup inside the existing lua script to maintain atomicity

---

## Log Entry 4
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Generate express server boilerplate for queue service with typescript, vitest, redis client
**Output Summary:**
Generated base project structure, express server setup, basic routes, health check endpoint, redis connection wrapper
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Added authentication middleware, removed unused dependencies, configured proper cors headers, added error handling middleware

---

## Log Entry 5
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Implement SSE connection manager with connection tracking and cleanup on disconnect
**Output Summary:**
Generated SSE broadcaster class with client tracking, heartbeat implementation, automatic cleanup on socket close
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Added connection id mapping, implemented per user connection limit, added proper error logging, fixed race condition on client disconnect

---

## Log Entry 6
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Write lua script for atomic matching that pops 2 users from sorted set and returns them only if both exist
**Output Summary:**
Generated 8 line lua script with ZRANGE and ZREM operations, returns user pair or nil
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
Verified atomicity guarantees, tested for concurrent execution edge cases, confirmed no race conditions possible

---

## Log Entry 7
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Write unit tests for matcher function including concurrent worker edge cases
**Output Summary:**
Generated 12 test cases covering empty queue, single user, multiple users, concurrent attempts, idempotency
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Added redis mock implementation, added test for duplicate matching, added test for partial failure, verified all atomicity guarantees hold

---

## Log Entry 8
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Implement redis pub/sub listener for queue change events
**Output Summary:**
Generated pub/sub subscriber setup, event handler, worker wakeup logic
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
No changes required. Implementation was correct

---

## Log Entry 9
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Refactor error handling in queue routes to return proper http status codes
**Output Summary:**
Restructured route handlers with try/catch blocks, standardised error responses
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Added proper logging levels, removed stack traces from production responses, implemented consistent error format

---

## Log Entry 10
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Update match service readme with architecture diagram and api documentation
**Output Summary:**
Generated complete readme with ascii architecture diagram, full api reference, testing instructions
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Corrected architecture details, added local development instructions, added curl examples for manual testing

---

## Log Entry 11
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Write dockerfiles and docker compose config for match service
**Output Summary:**
Generated multi stage docker builds for both services, proper health checks, network configuration
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
No changes required

---

## Log Entry 12
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> How to implement comment chat interface in collaboration service
**Output Summary:**
Proposed reusing existing websocket connection, broadcast semantics, no persistence design
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Implemented in 12 lines of code, confirmed this has zero operational overhead

---

## Log Entry 13
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Can you have multiple match workers running at the same time
**Output Summary:**
Explained scaling properties, linear throughput, lack of race conditions
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
Verified this is actually correct, tested with 5 concurrent workers running simultaneously

---

## Log Entry 15
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> How to split service into separate queue service and match worker
**Output Summary:**
Proposed separation of concerns, redis as shared state, pub/sub for communication
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
This was the correct architecture change. Allowed horizontal scaling of workers independently

---

## Log Entry 16
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Add debounce to prevent thundering herd on queue changes
**Output Summary:**
Implemented exponential backoff and jitter for worker wakeup
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
Successfully eliminated thundering herd problem when 100+ workers are running

---

## Log Entry 17
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Implement graceful shutdown for queue service
**Output Summary:**
Added signal handlers, proper connection cleanup, drain of existing connections before exit
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
Fixed issue where users were getting disconnected on service restart

---

## Log Entry 18
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Write load testing script for match service
**Output Summary:**
Generated artillery test script that simulates 1000 concurrent users joining queues
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
Used this to verify linear scaling properties up to 20 match workers

---

## Log Entry 20
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Fix race condition on user disconnect
**Output Summary:**
Identified race between user leaving and matching
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Fixed by moving disconnect cleanup inside the atomic lua script boundary

---

## Log Entry 21
**Tool:** Cline / Bytedance Seed 2
**Prompt/Command:** 
> Look through match service readme and tell me if there are any major issues in this implementation
**Output Summary:**
Reviewed complete match service architecture, identified no race conditions, verified atomicity guarantees, confirmed design correctness
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Confirmed implementation was correct, no major issues found. This design will scale perfectly horizontally