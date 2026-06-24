// dispatch-api — API foundation (Sprint 1 M5/M6 + Sprint 2 Epic 8 retrieve).
// Implements POST /v1/validate, POST /v1/documents, POST /v1/token and the
// retrieve surface GET /v1/jobs/{id}, /v1/artifacts/{id}, /v1/documents/{id},
// with auth (Principal), tenant-claim enforcement, idempotency, persistence,
// append-only audit, and tenant-scoped artifact retrieval (signed URL / stream).
import http from "node:http";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateRequest } from "@dispatch/ddm-schema/validator";
import { makePool, withClaims, writeAudit } from "../../shared/src/db.mjs";
import { resolvePrincipal, hasScope, mintServiceToken, mintDownloadGrant, verifyDownloadGrant } from "../../shared/src/auth.mjs";
import { getArtifact, signUrl, sha256 as sha256Of } from "../../shared/src/storage.mjs";
import { inc, observe, snapshot, log } from "../../shared/src/metrics.mjs";
import { clearanceAllows } from "../../shared/src/clearance.mjs";
import { resolvePolicy, autoApproves, evaluateQuorum, renderAllowed, assertTransition } from "../../shared/src/governance.mjs";
import { issueClientTx, rotateSecretTx, revokeClientTx, listClientsTx, signupTenantTx, ProvisioningError } from "../../shared/src/provisioning.mjs";

const ENGINE_VERSION = "dispatch-api@1.0.0";
const pool = makePool();

const CONTENT_TYPE = { md: "text/markdown; charset=utf-8", pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };

// Minimal Dispatch console (Epic 9): a single static page served at / and /console.
const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
let CONSOLE_HTML = null;
function consoleHtml() {
  if (CONSOLE_HTML == null) { try { CONSOLE_HTML = readFileSync(join(PUBLIC_DIR, "console.html"), "utf8"); } catch { CONSOLE_HTML = ""; } }
  return CONSOLE_HTML;
}
// Resolve auth from the Authorization header, falling back to a ?token= query
// Auth comes from the Authorization header. (Browser <a> downloads, which can't
// set headers, use single-artifact ?grant= tokens instead of the full JWT —
// minted via POST /v1/artifacts/{id}/grant — so a full render-capable token is
// never placed in a URL.)
function authHeaderFrom(req) {
  return req.headers["authorization"];
}

// Admin/system claim used only for pre-tenant lookups (service-client auth).
const withAdmin = (fn) => withClaims(pool, { principal_type: "system" }, fn);

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", "x-request-id": body?.requestId || body?.error?.requestId || "" });
  res.end(json);
}
function errEnvelope(requestId, status, code, message, field) {
  return { error: { code, message, field: field ?? null, requestId: requestId ?? null } };
}

// CORS — the standalone console SPA (dispatch-web) is a different origin than the
// API, so cross-origin requests must be allowed. DISPATCH_CORS_ORIGIN is a
// comma-separated allowlist, or "*" (default). With an allowlist we echo the
// matching request Origin (credentials-safe) and Vary on Origin.
const CORS_ALLOW = (process.env.DISPATCH_CORS_ORIGIN || "*").split(",").map((s) => s.trim()).filter(Boolean);
function applyCors(req, res) {
  let origin = "*";
  if (!(CORS_ALLOW.length === 1 && CORS_ALLOW[0] === "*")) {
    const reqOrigin = req.headers["origin"];
    origin = reqOrigin && CORS_ALLOW.includes(reqOrigin) ? reqOrigin : CORS_ALLOW[0];
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type, x-request-id");
  res.setHeader("Access-Control-Max-Age", "86400");
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) { size += c.length; if (size > 2 * 1024 * 1024) throw new Error("DOC_TOO_LARGE"); chunks.push(c); }
  return Buffer.concat(chunks).toString("utf8");
}

async function handleValidate(req, res, principal) {
  if (!hasScope(principal, "dispatch:validate")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "validate scope required"));
  let body;
  try { body = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, 400, errEnvelope(null, 400, e.message === "DOC_TOO_LARGE" ? "DOC_TOO_LARGE" : "SCHEMA_INVALID", "invalid JSON body")); }
  // tenant guard: body source.tenantId must match the principal's tenant
  if (body?.source?.tenantId && body.source.tenantId !== principal.tenantId)
    return send(res, 403, errEnvelope(body.requestId, 403, "TENANT_MISMATCH", "source.tenantId != token tenant"));
  const v = validateRequest(body);            // shared module — identical to worker
  return send(res, 200, { valid: v.valid, errors: v.errors, warnings: v.warnings, resolved: v.resolved });
}

