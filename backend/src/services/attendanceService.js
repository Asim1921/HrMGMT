import { prisma } from '../utils/prisma.js';
import { getRosterUserIds } from '../utils/rosterScope.js';

const ATTENDANCE_START = parseInt(process.env.ATTENDANCE_START_HOUR || '8', 10);
const ATTENDANCE_END = parseInt(process.env.ATTENDANCE_END_HOUR || '10', 10);

function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isWeekend(date) {
  const dow = date.getDay(); // 0=Sun, 6=Sat
  return dow === 0 || dow === 6;
}

export async function mark(userId, ipAddress, latitude, longitude) {
  const now = new Date();
  const date = todayDate();
  const existing = await prisma.attendance.findUnique({ where: { userId_date: { userId, date } } });
  if (existing) {
    return {
      id: existing.id,
      date: existing.date,
      markedAt: existing.markedAt,
      status: existing.status,
      alreadyMarked: true,
    };
  }

  const holiday = await prisma.holiday.findUnique({ where: { date } });
  const status = (holiday || isWeekend(date)) ? 'holiday' : 'present';

  const record = await prisma.attendance.create({
    data: { userId, date, markedAt: now, status, ipAddress: ipAddress || null, latitude: latitude ?? null, longitude: longitude ?? null },
  });
  return { id: record.id, date: record.date, markedAt: record.markedAt, status: record.status, holiday: holiday?.name || null };
}

export async function bulkMark(entries) {
  const results = [];
  for (const { userId, date, status } of entries) {
    const d = new Date(date);
    const existing = await prisma.attendance.findUnique({ where: { userId_date: { userId, date: d } } });
    if (existing) { results.push({ userId, skipped: true }); continue; }
    const record = await prisma.attendance.create({ data: { userId, date: d, markedAt: new Date(), status: status || 'absent' } });
    results.push({ userId, id: record.id, status: record.status });
  }
  return results;
}

export async function getToday(userId) {
  const date = todayDate();
  const record = await prisma.attendance.findUnique({ where: { userId_date: { userId, date } } });
  if (!record) return null;
  return { id: record.id, date: record.date, markedAt: record.markedAt, status: record.status };
}

export async function getMy(userId, start, end) {
  const where = { userId };
  if (start) where.date = { ...where.date, gte: new Date(start) };
  if (end) where.date = { ...where.date, lte: new Date(end) };
  const items = await prisma.attendance.findMany({ where, orderBy: { date: 'desc' }, take: 365 });
  return { items };
}

export async function getTeam(actor, unit, start, end) {
  const rosterIds = await getRosterUserIds(actor);
  const userWhere = { status: 'active' };
  if (rosterIds !== null) userWhere.id = { in: rosterIds };
  if (unit && actor.role === 'super_admin') userWhere.unit = unit;
  const userIds = (await prisma.user.findMany({ where: userWhere, select: { id: true } })).map((u) => u.id);
  const dateFilter = {};
  if (start) dateFilter.gte = new Date(start);
  if (end) dateFilter.lte = new Date(end);
  const items = await prisma.attendance.findMany({
    where: { userId: { in: userIds }, ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}) },
    include: { user: { select: { id: true, fullName: true, employeeId: true, unit: true } } },
    orderBy: { date: 'desc' },
    take: 500,
  });
  return { items };
}
