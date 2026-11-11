import { prisma } from '../utils/prisma.js';

export function joinUserConversationRoom(io, userId, conversationId, onlineUsers) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  for (const sid of sockets) {
    const s = io.sockets.sockets.get(sid);
    if (s) s.join(`conv:${conversationId}`);
  }
}

export async function joinAllParticipants(io, conversationId, onlineUsers) {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  for (const p of participants) {
    joinUserConversationRoom(io, p.userId, conversationId, onlineUsers);
  }
}
