import { prisma } from '../utils/prisma.js';

export async function upload(userId, { type, title, filePath, fileSize, mimeType }) {
  if (!type || !title || !filePath || fileSize == null || !mimeType) {
    throw Object.assign(new Error('type, title, filePath, fileSize, and mimeType required'), { statusCode: 400 });
  }
  return prisma.document.create({
    data: {
      userId,
      type,
      title,
      filePath,
      fileSize,
      mimeType,
    },
  });
}

export async function listByUser(userId) {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function listAll({ status, type, page = 1, limit = 20 } = {}) {
  const where = {};
  if (type) where.type = type;

  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { uploadedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function remove(id, userId) {
  const existing = await prisma.document.findUnique({
    where: { id },
    include: { user: { select: { id: true } } },
  });
  if (!existing) return null;

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!actor) return null;

  const isOwner = existing.userId === userId;
  const isAdmin = actor.role === 'admin' || actor.role === 'super_admin';
  if (!isOwner && !isAdmin) {
    throw Object.assign(new Error('Only owner or admin can delete this document'), { statusCode: 403 });
  }

  await prisma.document.delete({ where: { id } });
  return true;
}
