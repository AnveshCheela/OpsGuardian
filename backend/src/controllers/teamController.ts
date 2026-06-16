import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        users: true,
        services: true,
      },
    });
    res.json(teams);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, companyName, leaderId, userIds } = req.body;
    if (!name || !companyName || !leaderId) {
      return res.status(400).json({ error: 'Team name, companyName, and leaderId are required' });
    }

    const connectUsers = userIds && Array.isArray(userIds) 
      ? userIds.map((id: string) => ({ id })) 
      : [];

    const team = await prisma.team.create({
      data: {
        name,
        companyName,
        leaderId,
        users: {
          connect: connectUsers,
        },
      },
      include: {
        users: true,
      },
    });
    res.status(201).json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.team.delete({
      where: { id },
    });
    res.json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        users: {
          connect: { id: userId },
        },
      },
      include: {
        users: true,
      },
    });
    res.json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        users: {
          disconnect: { id: userId },
        },
      },
      include: {
        users: true,
      },
    });
    res.json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