async function handleDocuments(req, res, principal) {
  if (!hasScope(principal, "dispatch:render")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "render scope required"));
  const idem = req.headers["idempotency-key"];
  if (!idem) return send(res, 400, errEnvelope(null, 400, "IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key header required"));

  let body;
  try { body = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, 400, errEnvelope(null, 400, e.message === "DOC_TOO_LARGE" ? "DOC_TOO_LARGE" : "SCHEMA_INVALID", "invalid JSON body")); }

  const requestId = body.requestId || crypto.randomUUID();
  if (body?.source?.tenantId && body.source.tenantId !== principal.tenantId)
    return send(res, 403, errEnvelope(requestId, 403, "TENANT_MISMATCH", "source.tenantId != token tenant"));

  // Validate (same module as /validate and worker)
  const v = validateRequest(body);
  if (!v.valid) {
    const primary = v.errors[0];
    const statusByCode = { SCAFFOLD_INCOMPLETE: 422, DOC_TYPE_UNSUPPORTED: 422, DOC_TOO_LARGE: 400 };
    const status = statusByCode[primary.code] || 400;
    return send(res, status, { ...errEnvelope(requestId, status, primary.code, primary.message, primary.field), errors: v.errors });
  }

  const claims = { tenant_id: principal.tenantId, dispatch_role: principal.role, principal_type: principal.principalType, actor: principal.actor };
  const doc = body.document;
  const outputs = body.outputs;

  try {
    const result = await withClaims(pool, claims, async (client) => {
      // Idempotency: existing job for (tenant, key)?
      const existing = await client.query("select id, request_id, state from dispatch.jobs where tenant_id=$1 and idempotency_key=$2", [principal.tenantId, idem]);
      if (existing.rows[0]) {
        return { replay: true, jobId: existing.rows[0].id, requestId: existing.rows[0].request_id, state: existing.rows[0].state };
      }
      // Free-tier quota: a tenant without an active subscription may hold at most
      // doc_quota documents. Counted after idempotency, so replays don't consume it.
      const tq = await client.query("select subscription_status, doc_quota from dispatch.tenants where id=$1", [principal.tenantId]);
      if (tq.rows[0]?.subscription_status !== "active") {
        const used = await client.query("select count(*)::int n from dispatch.documents where tenant_id=$1", [principal.tenantId]);
        if (used.rows[0].n >= (tq.rows[0]?.doc_quota ?? 3)) { const e = new Error("QUOTA_EXCEEDED"); e.code = "QUOTA_EXCEEDED"; throw e; }
      }
      // Persist document (governance lifecycle starts at 'submitted').
      const dres = await client.query(
        `insert into dispatch.documents (tenant_id, doc_type, title, classification, status, lifecycle_state, submitted_at, submitted_by, source_system, correlation_id, owner_user_id)
         values ($1,$2,$3,$4,'draft','submitted',now(),$5,$6,$7,$8) returning id`,
        [principal.tenantId, doc.docType, doc.metadata?.title || "", JSON.stringify(doc.classification || {}),
         principal.actor, body.source?.system || "internal", body.source?.correlationId || null, null]
      );
      const documentId = dres.rows[0].id;
      // Persist immutable version 1
      const vres = await client.query(
        `insert into dispatch.document_versions (tenant_id, document_id, version_no, ddm, ddm_version, template_id, template_version)
         values ($1,$2,1,$3,$4,$5,$6) returning id`,
        [principal.tenantId, documentId, JSON.stringify(doc), doc.ddmVersion, v.resolved?.template || null, v.resolved?.version || null]
      );
      const versionId = vres.rows[0].id;
      await client.query("update dispatch.documents set current_version=1 where id=$1", [documentId]);
      await writeAudit(client, { tenantId: principal.tenantId, actor: principal.actor, actorType: principal.principalType,
        action: "document.submitted", targetType: "document", targetId: documentId, requestId, correlationId: body.source?.correlationId });

      // Govern: resolve the approval policy. The machine (service) lane
      // auto-approves by default so existing integrations render immediately;
      // the human lane goes to review unless policy says otherwise.
      const policy = await resolvePolicy(client, { docType: doc.docType, classificationLevel: doc.classification?.level });
      if (autoApproves(policy, principal.principalType)) {
        assertTransition("submitted", "approved");
        await client.query("update dispatch.documents set lifecycle_state='approved', decided_at=now() where id=$1", [documentId]);
        await writeAudit(client, { tenantId: principal.tenantId, actor: "system", actorType: "system",
          action: "document.approved", targetType: "document", targetId: documentId, requestId, correlationId: body.source?.correlationId });
        const jobId = await createRenderJob(client, { principal, documentId, versionId, requestId, idem, outputs,
          correlationId: body.source?.correlationId || null, callbackUrl: body.delivery?.callbackUrl || null });
        return { replay: false, governed: false, jobId, requestId, documentId, versionId, lifecycle: "approved" };
      }
      // Awaiting human review: no render job yet (gated on approval).
      await client.query("update dispatch.documents set lifecycle_state='in_review' where id=$1", [documentId]);
      return { replay: false, governed: true, requestId, documentId, versionId, lifecycle: "in_review",
        requiredApprovals: policy.required_approvals };
    });

    if (result.governed) {
      return send(res, 202, { requestId: result.requestId, documentId: result.documentId, status: "in_review",
        lifecycle: result.lifecycle, requiredApprovals: result.requiredApprovals,
        message: "submitted for review; render is gated on approval", reviewUrl: `/v1/documents/${result.documentId}` });
    }
    return send(res, 202, { requestId: result.requestId, jobId: result.jobId, documentId: result.documentId,
      status: result.replay ? (result.state || "queued") : "queued", statusUrl: `/v1/jobs/${result.jobId}`, replay: !!result.replay });
  } catch (e) {
    if (e.code === "QUOTA_EXCEEDED") return send(res, 402, errEnvelope(requestId, 402, "QUOTA_EXCEEDED", "free plan document limit reached — subscribe to create more"));
    if (String(e.message).includes("idempotency")) return send(res, 409, errEnvelope(requestId, 409, "IDEMPOTENCY_CONFLICT", "duplicate idempotency key with different body"));
    console.error("documents error:", e);
    return send(res, 500, errEnvelope(requestId, 500, "ENGINE_ERROR", "internal error"));
  }
}

// Create a queued render job for an approved document version. Shared by the
// auto-approve lane (submit) and the human-approval lane (after quorum).
// `idem` may be a fresh uuid when minted post-approval.
async function createRenderJob(client, { principal, documentId, versionId, requestId, idem, outputs, correlationId, callbackUrl }) {
  const lane = principal.principalType === "user" ? "interactive" : "service";
  await client.query("update dispatch.documents set status='rendering' where id=$1", [documentId]);
  const jres = await client.query(
    `insert into dispatch.jobs (tenant_id, document_id, version_id, request_id, idempotency_key, lane, outputs, correlation_id, callback_url, state)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'queued') returning id`,
    [principal.tenantId, documentId, versionId, requestId, idem, lane, outputs, correlationId, callbackUrl]
  );
  const jobId = jres.rows[0].id;
  await writeAudit(client, { tenantId: principal.tenantId, actor: principal.actor, actorType: principal.principalType,
    action: "render.queued", targetType: "job", targetId: jobId, requestId, correlationId });
  return jobId;
}

