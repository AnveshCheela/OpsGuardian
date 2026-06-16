import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
// Routes
import authRoutes from './routes/auth.routes';
import approvalRoutes from './routes/approvalRoutes';
import { incidentRoutes } from './routes/incidentRoutes';
import chatRoutes from './routes/chatRoutes';
import serviceRoutes from './routes/serviceRoutes';
import teamRoutes from './routes/teamRoutes';
import { userRoutes } from './routes/userRoutes';
import { webhookRoutes } from './routes/webhookRoutes';
import { globalEvents } from './events';
import { prisma } from './config/database';

// Workers (Initialize them so they start listening to the queue)
import './workers/incidentWorker';
import './workers/escalationWorker';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Chat: join a team room
  socket.on('chat:join', (teamId: string) => {
    socket.join(`team:${teamId}`);
    console.log(`[Socket.io] Client ${socket.id} joined team:${teamId}`);
  });

  // Chat: send a message
  socket.on('chat:send', async (data: { teamId: string; userId: string; content: string }) => {
    try {
      const message = await prisma.chatMessage.create({
        data: {
          teamId: data.teamId,
          userId: data.userId,
          content: data.content,
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      io.to(`team:${data.teamId}`).emit('chat:message', message);
      console.log(`[Socket.io] Chat message from ${data.userId} in team:${data.teamId}`);
    } catch (error) {
      console.error('[Socket.io] Failed to save chat message:', error);
    }
  });

  // Join incidents dashboard room
  socket.on('join:incidents', () => {
    socket.join('incidents_dashboard');
    console.log(`Client ${socket.id} joined incidents dashboard room`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Bridge internal global events to Socket.io WebSockets
globalEvents.on('new-incident', (incident) => {
  // Emit to the specific team room if the incident has service.teamId
  if (incident.service?.teamId) {
    io.to(`team:${incident.service.teamId}`).emit('new-incident', incident);
    console.log(`[Socket.io] Emitted new-incident to team:${incident.service.teamId}`);
  }
  // Also emit globally for backwards compatibility
  io.emit('new-incident', incident);
  console.log(`[Socket.io] Broadcasted new-incident: ${incident.id}`);
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/approval', approvalRoutes);
app.use('/api/v1/chat', chatRoutes);

// Health Check Route
app.get('/health', (req, res) => {

  res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`OpsGuardian backend server running on port ${PORT}`);
});

export { app, server, io };
export default server;
