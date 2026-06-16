import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis('redis://localhost:6379', { maxRetriesPerRequest: null });
const escalationQueue = new Queue('escalation-queue', { connection: redisConnection as any });

async function checkQueues() {
  const completedJobs = await escalationQueue.getCompleted();
  console.log(`Completed Escalation Jobs: ${completedJobs.length}`);
  if (completedJobs.length > 0) {
    for (const job of completedJobs) {
      console.log(`Job ${job.id}: ${job.returnvalue}`);
    }
  }
  process.exit(0);
}

checkQueues();
