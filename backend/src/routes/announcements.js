import { Router } from 'express';
import * as announcementController from '../controllers/announcementController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

export const announcementRoutes = Router();

announcementRoutes.use(authenticate);

announcementRoutes.get('/', announcementController.list);
announcementRoutes.get('/:id', announcementController.getById);
announcementRoutes.post('/', requireRole('admin', 'super_admin'), announcementController.create);
announcementRoutes.put('/:id', requireRole('admin', 'super_admin'), announcementController.update);
announcementRoutes.delete('/:id', requireRole('admin', 'super_admin'), announcementController.remove);
