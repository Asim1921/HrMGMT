import * as holidayService from '../services/holidayService.js';
import * as auditService from '../services/auditService.js';

export async function list(req, res, next) {
  try {
    const year = +req.query.year || new Date().getFullYear();
    const result = await holidayService.list(year);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const result = await holidayService.create(req.body, req.user.id);
    auditService.log({ actorId: req.user.id, action: 'create', entity: 'holiday', entityId: result.id, details: { name: result.name, date: req.body.date }, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await holidayService.remove(req.params.id);
    if (!result) return res.status(404).json({ error: 'Holiday not found' });
    auditService.log({ actorId: req.user.id, action: 'delete', entity: 'holiday', entityId: req.params.id, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
