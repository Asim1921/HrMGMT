import { prisma } from '../utils/prisma.js';
import * as notificationService from './notificationService.js';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'approved', 'rejected', 'review', 'overdue'];

const taskInclude = {
  assignedTo: { select: { id: true, fullName: true } },
  assignedBy: { select: { id: true, fullName: true } },
  comments: {
    include: {
      user: { select: { id: true, fullName: true, profilePicture: true } },
      attachments: true,
    },
    orderBy: { createdAt: 'asc' },
  },
};

export async function create(body, assignedById) {
  const { title, description, assignedToId, priority, dueDate } = body;
  if (!title || !assignedToId) {
    throw Object.assign(new Error('title and assignedToId required'), { statusCode: 400 });
  }
  const p = (priority || 'medium').toLowerCase();
  if (!VALID_PRIORITIES.includes(p)) {
    throw Object.assign(new Error('Invalid priority'), { statusCode: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      assignedToId,
      assignedById,
      priority: p,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: taskInclude,
  });

  await notificationService.create(assignedToId, {
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `You have been assigned: "${title}"`,
    link: '/tasks',
  }).catch(() => {});

  return task;
}

export async function getById(id) {
  return prisma.task.findUnique({
    where: { id },
    include: taskInclude,
  });
}

export async function listByUser(userId) {
  return prisma.task.findMany({
    where: { assignedToId: userId },
    include: taskInclude,
    orderBy: { dueDate: 'asc' },
  });
}

export async function listAll({ status, priority, page = 1, limit = 20 } = {}) {
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: { dueDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function update(id, body) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return null;

  const { title, description, assignedToId, priority, dueDate, status } = body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description ?? null;
  if (assignedToId !== undefined) data.assignedToId = assignedToId;
  if (priority !== undefined) {
    const p = priority.toLowerCase();
    if (!VALID_PRIORITIES.includes(p)) {
      throw Object.assign(new Error('Invalid priority'), { statusCode: 400 });
    }
    data.priority = p;
  }
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (status !== undefined) {
    const s = status.toLowerCase().replace(/-/g, '_');
    if (!VALID_STATUSES.includes(s)) {
      throw Object.assign(new Error('Invalid status'), { statusCode: 400 });
    }
    data.status = s;
  }

  return prisma.task.update({ where: { id }, data, include: taskInclude });
}

export async function complete(id, userId) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return null;
  if (existing.assignedToId !== userId) {
    throw Object.assign(new Error('Only the assignee can complete this task'), { statusCode: 403 });
  }

  const task = await prisma.task.update({
    where: { id },
    data: { status: 'completed', completedAt: new Date() },
    include: taskInclude,
  });

  await notificationService.create(existing.assignedById, {
    type: 'task_completed',
    title: 'Task Marked Complete',
    message: `"${existing.title}" has been marked as completed and awaits your verification.`,
    link: '/tasks',
  }).catch(() => {});

  return task;
}

export async function reviewAction(id, action, actorId) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return null;
  if (existing.assignedById !== actorId) {
    throw Object.assign(new Error('Only the task creator can approve/reject/review'), { statusCode: 403 });
  }

  let status;
  let notifTitle;
  let notifMessage;
  if (action === 'approve') {
    status = 'approved';
    notifTitle = 'Task Approved';
    notifMessage = `Your task "${existing.title}" has been approved.`;
  } else if (action === 'reject') {
    status = 'rejected';
    notifTitle = 'Task Rejected';
    notifMessage = `Your task "${existing.title}" has been rejected. Check the comments for details.`;
  } else if (action === 'review') {
    status = 'in_progress';
    notifTitle = 'Task Sent Back for Review';
    notifMessage = `Your task "${existing.title}" needs revision. Check the comments for details.`;
  } else {
    throw Object.assign(new Error('Invalid action. Use approve, reject, or review.'), { statusCode: 400 });
  }

  const task = await prisma.task.update({
    where: { id },
    data: { status },
    include: taskInclude,
  });

  await notificationService.create(existing.assignedToId, {
    type: 'task_' + action,
    title: notifTitle,
    message: notifMessage,
    link: '/tasks',
  }).catch(() => {});

  return task;
}

export async function addComment(taskId, userId, { message, file } = {}) {
  const trimmed = message?.trim() || '';
  if (!trimmed && !file) {
    throw Object.assign(new Error('Comment message or file is required'), { statusCode: 400 });
  }
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return null;

  const commentData = {
    taskId,
    userId,
    message: trimmed || null,
    ...(file && {
      attachments: {
        create: {
          filePath: `/uploads/tasks/${file.filename}`,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
        },
      },
    }),
  };

  const comment = await prisma.taskComment.create({
    data: commentData,
    include: {
      user: { select: { id: true, fullName: true, profilePicture: true } },
      attachments: true,
    },
  });

  const recipientId = userId === task.assignedToId ? task.assignedById : task.assignedToId;
  const notifSnippet = trimmed
    ? `"${trimmed.slice(0, 60)}${trimmed.length > 60 ? '…' : ''}"`
    : `attached ${file.originalname}`;
  await notificationService.create(recipientId, {
    type: 'task_comment',
    title: 'New Comment on Task',
    message: `New comment on "${task.title}": ${notifSnippet}`,
    link: '/tasks',
  }).catch(() => {});

  return comment;
}

export async function listComments(taskId) {
  return prisma.taskComment.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, fullName: true, profilePicture: true } },
      attachments: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}
