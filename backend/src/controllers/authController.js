import * as authService from '../services/authService.js';
import * as auditService from '../services/auditService.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const result = await authService.login(email, password);
    auditService.log({ actorId: result.user.id, action: 'login', entity: 'auth', details: { email }, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const token = req.body.refreshToken ?? req.body.refresh_token;
    if (!token) return res.status(400).json({ error: 'refreshToken required' });
    const result = await authService.refresh(token);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function logout(_req, res) {
  res.json({ message: 'Logged out' });
}

export async function signup(req, res, next) {
  try {
    const result = await authService.signup(req.body);
    auditService.log({ actorId: result.user?.id, action: 'signup', entity: 'auth', details: { email: req.body.email, designation: req.body.designation }, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword(email, otp, newPassword);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function sendChangePasswordOtp(req, res, next) {
  try {
    const result = await authService.sendChangePasswordOtp(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { otp, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, otp, newPassword);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
