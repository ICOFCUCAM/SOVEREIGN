// Deno (Web Crypto) mirror of @sovereign/api-platform/vault — AES-256-GCM.
// Canonical typed source: packages/api-platform/src/vault.ts. Keep in sync.
// WIRE-COMPATIBLE with the Node format: base64(iv).base64(tag).base64(ciphertext)
// (Web Crypto returns ciphertext||tag, so we split/rejoin the trailing 16-byte tag.)

const TAG_BYTES = 16;

function b64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}
function unb64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function importKey(keyB64: string): Promise<CryptoKey> {
  const raw = unb64(keyB64);
  if (raw.length !== 32) throw new Error('SOVEREIGN_VAULT_KEY must be 32 bytes (base64).');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(plaintext: string, keyB64: string): Promise<string> {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const full = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)));
  const ciphertext = full.slice(0, full.length - TAG_BYTES);
  const tag = full.slice(full.length - TAG_BYTES);
  return `${b64(iv)}.${b64(tag)}.${b64(ciphertext)}`;
}

export async function decryptSecret(payload: string, keyB64: string): Promise<string> {
  const key = await importKey(keyB64);
  const [ivB, tagB, ctB] = payload.split('.');
  if (!ivB || !tagB || !ctB) throw new Error('malformed vault payload');
  const ciphertext = unb64(ctB);
  const tag = unb64(tagB);
  const full = new Uint8Array(ciphertext.length + tag.length);
  full.set(ciphertext);
  full.set(tag, ciphertext.length);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(ivB) }, key, full);
  return new TextDecoder().decode(pt);
}