// ---- Governance surface (approvals, publish, library, audit) ---------------
const govClaims = (p) => ({ tenant_id: p.tenantId, dispatch_role: p.role, principal_type: p.principalType, actor: p.actor });

// POST /v1/documents/{id}/decision  { decision: approve|reject|return, comment? }
// Records an immutable approval decision, evaluates quorum against policy, and
// advances lifecycle_state. On quorum-approve it creates the render job.
async function handleDecision(req, res, principal, documentId) {
  if (!hasScope(principal, "dispatch:approve"))
    return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "approve scope required"));
  let body;
  try { body = JSON.parse(await readBody(req)); }
  catch { return send(res, 400, errEnvelope(null, 400, "SCHEMA_INVALID", "invalid JSON body")); }
  const decision = body?.decision;
  if (!["approve", "reject", "return"].includes(decision))
    return send(res, 400, errEnvelope(null, 400, "BAD_DECISION", "decision must be approve|reject|return"));

  try {
    const out = await withClaims(pool, govClaims(principal), async (client) => {
      const d = await client.query(
        "select id, doc_type, title, classification, lifecycle_state, current_version, submitted_by, correlation_id from dispatch.documents where id=$1 and deleted_at is null", [documentId]);
      const docRow = d.rows[0];
      if (!docRow) return { http: 404, body: errEnvelope(null, 404, "NOT_FOUND", "document not found") };

      // Clearance: an approver must be cleared for the document's classification.
      const cl = clearanceAllows(principal.clearance, docRow.classification || {});
      if (!cl.allowed) { inc("clearance_denied_total"); return { http: 403, body: errEnvelope(null, 403, "INSUFFICIENT_CLEARANCE", cl.reason) }; }

      if (!["submitted", "in_review"].includes(docRow.lifecycle_state))
        return { http: 409, body: errEnvelope(null, 409, "NOT_IN_REVIEW", `document is '${docRow.lifecycle_state}', not awaiting review`) };

      // Separation of duties: the submitter cannot decide their own document.
      if (decision === "approve" && docRow.submitted_by && docRow.submitted_by === principal.actor)
        return { http: 403, body: errEnvelope(null, 403, "SELF_APPROVAL_FORBIDDEN", "submitter cannot approve their own document") };

      const versionNo = docRow.current_version;
      // Record the decision (immutable; unique per actor+version).
      try {
        await client.query(
          `insert into dispatch.approvals (tenant_id, document_id, version_no, decision, actor, actor_clearance, comment)
           values ($1,$2,$3,$4,$5,$6,$7)`,
          [principal.tenantId, documentId, versionNo, decision, principal.actor, principal.clearance || null, body.comment || null]);
      } catch (e) {
        if (String(e.message).includes("duplicate key"))
          return { http: 409, body: errEnvelope(null, 409, "ALREADY_DECIDED", "this approver already recorded a decision for this version") };
        throw e;
      }
      await writeAudit(client, { tenantId: principal.tenantId, actor: principal.actor, actorType: principal.principalType,
        action: `approval.${decision}`, targetType: "document", targetId: documentId, correlationId: docRow.correlation_id });

      // Re-evaluate quorum over all decisions for this version.
      const policy = await resolvePolicy(client, { docType: docRow.doc_type, classificationLevel: docRow.classification?.level });
      const all = await client.query("select decision, actor from dispatch.approvals where document_id=$1 and version_no=$2", [documentId, versionNo]);
      const q = evaluateQuorum(all.rows, policy, { submitter: docRow.submitted_by });

      if (q.outcome === "rejected") {
        assertTransition(docRow.lifecycle_state, "rejected");
        await client.query("update dispatch.documents set lifecycle_state='rejected', decided_at=now() where id=$1", [documentId]);
        return { http: 200, body: { documentId, decision, lifecycle: "rejected", approvals: q.approvals, required: q.required } };
      }
      if (q.outcome === "returned") {
        // back to draft for re-work (a new version on re-submit)
        await client.query("update dispatch.documents set lifecycle_state='draft' where id=$1", [documentId]);
        return { http: 200, body: { documentId, decision, lifecycle: "draft", approvals: q.approvals, required: q.required } };
      }
      if (q.outcome === "approved") {
        assertTransition(docRow.lifecycle_state === "submitted" ? "submitted" : "in_review", "approved");
        await client.query("update dispatch.documents set lifecycle_state='approved', decided_at=now() where id=$1", [documentId]);
        await writeAudit(client, { tenantId: principal.tenantId, actor: "system", actorType: "system",
          action: "document.approved", targetType: "document", targetId: documentId, correlationId: docRow.correlation_id });
        // Create the render job now that quorum is met.
        const versionId = (await client.query("select id from dispatch.document_versions where document_id=$1 and version_no=$2", [documentId, versionNo])).rows[0]?.id;
        const jobId = await createRenderJob(client, { principal, documentId, versionId, requestId: crypto.randomUUID(),
          idem: crypto.randomUUID(), outputs: body.outputs || ["pdf"], correlationId: docRow.correlation_id, callbackUrl: null });
        return { http: 200, body: { documentId, decision, lifecycle: "approved", approvals: q.approvals, required: q.required, jobId, statusUrl: `/v1/jobs/${jobId}` } };
      }
      // still pending more approvals
      if (docRow.lifecycle_state === "submitted")
        await client.query("update dispatch.documents set lifecycle_state='in_review' where id=$1", [documentId]);
      return { http: 200, body: { documentId, decision, lifecycle: "in_review", approvals: q.approvals, required: q.required } };
    });
    return send(res, out.http, out.body);
  } catch (e) {
    if (e.code === "ILLEGAL_TRANSITION") return send(res, 409, errEnvelope(null, 409, "ILLEGAL_TRANSITION", e.message));
    console.error("decision error:", e);
    return send(res, 500, errEnvelope(null, 500, "ENGINE_ERROR", "internal error"));
  }
}

