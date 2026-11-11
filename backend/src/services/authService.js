import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendOtpEmail } from '../utils/email.js';

const SALT_ROUNDS = 10;
const OTP_VALID_MINUTES = 5;
const ALLOWED_SIGNUP_DESIGNATIONS = ['INTERNEE', 'WCF', 'OFFICER'];

export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  if (user.status !== 'active') throw Object.assign(new Error('Account is not active'), { statusCode: 403 });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName, employeeId: user.employeeId, designation: user.designation, approvalLevel: user.approvalLevel, profilePicture: user.profilePicture },
  };
}

export async function refresh(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true, status: true, fullName: true, employeeId: true, designation: true, approvalLevel: true, profilePicture: true },
  });
  if (!user || user.status !== 'active') throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  return { accessToken, expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m', user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName, employeeId: user.employeeId, designation: user.designation, approvalLevel: user.approvalLevel, profilePicture: user.profilePicture } };
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

const VALID_UNITS = ['804 Grp', '803 Grp', '802 Grp'];

/** Signup: only Internee, WCF, Offr. Role = user, no approvalLevel. */
export async function signup(body) {
  const { email, password, fullName, designation, employeeId, rank, unit } = body;
  if (!email || !password || !fullName || !designation) {
    throw Object.assign(new Error('Email, password, full name and designation are required'), { statusCode: 400 });
  }
  const des = String(designation).toUpperCase().replace(/\s+/g, '');
  const normalizedDes = des === 'OFFR' ? 'OFFICER' : des;
  if (!ALLOWED_SIGNUP_DESIGNATIONS.includes(normalizedDes)) {
    throw Object.assign(new Error('Designation must be Internee, WCF, or Offr'), { statusCode: 400 });
  }

  let resolvedRank = rank?.trim() || null;
  let resolvedUnit = unit?.trim() || null;

  if (normalizedDes === 'WCF') {
    resolvedRank = 'WCF';
    if (!resolvedUnit || !VALID_UNITS.includes(resolvedUnit)) {
      throw Object.assign(new Error('Unit is required for WCF (804 Grp, 803 Grp, or 802 Grp)'), { statusCode: 400 });
    }
  }
  if (normalizedDes === 'OFFICER') {
    if (!resolvedRank) throw Object.assign(new Error('Rank is required for Officer'), { statusCode: 400 });
    if (!resolvedUnit || !VALID_UNITS.includes(resolvedUnit)) {
      throw Object.assign(new Error('Unit is required for Officer (804 Grp, 803 Grp, or 802 Grp)'), { statusCode: 400 });
    }
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw Object.assign(new Error('An account with this email already exists'), { statusCode: 409 });
  if (employeeId && employeeId.trim()) {
    const existingId = await prisma.user.findUnique({ where: { employeeId: employeeId.trim() } });
    if (existingId) throw Object.assign(new Error('Employee ID already in use'), { statusCode: 409 });
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      fullName: fullName.trim(),
      employeeId: employeeId?.trim() || null,
      role: 'user',
      designation: normalizedDes,
      rank: resolvedRank,
      unit: resolvedUnit,
      status: 'active',
    },
  });
  return {
    user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName, employeeId: user.employeeId, designation: user.designation },
    message: 'Account created. You can now sign in.',
  };
}

/** Forgot password: send 6-digit OTP to email, valid 5 minutes. */
export async function forgotPassword(email) {
  const normalizedEmail = email?.trim()?.toLowerCase();
  if (!normalizedEmail) throw Object.assign(new Error('Email is required'), { statusCode: 400 });
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return { message: 'If an account exists with this email, you will receive an OTP shortly.' };
  }
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);
  await prisma.passwordResetOtp.deleteMany({ where: { email: normalizedEmail } });
  await prisma.passwordResetOtp.create({ data: { email: normalizedEmail, otp, expiresAt } });
  await sendOtpEmail(normalizedEmail, otp, 'forgot');
  return { message: 'If an account exists with this email, you will receive an OTP shortly.' };
}

/** Change password (logged-in user): send OTP to their email. */
export async function sendChangePasswordOtp(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);
  await prisma.passwordResetOtp.deleteMany({ where: { email: user.email } });
  await prisma.passwordResetOtp.create({ data: { email: user.email, otp, expiresAt } });
  await sendOtpEmail(user.email, otp, 'change');
  return { message: 'A verification code has been sent to your registered email.', email: user.email };
}

/** Change password (logged-in user): verify OTP and set new password. */
export async function changePassword(userId, otp, newPassword) {
  if (!otp || !newPassword) throw Object.assign(new Error('OTP and new password are required'), { statusCode: 400 });
  if (String(newPassword).length < 6) throw Object.assign(new Error('Password must be at least 6 characters'), { statusCode: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  const record = await prisma.passwordResetOtp.findFirst({
    where: { email: user.email, otp: String(otp).trim() },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 });
  if (new Date() > record.expiresAt) {
    await prisma.passwordResetOtp.deleteMany({ where: { email: user.email } });
    throw Object.assign(new Error('OTP has expired. Please request a new one.'), { statusCode: 400 });
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetOtp.deleteMany({ where: { email: user.email } }),
  ]);
  return { message: 'Password has been changed successfully.' };
}

/** Reset password: verify OTP and set new password. */
export async function resetPassword(email, otp, newPassword) {
  const normalizedEmail = email?.trim()?.toLowerCase();
  if (!normalizedEmail || !otp || !newPassword) {
    throw Object.assign(new Error('Email, OTP and new password are required'), { statusCode: 400 });
  }
  if (String(newPassword).length < 6) {
    throw Object.assign(new Error('Password must be at least 6 characters'), { statusCode: 400 });
  }
  const record = await prisma.passwordResetOtp.findFirst({
    where: { email: normalizedEmail, otp: String(otp).trim() },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 });
  if (new Date() > record.expiresAt) {
    await prisma.passwordResetOtp.deleteMany({ where: { email: normalizedEmail } });
    throw Object.assign(new Error('OTP has expired. Please request a new one.'), { statusCode: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 });
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetOtp.deleteMany({ where: { email: normalizedEmail } }),
  ]);
  return { message: 'Password has been reset. You can now sign in.' };
}
