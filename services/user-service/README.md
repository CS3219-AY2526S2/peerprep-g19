# User Service Guide

## Overview

User Service manages user profiles and authorization roles for PeerPrep.

Current implementation:

- Authentication and token verification: Firebase Auth (Admin SDK)
- User profile storage: Firebase Firestore (`users` collection)
- Role synchronization: Firebase custom claims + Firestore role field

This service does not currently use MongoDB.

---

## Prerequisites

- Node.js v20.10.0 or newer
- Access to the team Firebase project
- Firebase Admin service account key at:

```text
services/user-service/config/service_key.json
```

Setup guide for Firebase key and project access:

- See [FirebaseSetup.md](FirebaseSetup.md)

---

## Environment Setup

1. In `services/user-service`, create `.env` if not present.
2. Set at least:

```env
PORT=3001
```

Note: Firestore/Firebase Admin credentials are loaded from `config/service_key.json`.

---

## Running User Service

From `services/user-service`:

```sh
npm install
npm run dev
```

Or run in production mode:

```sh
npm start
```

Default base URL:

```text
http://localhost:3001
```

### Run with Docker

From `services/user-service`:

```sh
docker compose -f compose.yaml up --build
```

Important:

- Ensure `config/service_key.json` exists on your machine.
- The compose file mounts this key into the container at runtime.

To stop:

```sh
docker compose -f compose.yaml down
```

---

## Authentication Model

- Protected routes require Firebase ID token:

```text
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

- Service verifies token with Firebase Admin SDK.
- Authorization uses role custom claim (`admin` or `user`).

---

## User Data Model (Firestore)

Collection: `users`

Document ID: Firebase UID (`firebaseuuid`)

Fields:

- `firebaseuuid` (string)
- `email` (string)
- `username` (string)
- `role` (`admin` | `user`)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

---

## API Guide

### Register User Profile

- Method: `POST`
- Endpoint: `/auth/register`
- Headers:
  - `Authorization: Bearer <FIREBASE_ID_TOKEN>`
- Body (optional):

```json
{
  "username": "sampleUser"
}
```

Behavior:

- If user does not exist in Firestore: creates user with role `user`, returns `201`.
- If user already exists: returns existing user, `200`.
- On first registration, Firebase custom claim `role: "user"` is set.

---

### Get All Users (Admin only)

- Method: `GET`
- Endpoint: `/users`
- Headers:
  - `Authorization: Bearer <FIREBASE_ID_TOKEN>`

---

### Get User by ID

- Method: `GET`
- Endpoint: `/users/{userId}`
- Headers:
  - `Authorization: Bearer <FIREBASE_ID_TOKEN>`

Notes:

- `userId` is Firebase UID (Firestore document id), not a Mongo ObjectId.
- Admin can fetch any user.
- Non-admin can only fetch their own user (`req.user.uid === userId`).

---

### Update User

- Method: `PATCH`
- Endpoint: `/users/{userId}`
- Headers:
  - `Authorization: Bearer <FIREBASE_ID_TOKEN>`
- Body:

```json
{
  "username": "newUsername"
}
```

Notes:

- Enforces username uniqueness in Firestore.
- Admin can update any user.
- Non-admin can only update self.

---

### Update User Privilege (Admin only)

- Method: `PATCH`
- Endpoint: `/users/{userId}/privilege`
- Headers:
  - `Authorization: Bearer <FIREBASE_ID_TOKEN>`
- Body:

```json
{
  "role": "admin"
}
```

Behavior:

- Updates role in Firestore.
- Syncs Firebase custom claim for that user.

---

### Delete User

- Method: `DELETE`
- Endpoint: `/users/{userId}`
- Headers:
  - `Authorization: Bearer <FIREBASE_ID_TOKEN>`

Notes:

- Admin can delete any user.
- Non-admin can only delete self.

---

### Record Question Attempt

- Method: POST
- Endpoint: /users/{userId}/attempts
- Headers:
  - Authorization: Bearer <FIREBASE_ID_TOKEN>
- Body:

```json
{
  "questionTitle": "Two Sum",
  "topic": "Arrays",
  "difficulty": "Easy",
  "status": "solved",
  "durationSeconds": 420,
  "language": "python",
  "sessionId": "session-abc"
}
```

Notes:

- Required fields: questionTitle, topic, difficulty.
- Allowed difficulty: Easy, Medium, Hard.
- Allowed status: attempted, solved, abandoned.
- Admin can write any user's attempts.
- Non-admin can only write their own attempts.

---

### Get Question Attempt History

- Method: GET
- Endpoint: /users/{userId}/attempts
- Headers:
  - Authorization: Bearer <FIREBASE_ID_TOKEN>
- Query params (optional):
  - limit (default 20, max 100)
  - cursor (attempt document id for pagination)
  - topic
  - difficulty
  - status

---

### Get Question Attempt Summary

- Method: GET
- Endpoint: /users/{userId}/attempts/summary
- Headers:
  - Authorization: Bearer <FIREBASE_ID_TOKEN>

Returns:

- totalAttempts
- solvedCount
- attemptedCount
- abandonedCount
- solvedRate
- byTopic
- byDifficulty

---

## Promote First Admin

After a user has registered, promote by Firebase UID:

```sh
node scripts/firstAdmin.js <firebase_uid> admin
```

This updates both:

- Firestore `users/{uid}.role`
- Firebase custom claim `role`

---

## Status / Migration Note

If you still see MongoDB references elsewhere in docs, treat them as legacy notes.
Runtime code path for user-service is Firebase Auth + Firestore.
