// Principal resolver (ADR-002). Resolves a uniform Principal
//   { tenantId, principalType, role, scopes, actor }
// from the Authorization header. Returns { principal } or { error } (never throws),
// preserving the Sprint-1 contract so handlers and RLS are unchanged.
//
// R2 — Production authentication. Three accepted credentials:
//   1. "Bearer <jwt>"            production path. HS256-verified:
//        - service JWT (principal_type:"service") via DISPATCH_TOKEN_SECRET,
//          minted by POST /v1/token (client-credentials).
//        - user JWT (Supabase) via SUPABASE_JWT_SECRET; tenant from
//          app_metadata.tenant_id (or top-level tenant_id).
//   2. "svc <client_id>:<secret>"  client-credentials check (timing-safe compare
//        against service_clients.secret_hash). Used by /v1/token and, for
//        backward-compat, directly. The sha256-at-rest is a noted residual
//        (R-S1-1); the comparison is now constant-time.
//   3. "user <tenantId>:<role>"   DEV-ONLY trust shim. Disabled when
//        NODE_ENV=production or DISPATCH_ALLOW_DEV_TOKENS=0.
//
// The historical leading "Bearer " is stripped first (Sprint-1 tests wrap the
// svc/user tokens as "Bearer svc …"); a real JWT is detected as a single
// dot-delimited token.
import crypto from "node:crypto";
import { verifyJwt, signJwt, decodeUnverified, JwtError } from "./jwt.mjs";

const TENANT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_RE = TENANT_RE; // user `sub` must be a UUID too (membership user_id)

// Service-secret at-rest hashing (R-S1-1).
//
// New secrets are hashed with scrypt — memory-hard, salted, dependency-free
// (node:crypto), stored as  scrypt$N$r$p$<salt_b64>$<hash_b64>. Legacy values
// are bare 64-hex sha256 digests; verifySecret() accepts both so existing
// service_clients keep working and can be re-hashed on rotation. The scrypt N
// is kept modest (2^14) so auth stays sub-100ms; raise via DISPATCH_SCRYPT_COST.
const SCRYPT = { N: Number(process.env.DISPATCH_SCRYPT_COST || 16384), r: 8, p: 1, keylen: 32 };

/** Legacy sha256 hex digest (kept for back-compat verification only). */
export function hashSecret(secret) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

