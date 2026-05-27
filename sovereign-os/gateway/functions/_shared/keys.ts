// Deno (Web Crypto) mirror of @sovereign/api-platform/keys.
// Canonical typed source: packages/api-platform/src/keys.ts. Keep in sync.

export type KeyEnv = 'live' | 'test';

export interface IssuedKey {
  key: string;
  prefix: string;
  last4: string;
  hash: string;
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function generateApiKey(env: KeyEnv = 'live'): Promise<IssuedKey> {
  const raw = new Uint8Array(24);
  crypto.getRandomValues(raw);
  const secret = toBase64Url(raw);
  const key = `sov_${env}_${secret}`;
  return { key, prefix: `sov_${env}_${secret.slice(0, 8)}`, last4: secret.slice(-4), hash: await sha256Hex(key) };
}

/** Constant-time-ish comparison of a presented key against a stored hash. */
export async function verifyKey(presented: string, storedHash: string): Promise<boolean> {
  const h = await sha256Hex(presented);
  if (h.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < h.length; i++) diff |= h.charCodeAt(i) ^ storedHash.charCodeAt(i);
  return diff === 0;
}
