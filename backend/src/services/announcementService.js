import { prisma } from '../utils/prisma.js';

export async function create(body, actorId) {
  const { title, content, priority, targetUnit, expiresAt } = body;
  if (!title || !content) throw Object.assign(new Error('title and content required'), { statusCode: 400 });

  const p = (priority || 'normal').toLowerCase();
  if (!['normal', 'urgent', 'critical'].includes(p)) throw Object.assign(new Error('Invalid priority'), { statusCode: 400 });

  return prisma.announcement.create({
    data: {
      title,
      content,
      priority: p,
      targetUnit: targetUnit ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      postedById: actorId,
    },
  });
}

export async function list({ unit, page = 1, limit = 20 } = {}) {
  const now = new Date();
  const finalWhere = {
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
  if (unit != null) {
    finalWhere.AND = [{ OR: [{ targetUnit: null }, { targetUnit: unit }] }];
  }

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where: finalWhere,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: { postedBy: { select: { id: true, fullName: true } } },
    }),
    prisma.announcement.count({ where: finalWhere }),
  ]);
  return { items, total, page, limit };
}

export async function getById(id) {
  return prisma.announcement.findUnique({
    where: { id },
    include: { postedBy: { select: { id: true, fullName: true, role: true } } },
  });
}

export async function update(id, body, actorId) {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return null;

  const { title, content, priority, targetUnit, expiresAt } = body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  if (priority !== undefined) {
    const p = priority.toLowerCase();
    if (!['normal', 'urgent', 'critical'].includes(p)) throw Object.assign(new Error('Invalid priority'), { statusCode: 400 });
    data.priority = p;
  }
  if (targetUnit !== undefined) data.targetUnit = targetUnit ?? null;
  if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

  return prisma.announcement.update({ where: { id }, data });
}

export async function remove(id, actorId) {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return null;
  await prisma.announcement.delete({ where: { id } });
  return true;
}
