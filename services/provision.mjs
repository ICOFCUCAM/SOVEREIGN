#!/usr/bin/env node
// Sovereign Dispatch — operator provisioning CLI.
//
// The operator path of the onboarding process: a Dispatch platform operator
// bootstraps a vetted institution (government, bank) and issues its first
// credential. Runs as a SUPERUSER (BYPASSRLS) via the admin DSN, so it is
// cross-tenant — unlike the tenant self-service admin API.
//
// Connection (first defined wins; same precedence as the migration runner):
//   DISPATCH_MIGRATE_URL | ADMIN_DATABASE_URL | DATABASE_URL
//
// Usage:
//   node services/provision.mjs tenant:create --slug bank-of-x --name "Bank of X" \
//        --edition enterprise --residency eu --retention 3650 [--admin-user <uuid>]
//   node services/provision.mjs client:issue  --tenant bank-of-x --name "Core API" \
//        --scopes dispatch:validate,dispatch:render,dispatch:read [--clearance secret] [--allow-admin]
//   node services/provision.mjs client:rotate  --tenant bank-of-x --client svc_bank-of-x_1a2b3c4d
//   node services/provision.mjs client:revoke  --tenant bank-of-x --client svc_bank-of-x_1a2b3c4d
//   node services/provision.mjs client:list    --tenant bank-of-x
//
// Secrets are printed EXACTLY ONCE. Capture them at issue/rotation time.
import pg from "pg";
import { withClaims } from "./shared/src/db.mjs";
import {
  provisionTenantTx, seedTenantAdminTx, issueClientTx, rotateSecretTx,
  revokeClientTx, listClientsTx, ProvisioningError,
} from "./shared/src/provisioning.mjs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseFlags(argv) {
  const f = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) { f[key] = true; }
      else { f[key] = next; i++; }
    }
  }
  return f;
}

function die(msg) { console.error(`provision: ${msg}`); process.exit(1); }

function dsn() {
  const d = process.env.DISPATCH_MIGRATE_URL || process.env.ADMIN_DATABASE_URL || process.env.DATABASE_URL;
  if (!d) die("no admin connection string (set DISPATCH_MIGRATE_URL / ADMIN_DATABASE_URL / DATABASE_URL)");
  return d;
}

async function resolveTenantId(client, ref) {
  if (!ref) die("--tenant <slug|uuid> is required");
  const r = UUID_RE.test(ref)
    ? await client.query("select id from dispatch.tenants where id = $1", [ref])
    : await client.query("select id from dispatch.tenants where slug = $1", [ref]);
  if (r.rowCount === 0) die(`tenant not found: ${ref}`);
  return r.rows[0].id;
}

function secretBanner(label, fields) {
  const line = "─".repeat(64);
  console.log(`\n${line}`);
  console.log(`  ${label} — store this secret now; it is shown only once.`);
  console.log(line);
  for (const [k, v] of fields) console.log(`  ${k.padEnd(12)} ${v}`);
  console.log(`${line}\n`);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === "help" || cmd === "--help") {
    console.log("commands: tenant:create | client:issue | client:rotate | client:revoke | client:list  (see header)");
    process.exit(cmd ? 0 : 1);
  }
  const flags = parseFlags(rest);
  const actor = `operator:${flags.actor || process.env.USER || "cli"}`;
  const pool = new pg.Pool({ connectionString: dsn(), max: 2 });

  try {
    if (cmd === "tenant:create") {
      const tenant = await withClaims(pool, {}, async (c) => {
        const t = await provisionTenantTx(c, {
          slug: flags.slug, name: flags.name, edition: flags.edition,
          residency: flags.residency, retentionDays: flags.retention ? Number(flags.retention) : undefined, actor,
        });
        if (flags["admin-user"]) await seedTenantAdminTx(c, { tenantId: t.id, userId: flags["admin-user"], actor });
        return t;
      });
      console.log(`tenant provisioned: ${tenant.slug} (${tenant.id}) · edition=${tenant.edition} · residency=${tenant.residency} · retention=${tenant.retention_days}d`);
      if (flags["admin-user"]) console.log(`tenant_admin granted to user ${flags["admin-user"]}`);
      return;
    }

    if (cmd === "client:issue") {
      const scopes = String(flags.scopes || "").split(",").map((s) => s.trim()).filter(Boolean);
      const out = await withClaims(pool, {}, async (c) => {
        const tenantId = await resolveTenantId(c, flags.tenant);
        return issueClientTx(c, { tenantId, name: flags.name, scopes, clearance: flags.clearance || "none", actor, actorType: "system", allowAdmin: !!flags["allow-admin"] });
      });
      secretBanner("CREDENTIAL ISSUED", [["client_id", out.clientId], ["secret", out.secret], ["scopes", out.scopes.join(" ")]]);
      return;
    }

    if (cmd === "client:rotate") {
      const out = await withClaims(pool, {}, async (c) => {
        const tenantId = await resolveTenantId(c, flags.tenant);
        return rotateSecretTx(c, { tenantId, clientId: flags.client, actor, actorType: "system" });
      });
      secretBanner("SECRET ROTATED", [["client_id", out.clientId], ["secret", out.secret]]);
      return;
    }

    if (cmd === "client:revoke") {
      await withClaims(pool, {}, async (c) => {
        const tenantId = await resolveTenantId(c, flags.tenant);
        return revokeClientTx(c, { tenantId, clientId: flags.client, actor, actorType: "system" });
      });
      console.log(`client revoked: ${flags.client}`);
      return;
    }

    if (cmd === "client:list") {
      const rows = await withClaims(pool, {}, async (c) => {
        await resolveTenantId(c, flags.tenant); // validates tenant exists
        // superuser bypasses RLS, so scope the listing to the tenant explicitly:
        const r = await c.query(
          `select client_id, name, scopes, active, created_at, last_used_at
             from dispatch.service_clients
            where tenant_id = (select id from dispatch.tenants where ${UUID_RE.test(flags.tenant) ? "id" : "slug"} = $1)
            order by created_at desc`, [flags.tenant]);
        return r.rows;
      });
      if (rows.length === 0) { console.log("(no service clients)"); return; }
      for (const r of rows) {
        console.log(`${r.active ? "●" : "○"} ${r.client_id}  ${r.name}  [${(r.scopes || []).join(" ")}]  ${r.last_used_at ? "used " + new Date(r.last_used_at).toISOString() : "never used"}`);
      }
      return;
    }

    die(`unknown command '${cmd}'`);
  } catch (e) {
    if (e instanceof ProvisioningError) die(`${e.code}: ${e.message}`);
    die(String(e.message || e));
  } finally {
    await pool.end();
  }
}

main();
