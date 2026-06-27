// Copy catalog for marketing batch 5: the Procurement Center (Procurement.tsx).
// Structural data (section ids, routes, downloadable file names, the deployment
// matrix) stays in the page; only human-readable copy lives here. FAQ answers
// that contain an inline link carry a single {link} placeholder — the page
// splits the string there and supplies the (route) href, so translators only
// move the placeholder, never the URL. The 11 `blocks` entries are in section
// order; the in-package nav and the section headings both read from them.

export interface ProcurementCopy {
  printPdf: string;
  heroEyebrow: string; heroTitle: string; heroLead: string;
  ctaStartEval: string; ctaViewArch: string; heroNote: string;
  inThisPackage: string;
  indexKicker: string; indexTitle: string; indexLead: string;
  index: { label: string; blurb: string }[]; // 14, matches INDEX order
  blocks: { title: string; lead: string }[]; // 11, section order

  archBody: string; archCta: string;
  deployment: { t: string; b: string }[]; // 5
  deploymentMatrixLabel: string;
  governanceFlow: string[]; // 6 pipeline stages
  governanceBullets: string[]; // 4
  security: { t: string; b: string }[]; // 6
  residencyBody: string;
  readiness: { t: string; b: string }[]; // 6
  evaluation: { t: string; b: string }[]; // 5
  support: { t: string; b: string }[]; // 3
  supportNote: string;
  faq: { q: string; a: string; linkLabel?: string }[]; // 8

  roiBody: string; roiBullets: string[]; roiCta: string;
  roiReflectsLabel: string; roiReflects: { t: string; b: string }[]; // 4
  docs: { title: string; blurb: string }[]; // 3, file/badge stay in page
  downloadLabel: string; downloadsNote: string;

  closeTitle: string; closeLead: string; ctaCloseArch: string; ctaBegin: string;
  footerTag: string; footerMotto: string;
}

