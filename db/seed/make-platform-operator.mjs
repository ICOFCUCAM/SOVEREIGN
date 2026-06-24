#!/usr/bin/env node
// Mint a PLATFORM OPERATOR credential — out-of-band, the ONLY way a
// dispatch:platform principal comes into existence (no tenant or admin API can
// issue this scope; see provisioning.mjs NEVER_ISSUABLE).
//
// The credential carries dispatch:platform ALONE — no read/render/approve/etc. —
// so it can call only the content-blind platform aggregate endpoints and can
// never pivot into tenant content. It is hosted under a reserved, record-less
// "platform" tenant so it owns nothing.
//
// Dependency-free: uses `psql` (like migrate.mjs), so it runs anywhere psql and
// a connection string exist — no Node DB driver needed.
//
// Usage:
//   DATABASE_URL=postgres://... node db/seed/make-platform-operator.mjs [name]
// Prints client_id + secret ONCE. Store the secret now; it is not recoverable.
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import { hashSecretScrypt } from "../../services/shared/src/auth.mjs";

const dsn = process.env.ADMIN_DATABASE_URL || process.env.DATABASE_URL || process.env.DISPATCH_MIGRATE_URL;
if (!dsn) { console.error("set DATABASE_URL / ADMIN_DATABASE_URL"); process.exit(1); }

const PLATFORM_TENANT = "00000000-0000-4000-8000-000000000001"; // reserved, record-less
const name = (process.argv[2] || "platform-operator").replace(/[^\w .-]/g, "").slice(0, 60) || "platform-operator";
const clientId = "svc-platform-" + crypto.randomBytes(4).toString("hex");
const secret = "sk_plat_" + crypto.randomBytes(24).toString("base64url");
const hash = hashSecretScrypt(secret);

const sql = `
begin;
insert into dispatch.tenants (id, slug, name, status, edition)
  values (:'tid', 'platform', 'Platform Operations', 'active', 'enterprise')
  on conflict (id) do nothing;
insert into dispatch.service_clients (tenant_id, name, client_id, secret_hash, scopes)
  values (:'tid', :'name', :'cid', :'hash', array['dispatch:platform']);
commit;
`;

try {
  execFileSync("psql", [
    dsn, "-v", "ON_ERROR_STOP=1",
    "-v", `tid=${PLATFORM_TENANT}`, "-v", `name=${name}`,
    "-v", `cid=${clientId}`, "-v", `hash=${hash}`,
    "-q", "-f", "-",
  ], { input: sql, stdio: ["pipe", "ignore", "inherit"] });
  console.log("\nPlatform operator credential created (store the secret now — shown once):\n");
  console.log("  client_id:  " + clientId);
  console.log("  secret:     " + secret);
  console.log("  scopes:     dispatch:platform  (content-blind, aggregates only)\n");
  console.log("Sign in to /operator with these (exchange via POST /v1/token).\n");
} catch (e) {
  console.error("failed:", e.message);
  process.exit(1);
}
