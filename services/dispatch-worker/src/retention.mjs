// dispatch-retention — the retention sweep (Sprint 3 close-out).
//
// Two-stage lifecycle at the end of a document's life:
//   published → (retention_until passes) → archived      [metadata kept, read-only]
//   archived  → (grace passes)           → purged        [artifact bytes expired]
//
// Runs as the privileged dispatch_purge role (BYPASSRLS + exempt from the
// immutability trigger, see M5/M9) because it is a CROSS-TENANT background job —
// like the worker's SECURITY DEFINER claim, it cannot run under a single tenant
// claim. It never deletes documents or audit: provenance is forever. "Purge"
// expires artifact bytes (sets expires_at=now so GET → 410 and storage GC can
// reclaim) and marks integrity_status, keeping the row + sha256 for the record.
import pg from "pg";
import { inc, log } from "../../shared/src/metrics.mjs";

const { Pool } = pg;

// Connects as dispatch_purge (privileged). Falls back to env; in compose this
// is a dedicated DSN. Kept separate from the app pool on purpose.
export function makePurgePool() {
  return new Pool({
    host: process.env.PGHOST || "/tmp",
    port: Number(process.env.PGPORT || 55432),
    user: process.env.DISPATCH_PURGE_USER || "dispatch_purge",
    database: process.env.PGDATABASE || "dispatch",
    password: process.env.DISPATCH_PURGE_PASSWORD || undefined,
    max: Number(process.env.PG_POOL_MAX || 4),
  });
}

const GRACE_DAYS = Number(process.env.DISPATCH_PURGE_GRACE_DAYS || 30);

// One sweep. Returns { archived, purgedArtifacts } counts. Idempotent: re-running
// only affects rows that have crossed their thresholds.
export async function sweep(pool, { graceDays = GRACE_DAYS, now = "now()" } = {}) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    // 1. published documents past retention_until → archived (read-only). The
    //    artifacts remain retrievable during the archive grace window.
    const arch = await client.query(
      `update dispatch.documents
          set lifecycle_state='archived'
        where lifecycle_state='published'
          and retention_until is not null
          and retention_until <= ${now}
        returning id, tenant_id, correlation_id`);

    for (const d of arch.rows) {
      await client.query(
        `insert into dispatch.audit_events (tenant_id, actor, actor_type, action, target_type, target_id, correlation_id)
         values ($1,'retention','system','document.archived','document',$2,$3)`,
        [d.tenant_id, d.id, d.correlation_id]);
    }

    // 2. archived documents past the grace window → purge artifact BYTES.
    //    We expire the artifacts (expires_at=now → GET returns 410) and flag
    //    integrity_status so it's clear the bytes are intentionally gone. The
    //    document, its versions and the audit trail are retained forever.
    const purge = await client.query(
      `update dispatch.artifacts a
          set expires_at = ${now}, integrity_status='unrecoverable'
         from dispatch.document_versions v
         join dispatch.documents d on d.id = v.document_id
        where a.version_id = v.id
          and d.lifecycle_state = 'archived'
          and d.retention_until is not null
          and d.retention_until <= (${now} - ($1 || ' days')::interval)
          and a.integrity_status <> 'unrecoverable'
        returning a.id, a.tenant_id, a.sha256, d.id as document_id, d.correlation_id`,
      [String(graceDays)]);

    for (const a of purge.rows) {
      await client.query(
        `insert into dispatch.audit_events (tenant_id, actor, actor_type, action, target_type, target_id, sha256, correlation_id)
         values ($1,'retention','system','artifact.purged','artifact',$2,$3,$4)`,
        [a.tenant_id, a.id, a.sha256, a.correlation_id]);
    }

    await client.query("commit");
    if (arch.rows.length) inc("retention_archived_total");
    if (purge.rows.length) inc("retention_purged_total");
    log.info({ service: "retention", stage: "sweep", archived: arch.rows.length, purgedArtifacts: purge.rows.length });
    return { archived: arch.rows.length, purgedArtifacts: purge.rows.length };
  } catch (e) {
    try { await client.query("rollback"); } catch { /* ignore */ }
    throw e;
  } finally {
    client.release();
  }
}

async function loop() {
  const pool = makePurgePool();
  const intervalMs = Number(process.env.DISPATCH_RETENTION_INTERVAL_MS || 3600000); // hourly
  if (process.env.RUN_ONCE) {
    const r = await sweep(pool);
    console.log(`retention sweep: archived ${r.archived}, purged ${r.purgedArtifacts} artifact(s)`);
    await pool.end();
    return;
  }
  console.log(`retention sweeper running (every ${intervalMs}ms, grace ${GRACE_DAYS}d)`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try { await sweep(pool); } catch (e) { log.error({ service: "retention", stage: "sweep", outcome: "error", message: String(e.message) }); }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  loop().catch((e) => { console.error("retention fatal:", e); process.exit(1); });
}
