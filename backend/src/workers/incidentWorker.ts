import { Worker, Job, Queue } from 'bullmq';
import { redis } from '../config/redis';
import { INCIDENT_QUEUE_NAME } from '../queues/incidentQueue';
import { ESCALATION_QUEUE_NAME } from './escalationWorker';
import { invokeLogGeneratorLambda, fetchLogFromS3 } from '../services/awsService';
import { analyzeLogWithGemini } from '../services/aiService';
import { prisma } from '../config/database';
import { globalEvents } from '../events';

// Queue for scheduling delayed escalations
export const escalationQueue = new Queue(ESCALATION_QUEUE_NAME, { connection: redis as any });

export const incidentWorker = new Worker(
  INCIDENT_QUEUE_NAME,
  async (job: Job) => {
    const { serviceId, payload, dedupKey, timestamp } = job.data;
    console.log(`[Worker] Processing job ${job.id} for service ${serviceId}`);

    try {
      // 1. Invoke Lambda to generate log in S3
      console.log(`[Worker] Invoking AWS Lambda to generate crash log...`);
      const { bucket, key } = await invokeLogGeneratorLambda();
      const s3Url = `s3://${bucket}/${key}`;

      // 2. Fetch the newly generated log from S3
      console.log(`[Worker] Fetching log from S3 (${s3Url})...`);
      const logContent = await fetchLogFromS3(bucket, key);
      
      // 3. Send log to Google Gemini for Root Cause Analysis
      console.log(`[Worker] Sending log to Gemini AI for RCA...`);
      const aiAnalysis = await analyzeLogWithGemini(logContent);
      
      // 4. Save Incident and Log to Database
      console.log(`[Worker] Saving Incident to Database...`);
      
      const incidentTitle = payload.alert || 'Production Alert Triggered';
      
      const incident = await prisma.incident.create({
        data: {
          serviceId: serviceId,
          title: incidentTitle,
          severity: payload.severity || 'High',
          deduplicationKey: dedupKey,
          aiSummary: aiAnalysis.summary,
          aiSuggestedAction: aiAnalysis.action,
          logs: {
            create: {
              s3FileUrl: s3Url,
              logPreview: logContent.substring(0, 500) // First 500 chars
            }
          }
        },
        include: {
          logs: true,
          service: true
        }
      });

      console.log(`[Worker] Job ${job.id} completed. Incident created: ${incident.id}`);
      
      // Emit event for WebSocket server
      globalEvents.emit('new-incident', incident);

      // Queue the escalation job (10 seconds delay for testing)
      console.log(`[Worker] Scheduling escalation check in 10 seconds...`);
      await escalationQueue.add(
        'check-escalation',
        { incidentId: incident.id, serviceId: serviceId, stepIndex: 0 },
        { delay: 10000, jobId: `escalation-${incident.id}-step-0` }
      );

    } catch (error) {
      console.error(`[Worker] Job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: redis as any,
  }
);

incidentWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
  } else {
    console.error(`Worker error: ${err.message}`);
  }
});
