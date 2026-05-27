import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

// AES-256-GCM encryption for secrets at rest (social_connections.access_token, etc.).
// The 32-byte key lives in env (SOVEREIGN_VAULT_KEY, base64). Payload format:
//   base64(iv).base64(authTag).base64(ciphertext)

export function generateVaultKey(): string {
  return randomBytes(32).toString('base64');
}

function loadKey(keyB64: string): Buffer {
  const key = Buffer.from(keyB64, 'base64');
  if (key.length !== 32) throw new Error('SOVEREIGN_VAULT_KEY must be 32 bytes (base64).');
  return key;
}

export function encryptSecret(plaintext: string, keyB64: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', loadKey(keyB64), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), enc.toString('base64')].join('.');
}

export function decryptSecret(payload: string, keyB64: string): string {
  const [ivB, tagB, dataB] = payload.split('.');
  if (!ivB || !tagB || !dataB) throw new Error('malformed vault payload');
  const decipher = createDecipheriv('aes-256-gcm', loadKey(keyB64), Buffer.from(ivB, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB, 'base64')), decipher.final()]).toString('utf8');
}
