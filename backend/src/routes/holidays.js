import { Router } from 'express';
import * as holidayController from '../controllers/holidayController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

export const holidayRoutes = Router();

holidayRoutes.use(authenticate);

holidayRoutes.get('/', holidayController.list);
holidayRoutes.post('/', requireRole('super_admin'), holidayController.create);
holidayRoutes.delete('/:id', requireRole('super_admin'), holidayController.remove);
