import { api } from './client';

/** Get own leave requests with optional status filter and pagination. */
export async function getMyLeaves({ status, page = 1, limit = 10 } = {}) {
  const { data } = await api.get('/leaves/my', { params: { status, page, limit } });
  return data;
}

/** Get pending leave requests at current user's approval level (G-2 / G-1 / Comdt). */
export async function getPendingLeaves() {
  const { data } = await api.get('/leaves/pending');
  return data;
}

/** Apply for leave. body: { leaveType, startDate, endDate, reason? } */
export async function applyLeave(body) {
  const { data } = await api.post('/leaves/apply', body);
  return data;
}

/** Cancel own pending leave request. */
export async function cancelLeave(id) {
  const { data } = await api.put(`/leaves/${id}/cancel`);
  return data;
}

/** Approve leave (at current level: G-2, G-1, or Comdt). */
export async function approveLeave(id, reviewComment) {
  const { data } = await api.put(`/leaves/${id}/approve`, { reviewComment: reviewComment || undefined });
  return data;
}

/** Reject leave. */
export async function rejectLeave(id, reviewComment) {
  const { data } = await api.put(`/leaves/${id}/reject`, { reviewComment: reviewComment || undefined });
  return data;
}

/** Get threaded comments on a leave request. */
export async function getLeaveComments(leaveRequestId) {
  const { data } = await api.get(`/leaves/${leaveRequestId}/comments`);
  return data;
}

/** Add a comment or reply on a leave request. */
export async function addLeaveComment(leaveRequestId, message, parentId) {
  const { data } = await api.post(`/leaves/${leaveRequestId}/comments`, { message, parentId: parentId || undefined });
  return data;
}