// POST /v1/documents/{id}/publish   release a rendered document to the library
// POST /v1/documents/{id}/withdraw  pull a published document
async function handleLifecycleAction(req, res, principal, documentId, action) {
  if (!hasScope(principal, "dispatch:publish"))
    return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "publish scope required"));
  try {
    const out = await withClaims(pool, govClaims(principal), async (client) => {
      const d = await client.query("select id, classification, lifecycle_state, status, correlation_id from dispatch.documents where id=$1 and deleted_at is null", [documentId]);
      const docRow = d.rows[0];
      if (!docRow) return { http: 404, body: errEnvelope(null, 404, "NOT_FOUND", "document not found") };
      const cl = clearanceAllows(principal.clearance, docRow.classification || {});
      if (!cl.allowed) { inc("clearance_denied_total"); return { http: 403, body: errEnvelope(null, 403, "INSUFFICIENT_CLEARANCE", cl.reason) }; }

      if (action === "publish") {
        // A document is publishable once approved AND the render completed.
        if (docRow.lifecycle_state !== "rendered")
          return { http: 409, body: errEnvelope(null, 409, "NOT_RENDERED", `document is '${docRow.lifecycle_state}'; must be 'rendered' to publish`) };
        assertTransition("rendered", "published");
        const ret = await client.query("select retention_days from dispatch.tenants where id=$1", [principal.tenantId]);
        const days = ret.rows[0]?.retention_days || 365;
        await client.query("update dispatch.documents set lifecycle_state='published', published_at=now(), retention_until=now() + ($2 || ' days')::interval where id=$1", [documentId, String(days)]);
        await writeAudit(client, { tenantId: principal.tenantId, actor: principal.actor, actorType: principal.principalType,
          action: "document.published", targetType: "document", targetId: documentId, correlationId: docRow.correlation_id });
        return { http: 200, body: { documentId, lifecycle: "published" } };
      }
      // withdraw
      if (!["published", "rendered"].includes(docRow.lifecycle_state))
        return { http: 409, body: errEnvelope(null, 409, "NOT_WITHDRAWABLE", `document is '${docRow.lifecycle_state}'`) };
      assertTransition(docRow.lifecycle_state, "withdrawn");
      await client.query("update dispatch.documents set lifecycle_state='withdrawn', withdrawn_at=now() where id=$1", [documentId]);
      await writeAudit(client, { tenantId: principal.tenantId, actor: principal.actor, actorType: principal.principalType,
        action: "document.withdrawn", targetType: "document", targetId: documentId, correlationId: docRow.correlation_id });
      return { http: 200, body: { documentId, lifecycle: "withdrawn" } };
    });
    return send(res, out.http, out.body);
  } catch (e) {
    if (e.code === "ILLEGAL_TRANSITION") return send(res, 409, errEnvelope(null, 409, "ILLEGAL_TRANSITION", e.message));
    console.error("lifecycle error:", e);
    return send(res, 500, errEnvelope(null, 500, "ENGINE_ERROR", "internal error"));
  }
}

// GET /v1/approvals?state=pending  the approver inbox (documents awaiting review)
async function handleApprovalsInbox(res, principal, query) {
  if (!hasScope(principal, "dispatch:approve"))
    return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "approve scope required"));
  const rows = await withClaims(pool, govClaims(principal), async (c) => {
    const r = await c.query(
      `select id, doc_type, title, classification, lifecycle_state, current_version, submitted_at, submitted_by, correlation_id
         from dispatch.documents
        where deleted_at is null and lifecycle_state in ('submitted','in_review')
        order by submitted_at asc nulls last limit 200`);
    return r.rows;
  });
  // Filter out items the principal isn't cleared to see (no existence leak).
  const items = rows.filter((r) => clearanceAllows(principal.clearance, r.classification || {}).allowed)
    .map((r) => ({ documentId: r.id, docType: r.doc_type, title: r.title, classification: r.classification,
      lifecycle: r.lifecycle_state, version: r.current_version, submittedAt: r.submitted_at, submittedBy: r.submitted_by }));
  return send(res, 200, { items, count: items.length });
}

// GET /v1/documents?state=&docType=&q=&limit=  the library / queues
async function handleListDocuments(res, principal, query) {
  if (!hasScope(principal, "dispatch:read"))
    return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
  const state = query.get("state");
  const docType = query.get("docType");
  const q = query.get("q");
  const limit = Math.min(Number(query.get("limit") || 100), 500);
  const rows = await withClaims(pool, govClaims(principal), async (c) => {
    const where = ["deleted_at is null"]; const params = []; let i = 1;
    if (state) { where.push(`lifecycle_state = $${i++}`); params.push(state); }
    if (docType) { where.push(`doc_type = $${i++}`); params.push(docType); }
    if (q) { where.push(`title ilike $${i++}`); params.push(`%${q}%`); }
    params.push(limit);
    const r = await c.query(
      `select id, doc_type, title, classification, status, lifecycle_state, current_version,
              submitted_at, published_at, retention_until, correlation_id, created_at, updated_at
         from dispatch.documents where ${where.join(" and ")}
        order by updated_at desc limit $${i}`, params);
    return r.rows;
  });
  const items = rows.filter((r) => clearanceAllows(principal.clearance, r.classification || {}).allowed)
    .map((r) => ({ documentId: r.id, docType: r.doc_type, title: r.title, classification: r.classification,
      renderStatus: r.status, lifecycle: r.lifecycle_state, version: r.current_version,
      submittedAt: r.submitted_at, publishedAt: r.published_at, retentionUntil: r.retention_until,
      createdAt: r.created_at, updatedAt: r.updated_at }));
  return send(res, 200, { items, count: items.length });
}

