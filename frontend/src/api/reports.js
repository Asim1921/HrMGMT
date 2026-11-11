import { api } from './client';

export async function getAttendanceReport({ start, end } = {}) {
  const params = {};
  if (start) params.start = start;
  if (end) params.end = end;
  const { data } = await api.get('/reports/attendance', { params });
  return data;
}

export async function getLeavesReport({ start, end } = {}) {
  const params = {};
  if (start) params.start = start;
  if (end) params.end = end;
  const { data } = await api.get('/reports/leaves', { params });
  return data;
}
