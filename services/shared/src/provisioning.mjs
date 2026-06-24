// Provisioning — the institutional onboarding + credentialing process.
//
// How a government or bank gets an account and a secret:
//   1. An operator provisions the TENANT (account) and seeds a tenant_admin.
//   2. A service-client CREDENTIAL is issued: a public client_id and a
//      high-entropy secret. Only the scrypt hash of the secret is stored; the
//      raw secret is returned to the caller EXACTLY ONCE.
//   3. The institution exchanges {client_id, secret} at POST /v1/token for a
//      short-lived Bearer JWT, then calls the API with it.
//   4. Lifecycle: rotate the secret, adjust scopes, or revoke the client — all
//      written to the append-only audit trail.
//
// These functions operate on a pg client ALREADY inside a transaction whose
// `request.jwt.claims` are set (db.withClaims). That makes RLS the gate on the
// self-service (app-role) path, while the operator path runs as a superuser and
// is naturally cross-tenant. Secrets never touch the database in the clear.
import crypto from "node:crypto";
import { hashSecretScrypt } from "./auth.mjs";
import { writeAudit } from "./db.mjs";

// The full scope vocabulary (mirrors auth.mjs). `dispatch:admin` is intentionally
// NOT self-service-issuable: a tenant_admin must not be able to mint a machine
// credential that can itself manage credentials. Operators may override.
//
// `dispatch:platform` is the privileged Platform Operator scope (content-blind,
// cross-tenant AGGREGATES only). It is NEVER issuable through any tenant or admin
// API — not self-service, not even by a tenant_admin/operator override — so no
// tenant can mint a platform credential or escalate into the platform domain. A
// platform operator credential is minted only out-of-band (db/seed/make-platform-operator).
export const KNOWN_SCOPES = [
  "dispatch:validate", "dispatch:render", "dispatch:read",
  "dispatch:approve", "dispatch:publish", "dispatch:audit", "dispatch:admin",
  "dispatch:platform",
];
const NEVER_ISSUABLE = ["dispatch:platform"];
const SELF_ISSUABLE = KNOWN_SCOPES.filter((s) => s !== "dispatch:admin" && !NEVER_ISSUABLE.includes(s));

export class ProvisioningError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

/** Normalise + validate a requested scope set. Throws ProvisioningError. */
export function validateScopes(scopes, { allowAdmin = false } = {}) {
  if (!Array.isArray(scopes) || scopes.length === 0) {
    throw new ProvisioningError("INVALID_SCOPES", "at least one scope is required");
  }
  // Even an operator override (allowAdmin) cannot issue a NEVER_ISSUABLE scope.
  const allowed = allowAdmin ? KNOWN_SCOPES.filter((s) => !NEVER_ISSUABLE.includes(s)) : SELF_ISSUABLE;
  const clean = [...new Set(scopes.map((s) => String(s).trim()).filter(Boolean))];
  for (const s of clean) {
    if (!KNOWN_SCOPES.includes(s)) throw new ProvisioningError("INVALID_SCOPES", `unknown scope: ${s}`);
    if (!allowed.includes(s)) throw new ProvisioningError("SCOPE_NOT_ISSUABLE", `scope not self-issuable: ${s}`);
  }
  return clean;
}

const EDITIONS = ["standard", "government", "enterprise"];

/** A URL/identifier-safe slug fragment. */
export function slugify(s) {
  return String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "tenant";
}

/** Generate a public client identifier: svc_<tenant-slug>_<8 hex>. */
export function genClientId(slug) {
  return `svc_${slugify(slug)}_${crypto.randomBytes(4).toString("hex")}`;
}

/** Generate a high-entropy client secret (256-bit). Prefixed for recognisability. */
export function genSecret() {
  return `sdk_${crypto.randomBytes(32).toString("base64url")}`;
}

/**
 * Provision a TENANT (operator path; runs as superuser, cross-tenant).
 * Returns the created tenant row. Idempotent on slug.
 */
export async function provisionTenantTx(client, { slug, name, edition = "standard", residency = "default", retentionDays = 365, actor = "operator" }) {
  const s = slugify(slug);
  if (!name) throw new ProvisioningError("INVALID_TENANT", "name is required");
  if (!EDITIONS.includes(edition)) throw new ProvisioningError("INVALID_TENANT", `edition must be one of ${EDITIONS.join(", ")}`);
  const r = await client.query(
    `insert into dispatch.tenants (slug, name, edition, residency, retention_days)
       values ($1,$2,$3,$4,$5)
     on conflict (slug) do update set name = excluded.name, updated_at = now()
     returning id, slug, name, edition, residency, retention_days, status, created_at`,
    [s, name, edition, residency, retentionDays],
  );
  const tenant = r.rows[0];
  await writeAudit(client, { tenantId: tenant.id, actor, actorType: "system", action: "tenant.provisioned", targetType: "tenant", targetId: tenant.id });
  return tenant;
}

