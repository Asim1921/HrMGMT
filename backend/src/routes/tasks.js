import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma.js';
import * as taskController from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const uploadDir = path.join(process.cwd(), 'uploads', 'tasks');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_EXT = /\.(pdf|png|jpg|jpeg|gif|webp|doc|docx|xls|xlsx|ppt|pptx)$/i;
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${crypto.randomBytes(12).toString('hex')}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED_EXT.test(file.originalname);
    cb(ok ? null : new Error('Unsupported file type. Allowed: images, PDF, Word, Excel, and PowerPoint.'), ok);
  },
});

const requireTaskOwnerOrAdmin = async (req, res, next) => {
  if (['admin', 'super_admin'].includes(req.user.role)) return next();
  const task = await prisma.task.findUnique({ where: { id: req.params.id }, select: { assignedToId: true } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.assignedToId === req.user.id) return next();
  return res.status(403).json({ error: 'Insufficient permissions' });
};

const requireTaskParticipant = async (req, res, next) => {
  if (['admin', 'super_admin'].includes(req.user.role)) return next();
  const task = await prisma.task.findUnique({ where: { id: req.params.id }, select: { assignedToId: true, assignedById: true } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.assignedToId === req.user.id || task.assignedById === req.user.id) return next();
  return res.status(403).json({ error: 'Insufficient permissions' });
};

export const taskRoutes = Router();

taskRoutes.use(authenticate);

taskRoutes.get('/my', taskController.listMy);
taskRoutes.post('/', requireRole('admin', 'super_admin'), taskController.create);
taskRoutes.get('/', requireRole('admin', 'super_admin'), taskController.listAll);
taskRoutes.get('/:id', requireTaskParticipant, taskController.getById);
taskRoutes.put('/:id', requireTaskOwnerOrAdmin, taskController.update);
taskRoutes.put('/:id/complete', taskController.complete);
taskRoutes.put('/:id/review-action', requireTaskParticipant, taskController.reviewAction);
taskRoutes.get('/:id/comments', requireTaskParticipant, taskController.listComments);
taskRoutes.post('/:id/comments', requireTaskParticipant, upload.single('file'), taskController.addComment);
