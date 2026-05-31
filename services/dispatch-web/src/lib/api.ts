// Typed client for the Dispatch API. Same-origin in production (the SPA is
// served behind the same gateway as /v1) or proxied in dev (vite.config). The
// bearer token is held in memory only (see auth.ts) — never localStorage — so a
// closed tab drops the session, appropriate for classified material.

const BASE = import.meta.env.VITE_DISPATCH_API_URL ?? "";

export interface ApiError { code: string; message: string; field?: string | null; requestId?: string | null }
export class DispatchError extends Error {
  code: string; status: number; field?: string | null;
  constructor(status: number, err: ApiError) { super(err.message); this.code = err.code; this.status = status; this.field = err.field; }
}

let getToken: () => string | null = () => null;
export function bindTokenGetter(fn: () => string | null) { getToken = fn; }

async function request<T>(method: string, path: string, opts: { body?: unknown; idem?: string; token?: string } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const tok = opts.token ?? getToken();
  if (tok) headers.authorization = "Bearer " + tok;
  if (opts.idem) headers["idempotency-key"] = opts.idem;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const r = await fetch(BASE + path, { method, headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("json")) {
    if (!r.ok) throw new DispatchError(r.status, { code: "HTTP_" + r.status, message: r.statusText });
    return (await r.text()) as unknown as T;
  }
  const json = await r.json();
  if (!r.ok) throw new DispatchError(r.status, json.error ?? { code: "ERROR", message: "request failed" });
  return json as T;
}

// ---- token exchange (client credentials) ----
export interface TokenResponse { access_token: string; token: string; tokenType: string; expiresIn: number; tenantId: string; scopes: string[] }
export const exchangeToken = (client_id: string, secret: string) =>
  request<TokenResponse>("POST", "/v1/token", { body: { client_id, secret } });

// ---- whoami (resolve identity for either token kind) ----
export interface WhoAmI { tenantId: string; principalType: "user" | "service"; role: string; scopes: string[]; clearance: string; actor: string }
export const whoami = (token?: string) => request<WhoAmI>("GET", "/v1/whoami", token ? { token } : {});

// ---- documents / lifecycle ----
export type Lifecycle = "draft" | "submitted" | "in_review" | "approved" | "rejected" | "rendered" | "published" | "withdrawn" | "archived";
export interface DocListItem {
  documentId: string; docType: string; title: string; classification: { scheme?: string; level?: string };
  renderStatus?: string; lifecycle: Lifecycle; version: number;
  submittedAt?: string; publishedAt?: string; retentionUntil?: string; createdAt?: string; updatedAt?: string;
}
export interface DocList { items: DocListItem[]; count: number }

export const listDocuments = (params: { state?: string; docType?: string; q?: string; limit?: number } = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && v !== "" && qs.set(k, String(v)));
  return request<DocList>("GET", "/v1/documents" + (qs.toString() ? "?" + qs : ""));
};
export const getDocument = (id: string) => request<DocumentDetail>("GET", `/v1/documents/${id}`);

export interface DocumentDetail {
  id: string; docType: string; title: string; status: string; currentVersion: number; correlationId?: string;
  versions: { versionNo: number; ddmVersion: string; template?: string; templateVersion?: number; engineVersion?: string; createdAt: string }[];
  latestResult: JobResult | null; createdAt: string; updatedAt: string;
}

export interface SubmitResponse {
  requestId: string; documentId: string; status: string; lifecycle?: Lifecycle;
  jobId?: string; statusUrl?: string; requiredApprovals?: number; message?: string; reviewUrl?: string; replay?: boolean;
}
export const submitDocument = (req: unknown, idem: string) => request<SubmitResponse>("POST", "/v1/documents", { body: req, idem });
export const validateDocument = (req: unknown) => request<{ valid: boolean; errors: ApiError[]; warnings: unknown[]; resolved?: unknown }>("POST", "/v1/validate", { body: req });

// ---- approvals ----
export interface InboxItem { documentId: string; docType: string; title: string; classification: { scheme?: string; level?: string }; lifecycle: Lifecycle; version: number; submittedAt?: string; submittedBy?: string }
export const approvalsInbox = () => request<{ items: InboxItem[]; count: number }>("GET", "/v1/approvals?state=pending");
export const decide = (id: string, decision: "approve" | "reject" | "return", comment?: string, outputs?: string[]) =>
  request<{ documentId: string; decision: string; lifecycle: Lifecycle; approvals: number; required: number; jobId?: string; statusUrl?: string }>(
    "POST", `/v1/documents/${id}/decision`, { body: { decision, comment, outputs } });

