# OpsGuardian 🛡️

**Intelligent, Automated Incident Management & Observability Platform**

OpsGuardian is a modern, event-driven SaaS application designed to automatically catch, deduplicate, analyze, and escalate system crashes in real-time. It acts as an intelligent layer between your software stack and your engineering team, utilizing AWS for scalable log storage, Google Gemini AI for instant root-cause analysis, and Resend for automated hierarchy-based email escalations.

---

## ✨ Core Features

* **Universal Integration**: Catch errors from any frontend (React, Next.js, Vue) or backend (Node.js, Express, Python) using a simple 15-line SDK snippet.
* **Smart Deduplication**: Built-in Redis Idempotency middleware automatically hashes incoming crash payloads and drops identical duplicates for 1 hour to protect your team from alert fatigue.
* **AI Root Cause Analysis (RCA)**: When a crash occurs, a background BullMQ worker extracts the stack trace and feeds it to Google Gemini AI to instantly suggest a fix.
* **Automated Escalation Engine**: If an on-call Leader does not acknowledge a crash on the dashboard within the SLA timeframe, the system automatically traverses the company hierarchy and blasts an emergency email to the next Employee in the chain via Resend.
* **Real-Time Dashboards**: Powered by WebSockets (`Socket.io`), new incidents instantly animate onto the dashboard without requiring a page refresh.

---

## 🏗️ System Architecture & Workflow

OpsGuardian uses a highly scalable, decoupled microservice architecture built to handle enterprise-level traffic without crashing.

1. **Alert Ingestion**: Your client application catches a crash and fires an HTTP POST webhook to the OpsGuardian backend (`/api/v1/webhooks/trigger`).
2. **Idempotency Check**: The backend calculates a SHA-256 hash of the alert payload and checks **Redis**. If it's a duplicate, it's silently dropped. If it's new, it proceeds.
3. **Asynchronous Queue**: To prevent HTTP bottlenecks, the backend pushes the incident data to a **BullMQ** queue backed by Redis and instantly returns a `200 OK` to the client.
4. **Background Processing**: A Node.js worker picks up the job.
   - **AWS S3**: The worker uploads the raw, massive `.txt` crash log to an AWS S3 bucket for cheap, long-term storage, keeping the primary database light.
   - **AI Analysis**: The worker sends a snippet of the log to the **Google Gemini AI API** for analysis.
5. **Database Persistence**: The worker saves the incident metadata, S3 URL, and AI analysis into a **PostgreSQL** database using Prisma ORM.
6. **Real-Time Broadcast**: The worker emits an event, which the **Socket.io** server catches and broadcasts to the specific company's frontend dashboard.
7. **Escalation Trigger**: The worker schedules a delayed job in the Escalation Queue. If the incident remains "Triggered" (unacknowledged) after the timer expires, the **Resend HTTP API** is used to email the team.

---

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Socket.io-client
- **Backend**: Node.js, Express, TypeScript, BullMQ, Socket.io
- **Database**: PostgreSQL (via Prisma ORM), Redis (Queue & Caching)
- **Cloud/AI**: AWS S3, Google Gemini 1.5 Pro
- **Email Delivery**: Resend API

---

## 🛠️ How to Integrate OpsGuardian into Your Own App

OpsGuardian is a fully automated Multi-Tenant SaaS platform. You can integrate it into any project in under 2 minutes.

### Step 1: Get Your Webhook Key
1. Visit the OpsGuardian website and **Sign Up** as a Team Leader.
2. The system will automatically provision a workspace for your company.
3. Upon successful registration, you will be provided with a unique `webhookKey` (e.g., `whk_xxxxxxxx`). Copy this key.

### Step 2: Add the SDK to Your Frontend (React/Next.js Example)
Paste this snippet into your root file (e.g., `main.jsx`, `App.jsx`, or `layout.tsx`). It will automatically catch all unhandled UI crashes.

```javascript
window.addEventListener("error", (event) => {
  console.log("[OpsGuardian] Catching frontend crash...");
  
  const payload = {
    webhookKey: "YOUR_WEBHOOK_KEY_HERE", // Replace with your actual key
    alert: "Frontend Client Crash",
    severity: "High",
    errorMessage: event.error?.message || event.message,
    errorStack: event.error?.stack || "No stack trace available",
    url: window.location.href,
  };

  fetch("https://your-opsguardian-backend.com/api/v1/webhooks/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => console.error("Failed to reach OpsGuardian"));
});
```

### Step 3: Add the SDK to Your Backend (Express Example)
Add this error-handling middleware at the very bottom of your `server.js` file (after all other routes).

```javascript
app.use(async (err, req, res, next) => {
    console.error("🔥 Crash Detected:", err.message);

    try {
        await fetch("https://your-opsguardian-backend.com/api/v1/webhooks/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                webhookKey: "YOUR_WEBHOOK_KEY_HERE", // Replace with your actual key
                alert: "Backend API Crash",
                severity: "Critical",
                errorMessage: err.message,
                errorStack: err.stack,
                url: `Backend Route: ${req.method} ${req.originalUrl}`
            })
        });
    } catch (e) {
        console.error("Failed to report crash to OpsGuardian");
    }

    res.status(500).json({ error: "Internal Server Error" });
});
```

That's it! Any time your code breaks, the error will instantly appear on your OpsGuardian dashboard and your team will receive an email.

---

## 💻 Local Development Setup

If you want to clone this repository and run the OpsGuardian platform yourself:

### Prerequisites
1. Node.js (v18+)
2. PostgreSQL installed locally
3. Redis installed locally
4. AWS Account (S3 Bucket)
5. Google Gemini API Key
6. Resend API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AnveshCheela/OpsGuardian.git
   cd OpsGuardian
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   
   # Create a .env file and add your credentials (DATABASE_URL, REDIS_URL, AWS, GEMINI, RESEND)
   
   npx prisma generate
   npx prisma db push
   npm run build
   npm start
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   
   # Create a .env.local file: NEXT_PUBLIC_API_URL=http://localhost:5000
   
   npm run dev
   ```

Open `http://localhost:3000` to view the application!
