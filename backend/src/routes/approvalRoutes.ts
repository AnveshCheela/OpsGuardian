import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// GET /api/v1/approval/pending
router.get('/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'Leader') {
      res.status(403).json({ error: 'Only leaders can view pending approvals' });
      return;
    }

    const pendingUsers = await prisma.user.findMany({
      where: {
        leaderId: userId,
        status: 'Pending',
      },
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        companyName: true,
        createdAt: true,
      },
    });

    res.status(200).json({ pendingUsers });
  } catch (error) {
    console.error('Get Pending Approvals Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/approval/:userId/approve
router.put('/:userId/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const requesterId = req.user.userId;
    const { userId: targetUserId } = req.params;

    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!requester || requester.role !== 'Leader') {
      res.status(403).json({ error: 'Only leaders can approve users' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (targetUser.status !== 'Pending' || targetUser.leaderId !== requesterId) {
      res.status(400).json({ error: 'Cannot approve this user' });
      return;
    }

    // Update user status to Approved
    await prisma.user.update({
      where: { id: targetUserId },
      data: { status: 'Approved' },
    });

    // Add user to the leader's team
    const leaderTeam = await prisma.team.findFirst({ where: { leaderId: requesterId } });
    if (leaderTeam) {
      await prisma.team.update({
        where: { id: leaderTeam.id },
        data: {
          users: { connect: { id: targetUserId } },
        },
      });
    }

    res.status(200).json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Approve User Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/approval/:userId/reject
router.put('/:userId/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const requesterId = req.user.userId;
    const { userId: targetUserId } = req.params;

    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!requester || requester.role !== 'Leader') {
      res.status(403).json({ error: 'Only leaders can reject users' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (targetUser.status !== 'Pending' || targetUser.leaderId !== requesterId) {
      res.status(400).json({ error: 'Cannot reject this user' });
      return;
    }

    // Delete the user entirely
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    res.status(200).json({ message: 'User rejected and removed' });
  } catch (error) {
    console.error('Reject User Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/approval/:userId/remove
router.delete('/:userId/remove', async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const requesterId = req.user.userId;
    const { userId: targetUserId } = req.params;

    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!requester || requester.role !== 'Leader') {
      res.status(403).json({ error: 'Only leaders can remove users' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (targetUser.leaderId !== requesterId) {
      res.status(403).json({ error: 'You do not have permission to remove this user' });
      return;
    }

    // Delete the user entirely from the database
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    res.status(200).json({ message: 'Employee successfully removed from the team and database' });
  } catch (error) {
    console.error('Remove User Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
