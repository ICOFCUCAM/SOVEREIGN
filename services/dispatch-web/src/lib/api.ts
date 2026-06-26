// Typed client for the Dispatch API. Same-origin in production (the SPA is
// served behind the same gateway as /v1) or proxied in dev (vite.config). The
// bearer token is held in memory only (see auth.ts) — never localStorage — so a
// closed tab drops the session, appropriate for classified material.

const BASE = import.meta.env.VITE_DISPATCH_API_URL ?? "";

// The externally-reachable API origin, for credential handoff / integration docs.
// Same-origin in production (empty BASE → the page origin); an explicit host in dev.
export const API_BASE = (): string =>
  BASE || (typeof window !== "undefined" ? window.location.origin : "");

export interface ApiError { code: string; message: string; field?: string | null; requestId?: string | null }
export class DispatchError extends Error {
  code: string; status: number; field?: string | null;
  constructor(status: number, err: ApiError) { super(err.message); this.code = err.code; this.status = status; this.field = err.field; }
}

let getToken: () => string | null = () => null;
export function bindTokenGetter(fn: () => string | null) { getToken = fn; }

// Institutional error language. An enterprise console never shows raw backend
// strings ("missing Authorization", "bad secret"); it explains, in the user's
// terms, what happened and what to do. Map known codes/statuses to human copy;
// for anything unmapped fall back to the caller's plain-language default —
// never the wire message.
const ERROR_COPY: Record<string, string> = {
  UNAUTHENTICATED: "Your session has ended. Please sign in again.",
  INVALID_TOKEN: "Your session is no longer valid. Please sign in again.",
  TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  INVALID_CLIENT: "Those credentials weren't recognized. Check your Client ID and secret, or create a free evaluation account.",
  FORBIDDEN_SCOPE: "Your credentials don't carry permission for this action.",
  SCOPE_NOT_ISSUABLE: "That permission can't be self-issued.",
  QUOTA_EXCEEDED: "You've reached your free evaluation limit. Subscribe to create more official records.",
  PAYMENT_REQUIRED: "Retrieving publication artifacts requires a Professional subscription.",
  VALIDATION_FAILED: "Some fields need attention before this can be submitted.",
};
export function humanError(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (e instanceof DispatchError) {
    if (ERROR_COPY[e.code]) return ERROR_COPY[e.code];
    if (e.status === 401) return ERROR_COPY.UNAUTHENTICATED;
    if (e.status === 403) return ERROR_COPY.FORBIDDEN_SCOPE;
    if (e.status >= 500) return "The service is temporarily unavailable. Please try again shortly.";
    // 4xx carrying a server-authored, user-safe message (e.g. field validation): show it.
    if (e.status >= 400 && e.message) return e.message;
  }
  if (e instanceof TypeError) return "Couldn't reach the service. Check your connection and try again.";
  return fallback;
}

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

// ---- institutional SSO (item 2) ----
// The browser is sent to the API's SSO-start endpoint, which 302-redirects to the
// institution's IdP. On success the API redirects back to `redirect` with the
// session token in the URL fragment (#sso_token=…), consumed by the auth provider.
export const ssoStartUrl = (email: string, redirect: string) =>
  `${BASE}/v1/auth/sso/start?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect)}`;
export interface SsoConnection { provider: string; issuer: string; clientId: string; emailDomain: string; enabled: boolean; secretSet?: boolean }
export const getSsoConnection = () => request<{ connection: SsoConnection | null }>("GET", "/v1/auth/sso/connection");
export const saveSsoConnection = (c: { issuer: string; clientId: string; clientSecret?: string; emailDomain: string; enabled?: boolean }) =>
  request<{ connected: boolean }>("POST", "/v1/auth/sso/connection", { body: c });

// ---- token exchange (client credentials) ----
export interface TokenResponse { access_token: string; token: string; tokenType: string; expiresIn: number; tenantId: string; scopes: string[] }
export const exchangeToken = (client_id: string, secret: string) =>
  request<TokenResponse>("POST", "/v1/token", { body: { client_id, secret } });

