[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/HpD0QZBI)
# CS3219 Project (PeerPrep) - AY2526S2
## Group: G19

## Project Description
PeerPrep is a technical interview preparation platform and peer matching system. It allows students to find peers to practice whiteboard-style interview questions together.

### How it works
1. **Login**: Users create an account and log in.
2. **Selection**: Users select a question difficulty level (Easy, Medium, Hard) and a topic.
3. **Matching**: The system attempts to match the user with another peer with the same preferences.
4. **Collaboration**: Upon a successful match, users enter a collaborative space to solve the question in real-time.

## Architecture
PeerPrep is built using a **microservices architecture**. The system consists of the following key services:

### Frontend Service (`/services/frontend/`)
- **Technology**: Next.js 15 (App Router)
- **Port**: 3000
- **Purpose**: User interface for the entire application
- **Features**: User authentication, matching interface, real-time collaborative coding environment, admin dashboard

### User Service (`/services/user-service/`)
- **Technology**: Node.js with MongoDB
- **Port**: 3001
- **Purpose**: User management and authentication
- **Features**: User registration/login with JWT, role-based access control, profile management

### Question Service (`/services/question-service/`)
- **Technology**: FastAPI (Python) with MongoDB Atlas
- **Port**: 8000
- **Purpose**: Question repository management
- **Features**: Question CRUD operations, topic/difficulty indexing, model answers and hints

### Matching Service (`/services/matching-service/`)
- **Technology**: Node.js with Redis and SSE
- **Port**: 3002
- **Purpose**: Real-time user matching based on preferences
- **Features**: Queue-based matching, Server-Sent Events for updates, timeout handling

### Collaboration Service (`/services/collaboration/`)
- **Technology**: PartyKit with Yjs CRDT
- **Port**: 1999
- **Purpose**: Real-time collaborative code editing
- **Features**: Real-time code synchronization, multi-language support, session management

## Deployment
The application is containerized and designed to be deployed on a local machine.

## Local Development Setup

This guide will walk you through setting up and running the PeerPrep microservices on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js**: Version 20 or higher.
2.  **Docker Desktop**: Required for running containerized services like the Question Service.
3.  **pnpm**: Required for the Frontend service. Install via `npm install -g pnpm`.
4.  **MongoDB Atlas Account**: A cloud-hosted MongoDB is required for the User and Question services.
5.  **Redis**: Required for the Matching Service. Install via:
   - **macOS**: `brew install redis && brew services start redis`
   - **Linux**: `sudo apt install redis-server && sudo systemctl start redis-server`
   - **Windows**: Use Docker: `docker run -d --name redis -p 6379:6379 redis`

> ** Network Warning:** MongoDB Atlas connections are often blocked on restricted networks (e.g., university Wi-Fi). If you encounter connection issues, try using a different network like a personal hotspot.

### Quick Start (All Services)

For a faster setup, follow these steps to get all services running:

1. **Set up MongoDB Atlas** (see detailed steps below)
2. **Set up Firebase** (see detailed steps below)
3. **Install Redis** (see prerequisites above)
4. **Clone and navigate to project:**
   ```bash
   git clone <repository-url>
   cd peerprep-g19
   ```
5. **Start all services in order:**
   ```bash
   # Terminal 1: User Service
   cd services/user-service
   npm install && npm run dev
   
   # Terminal 2: Question Service
   cd services/question-service
   docker compose up --build
   
   # Terminal 3: Collaboration Service
   cd services/collaboration
   npm install && npm run dev
   
   # Terminal 4: Matching Service
   cd services/matching-service
   npm install && npm run dev
   
   # Terminal 5: Frontend Service
   cd services/frontend
   pnpm install && pnpm dev
   ```
6. **Access the application:** Open http://localhost:3000 in your browser

### 1. Database Setup (MongoDB)

Both the User Service and Question Service require a MongoDB connection string.

1.  **Create a Cluster**: Set up a new cluster on MongoDB Atlas.
2.  **Get Connection String**: In your cluster's "Connect" settings, choose "Drivers" and copy the Node.js connection string. It will look like `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/`.
3.  **Allow Network Access**: In the Atlas "Network Access" tab, add your current IP address or allow access from anywhere (`0.0.0.0/0`) for development purposes.

### 2. User Service (Port: 3001)

Handles user accounts, authentication, and profiles.

1.  Navigate to the service directory:
    ```bash
    cd services/user-service
    ```
