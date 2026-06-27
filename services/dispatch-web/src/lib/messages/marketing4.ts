// Combined copy catalog for marketing batch 4: Cost-of-Publication and the public
// Verification Portal. Dynamic verification data (institution, dates, hashes,
// record IDs) is never translated; only the static UI copy lives here. A few
// strings are templates with {placeholders} the page interpolates.

export interface CostCopy {
  eyebrow: string; title: string; lead: string; ctaGoverns: string; ctaModel: string;
  processKicker: string; processTitle: string; processLead: string;
  process: { stage: string; who: string; cost: string }[]; processClose: string;
  hiddenKicker: string; hiddenTitle: string; hidden: { label: string; body: string }[];
  unifiedKicker: string; unifiedTitle: string; unifiedLead: string;
  todayLabel: string; todayFootnote: string; withLabel: string; unified: { title: string; body: string }[]; withFootnote: string;
  closeTitle: string; closeLead: string; ctaLifecycle: string; ctaRoi: string; ctaWalkthrough: string; ctaProcurement: string;
}

export interface VerifyCopy {
  eyebrow: string; title: string; lead: string; placeholder: string; verifyBtn: string;
  verifyingMsg: string; unverifiedChip: string; idleHint: string;
  verdicts: Record<"OFFICIAL" | "PRESERVED" | "REVOKED" | "EVALUATION" | "NOT_FOUND" | "ERROR", { title: string; note: string }>;
  facts: {
    institution: string; officialRecordId: string; evaluationRecordId: string; recordType: string;
    title: string; titleWithheld: string; classification: string; unclassified: string;
    governance: string; approvalChain: string; publishedBy: string; certificates: string;
    governanceCert: string; preservationCert: string; published: string; preserved: string; revoked: string;
    integrityProof: string; artifactHashes: string;
  };
  fileCheck: {
    label: string; lead: string; leadPlural: string; choose: string;
    hashing: string; match: string; nomatch: string;
  };
  verifiedBy: string;
  proofsKicker: string; proofsTitle: string; proofsLead: string; provesLabel: string; defendsLabel: string;
  proofs: { title: string; proves: string; defends: string }[];
  copyCardTitle: string; copyCardBody: string;
  ctaWalkthrough: string; ctaLifecycle: string; ctaOfficialRecord: string;
}

export interface Marketing4Copy { cost: CostCopy; verify: VerifyCopy; }

