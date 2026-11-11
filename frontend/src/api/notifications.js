import { api } from './client';

export async function listNotifications({ unreadOnly, page, limit } = {}) {
  const params = {};
  if (unreadOnly != null) params.unreadOnly = unreadOnly;
  if (page != null) params.page = page;
  if (limit != null) params.limit = limit;
  const { data } = await api.get('/notifications', { params });
  return data;
}

export async function getUnreadCount() {
  const { data } = await api.get('/notifications/unread-count');
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.put('/notifications/read-all');
  return data;
}