2.  Create a `.env` file from the sample and configure your settings:
    ```bash
    cp .env.sample .env
    # Edit .env to set DB_CLOUD_URI/DB_LOCAL_URI and JWT_SECRET
    ```
3.  Install dependencies and start the service:
    ```bash
    npm install
    npm run dev
    ```

### 3. Question Service (Port: 8000)

Manages the question repository. This service runs in Docker.

1.  Navigate to the service directory:
    ```bash
    cd services/question-service
    ```
2.  Create a `.env` file and add your database URI:
    ```
    # In services/question-service/.env
    MONGO_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
    ```
3.  Start the service using Docker Compose:
    ```bash
    docker compose up --build
    ```

### 4. Collaboration Service (Port: 1999)

Provides real-time collaboration features using PartyKit.

1.  Navigate to the service directory:
    ```bash
    cd services/collaboration
    ```
2.  Install dependencies and start the service:
    ```bash
    npm install
    npm run dev
    ```

### 5. Matching Service (Port: 3002)

Handles user matching and queue management with Redis.

1.  Navigate to the service directory:
    ```bash
    cd services/matching-service
    ```
2.  Create a `.env` file from the sample and configure your settings:
    ```bash
    cp .env.example .env
    # Edit .env to set REDIS_URL, USER_SERVICE_URL, and other configuration
    ```
3.  Install dependencies and start the service:
    ```bash
    npm install
    npm run dev
    ```

### 6. Firebase Setup (Required for Frontend)

The frontend requires Firebase for user authentication. You'll need to:

1.  **Access Firebase Console**: Go to [Firebase Console](https://console.firebase.google.com/)
2.  **Select Project**: Use the existing project `peer-prep-1186f` (ask maintainer for access)
3.  **Get Firebase Configuration**: 
    - Click the gear icon ⚙️ next to "Project Overview"
    - Select "Project settings"
    - Scroll to "Your apps" section
    - Copy the Firebase configuration values

4.  **Configure Frontend Environment**:
    ```bash
    cd services/frontend
    cp .env.local.example .env.local
    ```
    
    Add the following to `.env.local`:
    ```env
    # Service URLs
    NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:3001
    NEXT_PUBLIC_QUESTION_SERVICE_URL=http://localhost:8000
    NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
    NEXT_PUBLIC_MATCHING_SERVICE_URL=http://localhost:3002/api/v1
    
    # Firebase Configuration (replace with your values)
    NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=peer-prep-1186f.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=peer-prep-1186f
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=peer-prep-1186f.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id-here
    ```

### 7. Frontend Service (Port: 3000)

The main user interface for the application.

1.  Navigate to the service directory:
    ```bash
    cd services/frontend
    ```
2.  Install dependencies and start the service:
    ```bash
    pnpm install
    pnpm dev
    ```

### 7. Service Dependencies and Startup Order

**Important**: Services must be started in the correct order due to dependencies:

1. **User Service** (Port 3001) - Foundation service for authentication
2. **Question Service** (Port 8000) - Question repository 
3. **Collaboration Service** (Port 1999) - Real-time collaboration
4. **Matching Service** (Port 3002) - User matching (depends on User Service)
5. **Frontend Service** (Port 3000) - User interface (depends on all services)

### 8. Verification

Once all services are running, open your browser and navigate to **http://localhost:3000**. You should be able to:

1. **Register/Login**: Create an account using Firebase authentication
2. **View Questions**: Browse the question repository
3. **Admin Features**: Access admin dashboard (if you have admin privileges)

#### Health Checks

Verify each service is running:

```bash
# User Service
curl http://localhost:3001/health

# Question Service  
curl http://localhost:8000/health

# Matching Service
curl http://localhost:3002/api/v1/health

# Collaboration Service (WebSocket)
# Connect to: ws://localhost:1999/party/test
```

#### Troubleshooting

- **MongoDB Connection Issues**: Check your connection string and network access
- **Firebase Auth Issues**: Verify Firebase configuration in `.env.local`
- **Redis Issues**: Ensure Redis is running (`redis-cli ping` should return "PONG")
- **Service Dependencies**: Start services in the correct order

> **Note**: The **Matching Service** is not yet fully implemented and is currently stubbed in the frontend.

### 9. Development Tips

- **Hot Reload**: Frontend and most services support hot reload for faster development
- **Environment Variables**: Each service has its own `.env` file - don't commit these
- **Service Logs**: Check terminal output for each service for debugging information
- **Docker Cleanup**: Use `docker compose down -v` to clean up Question Service volumes
