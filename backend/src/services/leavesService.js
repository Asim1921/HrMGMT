import { prisma } from '../utils/prisma.js';
import * as notificationService from './notificationService.js';
import { getIO } from '../socket/index.js';

const commentUserSelect = { id: true, fullName: true, designation: true, approvalLevel: true, role: true, rank: true };

function serializeComment(comment) {
  return {
    ...comment,
    createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt,
  };
}

async function broadcastLeaveComment(comment, leaveRequest) {
  try {
    const io = getIO();
    if (!io) return;

    const payload = serializeComment(comment);
    const recipients = new Set();

    recipients.add(leaveRequest.userId);
    if (leaveRequest.approvedByG2Id) recipients.add(leaveRequest.approvedByG2Id);
    if (leaveRequest.approvedByG1Id) recipients.add(leaveRequest.approvedByG1Id);
    if (leaveRequest.approvedByComdtId) recipients.add(leaveRequest.approvedByComdtId);

    const currentLevel = getCurrentApprovalLevel(leaveRequest);
    if (currentLevel) {
      const approvers = await prisma.user.findMany({
        where: { status: 'active', approvalLevel: currentLevel },
        select: { id: true },
      });
      approvers.forEach((a) => recipients.add(a.id));
    }

    io.to(`leave:${comment.leaveRequestId}`).emit('leave_comment', payload);
    for (const uid of recipients) {
      io.to(`user:${uid}`).emit('leave_comment', payload);
    }
  } catch (e) {
    console.error('broadcastLeaveComment error:', e);
  }
}

/** Get actor's approval level: 1=G-2, 2=G-1, 3=Comdt. Super_admin is treated as Comdt (3) if not set. */
function getApprovalLevel(actor) {
  if (actor.approvalLevel != null) return actor.approvalLevel;
  if (actor.role === 'super_admin') return 3; // Comdt
  return null;
}

function getCurrentApprovalLevel(leaveRequest) {
  if (leaveRequest.status !== 'pending') return null;
  return 1 + (leaveRequest.approvedByG2Id ? 1 : 0) + (leaveRequest.approvedByG1Id ? 1 : 0);
}

export function canAccessLeaveComments(actor, leaveRequest) {
  if (leaveRequest.userId === actor.id) return true;
  const level = getApprovalLevel(actor);
  if (level == null) return false;

  if (
    leaveRequest.approvedByG2Id === actor.id
    || leaveRequest.approvedByG1Id === actor.id
    || leaveRequest.approvedByComdtId === actor.id
    || leaveRequest.reviewedById === actor.id
  ) {
    return true;
  }

  if (leaveRequest.status === 'pending') {
    return level === getCurrentApprovalLevel(leaveRequest);
  }

  return false;
}

async function notifyLeaveComment(leaveRequest, commenterId, message, parentId) {
  const preview = message.trim().slice(0, 80) + (message.trim().length > 80 ? '…' : '');

  if (parentId) {
    const parent = await prisma.leaveRequestComment.findUnique({
      where: { id: parentId },
      select: { userId: true },
    });
    if (parent && parent.userId !== commenterId) {
      const link = parent.userId === leaveRequest.userId ? '/leaves/my-requests' : '/leaves/approvals';
      await notificationService.create(parent.userId, {
        type: 'leave_comment',
        title: 'Reply on leave request',
        message: preview,
        link,
      });
    }
    return;
  }

  if (commenterId === leaveRequest.userId) {
    const currentLevel = getCurrentApprovalLevel(leaveRequest);
    if (!currentLevel) return;
    const approvers = await prisma.user.findMany({
      where: { status: 'active', approvalLevel: currentLevel },
      select: { id: true },
    });
    await Promise.all(
      approvers.map((a) => notificationService.create(a.id, {
        type: 'leave_comment',
        title: 'Applicant commented on leave request',
        message: preview,
        link: '/leaves/approvals',
      })),
    );
    return;
  }

  await notificationService.create(leaveRequest.userId, {
    type: 'leave_comment',
    title: 'Comment on your leave request',
    message: preview,
    link: '/leaves/my-requests',
  });
}

