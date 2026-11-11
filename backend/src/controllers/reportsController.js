import * as reportsService from '../services/reportsService.js';

export async function attendanceReport(req, res, next) {
  try {
    const result = await reportsService.attendance(req.query, req.user);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function leavesReport(req, res, next) {
  try {
    const result = await reportsService.leaves(req.query, req.user);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
