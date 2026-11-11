import { api } from './client';

export async function listMyTasks() {
  const { data } = await api.get('/tasks/my');
  return data;
}

export async function listAllTasks(params = {}) {
  const { data } = await api.get('/tasks', { params });
  return data;
}

export async function getTask(id) {
  const { data } = await api.get(`/tasks/${id}`);
  return data;
}

export async function createTask(body) {
  const { data } = await api.post('/tasks', body);
  return data;
}

export async function updateTask(id, body) {
  const { data } = await api.put(`/tasks/${id}`, body);
  return data;
}

export async function completeTask(id) {
  const { data } = await api.put(`/tasks/${id}/complete`);
  return data;
}

export async function taskReviewAction(id, action) {
  const { data } = await api.put(`/tasks/${id}/review-action`, { action });
  return data;
}

export async function listTaskComments(id) {
  const { data } = await api.get(`/tasks/${id}/comments`);
  return data;
}

export async function addTaskComment(id, { message, file } = {}) {
  const formData = new FormData();
  if (message?.trim()) formData.append('message', message.trim());
  if (file) formData.append('file', file);
  const { data } = await api.post(`/tasks/${id}/comments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
