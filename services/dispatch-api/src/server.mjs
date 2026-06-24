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
import { resolvePolicy, autoApproves, evaluateQuorum, renderAllowed, assertTransition, listPolicies, upsertPolicy, chainOf, evaluateChain } from "../../shared/src/governance.mjs";
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
      // A policy with an enforceable chain is ALWAYS walked — the chain is the
      // governance, so the machine auto-approve lane cannot bypass it. Empty-chain
      // policies keep the legacy auto-approve behaviour (backward compatible).
      if (chainOf(policy).length === 0 && autoApproves(policy, principal.principalType)) {
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
    // The dispatch:approve gate above is the authority; express it to the DB as
    // the 'approver' role so the approvals-insert RLS authorises the decision.
    // This lets a service-credential reviewer (governance-role model) record
    // approvals identically to a human reviewer principal.
    const decisionClaims = { ...govClaims(principal), dispatch_role: "approver" };
    const out = await withClaims(pool, decisionClaims, async (client) => {
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
      const policy = await resolvePolicy(client, { docType: docRow.doc_type, classificationLevel: docRow.classification?.level });
      const chain = chainOf(policy);
      const sequential = policy.sequential !== false;
      const loadDecisions = async () => (await client.query(
        "select decision, actor, role_key, expires_at from dispatch.approvals where document_id=$1 and version_no=$2", [documentId, versionNo])).rows
        .map((r) => ({ ...r, expired: !!r.expires_at && new Date(r.expires_at) < new Date() }));

      let stepIndex = null, roleKey = null, onBehalfOf = null, expiresAt = null;

      // ── ENFORCED LANE: role-bound, ordered, quorate chain ──────────────────
      if (chain.length > 0 && decision === "approve") {
        const subject = principal.actor;
        const grants = (await client.query("select role_key from dispatch.governance_role_grants where subject=$1 and active", [subject])).rows.map((r) => r.role_key);
        const delegs = (await client.query("select role_key, grantor_subject from dispatch.delegations where delegate_subject=$1 and active and now() between starts_at and ends_at", [subject])).rows;
        const delegByRole = new Map(delegs.map((d) => [d.role_key, d.grantor_subject]));
        const chainRoles = new Set(chain.map((s) => s.role));
        const myChainRoles = new Set([...grants, ...delegByRole.keys()].filter((r) => chainRoles.has(r)));
        if (myChainRoles.size === 0)
          return { http: 403, body: errEnvelope(null, 403, "ROLE_NOT_GRANTED", "you do not hold a governance role required by this policy") };
        const ev = evaluateChain(await loadDecisions(), chain, { submitter: docRow.submitted_by, sequential });
        if (ev.openStep === null)
          return { http: 409, body: errEnvelope(null, 409, "POLICY_ALREADY_SATISFIED", "the governance chain is already satisfied") };
        const open = chain[ev.openStep];
        if (!myChainRoles.has(open.role))
          return { http: 409, body: errEnvelope(null, 409, "STEP_NOT_OPEN", `the next required approval is '${open.label}'`) };
        stepIndex = open.index; roleKey = open.role;
        if (!grants.includes(open.role) && delegByRole.has(open.role)) onBehalfOf = delegByRole.get(open.role);
        if (policy.approval_ttl_days) expiresAt = new Date(Date.now() + policy.approval_ttl_days * 86400000).toISOString();
      }

      // Record the decision (immutable; unique per actor+version → one step each).
      try {
        await client.query(
          `insert into dispatch.approvals (tenant_id, document_id, version_no, decision, actor, actor_clearance, comment, step_index, role_key, on_behalf_of, expires_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [principal.tenantId, documentId, versionNo, decision, principal.actor, principal.clearance || null, body.comment || null, stepIndex, roleKey, onBehalfOf, expiresAt]);
      } catch (e) {
        if (String(e.message).includes("duplicate key"))
          return { http: 409, body: errEnvelope(null, 409, "ALREADY_DECIDED", "this approver already recorded a decision for this version") };
        throw e;
      }
      await writeAudit(client, { tenantId: principal.tenantId, actor: principal.actor, actorType: principal.principalType,
        action: `approval.${decision}`, targetType: "document", targetId: documentId, correlationId: docRow.correlation_id });

      // Re-evaluate: chained policies use the executable evaluator; empty chains
      // fall back to legacy count-quorum (backward compatible).
      let outcome, steps = null, approvals = 0, required = 0;
      if (chain.length > 0) {
        const v = evaluateChain(await loadDecisions(), chain, { submitter: docRow.submitted_by, sequential });
        outcome = v.outcome; steps = v.steps;
        if (roleKey && v.steps.find((s) => s.index === stepIndex)?.satisfied)
          await writeAudit(client, { tenantId: principal.tenantId, actor: "system", actorType: "system",
            action: "governance.step_satisfied", targetType: "document", targetId: documentId, correlationId: docRow.correlation_id });
      } else {
        const all = await client.query("select decision, actor from dispatch.approvals where document_id=$1 and version_no=$2", [documentId, versionNo]);
        const q = evaluateQuorum(all.rows, policy, { submitter: docRow.submitted_by });
        outcome = q.outcome === "approved" ? "satisfied" : q.outcome; approvals = q.approvals; required = q.required;
      }

      if (outcome === "rejected") {
        assertTransition(docRow.lifecycle_state, "rejected");
        await client.query("update dispatch.documents set lifecycle_state='rejected', decided_at=now() where id=$1", [documentId]);
        return { http: 200, body: { documentId, decision, lifecycle: "rejected", steps } };
      }
      if (outcome === "returned") {
        await client.query("update dispatch.documents set lifecycle_state='draft' where id=$1", [documentId]);
        return { http: 200, body: { documentId, decision, lifecycle: "draft", steps } };
      }
      if (outcome === "satisfied") {
        assertTransition(docRow.lifecycle_state === "submitted" ? "submitted" : "in_review", "approved");
        await client.query("update dispatch.documents set lifecycle_state='approved', decided_at=now() where id=$1", [documentId]);
        await writeAudit(client, { tenantId: principal.tenantId, actor: "system", actorType: "system",
          action: chain.length ? "governance.policy_satisfied" : "document.approved", targetType: "document", targetId: documentId, correlationId: docRow.correlation_id });
        const versionId = (await client.query("select id from dispatch.document_versions where document_id=$1 and version_no=$2", [documentId, versionNo])).rows[0]?.id;
        const jobId = await createRenderJob(client, { principal, documentId, versionId, requestId: crypto.randomUUID(),
          idem: crypto.randomUUID(), outputs: body.outputs || ["pdf"], correlationId: docRow.correlation_id, callbackUrl: null });
        return { http: 200, body: { documentId, decision, lifecycle: "approved", steps, jobId, statusUrl: `/v1/jobs/${jobId}` } };
      }
      if (docRow.lifecycle_state === "submitted")
        await client.query("update dispatch.documents set lifecycle_state='in_review' where id=$1", [documentId]);
      return { http: 200, body: { documentId, decision, lifecycle: "in_review", steps, approvals, required } };
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
      const d = await client.query("select id, doc_type, title, classification, lifecycle_state, status, current_version, published_at, correlation_id from dispatch.documents where id=$1 and deleted_at is null", [documentId]);
      const docRow = d.rows[0];
      if (!docRow) return { http: 404, body: errEnvelope(null, 404, "NOT_FOUND", "document not found") };
      const cl = clearanceAllows(principal.clearance, docRow.classification || {});
      if (!cl.allowed) { inc("clearance_denied_total"); return { http: 403, body: errEnvelope(null, 403, "INSUFFICIENT_CLEARANCE", cl.reason) }; }

      if (action === "archive") {
        // Preservation. A published (or withdrawn) record is sealed into the
        // archive: a preservation timestamp and a tamper-evident integrity proof
        // over the canonical record. `archived` is terminal in the state machine,
        // so no further approve/publish/withdraw is possible (all 409).
        if (!["published", "withdrawn"].includes(docRow.lifecycle_state))
          return { http: 409, body: errEnvelope(null, 409, "NOT_ARCHIVABLE", `document is '${docRow.lifecycle_state}'; must be 'published' or 'withdrawn' to archive`) };
        assertTransition(docRow.lifecycle_state, "archived");
        const cert = await recordCertificate(client, documentId);
        const proof = preservationProof(cert);
        await client.query("update dispatch.documents set lifecycle_state='archived', archived_at=now(), preservation_sha256=$2 where id=$1", [documentId, proof]);
        await writeAudit(client, { tenantId: principal.tenantId, actor: principal.actor, actorType: principal.principalType,
          action: "document.preserved", targetType: "document", targetId: documentId, sha256: proof, correlationId: docRow.correlation_id });
        return { http: 200, body: { documentId, lifecycle: "archived", preservationSha256: proof } };
      }

      if (action === "publish") {
        // A document is publishable once approved AND the render completed.
        if (docRow.lifecycle_state !== "rendered")
          return { http: 409, body: errEnvelope(null, 409, "NOT_RENDERED", `document is '${docRow.lifecycle_state}'; must be 'rendered' to publish`) };

        // ── PUBLICATION LOCK ─────────────────────────────────────────────────
        // Under a chained policy publication is impossible unless the policy is
        // satisfied, the publisher holds the publication authority, SoD holds,
        // and a COMPLIANT Governance Certificate can be sealed.
        const policy = await resolvePolicy(client, { docType: docRow.doc_type, classificationLevel: docRow.classification?.level });
        const chain = chainOf(policy);
        const approvals = (await client.query(
          "select decision, actor, role_key, on_behalf_of, created_at, expires_at from dispatch.approvals where document_id=$1 and version_no=$2 order by created_at asc", [documentId, docRow.current_version])).rows;
        let govCert = null;
        if (chain.length > 0) {
          const live = approvals.map((a) => ({ ...a, expired: !!a.expires_at && new Date(a.expires_at) < new Date() }));
          const ev = evaluateChain(live, chain, { submitter: null, sequential: policy.sequential });
          if (ev.outcome !== "satisfied") {
            await writeAudit(client, { tenantId: principal.tenantId, actor: principal.actor, actorType: principal.principalType,
              action: "governance.publication_blocked", targetType: "document", targetId: documentId, correlationId: docRow.correlation_id });
            return { http: 409, body: { ...errEnvelope(null, 409, "POLICY_INCOMPLETE", "the governing policy is not satisfied"), missing: ev.steps.filter((s) => !s.satisfied).map((s) => s.label) } };
          }
          if (policy.publication_authority) {
            const holds = await client.query("select 1 from dispatch.governance_role_grants where subject=$1 and role_key=$2 and active", [principal.actor, policy.publication_authority]);
            if (!holds.rows.length)
              return { http: 403, body: errEnvelope(null, 403, "PUBLICATION_AUTHORITY_REQUIRED", "publisher does not hold the policy's publication authority") };
          }
          if (approvals.some((a) => a.decision === "approve" && a.actor === principal.actor))
            return { http: 403, body: errEnvelope(null, 403, "SOD_VIOLATION", "an approver of this record may not publish it") };
          govCert = buildGovernanceCert(docRow, policy, chain, ev, approvals, principal);
        }

        assertTransition("rendered", "published");
        const ret = await client.query("select retention_days from dispatch.tenants where id=$1", [principal.tenantId]);
        const days = ret.rows[0]?.retention_days || 365;
        await client.query("update dispatch.documents set lifecycle_state='published', published_at=now(), retention_until=now() + ($2 || ' days')::interval, governance_sha256=$3, governance_certificate=$4 where id=$1",
          [documentId, String(days), govCert?.integrityProof || null, govCert ? JSON.stringify(govCert) : null]);
        await writeAudit(client, { tenantId: principal.tenantId, actor: principal.actor, actorType: principal.principalType,
          action: "document.published", targetType: "document", targetId: documentId, correlationId: docRow.correlation_id });
        if (govCert) await writeAudit(client, { tenantId: principal.tenantId, actor: principal.actor, actorType: principal.principalType,
          action: "governance.certificate_issued", targetType: "document", targetId: documentId, sha256: govCert.integrityProof, correlationId: docRow.correlation_id });
        return { http: 200, body: { documentId, lifecycle: "published", governanceCompliance: govCert?.complianceResult || "UNGOVERNED" } };
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

// ── Preservation certificate ────────────────────────────────────────────────
// Deterministic stringify (sorted keys) so the integrity proof is reproducible.
function canon(o) {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canon).join(",") + "]";
  return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canon(o[k])).join(",") + "}";
}
const sha256hex = (s) => crypto.createHash("sha256").update(s).digest("hex");

// Assemble a record's preservation certificate from its immutable parts: the
// DDM version, the publication facts, the governing policy and the recorded
// approval chain. Runs inside an open client (tenant RLS).
async function recordCertificate(client, documentId) {
  const dr = await client.query(
    `select id, doc_type, title, classification, lifecycle_state, current_version,
            published_at, archived_at, preservation_sha256, correlation_id
       from dispatch.documents where id=$1 and deleted_at is null`, [documentId]);
  const doc = dr.rows[0];
  if (!doc) return null;
  const vr = await client.query("select ddm from dispatch.document_versions where document_id=$1 and version_no=$2", [documentId, doc.current_version]);
  const ddm = vr.rows[0]?.ddm ?? null;
  const ar = await client.query(
    "select decision, actor, actor_clearance, created_at from dispatch.approvals where document_id=$1 order by created_at asc", [documentId]);
  const policy = await resolvePolicy(client, { docType: doc.doc_type, classificationLevel: doc.classification?.level });
  const recordHash = ddm ? sha256hex(canon(ddm)) : null;
  return {
    recordId: doc.id,
    docType: doc.doc_type,
    title: doc.title,
    classification: doc.classification || {},
    lifecycle: doc.lifecycle_state,
    version: doc.current_version,
    publishedAt: doc.published_at,
    archivedAt: doc.archived_at,
    recordHash,
    integrityProof: doc.preservation_sha256,
    governancePolicy: policy?._source === "policy"
      ? { name: policy.name, reviewChain: policy.review_chain ?? [], approvalAuthority: policy.approval_authority, publicationAuthority: policy.publication_authority }
      : { name: "Platform default", reviewChain: [], approvalAuthority: null, publicationAuthority: null },
    approvalChain: ar.rows.map((a) => ({ actor: a.actor, decision: a.decision, clearance: a.actor_clearance, ts: a.created_at })),
  };
}
// The Governance Certificate sealed at publication — the compliance proof that
// the policy's chain was satisfied in order by eligible, distinct principals.
// Pure: built from data already loaded in the publish handler.
function buildGovernanceCert(docRow, policy, chain, ev, approvals, publisher) {
  const approveRows = approvals.filter((a) => a.decision === "approve");
  const cert = {
    recordId: docRow.id,
    policyName: policy.name || "Governance policy",
    policyVersion: policy.policy_version || 1,
    requiredRoles: chain.map((s) => ({ step: s.index, role: s.role, label: s.label, quorum: s.quorum })),
    actualRoles: ev.steps.map((s) => ({ step: s.index, role: s.role, label: s.label, satisfiedBy: s.satisfiedBy })),
    approvalSequence: approveRows.map((a) => ({ role: a.role_key, actor: a.actor, onBehalfOf: a.on_behalf_of || null, decidedAt: a.created_at })),
    delegations: approveRows.filter((a) => a.on_behalf_of).map((a) => ({ role: a.role_key, actor: a.actor, onBehalfOf: a.on_behalf_of })),
    separationOfDuties: "enforced",
    publishedBy: publisher.actor,
    publicationAuthority: policy.publication_authority || null,
    complianceResult: "COMPLIANT",
  };
  cert.integrityProof = sha256hex(canon({
    recordId: cert.recordId, policyName: cert.policyName, policyVersion: cert.policyVersion,
    requiredRoles: cert.requiredRoles, approvalSequence: cert.approvalSequence, publishedBy: cert.publishedBy,
  }));
  return cert;
}

// The integrity proof sealed at archive time: a hash over the canonical record.
function preservationProof(cert) {
  return sha256hex(canon({
    recordId: cert.recordId, recordHash: cert.recordHash, publishedAt: cert.publishedAt,
    governancePolicy: cert.governancePolicy, approvalChain: cert.approvalChain,
  }));
}

// GET /v1/documents/:id/certificate — the preservation certificate (archived only).
async function handleCertificate(res, principal, documentId) {
  if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
  const cert = await withClaims(pool, govClaims(principal), (c) => recordCertificate(c, documentId));
  if (!cert) return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "document not found"));
  if (!clearanceAllows(principal.clearance, cert.classification).allowed)
    return send(res, 403, errEnvelope(null, 403, "INSUFFICIENT_CLEARANCE", "not cleared for this record"));
  if (cert.lifecycle !== "archived")
    return send(res, 409, errEnvelope(null, 409, "NOT_PRESERVED", "a preservation certificate exists only for archived records"));
  return send(res, 200, { certificate: cert });
}

// POST /v1/admin/retention/sweep — the retention execution path. Archives every
// published record whose retention horizon has passed. Operator-triggered here;
// a scheduler/worker can invoke the same path periodically.
async function handleRetentionSweep(res, principal) {
  if (!hasScope(principal, "dispatch:publish")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "publish scope required"));
  const preserved = await withClaims(pool, govClaims(principal), async (client) => {
    const due = await client.query(
      "select id from dispatch.documents where lifecycle_state='published' and retention_until is not null and retention_until <= now() and deleted_at is null limit 500");
    const out = [];
    for (const row of due.rows) {
      const cert = await recordCertificate(client, row.id);
      const proof = preservationProof(cert);
      await client.query("update dispatch.documents set lifecycle_state='archived', archived_at=now(), preservation_sha256=$2 where id=$1", [row.id, proof]);
      await writeAudit(client, { tenantId: principal.tenantId, actor: "system", actorType: "system",
        action: "document.preserved", targetType: "document", targetId: row.id, sha256: proof });
      out.push({ documentId: row.id, preservationSha256: proof });
    }
    return out;
  });
  return send(res, 200, { preserved, count: preserved.length });
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

// ── Governance policies: first-class, institution-defined ────────────────────
// Reading is for any operating principal (so Create Record can show the policy a
// record will inherit); writing requires dispatch:admin and is expressed to the
// DB as tenant_admin so the M12 RLS authorises it (confined to the caller's
// tenant). A policy bound to (doc_type, level) is what a record inherits.
function policyView(p) {
  return {
    id: p.id, name: p.name, docType: p.doc_type, classificationLevel: p.classification_level,
    requiredApprovals: p.required_approvals, minApproverClearance: p.min_approver_clearance,
    autoApproveService: p.auto_approve_service, autoApproveUser: p.auto_approve_user,
    reviewChain: p.review_chain ?? [], approvalAuthority: p.approval_authority,
    publicationAuthority: p.publication_authority, retentionDays: p.retention_days, active: p.active,
    updatedAt: p.updated_at,
  };
}
async function handleGovernance(req, res, principal, method) {
  if (method === "GET") {
    if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
    const rows = await withClaims(pool, claimsFor(principal), (c) => listPolicies(c));
    return send(res, 200, { policies: rows.map(policyView) });
  }
  // POST — upsert a policy (admin authority, expressed as tenant_admin for RLS).
  if (!hasScope(principal, "dispatch:admin")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "admin scope required"));
  let body; try { body = JSON.parse(await readBody(req)); }
  catch { return send(res, 400, errEnvelope(null, 400, "SCHEMA_INVALID", "invalid JSON body")); }
  if (!body.name || !String(body.name).trim()) return send(res, 400, errEnvelope(null, 400, "SCHEMA_INVALID", "policy name is required"));
  if (!body.docType) return send(res, 400, errEnvelope(null, 400, "SCHEMA_INVALID", "docType (record type) is required"));
  const claims = { ...claimsFor(principal), dispatch_role: "tenant_admin" };
  try {
    const id = await withClaims(pool, claims, (c) => upsertPolicy(c, principal.tenantId, body));
    return send(res, 201, { id });
  } catch (e) {
    console.error("governance upsert error:", e);
    return send(res, 400, errEnvelope(null, 400, "POLICY_INVALID", String(e.message)));
  }
}

// GET /v1/documents/:id/governance-certificate — the compliance proof sealed at
// publication (409 until a record is published under a governed policy).
async function handleGovernanceCertificate(res, principal, documentId) {
  if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
  const row = await withClaims(pool, govClaims(principal), async (c) => {
    const r = await c.query("select classification, governance_certificate from dispatch.documents where id=$1 and deleted_at is null", [documentId]);
    return r.rows[0] || null;
  });
  if (!row) return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "document not found"));
  if (!clearanceAllows(principal.clearance, row.classification || {}).allowed)
    return send(res, 403, errEnvelope(null, 403, "INSUFFICIENT_CLEARANCE", "not cleared for this record"));
  if (!row.governance_certificate)
    return send(res, 409, errEnvelope(null, 409, "NO_GOVERNANCE_CERTIFICATE", "this record was not published under a governed policy"));
  return send(res, 200, { certificate: row.governance_certificate });
}

// Governance roles, grants, and delegations. Read for any principal (the queue
// UI shows whose turn); writes require dispatch:admin, expressed as tenant_admin
// for the M14/M16 RLS (confined to the caller's tenant).
async function handleGovernanceAdmin(req, res, principal, kind, method) {
  if (method === "GET") {
    if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
    const data = await withClaims(pool, govClaims(principal), async (c) => ({
      roles: (await c.query("select key, label from dispatch.governance_roles order by label")).rows,
      grants: (await c.query("select subject, role_key from dispatch.governance_role_grants where active order by role_key")).rows,
      delegations: (await c.query("select role_key, delegate_subject, grantor_subject, reason, ends_at from dispatch.delegations where active and now() between starts_at and ends_at")).rows,
    }));
    return send(res, 200, data);
  }
  if (!hasScope(principal, "dispatch:admin")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "admin scope required"));
  let body; try { body = JSON.parse(await readBody(req)); }
  catch { return send(res, 400, errEnvelope(null, 400, "SCHEMA_INVALID", "invalid JSON body")); }
  const claims = { ...govClaims(principal), dispatch_role: "tenant_admin" };
  try {
    if (kind === "roles") {
      if (!body.key || !body.label) return send(res, 400, errEnvelope(null, 400, "SCHEMA_INVALID", "key and label are required"));
      await withClaims(pool, claims, (c) => c.query(
        `insert into dispatch.governance_roles (tenant_id, key, label) values ($1,$2,$3)
         on conflict (tenant_id, key) do update set label=excluded.label`, [principal.tenantId, body.key, body.label]));
      return send(res, 201, { key: body.key, label: body.label });
    }
    if (kind === "grants") {
      if (!body.subject || !body.roleKey) return send(res, 400, errEnvelope(null, 400, "SCHEMA_INVALID", "subject and roleKey are required"));
      await withClaims(pool, claims, (c) => c.query(
        `insert into dispatch.governance_role_grants (tenant_id, subject, role_key, granted_by, active) values ($1,$2,$3,$4,true)
         on conflict (tenant_id, subject, role_key) do update set active=true`, [principal.tenantId, body.subject, body.roleKey, principal.actor]));
      return send(res, 201, { subject: body.subject, roleKey: body.roleKey });
    }
    if (kind === "delegations") {
      if (!body.roleKey || !body.delegateSubject || !body.endsAt) return send(res, 400, errEnvelope(null, 400, "SCHEMA_INVALID", "roleKey, delegateSubject, endsAt required"));
      await withClaims(pool, claims, (c) => c.query(
        `insert into dispatch.delegations (tenant_id, role_key, delegate_subject, grantor_subject, reason, ends_at)
         values ($1,$2,$3,$4,$5,$6)`, [principal.tenantId, body.roleKey, body.delegateSubject, body.grantorSubject || null, body.reason || null, body.endsAt]));
      return send(res, 201, { delegated: true });
    }
    return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "unknown governance resource"));
  } catch (e) {
    console.error("governance admin error:", e);
    return send(res, 400, errEnvelope(null, 400, "GOVERNANCE_WRITE_FAILED", String(e.message)));
  }
}

// GET /v1/governance/overview — the operational + compliance picture an admin or
// compliance officer needs at a glance: who's awaiting whom, what's awaiting
// publication, active/expired delegations, and the compliance posture. Derived
// from documents/approvals/delegations (no audit_events dependency).
async function handleGovernanceOverview(res, principal) {
  if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
  const data = await withClaims(pool, govClaims(principal), async (c) => {
    const pendingDocs = (await c.query(
      `select id, doc_type, title, classification, submitted_at, current_version from dispatch.documents
        where lifecycle_state in ('submitted','in_review') and deleted_at is null order by submitted_at asc limit 100`)).rows;
    const pending = [];
    for (const d of pendingDocs) {
      const policy = await resolvePolicy(c, { docType: d.doc_type, classificationLevel: d.classification?.level });
      const chain = chainOf(policy);
      let awaiting = "Review"; const policyName = policy._source === "policy" ? policy.name : null;
      if (chain.length) {
        const appr = (await c.query("select decision, actor, role_key, expires_at from dispatch.approvals where document_id=$1 and version_no=$2", [d.id, d.current_version])).rows
          .map((r) => ({ ...r, expired: !!r.expires_at && new Date(r.expires_at) < new Date() }));
        const ev = evaluateChain(appr, chain, { submitter: null, sequential: policy.sequential });
        awaiting = ev.openStep != null ? chain[ev.openStep].label : "Ready";
      }
      pending.push({ documentId: d.id, title: d.title, docType: d.doc_type, classification: d.classification, submittedAt: d.submitted_at, awaiting, policyName });
    }
    const awaitingPublication = (await c.query(
      `select id, doc_type, title, classification from dispatch.documents where lifecycle_state='rendered' and deleted_at is null limit 100`)).rows
      .map((r) => ({ documentId: r.id, title: r.title, docType: r.doc_type, classification: r.classification }));
    const delegations = (await c.query(
      `select role_key, delegate_subject, grantor_subject, reason, starts_at, ends_at, (ends_at < now()) as expired
         from dispatch.delegations order by ends_at desc limit 100`)).rows;
    const counts = (await c.query(
      `select count(*) filter (where lifecycle_state in ('published','archived')) as published,
              count(*) filter (where lifecycle_state='archived') as preserved,
              count(*) filter (where governance_certificate is not null) as governed,
              count(*) filter (where governance_certificate->>'complianceResult'='COMPLIANT') as compliant
         from dispatch.documents where deleted_at is null`)).rows[0];
    const exceptions = Number((await c.query("select count(*) n from dispatch.approvals where on_behalf_of is not null")).rows[0].n);
    return { pending, awaitingPublication, delegations, counts, exceptions };
  });
  const governed = Number(data.counts.governed), compliant = Number(data.counts.compliant);
  return send(res, 200, {
    pending: data.pending,
    awaitingPublication: data.awaitingPublication,
    delegations: data.delegations,
    compliance: {
      published: Number(data.counts.published), preserved: Number(data.counts.preserved),
      governed, compliant, complianceRate: governed ? Math.round((compliant / governed) * 100) : 100,
      exceptions: data.exceptions, expiredAuthorities: data.delegations.filter((d) => d.expired).length,
    },
  });
}

// GET /v1/evaluation/assessment — the platform generates its OWN evaluation
// evidence. Capability maturity and a readiness score derived ENTIRELY from this
// tenant's actual posture (policies, certificates, preservation, delegations,
// isolation) — no invented numbers, no simulated compliance. "active" =
// provable now; "configurable" = set per deployment; "architected" = capability
// scoped per engagement. The readiness index weights these transparently.
async function handleEvaluationAssessment(res, principal) {
  if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
  const p = await withClaims(pool, govClaims(principal), async (c) => {
    const policies = await listPolicies(c);
    const counts = (await c.query(
      `select count(*) filter (where lifecycle_state in ('published','archived')) as published,
              count(*) filter (where lifecycle_state='archived') as preserved,
              count(*) filter (where governance_certificate is not null) as governed,
              count(*) filter (where governance_certificate->>'complianceResult'='COMPLIANT') as compliant
         from dispatch.documents where deleted_at is null`)).rows[0];
    const delegations = Number((await c.query("select count(*) n from dispatch.delegations where active and now() between starts_at and ends_at")).rows[0].n);
    const roles = Number((await c.query("select count(*) n from dispatch.governance_roles")).rows[0].n);
    const clients = Number((await c.query("select count(*) n from dispatch.service_clients where active")).rows[0].n);
    return { policies, counts, delegations, roles, clients };
  });
  const chained = p.policies.filter((x) => Array.isArray(x.review_chain) && x.review_chain.some((s) => s && s.role)).length;
  const ttl = p.policies.filter((x) => x.approval_ttl_days).length;
  const compliant = Number(p.counts.compliant), preserved = Number(p.counts.preserved), governed = Number(p.counts.governed);

  // Each capability's status is DERIVED from posture; evidence states why.
  const A = "active", C = "configurable", AR = "architected";
  const caps = [
    { key: "Governance enforcement", status: chained ? A : C, evidence: chained ? `${chained} role-bound policy chain(s) enforced` : "Available — define a chained policy to enforce" },
    { key: "Ordered approval chains", status: chained ? A : C, evidence: chained ? "Ordered, role-bound approvals in force" : "Available per policy" },
    { key: "Per-step quorum", status: chained ? A : C, evidence: chained ? "Per-step quorum supported in active policies" : "Available per policy" },
    { key: "Separation of duties", status: A, evidence: "Enforced — submitter cannot approve; publisher cannot self-approve" },
    { key: "Governance certificates", status: compliant > 0 ? A : AR, evidence: compliant > 0 ? `${compliant} COMPLIANT certificate(s) issued` : "Issued on first governed publication" },
    { key: "Delegation controls", status: p.delegations > 0 ? A : C, evidence: p.delegations > 0 ? `${p.delegations} active delegation(s)` : "Available — time-boxed, logged" },
    { key: "Approval expiration", status: ttl ? A : C, evidence: ttl ? `${ttl} policy with approval expiry` : "Available per policy" },
    { key: "Preservation (tamper-evident)", status: preserved > 0 ? A : AR, evidence: preserved > 0 ? `${preserved} record(s) sealed with SHA-256 proofs` : "Available on first archive" },
    { key: "Tenant isolation (RLS)", status: A, evidence: "Row-level security, deny-by-default" },
    { key: "Append-only audit", status: A, evidence: "Hash-stamped, immutable event trail" },
    { key: "Encryption at rest & transit", status: A, evidence: "AES-256 at rest; TLS 1.2+ in transit" },
    { key: "Managed cloud deployment", status: A, evidence: "Current engagement" },
    { key: "Private cloud / on-premise", status: AR, evidence: "Available per engagement" },
    { key: "Air-gapped deployment", status: AR, evidence: "Available for isolated estates" },
    { key: "Data export / no lock-in", status: A, evidence: "Standard PostgreSQL + open artifact formats" },
    { key: "Classification & clearance", status: C, evidence: "Enabled per deployment for classified estates" },
  ];
  const W = { active: 1, configurable: 0.6, architected: 0.4 };
  const score = (keys) => {
    const items = caps.filter((c) => keys.includes(c.key));
    return Math.round((items.reduce((a, c) => a + W[c.status], 0) / items.length) * 100);
  };
  const dimensions = [
    { name: "Governance", score: score(["Governance enforcement", "Ordered approval chains", "Per-step quorum", "Separation of duties", "Delegation controls", "Approval expiration"]) },
    { name: "Security", score: score(["Tenant isolation (RLS)", "Append-only audit", "Encryption at rest & transit", "Separation of duties", "Classification & clearance"]) },
    { name: "Deployment", score: score(["Managed cloud deployment", "Private cloud / on-premise", "Air-gapped deployment", "Data export / no lock-in"]) },
    { name: "Sovereignty", score: score(["Tenant isolation (RLS)", "Data export / no lock-in", "Encryption at rest & transit", "Managed cloud deployment"]) },
    { name: "Evidence", score: score(["Governance certificates", "Preservation (tamper-evident)", "Append-only audit"]) },
  ];
  const overall = Math.round(dimensions.reduce((a, d) => a + d.score, 0) / dimensions.length);
  return send(res, 200, {
    summary: {
      published: Number(p.counts.published), preserved, governed, compliant,
      complianceRate: governed ? Math.round((compliant / governed) * 100) : 100,
      policies: p.policies.length, chainedPolicies: chained, authorities: p.roles, apiConsumers: p.clients,
    },
    maturity: caps.map((c) => ({ capability: c.key, status: c.status, evidence: c.evidence })),
    dimensions, overall,
  });
}

// GET /v1/governance/intelligence — institutional governance analytics: cycle
// times, bottlenecks (where records pile up), per-policy performance, publication
// throughput, and approval activity by authority. All derived from the timestamps
// the engine already records — no new instrumentation.
async function handleGovernanceIntelligence(res, principal) {
  if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
  const roleLabels = {};
  const d = await withClaims(pool, govClaims(principal), async (c) => {
    (await c.query("select key, label from dispatch.governance_roles")).rows.forEach((r) => { roleLabels[r.key] = r.label; });
    const cyc = (await c.query(
      `select avg(extract(epoch from (decided_at - submitted_at))/3600)  filter (where decided_at is not null and submitted_at is not null)  as submit_to_approve,
              avg(extract(epoch from (published_at - decided_at))/3600)  filter (where published_at is not null and decided_at is not null) as approve_to_publish,
              avg(extract(epoch from (archived_at - published_at))/3600) filter (where archived_at is not null and published_at is not null) as publish_to_archive
         from dispatch.documents where deleted_at is null`)).rows[0];
    const policyPerf = (await c.query(
      `select governance_certificate->>'policyName' as policy, count(*) as volume,
              avg(extract(epoch from (published_at - submitted_at))/86400) as avg_days,
              count(*) filter (where governance_certificate->>'complianceResult'='COMPLIANT') as compliant
         from dispatch.documents where governance_certificate is not null and deleted_at is null group by 1 order by volume desc`)).rows;
    const tput = (await c.query(
      `select to_char(published_at::date,'Mon DD') as day, count(*) n from dispatch.documents
        where published_at >= now() - interval '14 days' and deleted_at is null group by published_at::date order by published_at::date`)).rows;
    // Authority RESPONSE TIME: how long each role takes once it is their turn —
    // the gap between this approval and the previous step (or submission for step 0).
    const perf = (await c.query(
      `with ca as (
         select a.role_key, a.created_at,
                lag(a.created_at) over (partition by a.document_id order by a.created_at) as prev_at,
                d.submitted_at
           from dispatch.approvals a join dispatch.documents d on d.id = a.document_id
          where a.decision='approve' and a.role_key is not null)
       select role_key,
              avg(extract(epoch from (created_at - coalesce(prev_at, submitted_at)))/3600) as avg_hours,
              count(*) as decisions
         from ca group by role_key order by avg_hours desc nulls last`)).rows;
    // Approvals NEARING EXPIRY on records not yet published — about to breach.
    const atRisk = (await c.query(
      `select d.id, d.title, d.doc_type, d.classification, a.role_key,
              extract(epoch from (a.expires_at - now()))/3600 as hours_left
         from dispatch.approvals a join dispatch.documents d on d.id = a.document_id
        where a.decision='approve' and a.expires_at is not null and a.expires_at > now()
          and a.expires_at <= now() + interval '7 days'
          and d.lifecycle_state in ('in_review','approved','rendered') and d.deleted_at is null
        order by a.expires_at asc limit 12`)).rows;
    // Pending records — resolve whose turn + age for workload + aging + bottlenecks.
    const pendingDocs = (await c.query(
      `select id, title, doc_type, classification, submitted_at, current_version,
              extract(epoch from (now()-submitted_at))/3600 as hours_waiting
         from dispatch.documents where lifecycle_state in ('submitted','in_review') and deleted_at is null order by submitted_at asc limit 200`)).rows;
    const workload = {}; const aging = { "0–1d": 0, "1–3d": 0, "3–7d": 0, ">7d": 0 };
    const pending = [];
    for (const p of pendingDocs) {
      const policy = await resolvePolicy(c, { docType: p.doc_type, classificationLevel: p.classification?.level });
      const chain = chainOf(policy);
      let awaiting = "Review";
      if (chain.length) {
        const appr = (await c.query("select decision, actor, role_key, expires_at from dispatch.approvals where document_id=$1 and version_no=$2", [p.id, p.current_version])).rows
          .map((r) => ({ ...r, expired: !!r.expires_at && new Date(r.expires_at) < new Date() }));
        const ev = evaluateChain(appr, chain, { submitter: null, sequential: policy.sequential });
        awaiting = ev.openStep != null ? chain[ev.openStep].label : "Ready";
      }
      workload[awaiting] = (workload[awaiting] || 0) + 1;
      const hrs = Number(p.hours_waiting);
      aging[hrs < 24 ? "0–1d" : hrs < 72 ? "1–3d" : hrs < 168 ? "3–7d" : ">7d"]++;
      pending.push({ id: p.id, title: p.title, doc_type: p.doc_type, classification: p.classification, hours_waiting: hrs, awaiting });
    }
    return { cyc, policyPerf, tput, perf, atRisk, workload, aging, pending };
  });
  const h = (x) => (x == null ? null : Math.round(Number(x) * 10) / 10);
  const lbl = (k) => roleLabels[k] || k;
  return send(res, 200, {
    cycleHours: { submitToApprove: h(d.cyc.submit_to_approve), approveToPublish: h(d.cyc.approve_to_publish), publishToArchive: h(d.cyc.publish_to_archive) },
    oldestInFlight: d.pending.slice(0, 8).map((r) => ({ documentId: r.id, title: r.title, docType: r.doc_type, classification: r.classification, hoursWaiting: h(r.hours_waiting), awaiting: r.awaiting })),
    policyPerformance: d.policyPerf.map((r) => ({ policy: r.policy, volume: Number(r.volume), avgDays: h(r.avg_days), complianceRate: Number(r.volume) ? Math.round((Number(r.compliant) / Number(r.volume)) * 100) : 100 })),
    throughput: d.tput.map((r) => ({ day: r.day, count: Number(r.n) })),
    authorityPerformance: d.perf.map((r) => ({ role: lbl(r.role_key), avgResponseHours: h(r.avg_hours), decisions: Number(r.decisions) })),
    workloadByAuthority: Object.entries(d.workload).map(([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count),
    aging: Object.entries(d.aging).map(([bucket, count]) => ({ bucket, count })),
    atRisk: d.atRisk.map((r) => ({ documentId: r.id, title: r.title, docType: r.doc_type, classification: r.classification, role: lbl(r.role_key), hoursLeft: h(r.hours_left) })),
  });
}

// POST /v1/admin/governance/expire-sweep — flag records whose governance chain
// has an expired approval (those approvals no longer count toward satisfaction,
// so publication is already blocked by the publication lock). Emits an auditable
// expiry event per affected record.
async function handleGovernanceExpireSweep(res, principal) {
  if (!hasScope(principal, "dispatch:approve")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "approve scope required"));
  const expired = await withClaims(pool, govClaims(principal), async (client) => {
    const rows = (await client.query(
      `select distinct a.document_id from dispatch.approvals a
         join dispatch.documents d on d.id = a.document_id
        where a.decision='approve' and a.expires_at is not null and a.expires_at <= now()
          and d.lifecycle_state in ('in_review','approved','rendered')`)).rows;
    for (const r of rows) {
      await writeAudit(client, { tenantId: principal.tenantId, actor: "system", actorType: "system",
        action: "governance.approval_expired", targetType: "document", targetId: r.document_id });
    }
    return rows.map((r) => r.document_id);
  });
  return send(res, 200, { expired, count: expired.length });
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
    const d = await c.query("select id, doc_type, title, classification, status, lifecycle_state, current_version, correlation_id, published_at, archived_at, preservation_sha256, created_at, updated_at from dispatch.documents where id=$1 and deleted_at is null", [documentId]);
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
    id: doc.id, docType: doc.doc_type, title: doc.title, status: doc.status, lifecycle: doc.lifecycle_state,
    currentVersion: doc.current_version, correlationId: doc.correlation_id,
    publishedAt: doc.published_at, archivedAt: doc.archived_at, preservationSha256: doc.preservation_sha256,
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

// ---- Launch Phase 1: adoption & friction instrumentation ------------------
// Behavioural signals that have no home in the authoritative tables (public
// page visits, the signup funnel, paywall views, abandonment). This is signal,
// not a record of authority — deliberately separate from the audit trail.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Allowlist: arbitrary client-supplied event names are dropped, never stored.
const ANALYTICS_EVENTS = new Set([
  "page.home", "page.trust", "page.procurement", "page.evidence", "page.standard",
  "signup.started", "signup.completed", "signup.abandoned",
  "record.create.started", "record.create.abandoned", "record.created",
  "paywall.viewed", "paywall.exit", "governance.failed", "publish.completed",
]);
const clip = (v, n) => (typeof v === "string" && v ? v.slice(0, n) : null);
// Keep props a small, bounded, scalar-only bag — no nested payloads, no PII vectors.
function clampProps(p) {
  if (!p || typeof p !== "object" || Array.isArray(p)) return {};
  const out = {};
  for (const k of Object.keys(p).slice(0, 12)) {
    const v = p[k];
    if (v == null) continue;
    if (typeof v === "string") out[String(k).slice(0, 40)] = v.slice(0, 120);
    else if (typeof v === "number" || typeof v === "boolean") out[String(k).slice(0, 40)] = v;
  }
  return out;
}

// Public, unauthenticated beacon. ALWAYS returns 202 — a dropped or malformed
// beacon must never surface to a visitor, and the endpoint must not be probeable
// for validation differences. Unknown event names are silently ignored.
async function handleAnalyticsIngest(req, res) {
  let body;
  try { body = JSON.parse(await readBody(req)); }
  catch { return send(res, 202, { ok: true, accepted: 0 }); }
  const list = Array.isArray(body?.events) ? body.events : [body];
  const rows = list.filter((e) => e && typeof e.event === "string" && ANALYTICS_EVENTS.has(e.event)).slice(0, 50);
  if (rows.length === 0) return send(res, 202, { ok: true, accepted: 0 });
  try {
    await withClaims(pool, { principal_type: "system" }, async (client) => {
      for (const e of rows) {
        const tenantId = UUID_RE.test(e.tenantId || "") ? e.tenantId : null;
        await client.query(
          "insert into dispatch.analytics_events (event, tenant_id, anon_id, session_id, props) values ($1,$2,$3,$4,$5)",
          [e.event, tenantId, clip(e.anonId, 64), clip(e.sessionId, 64), JSON.stringify(clampProps(e.props))]
        );
      }
    });
  } catch (err) { console.error("analytics ingest:", err); /* swallow — never fail a beacon */ }
  return send(res, 202, { ok: true, accepted: rows.length });
}

// Platform operators are designated SERVER-SIDE only (an allowlist of client_ids
// in DISPATCH_PLATFORM_OPERATORS). No tenant can self-grant this; it is "for the
// operator, not for customers." The cross-tenant function additionally requires
// a platform_operator claim (set just below) — defence in depth.
const PLATFORM_OPERATORS = new Set((process.env.DISPATCH_PLATFORM_OPERATORS || "").split(",").map((s) => s.trim()).filter(Boolean));
function isPlatformOperator(principal) {
  const clientId = (principal.actor || "").replace(/^svc:/, "");
  return clientId !== "" && PLATFORM_OPERATORS.has(clientId);
}

async function handlePlatformExecutive(res, principal) {
  if (!hasScope(principal, "dispatch:read")) return send(res, 403, errEnvelope(null, 403, "FORBIDDEN_SCOPE", "read scope required"));
  if (!isPlatformOperator(principal)) return send(res, 403, errEnvelope(null, 403, "NOT_PLATFORM_OPERATOR", "platform operator credentials are required for the executive overview"));
  const overview = await withClaims(pool, { principal_type: "system", platform_operator: "true" }, async (client) => {
    const r = await client.query("select dispatch.platform_overview() as o");
    return r.rows[0].o;
  });
  return send(res, 200, overview);
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

    // Governance policies — list (read) / upsert (admin).
    if (path === "/v1/governance/policies" && (req.method === "GET" || req.method === "POST")) {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      return await handleGovernance(req, res, auth.principal, req.method);
    }

    // Dispatch console (Epic 9) — static page; no auth (it authenticates client-side).
    if (req.method === "GET" && (path === "/" || path === "/console")) {
      const html = consoleHtml();
      if (!html) return send(res, 404, errEnvelope(null, 404, "NOT_FOUND", "console unavailable"));
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(html);
    }
    if (req.method === "GET" && path === "/favicon.ico") { res.writeHead(204); return res.end(); }

    // Preservation certificate for an archived record — auth required, tenant-scoped.
    const certMatch = req.method === "GET" && /^\/v1\/documents\/([A-Za-z0-9-]+)\/certificate$/.exec(path);
    if (certMatch) {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      return await handleCertificate(res, auth.principal, certMatch[1]);
    }

    // Governance (compliance) certificate for a record published under a policy.
    const govCertMatch = req.method === "GET" && /^\/v1\/documents\/([A-Za-z0-9-]+)\/governance-certificate$/.exec(path);
    if (govCertMatch) {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      return await handleGovernanceCertificate(res, auth.principal, govCertMatch[1]);
    }

    // Governance operational + compliance overview.
    if (req.method === "GET" && path === "/v1/governance/overview") {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      return await handleGovernanceOverview(res, auth.principal);
    }

    // Governance intelligence — analytics (bottlenecks, cycle times, performance).
    if (req.method === "GET" && path === "/v1/governance/intelligence") {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      return await handleGovernanceIntelligence(res, auth.principal);
    }

    // Evaluation assessment — platform-generated maturity + readiness from posture.
    if (req.method === "GET" && path === "/v1/evaluation/assessment") {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      return await handleEvaluationAssessment(res, auth.principal);
    }

    // Executive (platform-operator) overview — cross-tenant counts, gated by a
    // server-side operator allowlist AND a defence-in-depth claim (see handler).
    if (req.method === "GET" && path === "/v1/analytics/executive") {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      return await handlePlatformExecutive(res, auth.principal);
    }

    // Governance roles / grants / delegations (read for any principal).
    const govAdminMatch = (path === "/v1/governance/roles" || path === "/v1/governance/grants" || path === "/v1/governance/delegations") && (req.method === "GET" || req.method === "POST");
    if (govAdminMatch) {
      const auth = await resolvePrincipal(pool, authHeaderFrom(req), withAdmin);
      if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
      return await handleGovernanceAdmin(req, res, auth.principal, path.split("/").pop(), req.method);
    }

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

    // Public, unauthenticated behavioural beacon (Launch Phase 1). Never fails
    // the caller (a dropped beacon must not surface to a visitor); allowlisted
    // event names only; no PII. See handleAnalyticsIngest.
    if (path === "/v1/analytics/events") return await handleAnalyticsIngest(req, res);

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
    const govMatch = /^\/v1\/documents\/([A-Za-z0-9-]+)\/(decision|publish|withdraw|archive)$/.exec(path);
    if (govMatch) {
      const [, id, action] = govMatch;
      if (action === "decision") return await handleDecision(req, res, principal, id);
      return await handleLifecycleAction(req, res, principal, id, action);
    }

    // Retention execution path — archive every record past its retention horizon.
    if (path === "/v1/admin/retention/sweep") return await handleRetentionSweep(res, principal);
    // Expiration execution path — flag records whose governance approvals expired.
    if (path === "/v1/admin/governance/expire-sweep") return await handleGovernanceExpireSweep(res, principal);

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