/** Seed (or upgrade) a human tenant_admin membership for a tenant. Operator path. */
export async function seedTenantAdminTx(client, { tenantId, userId, actor = "operator" }) {
  const r = await client.query(
    `insert into dispatch.memberships (tenant_id, user_id, role)
       values ($1,$2,'tenant_admin')
     on conflict (tenant_id, user_id) do update set role = 'tenant_admin', status = 'active'
     returning id`,
    [tenantId, userId],
  );
  await writeAudit(client, { tenantId, actor, actorType: "system", action: "membership.granted", targetType: "membership", targetId: r.rows[0].id, classification: "tenant_admin" });
  return r.rows[0];
}

/**
 * Issue a service-client CREDENTIAL for a tenant. Returns
 *   { id, clientId, secret, name, scopes, createdAt }
 * where `secret` is the ONLY time the raw secret is available. The caller is
 * responsible for delivering it to the institution and then discarding it.
 *
 * tenantId must equal the caller's claim on the self-service path (RLS enforces
 * it); operators pass any tenantId (superuser bypasses RLS).
 */
export async function issueClientTx(client, { tenantId, name, scopes, clearance = "none", actor, actorType = "user", allowAdmin = false }) {
  if (!name || !String(name).trim()) throw new ProvisioningError("INVALID_CLIENT", "client name is required");
  const cleanScopes = validateScopes(scopes, { allowAdmin });
  const slugRow = await client.query("select slug from dispatch.tenants where id = $1", [tenantId]);
  const slug = slugRow.rows[0]?.slug || "tenant";
  const clientId = genClientId(slug);
  const secret = genSecret();
  const secretHash = hashSecretScrypt(secret);
  const r = await client.query(
    `insert into dispatch.service_clients (tenant_id, name, client_id, secret_hash, scopes, clearance, created_by)
       values ($1,$2,$3,$4,$5,$6,$7)
     returning id, created_at`,
    [tenantId, String(name).trim(), clientId, secretHash, cleanScopes, clearance, actor || null],
  );
  const id = r.rows[0].id;
  await writeAudit(client, { tenantId, actor: actor || "operator", actorType, action: "client.issued", targetType: "service_client", targetId: id });
  return { id, clientId, secret, name: String(name).trim(), scopes: cleanScopes, createdAt: r.rows[0].created_at };
}

/**
 * Rotate a client's secret. Returns { clientId, secret } with the new raw secret
 * (shown once). The old secret stops working immediately. Throws NOT_FOUND if no
 * such active-or-inactive client is visible to the caller (RLS-scoped).
 */
export async function rotateSecretTx(client, { tenantId, clientId, actor, actorType = "user" }) {
  const secret = genSecret();
  const secretHash = hashSecretScrypt(secret);
  const r = await client.query(
    `update dispatch.service_clients
        set secret_hash = $1, last_rotated_at = now()
      where client_id = $2
      returning id`,
    [secretHash, clientId],
  );
  if (r.rowCount === 0) throw new ProvisioningError("NOT_FOUND", "no such service client");
  await writeAudit(client, { tenantId, actor: actor || "operator", actorType, action: "client.rotated", targetType: "service_client", targetId: r.rows[0].id });
  return { clientId, secret };
}

/** Revoke a client (active=false). The credential can no longer mint tokens. */
export async function revokeClientTx(client, { tenantId, clientId, actor, actorType = "user" }) {
  const r = await client.query(
    `update dispatch.service_clients set active = false where client_id = $1 returning id`,
    [clientId],
  );
  if (r.rowCount === 0) throw new ProvisioningError("NOT_FOUND", "no such service client");
  await writeAudit(client, { tenantId, actor: actor || "operator", actorType, action: "client.revoked", targetType: "service_client", targetId: r.rows[0].id });
  return { clientId, revoked: true };
}

// Default scopes for a self-serve owner credential: admin (manage credentials +
// billing) plus the create/render/read surface. Download is gated on billing,
// not scope, so the free tier still gets read.
export const OWNER_SCOPES = ["dispatch:admin", "dispatch:validate", "dispatch:render", "dispatch:read"];

/**
 * Self-serve signup: create a FREE tenant and its owner credential atomically
 * via the SECURITY DEFINER signup_tenant() (the app role can't insert tenants
 * under RLS). Returns { tenantId, clientId, secret, plan } — secret shown once.
 * Runs on the unprivileged app pool; no operator/superuser needed.
 */
export async function signupTenantTx(client, { name }) {
  const clean = String(name || "").trim();
  if (clean.length < 2) throw new ProvisioningError("INVALID_TENANT", "institution name is required");
  const slug = `${slugify(clean)}-${crypto.randomBytes(3).toString("hex")}`;
  const clientId = genClientId(slug);
  const secret = genSecret();
  const secretHash = hashSecretScrypt(secret);
  const r = await client.query(
    "select tenant_id, client_id from dispatch.signup_tenant($1,$2,$3,$4,$5)",
    [clean, slug, clientId, secretHash, OWNER_SCOPES],
  );
  return { tenantId: r.rows[0].tenant_id, clientId, secret, plan: "free", scopes: OWNER_SCOPES };
}

/** List a tenant's service clients — safe fields only, never the secret hash. */
export async function listClientsTx(client) {
  const r = await client.query(
    `select client_id, name, scopes, clearance, active, created_by, created_at, last_used_at, last_rotated_at
       from dispatch.service_clients order by created_at desc`,
  );
  return r.rows;
}