// ---- publish / withdraw ----
export const publish = (id: string) => request<{ documentId: string; lifecycle: Lifecycle }>("POST", `/v1/documents/${id}/publish`, { body: {} });
export const withdraw = (id: string) => request<{ documentId: string; lifecycle: Lifecycle }>("POST", `/v1/documents/${id}/withdraw`, { body: {} });

// ---- jobs / artifacts ----
export interface ArtifactRef { artifactId: string; role: string; format: string; sizeBytes: number; pages?: number | null; sha256: string; classification?: string | null }
export interface JobResult { schemaVersion: string; requestId: string; jobId: string; status: string; artifacts: ArtifactRef[]; warnings: unknown[]; error: ApiError | null }
export interface JobView { jobId: string; requestId: string; status: string; progress: number; result: JobResult | null; error: ApiError | null; createdAt: string; updatedAt: string }
export const getJob = (id: string) => request<JobView>("GET", `/v1/jobs/${id}`);
export const artifactGrant = (id: string) => request<{ downloadUrl: string; expiresIn: number }>("POST", `/v1/artifacts/${id}/grant`, { body: {} });

// ---- admin ----
export interface AdminClient { id: string; name: string; clientId: string; scopes: string[]; clearance: string; active: boolean; createdAt: string; lastUsedAt?: string | null }
export const listClients = () => request<{ items: AdminClient[]; count: number }>("GET", "/v1/admin/clients");
export const createClient = (name: string, scopes?: string[], clearance?: string) =>
  request<{ id: string; clientId: string; secret: string; scopes: string[]; clearance: string; message: string }>("POST", "/v1/admin/clients", { body: { name, scopes, clearance } });
export const updateClient = (id: string, patch: { active?: boolean; scopes?: string[]; clearance?: string }) =>
  request<{ id: string; updated: boolean }>("PATCH", `/v1/admin/clients/${id}`, { body: patch });

export interface AdminMember { id: string; userId: string; role: string; clearance: string; status: string; createdAt: string }
export const listMembers = () => request<{ items: AdminMember[]; count: number }>("GET", "/v1/admin/members");
export const upsertMember = (userId: string, role: string, clearance: string) =>
  request<{ id: string; userId: string; role: string; clearance: string }>("POST", "/v1/admin/members", { body: { userId, role, clearance } });

export interface AdminPolicy { id: string; docType: string | null; classificationLevel: string | null; requiredApprovals: number; minApproverClearance: string | null; autoApproveService: boolean; autoApproveUser: boolean }
export const listPolicies = () => request<{ items: AdminPolicy[]; count: number }>("GET", "/v1/admin/policies");
export const upsertPolicy = (p: { docType?: string; classificationLevel?: string; requiredApprovals: number; minApproverClearance?: string; autoApproveService?: boolean; autoApproveUser?: boolean }) =>
  request<{ id: string; requiredApprovals: number }>("POST", "/v1/admin/policies", { body: p });

export interface RetentionPolicy { id: string; classificationLevel: string | null; retentionDays: number; purgeGraceDays: number }
export const listRetention = () => request<{ items: RetentionPolicy[]; count: number }>("GET", "/v1/admin/retention-policies");
export const upsertRetention = (p: { classificationLevel?: string; retentionDays: number; purgeGraceDays: number }) =>
  request<{ id: string; retentionDays: number; purgeGraceDays: number }>("POST", "/v1/admin/retention-policies", { body: p });

export interface Template { id: string; docType: string; title: string; requiredRoles: string[]; optionalRoles: string[]; active: boolean; overrides: boolean }
export const listTemplates = () => request<{ builtins: string[]; items: Template[]; count: number }>("GET", "/v1/admin/templates");
export const upsertTemplate = (p: { docType: string; title?: string; requiredRoles: string[]; optionalRoles?: string[]; active?: boolean }) =>
  request<{ id: string; docType: string }>("POST", "/v1/admin/templates", { body: p });
export const deleteTemplate = (docType: string) =>
  request<{ docType: string; deleted: boolean }>("DELETE", `/v1/admin/templates/${encodeURIComponent(docType)}`);

// ---- audit ----
export interface AuditEvent { eventId: string; actor: string; actorType: string; action: string; targetType?: string; targetId?: string; classification?: string; requestId?: string; correlationId?: string; sha256?: string; ts: string }
export const audit = (params: { target?: string; action?: string; limit?: number } = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && v !== "" && qs.set(k, String(v)));
  return request<{ events: AuditEvent[]; count: number }>("GET", "/v1/audit" + (qs.toString() ? "?" + qs : ""));
};
