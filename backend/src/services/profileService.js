import { prisma } from '../utils/prisma.js';

const PROFILE_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  rank: true,
  unit: true,
  employeeId: true,
  designation: true,
  status: true,
  profilePicture: true,
  createdAt: true,
  updatedAt: true,
};

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
}

export async function updateProfile(userId, data) {
  const allowed = {};
  if (data.fullName !== undefined) allowed.fullName = data.fullName.trim();
  if (data.rank !== undefined) allowed.rank = data.rank.trim() || null;
  if (data.unit !== undefined) allowed.unit = data.unit.trim() || null;

  if (Object.keys(allowed).length === 0) {
    throw Object.assign(new Error('No valid fields to update'), { statusCode: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: allowed,
    select: PROFILE_SELECT,
  });
  return user;
}

export async function updateProfilePicture(userId, relativePath) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { profilePicture: relativePath },
    select: PROFILE_SELECT,
  });
  return user;
}