export const MARKETING4_EN: Marketing4Copy = {
  cost: {
    eyebrow: "Why Dispatch exists",
    title: "The cost of an official publication.",
    lead: "An institution does not pay to create a document. It pays for everything that makes a document official — the people, the reviews, the approvals, the authority, the preservation and the proof. Today that work is spread across a dozen disconnected systems. Every hand-off costs time, and every gap costs trust.",
    ctaGoverns: "See what Dispatch governs", ctaModel: "Model the operational case",
    processKicker: "The process today",
    processTitle: "Ten hand-offs. Ten systems. No single record of any of it.",
    processLead: "Follow one publication through the institution. Each stage is real work done by real people — but it happens in a different place, and the trail between them is reconstructed, not recorded.",
    process: [
      { stage: "Draft", who: "Author / policy owner", cost: "Work begins in a document with no institutional identity." },
      { stage: "Policy Team", who: "Subject-matter unit", cost: "Versions multiply across inboxes and shared drives." },
      { stage: "Legal Review", who: "Legal office", cost: "Reviewed in isolation; the comments live in email." },
      { stage: "Compliance", who: "Risk & compliance", cost: "Checked against frameworks, but the check leaves no record." },
      { stage: "Executive Approval", who: "Approving authority", cost: "Signed off — yet the approval is not provably attributable." },
      { stage: "Publication Authority", who: "Publishing office", cost: "Re-formatted and released, often as a fresh file." },
      { stage: "Records Management", who: "Records unit", cost: "Filed manually; provenance is reconstructed after the fact." },
      { stage: "Archive", who: "Institutional archive", cost: "Preserved as a copy, with no tamper-evidence." },
      { stage: "Verification", who: "Anyone, later", cost: "No way to confirm a circulating copy is the real one." },
      { stage: "Public Trust", who: "Citizens & counterparties", cost: "Authenticity rests on reputation, not on proof." },
    ],
    processClose: "By the end, the institution has produced a publication it cannot fully account for — and cannot independently prove.",
    hiddenKicker: "What it actually costs",
    hiddenTitle: "The cost is not the document. It is everything around it.",
    hidden: [
      { label: "Duplicated effort", body: "The same document is re-handled, re-formatted and re-filed by every office it passes through." },
      { label: "Unattributable authority", body: "When a decision is questioned years later, who approved it — and on what version — is hard to prove." },
      { label: "Fragmented provenance", body: "The story of how a publication came to be is scattered across email, drives and filing systems." },
      { label: "Unverifiable copies", body: "A circulating PDF cannot be distinguished from a forgery, a draft, or a superseded version." },
      { label: "Compliance without evidence", body: "Reviews happen, but leave no durable, inspectable proof that they happened." },
      { label: "Preservation without integrity", body: "Archived copies can be altered or lost with nothing to detect it." },
    ],
    unifiedKicker: "With Dispatch",
    unifiedTitle: "One governed process. One provable record.",
    unifiedLead: "Dispatch does not replace the people or the judgement. It replaces the gaps between them — collapsing ten disconnected hand-offs into five institutional services that produce one accountable, verifiable record.",
    todayLabel: "Today", todayFootnote: "Ten stages · many systems · no single source of truth",
    withLabel: "With Dispatch",
    unified: [
      { title: "One governed workflow", body: "Draft, review, approval and authorization happen in a single policy-enforced pipeline — nothing skips a step." },
      { title: "One evidence chain", body: "Every action is captured once, append-only and timestamped, as the record is made — not reconstructed afterward." },
      { title: "One publication authority", body: "Publication is an institutional act with a named authority and a permanent Record ID, not a re-saved file." },
      { title: "One verification service", body: "Anyone holding a copy can confirm it is genuine, unrevoked and untampered — with no account." },
      { title: "One preservation platform", body: "The record is sealed for its retention horizon with a tamper-evident hash, on infrastructure the institution controls." },
    ],
    withFootnote: "Five services · one platform · one provable record",
    closeTitle: "Now see exactly what you would be buying.",
    closeLead: "Walk the governed lifecycle stage by stage, model the operational case for your own institution, or open the full procurement materials.",
    ctaLifecycle: "The governed lifecycle", ctaRoi: "ROI estimator", ctaWalkthrough: "Watch a record become official", ctaProcurement: "Procurement center",
  },
  verify: {
    eyebrow: "Verification Portal",
    title: "Verify an Official Record.",
    lead: "Anyone holding a document can confirm whether it is a genuine Official Record — which institution issued it, that its governance and preservation certificates are valid, and whether it is still current or has been revoked. No account needed. A copied file cannot provide this; it still points back to the one record verified here.",
    placeholder: "Official Record ID — e.g. SD-2026-00004872",
    verifyBtn: "Verify", verifyingMsg: "Verifying…", unverifiedChip: "Unverified",
    idleHint: "Enter the Official Record ID printed on the document (or scan its verification QR) to check authenticity.",
    verdicts: {
      OFFICIAL: { title: "Verified — Official Record", note: "This is a genuine, current Official Record issued by the institution named below." },
      PRESERVED: { title: "Verified — Preserved Record", note: "This record is genuine and has been sealed into permanent preservation." },
      REVOKED: { title: "Verified — but REVOKED", note: "This record was genuine but has been withdrawn by the institution. Any copy you hold is no longer the authoritative version." },
      EVALUATION: { title: "Not an Official Record — Evaluation only", note: "This identifier belongs to a free evaluation environment. It is NOT an official record and carries no institutional authority. Genuine Official Records use the SD- identifier." },
      NOT_FOUND: { title: "Not a verified record", note: "No Official Record resolves to this identifier. Treat the document you hold as unverified." },
      ERROR: { title: "Verification unavailable", note: "The verification service could not be reached. Please try again." },
    },
    facts: {
      institution: "Issuing institution", officialRecordId: "Official Record ID", evaluationRecordId: "Evaluation Record ID",
      recordType: "Record type", title: "Title", titleWithheld: "Withheld — classified",
      classification: "Classification", unclassified: "Unclassified", governance: "Governance",
      approvalChain: "Approval chain", publishedBy: "published by", certificates: "Certificates",
      governanceCert: "Governance", preservationCert: "Preservation", published: "Published", preserved: "Preserved", revoked: "Revoked",
      integrityProof: "Cryptographic integrity proof (SHA-256)", artifactHashes: "Official artifact hashes",
    },
    fileCheck: {
      label: "Check your own copy",
      lead: "Select the file you received. It is hashed in your browser (it never leaves your device) and compared against the official artifact. If a single byte differs, it will not match.",
      leadPlural: "Select the file you received. It is hashed in your browser (it never leaves your device) and compared against the official artifacts. If a single byte differs, it will not match.",
      choose: "Choose a file to check",
      hashing: "Hashing {name}…",
      match: "{name} is an authentic, unaltered official {format} of this record.",
      nomatch: "{name} does NOT match the official artifact. It has been altered, or it is not the file the institution issued.",
    },
    verifiedBy: "Verified by Sovereign Dispatch",
    proofsKicker: "How an Official Record is authenticated",
    proofsTitle: "A verdict you can trust, because it rests on five proofs.",
    proofsLead: "Verification is not a logo or a claim — it is the institution's own evidence, checked live. Every result above is built from these five proofs, each attesting something specific and each defending against a specific way a document can be faked, altered or misrepresented.",
    provesLabel: "What it proves", defendsLabel: "What it defends against",
    proofs: [
      { title: "Governance Certificate", proves: "That the document cleared its full approval policy — the required offices reviewed and authorized it, in order, with separation of duties enforced.", defends: "Against a document that was never properly approved being passed off as an institutional decision." },
      { title: "Publication Authority", proves: "The named institutional authority that released the record as the institution's official position, captured as a distinct, attributable act.", defends: "Against ambiguity over who committed the institution — and against unauthorized publication." },
      { title: "Evidence Chain", proves: "An append-only, timestamped trail of every action — submitted, reviewed, approved, authorized, published, certified, preserved.", defends: "Against a quietly edited history. The chain is recorded as the record is made, not reconstructed afterward." },
      { title: "Integrity Hash", proves: "A SHA-256 fingerprint of the sealed record and each official artifact. The file you hold can be hashed and matched, byte for byte.", defends: "Against tampering and forgery — if a single byte differs, the hash will not match." },
      { title: "Preservation Status", proves: "Whether the record is sealed for its retention horizon, and whether it is still current or has been revoked by the institution.", defends: "Against a superseded or withdrawn version circulating as if it were still authoritative." },
    ],
    copyCardTitle: "Why a copy can never do this",
    copyCardBody: "A copied PDF can be edited, renamed or forged, and it carries none of these proofs with it. It can only point back to the one authoritative record — which is exactly what verification confirms. The proof lives with the institution, not in the file.",
    ctaWalkthrough: "See a record become official", ctaLifecycle: "The governed lifecycle", ctaOfficialRecord: "What is an Official Record?",
  },
};
