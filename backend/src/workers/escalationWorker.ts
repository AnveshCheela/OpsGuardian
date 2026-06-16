import { Worker, Job, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../config/database';
import { sendEscalationEmail } from '../services/notificationService';
import { redis } from '../config/redis';

export const ESCALATION_QUEUE_NAME = 'escalation-queue';
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

const localEscalationQueue = new Queue(ESCALATION_QUEUE_NAME, { connection: redis as any });

export const escalationWorker = new Worker(
  ESCALATION_QUEUE_NAME,
  async (job: Job) => {
    const incidentId = job.data.incidentId;
    const serviceId = job.data.serviceId;
    const stepIndex = job.data.stepIndex || 0;
    console.log(`[Escalation Worker] Waking up to process escalation for Incident ${incidentId}...`);

    try {
      // 1. Fetch the current incident status from the DB
      const incident = await prisma.incident.findUnique({
        where: { id: incidentId }
      });

      if (!incident) {
        console.log(`[Escalation Worker] Incident ${incidentId} not found. Skipping.`);
        return;
      }

      // 2. The crucial check: Was it acknowledged?
      if (incident.status !== 'Triggered') {
        console.log(`[Escalation Worker] Incident ${incidentId} status is ${incident.status}. Escalation aborted.`);
        return;
      }

      // 3. It's still Triggered! We need to escalate.
      console.log(`[Escalation Worker] Incident ${incidentId} is STILL TRIGGERED! Executing step ${stepIndex}...`);

      // 4. Auto-generate escalation chain from team structure (no EscalationPolicy model)
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          team: {
            include: {
              leader: true,
              users: {
                where: { role: 'Employee', status: 'Approved' },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });

      if (!service?.team) {
        console.log(`[Escalation Worker] No team found for service ${serviceId}.`);
        return;
      }

      // Build escalation chain: leader first, then employees ordered by createdAt
      const escalationChain = [service.team.leader, ...service.team.users];

      if (stepIndex >= escalationChain.length) {
        console.log(`[Escalation Worker] No more escalation steps left. Final step reached.`);
        return;
      }

      // 5. Send email to the current person in the chain
      const currentPerson = escalationChain[stepIndex];
      if (currentPerson) {
        const emailResult = await sendEscalationEmail(currentPerson.email, incident, stepIndex + 1);

        if (emailResult.success) {
          console.log(
            `[Escalation Worker] Escalation email delivered to ${currentPerson.email} via ${emailResult.method} (step ${stepIndex + 1})`
          );
        } else {
          console.warn(
            `[Escalation Worker] Escalation email was not delivered to ${currentPerson.email}; simulation logged (step ${stepIndex + 1}).`
          );
        }
      }

      // 6. Queue next step if there are more people
      const nextStepIndex = stepIndex + 1;
      if (nextStepIndex < escalationChain.length) {
        const delayMs = 10000; // 10 seconds for testing

        console.log(`[Escalation Worker] Queuing next escalation step (${nextStepIndex}) in ${delayMs/1000}s...`);
        await localEscalationQueue.add(
          'check-escalation',
          { incidentId, serviceId, stepIndex: nextStepIndex },
          { delay: delayMs, jobId: `escalation-${incidentId}-step-${nextStepIndex}` }
        );
      } else {
        console.log(`[Escalation Worker] Finished all escalation steps for Incident ${incidentId}.`);
      }

    } catch (error) {
      console.error(`[Escalation Worker] Job ${job.id} failed:`, error);
      throw error;
    }
  },
  { connection: redisConnection as any }
);

escalationWorker.on('failed', (job, err) => {
  console.error(`[Escalation Worker] Job ${job?.id} has failed with ${err.message}`);
});
