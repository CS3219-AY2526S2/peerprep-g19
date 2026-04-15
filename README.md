[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/HpD0QZBI)

# CS3219 Project (PeerPrep) - AY2526S2

## Group: G19

PeerPrep is a technical interview practice platform with peer matching, real-time collaboration, and AI-assisted code explanation.

## Quick Start (Recommended)

1. Clone and enter the project:

```bash
git clone <repository-url>
cd peerprep-g19
```

2. Create required environment files:

- Root `.env` (for `docker compose`):

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=peer-prep-1186f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=peer-prep-1186f.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

GOOGLE_GEMINI_API_KEY=...
# Optional override if not using local Mongo in compose:
# QN_SERVICE_CLOUD_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
```

- Frontend `.env.local`:

```bash
cd services/frontend
cp .env.local.example .env.local
```

Then set (or confirm) these values in `services/frontend/.env.local`:

```env
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_QUESTION_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
NEXT_PUBLIC_MATCHING_SERVICE_URL=http://localhost:3002
```

3. Start all services:

```bash
docker compose up --build
```

4. Open the app:

- Frontend: `http://localhost:3000`

## Health Checks

```bash
curl http://localhost:3001/
curl http://localhost:8000/health
curl http://localhost:3002/health
curl http://localhost:5050/health
```

WebSocket collaboration endpoint:

- `ws://localhost:1999/party/<sessionId>`

## Services

| Service               | Path                                   |     Port | Stack                                      |
| --------------------- | -------------------------------------- | -------: | ------------------------------------------ |
| Frontend              | `services/frontend`                    |     3000 | Next.js 15                                 |
| User Service          | `services/user-service`                |     3001 | Node.js, Express, Firebase Auth, Firestore |
| Question Service      | `services/question-service`            |     8000 | FastAPI, MongoDB                           |
| Match Queue Service   | `services/match-service/queue-service` |     3002 | Node.js, Express, Redis, SSE               |
| Match Worker          | `services/match-service/match-worker`  | internal | Node.js, Redis Lua                         |
| Collaboration Service | `services/collaboration`               |     1999 | WebSocket, Yjs                             |
| AI Service            | `services/ai-service`                  |     5050 | Node.js, Express, Gemini                   |

## Prerequisites

- Node.js 20+
- Docker Desktop
- pnpm (`npm install -g pnpm`)
- Firebase project/service account
- Gemini API key

## Troubleshooting

- MongoDB issues: check your connection string/network allowlist.
- Firebase auth issues: verify `.env` and `services/frontend/.env.local` values.
- Redis issues: check container health with `docker compose ps`.
- Reset local containers and volumes:

```bash
docker compose down -v
```
