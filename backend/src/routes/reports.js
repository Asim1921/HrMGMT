import { Router } from 'express';
import * as reportsController from '../controllers/reportsController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

export const reportRoutes = Router();

reportRoutes.use(authenticate);
reportRoutes.use(requireRole('admin', 'super_admin'));

reportRoutes.get('/attendance', reportsController.attendanceReport);
reportRoutes.get('/leaves', reportsController.leavesReport);
