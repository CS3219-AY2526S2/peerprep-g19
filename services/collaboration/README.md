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

## TODO placeholders

- JWT verification on connect (currently accepts any token)
- Reconnection grace period before broadcasting disconnect
- Session data persistence / analytics on end
- Global per-user session tracking (needs Redis)
