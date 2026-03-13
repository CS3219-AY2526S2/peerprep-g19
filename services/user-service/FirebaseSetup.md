# Setting Up Firebase for User Service

This service verifies Firebase ID tokens and sets Firebase custom claims (for example, `role: "admin"`).

This guide assumes the project maintainer already created the Firebase project and granted you access to the shared backend service account used by this service.

## Prerequisites

1. A Google account.
2. Access to the Firebase Console: <https://console.firebase.google.com/>.
3. Node.js `v20.10.0` or newer (required for the `with { type: "json" }` import attributes syntax used in `config/firebase.js`).

## 1. Join the Existing Firebase Project

1. Ask the maintainer to invite your Google account to the existing Firebase project.
2. Open <https://console.firebase.google.com/> and confirm you can access the project.
3. If you cannot access it, ask the maintainer to verify your project role and account email.

## 2. Verify Authentication Is Enabled

1. In the existing Firebase project, go to **Security > Authentication**.
2. Open the **Sign-in method** tab.
3. Confirm the provider(s) needed by your frontend are enabled (for example, Email/Password or Google).
4. If changes are needed and you do not have permission, ask the maintainer to update them.

## 3. Generate a Key from the Team Service Account

> Team convention: Use the shared service account provided by the maintainer. Do not create a new service account unless your team explicitly asks you to.

1. Go to **Project settings** (gear icon next to **Project Overview**).
2. Open the **Service accounts** tab.
3. Ensure you are using the team-provided service account (the one your maintainer granted you access to).
4. Click **Generate new private key**.
5. Download the JSON key file.

## 4. Configure User Service with the Key

1. Rename the downloaded key file to `service_key.json`.
2. Place it at:

   ```
   services/user-service/config/service_key.json
   ```

3. Ensure the file is valid JSON and contains fields like `project_id`, `private_key`, and `client_email`.

The backend loads this file in `config/firebase.js` using Firebase Admin SDK.

## 5. Start User Service

From the `services/user-service` directory:

```sh
npm install
npm run dev
```

## 6. Make a First Admin User (Optional)

After a user signs in from your frontend and is registered in MongoDB (`POST /auth/register`), promote them to admin with:

```sh
node scripts/firstAdmin.js <firebase_uid> admin
```

You can get `<firebase_uid>` from Firebase Authentication users list in the Firebase Console.

## Troubleshooting

1. `Error: ENOENT ... service_key.json`
   - Cause: service account key file is missing or path is wrong.
   - Fix: place the key at `services/user-service/config/service_key.json`.

2. `Firebase ID token has invalid signature`
   - Cause: token comes from a different Firebase project than your `service_key.json`.
   - Fix: ensure frontend and backend use the same Firebase project.

3. `Permission denied` / custom claims not updating
   - Cause: service account key lacks required privileges or is from wrong project.
   - Fix: regenerate key from the correct project and retry.

## Security Notes

1. Never expose `service_key.json` to frontend code.
2. Do not share the key file in public channels.
3. Keep usage scoped to the team-provided service account and rotate keys if access changes.
4. For production, prefer using a secret manager and environment-based credentials instead of committing key files.