// GET /v1/audit?target=&action=&limit=  append-only event trail (auditor)
async function handleAudit(res, principal, query) {
  if (!hasScope(principal, "dispatch:audit"))
    return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "audit scope required"));
  const target = query.get("target");
  const action = query.get("action");
  const limit = Math.min(Number(query.get("limit") || 200), 1000);
  const rows = await withClaims(pool, govClaims(principal), async (c) => {
    const where = ["tenant_id = $1"]; const params = [principal.tenantId]; let i = 2;
    if (target) { where.push(`target_id = $${i++}`); params.push(target); }
    if (action) { where.push(`action = $${i++}`); params.push(action); }
    params.push(limit);
    const r = await c.query(
      `select event_id, actor, actor_type, action, target_type, target_id, classification,
              request_id, correlation_id, sha256, ts
         from dispatch.audit_events where ${where.join(" and ")}
        order by ts desc limit $${i}`, params);
    return r.rows;
  });
  return send(res, 200, { events: rows.map((r) => ({ eventId: r.event_id, actor: r.actor, actorType: r.actor_type,
    action: r.action, targetType: r.target_type, targetId: r.target_id, classification: r.classification,
    requestId: r.request_id, correlationId: r.correlation_id, sha256: r.sha256, ts: r.ts })), count: rows.length });
}

// ---- Retrieve surface (Epic 8) ---------------------------------------------
// All reads run under the principal's tenant claim, so RLS returns 0 rows for a
// cross-tenant id → we surface 404 (never leak existence across tenants).
const claimsFor = (p) => ({ tenant_id: p.tenantId, dispatch_role: p.role, principal_type: p.principalType, actor: p.actor });

// ── Plans & billing ──────────────────────────────────────────────────────────
// Read a tenant's plan + usage. Downloads are gated on an active subscription;
// the free tier may create up to doc_quota documents and preview metadata.
async function tenantBilling(tenantId) {
  const claims = { tenant_id: tenantId, dispatch_role: "service", principal_type: "system", actor: "billing" };
  return withClaims(pool, claims, async (c) => {
    const t = await c.query("select plan, subscription_status, doc_quota from dispatch.tenants where id=$1", [tenantId]);
    const n = await c.query("select count(*)::int n from dispatch.documents where tenant_id=$1", [tenantId]);
    const row = t.rows[0] || {};
    return { plan: row.plan || "free", subscriptionStatus: row.subscription_status || "inactive", docQuota: row.doc_quota ?? 3, documentsUsed: n.rows[0]?.n ?? 0 };
  });
}
const billingView = (b) => ({ plan: b.plan, subscriptionStatus: b.subscriptionStatus, documentsUsed: b.documentsUsed,
  documentQuota: b.docQuota, quotaRemaining: Math.max(0, b.docQuota - b.documentsUsed), canDownload: b.subscriptionStatus === "active" });

// Public self-serve signup — create a FREE tenant + owner credential. No auth.
async function handleSignup(req, res) {
  let body; try { body = JSON.parse(await readBody(req)); }
  catch { return send(res, 400, errEnvelope(null, 400, "SCHEMA_INVALID", "invalid JSON body")); }
  try {
    const out = await withClaims(pool, { principal_type: "system" }, (c) => signupTenantTx(c, { name: body.name }));
    return send(res, 201, { tenantId: out.tenantId, client_id: out.clientId, secret: out.secret, plan: out.plan,
      scopes: out.scopes, note: "store the secret now — it is shown only once" });
  } catch (e) {
    if (e instanceof ProvisioningError) return send(res, 400, errEnvelope(null, 400, e.code, e.message));
    console.error("signup error:", e); return send(res, 500, errEnvelope(null, 500, "ENGINE_ERROR", "signup failed"));
  }
}

// Billing status + the (stubbed) subscribe action. The stub flips the tenant to
// active; swap the body of `subscribe` for a Stripe Checkout session + webhook.
async function handleBilling(req, res, principal, action) {
  if (action === "subscribe") {
    if (!hasScope(principal, "dispatch:admin")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "admin scope required"));
    await withClaims(pool, claimsFor(principal), (c) => c.query("select dispatch.set_subscription('active', $1)", ["stub_" + crypto.randomUUID()]));
    const b = await tenantBilling(principal.tenantId);
    return send(res, 200, { ...billingView(b), activated: true, note: "stub activation — wire Stripe Checkout + webhook here" });
  }
  return send(res, 200, billingView(await tenantBilling(principal.tenantId)));
}

// Institutional outcome counters for the console dashboard (real, tenant-scoped).
async function handleStats(req, res, principal) {
  const r = await withClaims(pool, claimsFor(principal), (c) => c.query("select * from dispatch.tenant_stats()"));
  const s = r.rows[0] || {};
  return send(res, 200, {
    officialRecords: Number(s.records || 0), artifactsGenerated: Number(s.artifacts || 0),
    approvalDecisions: Number(s.approvals || 0), auditEvents: Number(s.audit_events || 0),
    published: Number(s.published || 0),
  });
}

