import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000;

/**
 * Get the encryption key from environment variable
 * The key should be a 32-byte (256-bit) value, base64 encoded
 */
function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('API_KEY_ENCRYPTION_KEY environment variable is not set');
  }

  // Try to decode as base64 first
  try {
    const decoded = Buffer.from(key, 'base64');
    if (decoded.length === KEY_LENGTH) {
      return decoded;
    }
  } catch {
    // Not base64, continue
  }

  // Try hex encoding
  try {
    if (key.length === KEY_LENGTH * 2) {
      return Buffer.from(key, 'hex');
    }
  } catch {
    // Not hex, continue
  }

  // Use the key directly if it's exactly 32 bytes
  const keyBuffer = Buffer.from(key, 'utf8');
  if (keyBuffer.length === KEY_LENGTH) {
    return keyBuffer;
  }

  // Derive key using PBKDF2 if the key is not exactly 32 bytes
  const salt = crypto.randomBytes(SALT_LENGTH);
  return crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt an API key before storing in database
 */
export function encryptApiKey(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty API key');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV, auth tag, and encrypted data
  // Format: iv:authTag:encryptedData (all hex encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an API key retrieved from database
 */
export function decryptApiKey(encrypted: string): string {
  if (!encrypted) {
    return encrypted;
  }

  // Check if the value is already encrypted (has the format)
  // If it doesn't contain colons, assume it's plaintext (backward compatibility)
  if (!encrypted.includes(':')) {
    return encrypted;
  }

  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    // Invalid format, return as-is (might be plaintext)
    return encrypted;
  }

  try {
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = parts[2];

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    // If decryption fails, return empty string to prevent using invalid key
    throw new Error('Failed to decrypt API key. The encryption key may have changed.');
  }
}

/**
 * Check if a string is encrypted (has the encryption format)
 */
export function isEncrypted(value: string): boolean {
  return value.includes(':') && value.split(':').length === 3;
}

