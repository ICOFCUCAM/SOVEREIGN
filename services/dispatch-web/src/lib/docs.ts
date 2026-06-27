// Layer 5 of the SEO ecosystem — Developer Documentation. Grounded in the real
// Dispatch Platform API (see public/openapi.json) and the published SDKs. Indexed
// by Google like any content; emits TechArticle structured data. A persistent
// sidebar groups the docs; each page is a sequence of typed blocks the renderer
// understands (prose, code, endpoints, parameter tables, callouts).

export type DocBlock =
  | { t: "p"; s: string }
  | { t: "h"; s: string }
  | { t: "code"; lang: string; s: string }
  | { t: "list"; items: string[] }
  | { t: "note"; s: string }
  | { t: "endpoint"; method: string; path: string; s: string }
  | { t: "table"; head: string[]; rows: string[][] };

export interface Doc {
  slug: string;
  title: string;
  group: string;
  summary: string;       // one line, used in nav + meta description
  blocks: DocBlock[];
  metaTitle: string;
}

export const DOCS_BASE = "/docs";
export const API_BASE_URL = "https://api.dispatch.sovereigndo.com";

export const DOCS: Doc[] = [
  {
    slug: "overview",
    title: "Introduction",
    group: "Getting started",
    summary: "What the Dispatch Platform API does and how its pieces fit together.",
    metaTitle: "Dispatch API Documentation — Introduction",
    blocks: [
      { t: "p", s: "The Dispatch Platform API turns a document into an Official Record: governed through an enforced approval chain, sealed with an integrity proof, and made permanently verifiable. Everything the console does is available over the API, so you can wire governed publication directly into your own systems." },
      { t: "p", s: "The API is organised around a small number of resources — documents (records), the approval chain, certificates, verification, and administration (clients, webhooks, governance). It is JSON over HTTPS, authenticated with short-lived Bearer tokens minted from a client credential." },
      { t: "h", s: "Base URL" },
      { t: "code", lang: "text", s: "https://api.dispatch.sovereigndo.com" },
      { t: "note", s: "Public verification (GET /v1/verify/{id}) needs no authentication — anyone can confirm an Official Record. Everything else requires a Bearer token." },
      { t: "h", s: "The shape of a record's life" },
      { t: "list", items: [
        "Submit a document (POST /v1/documents) — it enters the approval chain.",
        "Approvers act on it (POST /v1/documents/{id}/decision) until governance is satisfied.",
        "Publish it (POST /v1/documents/{id}/publish) — it becomes an Official Record with a permanent id.",
        "Anyone verifies it (GET /v1/verify/{id}); you can pull its Governance and Preservation certificates.",
        "Archive it (POST /v1/documents/{id}/archive) to preserve it for its retention life.",
      ] },
      { t: "p", s: "The next pages cover authentication, a first request, the document lifecycle, verification, webhooks, the SDKs, the architecture, and the record schema." },
    ],
  },
  {
    slug: "authentication",
    title: "Authentication",
    group: "Getting started",
    summary: "Exchange a client credential for a short-lived Bearer token.",
    metaTitle: "Dispatch API — Authentication",
    blocks: [
      { t: "p", s: "Dispatch uses two-step authentication: a long-lived client credential (a client_id and secret issued to a system) is exchanged for a short-lived Bearer token, which authorises each API call. Tokens expire; credentials are rotated, not embedded in requests." },
      { t: "h", s: "1. Get a client credential" },
      { t: "p", s: "An institution administrator issues a credential to an external system from the console, or via the API. Treat the secret like a password — it is shown once." },
      { t: "endpoint", method: "POST", path: "/v1/admin/clients", s: "Create an API client (issue a credential for an external system)." },
      { t: "h", s: "2. Exchange it for a token" },
      { t: "endpoint", method: "POST", path: "/v1/token", s: "Exchange an API client credential for a short-lived Bearer token." },
      { t: "code", lang: "bash", s: "curl -X POST https://api.dispatch.sovereigndo.com/v1/token \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"client_id\":\"svc-...\",\"secret\":\"...\"}'\n\n# => { \"token\": \"eyJ...\", \"expires_in\": 900 }" },
      { t: "note", s: "The field is `secret`, not `client_secret`. Tokens are short-lived — mint a fresh one when it expires rather than caching it indefinitely." },
      { t: "h", s: "3. Call the API with the token" },
      { t: "code", lang: "bash", s: "curl https://api.dispatch.sovereigndo.com/v1/documents \\\n  -H 'Authorization: Bearer eyJ...'" },
      { t: "h", s: "Rotating and revoking" },
      { t: "list", items: [
        "POST /v1/admin/clients/{clientId}/rotate — rotate a secret without downtime.",
        "POST /v1/admin/clients/{clientId}/revoke — cut a system off immediately.",
      ] },
    ],
  },
  {
    slug: "quickstart",
    title: "Quickstart",
    group: "Getting started",
    summary: "Submit, publish and verify your first Official Record.",
    metaTitle: "Dispatch API — Quickstart",
    blocks: [
      { t: "p", s: "This walkthrough takes a document from submission to a verifiable Official Record. It assumes you have a Bearer token (see Authentication)." },
      { t: "h", s: "Submit a document" },
      { t: "endpoint", method: "POST", path: "/v1/documents", s: "Submit a document as an Official Record (enters the approval chain)." },
      { t: "code", lang: "bash", s: "curl -X POST https://api.dispatch.sovereigndo.com/v1/documents \\\n  -H 'Authorization: Bearer eyJ...' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\n    \"title\": \"Board Resolution 2026-014\",\n    \"kind\": \"resolution\",\n    \"body\": \"The Board resolves ...\",\n    \"office\": \"board\"\n  }'" },
      { t: "note", s: "Use POST /v1/validate first to dry-run a request — it checks the payload and governance without creating a record." },
      { t: "h", s: "Move it through approval" },
      { t: "endpoint", method: "POST", path: "/v1/documents/{id}/decision", s: "Approve, reject or return a record (act on the approval chain)." },
      { t: "h", s: "Publish it" },
      { t: "endpoint", method: "POST", path: "/v1/documents/{id}/publish", s: "Publish a rendered record as an Official Record — mints the permanent id." },
      { t: "h", s: "Verify it" },
      { t: "endpoint", method: "GET", path: "/v1/verify/{id}", s: "Publicly verify an Official Record by its permanent id (no auth)." },
      { t: "code", lang: "bash", s: "curl https://api.dispatch.sovereigndo.com/v1/verify/SD-2026-000123\n\n# => { \"official\": true, \"title\": \"...\", \"issued_by\": \"...\", \"sealed\": true }" },
    ],
  },
  {
    slug: "documents",
    title: "Documents & the approval chain",
    group: "Core API",
    summary: "The endpoints that move a record through its governed lifecycle.",
    metaTitle: "Dispatch API — Documents & Approval Chain",
    blocks: [
      { t: "p", s: "A document (record) is the central resource. It carries its content, its posture in the lifecycle, the chain of authority that has acted on it, and — once published — its permanent Official Record id." },
      { t: "h", s: "Endpoints" },
      { t: "endpoint", method: "POST", path: "/v1/documents", s: "Submit a document as an Official Record." },
      { t: "endpoint", method: "GET", path: "/v1/documents", s: "List records — the library and queues." },
      { t: "endpoint", method: "GET", path: "/v1/documents/{id}", s: "Retrieve one record — full posture, versions, chain of authority." },
      { t: "endpoint", method: "POST", path: "/v1/documents/{id}/decision", s: "Approve, reject or return a record." },
      { t: "endpoint", method: "POST", path: "/v1/documents/{id}/publish", s: "Publish a rendered record as an Official Record." },
      { t: "endpoint", method: "POST", path: "/v1/documents/{id}/withdraw", s: "Withdraw a rendered or published record." },
      { t: "endpoint", method: "POST", path: "/v1/documents/{id}/archive", s: "Preserve (archive) a published record." },
      { t: "h", s: "The approver inbox" },
      { t: "p", s: "Records awaiting a decision by the authenticated caller are available as a queue, so an integration can surface a reviewer's pending work." },
      { t: "endpoint", method: "GET", path: "/v1/approvals", s: "The approver inbox — records awaiting a decision." },
      { t: "h", s: "The evidence trail" },
      { t: "endpoint", method: "GET", path: "/v1/audit", s: "The evidence trail — append-only, hash-stamped." },
      { t: "note", s: "The audit trail is append-only and hash-stamped: entries are added, never changed, and each is bound to the record state it describes." },
    ],
  },
  {
    slug: "verification",
    title: "Verification & certificates",
    group: "Core API",
    summary: "Publicly verify a record and pull its governance and preservation certificates.",
    metaTitle: "Dispatch API — Verification & Certificates",
    blocks: [
      { t: "p", s: "Verification is what makes an Official Record trustworthy to anyone. The verify endpoint needs no authentication — a recipient, a court, or another institution can confirm a record independently." },
      { t: "endpoint", method: "GET", path: "/v1/verify/{id}", s: "Publicly verify an Official Record by its permanent id (no auth)." },
      { t: "p", s: "The response confirms whether the id resolves to a genuine, sealed Official Record, who issued it, and that the record is intact. Free-tier records are minted in a non-official namespace and report official=false, so an evaluation record can never be mistaken for a real one." },
      { t: "h", s: "Certificates" },
      { t: "p", s: "Two certificates accompany a record. The Governance Certificate proves the approval chain was satisfied — who approved, in what order, on which version. The Preservation Certificate proves the sealed, archived record's integrity." },
      { t: "endpoint", method: "GET", path: "/v1/documents/{id}/governance-certificate", s: "Governance Certificate — proof the approval chain was satisfied." },
      { t: "endpoint", method: "GET", path: "/v1/documents/{id}/certificate", s: "Preservation Certificate — proof of the sealed, archived record." },
      { t: "h", s: "Verifying an exact file" },
      { t: "p", s: "Integrity is checked at the level of the exact artifact: the produced file is bound to a cryptographic fingerprint, so altering a single byte breaks verification. Artifacts are fetched, and short-lived download URLs minted, through the artifacts endpoints." },
      { t: "endpoint", method: "GET", path: "/v1/artifacts/{id}", s: "Download a produced artifact." },
      { t: "endpoint", method: "POST", path: "/v1/artifacts/{id}/grant", s: "Mint a short-lived single-artifact download URL." },
    ],
  },
  {
    slug: "webhooks",
    title: "Webhooks",
    group: "Core API",
    summary: "Receive events when records move through their lifecycle.",
    metaTitle: "Dispatch API — Webhooks",
    blocks: [
      { t: "p", s: "Rather than poll, register an endpoint and Dispatch will POST events to it as records are submitted, approved, published, verified or archived. This lets your systems react in real time — notify an approver, update a ledger, trigger a downstream publish." },
      { t: "h", s: "Managing endpoints" },
      { t: "endpoint", method: "GET", path: "/v1/admin/webhooks", s: "List registered endpoints and delivery stats." },
      { t: "endpoint", method: "POST", path: "/v1/admin/webhooks", s: "Register an endpoint Dispatch will POST events to." },
      { t: "endpoint", method: "DELETE", path: "/v1/admin/webhooks", s: "Remove a webhook endpoint." },
      { t: "endpoint", method: "POST", path: "/v1/admin/webhooks/{id}/test", s: "Send a test delivery to an endpoint." },
      { t: "h", s: "Delivery" },
      { t: "list", items: [
        "Each delivery is signed so you can verify it came from Dispatch.",
        "Deliveries are retried with backoff; delivery stats are available on the list endpoint.",
        "Respond 2xx quickly and do downstream work asynchronously.",
      ] },
      { t: "note", s: "Verify the signature on every delivery before acting on it, and treat the event as a trigger to fetch authoritative state from the API rather than as the source of truth." },
    ],
  },
  {
    slug: "sdks",
    title: "SDKs",
    group: "Tools",
    summary: "Official TypeScript and Python clients generated from the API.",
    metaTitle: "Dispatch API — TypeScript & Python SDKs",
    blocks: [
      { t: "p", s: "Dispatch ships TypeScript and Python SDKs that wrap authentication, requests and types, so you work with records rather than raw HTTP. Both are generated from the same OpenAPI definition that backs this documentation." },
      { t: "h", s: "TypeScript" },
      { t: "code", lang: "bash", s: "npm install @sovereign-dispatch/sdk" },
      { t: "code", lang: "typescript", s: "import { Dispatch } from \"@sovereign-dispatch/sdk\";\n\nconst dispatch = new Dispatch({\n  clientId: process.env.DISPATCH_CLIENT_ID!,\n  secret: process.env.DISPATCH_SECRET!,\n});\n\nconst record = await dispatch.documents.submit({\n  title: \"Board Resolution 2026-014\",\n  kind: \"resolution\",\n  office: \"board\",\n  body: \"The Board resolves ...\",\n});\n\nawait dispatch.documents.publish(record.id);\nconst proof = await dispatch.verify(record.id); // { official: true, ... }" },
      { t: "h", s: "Python" },
      { t: "code", lang: "bash", s: "pip install sovereign-dispatch" },
      { t: "code", lang: "python", s: "from sovereign_dispatch import Dispatch\n\ndispatch = Dispatch(client_id=..., secret=...)\n\nrecord = dispatch.documents.submit(\n    title=\"Board Resolution 2026-014\",\n    kind=\"resolution\",\n    office=\"board\",\n    body=\"The Board resolves ...\",\n)\n\ndispatch.documents.publish(record.id)\nproof = dispatch.verify(record.id)  # { 'official': True, ... }" },
      { t: "note", s: "The SDKs handle token minting and refresh for you — construct the client once with a credential and call methods directly." },
    ],
  },
  {
    slug: "architecture",
    title: "Architecture",
    group: "Concepts",
    summary: "How governance, sealing, verification and preservation fit together.",
    metaTitle: "Dispatch API — Architecture",
    blocks: [
      { t: "p", s: "Dispatch is built so that authority, governance and integrity are properties of the record itself, not of the system that happens to hold it. Four pillars support that." },
      { t: "h", s: "Governance" },
      { t: "p", s: "Every record passes an enforced approval chain bound to offices, not individuals. The chain — who approved, in what order, on which exact version — is captured as the record is made and exposed as the Governance Certificate." },
      { t: "h", s: "Sealing" },
      { t: "p", s: "At publication, the exact artifact is bound to a cryptographic fingerprint and the issuing authority. This is what makes the record tamper-evident: any later change breaks verification." },
      { t: "h", s: "Verification" },
      { t: "p", s: "Each Official Record carries a permanent id that resolves to its authoritative record. Verification is open and account-free, so trust does not depend on access to Dispatch." },
      { t: "h", s: "Preservation" },
      { t: "p", s: "Archived records keep their integrity proof and approval chain, so they remain provable for their full retention life. The audit trail is append-only and hash-stamped." },
      { t: "note", s: "Deployment scope, data residency and retention are defined per institution. Framework names (e.g. ISO 27001) describe controls the architecture is aligned to, not independent certifications." },
    ],
  },
  {
    slug: "schemas",
    title: "The Official Record schema",
    group: "Concepts",
    summary: "The core fields of a record, certificate and verification response.",
    metaTitle: "Dispatch API — Schemas & Data Model",
    blocks: [
      { t: "p", s: "These are the core fields you will work with. The full machine-readable definition is the OpenAPI document at /openapi.json; this page summarises the shapes most integrations touch." },
      { t: "h", s: "Record" },
      { t: "table", head: ["Field", "Type", "Description"], rows: [
        ["id", "string", "Permanent Official Record id once published (e.g. SD-2026-000123). EVAL- prefix on the free tier."],
        ["title", "string", "Human title of the record."],
        ["kind", "string", "Record type — e.g. resolution, directive, notice, certificate."],
        ["office", "string", "The office under whose authority the record is issued."],
        ["status", "string", "Lifecycle posture — draft, in_review, approved, published, archived, withdrawn."],
        ["official", "boolean", "True only for a genuine, sealed Official Record."],
        ["version", "integer", "The exact version the current posture refers to."],
      ] },
      { t: "h", s: "Verification response" },
      { t: "table", head: ["Field", "Type", "Description"], rows: [
        ["official", "boolean", "Whether the id resolves to a genuine, sealed Official Record."],
        ["title", "string", "The record's title."],
        ["issued_by", "string", "The issuing office."],
        ["sealed", "boolean", "Whether the integrity seal verifies intact."],
      ] },
      { t: "h", s: "Versioning" },
      { t: "p", s: "The API is versioned under /v1. The engine and schema version are reported by GET /v1/version, so an integration can confirm what it is talking to." },
      { t: "endpoint", method: "GET", path: "/v1/version", s: "Engine and schema version." },
    ],
  },
];

export const docBySlug = (slug?: string): Doc | undefined => DOCS.find((d) => d.slug === slug);

export const DOC_GROUPS: string[] = DOCS.reduce<string[]>((acc, d) => {
  if (!acc.includes(d.group)) acc.push(d.group);
  return acc;
}, []);
