import { Router } from 'express';
import * as leavesController from '../controllers/leavesController.js';
import { authenticate } from '../middleware/auth.js';

export const leaveRoutes = Router();

leaveRoutes.use(authenticate);

leaveRoutes.post('/apply', leavesController.apply);
leaveRoutes.get('/my', leavesController.my);
leaveRoutes.get('/pending', leavesController.pending);
leaveRoutes.put('/:id/approve', leavesController.approve);
leaveRoutes.put('/:id/reject', leavesController.reject);
leaveRoutes.put('/:id/cancel', leavesController.cancel);
leaveRoutes.get('/:id/comments', leavesController.listComments);
leaveRoutes.post('/:id/comments', leavesController.addComment);
