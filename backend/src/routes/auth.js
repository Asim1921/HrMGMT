import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/login', authController.login);
authRoutes.post('/signup', authController.signup);
authRoutes.post('/refresh-token', authController.refreshToken);
authRoutes.post('/forgot-password', authController.forgotPassword);
authRoutes.post('/reset-password', authController.resetPassword);
authRoutes.post('/change-password/send-otp', authenticate, authController.sendChangePasswordOtp);
authRoutes.post('/change-password/confirm', authenticate, authController.changePassword);
authRoutes.post('/logout', authenticate, authController.logout);
