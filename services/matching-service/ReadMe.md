# PeerPrep Matching Service

This is the **Matching Service** for PeerPrep, responsible for:

* Managing the matchmaking queue for users.
* Matching users based on topic and difficulty.
* Sending real-time updates to clients via **Server-Sent Events (SSE)**.
* Handling queue timeouts and manual leave requests.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Environment Variables](#environment-variables)
4. [Running the Service](#running-the-service)
5. [API Endpoints](#api-endpoints)
6. [Testing with Postman](#testing-with-postman)

---

## Prerequisites

* [Node.js](https://nodejs.org/) v18+
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* [Redis](https://redis.io/) installed locally or accessible remotely

### Install Redis locally

**macOS (Homebrew):**

```bash
brew install redis
brew services start redis
```

Alternatively, start in the foreground (for testing):
```bash
redis-server
```

**Linux (Ubuntu):**

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**Windows:**
Use [Redis for Windows](https://github.com/tporadowski/redis/releases) or a Docker container:

```bash
docker run -d --name redis -p 6379:6379 redis
```

Redis runs by default on `localhost:6379`.

---

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` as needed:

```env
PORT=3002
REDIS_URL=redis://localhost:6379
USER_SERVICE_URL=http://localhost:3001
MATCHING_TIMEOUT_MS=60000
```

---

## Environment Variables

| Variable            | Description                                              |
| ------------------- | -------------------------------------------------------- |
| PORT                | Port to run the Matching Service (default `3002`)        |
| REDIS_URL           | Redis connection URL (e.g., `redis://localhost:6379`)    |
| USER_SERVICE_URL    | URL of the User Service for JWT verification             |
| MATCHING_TIMEOUT_MS | Max time (ms) a user can wait in queue before timing out |
| WITH_AUTH           | Enable/disable authentication (default `true`)           |

> All variables are loaded from `.env` via [`dotenv`](https://www.npmjs.com/package/dotenv).

### Authentication Configuration

The `WITH_AUTH` environment variable controls whether authentication is required:

- **`WITH_AUTH=true`** (default): Requires valid JWT tokens for all endpoints
- **`WITH_AUTH=false`**: Bypasses authentication and uses default test user (`test@gmail.com`)

When `WITH_AUTH=false`, the service will:
- Skip JWT token verification
- Use a default test user with email `test@gmail.com` and username `test`
- Allow testing without setting up the User Service
- Enable single-user testing (all requests appear to come from the same user)

**Note:** When using `WITH_AUTH=false`, only one test user is available, so you cannot test multi-user scenarios. This is intended for development and testing purposes only.

---

## Running the Service

Start the service:

```bash
npm run dev
```

The service will:

* Connect to Redis
* Start the matchmaking worker
* Listen for incoming HTTP requests (join/leave queue)
* Serve SSE connections to update clients in real-time

---

## API Endpoints

### Health Check

* **GET** `/api/v1/health`
* **Description:** Checks if the service is running.
* **Response:** `200 OK` with body `{"status": "ok"}`

### Join Queue

* **POST** `/queue/join`
* **Headers:** `Authorization: Bearer <JWT>`
* **Body:**

```json
{
  "topic": "arrays",
  "difficulty": "medium"
}
```

* **Response Type:** **Server-Sent Events (SSE)** — the server keeps the connection open and periodically sends updates in the following formats:

#### SSE Events

1. **QUEUE_UPDATE** — sent every 3 seconds to inform the client about the current queue state:

```json
{
  "type": "QUEUE_UPDATE",
  "position": 2,          // Your current position in the queue (1-based)
  "top5": ["user1", "user2", "user3"], // Top 5 users in the queue (most recent at the end)
  "queueLength": 8        // Total number of users currently in the queue
}
```

2. **TIMEOUT** — sent when the user exceeds the maximum wait time (`MATCHING_TIMEOUT_MS`):

```json
{
  "type": "TIMEOUT"
}
```

3. **MATCH_FOUND** — sent when a match is found for the user:

```json
{
  "type": "MATCH_FOUND",
  "peer": "peerUserEmail" // Email of the matched peer
}
```

---

### Leave Queue

* **POST** `/queue/leave`

* **Headers:** `Authorization: Bearer <JWT>`

* **Body:** *empty*

* **Response:** JSON confirming the user has left the queue:

```json
{
  "message": "Left queue"
}
```

* **Effect:**

  * Removes the user from the Redis queue.
  * Deletes the user's queue mapping.
  * Closes any active SSE connection for this user.

---

## Testing with Postman

1. Include the **JWT token** in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

2. **Join Queue:**

* POST to `/queue/join` with `topic` and `difficulty` in JSON body.
* Postman will keep the request open to stream SSE events.

3. **Leave Queue:**

* POST to `/queue/leave`.
* User will be removed from Redis queue and SSE connection will close.

> ⚠️ Closing the Postman tab **does not automatically leave the queue**, because the SSE disconnect may not always propagate immediately. You can manually test `/queue/leave` to remove the user.

**Note:** A Postman collection is included in the `docs/` folder. You can **import this collection** into Postman to quickly test all endpoints and SSE connections.

---

## Notes

* Ensure **Redis is running** before starting the service.
* Use `.env` to configure ports, Redis URL, and timeouts.
* The service is built in **TypeScript**, running on **Node.js + Express** with **Redis** and **SSE**.

---

### `.env.example`

```env
PORT=3002
REDIS_URL=redis://localhost:6379
USER_SERVICE_URL=http://localhost:3001
MATCHING_TIMEOUT_MS=60000
```
