import { prisma } from '../utils/prisma.js';

export async function create(userId, { type, title, message, link }) {
  return prisma.notification.create({
    data: {
      userId,
      type: type || 'general',
      title,
      message,
      link: link ?? null,
    },
  });
}

export async function list(userId, { unreadOnly, page = 1, limit = 20 } = {}) {
  const where = { userId };
  if (unreadOnly) where.isRead = false;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function markRead(id, userId) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export async function markAllRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function unreadCount(userId) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}
