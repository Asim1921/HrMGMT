import { Router } from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

export const attendanceRoutes = Router();

attendanceRoutes.post('/mark', authenticate, attendanceController.mark);
attendanceRoutes.get('/today', authenticate, attendanceController.today);
attendanceRoutes.get('/my', authenticate, attendanceController.my);
attendanceRoutes.get('/team', authenticate, requireRole('admin', 'super_admin'), attendanceController.team);
attendanceRoutes.post('/bulk-mark', authenticate, requireRole('admin', 'super_admin'), attendanceController.bulkMark);
