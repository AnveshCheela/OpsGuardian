import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// PUT /api/v1/teams/order
router.put('/order', async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const leaderId = req.user.userId;
    const { employeeOrder } = req.body;

    if (!Array.isArray(employeeOrder)) {
      res.status(400).json({ error: 'employeeOrder must be an array of user IDs' });
      return;
    }

    const team = await prisma.team.findFirst({
      where: { leaderId }
    });

    if (!team) {
      res.status(404).json({ error: 'You are not the leader of any team' });
      return;
    }

    await prisma.team.update({
      where: { id: team.id },
      data: { employeeOrder }
    });

    res.status(200).json({ message: 'Order saved successfully', employeeOrder });
  } catch (error) {
    console.error('Update Team Order Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
