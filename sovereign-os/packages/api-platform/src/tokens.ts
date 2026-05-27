import { createHmac, timingSafeEqual } from 'node:crypto';

// Stateless, HMAC-signed bearer tokens (compact JWT-style: payload.signature).
// Used for short-lived access tokens issued to a client/session without a DB lookup
// on every request. The signing secret lives in env (SOVEREIGN_TOKEN_SECRET).

export interface TokenPayload {
  sub: string; // client/user id
  scopes?: string[];
  /** Expiry epoch seconds. Set by issueToken. */
  exp?: number;
  [k: string]: unknown;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export function issueToken(payload: TokenPayload, secret: string, ttlSeconds = 3600): string {
  const body: TokenPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const data = b64url(JSON.stringify(body));
  return `${data}.${sign(data, secret)}`;
}

export function verifyToken(token: string, secret: string): TokenPayload | null {
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const data = token.slice(0, dot);
  const presented = token.slice(dot + 1);
  const expected = sign(data, secret);

  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as TokenPayload;
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
