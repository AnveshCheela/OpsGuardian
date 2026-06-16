import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { Role } from '@prisma/client';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        teams: true,
      },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, role, companyName } = req.body;
    if (!name || !email || !companyName) {
      return res.status(400).json({ error: 'Name, email, and companyName are required' });
    }

    const validRoles = Object.values(Role);
    const userRole = role && validRoles.includes(role) ? (role as Role) : Role.Employee;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: 'placeholder_hash',
        companyName,
        role: userRole,
      },
    });
    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id },
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
