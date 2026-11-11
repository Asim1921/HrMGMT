import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import * as documentController from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads', 'documents')),
  filename: (req, file, cb) => cb(null, `${req.user.id}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`),
});
const ALLOWED_EXT = /\.(pdf|png|jpg|jpeg|gif|doc|docx|xls|xlsx|csv|ppt|pptx|txt|rtf|odt|ods|odp)$/i;
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ALLOWED_EXT.test(file.originalname);
    cb(ok ? null : new Error('Unsupported file type. Allowed: PDF, images, Word, Excel, CSV, PowerPoint, and text files.'), ok);
  },
});

export const documentRoutes = Router();

documentRoutes.use(authenticate);

documentRoutes.post('/upload', upload.single('file'), documentController.upload);
documentRoutes.get('/my', documentController.listMy);
documentRoutes.get('/', requireRole('admin', 'super_admin'), documentController.listAll);
documentRoutes.delete('/:id', documentController.remove);
