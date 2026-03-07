# PeerPrep Frontend

Next.js 15 (App Router) frontend for PeerPrep.

## Prerequisites

- Node.js 20+
- pnpm

## Setup

```bash
pnpm install
```

Create `.env.local`:

```
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_QUESTION_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
```

## Running

```bash
pnpm dev        # http://localhost:3000
```

Build for production:

```bash
NODE_ENV=production pnpm build
pnpm start
```

## Testing

```bash
pnpm test              # run all tests
pnpm test:watch        # watch mode
pnpm test:coverage     # with coverage report
```

## Pages

| Route | Description |
|---|---|
| `/login` | Login with email/password |
| `/register` | Create account with password strength check |
| `/match` | Select difficulty + topic to find a match |
| `/match/finding` | Matching queue with countdown timer |
| `/session/[id]` | Collaborative coding session (CodeMirror + Yjs) |
| `/profile` | Edit profile, delete account |
| `/settings` | Placeholder |
| `/questions/[title]` | View question (description, hints, model answer) |
| `/admin/users` | Admin: manage users, toggle roles |
| `/admin/questions` | Admin: question bank, add/edit/delete |

## Dependencies

- **User service** on `:3001` — auth, user CRUD
- **Question service** on `:8000` — question CRUD
- **Collaboration service** on `:1999` — real-time code editing (PartyKit)
- **Matching service** — not yet implemented (stubbed with TODO placeholders)
