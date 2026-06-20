import { Worker, Job, Queue } from 'bullmq';
import { redis } from '../config/redis';
import { INCIDENT_QUEUE_NAME } from '../queues/incidentQueue';
import { ESCALATION_QUEUE_NAME } from './escalationWorker';
import { invokeLogGeneratorLambda, fetchLogFromS3, uploadRealLogToS3 } from '../services/awsService';
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
      let bucket: string;
      let key: string;
      let logContent: string;
      let s3Url: string;

      if (payload.rawLog || payload.errorMessage) {
        // REAL INTEGRATION PATH
        console.log(`[Worker] Real error log detected in payload. Uploading directly to S3...`);
        const realLogData = payload.rawLog || `Error: ${payload.errorMessage}\n\nStack:\n${payload.errorStack || 'No stack provided'}\n\nURL: ${payload.url}`;
        const uploadResult = await uploadRealLogToS3(realLogData);
        bucket = uploadResult.bucket;
        key = uploadResult.key;
        s3Url = `s3://${bucket}/${key}`;
        logContent = realLogData;
      } else {
        // MOCK SIMULATION PATH (Manual Trigger)
        console.log(`[Worker] Invoking AWS Lambda to generate mock crash log...`);
        const lambdaResult = await invokeLogGeneratorLambda();
        bucket = lambdaResult.bucket;
        key = lambdaResult.key;
        s3Url = `s3://${bucket}/${key}`;

        console.log(`[Worker] Fetching mock log from S3 (${s3Url})...`);
        logContent = await fetchLogFromS3(bucket, key);
      }
      
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
