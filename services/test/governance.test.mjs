// Sprint 3 — publication governance (lifecycle, approval, publish, audit).
// Verifies the Submit → Govern → Approve → Render → Publish → Retrieve flow:
//   - unit: state machine + quorum (pure, no DB)
//   - E2E: a user submission requires review (no render job); an approver
//     approves → render job created → worker renders → 'rendered' → publish;
//     separation-of-duties (submitter ≠ approver); reject path; audit trail;
//     and the machine (service) lane still auto-approves (Sprint-1/2 contract).
//
// Requires a live API (DISPATCH_API_URL) sharing this process's DB, and an
// approval policy row that makes the USER lane require review for tenant A.
import crypto from "node:crypto";
import pgpkg from "pg";
import { makePool, withClaims } from "../shared/src/db.mjs";
import { tick } from "../dispatch-worker/src/worker.mjs";
import { canTransition, evaluateQuorum, DEFAULT_POLICY, autoApproves, renderAllowed } from "../shared/src/governance.mjs";

const API = process.env.DISPATCH_API_URL || "http://127.0.0.1:8787";
const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const pool = makePool();
// append-only audit has no app SELECT policy for these actions → count via the
// superuser inspector (same pattern as sprint1-e2e).
const adminPool = new pgpkg.Pool({ host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432),
  user: "postgres", database: process.env.PGDATABASE || "dispatch", max: 3 });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

