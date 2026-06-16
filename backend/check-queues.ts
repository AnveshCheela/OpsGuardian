import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis('redis://localhost:6379', { maxRetriesPerRequest: null });
const escalationQueue = new Queue('escalation-queue', { connection: redisConnection as any });
const incidentQueue = new Queue('incident-queue', { connection: redisConnection as any });

async function checkQueues() {
  const escWait = await escalationQueue.getWaitingCount();
  const escAct = await escalationQueue.getActiveCount();
  const escDelay = await escalationQueue.getDelayedCount();
  const escFail = await escalationQueue.getFailedCount();
  
  const incWait = await incidentQueue.getWaitingCount();
  const incAct = await incidentQueue.getActiveCount();
  const incDelay = await incidentQueue.getDelayedCount();
  const incFail = await incidentQueue.getFailedCount();

  console.log("=== QUEUE STATUS ===");
  console.log(`Incident Queue -> Waiting: ${incWait}, Active: ${incAct}, Delayed: ${incDelay}, Failed: ${incFail}`);
  console.log(`Escalation Queue -> Waiting: ${escWait}, Active: ${escAct}, Delayed: ${escDelay}, Failed: ${escFail}`);

  const failedJobs = await escalationQueue.getFailed();
  if (failedJobs.length > 0) {
    console.log("\nFailed Escalation Jobs:");
    for (const job of failedJobs.slice(0, 3)) {
      console.log(`Job ${job.id}: ${job.failedReason}`);
    }
  }

  process.exit(0);
}

checkQueues();
