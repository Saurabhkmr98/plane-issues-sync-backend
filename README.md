# Issue Synchronization System - Backend

This project is a robust backend service that synchronizes issues between Plane and GitHub. It provides an API that allows users to sync issues from GitHub into Plane workspaces, with background processing, real-time status tracking using WebSockets, and a modular architecture for scalability and maintainability.

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [API Documentation](#api-documentation)
  - [Start Sync Job](#start-sync-job)
  - [Check Sync Job Status](#check-sync-job-status)
  - [Webhook Setup](#webhook-setup)
- [Setup and Installation](#setup-and-installation)
  - [GitHub Webhooks Setup](#github-webhooks-setup)
- [Technologies Used](#technologies-used)

---

## Features

- **Sync Service:** Synchronizes GitHub issues with Plane workspaces.
- **Real-time Updates:** Broadcasts sync progress to the client via WebSocket (Socket.IO).
- **Queue Management:** Uses Bull queue for background job processing to handle multiple sync requests efficiently.
- **Status Tracking API:** Allows users to check the real-time status of sync jobs.
- **Modular Architecture:** Follows SOLID principles and best practices in code structure.
- **Security:** Environment variables for API tokens and keys are securely handled.

---

## Architecture Overview

The system consists of several key components:

1. **Express.js**: The web server framework handling HTTP requests and routing.
2. **Socket.IO**: Provides real-time bidirectional communication for status updates on sync jobs.
3. **Bull Queue**: A queue system powered by Redis for background job processing, ensuring efficient management of sync jobs.
4. **MongoDB**: Stores ongoing and past sync job statuses for tracking and analytics.
5. **Sync Logic**: Core logic for fetching issues from GitHub and creating corresponding issues in Plane.

## Database Schema Explanation

This service has two collections, `sync_jobs` and `project_issues` for complete flow.

`sync_jobs` stores data for sync job and current status of job which helps in preventing duplicate job creation and finding current status of sync job.

`sync_jobs`

```javascript
{
    jobId: { type: String },
    status: { type: String, required: true },
    progress: { type: Number, default: 0 },
    githubRepo: { type: String, required: true },
    planeWorkspace: { type: String, required: true },
    errorMessage: { type: String, default: '' },
    startedAt: { type: Date },
    completedAt: { type: Date },
}
```

`project_issues` stores relation between plane issues and github issues for a plane project. It helps in preventing duplicate creation of issues in plane project while syncing and helps github webhook to fetch planeIssueId for a githubIssue and mark it as completed whenever github issue is closed.

`project_issues`

```javascript
{
    projectId: {type: String},
    issues: [{
      issueId: {type: String},
      githubIssueId: {type: String},
      status: {type: String}
    }]
}
```

### Flow Overview:

1. The user makes a request to start an issue sync job.
2. The server adds the sync job to a **Bull queue**, which processes jobs in the background.
3. Sync progress is broadcast in real-time using **Socket.IO**.
4. The system prevents duplicate issues during the sync process.
5. Users can check the sync job's status via a dedicated **API**.

---

## API Documentation

### 1. Start Sync Job

**Endpoint**: `POST /api/sync`

Initiates the issue sync from GitHub to Plane. This API adds a sync job to the queue and starts the background processing.

#### Response

```json
{
  "message": "Sync job started",
  "jobId": "unique_job_id"
}
```

- `jobId`: A unique identifier for the sync job that you can use to track the progress.

### 2. Check Sync Job Status

**Endpoint**: `GET /api/sync/status/:jobId`

Fetches the current status of the ongoing sync job using the `jobId`.

#### Response

```json
{
  "jobId": "unique_job_id",
  "status": "in-progress",
  "progress": 60
}
```

- `status`: The current status of the job (`pending`, `in-progress`, `completed`, `failed`).
- `progress`: A percentage showing how much of the sync job has been completed.

### 3. WebSocket Event: `syncProgress_${PLANE_WORKSPACE_SLUG}_${PLANE_PROJECT_ID}`

Real-time updates on the sync progress will be sent through the `syncProgress_${PLANE_WORKSPACE_SLUG}_${PLANE_PROJECT_ID}` WebSocket event. You can listen for these updates on the client-side to display sync progress.

---

## Webhook Setup

You can set up GitHub webhooks to automatically trigger the issue synchronization, whenever an issue is closed in a GitHub repository it marks it as done in Plane project.

### 1. Create Webhook in GitHub

- Go to the repository you want to synchronize.
- Navigate to `Settings` > `Webhooks`.
- Click **Add webhook**.

### 2. Webhook URL and Payload

- **Payload URL**: Use your server’s URL, e.g., `https://your-server-url.com/api/sync/github-webhook`.
- **Content type**: Choose `application/json`.
- **Secret**: Use same secret as mentioned as GITHUB_WEBHOOK_SECRET in .env file for security.
- **Events to trigger**: Select `Issues`. This ensures that the webhook only triggers for issue-related events.

### 3. Webhook Event Handling

When a webhook is triggered, your server will listen to the issue closed event to update Plane with the latest issue state.

---

## Setup and Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Saurabhkmr98/plane-issues-sync-backend.git
cd plane-issues-sync-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory and configure the variables by referencing to `.env.example` file:

- **MONGODB_URI**: MongoDB connection URI.
- **REDIS_HOST** and **REDIS_PORT**: Redis server configuration for Bull queue.
- **GITHUB_API_TOKEN**: GitHub API token for accessing GitHub issues.
- **PLANE_API_TOKEN**: API token for interacting with the Plane platform.
- **GITHUB_WEBHOOK_SECRET**: Secret key for verifying GitHub webhooks (optional).

### 4. Start Redis

Make sure Redis is running on your machine. You can start Redis with:

```bash
redis-server
```

### 5. Start the Server

```bash
npm run devstart
```

The server will run on `http://localhost:4000/`.

---

## Technologies Used

- **Node.js**: Server-side JavaScript runtime.
- **Express.js**: Framework for building web applications.
- **Socket.IO**: Real-time, event-based communication for broadcasting sync progress.
- **Bull**: A Redis-backed job queue for managing sync jobs.
- **MongoDB**: NoSQL database for storing job information.
- **Redis**: In-memory key-value store used by Bull queue.
- **GitHub API**: Fetches issues from GitHub repositories.
- **Plane API**: Creates issues in Plane workspaces.
- **GitHub Webhooks**: Automatically triggers synchronization when issues are created or updated.

---

## Conclusion

This backend service provides an efficient and scalable solution for synchronizing GitHub issues with Plane workspaces. It leverages modern web technologies, real-time updates with WebSockets, and background processing using Bull queues, making it a robust system for handling issue synchronization tasks.

Feel free to reach out for further details or to contribute to the project.

---

### Author

Saurabh Kumar  
saurabhkmr0241@gmail.com

---