// ── Admin: tenant self-service for service-client credentials ────────────────
// Gated on dispatch:admin (a tenant_admin's JWT carries it). All writes run
// under the caller's claims, so RLS (M9) confines them to the caller's tenant.
// The raw secret is returned exactly once, at issue and at rotation.
async function handleAdminClients(req, res, principal, method, clientId, action) {
  if (!hasScope(principal, "dispatch:admin")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "admin scope required"));
  const actorType = principal.principalType === "service" ? "service" : "user";
  // The dispatch:admin gate above is the authority; express it to the DB as the
  // tenant_admin role so the M9 RLS policy authorises the write. This lets BOTH a
  // tenant_admin user and an admin-scoped service credential (the console signs in
  // with one) manage clients — the tenant_id claim keeps every write confined to
  // the caller's own tenant.
  const claims = { ...claimsFor(principal), dispatch_role: "tenant_admin" };
  try {
    if (method === "GET") {
      const clients = await withClaims(pool, claims, (c) => listClientsTx(c));
      return send(res, 200, { clients });
    }
    if (method === "POST" && !clientId) {
      let body; try { body = JSON.parse(await readBody(req)); }
      catch { return send(res, 400, errEnvelope(null, 400, "SCHEMA_INVALID", "invalid JSON body")); }
      const out = await withClaims(pool, claims, (c) => issueClientTx(c, {
        tenantId: principal.tenantId, name: body.name, scopes: body.scopes, clearance: body.clearance || "none",
        actor: principal.actor, actorType,
      }));
      return send(res, 201, { client_id: out.clientId, secret: out.secret, name: out.name, scopes: out.scopes,
        tenantId: principal.tenantId, note: "store the secret now — it is shown only once" });
    }
    if (method === "POST" && clientId && action === "rotate") {
      const out = await withClaims(pool, claims, (c) => rotateSecretTx(c, { tenantId: principal.tenantId, clientId, actor: principal.actor, actorType }));
      return send(res, 200, { client_id: out.clientId, secret: out.secret, note: "store the secret now — it is shown only once" });
    }
    if (method === "POST" && clientId && action === "revoke") {
      await withClaims(pool, claims, (c) => revokeClientTx(c, { tenantId: principal.tenantId, clientId, actor: principal.actor, actorType }));
      return send(res, 200, { client_id: clientId, revoked: true });
    }
    return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "not found"));
  } catch (e) {
    if (e instanceof ProvisioningError) {
      // The endpoint-level admin gate already returned 403 for an unauthorised
      // caller; any ProvisioningError here is a payload problem (400) except a
      // missing target (404).
      const status = e.code === "NOT_FOUND" ? 404 : 400;
      return send(res, status, errEnvelope(null, status, e.code, e.message));
    }
    throw e;
  }
}

async function handleGetJob(res, principal, jobId) {
  if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
  const row = await withClaims(pool, claimsFor(principal), async (c) => {
    // Join the document classification so the job (which carries artifact refs in
    // its result) is gated by the same clearance rule as the artifacts.
    const r = await c.query(
      `select j.id, j.request_id, j.state, j.progress, j.result, j.error, j.created_at, j.updated_at,
              d.classification as doc_classification
         from dispatch.jobs j
         left join dispatch.documents d on d.id = j.document_id
        where j.id = $1`, [jobId]);
    return r.rows[0] || null;
  });
  if (!row) return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "job not found"));
  const jcl = clearanceAllows(principal.clearance, row.doc_classification || {});
  if (!jcl.allowed) { inc("clearance_denied_total"); return send(res, 403, errEnvelope(null, 403, "INSUFFICIENT_CLEARANCE", jcl.reason)); }
  return send(res, 200, {
    jobId: row.id, requestId: row.request_id, status: row.state, progress: row.progress,
    result: row.result || null, error: row.error || null,
    createdAt: row.created_at, updatedAt: row.updated_at,
  });
}

async function handleGetDocument(res, principal, documentId) {
  if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
  const data = await withClaims(pool, claimsFor(principal), async (c) => {
    const d = await c.query("select id, doc_type, title, classification, status, current_version, correlation_id, created_at, updated_at from dispatch.documents where id=$1 and deleted_at is null", [documentId]);
    if (!d.rows[0]) return null;
    const vs = await c.query("select version_no, ddm_version, template_id, template_version, engine_version, created_at from dispatch.document_versions where document_id=$1 order by version_no", [documentId]);
    const latest = await c.query("select result from dispatch.jobs where document_id=$1 and result is not null order by updated_at desc limit 1", [documentId]);
    return { doc: d.rows[0], versions: vs.rows, latestResult: latest.rows[0]?.result || null };
  });
  if (!data) return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "document not found"));
  const { doc, versions, latestResult } = data;
  const dcl = clearanceAllows(principal.clearance, doc.classification || {});
  if (!dcl.allowed) { inc("clearance_denied_total"); return send(res, 403, errEnvelope(null, 403, "INSUFFICIENT_CLEARANCE", dcl.reason)); }
  return send(res, 200, {
    id: doc.id, docType: doc.doc_type, title: doc.title, status: doc.status,
    currentVersion: doc.current_version, correlationId: doc.correlation_id,
    versions: versions.map((v) => ({ versionNo: v.version_no, ddmVersion: v.ddm_version,
      template: v.template_id, templateVersion: v.template_version, engineVersion: v.engine_version, createdAt: v.created_at })),
    latestResult, createdAt: doc.created_at, updatedAt: doc.updated_at,
  });
}

