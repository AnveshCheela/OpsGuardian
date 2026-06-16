import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export const INCIDENT_QUEUE_NAME = 'incident-ingestion-queue';

export const incidentQueue = new Queue(INCIDENT_QUEUE_NAME, {
  connection: redis as any,
});
