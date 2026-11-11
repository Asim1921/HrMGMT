import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../utils/prisma.js';
import { registerChatHandlers, registerLeaveHandlers } from './handlers.js';

// userId -> Set<socketId>
const onlineUsers = new Map();

export function getOnlineUsers() {
  return onlineUsers;
}

export function isUserOnline(userId) {
  const sockets = onlineUsers.get(userId);
  return sockets && sockets.size > 0;
}

export function getIO() {
  return _io;
}

let _io;

export function initSocket(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  _io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, fullName: true, role: true, status: true, profilePicture: true },
      });
      if (!user || user.status !== 'active') return next(new Error('User not found or inactive'));
      socket.user = user;
      next();
    } catch (e) {
      next(new Error('Invalid token'));
    }
  });

  _io.on('connection', async (socket) => {
    const userId = socket.user.id;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    });

    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    for (const p of participations) {
      socket.join(`conv:${p.conversationId}`);
    }

    socket.join(`user:${userId}`);

    broadcastPresence(userId, true);

    registerChatHandlers(_io, socket, onlineUsers);
    registerLeaveHandlers(socket);

    socket.on('disconnect', async () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          const now = new Date();
          await prisma.user.update({
            where: { id: userId },
            data: { isOnline: false, lastSeen: now },
          });
          broadcastPresence(userId, false, now);
        }
      }
    });
  });

  return _io;
}

async function broadcastPresence(userId, isOnline, lastSeen = null) {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  });
  for (const p of participations) {
    _io.to(`conv:${p.conversationId}`).emit('presence_update', {
      userId,
      isOnline,
      lastSeen,
    });
  }
}
