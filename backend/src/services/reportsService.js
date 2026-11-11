import { prisma } from '../utils/prisma.js';
import { getRosterUserIds } from '../utils/rosterScope.js';

export async function attendance(query, actor) {
  const rosterIds = await getRosterUserIds(actor);
  const userWhere = { status: 'active' };
  if (rosterIds !== null) userWhere.id = { in: rosterIds };
  const users = await prisma.user.findMany({ where: userWhere, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const start = query.start ? new Date(query.start) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = query.end ? new Date(query.end) : new Date();
  const items = await prisma.attendance.findMany({
    where: { userId: { in: userIds }, date: { gte: start, lte: end } },
    include: { user: { select: { fullName: true, employeeId: true, unit: true } } },
    orderBy: { date: 'desc' },
  });
  return { items, start, end };
}

export async function leaves(query, actor) {
  const where = {};
  const rosterIds = await getRosterUserIds(actor);
  if (rosterIds !== null) where.userId = { in: rosterIds };
  const start = query.start ? new Date(query.start) : new Date(new Date().setMonth(new Date().getMonth() - 3));
  const end = query.end ? new Date(query.end) : new Date();
  where.startDate = { lte: end };
  where.endDate = { gte: start };
  const items = await prisma.leaveRequest.findMany({
    where,
    include: { user: { select: { fullName: true, employeeId: true, unit: true } } },
    orderBy: { startDate: 'desc' },
  });
  return { items, start, end };
}
