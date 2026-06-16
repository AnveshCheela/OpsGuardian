import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { globalEvents } from '../events';
import { escalationQueue } from '../workers/incidentWorker';
import { incidentQueue } from '../queues/incidentQueue';
import { requireAuth } from '../middleware/auth.middleware';

export const incidentRoutes = Router();

// GET /api/v1/incidents
incidentRoutes.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.userId;

    // Find the user's team
    const team = await prisma.team.findFirst({
      where: {
        OR: [
          { users: { some: { id: userId } } },
          { leaderId: userId },
        ],
      },
    });

    if (!team) {
      res.status(404).json({ error: 'No team found for this user' });
      return;
    }

    const incidents = await prisma.incident.findMany({
      where: {
        service: { teamId: team.id },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        service: true,
        logs: true,
        acknowledgedBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });

    res.status(200).json({ incidents });
  } catch (error) {
    console.error('[API] Failed to fetch incidents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/v1/incidents/trigger
incidentRoutes.post('/trigger', requireAuth, async (req: Request, res: Response): Promise<void> => {
  // @ts-ignore
  const userId = req.user.userId;
  // @ts-ignore
  const userRole = req.user.role;
  const { serviceId, title, description, severity } = req.body;

  try {
    // Check that user is a Leader
    if (userRole !== 'Leader') {
      res.status(403).json({ error: 'Only leaders can trigger incidents' });
      return;
    }

    // Validate that the service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { team: true },
    });
    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Verify the service belongs to the leader's team
    if (service.team.leaderId !== userId) {
      res.status(403).json({ error: 'This service does not belong to your team' });
      return;
    }

    // Create a deduplication key
    const dedupKey = crypto
      .createHash('sha256')
      .update(`${serviceId}${title}${Date.now()}`)
      .digest('hex');

    // Queue the incident for AI and AWS processing
    await incidentQueue.add('process-incident', {
      serviceId,
      payload: { alert: title, description, severity: severity || 'High' },
      dedupKey,
      timestamp: Date.now()
    });

    console.log(`[API] Manual incident queued for AI processing: ${dedupKey}`);

    res.status(202).json({ message: 'Incident queued for AI processing' });
  } catch (error) {
    console.error('[API] Failed to trigger incident:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/v1/incidents/:id/acknowledge
incidentRoutes.put('/:id/acknowledge', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  // @ts-ignore
  const userId = req.user.userId;

  try {
    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status: 'Acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
      },
      include: {
        service: true,
        logs: true
      }
    });

    console.log(`[API] Incident ${id} acknowledged by user ${userId}.`);
    
    // Broadcast the update so all dashboards instantly update
    globalEvents.emit('incident-updated', incident);

    res.status(200).json({ message: 'Incident acknowledged successfully', incident });
  } catch (error) {
    console.error(`[API] Failed to acknowledge incident ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
