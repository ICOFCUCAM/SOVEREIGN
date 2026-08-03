// Copy catalog for marketing batch 7: Readiness Journey, Record Gallery, the
// interactive Walkthrough, and the branded 404. Structural data (profile keys,
// routes, specimen ids/hashes/dates, audit event names) stays in the pages;
// only human-readable copy lives here. The walkthrough's preservation body
// carries a {year} placeholder the page fills from its sample record.

export interface JourneyProfileCopy { name: string; lede: string; deployment: string; governance: string; policy: string; records: string[] }

export interface Marketing7Copy {
  journey: {
    eyebrow: string; title: string; lead: string;
    profiles: JourneyProfileCopy[]; // 5 — order matches the page's PROFILE_KEYS
    recommended: string;
    labels: { deployment: string; governance: string; policy: string; records: string };
    ctaPackage: string; ctaTrust: string; selectHint: string;
  };
  gallery: {
    eyebrow: string; title: string; lead: string;
    kicker: string; sectionTitle: string; sectionSub: string; specimen: string;
    officialTitle: string; docTitle: string; docSub: string;
    fRecordNo: string; fClassification: string; fLifecycle: string; fVersion: string; vLifecycle: string;
    govTitle: string; govPolicy: string; compliant: string; chain: string[]; // 3 — two offices + publication authority
    fApprovals: string; vApprovals: string; fSod: string; vSod: string; fIntegrity: string;
    presTitle: string; presHead: string; fRecordHash: string; fPublished: string; fArchived: string; presNote: string;
    auditTitle: string; auditHead: string;
    footnote: string; closing: string; cta: string;
  };
  walkthrough: {
    eyebrow: string; title: string; lead: string;
    steps: { kicker: string; title: string }[]; // 7
    back: string; next: string; replay: string;
    sampleTitle: string; sampleInstitution: string; sampleDocType: string;
    draftLabel: string; draftSections: string[]; draftNote: string;
    policyLabel: string; policyBody: string; chain: { office: string; act: string }[]; // 4
    approvedLabel: string; approvedBody: string;
    publishedLabel: string; recordIdLabel: string; publishedBody: string;
    govCertTitle: string; govCertBody: string; presCertTitle: string; presCertBody: string; // {year}
    evidenceLabel: string; evidence: { t: string; d: string }[]; // 8
    evidenceNote: string;
    verifiedTitle: string; verifiedSub: string; fRecordId: string; fInstitution: string; fStatus: string; fIntegrityHash: string; ctaVerify: string;
  };
  notFound: { eyebrow: string; title: string; lead: string; dests: { label: string; sub: string }[]; home: string }; // 4 dests
}