export async function apply(userId, body) {
  const { leaveType, startDate, endDate, reason } = body;
  if (!leaveType || !startDate || !endDate) throw Object.assign(new Error('leaveType, startDate, endDate required'), { statusCode: 400 });
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) throw Object.assign(new Error('startDate must be before endDate'), { statusCode: 400 });
  if (start < new Date(new Date().setHours(0, 0, 0, 0))) throw Object.assign(new Error('Cannot apply for past dates'), { statusCode: 400 });

  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const year = start.getFullYear();
  let balance = await prisma.leaveBalance.findUnique({ where: { userId_year: { userId, year } } });
  if (!balance) {
    balance = await prisma.leaveBalance.create({ data: { userId, year, totalDays: 30 } });
  }
  const remaining = balance.totalDays - balance.usedDays - balance.pendingDays;
  if (totalDays > remaining) throw Object.assign(new Error('Insufficient leave balance'), { statusCode: 400 });

  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      userId,
      status: { in: ['pending', 'approved'] },
      OR: [
        { startDate: { lte: end }, endDate: { gte: start } },
      ],
    },
  });
  if (overlap) throw Object.assign(new Error('Overlapping leave request exists'), { statusCode: 400 });

  await prisma.leaveBalance.update({
    where: { id: balance.id },
    data: { pendingDays: { increment: totalDays } },
  });

  const request = await prisma.leaveRequest.create({
    data: { userId, leaveType, startDate: start, endDate: end, totalDays, reason: reason || null, status: 'pending' },
  });
  return request;
}

export async function getMy(userId, { status, page = 1, limit = 10 } = {}) {
  const where = { userId };

  if (status === 'pending') {
    where.status = 'pending';
  } else if (status === 'approved') {
    where.status = 'approved';
  } else if (status === 'cancelled') {
    where.status = { in: ['cancelled', 'rejected'] };
  }

  const take = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * take;

  const include = {
    approvedByG2: { select: { id: true, fullName: true, rank: true, designation: true } },
    approvedByG1: { select: { id: true, fullName: true, rank: true, designation: true } },
    approvedByComdt: { select: { id: true, fullName: true, rank: true, designation: true } },
    reviewedBy: { select: { id: true, fullName: true, approvalLevel: true, role: true } },
  };

  const [items, total, pending, approved, cancelled] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include,
    }),
    prisma.leaveRequest.count({ where }),
    prisma.leaveRequest.count({ where: { userId, status: 'pending' } }),
    prisma.leaveRequest.count({ where: { userId, status: 'approved' } }),
    prisma.leaveRequest.count({ where: { userId, status: { in: ['cancelled', 'rejected'] } } }),
  ]);

  return {
    items,
    total,
    page: currentPage,
    limit: take,
    totalPages: Math.max(1, Math.ceil(total / take)),
    counts: { pending, approved, cancelled },
  };
}

/** Pending requests at current approver's level: G-2 (1), G-1 (2), Comdt (3). */
export async function getPending(actor) {
  const level = getApprovalLevel(actor);
  const where = { status: 'pending' };

  if (level === 1) {
    where.approvedByG2Id = null;
  } else if (level === 2) {
    where.approvedByG2Id = { not: null };
    where.approvedByG1Id = null;
  } else if (level === 3) {
    where.approvedByG1Id = { not: null };
    where.approvedByComdtId = null;
  } else {
    return { items: [] };
  }

  const items = await prisma.leaveRequest.findMany({
    where,
    include: { user: { select: { id: true, fullName: true, employeeId: true, unit: true, designation: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return { items };
}

export async function listComments(leaveRequestId, actor) {
  const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id: leaveRequestId } });
  if (!leaveRequest) return null;
  if (!canAccessLeaveComments(actor, leaveRequest)) {
    throw Object.assign(new Error('You cannot view comments on this leave request'), { statusCode: 403 });
  }

  const comments = await prisma.leaveRequestComment.findMany({
    where: { leaveRequestId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: commentUserSelect } },
  });
  return { items: comments };
}

export async function addComment(leaveRequestId, userId, message, parentId) {
  const text = message?.trim();
  if (!text) throw Object.assign(new Error('Comment message is required'), { statusCode: 400 });

  const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id: leaveRequestId } });
  if (!leaveRequest) return null;

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, approvalLevel: true },
  });
  if (!actor || !canAccessLeaveComments(actor, leaveRequest)) {
    throw Object.assign(new Error('You cannot comment on this leave request'), { statusCode: 403 });
  }

  if (leaveRequest.status !== 'pending') {
    throw Object.assign(new Error('Comments are closed on finalized leave requests'), { statusCode: 400 });
  }

  if (parentId) {
    const parent = await prisma.leaveRequestComment.findFirst({
      where: { id: parentId, leaveRequestId },
    });
    if (!parent) throw Object.assign(new Error('Parent comment not found'), { statusCode: 404 });
  }

  const comment = await prisma.leaveRequestComment.create({
    data: {
      leaveRequestId,
      userId,
      parentId: parentId || null,
      message: text,
    },
    include: { user: { select: commentUserSelect } },
  });

  notifyLeaveComment(leaveRequest, userId, text, parentId).catch((e) => console.error('Leave comment notification error:', e));
  await broadcastLeaveComment(comment, leaveRequest);
  return comment;
}