// ---- admin: service-client credentials (tenant self-service; dispatch:admin) ----
export interface ServiceClient {
  client_id: string; name: string; scopes: string[]; clearance: string; active: boolean;
  created_by?: string | null; created_at: string; last_used_at?: string | null; last_rotated_at?: string | null;
}
// The raw secret is present ONLY in the issue/rotate responses, and shown once.
export interface IssuedCredential { client_id: string; secret: string; name?: string; scopes?: string[]; note?: string }

export const listClients = () => request<{ clients: ServiceClient[] }>("GET", "/v1/admin/clients");
export const issueClient = (name: string, scopes: string[], clearance?: string) =>
  request<IssuedCredential>("POST", "/v1/admin/clients", { body: { name, scopes, clearance } });
export const rotateClient = (clientId: string) =>
  request<IssuedCredential>("POST", `/v1/admin/clients/${encodeURIComponent(clientId)}/rotate`, { body: {} });
export const revokeClient = (clientId: string) =>
  request<{ client_id: string; revoked: boolean }>("POST", `/v1/admin/clients/${encodeURIComponent(clientId)}/revoke`, { body: {} });

// ---- event webhooks (the reverse API: Dispatch → the customer's systems) ----
export interface WebhookEndpoint { id: string; url: string; events: string[]; description?: string | null; active: boolean; last_status?: string | null; last_delivery_at?: string | null; created_at: string }
export interface WebhookOverview { endpoints: WebhookEndpoint[]; deliveries: Record<string, number>; availableEvents: string[] }
export interface CreatedWebhook { id: string; url: string; events: string[]; secret: string; note?: string }
export const getWebhooks = () => request<WebhookOverview>("GET", "/v1/admin/webhooks");
export const createWebhook = (url: string, events: string[], description?: string) =>
  request<CreatedWebhook>("POST", "/v1/admin/webhooks", { body: { url, events, description } });
export const deleteWebhook = (id: string) => request<{ deleted: string }>("DELETE", "/v1/admin/webhooks", { body: { id } });
export const testWebhook = (id: string) => request<{ tested: string; attempted: number }>("POST", `/v1/admin/webhooks/${encodeURIComponent(id)}/test`, { body: {} });

// ---- self-serve signup + billing (plans / subscribe-to-download) ----
export interface SignupResponse { tenantId: string; client_id: string; secret: string; plan: string; scopes: string[]; note?: string }
export const signup = (name: string) => request<SignupResponse>("POST", "/v1/signup", { body: { name } });

export interface Billing { plan: string; subscriptionStatus: string; documentsUsed: number; documentQuota: number; quotaRemaining: number; canDownload: boolean; activated?: boolean }
export const getBilling = () => request<Billing>("GET", "/v1/billing");
export const subscribe = () => request<Billing>("POST", "/v1/billing/subscribe", { body: {} });

export interface Stats { officialRecords: number; artifactsGenerated: number; approvalDecisions: number; auditEvents: number; published: number }
export const getStats = () => request<Stats>("GET", "/v1/stats");

// ---- governance policies (first-class, institution-defined, executable) ----
export interface ReviewStep { role?: string; label: string; quorum?: number; clearance?: string }
export interface GovernancePolicy {
  id?: string; name: string; docType: string; classificationLevel?: string | null;
  requiredApprovals: number; reviewChain: ReviewStep[];
  approvalAuthority?: string | null; publicationAuthority?: string | null;
  retentionDays?: number | null; autoApproveService?: boolean; autoApproveUser?: boolean; active?: boolean;
  sequential?: boolean; approvalTtlDays?: number | null; policyVersion?: number; updatedAt?: string;
}
export const getGovernancePolicies = () => request<{ policies: GovernancePolicy[] }>("GET", "/v1/governance/policies");
export const upsertGovernancePolicy = (p: GovernancePolicy) => request<{ id: string }>("POST", "/v1/governance/policies", { body: p });

// ---- departments / offices / holders (the institutional org tree) ----
// Tenant → Departments → Offices (roles) → Holders (grants). A department groups
// offices; an office is the unit of authority; a holder occupies an office.
export interface Department { key: string; name: string; display_order?: number }
export interface GovRole { key: string; label: string; department_key?: string | null; display_order?: number }
export interface GovGrant { subject: string; role_key: string }
export interface GovDelegation { role_key: string; delegate_subject: string; grantor_subject?: string | null; reason?: string | null; starts_at?: string; ends_at: string; expired?: boolean }
export const getGovernance = () => request<{ departments?: Department[]; roles: GovRole[]; grants: GovGrant[]; delegations: GovDelegation[] }>("GET", "/v1/governance/roles");
export const createGovRole = (key: string, label: string, departmentKey?: string, displayOrder?: number) =>
  request<{ key: string }>("POST", "/v1/governance/roles", { body: { key, label, departmentKey, displayOrder } });
