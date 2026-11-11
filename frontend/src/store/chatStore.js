import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: {},
  unreadCounts: {},
  totalUnread: 0,

  setConversations: (conversations) => {
    const counts = {};
    for (const c of conversations) {
      if (c.lastMessage && c.lastReadAt) {
        const lastMsgTime = new Date(c.lastMessage.createdAt).getTime();
        const lastReadTime = new Date(c.lastReadAt).getTime();
        if (lastMsgTime > lastReadTime && c.lastMessage.senderId !== get()._currentUserId) {
          counts[c.id] = (counts[c.id] || 0) + 1;
        }
      } else if (c.lastMessage && !c.lastReadAt) {
        counts[c.id] = 1;
      }
    }
    set({ conversations, unreadCounts: counts });
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((s) => ({ messages: { ...s.messages, [conversationId]: messages } })),

  appendMessage: (conversationId, message) =>
    set((s) => {
      const existing = s.messages[conversationId] || [];
      if (existing.find((m) => m.id === message.id)) return {};
      return { messages: { ...s.messages, [conversationId]: [...existing, message] } };
    }),

  replaceMessage: (conversationId, tempId, realMessage) =>
    set((s) => {
      const existing = s.messages[conversationId] || [];
      const idx = existing.findIndex((m) => m.id === tempId);
      if (idx >= 0) {
        const updated = [...existing];
        updated[idx] = realMessage;
        return { messages: { ...s.messages, [conversationId]: updated } };
      }
      if (existing.find((m) => m.id === realMessage.id)) return {};
      return { messages: { ...s.messages, [conversationId]: [...existing, realMessage] } };
    }),

  removeMessage: (conversationId, messageId) =>
    set((s) => {
      const existing = s.messages[conversationId] || [];
      return {
        messages: {
          ...s.messages,
          [conversationId]: existing.filter((m) => m.id !== messageId),
        },
      };
    }),

  updateMessageStatus: (data) =>
    set((s) => {
      const updated = { ...s.messages };
      if (data.messageId) {
        for (const cid in updated) {
          updated[cid] = updated[cid]?.map((m) =>
            m.id === data.messageId ? { ...m, status: data.status, deliveredAt: data.deliveredAt, seenAt: data.seenAt } : m
          );
        }
      }
      if (data.messageIds && data.conversationId) {
        const cid = data.conversationId;
        if (updated[cid]) {
          const idSet = new Set(data.messageIds);
          updated[cid] = updated[cid].map((m) =>
            idSet.has(m.id) ? { ...m, status: data.status, seenAt: data.seenAt } : m
          );
        }
      }
      return { messages: updated };
    }),

  setTyping: (conversationId, userId, typing, userInfo) =>
    set((s) => {
      const convTyping = { ...(s.typingUsers[conversationId] || {}) };
      if (typing) {
        convTyping[userId] = userInfo || true;
      } else {
        delete convTyping[userId];
      }
      return { typingUsers: { ...s.typingUsers, [conversationId]: convTyping } };
    }),

  updatePresence: (userId, isOnline, lastSeen) =>
    set((s) => ({
      onlineUsers: { ...s.onlineUsers, [userId]: { isOnline, lastSeen } },
      conversations: s.conversations.map((c) =>
        c.otherUser?.id === userId ? { ...c, otherUser: { ...c.otherUser, isOnline, lastSeen } } : c
      ),
    })),

  incrementUnread: (conversationId) =>
    set((s) => {
      if (conversationId === s.activeConversationId) return {};
      const counts = { ...s.unreadCounts };
      counts[conversationId] = (counts[conversationId] || 0) + 1;
      return { unreadCounts: counts };
    }),

  clearUnread: (conversationId) =>
    set((s) => {
      const counts = { ...s.unreadCounts };
      delete counts[conversationId];
      return { unreadCounts: counts };
    }),

  setTotalUnread: (count) => set({ totalUnread: count }),

  updateConversationOrder: (conversationId, lastMessage) =>
    set((s) => {
      const convs = [...s.conversations];
      const idx = convs.findIndex((c) => c.id === conversationId);
      if (idx >= 0) {
        convs[idx] = { ...convs[idx], lastMessage, updatedAt: new Date().toISOString() };
        convs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return { conversations: convs };
      }
      return {};
    }),

  upsertConversation: (conversation) =>
    set((s) => {
      const convs = [...s.conversations];
      const idx = convs.findIndex((c) => c.id === conversation.id);
      if (idx >= 0) {
        convs[idx] = { ...convs[idx], ...conversation };
      } else {
        convs.unshift(conversation);
      }
      convs.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      return { conversations: convs };
    }),

  _currentUserId: null,
  setCurrentUserId: (id) => set({ _currentUserId: id }),
}));
