import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.CHAT_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');

export function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return {
    content: `${encrypted}:${authTag}`,
    contentIv: iv.toString('base64'),
  };
}

export function decrypt(content, contentIv) {
  const [encrypted, authTag] = content.split(':');
  const iv = Buffer.from(contentIv, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
