# OpsGuardian 🛡️

**Intelligent Incident Management Platform**

OpsGuardian is a modern, event-driven web application designed to automatically ingest, deduplicate, and analyze system alerts in real-time. It acts as an intelligent layer between monitoring systems (like Datadog or New Relic) and on-call engineers, utilizing AWS and AI to provide instant root-cause analysis.

---

## 🏗️ System Architecture & Workflow

OpsGuardian uses a highly scalable, decoupled microservice architecture. 

### The Workflow:
1. **Alert Ingestion**: A monitoring tool fires an HTTP POST webhook to our Express.js backend (`/api/v1/webhooks/trigger`).
2. **Idempotency Check**: The backend calculates a SHA-256 hash of the alert payload. It checks **Redis** to see if this exact alert was processed in the last 5 minutes. If yes, it drops it (preventing alert fatigue). If no, it proceeds.
3. **Asynchronous Queue**: Instead of blocking the HTTP request, the backend pushes the incident data to a **BullMQ** queue backed by Redis and instantly returns a `200 OK` to the monitoring tool.
4. **Background Processing**: A dedicated Node.js worker picks up the job from the queue.
   - **AWS Lambda**: The worker invokes an AWS Lambda function which simulates gathering system metrics and dumps a raw crash log into an **AWS S3** bucket.
   - **S3 Download**: The worker downloads the raw `.txt` crash log from S3 using the AWS SDK.
   - **AI Analysis**: The worker sends the raw log to the **Google Gemini AI API**, asking it to act as an expert Site Reliability Engineer to summarize the error and suggest a remediation action.
5. **Database Persistence**: The worker saves the incident, the S3 URL, and the AI analysis into a **PostgreSQL** database using Prisma ORM.
6. **Real-Time Broadcast**: The worker emits an internal event, which the backend's **Socket.io** server catches and broadcasts to all connected frontend clients.
7. **Frontend Update**: The **Next.js** frontend receives the WebSocket event and smoothly animates the new Incident Card into the engineer's dashboard without a page refresh.

---

## 📁 Code Structure

The repository is structured as a monorepo containing both the backend and frontend.

### `/backend` (Node.js, Express, TypeScript)
- `src/server.ts`: The main entry point. Sets up the Express HTTP server and the Socket.io WebSocket server.
- `src/routes/webhookRoutes.ts`: The HTTP endpoints where external services send alerts.
- `src/middlewares/idempotency.ts`: The Redis-powered middleware that drops duplicate alerts.
- `src/workers/incidentWorker.ts`: The BullMQ background worker that orchestrates AWS, AI, and Database operations.
- `src/services/awsService.ts`: Wrappers for the AWS SDK (`@aws-sdk/client-s3`, `@aws-sdk/client-lambda`).
- `src/services/aiService.ts`: Wrapper for the Google Gemini Generative AI SDK.
- `src/config/database.ts`: Initializes the Prisma Postgres client and the Redis client.
- `src/events.ts`: A Node.js `EventEmitter` that bridges communication between the background worker and the WebSocket server.
- `prisma/schema.prisma`: The database schema defining `Service`, `Team`, `Incident`, and `IncidentLog` tables.

### `/frontend` (Next.js 15, React, TailwindCSS)
- `src/app/page.tsx`: The main dashboard UI that manages the list of incidents.
- `src/app/globals.css`: Contains custom CSS variables and utility classes for the "glassmorphism" aesthetic and premium dark mode.
- `src/components/IncidentCard.tsx`: The reusable UI component that displays the severity, AI summary, and suggested actions.
- `src/hooks/useSocket.ts`: A custom React Hook that manages the Socket.io connection to the backend and listens for `new-incident` events.

---

## 🚀 Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS, Socket.io-client
- **Backend**: Node.js, Express, TypeScript, BullMQ, Socket.io
- **Database**: PostgreSQL (via Prisma ORM), Redis (for Queue & Caching)
- **Cloud/AI**: AWS S3, AWS Lambda, Google Gemini 1.5
- **Infrastructure**: Docker & Docker Compose
