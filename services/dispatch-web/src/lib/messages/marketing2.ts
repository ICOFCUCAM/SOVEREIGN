// Combined copy catalog for the second marketing batch: Outcomes, Security,
// Compliance. One file per locale translates all three. Embedded interactive
// components (CapabilitiesDashboard, DeploymentMatrix) keep their own copy.

export interface Card2 { title: string; body: string; }

export interface OutcomesCopy {
  eyebrow: string; titleA: string; titleB: string; lead: string;
  baKicker: string; baTitle: string; baSub: string;
  beforeLabel: string; before: string[]; afterLabel: string; after: string[];
  scKicker: string; scTitle: string; scSub: string;
  scenarios: { who: string; what: string; flow: string[] }[];
  closeLine: string; closeCta: string;
}

export interface SecurityCopy {
  secKicker: string; secTitle: string; secSub: string; cards: Card2[];
  sovKicker: string; sovTitle: string; sovSub: string;
  depKicker: string; depTitle: string; depSub: string;
  models: { t: string; b: string; note: string }[];
  systemFlowLabel: string; systemFlow: string[]; matrixLabel: string;
}

export interface ComplianceCopy {
  kicker: string; title: string; sub: string;
  items: { name: string; body: string }[];
  disclaimer: string; ctaProcurement: string; ctaEvidence: string; ctaTrust: string;
}

export interface Marketing2Copy { outcomes: OutcomesCopy; security: SecurityCopy; compliance: ComplianceCopy; }

export const MARKETING2_EN: Marketing2Copy = {
  outcomes: {
    eyebrow: "Institutional transformation",
    titleA: "What changes when an institution",
    titleB: "adopts Sovereign Dispatch.",
    lead: "Not new features. A new way official records exist — created under governance, proven by certificate, and preserved beyond the people who made them.",
    baKicker: "Before & After", baTitle: "The same decision — transformed.",
    baSub: "How an official act moves from a file on a drive to a governed institutional record.",
    beforeLabel: "Before Dispatch",
    before: ["A policy PDF on a shared drive", "An email chain of approvals", "Version confusion — which is final?", "Approvals that cannot be proven", "Records that quietly disappear"],
    afterLabel: "After Dispatch",
    after: ["A governed official record", "An enforced chain of authority", "One canonical, immutable version", "A cryptographic certificate of approval", "Permanent, provable retrieval"],
    scKicker: "Scenario Library", scTitle: "The same governed journey, every institution.",
    scSub: "A different official act in each — the same enforced path from drafting to permanent record.",
    scenarios: [
      { who: "Ministry", what: "Cabinet Memorandum", flow: ["Drafted", "Governed by policy", "Director → Secretary approval", "Published of record", "Preserved with proof"] },
      { who: "University", what: "Academic Senate Resolution", flow: ["Proposed", "Senate governance", "Registrar authority", "Official record", "Preserved permanently"] },
      { who: "Hospital", what: "Clinical Directive", flow: ["Authored", "Clinical governance", "Medical Director approval", "Published to staff", "Full audit trail"] },
      { who: "Regulator", what: "Regulatory Notice", flow: ["Issued", "Legal review chain", "Commissioner authority", "Published as evidence", "Retained to schedule"] },
    ],
    closeLine: "Every journey ends the same way: a record you can prove, and keep.",
    closeCta: "Why it's safe to adopt",
  },
  security: {
    secKicker: "Security", secTitle: "Sovereign by design.",
    secSub: "Built for classified and regulated material — isolation, clearance and an immutable record at the core, not bolted on.",
    cards: [
      { title: "Tenant isolation (RLS)", body: "Row-level security on every table; a missing tenant claim denies by default — never allow-all." },
      { title: "Classification & clearance", body: "Documents carry classification; reads and approvals are gated against principal clearance." },
      { title: "Immutable audit", body: "Append-only event trail — every submission, decision and publish, with hash chaining. Nothing can be quietly edited." },
      { title: "Least-privilege roles", body: "Author, reviewer, approver, publisher, auditor, tenant-admin — each scoped to exactly what it may do." },
      { title: "Data residency", body: "Runs against its own database in the residency you choose; independent of any other platform." },
      { title: "Client-credentials auth", body: "Machine consumers authenticate with a client_id + secret for short-lived, scoped JWTs." },
      { title: "Operational continuity", body: "Architected for backup, recovery, retention and continuity requirements — defined per deployment." },
    ],
    sovKicker: "Sovereignty", sovTitle: "Capabilities, not badges.",
    sovSub: "What the platform actually does — across deployment, security and governance. Each capability is available by deployment model and verifiable during evaluation.",
    depKicker: "Deployment", depTitle: "Deploy where sovereignty requires.",
    depSub: "Sovereign Dispatch is architected to support cloud, private-cloud, sovereign-hosted, and institutional deployment models.",
    models: [
      { t: "Cloud", b: "Managed deployment for rapid adoption.", note: "" },
      { t: "Private Cloud", b: "Dedicated institutional environment.", note: "" },
      { t: "Sovereign Hosting", b: "Hosted within approved national or regional boundaries.", note: "" },
      { t: "On-Premise", b: "Available for institutions requiring local control.", note: "" },
      { t: "Air-Gapped", b: "Architecture designed to support isolated deployments.", note: "Availability subject to engagement scope." },
    ],
    systemFlowLabel: "System flow",
    systemFlow: ["Institution", "Submit", "Govern", "Approve", "Render", "Publish", "Archive"],
    matrixLabel: "Capability by deployment",
  },
  compliance: {
    kicker: "Compliance & Security", title: "Built around modern governance frameworks.",
    sub: "Sovereign Dispatch is engineered around the control frameworks institutions are assessed against — described in honest terms, with evidence available during evaluation.",
    items: [
      { name: "ISO 27001", body: "Architecture aligned with widely adopted information-security controls." },
      { name: "SOC 2", body: "Designed using audited operational-security principles." },
      { name: "NIS2", body: "Supports governance and risk-management workflows." },
      { name: "GDPR", body: "Supports data-management and residency practices." },
      { name: "Auditability", body: "Every publication event can be recorded, tracked, and reviewed." },
      { name: "Retention Policies", body: "Institution-defined retention controls." },
    ],
    disclaimer: "Framework names describe the controls the architecture is aligned to, not independent certifications. Certification scope, data residency and retention are defined per deployment.",
    ctaProcurement: "Procurement materials", ctaEvidence: "Evidence package", ctaTrust: "Trust centre",
  },
};