async function handleGetArtifact(req, res, principal, artifactId, query) {
  // Two ways to read an artifact:
  //  - principal with dispatch:read (Authorization), or
  //  - a single-artifact download grant (?grant=) minted by POST .../grant.
  // The grant path is for browser <a> downloads — scoped to one artifact, short
  // TTL, NOT render-capable — so a leaked URL exposes only this file briefly.
  let claims;
  if (principal) {
    if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
    claims = claimsFor(principal);
  } else {
    const g = verifyDownloadGrant(query.get("grant") || "", artifactId);
    if (g.error) return send(res, g.error.status, errEnvelope(null, g.error.status, g.error.code, g.error.message));
    claims = { tenant_id: g.tenantId, dispatch_role: "service", principal_type: "service", actor: "download-grant" };
  }
  const row = await withClaims(pool, claims, async (c) => {
    // Pull the document's full classification ({scheme,level}) for clearance gating.
    const r = await c.query(
      `select a.id, a.format, a.storage_ref, a.sha256, a.size_bytes, a.pages, a.classification, a.expires_at,
              d.classification as doc_classification
         from dispatch.artifacts a
         join dispatch.document_versions v on v.id = a.version_id
         join dispatch.documents d on d.id = v.document_id
        where a.id = $1`, [artifactId]);
    return r.rows[0] || null;
  });
  if (!row) return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "artifact not found"));
  if (row.expires_at && new Date(row.expires_at) < new Date())
    return send(res, 410, errEnvelope(null, 410, "ARTIFACT_EXPIRED", "artifact past expiry"));
  // Clearance gate (principal path only — a grant was already cleared at mint).
  if (principal) {
    const cl = clearanceAllows(principal.clearance, row.doc_classification || {});
    if (!cl.allowed) { inc("clearance_denied_total"); return send(res, 403, errEnvelope(null, 403, "INSUFFICIENT_CLEARANCE", cl.reason)); }
  }

  // ?disposition=metadata → ArtifactRef JSON (no bytes)
  if (query.get("disposition") === "metadata") {
    return send(res, 200, { artifactId: row.id, role: "primary", format: row.format, sizeBytes: Number(row.size_bytes),
      pages: row.pages, sha256: row.sha256, classification: row.classification, storage: "signed_url", expiresAt: row.expires_at });
  }

  // Download paywall: the free tier can create + preview metadata, but pulling the
  // bytes requires an active subscription. (Metadata disposition returned above.)
  if (!billingView(await tenantBilling(claims.tenant_id)).canDownload) {
    return send(res, 402, errEnvelope(null, 402, "PAYMENT_REQUIRED", "downloading records requires an active subscription"));
  }

  // Not expired (checked above): bytes should exist. A read failure here is a
  // storage/integrity problem, NOT expiry — surface it distinctly (don't mask as 410).
  let bytes;
  try { bytes = await getArtifact(row.storage_ref); }
  catch { return send(res, 500, errEnvelope(null, 500, "ARTIFACT_UNAVAILABLE", "artifact bytes could not be read from storage")); }

  // ?verify=true → recompute + confirm checksum
  if (query.get("verify") === "true") {
    const actual = sha256Of(bytes);
    return send(res, 200, { artifactId: row.id, sha256: row.sha256, verified: actual === row.sha256, actual });
  }

  await withClaims(pool, claims, (c) => writeAudit(c, { tenantId: claims.tenant_id,
    actor: claims.actor, actorType: claims.principal_type, action: "artifact.downloaded",
    targetType: "artifact", targetId: row.id, sha256: row.sha256 }));
  res.writeHead(200, { "content-type": CONTENT_TYPE[row.format] || "application/octet-stream",
    "content-disposition": `attachment; filename="${row.id}.${row.format}"`,
    "content-length": bytes.length, "x-dispatch-sha256": row.sha256 });
  res.end(bytes);
}

