import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

// API key issuance for platform users (developers/tenants). We never store the
// plaintext key — only its SHA-256 hash. The full key is shown to the user exactly
// once at creation, Stripe/GitHub style.

export type KeyEnv = 'live' | 'test';

export interface IssuedKey {
  /** Full secret — return to the user ONCE, never persist. */
  key: string;
  /** Public display prefix, safe to store/show (e.g. "sov_live_a1b2c3d4"). */
  prefix: string;
  /** Last 4 chars for UI ("…wxyz"). */
  last4: string;
  /** SHA-256 hex of the full key — this is what you persist. */
  hash: string;
}

const SECRET_BYTES = 24; // 32 base64url chars

export function generateApiKey(env: KeyEnv = 'live'): IssuedKey {
  const secret = randomBytes(SECRET_BYTES).toString('base64url');
  const key = `sov_${env}_${secret}`;
  return {
    key,
    prefix: `sov_${env}_${secret.slice(0, 8)}`,
    last4: secret.slice(-4),
    hash: hashKey(key),
  };
}

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/** Constant-time check of a presented key against a stored hash. */
export function verifyKey(presented: string, storedHash: string): boolean {
  const a = Buffer.from(hashKey(presented), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function parseKeyEnv(key: string): KeyEnv | null {
  if (key.startsWith('sov_live_')) return 'live';
  if (key.startsWith('sov_test_')) return 'test';
  return null;
}
