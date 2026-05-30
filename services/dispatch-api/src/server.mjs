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
  const lane = principal.principalType === "user" ? "interactive" : "service";

  try {
    const result = await withClaims(pool, claims, async (client) => {
      // Idempotency: existing job for (tenant, key)?
      const existing = await client.query("select id, request_id, state from dispatch.jobs where tenant_id=$1 and idempotency_key=$2", [principal.tenantId, idem]);
      if (existing.rows[0]) {
        return { replay: true, jobId: existing.rows[0].id, requestId: existing.rows[0].request_id, state: existing.rows[0].state };
      }
      // Persist document
      const dres = await client.query(
        `insert into dispatch.documents (tenant_id, doc_type, title, classification, status, source_system, correlation_id, owner_user_id)
         values ($1,$2,$3,$4,'rendering',$5,$6,$7) returning id`,
        [principal.tenantId, doc.docType, doc.metadata?.title || "", JSON.stringify(doc.classification || {}),
         body.source?.system || "internal", body.source?.correlationId || null, null]
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
      // Create job
      const jres = await client.query(
        `insert into dispatch.jobs (tenant_id, document_id, version_id, request_id, idempotency_key, lane, outputs, correlation_id, callback_url, state)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'queued') returning id`,
        [principal.tenantId, documentId, versionId, requestId, idem, lane, outputs,
         body.source?.correlationId || null, body.delivery?.callbackUrl || null]
      );
      const jobId = jres.rows[0].id;
      await writeAudit(client, { tenantId: principal.tenantId, actor: principal.actor, actorType: principal.principalType,
        action: "document.submitted", targetType: "job", targetId: jobId, requestId, correlationId: body.source?.correlationId });
      return { replay: false, jobId, requestId, documentId, versionId };
    });

    return send(res, 202, { requestId: result.requestId, jobId: result.jobId, status: result.replay ? (result.state || "queued") : "queued", statusUrl: `/v1/jobs/${result.jobId}`, replay: !!result.replay });
  } catch (e) {
    if (String(e.message).includes("idempotency")) return send(res, 409, errEnvelope(requestId, 409, "IDEMPOTENCY_CONFLICT", "duplicate idempotency key with different body"));
    console.error("documents error:", e);
    return send(res, 500, errEnvelope(requestId, 500, "ENGINE_ERROR", "internal error"));
  }
}

// ---- Retrieve surface (Epic 8) ---------------------------------------------
// All reads run under the principal's tenant claim, so RLS returns 0 rows for a
// cross-tenant id → we surface 404 (never leak existence across tenants).
const claimsFor = (p) => ({ tenant_id: p.tenantId, dispatch_role: p.role, principal_type: p.principalType, actor: p.actor });

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
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;
    routePath = path.replace(/\/v1\/(jobs|artifacts|documents)\/[^/]+/, "/v1/$1/:id"); // low-cardinality label
    if (req.method === "GET" && path === "/v1/health") return send(res, 200, { ok: true, engineVersion: ENGINE_VERSION });
    if (req.method === "GET" && path === "/v1/version") return send(res, 200, { engineVersion: ENGINE_VERSION, schemaVersion: "1.0" });
    if (req.method === "GET" && path === "/v1/metrics") return send(res, 200, snapshot());

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

    const auth = await resolvePrincipal(pool, req.headers["authorization"], withAdmin);
    if (auth.error) return send(res, auth.error.status, errEnvelope(null, auth.error.status, auth.error.code, auth.error.message));
    const principal = auth.principal;

    if (path === "/v1/validate") return await handleValidate(req, res, principal);
    if (path === "/v1/documents") return await handleDocuments(req, res, principal);

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
