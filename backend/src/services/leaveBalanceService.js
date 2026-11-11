import { prisma } from '../utils/prisma.js';

export async function getMy(userId) {
  const year = new Date().getFullYear();
  let balance = await prisma.leaveBalance.findUnique({ where: { userId_year: { userId, year } } });
  if (!balance) {
    balance = await prisma.leaveBalance.create({ data: { userId, year, totalDays: 30 } });
  }
  return {
    ...balance,
    remainingDays: balance.totalDays - balance.usedDays - balance.pendingDays,
  };
}

export async function getByUserId(userId, actor) {
  if (actor.role !== 'admin' && actor.role !== 'super_admin' && actor.id !== userId) return null;
  if (actor.role === 'admin') {
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { unit: true } });
    if (!target || target.unit !== actor.unit) return null;
  }
  const year = new Date().getFullYear();
  let balance = await prisma.leaveBalance.findUnique({ where: { userId_year: { userId, year } } });
  if (!balance) {
    balance = await prisma.leaveBalance.create({ data: { userId, year, totalDays: 30 } });
  }
  return { ...balance, remainingDays: balance.totalDays - balance.usedDays - balance.pendingDays };
}
