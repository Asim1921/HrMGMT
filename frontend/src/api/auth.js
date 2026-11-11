import { api } from './client';

// call this to login a user
export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

// call this to signup a new user
export async function signup(payload) {
  const { data } = await api.post('/auth/signup', payload);
  return data;
}

// call this to refresh the access token
export async function refreshToken(refreshToken) {
  const { data } = await api.post('/auth/refresh-token', { refreshToken });
  return data;
}

// call this to logout a user
export async function logout() {
  await api.post('/auth/logout');
}

// call this to send a forgot password email to a user
export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

// call this to reset the password of a user
export async function resetPassword(email, otp, newPassword) {
  const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
  return data;
}

// call this to send a change password email to a user
export async function sendChangePasswordOtp() {
  const { data } = await api.post('/auth/change-password/send-otp');
  return data;
}

// call this to change the password of a user
export async function changePassword(otp, newPassword) {
  const { data } = await api.post('/auth/change-password/confirm', { otp, newPassword });
  return data;
}
