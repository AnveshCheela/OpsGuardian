import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// GET /api/v1/chat/messages
router.get('/messages', async (req: Request, res: Response): Promise<void> => {
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

    const messages = await prisma.chatMessage.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Get Chat Messages Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/chat/messages
router.post('/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

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

    const message = await prisma.chatMessage.create({
      data: {
        teamId: team.id,
        userId,
        content,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send Chat Message Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
