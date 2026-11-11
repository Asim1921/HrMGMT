import * as attendanceService from '../services/attendanceService.js';
import * as auditService from '../services/auditService.js';

export async function mark(req, res, next) {
  try {
    const result = await attendanceService.mark(req.user.id, req.body?.ipAddress, req.body?.latitude, req.body?.longitude);
    if (!result.alreadyMarked) {
      auditService.log({ actorId: req.user.id, action: 'mark', entity: 'attendance', entityId: result.record?.id, details: { status: result.record?.status }, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    }
    res.status(result.alreadyMarked ? 200 : 201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function bulkMark(req, res, next) {
  try {
    const results = await attendanceService.bulkMark(req.body.entries || []);
    res.json({ results });
  } catch (e) {
    next(e);
  }
}

export async function today(req, res, next) {
  try {
    const record = await attendanceService.getToday(req.user.id);
    res.json({ record });
  } catch (e) {
    next(e);
  }
}

export async function my(req, res, next) {
  try {
    const { start, end } = req.query;
    const result = await attendanceService.getMy(req.user.id, start, end);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function team(req, res, next) {
  try {
    const { unit, start, end } = req.query;
    const result = await attendanceService.getTeam(req.user, unit, start, end);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
