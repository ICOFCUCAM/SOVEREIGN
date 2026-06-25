// Sovereign Dispatch — OIDC relying-party primitives (institutional SSO / item 2).
//
// An institution federates its own identity provider (Microsoft Entra / Azure AD,
// Okta, a national IdP). Dispatch is the RELYING PARTY: it redirects the person
// to their institution's IdP, then verifies the ID token the IdP returns and maps
// it to a dispatch.users person. Dispatch never sees or stores a password.
//
// Dependency-free by policy (a token verifier must not be a supply-chain risk):
// OIDC discovery + authorization-code build + code exchange + RS256/JWKS ID-token
// verification, all on node:crypto + global fetch. This is the security-critical
// surface — it is exercised end-to-end by test/sso-flow.test.mjs against a local
// mock IdP before it is allowed near a real provider.

import crypto from "node:crypto";

const fromB64url = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");
const jsonB64url = (s) => JSON.parse(fromB64url(s).toString("utf8"));

export class OidcError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const _discoCache = new Map();
const _jwksCache = new Map();

async function getJson(url) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new OidcError("FETCH_FAILED", `${url} → HTTP ${r.status}`);
  return r.json();
}

/** OIDC discovery — resolve a provider's endpoints from its issuer. Cached. */
export async function discover(issuer) {
  if (_discoCache.has(issuer)) return _discoCache.get(issuer);
  const url = issuer.replace(/\/$/, "") + "/.well-known/openid-configuration";
  const doc = await getJson(url);
  if (!doc.authorization_endpoint || !doc.token_endpoint || !doc.jwks_uri)
    throw new OidcError("BAD_DISCOVERY", "discovery document missing required endpoints");
  // Defend against discovery pointing somewhere else: the issuer must match.
  if (doc.issuer && doc.issuer.replace(/\/$/, "") !== issuer.replace(/\/$/, ""))
    throw new OidcError("ISSUER_MISMATCH", "discovery issuer does not match configured issuer");
  _discoCache.set(issuer, doc);
  return doc;
}

/** Build the IdP authorization-code redirect URL. */
export function buildAuthUrl({ authorization_endpoint, clientId, redirectUri, scope = "openid email profile", state, nonce, loginHint }) {
  const u = new URL(authorization_endpoint);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", scope);
  u.searchParams.set("state", state);
  u.searchParams.set("nonce", nonce);
  if (loginHint) u.searchParams.set("login_hint", loginHint);
  return u.toString();
}

/** Exchange an authorization code for tokens at the IdP token endpoint. */
export async function exchangeCode({ token_endpoint, code, clientId, clientSecret, redirectUri }) {
  const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: clientId });
  if (clientSecret) body.set("client_secret", clientSecret);
  const r = await fetch(token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: body.toString(),
  });
  const tok = await r.json().catch(() => ({}));
  if (!r.ok || !tok.id_token) throw new OidcError("CODE_EXCHANGE_FAILED", tok.error_description || tok.error || `token endpoint HTTP ${r.status}`);
  return tok; // { id_token, access_token, ... }
}

async function jwksFor(jwks_uri) {
  if (_jwksCache.has(jwks_uri)) return _jwksCache.get(jwks_uri);
  const doc = await getJson(jwks_uri);
  const keys = Array.isArray(doc.keys) ? doc.keys : [];
  _jwksCache.set(jwks_uri, keys);
  return keys;
}

/**
 * Verify an OIDC ID token (RS256 only) against the provider JWKS and the expected
 * issuer / audience / nonce. Returns the verified claims. Throws OidcError on any
 * failure — fail closed. No alg other than RS256 is accepted (no "none", no HS
 * confusion: an attacker cannot downgrade to a symmetric alg signed with a public
 * value, because we hard-require RS256 and an RSA public key).
 */
export async function verifyIdToken(idToken, { jwks_uri, issuer, audience, nonce, clockToleranceSec = 60 }) {
  const parts = String(idToken).split(".");
  if (parts.length !== 3) throw new OidcError("MALFORMED", "id_token is not a JWT");
  const [h, p, sig] = parts;
  let header, claims;
  try { header = jsonB64url(h); claims = jsonB64url(p); }
  catch { throw new OidcError("MALFORMED", "id_token header/payload not decodable"); }
  if (header.alg !== "RS256") throw new OidcError("ALG", `unsupported id_token alg: ${header.alg}`);

  const keys = await jwksFor(jwks_uri);
  const jwk = keys.find((k) => k.kid === header.kid) || (keys.length === 1 ? keys[0] : null);
  if (!jwk) throw new OidcError("NO_KEY", "no JWKS key matches the id_token kid");
  let pub;
  try { pub = crypto.createPublicKey({ key: jwk, format: "jwk" }); }
  catch { throw new OidcError("BAD_KEY", "JWKS key is not a usable RSA public key"); }

  const ok = crypto.verify("RSA-SHA256", Buffer.from(`${h}.${p}`), pub, fromB64url(sig));
  if (!ok) throw new OidcError("BAD_SIGNATURE", "id_token signature verification failed");

  const now = Math.floor(Date.now() / 1000);
  if (issuer && claims.iss !== issuer) throw new OidcError("ISSUER", "id_token issuer mismatch");
  const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (audience && !auds.includes(audience)) throw new OidcError("AUDIENCE", "id_token audience mismatch");
  if (claims.exp != null && now > claims.exp + clockToleranceSec) throw new OidcError("EXPIRED", "id_token expired");
  if (claims.nbf != null && now + clockToleranceSec < claims.nbf) throw new OidcError("NOT_YET_VALID", "id_token not yet valid");
  if (nonce != null && claims.nonce !== nonce) throw new OidcError("NONCE", "id_token nonce mismatch");
  return claims;
}

/** Test-only cache reset (the mock IdP rotates keys/endpoints between cases). */
export function _resetCaches() { _discoCache.clear(); _jwksCache.clear(); }
