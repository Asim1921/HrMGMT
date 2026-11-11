import { api } from './client';

// call this to list all announcements
export async function listAnnouncements({ unit, page, limit } = {}) {
  const params = {};
  if (unit != null) params.unit = unit;
  if (page != null) params.page = page;
  if (limit != null) params.limit = limit;
  const { data } = await api.get('/announcements', { params });
  return data;
}

// call this to get a specific announcement by its ID
export async function getAnnouncement(id) {
  const { data } = await api.get(`/announcements/${id}`);
  return data;
}

// call this to create a new announcement
export async function createAnnouncement(body) {
  const { data } = await api.post('/announcements', body);
  return data;
}

// call this to update an existing announcement
export async function updateAnnouncement(id, body) {
  const { data } = await api.put(`/announcements/${id}`, body);
  return data;
}

// call this to delete an existing announcement
export async function deleteAnnouncement(id) {
  const { data } = await api.delete(`/announcements/${id}`);
  return data;
}
