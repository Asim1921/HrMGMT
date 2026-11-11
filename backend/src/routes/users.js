import { Router } from 'express';
import * as usersController from '../controllers/usersController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.use(requireRole('super_admin', 'admin'));

userRoutes.get('/', usersController.list);
userRoutes.post('/', usersController.create);
userRoutes.get('/:id', usersController.getById);
userRoutes.put('/:id', usersController.update);
userRoutes.delete('/:id', usersController.remove);
