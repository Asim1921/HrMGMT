import * as usersService from '../services/usersService.js';
import * as auditService from '../services/auditService.js';

export async function list(req, res, next) {
  try {
    const { role, unit, status, page = 1, limit = 20 } = req.query;
    const result = await usersService.list({ role, unit, status, page: +page, limit: +limit }, req.user);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function getById(req, res, next) {
  try {
    const user = await usersService.getById(req.params.id, req.user);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const created = await usersService.create(req.body, req.user);
    auditService.log({ actorId: req.user.id, action: 'create', entity: 'user', entityId: created.id, details: { fullName: created.fullName, role: created.role }, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const updated = await usersService.update(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    auditService.log({ actorId: req.user.id, action: 'update', entity: 'user', entityId: req.params.id, details: { changes: Object.keys(req.body) }, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const deleted = await usersService.remove(req.params.id, req.user);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    auditService.log({ actorId: req.user.id, action: 'delete', entity: 'user', entityId: req.params.id, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
