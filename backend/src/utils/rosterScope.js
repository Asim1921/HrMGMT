import { prisma } from './prisma.js';

export function getActorApprovalLevel(actor) {
  if (actor.role === 'super_admin') return 3;
  if (actor.approvalLevel != null) return actor.approvalLevel;
  return null;
}

/** Returns descendant user IDs in the reporting chain, or null for unrestricted (super_admin). */
export async function getRosterUserIds(actor) {
  if (actor.role === 'super_admin') return null;

  if (actor.role !== 'admin') return [];

  const ids = new Set();
  let frontier = [actor.id];

  while (frontier.length > 0) {
    const reports = await prisma.user.findMany({
      where: { reportingToId: { in: frontier } },
      select: { id: true },
    });
    const next = [];
    for (const r of reports) {
      if (!ids.has(r.id)) {
        ids.add(r.id);
        next.push(r.id);
      }
    }
    frontier = next;
  }

  // G-1 sees all field personnel (including unassigned) for roster management
  if (actor.approvalLevel === 2) {
    const fieldPersonnel = await prisma.user.findMany({
      where: { designation: { in: ['INTERNEE', 'WCF'] } },
      select: { id: true },
    });
    for (const u of fieldPersonnel) ids.add(u.id);
  }

  return [...ids];
}

export async function canAccessRosterUser(actor, targetUserId) {
  if (actor.id === targetUserId) return true;
  if (actor.role === 'super_admin') return true;
  const rosterIds = await getRosterUserIds(actor);
  return rosterIds.includes(targetUserId);
}
