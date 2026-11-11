import { prisma } from '../utils/prisma.js';
import { hashPassword } from './authService.js';
import { canAccessRosterUser, getRosterUserIds } from '../utils/rosterScope.js';

const safeUserSelect = {
  id: true,
  employeeId: true,
  fullName: true,
  email: true,
  role: true,
  rank: true,
  unit: true,
  reportingToId: true,
  status: true,
  designation: true,
  approvalLevel: true,
  profilePicture: true,
  createdAt: true,
  updatedAt: true,
  reportingTo: { select: { id: true, fullName: true, approvalLevel: true, designation: true } },
};

const FIELD_DESIGNATIONS = new Set(['INTERNEE', 'WCF']);

async function validateReportingAssignment(actor, subject, reportingToId) {
  if (!reportingToId) return;

  const manager = await prisma.user.findUnique({
    where: { id: reportingToId },
    select: { id: true, approvalLevel: true, role: true, reportingToId: true, designation: true },
  });
  if (!manager) {
    throw Object.assign(new Error('Selected officer not found'), { statusCode: 400 });
  }

  const subjectIsField = FIELD_DESIGNATIONS.has(subject.designation);
  const subjectIsG2 = subject.approvalLevel === 1;

  if (subjectIsField) {
    if (manager.approvalLevel !== 1) {
      throw Object.assign(new Error('Internee/WCF must be assigned to a G-2 officer'), { statusCode: 400 });
    }
    if (actor.approvalLevel === 2 && manager.reportingToId !== actor.id) {
      throw Object.assign(new Error('G-1 can only assign personnel to G-2 officers under your command'), { statusCode: 403 });
    }
    if (actor.role === 'admin' && actor.approvalLevel === 1) {
      throw Object.assign(new Error('Only G-1 or Command can reassign field personnel'), { statusCode: 403 });
    }
    return;
  }

  if (subjectIsG2) {
    if (manager.approvalLevel !== 2 && manager.role !== 'super_admin') {
      throw Object.assign(new Error('G-2 officers must report to a G-1 officer'), { statusCode: 400 });
    }
    if (actor.role !== 'super_admin' && actor.approvalLevel !== 2) {
      throw Object.assign(new Error('Only G-1 or Command can assign G-2 reporting lines'), { statusCode: 403 });
    }
    return;
  }

  if (actor.role !== 'super_admin') {
    throw Object.assign(new Error('Reporting assignment not allowed for this user type'), { statusCode: 403 });
  }
}

export async function list({ role, unit, status, page, limit }, actor) {
  const where = {};
  const rosterIds = await getRosterUserIds(actor);
  if (rosterIds !== null) where.id = { in: rosterIds };
  if (role) where.role = role;
  if (unit && actor.role === 'super_admin') where.unit = unit;
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function getById(id, actor) {
  const user = await prisma.user.findUnique({ where: { id }, select: safeUserSelect });
  if (!user) return null;
  if (!(await canAccessRosterUser(actor, id))) return null;
  return user;
}

export async function create(body, actor) {
  if (actor.role !== 'super_admin' && actor.role !== 'admin') throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  const { email, password, fullName, employeeId, role, rank, unit, reportingToId, designation, approvalLevel } = body;
  if (!email || !password || !fullName) throw Object.assign(new Error('email, password, fullName required'), { statusCode: 400 });
  const r = (role || 'user').toLowerCase();
  if (!['super_admin', 'admin', 'user'].includes(r)) throw Object.assign(new Error('Invalid role'), { statusCode: 400 });
  if (actor.role === 'admin' && (r === 'super_admin' || r === 'admin')) throw Object.assign(new Error('Admin cannot create super_admin or admin'), { statusCode: 403 });
  const targetUnit = unit ?? actor.unit;
  if (reportingToId) {
    const subjectStub = {
      designation: (designation || '').trim() || null,
      approvalLevel: approvalLevel != null ? (Number(approvalLevel) || null) : null,
    };
    await validateReportingAssignment(actor, subjectStub, reportingToId);
  }

  const existing = await prisma.user.findFirst({ where: { OR: [{ email: email.trim().toLowerCase() }, ...(employeeId ? [{ employeeId }] : [])] } });
  if (existing) throw Object.assign(new Error('Email or employee ID already exists'), { statusCode: 409 });

  const passwordHash = await hashPassword(password);
  const resolvedReportingToId = reportingToId || (actor.role === 'admin' ? actor.id : null);
  const user = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      passwordHash,
      fullName: fullName.trim(),
      employeeId: (employeeId || '').trim() || null,
      role: r,
      rank: rank?.trim() || null,
      unit: targetUnit || null,
      reportingToId: resolvedReportingToId,
      designation: (designation || '').trim() || null,
      approvalLevel: approvalLevel != null ? (Number(approvalLevel) || null) : null,
    },
    select: safeUserSelect,
  });
  return user;
}

export async function update(id, body, actor) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return null;
  if (!(await canAccessRosterUser(actor, id))) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

  const { fullName, role, rank, unit, reportingToId, status, designation, approvalLevel } = body;
  const data = {};
  if (fullName !== undefined) data.fullName = fullName.trim();
  if (rank !== undefined) data.rank = rank?.trim() || null;
  if (designation !== undefined) data.designation = (designation || '').trim() || null;
  if (unit !== undefined) {
    if (actor.role !== 'super_admin') {
      if ((unit || null) !== (existing.unit || null)) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      }
    } else {
      data.unit = unit || null;
    }
  }
  if (approvalLevel !== undefined && actor.role !== 'super_admin') {
    const nextLevel = approvalLevel != null ? (Number(approvalLevel) || null) : null;
    if (nextLevel !== existing.approvalLevel) {
      throw Object.assign(new Error('Only super_admin can change approval level'), { statusCode: 403 });
    }
  } else if (approvalLevel !== undefined) {
    data.approvalLevel = approvalLevel != null ? (Number(approvalLevel) || null) : null;
  }
  if (reportingToId !== undefined) {
    if (reportingToId) {
      if (!(await canAccessRosterUser(actor, reportingToId)) && reportingToId !== actor.id && actor.role !== 'super_admin') {
        throw Object.assign(new Error('Cannot assign reporting manager outside your chain of command'), { statusCode: 403 });
      }
      await validateReportingAssignment(actor, existing, reportingToId);
    }
    data.reportingToId = reportingToId || null;
  }
  if (status !== undefined) data.status = status;
  if (role !== undefined) {
    if (actor.role !== 'super_admin') throw Object.assign(new Error('Only super_admin can change role'), { statusCode: 403 });
    data.role = role;
  }

  return prisma.user.update({ where: { id }, data, select: safeUserSelect });
}

export async function remove(id, actor) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return null;
  if (!(await canAccessRosterUser(actor, id))) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  if (actor.id === id) throw Object.assign(new Error('Cannot delete yourself'), { statusCode: 400 });
  await prisma.user.delete({ where: { id } });
  return true;
}
