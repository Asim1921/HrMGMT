import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.js';
import { chatController } from '../controllers/chatController.js';

const uploadDir = path.join(process.cwd(), 'uploads', 'chat');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${crypto.randomBytes(12).toString('hex')}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const chatRoutes = Router();

chatRoutes.use(authenticate);

chatRoutes.get('/conversations', chatController.getConversations);
chatRoutes.get('/unread', chatController.getUnreadTotal);
chatRoutes.post('/conversations', chatController.createConversation);
chatRoutes.get('/conversations/:id/messages', chatController.getMessages);
chatRoutes.post('/conversations/:id/attachments', upload.single('file'), chatController.uploadAttachment);
chatRoutes.get('/users', chatController.searchUsers);
