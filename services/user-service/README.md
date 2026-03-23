# User Service Guide

## Setting-up

> 📝 Note: If you are familiar with MongoDB and wish to use a local instance, please feel free to do so via the **[MongoDB Community Edition](https://www.mongodb.com/docs/manual/administration/install-community/)**. This guide utilizes MongoDB Cloud Services.
>
> ⚠️ Important Network Notice: MongoDB Atlas connections are blocked on the NUS network. If you are using MongoDB Atlas, you must disconnect from the NUS network (including NUS Wi-Fi or nVPN) and connect using an alternative network such as phone hotspot. Otherwise, your application will fail to connect to the database even if your connection string is correct.

1. Set up a MongoDB Cluster by following the steps in this **[guide](./MongoDBSetup.md)**.

2. Set up Firebase Admin for backend authentication/authorization by following this **[guide](./FirebaseSetup.md)**.

3. After setting up, go to the **[Clusters](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fclusters)**  Page. You would see a list of the clusters you have set up. Select `Connect` on the cluster you just created earlier on for User Service.

    ![alt text](./GuideAssets/ConnectCluster.png)

4. Select the `Drivers` option, as we have to link to a Node.js App (User Service).

    ![alt text](./GuideAssets/DriverSelection.png)

5. Select `Node.js` in the **Driver** dropdown menu.
6. Copy the connection string.

    > Note, you may see `<password>` in this connection string. We will be replacing this with the admin account password that we created earlier on when setting up the Cluster.

    ![alt text](./GuideAssets/ConnectionString.png)

7. In the `user-service` directory, create a copy of the `.env.sample` file and name it `.env`.

8. Update the `DB_CLOUD_URI` of the `.env` file, and paste the string we copied earlier in **step 6**. Also remember to replace the `<db_password>` placeholder with the **actual password**.

8. Ensure the `JWT_SECRET` variable is set in the `.env` file. This is required for generating authentication tokens during login. You can set it to any random string (e.g., `JWT_SECRET=your_secret_key_here`).

> ⚠️ Warning: If the password contains special characters, make sure to URL-encode them before placing them in the connection string. For example, if your password is `P@ssword`, you should replace `@` with `%40`, resulting in `P%40ssword`.

## Running User Service

> 📝 Note: Ensure you have **[Node.js (LTS)](https://nodejs.org/en/download)** installed. At the time of writing, the latest LTS version is `v24.13.0`. Select your operating system, package manager, and Node.js version from the dropdowns at the top of the [page]((https://nodejs.org/en/download)), then follow the provided instructions.
>
> ⚠️ Minimum Version Requirement: Use Node.js `v20.10.0` or newer. This project uses the `with { type: "json" }` import attributes syntax in `config/firebase.js`, which is not supported in older Node.js versions.

1. Open Command Line/Terminal and navigate into the `user-service` directory.

    ```sh
    cd user-service
    ```

2. Install all the necessary dependencies by running the command:

    ```sh
    npm install
    ```

3. Start the User Service in production mode by running:

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

- Purpose: Create a user profile in MongoDB using an already-authenticated Firebase user.
- HTTP Method: `POST`
- Endpoint: <http://localhost:3001/auth/register>
- Headers
  - Required: `Authorization: Bearer <FIREBASE_ID_TOKEN>`
- Body
  - Optional: `username` (string), `name` (string)

    ```json
    {
      "username": "sampleUser"
    }
    ```

- Behavior:
  - If user does not exist in MongoDB: creates user with role `user`, returns `201`.
  - If user already exists: returns existing user, `200`.
  - On first registration, Firebase custom claim `role: "user"` is set.

- Responses:

    | Response Code               | Explanation                                  |
    |-----------------------------|----------------------------------------------|
    | 201 (Created)               | User registered in MongoDB                   |
    | 200 (OK)                    | User already registered                      |
    | 401 (Unauthorized)          | Missing/invalid Firebase ID token            |
    | 500 (Internal Server Error) | Firebase/database/server error               |

### Update User Privilege

You need an admin token to use this endpoint.

- Purpose: Update role in MongoDB and sync Firebase custom claim.
- HTTP Method: `PATCH`
- Endpoint: <http://localhost:3001/users/{userId}/privilege>
- Parameters
  - Required: `userId` (MongoDB Object ID)
- Headers
  - Required: `Authorization: Bearer <FIREBASE_ID_TOKEN>`
  - Auth Rule: Admin users only
- Body
  - Required: `role` (string)
  - Allowed values: `"admin"`, `"user"`

    ```json
    {
      "role": "admin"
    }
    ```

- Responses:

    | Response Code               | Explanation                                  |
    |-----------------------------|----------------------------------------------|
    | 200 (OK)                    | Role updated in MongoDB and Firebase claim   |
    | 400 (Bad Request)           | Missing/invalid role                         |
    | 401 (Unauthorized)          | Missing/invalid Firebase ID token            |
    | 403 (Forbidden)             | Caller is not admin                          |
    | 404 (Not Found)             | User not found                               |
    | 500 (Internal Server Error) | Database/server error                        |

### Get User

- This endpoint allows retrieval of a single user's data from the database using the user's ID.

  > 💡 The user ID refers to the MongoDB Object ID, a unique identifier automatically generated by MongoDB for each document in a collection.

- HTTP Method: `GET`

- Endpoint: <http://localhost:3001/users/{userId}>

- Parameters
  - Required: `userId` path parameter
  - Example: `http://localhost:3001/users/60c72b2f9b1d4c3a2e5f8b4c`

- Headers

  - Required: `Authorization: Bearer <FIREBASE_ID_TOKEN>`

  - Explanation: This endpoint requires a Firebase ID token in the request header for authentication and authorization. The server verifies this token with Firebase Admin SDK.

  - Auth Rules:

    - Admin users: Can retrieve any user's data. The server verifies the user associated with the Firebase token is an admin user and allows access to the requested user's data.

    - Non-admin users: Can only retrieve their own data. The server checks if the user ID in the request URL matches the ID of the user associated with the Firebase token. If it matches, the server returns the user's own data.

- Responses:

    | Response Code               | Explanation                                              |
    |-----------------------------|----------------------------------------------------------|
    | 200 (OK)                    | Success, user data returned                              |
    | 401 (Unauthorized)          | Access denied due to missing/invalid/expired token       |
    | 403 (Forbidden)             | Access denied for non-admin users accessing others' data |
    | 404 (Not Found)             | User with the specified ID not found                     |
    | 500 (Internal Server Error) | Database or server error                                 |

### Get All Users

- This endpoint allows retrieval of all users' data from the database.
- HTTP Method: `GET`
- Endpoint: <http://localhost:3001/users>
- Headers
  - Required: `Authorization: Bearer <FIREBASE_ID_TOKEN>`
  - Auth Rules:

    - Admin users: Can retrieve all users' data. The server verifies the user associated with the Firebase token is an admin user and allows access to all users' data.

    - Non-admin users: Not allowed access.

- Responses:

    | Response Code               | Explanation                                      |
    |-----------------------------|--------------------------------------------------|
    | 200 (OK)                    | Success, all user data returned                  |
    | 401 (Unauthorized)          | Access denied due to missing/invalid/expired token |
    | 403 (Forbidden)             | Access denied for non-admin users                |
    | 500 (Internal Server Error) | Database or server error                         |

### Update User

- This endpoint allows updating a user and their related data in the database using the user's ID.

- HTTP Method: `PATCH`

- Endpoint: <http://localhost:3001/users/{userId}>

- Parameters
  - Required: `userId` path parameter

- Body
  - Required: `username` (string)

    ```json
    {
      "username": "SampleUserName"
    }
    ```

- Headers
  - Required: `Authorization: Bearer <FIREBASE_ID_TOKEN>`
  - Auth Rules:

    - Admin users: Can update any user's data. The server verifies the user associated with the Firebase token is an admin user and allows the update of requested user's data.

    - Non-admin users: Can only update their own data. The server checks if the user ID in the request URL matches the ID of the user associated with the Firebase token. If it matches, the server updates the user's own data.

- Responses:

    | Response Code               | Explanation                                             |
    |-----------------------------|---------------------------------------------------------|
    | 200 (OK)                    | User updated successfully, updated user data returned   |
    | 400 (Bad Request)           | Missing username or duplicate username                  |
    | 401 (Unauthorized)          | Access denied due to missing/invalid/expired token      |
    | 403 (Forbidden)             | Access denied for non-admin users updating others' data |
    | 404 (Not Found)             | User with the specified ID not found                    |
    | 500 (Internal Server Error) | Database or server error                                |

### Delete User

- This endpoint allows deletion of a user and their related data from the database using the user's ID.
- HTTP Method: `DELETE`
- Endpoint: <http://localhost:3001/users/{userId}>
- Parameters

  - Required: `userId` path parameter
- Headers

  - Required: `Authorization: Bearer <FIREBASE_ID_TOKEN>`

  - Auth Rules:

    - Admin users: Can delete any user's data. The server verifies the user associated with the Firebase token is an admin user and allows the deletion of requested user's data.

    - Non-admin users: Can only delete their own data. The server checks if the user ID in the request URL matches the ID of the user associated with the Firebase token. If it matches, the server deletes the user's own data.
- Responses:

    | Response Code               | Explanation                                             |
    |-----------------------------|---------------------------------------------------------|
    | 200 (OK)                    | User deleted successfully                               |
    | 401 (Unauthorized)          | Access denied due to missing/invalid/expired token      |
    | 403 (Forbidden)             | Access denied for non-admin users deleting others' data |
    | 404 (Not Found)             | User with the specified ID not found                    |
    | 500 (Internal Server Error) | Database or server error                                |
