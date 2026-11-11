import { chatService } from '../services/chatService.js';
import { getIO, getOnlineUsers } from '../socket/index.js';
import { joinAllParticipants, joinUserConversationRoom } from '../socket/rooms.js';

export const chatController = {
  async getConversations(req, res, next) {
    try {
      const conversations = await chatService.getConversations(req.user.id);
      res.json(conversations);
    } catch (e) { next(e); }
  },

  async getUnreadTotal(req, res, next) {
    try {
      const total = await chatService.getUnreadTotal(req.user.id);
      res.json({ count: total });
    } catch (e) { next(e); }
  },

  async createConversation(req, res, next) {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId is required' });
      const conversation = await chatService.getOrCreateConversation(req.user.id, userId);

      const io = getIO();
      if (io) {
        const onlineUsers = getOnlineUsers();
        joinUserConversationRoom(io, req.user.id, conversation.id, onlineUsers);
        joinUserConversationRoom(io, userId, conversation.id, onlineUsers);
      }

      res.json(conversation);
    } catch (e) { next(e); }
  },

  async getMessages(req, res, next) {
    try {
      const { id } = req.params;
      const { cursor, limit } = req.query;
      const result = await chatService.getMessages(id, req.user.id, cursor, parseInt(limit) || 30);
      res.json(result);
    } catch (e) { next(e); }
  },

  async uploadAttachment(req, res, next) {
    try {
      const { id } = req.params;
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const message = await chatService.createMessageWithAttachment(id, req.user.id, req.file);

      const io = getIO();
      if (io) {
        const onlineUsers = getOnlineUsers();
        await joinAllParticipants(io, id, onlineUsers);
        io.to(`conv:${id}`).emit('new_message', message);
      }

      res.json(message);
    } catch (e) { next(e); }
  },

  async searchUsers(req, res, next) {
    try {
      const { search } = req.query;
      const users = await chatService.searchUsers(search, req.user.id);
      res.json(users);
    } catch (e) { next(e); }
  },
};