const server = http.createServer(async (req, res) => {
  const t0 = Date.now();
  const reqId = crypto.randomUUID();
  let routePath = "?";
  res.on("finish", () => {
    inc("api_requests_total");
    inc(`api_status_${Math.floor(res.statusCode / 100)}xx`);
    observe("api_request_ms", Date.now() - t0);
    if (res.statusCode >= 500) inc("api_errors_total");
    log.info({ service: "api", requestId: reqId, method: req.method, path: routePath, status: res.statusCode, durationMs: Date.now() - t0 });
  });
  try {
    applyCors(req, res);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;
    routePath = path.replace(/\/v1\/(jobs|artifacts|documents)\/[^/]+/, "/v1/$1/:id"); // low-cardinality label
    if (req.method === "GET" && path === "/v1/health") return send(res, 200, { ok: true, engineVersion: ENGINE_VERSION });
    if (req.method === "GET" && path === "/v1/version") return send(res, 200, { engineVersion: ENGINE_VERSION, schemaVersion: "1.0" });
    if (req.method === "GET" && path === "/v1/metrics") return send(res, 200, snapshot());

    // Governance GET surface (auth required, tenant-scoped).
    if (req.method === "GET" && (path === "/v1/approvals" || path === "/v1/documents" || path === "/v1/audit")) {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      if (path === "/v1/approvals") return await handleApprovalsInbox(res, auth.principal, url.searchParams);
      if (path === "/v1/documents") return await handleListDocuments(res, auth.principal, url.searchParams);
      if (path === "/v1/audit") return await handleAudit(res, auth.principal, url.searchParams);
    }

    // Admin: list this tenant's service clients (auth + dispatch:admin).
    if (req.method === "GET" && path === "/v1/admin/clients") {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      return await handleAdminClients(req, res, auth.principal, "GET");
    }

    // Billing status — the caller tenant's plan, usage and download eligibility.
    if (req.method === "GET" && path === "/v1/billing") {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      return await handleBilling(req, res, auth.principal, "status");
    }

    // Institutional outcome counters for the dashboard.
    if (req.method === "GET" && path === "/v1/stats") {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      return await handleStats(req, res, auth.principal);
    }

    // Dispatch console (Epic 9) — static page; no auth (it authenticates client-side).
    if (req.method === "GET" && (path === "/" || path === "/console")) {
      const html = consoleHtml();
      if (!html) return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "console unavailable"));
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(html);
    }
    if (req.method === "GET" && path === "/favicon.ico") { res.writeHead(204); return res.end(); }

    // GET retrieve surface (Epic 8) — auth required, tenant-scoped.
    const getMatch = req.method === "GET" && /^\/v1\/(jobs|artifacts|documents)\/([A-Za-z0-9-]+)$/.exec(path);
    if (getMatch) {
      const [, kind, id] = getMatch;
      // Artifact download via a single-artifact grant: no principal auth needed
      // (the grant itself is the capability). Verified inside handleGetArtifact.
      if (kind === "artifacts" && url.searchParams.get("grant")) {
        return await handleGetArtifact(req, res, null, id, url.searchParams);
      }
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      if (kind === "jobs") return await handleGetJob(res, auth.principal, id);
      if (kind === "documents") return await handleGetDocument(res, auth.principal, id);
      if (kind === "artifacts") return await handleGetArtifact(req, res, auth.principal, id, url.searchParams);
    }

    if (req.method !== "POST") return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "not found"));

    // Client-credentials: exchange svc client_id/secret for a short-lived JWT (R2).
    if (path === "/v1/token") {
      let cbody;
      try { cbody = JSON.parse(await readBody(req)); }
      catch { return send(res, 400, errEnvelope(null, 400, "SCHEMA_INVALID", "invalid JSON body")); }
      const ex = await resolvePrincipal(pool, `svc ${cbody.client_id || ""}:${cbody.secret || ""}`, withAdmin);
      if (ex.error) return send(res, ex.error.status, errEnvelope(null, ex.error.status, ex.error.code, ex.error.message));
      const minted = mintServiceToken(ex.principal);
      if (minted.error) return send(res, minted.error.status, errEnvelope(null, minted.error.status, minted.error.code, minted.error.message));
      // Expose both `token` (legacy) and `access_token` (OAuth2-standard) so the
      // console/SDKs can use the conventional field name.
      return send(res, 200, { ...minted, access_token: minted.token, tenantId: ex.principal.tenantId, scopes: ex.principal.scopes });
    }

    // Public self-serve signup — create a FREE tenant + owner credential (no auth).
    if (path === "/v1/signup") return await handleSignup(req, res);

    const auth = await resolvePrincipal(pool, req.headers["authorization"], withAdmin);
    if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
    const principal = auth.principal;

    if (path === "/v1/validate") return await handleValidate(req, res, principal);
    if (path === "/v1/documents") return await handleDocuments(req, res, principal);

    // Billing: subscribe (stub) — flips the tenant to paid and unlocks downloads.
    if (path === "/v1/billing/subscribe") return await handleBilling(req, res, principal, "subscribe");

    // Admin: issue / rotate / revoke this tenant's service clients (dispatch:admin).
    if (path === "/v1/admin/clients") return await handleAdminClients(req, res, principal, "POST");
    const adminMatch = /^\/v1\/admin\/clients\/([A-Za-z0-9_-]+)\/(rotate|revoke)$/.exec(path);
    if (adminMatch) return await handleAdminClients(req, res, principal, "POST", adminMatch[1], adminMatch[2]);

    // Governance actions on a document: decision (approve/reject/return),
    // publish, withdraw.
    const govMatch = /^\/v1\/documents\/([A-Za-z0-9-]+)\/(decision|publish|withdraw)$/.exec(path);
    if (govMatch) {
      const [, id, action] = govMatch;
      if (action === "decision") return await handleDecision(req, res, principal, id);
      return await handleLifecycleAction(req, res, principal, id, action);
    }

    // Mint a single-artifact download grant (Epic-10 hardening): the artifact must
    // belong to the principal's tenant (RLS-checked) and the principal needs read.
    const grantMatch = /^\/v1\/artifacts\/([A-Za-z0-9-]+)\/grant$/.exec(path);
    if (grantMatch) {
      const id = grantMatch[1];
      if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
      const arow = await withClaims(pool, claimsFor(principal), async (c) => {
        const r = await c.query(
          `select a.id, d.classification as doc_classification
             from dispatch.artifacts a
             join dispatch.document_versions v on v.id = a.version_id
             join dispatch.documents d on d.id = v.document_id
            where a.id = $1`, [id]);
        return r.rows[0] || null;
      });
      if (!arow) return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "artifact not found"));
      // Enforce clearance at mint time so a grant can't bypass the gate.
      const gcl = clearanceAllows(principal.clearance, arow.doc_classification || {});
      if (!gcl.allowed) { inc("clearance_denied_total"); return send(res, 403, errEnvelope(null, 403, "INSUFFICIENT_CLEARANCE", gcl.reason)); }
      // Download paywall — a grant is a download, so it too requires a subscription.
      if (!billingView(await tenantBilling(principal.tenantId)).canDownload) return send(res, 402, errEnvelope(null, 402, "PAYMENT_REQUIRED", "downloading records requires an active subscription"));
      const g = mintDownloadGrant(principal, id);
      if (g.error) return send(res, g.error.status, errEnvelope(null, g.error.status, g.error.code, g.error.message));
      return send(res, 200, { downloadUrl: `/v1/artifacts/${id}?grant=${encodeURIComponent(g.token)}`, expiresIn: g.expiresIn });
    }
    return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "not found"));
  } catch (e) {
    console.error("server error:", e);
    return send(res, 500, errEnvelope(null, 500, "ENGINE_ERROR", String(e.message)));
  }
});

const PORT = Number(process.env.PORT || 8787);
server.listen(PORT, () => console.log(`dispatch-api listening on :${PORT}`));
export { server };
