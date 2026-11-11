import { prisma } from '../utils/prisma.js';

export async function log({ actorId, action, entity, entityId, details, ipAddress }) {
  if (!action || !entity) throw Object.assign(new Error('action and entity required'), { statusCode: 400 });

  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      details: details ?? null,
      ipAddress: ipAddress ?? null,
    },
  });
}

export async function list({ actorId, entity, action, start, end, page = 1, limit = 50 } = {}) {
  const where = {};
  if (actorId) where.actorId = actorId;
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (start || end) {
    where.createdAt = {};
    if (start) where.createdAt.gte = new Date(start);
    if (end) where.createdAt.lte = new Date(end);
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actor: {
          select: { id: true, fullName: true, role: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page, limit };
}
