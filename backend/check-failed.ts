import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis('redis://localhost:6379', { maxRetriesPerRequest: null });
const escalationQueue = new Queue('escalation-queue', { connection: redisConnection as any });

async function checkFailed() {
  const failedJobs = await escalationQueue.getFailed();
  if (failedJobs.length > 0) {
    console.log("Failed Escalation Job Stacktrace:");
    for (const job of failedJobs.slice(0, 1)) {
      console.log(`Job ${job.id}:`);
      console.log(job.stacktrace);
    }
  }

  process.exit(0);
}

checkFailed();
