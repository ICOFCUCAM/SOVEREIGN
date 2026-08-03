// Combined copy catalog for marketing batch 3: Architecture (a print document),
// Developers, and Official Record. Code samples, endpoint references (live from
// the OpenAPI spec), event names and API paths stay in the pages.

export type ArchBlock =
  | { p: string }
  | { flow: string[] }
  | { bullets: string[] }
  | { code: string };

export interface ArchitectureCopy {
  docTitle: string; docSub: string;
  versionLine: string; classificationLabel: string; classificationValue: string; distributionLabel: string; distributionValue: string;
  downloadBtn: string; downloadDocBtn: string; printHint: string;
  sections: { title: string; blocks: ArchBlock[] }[];
  footer: string;
}

export interface DevelopersCopy {
  eyebrow: string; title: string; lead: string; ctaSpec: string; ctaReference: string; ctaCredential: string;
  qsKicker: string; qsTitle: string; qsSub: string; step1: string; step2: string; step3: string;
  sdkKicker: string; sdkTitle: string; sdkSub: string; tsLabel: string; pyLabel: string;
  whKicker: string; whTitle: string; whSub: string; verifyLabel: string;
  refKicker: string; refTitle: string; refSubTemplate: string; refSubLoading: string; refFallback: string;
}

export interface OfficialRecordCopy {
  eyebrow: string; title: string; lead: string; leadSub: string;
  ordinaryLabel: string; ordinary: string[]; ordinaryNote: string;
  officialLabel: string; official: string[]; officialNote: string;
  authKicker: string; authTitle: string; authSub: string;
  matrixKicker: string; matrixTitle: string; capabilityLabel: string; ordinaryCol: string; officialCol: string;
  matrix: string[]; ctaVerify: string; ctaDevelopers: string; ctaLaunch: string;
}

export interface Marketing3Copy { architecture: ArchitectureCopy; developers: DevelopersCopy; officialRecord: OfficialRecordCopy; }

