import { api } from './client';

export async function listUsers({ role, unit, status, page = 1, limit = 50 } = {}) {
  const params = { page, limit };
  if (role) params.role = role;
  if (unit) params.unit = unit;
  if (status) params.status = status;
  const { data } = await api.get('/users', { params });
  return data;
}

export async function getUser(id) {
  const { data } = await api.get(`/users/${id}`);
  return data;
}

export async function updateUser(id, fields) {
  const { data } = await api.put(`/users/${id}`, fields);
  return data;
}

export async function deleteUser(id) {
  await api.delete(`/users/${id}`);
}
