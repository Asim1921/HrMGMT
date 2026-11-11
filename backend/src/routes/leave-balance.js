import { Router } from 'express';
import * as leaveBalanceController from '../controllers/leaveBalanceController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

export const leaveBalanceRoutes = Router();

leaveBalanceRoutes.get('/my', authenticate, leaveBalanceController.my);
leaveBalanceRoutes.get('/:userId', authenticate, requireRole('admin', 'super_admin'), leaveBalanceController.byUserId);
