import { api } from './client';

// call this to list all audit logs
export async function listAuditLogs(params = {}) {
  const { data } = await api.get('/audit', { params });
  return data;
}
