// Sprint 3 close-out — Admin surface + retention sweep.
//   Admin: provision a service client (secret returned once), list/patch it;
//          upsert a member role+clearance; upsert an approval policy; verify
//          dispatch:admin gating (non-admin → 403).
//   Retention: a published doc past retention_until → archived; an archived doc
//          past the grace window → its artifacts expired (purged), with audit.
import crypto from "node:crypto";
import pgpkg from "pg";
import { makePool, withClaims } from "../shared/src/db.mjs";
import { sweep } from "../dispatch-worker/src/retention.mjs";

const API = process.env.DISPATCH_API_URL || "http://127.0.0.1:8787";
const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const pool = makePool();
const purgePool = new pgpkg.Pool({ host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432),
  user: "dispatch_purge", database: process.env.PGDATABASE || "dispatch", password: process.env.DISPATCH_PURGE_PASSWORD || "purge_pw", max: 3 });
const adminPool = new pgpkg.Pool({ host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432),
  user: "postgres", database: process.env.PGDATABASE || "dispatch", max: 3 });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

const T = (role) => `user ${TENANT_A}:${role}`;
async function api(method, path, { token, body } = {}) {
  const headers = {}; if (token) headers.authorization = "Bearer " + token;
  if (body) headers["content-type"] = "application/json";
  const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get("content-type") || "";
  return { status: r.status, json: ct.includes("json") ? await r.json().catch(() => null) : null };
}

async function main() {
  console.log("== admin surface + retention ==");

  // ---- Admin: gating ----
  const denied = await api("GET", "/v1/admin/clients", { token: T("author") });
  ok(denied.status === 403, "non-admin denied /v1/admin/clients (403)");

  // ---- Admin: provision a service client ----
  const created = await api("POST", "/v1/admin/clients", { token: T("tenant_admin"), body: { name: "Test Integration", scopes: ["dispatch:read"] } });
  ok(created.status === 201 && created.json.secret && created.json.clientId, `create client → 201 + one-time secret (${created.json?.clientId})`);
  const newClientId = created.json.clientId, newSecret = created.json.secret;

  // the new client can authenticate with its returned secret
  const tok = await api("POST", "/v1/token", { body: { client_id: newClientId, secret: newSecret } });
  ok(tok.status === 200 && tok.json.access_token, "provisioned client authenticates via /v1/token");

  // list shows it (no secret)
  const list = await api("GET", "/v1/admin/clients", { token: T("tenant_admin") });
  const found = list.json.items.find((c) => c.clientId === newClientId);
  ok(list.status === 200 && found && !("secret" in found), "list clients includes new client, no secret leaked");

  // patch: deactivate
  const patched = await api("PATCH", `/v1/admin/clients/${found.id}`, { token: T("tenant_admin"), body: { active: false } });
  ok(patched.status === 200, "patch client (deactivate) → 200");
  const tok2 = await api("POST", "/v1/token", { body: { client_id: newClientId, secret: newSecret } });
  ok(tok2.status === 401, "deactivated client can no longer authenticate (401)");

  // ---- Admin: member upsert ----
  const uid = crypto.randomUUID();
  const mem = await api("POST", "/v1/admin/members", { token: T("tenant_admin"), body: { userId: uid, role: "approver", clearance: "secret" } });
  ok(mem.status === 200 && mem.json.role === "approver", "upsert member → 200");
  const mem2 = await api("POST", "/v1/admin/members", { token: T("tenant_admin"), body: { userId: uid, role: "publisher", clearance: "secret" } });
  ok(mem2.status === 200, "re-upsert same member (role change) → 200");
  const members = await api("GET", "/v1/admin/members", { token: T("tenant_admin") });
  ok(members.json.items.some((m) => m.userId === uid && m.role === "publisher"), "member list reflects updated role");

  // ---- Admin: policy upsert ----
  const pol = await api("POST", "/v1/admin/policies", { token: T("tenant_admin"),
    body: { docType: "board_report", classificationLevel: "SECRET", requiredApprovals: 2, autoApproveUser: false } });
  ok(pol.status === 200 && pol.json.requiredApprovals === 2, "upsert approval policy → 200");
  const pols = await api("GET", "/v1/admin/policies", { token: T("tenant_admin") });
  ok(pols.json.items.some((p) => p.docType === "board_report" && p.requiredApprovals === 2), "policy list reflects upsert");

  // ---- Retention: seed a published doc past retention, + an archived doc past grace ----
  // Use the admin (superuser) pool to set up deterministic timestamps.
  const seed = async (lifecycle, retentionDaysAgo, withArtifact) => withClaims(pool, { tenant_id: TENANT_A, dispatch_role: "service", principal_type: "service", actor: "seed" }, async (c) => {
    const d = await c.query(`insert into dispatch.documents (tenant_id, doc_type, title, classification, status, lifecycle_state, published_at, retention_until)
      values ($1,'executive_briefing','Retention Seed','{}','complete',$2, now() - interval '400 days', now() - ($3||' days')::interval) returning id`,
      [TENANT_A, lifecycle, String(retentionDaysAgo)]);
    const docId = d.rows[0].id;
    const v = await c.query(`insert into dispatch.document_versions (tenant_id, document_id, version_no, ddm, ddm_version) values ($1,$2,1,'{}','1.0') returning id`, [TENANT_A, docId]);
    if (withArtifact) {
      await c.query(`insert into dispatch.artifacts (tenant_id, version_id, role, format, storage_ref, sha256, size_bytes, expires_at)
        values ($1,$2,'primary','pdf',$3,$4,100, now() + interval '30 days')`,
        [TENANT_A, v.rows[0].id, "seed/ref-"+docId, "a".repeat(64)]);
    }
    return docId;
  });

  const pubPastRetention = await seed("published", 1, false);   // published, retention_until 1 day ago → should archive
  const archivedPastGrace = await seed("archived", 60, true);   // archived, retention 60 days ago (> 30d grace) → artifacts purge

  const before = await sweep(purgePool, { graceDays: 30 });
  ok(before.archived >= 1, `sweep archived ≥1 published doc past retention (got ${before.archived})`);
  ok(before.purgedArtifacts >= 1, `sweep purged ≥1 artifact past grace (got ${before.purgedArtifacts})`);

  // verify states
  const st = async (id) => (await adminPool.query("select lifecycle_state from dispatch.documents where id=$1", [id])).rows[0].lifecycle_state;
  ok((await st(pubPastRetention)) === "archived", "published-past-retention doc is now archived");
  const artState = await adminPool.query(`select a.expires_at <= now() as expired, a.integrity_status from dispatch.artifacts a join dispatch.document_versions v on v.id=a.version_id where v.document_id=$1`, [archivedPastGrace]);
  ok(artState.rows[0]?.expired === true && artState.rows[0]?.integrity_status === "unrecoverable", "archived-past-grace artifact is expired + flagged unrecoverable");

  // audit written, document + version still present (provenance kept)
  const aud = await adminPool.query("select count(*)::int n from dispatch.audit_events where action in ('document.archived','artifact.purged') and tenant_id=$1", [TENANT_A]);
  ok(aud.rows[0].n >= 2, "retention wrote archive + purge audit events");
  const docKept = await adminPool.query("select count(*)::int n from dispatch.documents where id=$1", [archivedPastGrace]);
  ok(docKept.rows[0].n === 1, "purge keeps the document row (bytes gone, record forever)");

  // idempotent: a second sweep purges nothing new
  const second = await sweep(purgePool, { graceDays: 30 });
  ok(second.purgedArtifacts === 0, "second sweep is idempotent (no re-purge)");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await pool.end(); await purgePool.end(); await adminPool.end();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
