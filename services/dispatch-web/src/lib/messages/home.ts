// Homepage copy catalog. The homepage (Landing) reads every visible string from
// here for the active locale, so the front door is fully translatable — the
// first page of the full-site translation program. English is the source of
// truth; each locale provides a complete translation of the same shape.
//
// Structural data (icons, slugs, routes, ordering) stays in the page; only the
// human-readable copy lives here.

export interface HomeCopy {
  hero: { eyebrow: string; titleLead: string; titleAccent: string; verbs: string[]; lead: string; ctaLaunch: string; ctaArchitecture: string; evalNote: string };
  stakes: { eyebrow: string; title: string; lead: string; badges: { lead: string; sub: string }[] };
  cost: {
    eyebrow: string; titleA: string; titleB: string; titleAccent: string; body: string; cta: string;
    docLabel: string; docSub: string; officialLabel: string; items: string[];
    stats: { n: string; label: string }[]; recordLabel: string; recordValue: string; illustrative: string; modelLink: string;
  };
  result: { eyebrow: string; title: string; body: string; features: { t: string; d: string }[]; ctaWhat: string; ctaVerify: string; caption: string };
  governance: { eyebrow: string; title: string; cards: { t: string; d: string }[] };
  modules: { eyebrow: string; title: string; lead: string; rootLabel: string; liveLabel: string; names: string[]; footnote: string; closing: string };
  assurance: { eyebrow: string; title: string; sub: string; items: { t: string; d: string; link: string }[] };
  outcomes: { eyebrow: string; title: string; items: { lead: string; sub: string }[]; modelLink: string };
  industries: { eyebrow: string; title: string; sub: string; names: string[]; types: string[][]; forLabel: string; viewAll: string };
  quote: { text: string };
  security: { eyebrow: string; title: string; sub: string; labels: string[] };
  proof: { eyebrow: string; title: string; statLabels: string[]; columns: { title: string; items: string[] }[]; links: string[] };
  evaluate: { title: string; body: string; ctaBegin: string; ctaProcurement: string; tagline: string };
}

