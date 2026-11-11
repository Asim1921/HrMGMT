import * as taskService from '../services/taskService.js';
import * as auditService from '../services/auditService.js';

export async function create(req, res, next) {
  try {
    const result = await taskService.create(req.body, req.user.id);
    auditService.log({ actorId: req.user.id, action: 'create', entity: 'task', entityId: result.id, details: { title: result.title, assignedTo: req.body.assignedToId }, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function getById(req, res, next) {
  try {
    const result = await taskService.getById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Task not found' });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function listMy(req, res, next) {
  try {
    const result = await taskService.listByUser(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function listAll(req, res, next) {
  try {
    const result = await taskService.listAll({
      status: req.query.status,
      priority: req.query.priority,
      page: +req.query.page || 1,
      limit: +req.query.limit || 50,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const result = await taskService.update(req.params.id, req.body);
    if (!result) return res.status(404).json({ error: 'Task not found' });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function complete(req, res, next) {
  try {
    const result = await taskService.complete(req.params.id, req.user.id);
    if (!result) return res.status(404).json({ error: 'Task not found' });
    auditService.log({ actorId: req.user.id, action: 'complete', entity: 'task', entityId: req.params.id, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function reviewAction(req, res, next) {
  try {
    const result = await taskService.reviewAction(req.params.id, req.body.action, req.user.id);
    if (!result) return res.status(404).json({ error: 'Task not found' });
    auditService.log({ actorId: req.user.id, action: req.body.action, entity: 'task', entityId: req.params.id, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function addComment(req, res, next) {
  try {
    const result = await taskService.addComment(req.params.id, req.user.id, {
      message: req.body.message,
      file: req.file,
    });
    if (!result) return res.status(404).json({ error: 'Task not found' });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function listComments(req, res, next) {
  try {
    const result = await taskService.listComments(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
