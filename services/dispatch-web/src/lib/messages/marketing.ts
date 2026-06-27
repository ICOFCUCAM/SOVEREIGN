// Combined copy catalog for the smaller marketing pages (Trust, Platform,
// Standard). One file per locale translates all three. Structural data (section
// indices, icons, routes, code samples, product names) stays in the pages.

export interface Card2 { title: string; body: string; }
export interface Sec { kicker: string; title: string; sub: string; }

export interface TrustCopy {
  eyebrow: string; titleA: string; titleB: string; lead: string;
  ownership: Sec & { cards: Card2[] };
  continuity: Sec & { cards: Card2[] };
  accountability: Sec & { securesLabel: string; secures: string[]; controlsLabel: string; controls: string[] };
  evidence: Sec & { ctaProcurement: string; ctaEvidence: string };
}

export interface PlatformCopy {
  overview: Sec & { cards: Card2[] };
  capabilities: Sec & { cards: Card2[] };
  workflow: Sec & { steps: { t: string; b: string }[] };
  integrations: Sec & { apiTitle: string; apiBody: string; estateTitle: string; estateBody: string; estateItems: string[] };
}

export interface StandardCopy {
  eyebrow: string; title: string; lead: string;
  sectionKicker: string; sectionTitle: string; sectionSub: string;
  defs: { term: string; one: string; def: string; props: string[] }[];
  closeTitleA: string; closeTitleB: string; closeBody: string; ctaArtifacts: string; ctaPath: string;
}

export interface MarketingCopy { trust: TrustCopy; platform: PlatformCopy; standard: StandardCopy; }

