import { api } from './client';

export async function listHolidays(year) {
  const params = year != null ? { year } : {};
  const { data } = await api.get('/holidays', { params });
  return data;
}

export async function createHoliday(body) {
  const { data } = await api.post('/holidays', body);
  return data;
}

export async function deleteHoliday(id) {
  const { data } = await api.delete(`/holidays/${id}`);
  return data;
}
