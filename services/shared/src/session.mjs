// Sovereign Dispatch — human session issuance with refresh-token rotation.
//
// After SSO (or any membership-authoritative auth), the API issues its OWN
// session rather than handing the IdP token back to the SPA:
//   - access token: a short-lived Dispatch-signed USER JWT (principal_type
//     "user", authoritative role/clearance/scopes baked in) verified by the
//     normal Bearer path. Default 15 min.
//   - refresh token: an opaque high-entropy string, stored only as its SHA-256,
//     long-lived (default 30 days), ROTATING on every use.
//
// Rotation + reuse detection: each refresh consumes the presented token (marks
// it rotated_to the successor) and returns a new one in the same family. If a
// token that has ALREADY been rotated is presented again, that's replay/theft —
// the whole family is revoked and the refresh is denied. Logout revokes the
// presented token; "everywhere" revokes the family.
import crypto from "node:crypto";
import { signJwt } from "./jwt.mjs";

const ACCESS_TTL = () => Number(process.env.DISPATCH_ACCESS_TTL_SEC || 900);          // 15 min
const REFRESH_TTL = () => Number(process.env.DISPATCH_REFRESH_TTL_SEC || 2592000);    // 30 days

function sha256hex(s) { return crypto.createHash("sha256").update(s).digest("hex"); }

// Mint the short-lived Dispatch user access token from an authoritative principal.
export function mintAccessToken(principal) {
  const secret = process.env.DISPATCH_TOKEN_SECRET;
  if (!secret) return { error: { status: 500, code: "AUTH_NOT_CONFIGURED", message: "DISPATCH_TOKEN_SECRET not set" } };
  const ttl = ACCESS_TTL();
  // principal_type:"user" → resolver verifies with DISPATCH_TOKEN_SECRET and
  // (because the token is Dispatch-issued) trusts its baked-in role/clearance.
  const sub = (principal.actor || "").replace(/^user:/, "");
  const token = signJwt(
    { principal_type: "user", dispatch_issued: true, sub, tenant_id: principal.tenantId,
      dispatch_role: principal.role, scopes: principal.scopes ?? [], clearance: principal.clearance || "none" },
    secret, { expiresIn: ttl, issuer: process.env.DISPATCH_TOKEN_ISSUER || "sovereign-dispatch" });
  return { token, expiresIn: ttl };
}

/**
 * Start a new session: mint access token + an initial refresh token (new family).
 * @param withClaimsAdmin admin runner (SECURITY DEFINER fns; pre-session)
 */
export async function issueSession(principal, withClaimsAdmin) {
  const access = mintAccessToken(principal);
  if (access.error) return access;
  const familyId = crypto.randomUUID();
  const refresh = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + REFRESH_TTL() * 1000);
  const userId = (principal.actor || "").replace(/^user:/, "");
  await withClaimsAdmin((c) => c.query(
    "select dispatch.issue_refresh_token($1,$2,$3,$4,$5)",
    [familyId, sha256hex(refresh), principal.tenantId, userId, expiresAt.toISOString()]));
  return { accessToken: access.token, expiresIn: access.expiresIn, refreshToken: refresh, refreshExpiresAt: expiresAt.toISOString() };
}

/**
 * Rotate a refresh token. Re-resolves role/clearance from the membership (so a
 * role change or disable takes effect at refresh time), rotates the token, and
 * returns a fresh access + refresh pair. On reuse, revokes the family.
 * @param resolveMember (tenantId, userId) => { role, clearance, status } | null
 */
export async function rotateSession(presentedToken, withClaimsAdmin, resolveMember) {
  if (!presentedToken) return { error: { status: 400, code: "INVALID_REQUEST", message: "refresh_token required" } };
  const hash = sha256hex(presentedToken);
  const row = await withClaimsAdmin(async (c) => {
    const r = await c.query("select * from dispatch.lookup_refresh_token($1)", [hash]);
    return r.rows[0] || null;
  });
  if (!row) return { error: { status: 401, code: "INVALID_REFRESH", message: "unknown refresh token" } };

  // Reuse detection: a token already rotated (or revoked) is being replayed →
  // revoke the whole family and deny.
  if (row.revoked || row.rotated_to) {
    await withClaimsAdmin((c) => c.query("select dispatch.revoke_refresh_family($1)", [row.family_id]));
    return { error: { status: 401, code: "REFRESH_REUSE_DETECTED", message: "refresh token reuse detected; session revoked" } };
  }
  if (new Date(row.expires_at) < new Date()) {
    return { error: { status: 401, code: "REFRESH_EXPIRED", message: "refresh token expired" } };
  }

  // Re-resolve authority from the membership (revocation / role change wins).
  const member = await resolveMember(row.tenant_id, row.user_id);
  if (!member) return { error: { status: 403, code: "NO_MEMBERSHIP", message: "membership no longer exists" } };
  if (member.status && member.status !== "active") return { error: { status: 403, code: "MEMBERSHIP_DISABLED", message: "membership is disabled" } };

  const principal = { tenantId: row.tenant_id, principalType: "user", role: member.role || "viewer",
    scopes: member._scopes, clearance: member.clearance || "none", actor: `user:${row.user_id}` };
  const access = mintAccessToken(principal);
  if (access.error) return access;

  // Issue the successor in the same family, then mark this one rotated.
  const newRefresh = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + REFRESH_TTL() * 1000);
  const newId = await withClaimsAdmin(async (c) => {
    const r = await c.query("select dispatch.issue_refresh_token($1,$2,$3,$4,$5) as id",
      [row.family_id, sha256hex(newRefresh), row.tenant_id, row.user_id, expiresAt.toISOString()]);
    return r.rows[0].id;
  });
  await withClaimsAdmin((c) => c.query("select dispatch.rotate_refresh_token($1,$2)", [row.id, newId]));

  return { accessToken: access.token, expiresIn: access.expiresIn, refreshToken: newRefresh,
    refreshExpiresAt: expiresAt.toISOString(), principal };
}

/** Revoke a presented refresh token (logout) or its whole family (everywhere). */
export async function revokeSession(presentedToken, withClaimsAdmin, { everywhere = false } = {}) {
  if (!presentedToken) return { ok: true }; // nothing to do
  const hash = sha256hex(presentedToken);
  const row = await withClaimsAdmin(async (c) => {
    const r = await c.query("select * from dispatch.lookup_refresh_token($1)", [hash]);
    return r.rows[0] || null;
  });
  if (!row) return { ok: true };
  await withClaimsAdmin((c) => c.query(
    everywhere ? "select dispatch.revoke_refresh_family($1)" : "select dispatch.revoke_refresh_token($1)",
    [everywhere ? row.family_id : row.id]));
  return { ok: true };
}