export const MARKETING5_EN: ProcurementCopy = {
  printPdf: "Print / PDF",
  heroEyebrow: "Evaluation Package",
  heroTitle: "Everything your evaluation team needs.",
  heroLead: "A complete self-serve evaluation dossier — architecture, governance, security, residency and the evaluation path — so technical reviewers and procurement officers can assess Sovereign Dispatch before any call.",
  ctaStartEval: "Start a free evaluation", ctaViewArch: "View the Architecture Overview",
  heroNote: "Instant · no email required",
  inThisPackage: "In this package",
  indexKicker: "The evaluator's index",
  indexTitle: "Everything an evaluation needs, in one place.",
  indexLead: "Each surface is reachable directly — the value case, the technical dossier, pricing and independent verification. Nothing is gated.",
  index: [
    { label: "Cost of Publication", blurb: "Why Dispatch exists — the institutional process it governs." },
    { label: "The Governed Lifecycle", blurb: "Stage by stage: who acts, what is decided, what is proven." },
    { label: "ROI & Operational Model", blurb: "Model the scale of governed publication from your own figures." },
    { label: "Downloadable Documents", blurb: "Ready-made procurement PDFs — overview, evaluation, security." },
    { label: "Architecture", blurb: "System context, pipeline, security and deployment topology." },
    { label: "Security", blurb: "Isolation, encryption, least privilege and immutable audit." },
    { label: "Compliance", blurb: "The governance frameworks the platform is built around." },
    { label: "Deployment", blurb: "Cloud, private, sovereign, on-premise and air-gapped." },
    { label: "Identity & SSO", blurb: "OAuth2 tokens; identity integration during deployment." },
    { label: "API", blurb: "REST API, webhooks and SDKs — governance as a service." },
    { label: "Pricing", blurb: "Priced by institution and capability, never per seat." },
    { label: "Evidence", blurb: "The certificates and evidence chain every record carries." },
    { label: "Verify a Record", blurb: "Independently confirm any published record is genuine." },
    { label: "Trust", blurb: "Your records, your jurisdiction, your exit — data control." },
  ],
  blocks: [
    { title: "Architecture Overview", lead: "A faithful map of how a submission becomes an official record — across the API surface, governance engine, render lane and immutable record store." },
    { title: "Deployment Models", lead: "The same governed pipeline, delivered into the operating model your mandate requires." },
    { title: "Governance Model", lead: "Nothing reaches the official record without clearing its approval policy." },
    { title: "Security Overview", lead: "Isolation, cryptography and an immutable record at the core — not bolted on." },
    { title: "Data Residency Options", lead: "Where the record lives is a deployment decision, reviewed per institution." },
    { title: "Procurement Readiness", lead: "The materials and engagement model an evaluation team needs — available the moment a qualified institution asks." },
    { title: "Evaluation Process", lead: "A predictable path from first review to production — designed to reduce procurement uncertainty." },
    { title: "Support Models", lead: "Commercial support scoped to the institution and the deployment model." },
    { title: "Procurement FAQ", lead: "The questions evaluation teams ask most — answered with the same verifiable language as the rest of this dossier." },
    { title: "ROI & Operational Model", lead: "Model the scale of governed publication from your institution's own figures — an illustrative operational model, never a promise of savings." },
    { title: "Downloadable Documents", lead: "Ready-made procurement documents you can take into your own process. Real PDFs, no gate, no NDA." },
  ],
  archBody: "The Architecture Overview documents the system context, governance pipeline, security architecture, deployment topology and data-residency model in a single print-ready reference. It is the authoritative technical artefact for architecture review.",
  archCta: "Open the Architecture Overview",
  deployment: [
    { t: "Cloud", b: "Managed deployment for rapid adoption." },
    { t: "Private Cloud", b: "Dedicated institutional environment." },
    { t: "Sovereign Hosting", b: "Hosted within approved national or regional boundaries." },
    { t: "On-Premise", b: "Available for institutions requiring local control." },
    { t: "Air-Gapped", b: "Architecture designed to support isolated deployments. Availability subject to engagement scope." },
  ],
  deploymentMatrixLabel: "Capability by deployment",
  governanceFlow: ["Submit", "Govern", "Approve", "Render", "Publish", "Archive"],
  governanceBullets: [
    "N-eyes approval policy resolved per document type and classification.",
    "Separation of duties enforced — a submitter cannot approve their own document.",
    "Classification and clearance gating on read and approval, where enabled per deployment.",
    "Every version preserved; published artefacts are hash-stamped and immutable.",
  ],
  security: [
    { t: "Tenant isolation", b: "Row-level security on every table; a missing tenant claim denies by default." },
    { t: "Encryption", b: "AES-256 at rest; TLS 1.2+ in transit." },
    { t: "Authentication", b: "OAuth2 client-credentials issuing short-lived, scoped tokens." },
    { t: "Least privilege", b: "Author, reviewer, approver, publisher, auditor — each scoped to exactly its actions." },
    { t: "Immutable audit", b: "Append-only, SHA-256-hashed trail of every submission, decision and publish." },
    { t: "Classification-forward", b: "Documents carry visible classification; reads are gated against clearance." },
  ],
  residencyBody: "Sovereign Dispatch runs against its own dedicated database, independent of any other platform. Residency is determined by deployment model — a shared region for managed cloud, a dedicated region for private cloud, national or regional boundaries for sovereign hosting, and local control on-premise. Specific regions, data handling and retention terms are agreed per institution during evaluation.",
  readiness: [
    { t: "Security Documentation", b: "Available during evaluation." },
    { t: "Architecture Review", b: "Technical review materials available." },
    { t: "Data Residency Discussion", b: "Deployment options reviewed per institution." },
    { t: "Enterprise Agreements", b: "Custom institutional contracts supported." },
    { t: "Support Models", b: "Commercial support options available." },
    { t: "Deployment Planning", b: "Implementation planning available for qualified engagements." },
  ],
  evaluation: [
    { t: "Procurement Package", b: "Self-serve dossier and architecture review." },
    { t: "Technical Review", b: "Architecture, security and integration assessment." },
    { t: "Pilot Deployment", b: "A scoped environment against real documents." },
    { t: "Security Review", b: "Controls, residency and audit evidence reviewed." },
    { t: "Production Rollout", b: "Phased deployment into operations." },
  ],
  support: [
    { t: "Standard", b: "Business-hours support for managed cloud adopters." },
    { t: "Priority", b: "Faster response targets for production institutional deployments." },
    { t: "Dedicated", b: "Named support and implementation planning for sovereign and on-premise estates." },
  ],
  supportNote: "Support tiers and response targets are defined per agreement; no uptime or response figures are asserted here.",
  faq: [
    { q: "Do we need a sales call to evaluate?", a: "No. This dossier is fully self-serve and you can start a free evaluation in your own environment without contacting anyone." },
    { q: "Can we evaluate in our own environment?", a: "Yes. Dispatch supports managed cloud, private cloud, sovereign hosting, on-premise and air-gapped deployments — see {link}.", linkLabel: "Deployment Models" },
    { q: "How is it priced?", a: "By institution and capability, never per seat. Concrete figures for the self-serve tiers are public on the {link}.", linkLabel: "pricing page" },
    { q: "Where does our data live?", a: "Residency is a deployment decision, agreed per institution — see {link}. Dispatch runs against its own dedicated database.", linkLabel: "Data Residency Options" },
    { q: "How do users authenticate?", a: "Authentication uses OAuth2 client-credentials issuing short-lived, scoped tokens. Identity and SSO integration is arranged during deployment planning." },
    { q: "Can it integrate with our existing systems?", a: "Yes — ERP, case-management and document systems integrate through the Dispatch API. See the {link}.", linkLabel: "developer platform" },
    { q: "What can we verify independently?", a: "Any published record can be confirmed genuine, unrevoked and untampered through the public {link} — no account required.", linkLabel: "verification portal" },
    { q: "Can we keep these materials as a PDF?", a: "Yes. Download the ready-made procurement documents from the {link} section below, or use Print → Save as PDF for this page. No gated downloads.", linkLabel: "Downloadable Documents" },
  ],
  roiBody: "The operational-model estimator takes your own inputs — publications per year, reviewing offices, departments involved, audit frequency and your cost assumptions — and reflects the scale of activity they imply. It separates the judgement an official publication will always require from the coordination and reconstruction effort a governed platform targets.",
  roiBullets: [
    "Driven entirely by institution-supplied assumptions.",
    "Illustrative estimates only — no guaranteed savings, ROI or payback is asserted.",
    "Results depend on your own processes, volumes and rates.",
  ],
  roiCta: "Open the estimator",
  roiReflectsLabel: "What it reflects",
  roiReflects: [
    { t: "Records / year", b: "Each with a permanent ID and integrity hash" },
    { t: "Review touches / year", b: "Office-level reviews governed in order" },
    { t: "Evidence chains / year", b: "Generated automatically, not by hand" },
    { t: "Effort it targets", b: "Coordination & reconstruction, not judgement" },
  ],
  docs: [
    { title: "Procurement Overview", blurb: "What it is, deployment models, security, pricing and the full procurement FAQ — in one pack." },
    { title: "Evaluation Guide", blurb: "The evaluation path, what to test in a pilot, and a procurement checklist." },
    { title: "Security & Architecture Summary", blurb: "The governed pipeline, security controls, deployment topology and residency posture." },
  ],
  downloadLabel: "Download",
  downloadsNote: "Documents use verifiable language; they assert no certifications, SLAs or guarantees. Security and architecture-review materials are available to qualified institutions during evaluation.",
  closeTitle: "Begin your evaluation.",
  closeLead: "Review the architecture, then open the console to assess the governed pipeline directly. A role-based procurement contact will be published as a secondary channel.",
  ctaCloseArch: "Architecture Overview", ctaBegin: "Begin Evaluation",
  footerTag: "Procurement", footerMotto: "Sovereign by design · Auditable always",
};
