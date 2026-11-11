import { prisma } from '../utils/prisma.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const userSelect = { id: true, fullName: true, profilePicture: true, isOnline: true, lastSeen: true, designation: true, rank: true };

export const chatService = {
  async getConversations(userId) {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { select: userSelect } },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { id: true, fullName: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    return participations.map((p) => {
      const conv = p.conversation;
      const otherParticipant = conv.participants.find((cp) => cp.userId !== userId);
      const lastMsg = conv.messages[0] || null;
      let lastMessagePreview = null;
      if (lastMsg) {
        try {
          const text = decrypt(lastMsg.content, lastMsg.contentIv);
          lastMessagePreview = {
            id: lastMsg.id,
            senderId: lastMsg.senderId,
            senderName: lastMsg.sender.fullName,
            content: text.length > 80 ? text.slice(0, 80) + '...' : text,
            status: lastMsg.status,
            createdAt: lastMsg.createdAt,
          };
        } catch {
          lastMessagePreview = { id: lastMsg.id, senderId: lastMsg.senderId, content: '[encrypted]', status: lastMsg.status, createdAt: lastMsg.createdAt };
        }
      }

      return {
        id: conv.id,
        otherUser: otherParticipant?.user || null,
        lastMessage: lastMessagePreview,
        lastReadAt: p.lastReadAt,
        updatedAt: conv.updatedAt,
      };
    });
  },

  async getUnreadTotal(userId) {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });
    let total = 0;
    for (const p of participations) {
      const count = await prisma.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: userId },
          createdAt: p.lastReadAt ? { gt: p.lastReadAt } : undefined,
        },
      });
      total += count;
    }
    return total;
  },

  async getOrCreateConversation(userId, otherUserId) {
    if (userId === otherUserId) throw new Error('Cannot chat with yourself');

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
        participants: { every: { userId: { in: [userId, otherUserId] } } },
      },
      include: {
        participants: { include: { user: { select: userSelect } } },
      },
    });

    if (existing) {
      return {
        id: existing.id,
        otherUser: existing.participants.find((p) => p.userId !== userId)?.user,
        updatedAt: existing.updatedAt,
      };
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: userSelect,
    });
    if (!otherUser) throw new Error('User not found');

    const conv = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: {
        participants: { include: { user: { select: userSelect } } },
      },
    });

    return {
      id: conv.id,
      otherUser,
      updatedAt: conv.updatedAt,
    };
  },

  async getMessages(conversationId, userId, cursor, limit = 30) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new Error('Not a participant');

    const where = { conversationId };
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        sender: { select: { id: true, fullName: true, profilePicture: true } },
        attachments: true,
      },
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    const decrypted = messages.map((m) => {
      let content;
      try {
        content = decrypt(m.content, m.contentIv);
      } catch {
        content = '[decryption failed]';
      }
      return { ...m, content, contentIv: undefined };
    });

    return {
      messages: decrypted.reverse(),
      hasMore,
      nextCursor: hasMore ? messages[messages.length - 1].createdAt.toISOString() : null,
    };
  },

  async searchUsers(query, currentUserId) {
    const where = {
      id: { not: currentUserId },
      status: 'active',
    };
    if (query) {
      where.OR = [
        { fullName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { employeeId: { contains: query, mode: 'insensitive' } },
      ];
    }
    return prisma.user.findMany({
      where,
      select: userSelect,
      take: 20,
      orderBy: { fullName: 'asc' },
    });
  },

  async saveAttachment(messageId, file) {
    return prisma.messageAttachment.create({
      data: {
        messageId,
        filePath: `/uploads/chat/${file.filename}`,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
      },
    });
  },

  async createMessageWithAttachment(conversationId, senderId, file) {
    const { content: encrypted, contentIv } = encrypt('[attachment]');

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: encrypted,
        contentIv,
        attachments: {
          create: {
            filePath: `/uploads/chat/${file.filename}`,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
          },
        },
      },
      include: {
        sender: { select: { id: true, fullName: true, profilePicture: true } },
        attachments: true,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return { ...message, content: '[attachment]', contentIv: undefined };
  },
};