async function createReviewComment(leaveRequestId, userId, reviewComment) {
  const text = reviewComment?.trim();
  if (!text) return;
  const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id: leaveRequestId } });
  if (!leaveRequest) return;
  const comment = await prisma.leaveRequestComment.create({
    data: { leaveRequestId, userId, message: text },
    include: { user: { select: commentUserSelect } },
  });
  await broadcastLeaveComment(comment, leaveRequest);
}

export async function approve(id, reviewerId, reviewComment) {
  const req = await prisma.leaveRequest.findUnique({ where: { id }, include: { user: true } });
  if (!req || req.status !== 'pending') return null;

  const level = 1 + (req.approvedByG2Id ? 1 : 0) + (req.approvedByG1Id ? 1 : 0);
  const reviewer = await prisma.user.findUnique({ where: { id: reviewerId }, select: { approvalLevel: true, role: true } });
  const reviewerLevel = reviewer?.approvalLevel ?? (reviewer?.role === 'super_admin' ? 3 : null);
  if (reviewerLevel !== level) throw Object.assign(new Error('You are not the current approver for this request'), { statusCode: 403 });

  const now = new Date();

  if (level === 1) {
    await prisma.leaveRequest.update({
      where: { id },
      data: {
        approvedByG2Id: reviewerId,
        approvedAtG2: now,
        ...(reviewComment ? { reviewedById: reviewerId, reviewComment: reviewComment || null } : {}),
      },
    });
    await createReviewComment(id, reviewerId, reviewComment);
    return prisma.leaveRequest.findUnique({ where: { id } });
  }

  if (level === 2) {
    await prisma.leaveRequest.update({
      where: { id },
      data: {
        approvedByG1Id: reviewerId,
        approvedAtG1: now,
        ...(reviewComment ? { reviewedById: reviewerId, reviewComment: reviewComment || null } : {}),
      },
    });
    await createReviewComment(id, reviewerId, reviewComment);
    return prisma.leaveRequest.findUnique({ where: { id } });
  }

  if (level === 3) {
    const balance = await prisma.leaveBalance.findUnique({ where: { userId_year: { userId: req.userId, year: req.startDate.getFullYear() } } });
    if (!balance) return null;
    await prisma.$transaction([
      prisma.leaveRequest.update({
        where: { id },
        data: {
          status: 'approved',
          reviewedById: reviewerId,
          reviewComment: reviewComment || null,
          approvedByComdtId: reviewerId,
          approvedAtComdt: now,
        },
      }),
      prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { usedDays: { increment: req.totalDays }, pendingDays: { decrement: req.totalDays } },
      }),
    ]);
    await createReviewComment(id, reviewerId, reviewComment);
    return prisma.leaveRequest.findUnique({ where: { id } });
  }

  return null;
}

export async function reject(id, reviewerId, reviewComment) {
  const req = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!req || req.status !== 'pending') return null;

  const reviewer = await prisma.user.findUnique({ where: { id: reviewerId }, select: { approvalLevel: true, role: true } });
  const reviewerLevel = reviewer?.approvalLevel ?? (reviewer?.role === 'super_admin' ? 3 : null);
  const canReject = reviewerLevel === 1 || reviewerLevel === 2 || reviewerLevel === 3;
  if (!canReject) throw Object.assign(new Error('Only approvers (G-2, G-1, Comdt) can reject'), { statusCode: 403 });

  const balance = await prisma.leaveBalance.findUnique({ where: { userId_year: { userId: req.userId, year: req.startDate.getFullYear() } } });
  if (balance) {
    await prisma.leaveBalance.update({ where: { id: balance.id }, data: { pendingDays: { decrement: req.totalDays } } });
  }
  await prisma.leaveRequest.update({
    where: { id },
    data: { status: 'rejected', reviewedById: reviewerId, reviewComment: reviewComment || null },
  });
  await createReviewComment(id, reviewerId, reviewComment);
  return prisma.leaveRequest.findUnique({ where: { id } });
}

export async function cancel(id, userId) {
  const req = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!req || req.userId !== userId || req.status !== 'pending') return null;
  const balance = await prisma.leaveBalance.findUnique({ where: { userId_year: { userId: req.userId, year: req.startDate.getFullYear() } } });
  if (balance) {
    await prisma.leaveBalance.update({ where: { id: balance.id }, data: { pendingDays: { decrement: req.totalDays } } });
  }
  await prisma.leaveRequest.update({ where: { id }, data: { status: 'cancelled' } });
  return prisma.leaveRequest.findUnique({ where: { id } });
}
