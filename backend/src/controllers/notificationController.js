import * as notificationService from '../services/notificationService.js';

export async function list(req, res, next) {
  try {
    const result = await notificationService.list(req.user.id, {
      unreadOnly: req.query.unreadOnly === 'true',
      page: +req.query.page || 1,
      limit: +req.query.limit || 20,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function unreadCount(req, res, next) {
  try {
    const count = await notificationService.unreadCount(req.user.id);
    res.json({ count });
  } catch (e) {
    next(e);
  }
}

export async function markRead(req, res, next) {
  try {
    await notificationService.markRead(req.params.id, req.user.id);
    res.json({ message: 'Marked as read' });
  } catch (e) {
    next(e);
  }
}

export async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllRead(req.user.id);
    res.json({ message: 'All marked as read' });
  } catch (e) {
    next(e);
  }
}
