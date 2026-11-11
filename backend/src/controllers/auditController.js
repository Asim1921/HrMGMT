import * as auditService from '../services/auditService.js';

export async function list(req, res, next) {
  try {
    const result = await auditService.list({
      actorId: req.query.actorId,
      entity: req.query.entity,
      action: req.query.action,
      start: req.query.start,
      end: req.query.end,
      page: +req.query.page || 1,
      limit: +req.query.limit || 50,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
}
