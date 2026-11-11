import { api } from './client';

export async function uploadDocument(formData) {
  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function listMyDocuments() {
  const { data } = await api.get('/documents/my');
  return data;
}

export async function listAllDocuments(params = {}) {
  const { data } = await api.get('/documents', { params });
  return data;
}

export async function deleteDocument(id) {
  const { data } = await api.delete(`/documents/${id}`);
  return data;
}
