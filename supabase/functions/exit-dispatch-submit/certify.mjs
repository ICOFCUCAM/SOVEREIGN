// ── EXITOS → SOVEREIGN DISPATCH: CERTIFICATION ──────────────────────
// ExitOS writes, versions, reviews and renders its own documents. Dispatch certifies the deal documents
// both sides rely on: it holds an exact copy, gives it a permanent record number, a public verification
// page (/verify/<record>; the title is withheld for classified records, the body is never shown), an
// integrity hash and preservation. Two steps, because Dispatch renders asynchronously:
//   submitForCertification  — register the version (the request envelope Dispatch's contract requires)
//   advanceCertification    — once Dispatch has rendered it: publish (the record goes public) and seal it
//                             for preservation; reports the record number and integrity hash.
// Runtime-neutral plain JavaScript (Deno in the edge function, Node in CI): fetch is passed in.

/** Deal documents that may be certified: what both parties rely on after the deal. */
/** @type {ReadonlySet<string>} */
export const CERTIFIABLE_TYPES = new Set([
  "exitos.nda", "exitos.loi", "exitos.exclusivity", "exitos.bring_down_certificate", "exitos.funds_flow", "exitos.post_closing_register",
]);

/**
 * @typedef {{ base: string, clientId: string, secret: string, fetch: typeof fetch }} DispatchConnection
 * @typedef {{ token: string, tenantId: string, conn: DispatchConnection }} DispatchSession
 * @typedef {{ state: "requested", lifecycle: string, waitingFor: string }
 *   | { state: "certified", lifecycle: string, recordId: string, integritySha256: string | null }
 *   | { state: "failed", lifecycle: string, error: string }} CertificationStep
 */

export class DispatchError extends Error {
  /** @param {number} status @param {string} message */
  constructor(status, message) { super(message); this.status = status; }
}

/** @param {DispatchSession} s @param {string} method @param {string} path @param {unknown} [body] @param {Record<string,string>} [extra] */
async function call(s, method, path, body, extra = {}) {
  const res = await s.conn.fetch(`${s.conn.base}${path}`, {
    method, headers: { Authorization: `Bearer ${s.token}`, ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...extra },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = j.error;
    throw new DispatchError(res.status, typeof e === "string" ? e : `${e?.code ?? res.status}: ${e?.message ?? "Dispatch refused the request"}`);
  }
  return j;
}

/** A session with the dedicated ExitOS client. The demo console client is refused. */
/** @param {DispatchConnection} conn @returns {Promise<DispatchSession>} */
export async function dispatchSession(conn) {
  if (conn.clientId === "svc-a") throw new DispatchError(400, "refusing to use the demo console client; configure the dedicated ExitOS client");
  const res = await conn.fetch(`${conn.base}/v1/token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: conn.clientId, secret: conn.secret }) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token || !j.tenantId) throw new DispatchError(502, `Dispatch token ${res.status}`);
  return { token: j.access_token, tenantId: j.tenantId, conn };
}

/** A UUID-formatted key derived from the version, so re-certifying the same version is the same request. */
/** @param {string} versionId @param {string} contentHash @returns {Promise<string>} */
export async function idempotencyKey(versionId, contentHash) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`exitos-certify:${versionId}:${contentHash}`));
  const h = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Register an approved version with Dispatch. Returns Dispatch's document id. */
/** @param {DispatchSession} s @param {{ versionId: string, contentHash: string, ddm: unknown }} v @returns {Promise<{ documentId: string, lifecycle: string }>} */
export async function submitForCertification(s, v) {
  const key = await idempotencyKey(v.versionId, v.contentHash);
  const body = {
    schemaVersion: "1.0", idempotencyKey: key,
    source: { system: "internal", tenantId: s.tenantId, correlationId: `exitos:${v.versionId}:${v.contentHash.slice(0, 16)}` },
    document: v.ddm, outputs: ["pdf"], delivery: { mode: "async" },
  };
  const r = await call(s, "POST", "/v1/documents", body, { "Idempotency-Key": key });
  const documentId = String(r.documentId ?? "");
  if (!documentId) throw new DispatchError(502, "Dispatch did not return a document id");
  return { documentId, lifecycle: String(r.lifecycle ?? r.status ?? "submitted") };
}

/** @type {Record<string, string>} */
const WAITING = {
  submitted: "Dispatch has received the document",
  in_review: "the document awaits approval in Dispatch",
  approved: "Dispatch is rendering the document",
  rendering: "Dispatch is rendering the document",
};

/** Move a submitted document on: publish once rendered, then seal for preservation. Safe to repeat. */
/** @param {DispatchSession} s @param {string} documentId @returns {Promise<CertificationStep>} */
export async function advanceCertification(s, documentId) {
  const path = `/v1/documents/${encodeURIComponent(documentId)}`;
  let d = await call(s, "GET", path);
  let lifecycle = String(d.lifecycle ?? "");
  if (lifecycle === "rejected" || lifecycle === "failed" || lifecycle === "withdrawn") return { state: "failed", lifecycle, error: `Dispatch reports the document as ${lifecycle}` };
  if (lifecycle === "rendered") { await call(s, "POST", `${path}/publish`, {}); lifecycle = "published"; }
  if (lifecycle === "published") {
    const a = await call(s, "POST", `${path}/archive`, {});
    lifecycle = String(a.lifecycle ?? "archived");
  }
  if (lifecycle === "archived") {
    d = await call(s, "GET", path);
    const recordId = d.publicId ? String(d.publicId) : "";
    if (!recordId) return { state: "failed", lifecycle, error: "Dispatch sealed the document without a record number" };
    const sha = d.preservationSha256 ? String(d.preservationSha256) : null;
    return { state: "certified", lifecycle, recordId, integritySha256: sha && /^[0-9a-f]{64}$/.test(sha) ? sha : null };
  }
  return { state: "requested", lifecycle, waitingFor: WAITING[lifecycle] ?? `the document is ${lifecycle || "being processed"} in Dispatch` };
}

