import { api } from './client';

/**
 * Mark yourself present for today. Allowed once per day, within configured window (e.g. 08:00–10:00).
 */
export async function markAttendance(payload = {}) {
  const { data } = await api.post('/attendance/mark', payload);
  return data;
}

/**
 * Get today's attendance record for the current user (null if not yet marked).
 */
export async function getTodayAttendance() {
  const { data } = await api.get('/attendance/today');
  return data;
}

/**
 * Get own attendance records. start/end as YYYY-MM-DD.
 */
export async function getMyAttendance({ start, end } = {}) {
  const params = {};
  if (start) params.start = start;
  if (end) params.end = end;
  const { data } = await api.get('/attendance/my', { params });
  return data;
}

/**
 * Get team attendance records (admin/super_admin). start/end as YYYY-MM-DD.
 */
export async function getTeamAttendance({ unit, start, end } = {}) {
  const params = {};
  if (unit) params.unit = unit;
  if (start) params.start = start;
  if (end) params.end = end;
  const { data } = await api.get('/attendance/team', { params });
  return data;
}