export const MARKETING_EN: MarketingCopy = {
  trust: {
    eyebrow: "Adopt with confidence",
    titleA: "Your records. Your jurisdiction.",
    titleB: "Your exit, guaranteed.",
    lead: "Committing to a publication platform is a sovereignty decision. Sovereign Dispatch is built so the institution stays in control — of the data, the deployment, and the ability to walk away with everything intact.",
    ownership: {
      kicker: "Ownership", title: "You own your records — we are the custodian.",
      sub: "The platform stores and governs your records. It never owns them, never repurposes them, and never trains anything on them.",
      cards: [
        { title: "Your data is yours", body: "Every document, version, artifact and certificate belongs to your institution — not the platform." },
        { title: "Tenant isolation", body: "Row-level security with deny-by-default. A missing tenant claim denies; your data is never co-mingled." },
        { title: "No secondary use", body: "No mining, no profiling, no model training, no data-sharing business model. Ever." },
        { title: "Every access audited", body: "Submissions, decisions, publications and retrievals are recorded in an append-only, hash-stamped trail." },
      ],
    },
    continuity: {
      kicker: "Continuity & Exit", title: "You can leave at any time — with everything.",
      sub: "The strongest trust signal a platform can offer is a clean exit. There is no lock-in to engineer your way out of.",
      cards: [
        { title: "No proprietary formats", body: "Structured records, standard PDF / DOCX / Markdown artifacts, and a standard PostgreSQL store. Nothing is trapped." },
        { title: "Full export on demand", body: "Export records, versions, artifacts and the governance + preservation certificates whenever you choose." },
        { title: "Relocatable deployment", body: "The same platform runs managed, in your cloud, on-premise or air-gapped — move your estate without re-platforming." },
        { title: "If the provider disappeared", body: "You retain every record, artifact and certificate in open formats and can run or migrate the platform yourself. Continuity does not depend on us." },
      ],
    },
    accountability: {
      kicker: "Accountability", title: "A clear line of responsibility.",
      sub: "Procurement and risk teams need to know exactly who is accountable for what. There is no ambiguity.",
      securesLabel: "The platform secures",
      secures: ["Tenant isolation and access control", "Encryption at rest and in transit", "Append-only audit integrity", "Preservation integrity (SHA-256 proofs)", "Governance enforcement — the engine cannot be bypassed", "Availability and recovery of the service"],
      controlsLabel: "Your institution controls",
      controls: ["Who holds each governance authority", "Approval chains, quorums and policies", "Classification and clearance of records", "Retention horizons", "Who holds credentials and their scopes", "Deployment model and data residency"],
    },
    evidence: {
      kicker: "Evidence", title: "Provable, not promised.",
      sub: "Adoption confidence should rest on what can be verified during evaluation — not on marketing claims.",
      ctaProcurement: "Procurement dossier", ctaEvidence: "Evidence & capabilities",
    },
  },
  platform: {
    overview: {
      kicker: "Overview", title: "Information becomes the official record.",
      sub: "Dispatch is the institutional layer between a draft and a published document. Every artefact — briefing, board pack, regulatory filing — is submitted as structured data, governed through approval, rendered to a faithful PDF/DOCX, and published with a permanent, auditable provenance trail.",
      cards: [
        { title: "Not a word processor", body: "Documents are structured data (DDM), validated and scaffolded by type — not freeform files. The format is the contract." },
        { title: "Governed, not just generated", body: "Submit → Approve → Render → Publish. Nothing reaches the record without clearing its approval policy." },
        { title: "Sovereign by construction", body: "Tenant-isolated, residency-aware, append-only audit. Built for institutions that cannot fail." },
      ],
    },
    capabilities: {
      kicker: "Capabilities", title: "One pipeline, every official document.",
      sub: "Templates and validation per document type; deterministic, classification-banded rendering to print-grade output.",
      cards: [
        { title: "Document types", body: "Executive briefings, board reports, policy papers, regulatory submissions, operational packages and official records — each with its own required scaffold." },
        { title: "Multi-format render", body: "Faithful PDF (headless engine), DOCX and Markdown from a single validated source — banners, page numbers, appendices, signatures." },
        { title: "Schema-validated", body: "Every submission is checked against the DDM schema and the doc-type policy before it can render — no malformed records." },
        { title: "Templates & scaffolds", body: "Type-aware section roles and block policies enforce completeness so the output is consistent across the institution." },
        { title: "Versioned & immutable", body: "Each version is preserved; published artefacts are hash-stamped and never silently altered." },
        { title: "Asynchronous at scale", body: "A queue-backed render lane absorbs bursts and large packages without blocking submitters." },
      ],
    },
    workflow: {
      kicker: "Workflow", title: "Submit → Govern → Approve → Render → Publish → Retrieve.",
      sub: "The full lifecycle of an official document, enforced by the platform.",
      steps: [
        { t: "Submit", b: "Structured DDM payload, validated on entry." },
        { t: "Govern", b: "Classification + approval policy resolved." },
        { t: "Approve", b: "N-eyes sign-off; service lanes auto-approve." },
        { t: "Render", b: "Faithful PDF/DOCX produced in the queue." },
        { t: "Publish", b: "Released to the record; provenance sealed." },
        { t: "Retrieve", b: "Signed, access-controlled artefact download." },
      ],
    },
    integrations: {
      kicker: "Integrations", title: "An API others build on.",
      sub: "Dispatch provisions scoped API access per consumer and accepts documents over a stable REST surface.",
      apiTitle: "API provisioning",
      apiBody: "Each system gets its own service client — a client_id + secret with explicit scopes (validate · render · read). Issue, scope and revoke per consumer.",
      estateTitle: "Built for the estate",
      estateBody: "Consumers submit their data and Dispatch returns the official record — with webhook callbacks on render and publish.",
      estateItems: ["Veritas — operational & financial packages", "ExitOS — board memoranda & transaction documents", "Your institution — over the same REST surface"],
    },
  },
  standard: {
    eyebrow: "Category definition",
    title: "The Sovereign Dispatch Standard",
    lead: "An institution does not adopt a publishing tool. It adopts a standard for how official records come to exist, are proven, and are preserved. These are the concepts that standard defines.",
    sectionKicker: "The Standard",
    sectionTitle: "Six institutional concepts.",
    sectionSub: "Each is a building block of the operating standard for institutional records — not a feature, a definition.",
    defs: [
      { term: "Official Record", one: "A governed, versioned, classified institutional document of record.", def: "Not a file. An official act, created under an enforced governance policy, carried through an immutable lifecycle — Created → Governed → Approved → Published → Preserved — with a permanent, provable identity.", props: ["Stable record number", "Classification & clearance", "Immutable versions", "A single canonical form"] },
      { term: "Governance Policy", one: "The executable rule for how a class of records is governed.", def: "A named, versioned policy bound to a record type: an ordered chain of authorities, per-step quorum, the publication authority, retention and expiry. The policy does not describe the workflow — it controls it.", props: ["Ordered approval chain", "Per-step quorum", "Publication authority", "Versioned & enforced"] },
      { term: "Publication Authority", one: "The named authority empowered to release a record of record.", def: "Publication is not a button anyone may press. It is reserved to a specific governance role, validated at the moment of release — and an approver of a record may never be its publisher.", props: ["Role-bound", "Validated at publication", "Separation of duties"] },
      { term: "Governance Certificate", one: "Cryptographic proof that a publication satisfied its policy.", def: "Sealed at publication: the policy and its version, the required chain versus who actually satisfied it in order, delegations used, the publication authority, and an integrity proof — a COMPLIANT verdict that can be independently verified.", props: ["Required vs. actual chain", "Ordered approval sequence", "Integrity proof", "Compliance verdict"] },
      { term: "Preservation Certificate", one: "Tamper-evident proof that a record is permanently sealed.", def: "Issued when a record is archived: a preservation timestamp and a SHA-256 integrity proof over the canonical record. The archived state is terminal — no edit, withdrawal or republication is possible.", props: ["SHA-256 integrity proof", "Preservation timestamp", "Terminal & immutable"] },
      { term: "Evidence Chain", one: "The unbroken, append-only trail from creation to preservation.", def: "Every act — submission, each decision, the policy's satisfaction, publication and preservation — recorded in an immutable, hash-stamped trail. The institution can prove not just what a record says, but exactly how it came to be.", props: ["Append-only", "Hash-stamped", "Creation → preservation", "Independently auditable"] },
    ],
    closeTitleA: "When a category emerges,",
    closeTitleB: "the standard matters more than the features.",
    closeBody: "Sovereign Dispatch is not a better way to publish documents. It is the operating standard for institutional records — and an institution that adopts the standard adopts a way of governing that outlasts any one system.",
    ctaArtifacts: "See the artifacts", ctaPath: "Find your path",
  },
};
