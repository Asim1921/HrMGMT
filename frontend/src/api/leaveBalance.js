import { api } from './client';

/** Get own leave balance for current year. */
export async function getMyLeaveBalance() {
  const { data } = await api.get('/leave-balance/my');
  return data;
}
