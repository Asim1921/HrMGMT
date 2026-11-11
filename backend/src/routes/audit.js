import { Router } from 'express';
import * as auditController from '../controllers/auditController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

export const auditRoutes = Router();

auditRoutes.use(authenticate);
auditRoutes.use(requireRole('super_admin'));

auditRoutes.get('/', auditController.list);