export const MARKETING7_EN: Marketing7Copy = {
  journey: {
    eyebrow: "Readiness Journey",
    title: "Where does your institution begin?",
    lead: "Name your institution and receive a tailored starting point — deployment, governance and policy — in seconds.",
    profiles: [
      { name: "Government / Ministry", lede: "Cabinet-grade records under data-localisation mandates.",
        deployment: "Sovereign hosting or on-premise, in-jurisdiction",
        governance: "Multi-step ministerial chain — Director → Secretary General → Chief Secretary, with a communications publication authority",
        policy: "Distinct policies per record type with long retention and classification gating",
        records: ["Cabinet Memorandum", "Ministerial Report", "Policy Paper", "Regulatory Response"] },
      { name: "University", lede: "Senate decisions and academic records of permanent value.",
        deployment: "Private cloud in your tenancy",
        governance: "Senate governance with a Registrar publication authority",
        policy: "Resolution and report policies with permanent preservation",
        records: ["Academic Senate Resolution", "Board Report", "Research Dossier", "White Paper"] },
      { name: "Hospital", lede: "Clinical directives that must be governed and auditable.",
        deployment: "Private cloud or on-premise, clinically isolated",
        governance: "Clinical governance with Medical Director approval",
        policy: "Directive policies with full audit retention",
        records: ["Clinical Directive", "Situation Report", "Risk Report", "Board Report"] },
      { name: "Regulator", lede: "Notices that are themselves legal evidence.",
        deployment: "Sovereign or managed, evidence-grade",
        governance: "Legal review chain with Commissioner authority",
        policy: "Notice policies with statutory retention schedules",
        records: ["Regulatory Notice", "Regulatory Response", "Policy Paper", "Audit Report"] },
      { name: "Enterprise", lede: "Board and executive records that demand provable governance.",
        deployment: "Managed or private cloud",
        governance: "Board / executive chain with a defined publishing authority",
        policy: "Board-resolution and compliance policies with audit retention",
        records: ["Board Report", "Strategic Memorandum", "Due Diligence Report", "Investor Update"] },
    ],
    recommended: "Recommended starting point",
    labels: { deployment: "Deployment", governance: "Governance", policy: "Policy", records: "Record types to govern first" },
    ctaPackage: "Build the evaluation package",
    ctaTrust: "Why it's safe to adopt",
    selectHint: "Select an institution type above to see its recommended starting point.",
  },
  gallery: {
    eyebrow: "The artifacts",
    title: "What an institution actually holds.",
    lead: "After a record passes through Sovereign Dispatch, the institution holds four things — not a file, but proof. These are the real artifact types the platform produces.",
    kicker: "Gallery", sectionTitle: "Four artifacts, one record.", sectionSub: "An official record and the three proofs that travel with it.",
    specimen: "Specimen",
    officialTitle: "Official Record", docTitle: "Q3 Fiscal Position — Ministerial Briefing", docSub: "Ministerial Report",
    fRecordNo: "Record №", fClassification: "Classification", fLifecycle: "Lifecycle", fVersion: "Version", vLifecycle: "Published · Preserved",
    govTitle: "Governance Certificate", govPolicy: "Ministerial Briefing Policy", compliant: "COMPLIANT",
    chain: ["Director", "Secretary General", "Communications Office"],
    fApprovals: "Approvals", vApprovals: "2 / 2 in order", fSod: "Sep. of duties", vSod: "Enforced", fIntegrity: "Integrity proof",
    presTitle: "Preservation Certificate", presHead: "Sealed institutional artifact",
    fRecordHash: "Record hash", fPublished: "Published", fArchived: "Archived",
    presNote: "Terminal & immutable — no edit, withdrawal or republication.",
    auditTitle: "Audit Evidence", auditHead: "Append-only event trail",
    footnote: "Specimen values from a reference record. Your institution's records carry the same four artifacts — generated automatically, owned entirely by you.",
    closing: "A record is no longer a file. It is proof.",
    cta: "The Dispatch Standard",
  },
  walkthrough: {
    eyebrow: "See a governed record",
    title: "Watch a document become official.",
    lead: "Follow one publication through the governed lifecycle — from an ordinary draft to a certified, verifiable Official Record. An illustrative sample; the offices, certificates and evidence chain mirror the real engine.",
    steps: [
      { kicker: "01 · Draft", title: "A document is written." },
      { kicker: "02 · Governance", title: "Its approval chain is resolved." },
      { kicker: "03 · Approval", title: "The offices sign, in order." },
      { kicker: "04 · Publication", title: "It becomes an Official Record." },
      { kicker: "05 · Certification", title: "Its proof is sealed." },
      { kicker: "06 · Evidence", title: "Every step is recorded." },
      { kicker: "07 · Verification", title: "Anyone can confirm it — forever." },
    ],
    back: "Back", next: "Next", replay: "Replay",
    sampleTitle: "National Childhood Immunisation Policy", sampleInstitution: "Ministry of Health", sampleDocType: "Executive Policy Briefing",
    draftLabel: "Draft", draftSections: ["Executive summary", "Key judgements", "Analysis", "Recommendation"],
    draftNote: "An ordinary draft — at this point it is just a file. It carries no authority yet. Governance is what will make it official.",
    policyLabel: "Resolved approval policy",
    policyBody: "For an Executive Policy Briefing at this institution, the governance engine requires this chain of authority — in order. Nothing publishes until every office has acted.",
    chain: [
      { office: "Policy Analyst", act: "Drafted" },
      { office: "Legal Counsel", act: "Legal review" },
      { office: "Director of Public Health", act: "Approved" },
      { office: "Permanent Secretary", act: "Authorized" },
    ],
    approvedLabel: "Chain of authority satisfied",
    approvedBody: "Each office acts in sequence. A submitter cannot approve their own work; every signature is attributable to the office that holds the authority.",
    publishedLabel: "Published — Official Record", recordIdLabel: "Permanent Record ID",
    publishedBody: "A permanent identifier is allocated — never reused. From here, every copy of the file carries this id and points back to the one authoritative record.",
    govCertTitle: "Governance Certificate",
    govCertBody: "Proof the approval chain was satisfied — the offices, in order, that authorized publication.",
    presCertTitle: "Preservation Certificate",
    presCertBody: "Proof the record was sealed for permanence — with its retention horizon ({year}) and a tamper-evident hash.",
    evidenceLabel: "Append-only evidence chain",
    evidence: [
      { t: "Submitted", d: "the draft enters governance" },
      { t: "Governed", d: "the approval policy is resolved for this document type" },
      { t: "Reviewed", d: "Legal Counsel records its review" },
      { t: "Approved", d: "the Director of Public Health approves" },
      { t: "Authorized", d: "the Permanent Secretary authorizes publication" },
      { t: "Published", d: "the record receives a permanent identifier" },
      { t: "Certified", d: "Governance & Preservation certificates are sealed" },
      { t: "Preserved", d: "sealed for the institution's retention horizon" },
    ],
    evidenceNote: "Every action is timestamped and cannot be quietly edited.",
    verifiedTitle: "Verified — Official Record",
    verifiedSub: "Anyone holding a copy can confirm this, with no account.",
    fRecordId: "Official Record ID", fInstitution: "Institution", fStatus: "Status", fIntegrityHash: "Integrity hash",
    ctaVerify: "Verify a real record",
  },
  notFound: {
    eyebrow: "404 · Page not found",
    title: "This record isn't here.",
    lead: "The page you followed has moved or never existed. Nothing was lost — every published Official Record keeps a permanent address. Here is where most people are heading.",
    dests: [
      { label: "Knowledge", sub: "Concepts behind governed publication" },
      { label: "Library", sub: "In-depth guides and references" },
      { label: "Industries", sub: "Who Sovereign Dispatch is built for" },
      { label: "Verify a record", sub: "Confirm an Official Record is genuine" },
    ],
    home: "Return to the homepage",
  },
};
