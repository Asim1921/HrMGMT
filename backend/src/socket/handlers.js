import { prisma } from '../utils/prisma.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { joinAllParticipants } from './rooms.js';

export function registerLeaveHandlers(socket) {
  const joinRoom = (leaveRequestId) => {
    if (leaveRequestId) socket.join(`leave:${leaveRequestId}`);
  };

  socket.on('join_leave_request', ({ leaveRequestId }) => joinRoom(leaveRequestId));

  socket.on('leave_leave_request', ({ leaveRequestId }) => {
    if (leaveRequestId) socket.leave(`leave:${leaveRequestId}`);
  });
}

export function registerChatHandlers(io, socket, onlineUsers) {
  socket.on('join_conversation', async ({ conversationId }, callback) => {
    try {
      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId: socket.user.id } },
      });
      if (!participant) return callback?.({ error: 'Not a participant' });
      socket.join(`conv:${conversationId}`);
      callback?.({ ok: true });
    } catch (e) {
      console.error('join_conversation error:', e);
      callback?.({ error: 'Failed to join conversation' });
    }
  });

  socket.on('send_message', async (data, callback) => {
    try {
      const { conversationId, content, tempId } = data;
      const senderId = socket.user.id;

      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId: senderId } },
      });
      if (!participant) return callback?.({ error: 'Not a participant' });

      const { content: encrypted, contentIv } = encrypt(content);

      const message = await prisma.message.create({
        data: { conversationId, senderId, content: encrypted, contentIv },
        include: {
          sender: { select: { id: true, fullName: true, profilePicture: true } },
          attachments: true,
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      const decryptedMsg = {
        ...message,
        content: decrypt(message.content, message.contentIv),
        contentIv: undefined,
      };

      socket.join(`conv:${conversationId}`);
      await joinAllParticipants(io, conversationId, onlineUsers);

      callback?.({ message: decryptedMsg, tempId });

      socket.to(`conv:${conversationId}`).emit('new_message', decryptedMsg);

      const otherParticipants = await prisma.conversationParticipant.findMany({
        where: { conversationId, userId: { not: senderId } },
        select: { userId: true },
      });

      for (const p of otherParticipants) {
        if (onlineUsers.has(p.userId)) {
          await prisma.message.update({
            where: { id: message.id },
            data: { status: 'delivered', deliveredAt: new Date() },
          });
          io.to(`conv:${conversationId}`).emit('message_status_update', {
            messageId: message.id,
            status: 'delivered',
            deliveredAt: new Date(),
          });
        }
      }
    } catch (e) {
      console.error('send_message error:', e);
      callback?.({ error: 'Failed to send message' });
    }
  });

  socket.on('typing_start', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('user_typing', {
      conversationId,
      userId: socket.user.id,
      fullName: socket.user.fullName,
      profilePicture: socket.user.profilePicture,
    });
  });

  socket.on('typing_stop', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('user_stop_typing', {
      conversationId,
      userId: socket.user.id,
    });
  });

  socket.on('mark_delivered', async ({ messageIds }) => {
    try {
      if (!messageIds?.length) return;
      const now = new Date();
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          senderId: { not: socket.user.id },
          status: 'sent',
        },
        data: { status: 'delivered', deliveredAt: now },
      });

      const msgs = await prisma.message.findMany({
        where: { id: { in: messageIds } },
        select: { id: true, senderId: true, conversationId: true },
      });

      for (const m of msgs) {
        const senderSockets = onlineUsers.get(m.senderId);
        if (senderSockets) {
          for (const sid of senderSockets) {
            io.to(sid).emit('message_status_update', {
              messageId: m.id,
              status: 'delivered',
              deliveredAt: now,
            });
          }
        }
      }
    } catch (e) {
      console.error('mark_delivered error:', e);
    }
  });

  socket.on('mark_seen', async ({ conversationId }) => {
    try {
      const userId = socket.user.id;
      const now = new Date();

      const updated = await prisma.message.findMany({
        where: {
          conversationId,
          senderId: { not: userId },
          status: { not: 'seen' },
        },
        select: { id: true, senderId: true },
      });

      if (!updated.length) return;

      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          status: { not: 'seen' },
        },
        data: { status: 'seen', seenAt: now },
      });

      await prisma.conversationParticipant.updateMany({
        where: { conversationId, userId },
        data: { lastReadAt: now },
      });

      const senderIds = [...new Set(updated.map((m) => m.senderId))];
      for (const sid of senderIds) {
        const senderSockets = onlineUsers.get(sid);
        if (senderSockets) {
          for (const sockId of senderSockets) {
            io.to(sockId).emit('message_status_update', {
              conversationId,
              status: 'seen',
              seenAt: now,
              messageIds: updated.filter((m) => m.senderId === sid).map((m) => m.id),
            });
          }
        }
      }
    } catch (e) {
      console.error('mark_seen error:', e);
    }
  });
}