export const HOME_EN: HomeCopy = {
  hero: {
    eyebrow: "Institutional Trust Infrastructure",
    titleLead: "The Vanguard of ",
    titleAccent: "Institutional Governance.",
    verbs: ["Create", "Review", "Approve", "Authorize", "Publish", "Certify", "Verify", "Preserve"],
    lead: "Institutions don't pay millions to create documents. They invest millions in the people, governance, approvals and authority that make those documents official. Sovereign Dispatch is the infrastructure that unifies, governs, certifies and preserves that entire process.",
    ctaLaunch: "Launch Dispatch",
    ctaArchitecture: "View Architecture",
    evalNote: "Evaluate in your own environment — no sales call required.",
  },
  stakes: {
    eyebrow: "The stakes",
    title: "Governing the world's most important decisions.",
    lead: "Documents inform. Institutions govern. Official publications prove it.",
    badges: [
      { lead: "Governed Workflows", sub: "Policy-enforced, end to end" },
      { lead: "Permanent Records", sub: "A Record ID, never reused" },
      { lead: "Independent Verification", sub: "Confirmed by anyone, no account" },
    ],
  },
  cost: {
    eyebrow: "The hidden cost",
    titleA: "Institutions don't pay to create documents.",
    titleB: "They pay to make them",
    titleAccent: "official.",
    body: "The document costs almost nothing to write. Institutional authority costs everything — the people, the approvals, the proof and the preservation that make it the institution's word.",
    cta: "Explore the cost of publication",
    docLabel: "A document",
    docSub: "Drafted in an afternoon",
    officialLabel: "An official publication",
    items: ["Legal review", "Compliance", "Executive approval", "Publication", "Certification", "Preservation"],
    stats: [{ n: "6", label: "Departments" }, { n: "8", label: "Approvals" }, { n: "120+", label: "Staff hours" }],
    recordLabel: "1 official record",
    recordValue: "where the cost goes",
    illustrative: "Illustrative figures.",
    modelLink: "Model your institution's own →",
  },
  result: {
    eyebrow: "The result",
    title: "A copy informs. An official record governs.",
    body: "An ordinary document can be copied, edited or questioned. An Official Record is the institution's authoritative version of a decision — and it can always prove it. Institutional authority is permanent.",
    features: [
      { t: "Permanent identity", d: "A Record ID, never reused." },
      { t: "Provable provenance", d: "Certificates sealed at publication." },
      { t: "Independent verification", d: "Confirmed genuine by anyone." },
    ],
    ctaWhat: "What is an Official Record?",
    ctaVerify: "Verify a record",
    caption: "Sealed · Certified · Permanently verifiable",
  },
  governance: {
    eyebrow: "Why governance matters",
    title: "Institutions don't become trusted by publishing. They become trusted by governing publication.",
    cards: [
      { t: "Authority must be earned.", d: "Information is not authority. Governance is what turns a document into the institution's official position — reviewed, approved and owned." },
      { t: "Proof must be built in.", d: "Certificates and a complete evidence chain are produced as the record is made — never bolted on afterwards, never assumed." },
      { t: "Provenance must outlive people.", d: "Who decided, on what version, in what order — preserved and provable long after the people who decided have moved on." },
    ],
  },
  modules: {
    eyebrow: "The platform",
    title: "Publication is only the first module.",
    lead: "Sovereign Dispatch is not document software. It is trust infrastructure — one governed fabric on which every act of institutional authority is created, sealed, published and proven. Publication is where it begins; the fabric is where it leads.",
    rootLabel: "Trust Infrastructure",
    liveLabel: "Live today",
    names: [
      "Publication", "Policy", "Legislation", "Procurement", "Contracts", "Cabinet",
      "Court Records", "Board Governance", "Elections", "Compliance", "Digital Archives",
      "Public Registers", "AI Governance",
    ],
    footnote: "Every module inherits the same spine: governed workflows, sealed certificates, permanent records and independent verification.",
    closing: "You are not buying document software. You are adopting institutional infrastructure.",
  },
  outcomes: {
    eyebrow: "Business value",
    title: "What your institution gains.",
    items: [
      { lead: "One governed platform — not seven disconnected systems.", sub: "Drafting, review, approval, publication, evidence and archive stop living in separate tools." },
      { lead: "Every audit already has its evidence.", sub: "The proof is produced as the record is made, not reconstructed when someone asks." },
      { lead: "Every approval is already attributable.", sub: "Who decided, on what version, in what order — settled at the moment it happens." },
      { lead: "The wrong version can never go out.", sub: "One authoritative record; superseded and unapproved copies cannot pass as official." },
      { lead: "Institutional memory that doesn't walk out the door.", sub: "Provenance and authority survive the people who created them." },
      { lead: "Stop paying for the same publication twice.", sub: "The duplicated handling between offices collapses into one governed flow." },
      { lead: "Govern publication for others — as a service.", sub: "Become the authority that issues and verifies records for the institutions you serve." },
    ],
    modelLink: "Model the operational case for your institution",
  },
  industries: {
    eyebrow: "Who uses it",
    title: "Trusted every day, across every institution.",
    sub: "Dispatch governs the publications your institution actually produces.",
    names: ["Government", "Justice", "Healthcare", "Universities", "Enterprise", "Regulators"],
    types: [
      ["Executive Orders", "Regulations", "Gazettes"],
      ["Judgments", "Court Rules", "Legal Notices"],
      ["Clinical Directives", "Safety Bulletins", "Treatment Protocols"],
      ["Senate Decisions", "Degree Regulations", "Academic Policies"],
      ["Board Resolutions", "Compliance Policies", "Corporate Governance"],
      ["Licenses", "Enforcement Decisions", "Public Notices"],
    ],
    forLabel: "Dispatch for",
    viewAll: "View all industries",
  },
  quote: { text: "The test of an institution is not what it says — but whether, years later, it can prove it said it." },
  security: {
    eyebrow: "Sovereign architecture",
    title: "Sovereign by design. Verifiable by default.",
    sub: "Built for institutions whose information cannot leak, cannot be lost, and cannot be repudiated.",
    labels: ["Cryptographic sealing", "Immutable audit evidence", "Residency controls", "Tenant isolation", "Independent verification", "Long-term preservation"],
  },
  assurance: {
    eyebrow: "Operational assurance",
    title: "Conviction for the executive. Detail for the evaluator.",
    sub: "The concrete answers procurement and security teams look for — close at hand, each with its own deep dive.",
    items: [
      { t: "Identity & access", d: "Connects to the identity providers you already run — single sign-on over SAML 2.0 and OIDC, directory-governed provisioning and role mapping, with separation of duties enforced by policy.", link: "Security details" },
      { t: "Deployment models", d: "Run it where your mandate requires: sovereign SaaS, private cloud, on-premises or air-gapped sovereign cloud — the same governed pipeline and evidence chain in every model.", link: "Architecture" },
      { t: "Availability & recovery", d: "Engineered for high availability with defined recovery objectives, redundant storage of sealed records, and rehearsed disaster-recovery procedures — continuity treated as an institutional duty.", link: "Trust Centre" },
      { t: "Standards alignment", d: "Designed to align with ISO 27001 and SOC 2 control frameworks, GDPR and data-residency requirements, and long-term records-management and preservation standards.", link: "Compliance" },
      { t: "Implementation", d: "A staged readiness journey — institution setup, authority mapping, governance policies, then your first governed publication — measured in weeks, not years.", link: "Readiness Journey" },
      { t: "Migration", d: "Existing archives and registers are imported, sealed and preserved with their provenance intact — your institutional memory arrives whole, nothing is left behind.", link: "Procurement Center" },
    ],
  },
  proof: {
    eyebrow: "Proof & procurement",
    title: "Built to be believed — not taken on trust.",
    statLabels: ["Governed stages", "Permanent certificates", "Authoritative publication", "Independent verifications"],
    columns: [
      { title: "Technical proof", items: ["SHA-256 sealing", "Append-only architecture", "Immutable audit chain", "Tamper-evident integrity"] },
      { title: "Governance proof", items: ["Every action attributable", "Every approval recorded", "Every version preserved", "Separation of duties enforced"] },
      { title: "Operational proof", items: ["One governed pipeline", "End-to-end provenance", "Permanent preservation", "Unlimited verification"] },
    ],
    links: ["Architecture", "Security", "Compliance", "Evidence", "API", "Trust Centre", "Procurement Center"],
  },
  evaluate: {
    title: "Prove it using your own documents.",
    body: "No sales call. No gate. Put a real document through the governed pipeline — or take the procurement materials into your own process.",
    ctaBegin: "Begin your evaluation",
    ctaProcurement: "Procurement Center",
    tagline: "Sovereign by design · Verifiable by default · Institution ready",
  },
};
