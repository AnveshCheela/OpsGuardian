import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { incidentQueue } from '../queues/incidentQueue';

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const { webhookKey } = req.body;

    if (!webhookKey) {
      return res.status(400).json({ error: 'webhookKey is required in the payload' });
    }

    // Validate webhookKey against our DB
    const service = await prisma.service.findUnique({
      where: { webhookKey },
    });

    if (!service) {
      return res.status(401).json({ error: 'Invalid webhookKey' });
    }

    // Enqueue the job for background processing
    const dedupKey = req.body._dedupKey;
    const jobData = {
      serviceId: service.id,
      payload: req.body,
      dedupKey,
      timestamp: new Date().toISOString(),
    };

    await incidentQueue.add('process-incident', jobData, {
      jobId: dedupKey, // BullMQ can also use this to ensure idempotency at the queue level
      removeOnComplete: true,
      removeOnFail: false,
    });

    // Return 200 OK immediately so the client isn't blocked
    res.status(200).json({ 
      status: 'accepted', 
      message: 'Incident payload received and queued for processing' 
    });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Internal server error processing webhook' });
  }
};