export const MARKETING3_EN: Marketing3Copy = {
  architecture: {
    docTitle: "Architecture Overview",
    docSub: "Institutional publication infrastructure · Technical reference",
    versionLine: "Version 1.0 · 2026",
    classificationLabel: "Classification:", classificationValue: "UNCLASSIFIED",
    distributionLabel: "Distribution:", distributionValue: "Public",
    downloadBtn: "Download (PDF)", downloadDocBtn: "Download Architecture Overview",
    printHint: "Use your browser's Print → Save as PDF to export this document.",
    sections: [
      { title: "Executive Summary", blocks: [
        { p: "Sovereign Dispatch is the institutional layer between a draft and a published official record. Every artefact — briefing, board report, regulatory filing, operational package — is submitted as structured data, governed through an approval policy, rendered to faithful PDF/DOCX, and published with a permanent, auditable provenance trail." },
        { p: "The platform is built for institutions that cannot fail: tenant-isolated, classification-forward, residency-aware, and append-only auditable by construction. This document describes the system architecture, governance pipeline, security model, deployment options, data-residency model, audit and traceability design, integration surface, and operational model." },
      ] },
      { title: "System Architecture", blocks: [
        { p: "A submission travels a single, governed path from the institution to the published record:" },
        { flow: ["Institution", "Dispatch API", "Governance Engine", "Render Lane", "Immutable Record Store", "Publication Archive"] },
        { bullets: [
          "Dispatch API — a stable, versioned REST surface authenticated with OAuth2 client-credentials.",
          "Governance Engine — resolves classification and the approval policy for each document type; enforces separation of duties.",
          "Render Lane — a queue-backed, deterministic rendering service producing print-grade PDF/DOCX from validated source.",
          "Immutable Record Store — versioned documents and hash-stamped artefacts in a dedicated, tenant-isolated database.",
          "Publication Archive — released records with signed, access-controlled retrieval and defined retention.",
        ] },
      ] },
      { title: "Governance Pipeline", blocks: [
        { p: "Nothing reaches the official record without clearing its approval policy." },
        { flow: ["Submit", "Govern", "Approve", "Render", "Publish", "Archive"] },
        { bullets: [
          "Submit — a structured DDM payload validated against schema and doc-type policy on entry.",
          "Govern — classification and the N-eyes approval policy are resolved per type and tenant.",
          "Approve — reviewers approve, return or reject; a submitter cannot approve their own document.",
          "Render — the approved record is rendered deterministically in the queue.",
          "Publish — the artefact is released to the record and its provenance is sealed.",
          "Archive — retained under the institution's retention policy with auditable retrieval.",
        ] },
      ] },
      { title: "Security Architecture", blocks: [
        { bullets: [
          "Tenant isolation — row-level security on every table; a missing tenant claim denies by default, never allow-all.",
          "Encryption — AES-256 at rest and TLS 1.2+ in transit.",
          "Authentication — OAuth2 client-credentials issuing short-lived, scoped JWTs held in memory only.",
          "Authorization — least-privilege scopes (validate, render, approve, publish, read, audit) enforced server-side on every call.",
          "Classification & clearance — documents carry visible classification; reads and approvals can be gated against principal clearance per deployment.",
          "Immutability — published artefacts are hash-stamped; the audit trail is append-only and read-only.",
        ] },
      ] },
      { title: "Deployment Models", blocks: [
        { p: "The same governed pipeline is delivered into the operating model the institution's mandate requires:" },
        { bullets: [
          "Cloud — managed deployment for rapid adoption.",
          "Private Cloud — a dedicated institutional environment.",
          "Sovereign Hosting — hosted within approved national or regional boundaries.",
          "On-Premise — operated inside the institution's own data centre for local control.",
          "Air-Gapped — architecture designed to support isolated deployments; availability subject to engagement scope.",
        ] },
      ] },
      { title: "Data Residency Model", blocks: [
        { p: "Dispatch runs against its own dedicated database, independent of any other platform. Residency follows the deployment model — a shared region for managed cloud, a dedicated region for private cloud, national or regional boundaries for sovereign hosting, and local control on-premise. Specific regions, data handling and retention terms are agreed per institution. No cross-tenant data movement occurs; isolation is enforced at the database layer." },
      ] },
      { title: "Audit & Traceability", blocks: [
        { p: "Every governance-relevant action is recorded to an append-only trail that cannot be quietly edited." },
        { bullets: [
          "Each event captures actor, action, target, timestamp and a SHA-256 content hash.",
          "Submission, decision, render and publish events form a complete chain of custody per document.",
          "The trail is tenant-scoped and read-only; the API blocks any mutation.",
          "Events are exportable for assessors and can be filtered by action or target during review.",
        ] },
      ] },
      { title: "API & Integrations", blocks: [
        { p: "Institutional systems integrate over a stable REST surface; each consumer authenticates with its own scoped service client." },
        { p: "The API surface spans token issuance, document submission, governance decisions, publication release, audit retrieval and signed artefact access. The full endpoint reference is published on the Developer Platform; integration sequence diagrams, payload schemas and environment topology are issued per institution in the Technical Dossier, through the Procurement Center." },
        { p: "Service clients are issued, scoped and revoked per consumer. Webhook callbacks notify on render and publish." },
      ] },
      { title: "Operational Model", blocks: [
        { bullets: [
          "Asynchronous render lane absorbs bursts and large packages without blocking submitters.",
          "Each version is preserved; artefacts are content-addressed and never silently altered.",
          "Roles map to least-privilege scopes; provisioning and revocation are per consumer.",
          "Support tiers, response targets and retention horizons are defined per institutional agreement.",
          "Evaluation follows a predictable path: procurement package → technical review → pilot → security review → production rollout.",
        ] },
      ] },
    ],
    footer: "This document describes the architecture Sovereign Dispatch is engineered around. Framework alignment (e.g. ISO 27001, SOC 2, NIS2, GDPR) denotes control-aligned design, not independent certification; certification scope, residency and retention are defined per deployment. © Sovereign Dispatch.",
  },
  developers: {
    eyebrow: "Developer Platform",
    title: "Build governance into your own systems.",
    lead: "The Dispatch Platform API is the governance engine behind Sovereign Dispatch. Your ERP, parliament system, SharePoint or case platform can submit a document and have it governed, certified, published and preserved as an Official Record — without anyone opening the console.",
    ctaSpec: "Download OpenAPI spec ↓", ctaReference: "Endpoint reference →", ctaCredential: "Get a credential",
    qsKicker: "Quickstart", qsTitle: "Credential → token → governed record.",
    qsSub: "An administrator issues an API client under Administration → API Access, scoped to exactly what the system may do. The system exchanges it for a short-lived bearer token, then calls the API.",
    step1: "1 · Exchange the credential for a token", step2: "2 · Submit a document as an Official Record", step3: "3 · Follow it through governance",
    sdkKicker: "SDKs", sdkTitle: "Official clients, zero dependencies.",
    sdkSub: "Thin, hand-written clients for TypeScript and Python that wrap the auth flow, the record lifecycle, and webhook signature verification. The signature scheme is verified to match the server across both languages.",
    tsLabel: "TypeScript · Node ≥ 18", pyLabel: "Python ≥ 3.8 · stdlib only",
    whKicker: "Webhooks", whTitle: "React to governance, don't poll for it.",
    whSub: "Register endpoints and Dispatch POSTs a signed event when a record crosses a lifecycle boundary. Delivery is durable and at-least-once; verify every delivery with the endpoint's signing secret.",
    verifyLabel: "Verify the signature (Node)",
    refKicker: "Reference", refTitle: "Every endpoint, from the live spec.",
    refSubTemplate: "{ops} operations across {groups} groups — rendered from the shipped OpenAPI document, so it never drifts from the running API.",
    refSubLoading: "Loading the API specification…",
    refFallback: "If this does not load, the spec is also downloadable above.",
  },
  officialRecord: {
    eyebrow: "What is an Official Record?",
    title: "An Official Record is more than a document.",
    lead: "It is the institution's authoritative version of a decision — governed through an approved process, certified by the responsible authority, preserved against tampering, and permanently traceable through an evidence chain.",
    leadSub: "A file can always be copied. A PDF, a Word document, even a printed page can be photocopied. The file is never what makes a record official — the institutional proof is. Think of a passport: a photocopy is not another passport, because the authority behind it cannot be duplicated. Dispatch works the same way.",
    ordinaryLabel: "An ordinary document can be",
    ordinary: ["Edited", "Copied", "Renamed", "Replaced", "Deleted", "Disputed"],
    ordinaryNote: "Nothing about the file proves where it came from, or whether it is current.",
    officialLabel: "An Official Record has",
    official: ["A verified approval chain", "A permanent institutional identity", "A Governance Certificate", "A Preservation Certificate", "A cryptographic integrity proof", "A complete evidence history", "Public verification, always"],
    officialNote: "The proof travels with the record — and can be checked by anyone, at any time.",
    authKicker: "Institutional authority", authTitle: "Issued by the office — not the individual.",
    authSub: "An Official Record is issued under the authority of an OFFICE: 'Communications Office, Ministry of Finance'. If the director retires tomorrow, the record remains valid, because it belongs to the office, not the person who held it. That is what makes the authority durable — and impossible to forge by editing a file.",
    matrixKicker: "The difference, in full", matrixTitle: "Ordinary document vs. Official Record.",
    capabilityLabel: "Capability", ordinaryCol: "Ordinary", officialCol: "Official",
    matrix: ["Unique institutional identity", "Verified approval chain", "Named publication authority", "Complete evidence history", "Cryptographic integrity verification", "Governance Certificate", "Preservation Certificate", "Permanent record identifier", "Revocation status", "Public verification"],
    ctaVerify: "Verify a record →", ctaDevelopers: "For developers", ctaLaunch: "Launch Dispatch",
  },
};
