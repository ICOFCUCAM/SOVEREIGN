// Per-tenant / per-classification retention policy.
//   - admin upsert + list retention policies (dispatch:admin gated).
//   - resolveRetention: most-specific-wins (level > wildcard > tenant default).
//   - publish bakes retention_until + purge_after from the resolved policy.
//   - sweep honours per-document purge_after (a short-grace doc purges; a
//     long-grace doc does not).
import crypto from "node:crypto";
import pgpkg from "pg";
import { makePool, withClaims } from "../shared/src/db.mjs";
import { resolveRetention } from "../shared/src/governance.mjs";
import { sweep } from "../dispatch-worker/src/retention.mjs";

const API = process.env.DISPATCH_API_URL || "http://127.0.0.1:8787";
const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const pool = makePool();
const purgePool = new pgpkg.Pool({ host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432), user: "dispatch_purge", database: process.env.PGDATABASE || "dispatch", password: process.env.DISPATCH_PURGE_PASSWORD || "purge_pw", max: 3 });
const admin = new pgpkg.Pool({ host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432), user: "postgres", database: process.env.PGDATABASE || "dispatch", max: 3 });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

const T = (role) => `user ${TENANT_A}:${role}`;
async function api(method, path, { token, body } = {}) {
  const headers = {}; if (token) headers.authorization = "Bearer " + token; if (body) headers["content-type"] = "application/json";
  const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get("content-type") || "";
  return { status: r.status, json: ct.includes("json") ? await r.json().catch(() => null) : null };
}

async function main() {
  console.log("== per-tenant retention policy ==");

  // gating
  const denied = await api("GET", "/v1/admin/retention-policies", { token: T("author") });
  ok(denied.status === 403, "non-admin denied retention policies (403)");

  // upsert: SECRET kept 3650d / 90d grace; wildcard 30d / 7d grace
  const p1 = await api("POST", "/v1/admin/retention-policies", { token: T("tenant_admin"), body: { classificationLevel: "SECRET", retentionDays: 3650, purgeGraceDays: 90 } });
  ok(p1.status === 200 && p1.json.retentionDays === 3650, "upsert SECRET retention policy");
  const p2 = await api("POST", "/v1/admin/retention-policies", { token: T("tenant_admin"), body: { retentionDays: 30, purgeGraceDays: 7 } });
  ok(p2.status === 200, "upsert wildcard retention policy");
  const list = await api("GET", "/v1/admin/retention-policies", { token: T("tenant_admin") });
  ok(list.json.items.some((r) => r.classificationLevel === "secret" && r.retentionDays === 3650), "list reflects SECRET policy");

  // resolveRetention: most-specific wins
  const r = await withClaims(pool, { tenant_id: TENANT_A, dispatch_role: "tenant_admin", principal_type: "user", actor: "t" }, async (c) => ({
    secret: await resolveRetention(c, { tenantId: TENANT_A, classificationLevel: "SECRET" }),
    other: await resolveRetention(c, { tenantId: TENANT_A, classificationLevel: "OFFICIAL" }),
  }));
  ok(r.secret.retention_days === 3650 && r.secret.purge_grace_days === 90, "resolve SECRET → exact policy (3650/90)");
  ok(r.other.retention_days === 30 && r.other.purge_grace_days === 7, "resolve OFFICIAL → wildcard policy (30/7)");

  // publish bakes timestamps: seed a rendered doc and publish via API.
  // (publish requires rendered state + publish scope; build the doc directly.)
  const seedRendered = async (level) => withClaims(pool, { tenant_id: TENANT_A, dispatch_role: "service", principal_type: "service", actor: "seed" }, async (c) => {
    const d = await c.query(`insert into dispatch.documents (tenant_id, doc_type, title, classification, status, lifecycle_state)
      values ($1,'executive_briefing','Ret Pol',$2,'complete','rendered') returning id`, [TENANT_A, JSON.stringify({ scheme: "uk_gov", level })]);
    return d.rows[0].id;
  });
  const secretDoc = await seedRendered("SECRET");
  const pub = await api("POST", `/v1/documents/${secretDoc}/publish`, { token: T("publisher") });
  ok(pub.status === 200 && pub.json.retentionDays === 3650 && pub.json.purgeGraceDays === 90, "publish SECRET doc → retention from policy (3650/90)");
  const ts = (await admin.query("select retention_until, purge_after, (purge_after - retention_until) as grace from dispatch.documents where id=$1", [secretDoc])).rows[0];
  const graceDays = Math.round(Number(ts.grace.days || 0) || (new Date(ts.purge_after) - new Date(ts.retention_until)) / 86400000);
  ok(ts.retention_until && ts.purge_after && new Date(ts.purge_after) > new Date(ts.retention_until), "publish set both retention_until and a later purge_after");

  // sweep honours per-document purge_after: a doc archived with purge_after in
  // the PAST purges; one with purge_after in the FUTURE does not.
  const mkArchived = async (purgeOffsetDays) => withClaims(pool, { tenant_id: TENANT_A, dispatch_role: "service", principal_type: "service", actor: "seed" }, async (c) => {
    const d = await c.query(`insert into dispatch.documents (tenant_id, doc_type, title, classification, status, lifecycle_state, retention_until, purge_after)
      values ($1,'executive_briefing','Sweep',$2,'complete','archived', now() - interval '400 days', now() + ($3||' days')::interval) returning id`,
      [TENANT_A, JSON.stringify({ scheme: "none", level: "UNCLASSIFIED" }), String(purgeOffsetDays)]);
    const v = await c.query(`insert into dispatch.document_versions (tenant_id, document_id, version_no, ddm, ddm_version) values ($1,$2,1,'{}','1.0') returning id`, [TENANT_A, d.rows[0].id]);
    await c.query(`insert into dispatch.artifacts (tenant_id, version_id, role, format, storage_ref, sha256, size_bytes, expires_at)
      values ($1,$2,'primary','pdf',$3,$4,100, now() + interval '60 days')`, [TENANT_A, v.rows[0].id, "ret/" + d.rows[0].id, "b".repeat(64)]);
    return d.rows[0].id;
  });
  const duePast = await mkArchived(-1);   // purge_after 1 day ago → should purge
  const dueFuture = await mkArchived(60); // purge_after 60 days out → should NOT purge

  await sweep(purgePool, { graceDays: 30 });
  const artState = async (docId) => (await admin.query(`select a.integrity_status from dispatch.artifacts a join dispatch.document_versions v on v.id=a.version_id where v.document_id=$1`, [docId])).rows[0]?.integrity_status;
  ok((await artState(duePast)) === "unrecoverable", "doc past its purge_after → artifacts purged");
  ok((await artState(dueFuture)) === "ok", "doc with future purge_after → artifacts retained");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await pool.end(); await purgePool.end(); await admin.end();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
