import * as profileService from '../services/profileService.js';

export async function getProfile(req, res, next) {
  try {
    const user = await profileService.getProfile(req.user.id);
    res.json(user);
  } catch (e) {
    next(e);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await profileService.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (e) {
    next(e);
  }
}

export async function uploadPicture(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const relativePath = `/uploads/avatars/${req.file.filename}`;
    const user = await profileService.updateProfilePicture(req.user.id, relativePath);
    res.json(user);
  } catch (e) {
    next(e);
  }
}
