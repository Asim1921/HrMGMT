import * as leaveBalanceService from '../services/leaveBalanceService.js';

export async function my(req, res, next) {
  try {
    const result = await leaveBalanceService.getMy(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function byUserId(req, res, next) {
  try {
    const result = await leaveBalanceService.getByUserId(req.params.userId, req.user);
    if (!result) return res.status(404).json({ error: 'Leave balance not found' });
    res.json(result);
  } catch (e) {
    next(e);
  }
}
