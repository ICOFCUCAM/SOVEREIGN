// Dispatch Platform API — official TypeScript/JavaScript client.
//
// Dependency-free (Node 18+: global fetch + node:crypto). Wraps the credential
// flow (exchange client_id/secret for a short-lived bearer token, cached and
// auto-refreshed) and the governed record lifecycle, plus webhook signature
// verification. The contract is docs/api/openapi.yaml.
//
//   import { DispatchClient } from "./dispatch";
//   const dispatch = new DispatchClient({ baseUrl, clientId, secret });
//   const { documentId } = await dispatch.createRecord(req);
//
import { createHmac, timingSafeEqual } from "node:crypto";

export interface DispatchOptions {
  /** API origin, e.g. https://api.dispatch.sovereigndo.com */
  baseUrl: string;
  clientId: string;
  secret: string;
  /** Override fetch (tests / non-Node runtimes). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

export interface ApiError { code: string; message: string; field?: string | null; requestId?: string | null }

export class DispatchApiError extends Error {
  code: string; status: number; field?: string | null; requestId?: string | null;
  constructor(status: number, err: ApiError) {
    super(err.message || err.code);
    this.name = "DispatchApiError";
    this.status = status; this.code = err.code; this.field = err.field; this.requestId = err.requestId;
  }
}

export type Decision = "approve" | "reject" | "return";
export interface ListParams { state?: string; docType?: string; q?: string; limit?: number }

export class DispatchClient {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly secret: string;
  private readonly f: typeof fetch;
  private accessToken?: string;
  private expiresAt = 0;

  constructor(opts: DispatchOptions) {
    if (!opts.baseUrl || !opts.clientId || !opts.secret) throw new Error("baseUrl, clientId and secret are required");
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.clientId = opts.clientId;
    this.secret = opts.secret;
    this.f = opts.fetchImpl ?? globalThis.fetch;
    if (!this.f) throw new Error("no fetch available — pass fetchImpl on Node < 18");
  }

  /** Exchange the credential for a bearer token, cached until ~30s before expiry. */
  async token(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt - 30_000) return this.accessToken;
    const r = await this.f(`${this.baseUrl}/v1/token`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ client_id: this.clientId, secret: this.secret }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new DispatchApiError(r.status, j.error ?? { code: "AUTH_FAILED", message: "token exchange failed" });
    this.accessToken = j.access_token;
    this.expiresAt = Date.now() + (j.expiresIn ?? 3600) * 1000;
    return this.accessToken!;
  }

  private async req<T>(method: string, path: string, opts: { body?: unknown; idempotencyKey?: string; query?: ListParams } = {}): Promise<T> {
    const token = await this.token();
    let url = `${this.baseUrl}${path}`;
    if (opts.query) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(opts.query)) if (v !== undefined && v !== null) qs.set(k, String(v));
      const s = qs.toString(); if (s) url += `?${s}`;
    }
    const headers: Record<string, string> = { authorization: `Bearer ${token}` };
    if (opts.body !== undefined) headers["content-type"] = "application/json";
    if (opts.idempotencyKey) headers["idempotency-key"] = opts.idempotencyKey;
    const r = await this.f(url, { method, headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new DispatchApiError(r.status, (j as { error?: ApiError }).error ?? { code: `HTTP_${r.status}`, message: r.statusText });
    return j as T;
  }

  // ── Records ────────────────────────────────────────────────────────────────
  /** Submit a document as an Official Record. `idempotencyKey` makes retries safe. */
  createRecord(request: unknown, idempotencyKey?: string) {
    return this.req<{ documentId: string; lifecycle: string; requestId: string }>("POST", "/v1/documents", { body: request, idempotencyKey });
  }
  getRecord(id: string) { return this.req<Record<string, unknown>>("GET", `/v1/documents/${encodeURIComponent(id)}`); }
  listRecords(params: ListParams = {}) { return this.req<{ items: unknown[] }>("GET", "/v1/documents", { query: params }); }

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  decide(id: string, decision: Decision, opts: { comment?: string; outputs?: string[] } = {}) {
    return this.req<{ documentId: string; lifecycle: string }>("POST", `/v1/documents/${encodeURIComponent(id)}/decision`, { body: { decision, ...opts } });
  }
  publish(id: string) { return this.req<{ documentId: string; lifecycle: string }>("POST", `/v1/documents/${encodeURIComponent(id)}/publish`, { body: {} }); }
  withdraw(id: string) { return this.req<{ documentId: string; lifecycle: string }>("POST", `/v1/documents/${encodeURIComponent(id)}/withdraw`, { body: {} }); }
  archive(id: string) { return this.req<{ documentId: string; lifecycle: string }>("POST", `/v1/documents/${encodeURIComponent(id)}/archive`, { body: {} }); }

  // ── Evidence ────────────────────────────────────────────────────────────────
  governanceCertificate(id: string) { return this.req<{ certificate: unknown }>("GET", `/v1/documents/${encodeURIComponent(id)}/governance-certificate`); }
  preservationCertificate(id: string) { return this.req<{ certificate: unknown }>("GET", `/v1/documents/${encodeURIComponent(id)}/certificate`); }
  audit(params: { target?: string; limit?: number } = {}) { return this.req<{ events: unknown[] }>("GET", "/v1/audit", { query: params as ListParams }); }
  job(id: string) { return this.req<Record<string, unknown>>("GET", `/v1/jobs/${encodeURIComponent(id)}`); }

  // ── Webhooks (admin) ────────────────────────────────────────────────────────
  listWebhooks() { return this.req<{ endpoints: unknown[]; deliveries: Record<string, number> }>("GET", "/v1/admin/webhooks"); }
  createWebhook(url: string, events: string[] = [], description?: string) {
    return this.req<{ id: string; url: string; events: string[]; secret: string }>("POST", "/v1/admin/webhooks", { body: { url, events, description } });
  }
  deleteWebhook(id: string) { return this.req<{ deleted: string }>("DELETE", "/v1/admin/webhooks", { body: { id } }); }
}

/**
 * Verify an inbound webhook delivery. Pass the RAW request body (string/Buffer),
 * the `X-Dispatch-Signature` header, and the endpoint's signing secret.
 * Constant-time; returns true iff the signature is authentic.
 */
export function verifyWebhook(rawBody: string | Buffer, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