export const createDepartment = (key: string, name: string, displayOrder?: number) =>
  request<{ key: string }>("POST", "/v1/governance/departments", { body: { key, name, displayOrder } });
export const grantGovRole = (subject: string, roleKey: string) => request<{ subject: string }>("POST", "/v1/governance/grants", { body: { subject, roleKey } });
// ---- org lifecycle (edit/reassign/delete/revoke) ----
export const deleteDepartment = (key: string) => request<{ deleted: string }>("DELETE", "/v1/governance/departments", { body: { key } });
export const deleteGovRole = (key: string) => request<{ deleted: string }>("DELETE", "/v1/governance/roles", { body: { key } });
export const revokeGovRole = (subject: string, roleKey: string) => request<{ revoked: unknown }>("DELETE", "/v1/governance/grants", { body: { subject, roleKey } });

// ---- people (human directory) ----
// A person belongs to the tenant and occupies offices (a grant with subject
// "user:<id>"). Identity only; institutional SSO federates onto this next.
export interface Person { id: string; subject: string; email: string; fullName: string; departmentKey?: string | null; systemAdmin: boolean; status: string }
export const getUsers = () => request<{ users: Person[] }>("GET", "/v1/users");
export const createUser = (p: { email: string; fullName: string; departmentKey?: string; systemAdmin?: boolean }) =>
  request<{ id: string; subject: string }>("POST", "/v1/users", { body: p });
export const deleteUser = (id: string) => request<{ deleted: string }>("DELETE", "/v1/users", { body: { id } });
export const createDelegation = (d: { roleKey: string; delegateSubject: string; grantorSubject?: string; reason?: string; endsAt: string }) =>
  request<{ delegated: boolean }>("POST", "/v1/governance/delegations", { body: d });
export const endDelegation = (roleKey: string, delegateSubject: string) =>
  request<{ ended: unknown }>("DELETE", "/v1/governance/delegations", { body: { roleKey, delegateSubject } });

// ---- governance overview (monitor + compliance) ----
export interface GovPending { documentId: string; title: string; docType: string; classification: { level?: string }; submittedAt?: string; awaiting: string; policyName?: string | null }
export interface GovOverview {
  pending: GovPending[];
  awaitingPublication: { documentId: string; title: string; docType: string; classification: { level?: string } }[];
  delegations: GovDelegation[];
  compliance: { published: number; preserved: number; governed: number; compliant: number; complianceRate: number; exceptions: number; expiredAuthorities: number };
}
export const getGovernanceOverview = () => request<GovOverview>("GET", "/v1/governance/overview");

// ---- governance intelligence (analytics) ----
export interface GovIntelligence {
  cycleHours: { submitToApprove: number | null; approveToPublish: number | null; publishToArchive: number | null };
  oldestInFlight: { documentId: string; title: string; docType: string; classification: { level?: string }; hoursWaiting: number | null; awaiting?: string }[];
  policyPerformance: { policy: string; volume: number; avgDays: number | null; complianceRate: number }[];
  throughput: { day: string; count: number }[];
  authorityPerformance: { role: string; avgResponseHours: number | null; decisions: number }[];
  workloadByAuthority: { role: string; count: number }[];
  aging: { bucket: string; count: number }[];
  atRisk: { documentId: string; title: string; docType: string; classification: { level?: string }; role: string; hoursLeft: number | null }[];
}
export const getGovernanceIntelligence = () => request<GovIntelligence>("GET", "/v1/governance/intelligence");

