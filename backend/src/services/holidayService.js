import { prisma } from '../utils/prisma.js';

export async function create(body, actorId) {
  const { date, name, description } = body;
  if (!date || !name) throw Object.assign(new Error('date and name required'), { statusCode: 400 });

  const d = new Date(date);
  if (isNaN(d.getTime())) throw Object.assign(new Error('Invalid date'), { statusCode: 400 });

  const existing = await prisma.holiday.findUnique({ where: { date: d } });
  if (existing) throw Object.assign(new Error('Holiday already exists for this date'), { statusCode: 409 });

  return prisma.holiday.create({
    data: {
      date: d,
      name,
      description: description ?? null,
      createdById: actorId,
    },
  });
}

export async function list(year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);

  return prisma.holiday.findMany({
    where: {
      date: { gte: start, lte: end },
    },
    orderBy: { date: 'asc' },
  });
}

export async function remove(id) {
  const existing = await prisma.holiday.findUnique({ where: { id } });
  if (!existing) return null;
  await prisma.holiday.delete({ where: { id } });
  return true;
}

export async function isHoliday(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;

  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const holiday = await prisma.holiday.findFirst({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
    },
  });
  return holiday != null;
}
