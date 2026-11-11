import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get('/', notificationController.list);
notificationRoutes.get('/unread-count', notificationController.unreadCount);
notificationRoutes.put('/:id/read', notificationController.markRead);
notificationRoutes.put('/read-all', notificationController.markAllRead);