// ---- evaluation assessment (platform-generated evidence) ----
export type MaturityStatus = "active" | "configurable" | "architected";
export interface EvaluationAssessment {
  summary: { published: number; preserved: number; governed: number; compliant: number; complianceRate: number; policies: number; chainedPolicies: number; authorities: number; apiConsumers: number };
  maturity: { capability: string; status: MaturityStatus; evidence: string }[];
  dimensions: { name: string; score: number }[];
  overall: number;
}
export const getEvaluationAssessment = () => request<EvaluationAssessment>("GET", "/v1/evaluation/assessment");

// ---- Platform Operator domain (dispatch:platform; content-blind aggregates) --
// Cross-tenant COUNTS / RATES / DISTRIBUTIONS only — never tenant content. 403
// FORBIDDEN_SCOPE for any credential lacking the dispatch:platform scope.
export interface PlatformOverview {
  institutions: number;
  activeInstitutions: number;
  activeSubscriptions: number;
  records: number;
  published: number;
  preserved: number;
  policyInstitutions: number;
  editionDistribution: Record<string, number>;
  events: Record<string, number>;
}
export interface PlatformTrends {
  days: number;
  institutions: { day: string; n: number }[];
  records: { day: string; n: number }[];
}
// ---- authoring assist (pre-governance drafting aid; the author chooses to apply) ----
export interface AssistRequest { docType: string; fieldHeading: string; kind: string; intent: "develop" | "polish" | "restructure" | "shorten"; text: string; classification: string }
export const assistField = (b: AssistRequest) => request<{ suggestion: string }>("POST", "/v1/authoring/assist", { body: b });

export const getPlatformOverview = () => request<PlatformOverview>("GET", "/v1/platform/overview");
export const getPlatformTrends = (days = 30) => request<PlatformTrends>("GET", `/v1/platform/trends?days=${days}`);

// ---- governance (compliance) certificate ----
export interface GovernanceCertificate {
  recordId: string; policyName: string; policyVersion: number;
  requiredRoles: { step: number; role: string; label: string; quorum: number }[];
  actualRoles: { step: number; role: string; label: string; satisfiedBy: string[] }[];
  approvalSequence: { role: string; actor: string; onBehalfOf?: string | null; decidedAt: string }[];
  delegations: { role: string; actor: string; onBehalfOf: string }[];
  separationOfDuties: string; publishedBy: string; publicationAuthority?: string | null;
  complianceResult: string; integrityProof: string;
}
export const getGovernanceCertificate = (id: string) => request<{ certificate: GovernanceCertificate }>("GET", `/v1/documents/${id}/governance-certificate`);

// ---- documents / lifecycle ----
export type Lifecycle = "draft" | "submitted" | "in_review" | "approved" | "rejected" | "rendered" | "published" | "withdrawn" | "archived";

// Institutional posture — the engine's state spoken as institutional fact. Every
// field is null when governance can't prove it (an unnamed/quorum policy); the UI
// falls back honestly rather than inventing an authority. Computed server-side.
export interface Posture {
  policyName?: string | null; policyVersion?: number | null;
  currentAuthority?: string | null; nextAuthority?: string | null;
  currentRole?: string | null; nextRole?: string | null;
  approvalAuthority?: string | null; publicationAuthority?: string | null; publicationRole?: string | null;
  waitingSince?: string | null; status?: string | null;
}

// ---- the office home (institutional operations) ----
// Authority belongs to an OFFICE; a person OCCUPIES it. This is what an operator
// sees on login: the offices they hold and the records under their authority.
export interface Office { key: string; label: string; department?: string | null; delegated?: boolean }
export interface AuthorityRecord extends Posture {
  documentId: string; title: string; docType: string;
  classification?: { scheme?: string; level?: string }; submittedBy?: string | null; viaDelegation?: boolean;
  lifecycle?: string; action?: "decide" | "publish";
}
export interface MyAuthority {
  offices: Office[];
  underYourAuthority: AuthorityRecord[];
  counts: { offices: number; awaitingYou: number };
}
export const getMyAuthority = () => request<MyAuthority>("GET", "/v1/governance/my-authority");

