import { api } from './client';

// call this to get all conversations
export async function getConversations() {
  const { data } = await api.get('/chat/conversations');
  return data;
}

// call this to get the number of unread messages
export async function getChatUnreadCount() {
  const { data } = await api.get('/chat/unread');
  return data;
}

// call this to create a new conversation
export async function createConversation(userId) {
  const { data } = await api.post('/chat/conversations', { userId });
  return data;
}

// call this to get the messages of a specific conversation
export async function getMessages(conversationId, cursor, limit = 30) {
  const params = { limit };
  if (cursor) params.cursor = cursor;
  const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, { params });
  return data;
}

// call this to upload a new attachment to a specific conversation
export async function uploadChatAttachment(conversationId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/chat/conversations/${conversationId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// call this to search for users by name or email
export async function searchChatUsers(search) {
  const { data } = await api.get('/chat/users', { params: { search } });
  return data;
}
