import * as leavesService from '../services/leavesService.js';
import * as auditService from '../services/auditService.js';

export async function apply(req, res, next) {
  try {
    const result = await leavesService.apply(req.user.id, req.body);
    auditService.log({ actorId: req.user.id, action: 'create', entity: 'leave_request', entityId: result.id, details: { leaveType: req.body.leaveType, days: req.body.totalDays }, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function my(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const result = await leavesService.getMy(req.user.id, {
      status: status || undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function pending(req, res, next) {
  try {
    const result = await leavesService.getPending(req.user);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function approve(req, res, next) {
  try {
    const result = await leavesService.approve(req.params.id, req.user.id, req.body?.reviewComment);
    if (!result) return res.status(404).json({ error: 'Leave request not found' });
    auditService.log({ actorId: req.user.id, action: 'approve', entity: 'leave_request', entityId: req.params.id, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function reject(req, res, next) {
  try {
    const result = await leavesService.reject(req.params.id, req.user.id, req.body?.reviewComment);
    if (!result) return res.status(404).json({ error: 'Leave request not found' });
    auditService.log({ actorId: req.user.id, action: 'reject', entity: 'leave_request', entityId: req.params.id, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function cancel(req, res, next) {
  try {
    const result = await leavesService.cancel(req.params.id, req.user.id);
    if (!result) return res.status(404).json({ error: 'Leave request not found' });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function listComments(req, res, next) {
  try {
    const result = await leavesService.listComments(req.params.id, req.user);
    if (!result) return res.status(404).json({ error: 'Leave request not found' });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function addComment(req, res, next) {
  try {
    const result = await leavesService.addComment(
      req.params.id,
      req.user.id,
      req.body?.message,
      req.body?.parentId,
    );
    if (!result) return res.status(404).json({ error: 'Leave request not found' });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}
