import * as announcementService from '../services/announcementService.js';
import * as auditService from '../services/auditService.js';

export async function list(req, res, next) {
  try {
    const result = await announcementService.list({
      unit: req.query.unit,
      page: +req.query.page || 1,
      limit: +req.query.limit || 20,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function getById(req, res, next) {
  try {
    const result = await announcementService.getById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Announcement not found' });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const result = await announcementService.create(req.body, req.user.id);
    auditService.log({ actorId: req.user.id, action: 'create', entity: 'announcement', entityId: result.id, details: { title: result.title, priority: result.priority }, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const result = await announcementService.update(req.params.id, req.body, req.user.id);
    if (!result) return res.status(404).json({ error: 'Announcement not found' });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await announcementService.remove(req.params.id, req.user.id);
    if (!result) return res.status(404).json({ error: 'Announcement not found' });
    auditService.log({ actorId: req.user.id, action: 'delete', entity: 'announcement', entityId: req.params.id, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.json({ message: 'Deleted' });
  } catch (e) {
    next(e);
  }
}
