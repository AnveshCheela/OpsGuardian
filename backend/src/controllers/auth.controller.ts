import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-opsguardian-key';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  ignoreTLS: true,
});

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, contactNumber, companyName, role } = req.body;

    if (!name || !email || !password || !companyName || !role) {
      return res.status(400).json({ error: 'Name, email, password, companyName, and role are required' });
    }

    if (role !== 'Leader' && role !== 'Employee') {
      return res.status(400).json({ error: 'Role must be Leader or Employee' });
    }

    // Strict Password Validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' });
    }

    if (password.toLowerCase().includes(name.toLowerCase())) {
      return res.status(400).json({ error: 'Password cannot contain your name.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (role === 'Leader') {
      // Check if company already exists
      const existingTeam = await prisma.team.findFirst({ 
        where: { companyName: { equals: companyName, mode: 'insensitive' } } 
      });
      if (existingTeam) {
        return res.status(409).json({ error: 'Company already registered' });
      }

      // Create the leader user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          contactNumber,
          companyName,
          role: 'Leader',
          status: 'Approved',
        },
      });

      // Create team with leader
      const team = await prisma.team.create({
        data: {
          name: `${companyName} Team`,
          companyName,
          leaderId: user.id,
          users: { connect: [{ id: user.id }] },
        },
      });

      // Create default service
      await prisma.service.create({
        data: {
          name: 'Production Service',
          teamId: team.id,
        },
      });

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        message: 'User created successfully',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, companyName: user.companyName },
      });
    } else {
      // Employee signup
      const team = await prisma.team.findFirst({ 
        where: { companyName: { equals: companyName, mode: 'insensitive' } } 
      });
      if (!team) {
        return res.status(404).json({ error: 'No company found. Ask your leader to register first.' });
      }

      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          contactNumber,
          companyName: team.companyName, // Save with the canonical casing of the team
          role: 'Employee',
          status: 'Pending',
          leaderId: team.leaderId,
        },
      });

      return res.status(201).json({
        message: 'Account created. Pending approval from your team leader.',
        pendingApproval: true,
      });
    }
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'Pending') {
      return res.status(403).json({ error: 'Your account is pending approval from your team leader.' });
    }

    if (user.status === 'Rejected') {
      return res.status(403).json({ error: 'Your account was not approved.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, companyName: user.companyName },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        contactNumber: true,
        companyName: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let userData: any = { ...user };

    if (user.role === 'Leader') {
      const teams = await prisma.team.findMany({
        where: { leaderId: user.id },
        include: {
          leader: {
            select: { id: true, name: true, email: true, role: true, status: true, contactNumber: true, createdAt: true }
          },
          users: {
            select: { id: true, name: true, email: true, role: true, status: true, contactNumber: true, createdAt: true }
          },
        },
      });
      userData.teams = teams;
    } else {
      // Employee
      const teams = await prisma.team.findMany({
        where: {
          users: { some: { id: userId } },
        },
        include: {
          leader: {
            select: { id: true, name: true, email: true, role: true, status: true, contactNumber: true, createdAt: true }
          },
          users: {
            select: { id: true, name: true, email: true, role: true, status: true, contactNumber: true, createdAt: true }
          },
        },
      });
      userData.teams = teams;
    }

    return res.status(200).json({ user: userData });
  } catch (error) {
    console.error('Get Me Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak whether the email exists
      return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken, resetPasswordExpires }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: '"OpsGuardian Security" <security@opsguardian.com>',
      to: email,
      subject: 'OpsGuardian - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #333; background-color: #1a1a1a; color: #f5f5dc; border-radius: 8px;">
          <h2 style="color: #f5f5dc; text-align: center;">OpsGuardian Security</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your OpsGuardian account. If you didn't make this request, you can safely ignore this email.</p>
          <p>Click the secure link below to reset your password. This link will expire in 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #412d15; color: #f5f5dc; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset My Password</a>
          </div>
          <p style="font-size: 12px; color: #888;">For security reasons, this link will automatically expire after 60 minutes.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[MAIL] Password reset email sent for ${email}`);
    } catch (mailError) {
      console.error(`[MAIL ERROR] Could not send email. SMTP might not be configured in production.`);
      console.log(`[FALLBACK] Password reset link for ${email}: ${resetLink}`);
    }

    return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