export interface DocListItem extends Posture {
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

// One step in a record's institutional approval chain, with its live standing.
export interface ChainStep { label: string; quorum: number; by: string[]; state: "done" | "current" | "pending"; publication?: boolean }
export interface DocumentDetail {
  id: string; docType: string; title: string; status: string; lifecycle?: Lifecycle; currentVersion: number; correlationId?: string;
  publishedAt?: string; archivedAt?: string; preservationSha256?: string;
  versions: { versionNo: number; ddmVersion: string; template?: string; templateVersion?: number; engineVersion?: string; createdAt: string }[];
  latestResult: JobResult | null; createdAt: string; updatedAt: string; posture?: Posture;
  submittedBy?: { name?: string | null; office?: string | null };
  governanceChain?: ChainStep[]; governanceRejected?: boolean;
}

export interface SubmitResponse {
  requestId: string; documentId: string; status: string; lifecycle?: Lifecycle;
  jobId?: string; statusUrl?: string; requiredApprovals?: number; message?: string; reviewUrl?: string; replay?: boolean;
}
export const submitDocument = (req: unknown, idem: string) => request<SubmitResponse>("POST", "/v1/documents", { body: req, idem });
export const validateDocument = (req: unknown) => request<{ valid: boolean; errors: ApiError[]; warnings: unknown[]; resolved?: unknown }>("POST", "/v1/validate", { body: req });

// ---- approvals ----
export interface InboxItem { documentId: string; docType: string; title: string; classification: { scheme?: string; level?: string }; lifecycle: Lifecycle; version: number; submittedAt?: string; submittedBy?: string; submittedByName?: string | null; currentAuthority?: string | null; currentRole?: string | null }
export const approvalsInbox = () => request<{ items: InboxItem[]; count: number }>("GET", "/v1/approvals?state=pending");
export const decide = (id: string, decision: "approve" | "reject" | "return", comment?: string, outputs?: string[]) =>
  request<{ documentId: string; decision: string; lifecycle: Lifecycle; approvals: number; required: number; jobId?: string; statusUrl?: string }>(
    "POST", `/v1/documents/${id}/decision`, { body: { decision, comment, outputs } });

// ---- publish / withdraw / archive (preservation) ----
export const publish = (id: string) => request<{ documentId: string; lifecycle: Lifecycle }>("POST", `/v1/documents/${id}/publish`, { body: {} });
export const withdraw = (id: string) => request<{ documentId: string; lifecycle: Lifecycle }>("POST", `/v1/documents/${id}/withdraw`, { body: {} });
export const archiveDocument = (id: string) => request<{ documentId: string; lifecycle: Lifecycle; preservationSha256: string }>("POST", `/v1/documents/${id}/archive`, { body: {} });

export interface PreservationCertificate {
  recordId: string; docType: string; title: string; classification: { scheme?: string; level?: string };
  lifecycle: string; version: number; publishedAt?: string; archivedAt?: string;
  recordHash: string; integrityProof: string;
  governancePolicy: { name: string; reviewChain: { label: string }[]; approvalAuthority?: string | null; publicationAuthority?: string | null };
  approvalChain: { actor: string; decision: string; clearance?: string | null; ts: string }[];
}
export const getCertificate = (id: string) => request<{ certificate: PreservationCertificate }>("GET", `/v1/documents/${id}/certificate`);

// ---- jobs / artifacts ----
export interface ArtifactRef { artifactId: string; role: string; format: string; sizeBytes: number; pages?: number | null; sha256: string; classification?: string | null }
export interface JobResult { schemaVersion: string; requestId: string; jobId: string; status: string; artifacts: ArtifactRef[]; warnings: unknown[]; error: ApiError | null }
export interface JobView { jobId: string; requestId: string; status: string; progress: number; result: JobResult | null; error: ApiError | null; createdAt: string; updatedAt: string }
export const getJob = (id: string) => request<JobView>("GET", `/v1/jobs/${id}`);
export const artifactGrant = (id: string) => request<{ downloadUrl: string; expiresIn: number }>("POST", `/v1/artifacts/${id}/grant`, { body: {} });

// ---- audit ----
export interface AuditEvent { eventId: string; actor: string; actorType: string; action: string; targetType?: string; targetId?: string; classification?: string; requestId?: string; correlationId?: string; sha256?: string; ts: string }
export const audit = (params: { target?: string; action?: string; limit?: number } = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && v !== "" && qs.set(k, String(v)));
  return request<{ events: AuditEvent[]; count: number }>("GET", "/v1/audit" + (qs.toString() ? "?" + qs : ""));
};
