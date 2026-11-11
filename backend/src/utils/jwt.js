import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';


export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}
/**
 * Sign the refresh token
 * @param {object} payload - The payload to sign
 * @returns {string} - The signed refresh token
 */
export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}
/**
 * Verify the access token
 * @param {string} token - The access token to verify
 * @returns {object} - The decoded payload
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}
/**
 * Verify the refresh token
 * @param {string} token - The refresh token to verify
 * @returns {object} - The decoded payload
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
