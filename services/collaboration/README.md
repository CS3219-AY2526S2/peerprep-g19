# PeerPrep Collaboration Service

PartyKit server for real-time collaborative code editing using Yjs CRDT.

## Prerequisites

- Node.js 20+
- npm / pnpm

## Setup

```bash
npm install
```

## Running

```bash
npm run dev     # http://localhost:1999
```

## Testing

```bash
npm test              # run all tests
npm run test:watch    # watch mode
```

## What it does

- Syncs code edits between 2 users in real-time via Yjs
- Max 2 users per session room
- Supports language switching (Python, Java, C++, C)
- End session broadcasts to both users and closes connections

## Connection

The service uses WebSocket connections via PartyKit. There are no HTTP/REST endpoints — all communication happens over WebSocket.

**WebSocket URL:** `ws://<PARTYKIT_HOST>/party/<sessionId>`

- `PARTYKIT_HOST` defaults to `localhost:1999` in development
- `sessionId` is the room name (used as the PartyKit room ID)
- Code synchronization uses the Yjs binary protocol automatically via `y-partykit`

## WebSocket Protocol

### Client → Server Messages

| Message Type | Payload | Description |
|---|---|---|
| `join` | `{ type: "join", userId: string, username: string, token: string }` | Join the session room. Must be sent after WebSocket connection is established. Token is reserved for future JWT verification. |
| `end-session` | `{ type: "end-session" }` | Terminates the session for both users. All connections are closed after a 500ms delay. |
| `language-change` | `{ type: "language-change", language: string }` | Change the active programming language. Valid values: `python3`, `java`, `cpp`, `c`. |

### Server → Client Messages

| Message Type | Payload | Description |
|---|---|---|
| `user-joined` | `{ type: "user-joined", userId: string, username: string, userCount: number }` | Broadcast to all connections when a user joins. |
| `session-ended` | `{ type: "session-ended", endedBy: string }` | Broadcast when a user ends the session. Connections close after 500ms. |
| `user-disconnected` | `{ type: "user-disconnected", userId: string, username: string }` | Broadcast when a user disconnects (e.g. closes tab). |
| `language-changed` | `{ type: "language-changed", language: string, changedBy: string }` | Broadcast when the programming language is changed. |
| `error` | `{ type: "error", code: string, message: string }` | Sent to a single client on error. |

### Error Codes

| Code | Message | Trigger |
|---|---|---|
| `SESSION_FULL` | Session full | Third user tries to join (max 2) |
| `SESSION_ENDED` | Session has ended | User tries to join an ended session |
| `INVALID_LANGUAGE` | Invalid language: `<lang>` | Language not in `[python3, java, cpp, c]` |

## Session State

Each PartyKit room maintains the following state:

| Field | Type | Default | Description |
|---|---|---|---|
| `users` | `Map<connectionId, SessionUser>` | empty | Connected users (max 2) |
| `language` | `string` | `python3` | Active programming language |
| `ended` | `boolean` | `false` | Whether session has been terminated |

### SessionUser

```typescript
{
  userId: string;       // Application user ID
  username: string;     // Display name
  connectionId: string; // PartyKit connection ID
}
```

## Supported Languages

| Language | Value | File Extension |
|---|---|---|
| Python 3 | `python3` | `.py` |
| Java | `java` | `.java` |
| C++ | `cpp` | `.cpp` |
| C | `c` | `.c` |

## TODO placeholders

- JWT verification on connect (currently accepts any token)
- Reconnection grace period before broadcasting disconnect
- Session data persistence / analytics on end
- Global per-user session tracking (needs Redis)