function brief(tenantId, title = "Gov Brief") {
  return { schemaVersion: "1.0", idempotencyKey: crypto.randomUUID(),
    source: { system: "saas-ui", tenantId, correlationId: "gov-1" },
    document: { ddmVersion: "1.0", docType: "executive_briefing",
      metadata: { title, date: "2026-05-29", status: "final" },
      classification: { scheme: "none", level: "UNCLASSIFIED" },
      sections: [
        { id: "s1", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF." }] },
        { id: "s2", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", items: [{ text: "J1" }] }] },
        { id: "s3", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Body." }] },
        { id: "s4", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Go." }] },
      ] },
    outputs: ["md"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } };
}

async function api(method, path, { token, idem, body } = {}) {
  const headers = {}; if (token) headers.authorization = "Bearer " + token;
  if (idem) headers["idempotency-key"] = idem; if (body) headers["content-type"] = "application/json";
  const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get("content-type") || "";
  return { status: r.status, json: ct.includes("json") ? await r.json().catch(() => null) : null };
}

// Dev user tokens (NODE_ENV != production): "user <tenant>:<role>".
const T = (role) => `user ${TENANT_A}:${role}`;
const countAudit = async (action, targetId) =>
  (await adminPool.query("select count(*)::int n from dispatch.audit_events where action=$1 and ($2::uuid is null or target_id=$2)", [action, targetId || null])).rows[0].n;

async function main() {
  console.log("== publication governance ==");

  // ---- unit: state machine + quorum ----
  ok(canTransition("draft", "submitted") && !canTransition("draft", "published"), "unit: legal/illegal transitions");
  ok(renderAllowed("approved") && !renderAllowed("in_review"), "unit: render gated on approved");
  ok(autoApproves(DEFAULT_POLICY, "service") && !autoApproves(DEFAULT_POLICY, "user"), "unit: default lane (service auto, user review)");
  const twoEyes = { required_approvals: 2 };
  ok(evaluateQuorum([{ decision: "approve", actor: "a" }], twoEyes, { submitter: "s" }).outcome === "pending", "unit: 1 of 2 → pending");
  ok(evaluateQuorum([{ decision: "approve", actor: "a" }, { decision: "approve", actor: "b" }], twoEyes, { submitter: "s" }).outcome === "approved", "unit: 2 of 2 → approved");
  ok(evaluateQuorum([{ decision: "approve", actor: "s" }, { decision: "approve", actor: "a" }], twoEyes, { submitter: "s" }).outcome === "pending", "unit: submitter's own approve doesn't count");
  ok(evaluateQuorum([{ decision: "reject", actor: "a" }], DEFAULT_POLICY, {}).outcome === "rejected", "unit: any reject → rejected");

  // Ensure tenant A's user lane requires review (policy row; idempotent).
  await withClaims(pool, { tenant_id: TENANT_A, dispatch_role: "tenant_admin", principal_type: "user", actor: "test-setup" }, async (c) => {
    await c.query(`insert into dispatch.approval_policies (tenant_id, doc_type, classification_level, required_approvals, auto_approve_service, auto_approve_user)
                   values ($1, null, null, 1, true, false)
                   on conflict (tenant_id, doc_type, classification_level) do update set required_approvals=excluded.required_approvals, auto_approve_user=false`, [TENANT_A]);
  });

  // ---- E2E: user submission → review (NO render job yet) ----
  const sub = await api("POST", "/v1/documents", { token: T("author"), idem: crypto.randomUUID(), body: brief(TENANT_A) });
  ok(sub.status === 202 && sub.json.status === "in_review" && !sub.json.jobId, `user submit → in_review, no job (status=${sub.json?.status})`);
  const docId = sub.json.documentId;
  ok((await countAudit("document.submitted", docId)) === 1, "audit: document.submitted");

  // appears in the approver inbox
  const inbox = await api("GET", "/v1/approvals?state=pending", { token: T("approver") });
  ok(inbox.status === 200 && inbox.json.items.some((i) => i.documentId === docId), "approver inbox lists the pending doc");

  // separation of duties: a principal who submitted a document cannot also be
  // a deciding approver of it. tenant_admin can both submit and approve, so it
  // exercises the guard: submit then self-approve as the same actor → 403.
  const subSelf = await api("POST", "/v1/documents", { token: T("tenant_admin"), idem: crypto.randomUUID(), body: brief(TENANT_A, "Self") });
  const selfId = subSelf.json.documentId;
  const selfDec = await api("POST", `/v1/documents/${selfId}/decision`, { token: T("tenant_admin"), body: { decision: "approve" } });
  ok(selfDec.status === 403 && selfDec.json.error.code === "SELF_APPROVAL_FORBIDDEN", "separation of duties: submitter cannot self-approve");

  // approve the author's doc as approver → render job created
  const dec = await api("POST", `/v1/documents/${docId}/decision`, { token: T("approver"), body: { decision: "approve", outputs: ["md"] } });
  ok(dec.status === 200 && dec.json.lifecycle === "approved" && dec.json.jobId, `approve → approved + render job (job=${dec.json?.jobId?.slice(0,8)})`);
  ok((await countAudit("approval.approve", docId)) === 1 && (await countAudit("document.approved", docId)) === 1, "audit: approval.approve + document.approved");

  // worker renders → lifecycle becomes 'rendered'
  await tick();
  const jobAfter = await api("GET", `/v1/jobs/${dec.json.jobId}`, { token: T("approver") });
  ok(jobAfter.json.status === "succeeded", "render succeeds");
  const lc1 = await api("GET", "/v1/documents?state=rendered", { token: T("author") });
  ok(lc1.json.items.some((i) => i.documentId === docId), "document now in 'rendered' state");

  // cannot publish before rendered is satisfied? it is rendered → publish needs publisher scope
  const pubAsAuthor = await api("POST", `/v1/documents/${docId}/publish`, { token: T("author") });
  ok(pubAsAuthor.status === 403, "author cannot publish (no publish scope)");
  const pub = await api("POST", `/v1/documents/${docId}/publish`, { token: T("publisher") });
  ok(pub.status === 200 && pub.json.lifecycle === "published", "publisher publishes → published");
  ok((await countAudit("document.published", docId)) === 1, "audit: document.published");

  // library lists published; retrieve still works
  const lib = await api("GET", "/v1/documents?state=published", { token: T("viewer") });
  ok(lib.json.items.some((i) => i.documentId === docId), "library lists the published document");

  // reject path: new submission rejected by approver
  const sub2 = await api("POST", "/v1/documents", { token: T("author"), idem: crypto.randomUUID(), body: brief(TENANT_A, "Reject me") });
  const rejId = sub2.json.documentId;
  const rej = await api("POST", `/v1/documents/${rejId}/decision`, { token: T("approver"), body: { decision: "reject", comment: "not ready" } });
  ok(rej.status === 200 && rej.json.lifecycle === "rejected", "reject → rejected");

  // audit endpoint (auditor scope) returns the trail for a document
  const aud = await api("GET", `/v1/audit?target=${docId}`, { token: T("auditor") });
  ok(aud.status === 200 && aud.json.events.length >= 3 && aud.json.events.some((e) => e.action === "document.published"), "auditor reads the document's audit trail");
  const audDenied = await api("GET", `/v1/audit?target=${docId}`, { token: T("author") });
  ok(audDenied.status === 403, "non-auditor denied the audit trail");

  // ---- machine lane still auto-approves (Sprint-1/2 contract preserved) ----
  const svc2 = await fetch(API + "/v1/documents", { method: "POST",
    headers: { authorization: "Bearer svc svc-a:secret-A", "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify(brief(TENANT_A, "Machine")) }).then((r) => r.json());
  ok(svc2.jobId && svc2.status === "queued", "service lane auto-approves → render job immediately");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await pool.end();
  await adminPool.end();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
