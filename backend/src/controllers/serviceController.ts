import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ServiceStatus } from '@prisma/client';

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        team: true,
      },
    });
    res.json({ services });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const { name, teamId, status } = req.body;
    if (!name || !teamId) {
      return res.status(400).json({ error: 'Service name and teamId are required' });
    }

    const validStatuses = Object.values(ServiceStatus);
    const serviceStatus = status && validStatuses.includes(status) 
      ? (status as ServiceStatus) 
      : ServiceStatus.Active;

    const service = await prisma.service.create({
      data: {
        name,
        teamId,
        status: serviceStatus,
      },
      include: {
        team: true,
      },
    });
    res.status(201).json(service);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({
      where: { id },
    });
    res.json({ message: 'Service deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateServiceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = Object.values(ServiceStatus);
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const service = await prisma.service.update({
      where: { id },
      data: { status: status as ServiceStatus },
    });
    res.json(service);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