/** Hash a secret with scrypt for storage. Returns the encoded string. */
export function hashSecretScrypt(secret, opts = SCRYPT) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(secret), salt, opts.keylen, { N: opts.N, r: opts.r, p: opts.p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${opts.N}$${opts.r}$${opts.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function timingSafeBufEqual(a, b) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verify a presented secret against a stored hash, supporting both the new
 * scrypt format and legacy 64-hex sha256. Constant-time. Returns
 * { ok, legacy } so callers can opportunistically re-hash legacy secrets.
 */
export function verifySecret(secret, stored) {
  if (typeof stored !== "string" || !stored) return { ok: false, legacy: false };
  if (stored.startsWith("scrypt$")) {
    const [, Ns, rs, ps, saltB64, hashB64] = stored.split("$");
    try {
      const salt = Buffer.from(saltB64, "base64");
      const expected = Buffer.from(hashB64, "base64");
      const actual = crypto.scryptSync(String(secret), salt, expected.length, { N: Number(Ns), r: Number(rs), p: Number(ps), maxmem: 64 * 1024 * 1024 });
      return { ok: timingSafeBufEqual(actual, expected), legacy: false };
    } catch { return { ok: false, legacy: false }; }
  }
  // Legacy sha256 hex
  const ok = timingSafeBufEqual(Buffer.from(hashSecret(secret)), Buffer.from(stored));
  return { ok, legacy: true };
}

function devTokensAllowed() {
  if (process.env.DISPATCH_ALLOW_DEV_TOKENS === "0") return false;
  if (process.env.DISPATCH_ALLOW_DEV_TOKENS === "1") return true;
  return process.env.NODE_ENV !== "production"; // default on, except in production
}

export async function resolvePrincipal(pool, authHeader, withClaimsAdmin) {
  if (!authHeader) return { error: { status: 401, code: "UNAUTHENTICATED", message: "missing Authorization" } };
  const stripped = authHeader.replace(/^Bearer\s+/i, "");
  const [kind, rest] = stripped.split(/\s+/, 2);

  // ---- Production path: a real JWT (single dot-delimited token) -------------
  if (rest === undefined && kind.split(".").length === 3) {
    return resolveJwt(kind, withClaimsAdmin);
  }

  // ---- Dev-only user trust shim --------------------------------------------
  if (kind === "user") {
    if (!devTokensAllowed()) {
      return { error: { status: 401, code: "DEV_TOKENS_DISABLED", message: "dev user tokens are disabled; use a Bearer JWT" } };
    }
    const [tenantId, role] = (rest || "").split(":");
    if (!tenantId || !role) return { error: { status: 401, code: "UNAUTHENTICATED", message: "bad user token" } };
    return { principal: { tenantId, principalType: "user", role, scopes: roleScopes(role), actor: `user:${role}` } };
  }

  // ---- Client-credentials: svc client_id:secret ----------------------------
  if (kind === "svc") {
    const [clientId, secret] = (rest || "").split(":");
    if (!clientId || !secret) return { error: { status: 401, code: "UNAUTHENTICATED", message: "bad service token" } };
    // SECURITY DEFINER lookup: resolves the client before the tenant is known
    // (cannot be tenant-RLS-scoped). Read-only, by client_id only.
    const row = await withClaimsAdmin(async (client) => {
      const r = await client.query("select * from dispatch.lookup_service_client($1)", [clientId]);
      return r.rows[0];
    });
    if (!row || !row.active) return { error: { status: 401, code: "INVALID_CLIENT", message: "unknown or inactive client" } };
    if (!verifySecret(secret, row.secret_hash).ok) {
      return { error: { status: 401, code: "INVALID_CLIENT", message: "bad secret" } };
    }
    return { principal: { tenantId: row.tenant_id, principalType: "service", role: "service", scopes: row.scopes, clearance: row.clearance || "none", actor: `svc:${clientId}` } };
  }

  return { error: { status: 401, code: "UNAUTHENTICATED", message: "unknown token kind" } };
}

// Verify and map a Bearer JWT to a Principal.
async function resolveJwt(token, withClaimsAdmin) {
  let header;
  try {
    header = decodeUnverified(token);
  } catch {
    return { error: { status: 401, code: "UNAUTHENTICATED", message: "malformed bearer token" } };
  }
  const isService = header.principal_type === "service";
  const secret = isService ? process.env.DISPATCH_TOKEN_SECRET : process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    return { error: { status: 401, code: "AUTH_NOT_CONFIGURED", message: `${isService ? "DISPATCH_TOKEN_SECRET" : "SUPABASE_JWT_SECRET"} not set` } };
  }
  let claims;
  try {
    claims = verifyJwt(token, secret, { issuer: process.env.DISPATCH_TOKEN_ISSUER || undefined });
  } catch (e) {
    const code = e instanceof JwtError && e.code === "EXPIRED" ? "TOKEN_EXPIRED" : "INVALID_TOKEN";
    return { error: { status: 401, code, message: e.message } };
  }
  const tenantId = claims.tenant_id || claims.app_metadata?.tenant_id;
  if (!TENANT_RE.test(tenantId ?? "")) {
    return { error: { status: 401, code: "UNAUTHENTICATED", message: "token has no valid tenant_id" } };
  }
  if (isService) {
    return { principal: { tenantId, principalType: "service", role: "service", scopes: claims.scopes ?? [], clearance: claims.clearance || "none", actor: `svc:${claims.client_id || claims.sub || "service"}` } };
  }

  // Human SSO: ROLE + CLEARANCE are Dispatch's authority, NOT the identity
  // provider's. We resolve them from the membership row keyed by (tenant, sub)
  // and ignore any role/clearance the token tries to assert — so a Supabase
  // token can never self-escalate. The token only proves identity (sub) and
  // tenant. Without a usable lookup we fail closed to the lowest role.
  const userId = claims.sub;
  if (!UUID_RE.test(userId ?? "")) {
    return { error: { status: 401, code: "UNAUTHENTICATED", message: "token has no valid subject" } };
  }
  let member = null;
  if (typeof withClaimsAdmin === "function") {
    try {
      member = await withClaimsAdmin(async (client) => {
        const r = await client.query("select role, clearance, status from dispatch.lookup_membership($1,$2)", [tenantId, userId]);
        return r.rows[0] || null;
      });
    } catch { member = null; }
  }
  if (!member) {
    return { error: { status: 403, code: "NO_MEMBERSHIP", message: "no active membership for this user in this tenant" } };
  }
  if (member.status && member.status !== "active") {
    return { error: { status: 403, code: "MEMBERSHIP_DISABLED", message: "membership is disabled" } };
  }
  const role = member.role || "viewer";
  return { principal: { tenantId, principalType: "user", role, scopes: roleScopes(role), clearance: member.clearance || "none", actor: `user:${userId}` } };
}

/**
 * Mint a short-lived Dispatch service JWT from a verified service principal.
 * Backs POST /v1/token (client-credentials → bearer token).
 */
export function mintServiceToken(principal) {
  const secret = process.env.DISPATCH_TOKEN_SECRET;
  if (!secret) return { error: { status: 500, code: "AUTH_NOT_CONFIGURED", message: "DISPATCH_TOKEN_SECRET not set" } };
  const ttl = Number(process.env.DISPATCH_TOKEN_TTL_SEC || 900);
  const clientId = (principal.actor || "").replace(/^svc:/, "") || principal.clientId;
  const token = signJwt(
    { principal_type: "service", sub: clientId, client_id: clientId, tenant_id: principal.tenantId, scopes: principal.scopes ?? [], clearance: principal.clearance || "none" },
    secret,
    { expiresIn: ttl, issuer: process.env.DISPATCH_TOKEN_ISSUER || "sovereign-dispatch" },
  );
  return { token, tokenType: "Bearer", expiresIn: ttl };
}

/**
 * Mint a short-lived DOWNLOAD GRANT for exactly one artifact (Epic-10 hardening).
 * Unlike the service JWT, a grant is NOT render-capable and is bound to a single
 * artifact + tenant, so a leaked download URL exposes only that one file for a
 * short window. Used by POST /v1/artifacts/{id}/grant for browser download links.
 */
export function mintDownloadGrant(principal, artifactId) {
  const secret = process.env.DISPATCH_TOKEN_SECRET;
  if (!secret) return { error: { status: 500, code: "AUTH_NOT_CONFIGURED", message: "DISPATCH_TOKEN_SECRET not set" } };
  const ttl = Number(process.env.DISPATCH_GRANT_TTL_SEC || 300); // 5 min default
  const token = signJwt(
    { grant: "download", artifact_id: artifactId, tenant_id: principal.tenantId },
    secret,
    { expiresIn: ttl, issuer: process.env.DISPATCH_TOKEN_ISSUER || "sovereign-dispatch" },
  );
  return { token, expiresIn: ttl };
}

/**
 * Verify a download grant for a specific artifact. Returns { tenantId } on
 * success or { error }. Rejects render JWTs (grant must equal "download") and
 * grants minted for a different artifact id.
 */
export function verifyDownloadGrant(token, artifactId) {
  const secret = process.env.DISPATCH_TOKEN_SECRET;
  if (!secret) return { error: { status: 500, code: "AUTH_NOT_CONFIGURED", message: "DISPATCH_TOKEN_SECRET not set" } };
  let claims;
  try { claims = verifyJwt(token, secret, { issuer: process.env.DISPATCH_TOKEN_ISSUER || undefined }); }
  catch (e) { return { error: { status: 401, code: "INVALID_GRANT", message: e.message } }; }
  if (claims.grant !== "download") return { error: { status: 401, code: "INVALID_GRANT", message: "not a download grant" } };
  if (claims.artifact_id !== artifactId) return { error: { status: 403, code: "GRANT_MISMATCH", message: "grant is for a different artifact" } };
  if (!TENANT_RE.test(claims.tenant_id ?? "")) return { error: { status: 401, code: "INVALID_GRANT", message: "grant has no tenant" } };
  return { tenantId: claims.tenant_id };
}

// Scope vocabulary:
//   dispatch:validate  dry-run validation
//   dispatch:render    submit a document / create a render job
//   dispatch:read      retrieve jobs/documents/artifacts
//   dispatch:approve   act on the approval queue (approve/reject/return)
//   dispatch:publish   release approved+rendered docs / withdraw
//   dispatch:audit     read the audit trail (auditor)
//   dispatch:admin     manage clients, users, roles, clearance, policy, retention
const READ = "dispatch:read", VALIDATE = "dispatch:validate", RENDER = "dispatch:render";
const APPROVE = "dispatch:approve", PUBLISH = "dispatch:publish", AUDIT = "dispatch:audit", ADMIN = "dispatch:admin";

export function roleScopes(role) {
  switch (role) {
    case "viewer": return [READ];
    case "author": return [VALIDATE, RENDER, READ];
    case "reviewer": return [VALIDATE, RENDER, READ, APPROVE];
    case "approver": return [VALIDATE, RENDER, READ, APPROVE];
    case "publisher": return [VALIDATE, RENDER, READ, APPROVE, PUBLISH];
    case "auditor": return [READ, AUDIT];
    case "template_admin": return [VALIDATE, RENDER, READ];
    case "tenant_admin": return [VALIDATE, RENDER, READ, APPROVE, PUBLISH, AUDIT, ADMIN];
    // Machine principals keep the Sprint-1/2 surface; governance scopes are
    // granted explicitly per service_client via the scopes[] column when needed.
    case "service": return [VALIDATE, RENDER, READ];
    default: return [];
  }
}

export function hasScope(principal, scope) {
  return Array.isArray(principal.scopes) && principal.scopes.includes(scope);
}
