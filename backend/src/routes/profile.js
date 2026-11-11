import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import * as profileController from '../controllers/profileController.js';
import { authenticate } from '../middleware/auth.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/avatars'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.id}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(Object.assign(new Error('Only .jpg, .jpeg, .png, .webp files are allowed'), { statusCode: 400 }));
  },
});

export const profileRoutes = Router();

profileRoutes.get('/me', authenticate, profileController.getProfile);
profileRoutes.put('/me', authenticate, profileController.updateProfile);
profileRoutes.post('/me/picture', authenticate, upload.single('picture'), profileController.uploadPicture);
