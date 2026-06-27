// Copy catalog for marketing batch 6: the Governed Lifecycle, the ROI /
// Operational-Model estimator, and the Evidence narrative. Structural data
// (stage keys, facet tones, slider ranges, computed figures, component wiring)
// stays in the pages; only human-readable copy lives here. A few strings are
// templates with {placeholders} the page interpolates with live numbers.

export interface LifecycleCopy {
  eyebrow: string; title: string; lead: string;
  stages: {
    title: string; summary: string;
    participants: string[]; governance: string[]; outputs: string[]; evidence: string[];
  }[]; // 8, in order
  facetParticipants: string; facetGovernance: string; facetOutputs: string; facetEvidence: string;
  backBtn: string; nextBtn: string;
  closeTitle: string; closeLead: string;
  ctaCost: string; ctaWalkthrough: string; ctaVerify: string; ctaRoi: string;
}

export interface RoiCopy {
  backLink: string; title: string; lead: string; leadEm: string;
  yourInstitution: string;
  fPublications: string;
  fReviewers: string; fReviewersHint: string;
  fDepartments: string; fDepartmentsHint: string;
  fAudits: string;
  yourAssumptions: string;
  fHoursPerReview: string;
  fCoordPerHandoff: string; fCoordPerHandoffHint: string;
  fAuditHoursPerPub: string; fAuditHoursPerPubHint: string;
  fHourlyCost: string;
  currencyLabel: string; resetBtn: string;
  statRecords: string; statRecordsSub: string;
  statReviewTouches: string; statReviewTouchesSub: string;
  statEvidenceChains: string; statEvidenceChainsSub: string;
  statGovernedEffort: string; statGovernedEffortSub: string; // "{cost}"
  whereEffortGoes: string;
  effortRows: { label: string; note: string }[]; // 3
  targetedLabel: string; perYear: string; targetedNote: string; // "{pct}"
  disclaimerBold: string; disclaimerBody: string; disclaimerLink: string; // body has {link}
  ctaCost: string; ctaLifecycle: string; ctaProcurement: string;
}

export interface EvidenceCopy {
  kicker: string; title: string; sub: string;
  steps: { label: string; lead: string }[]; // 4
  archEyebrow: string; archTitle: string; archSub: string; archBtn: string;
}

export interface Marketing6Copy { lifecycle: LifecycleCopy; roi: RoiCopy; evidence: EvidenceCopy; }

export const MARKETING6_EN: Marketing6Copy = {
  lifecycle: {
    eyebrow: "The governed lifecycle",
    title: "Exactly what you are buying, stage by stage.",
    lead: "Every Dispatch publication follows the same eight governed stages. Select any stage to see the participants, what governs it, the outputs it produces, and the evidence it leaves behind.",
    stages: [
      {
        title: "Create",
        summary: "An author drafts the document inside the institution's governed workspace — it carries institutional context from the first keystroke.",
        participants: ["Author / document owner", "Contributing subject-matter units"],
        governance: ["Created inside the governed workspace, not a personal drive", "Document type and classification set the policy that will apply"],
        outputs: ["A draft with institutional identity — owner, type and classification attached"],
        evidence: ["The draft is captured with its author and a timestamp"],
      },
      {
        title: "Review",
        summary: "The document enters its resolved approval policy. The required offices review in order — legal, compliance and subject-matter — each recording their position.",
        participants: ["Legal office", "Compliance & risk", "Reviewing departments"],
        governance: ["The resolved approval policy requires these offices to review, in order", "Separation of duties — a submitter cannot later approve their own work"],
        outputs: ["A reviewed version — advanced, or returned for revision with comments"],
        evidence: ["Each review is recorded against the office that performed it, bound to the version reviewed"],
      },
      {
        title: "Approve",
        summary: "The approving authority signs off. Approval is an explicit, attributable act — and the platform enforces that the approver is not the author.",
        participants: ["Approving authority for the document type", "Delegated (acting) approvers, where appointed"],
        governance: ["Approval is an explicit, attributable act by a named office", "Separation of duties is enforced and logged"],
        outputs: ["An approval bound to a named office and the exact version"],
        evidence: ["The approval, the office and the version are recorded together"],
      },
      {
        title: "Authorize",
        summary: "A senior authority authorizes the record for publication — the final institutional gate before anything becomes official.",
        participants: ["Permanent secretary / executive authority", "Publication authority"],
        governance: ["A final senior gate: the institution decides it will publish this as its official position", "When it takes effect is set here"],
        outputs: ["Authorization to publish, recorded as a distinct act"],
        evidence: ["The authorizing office and the effective decision are captured"],
      },
      {
        title: "Publish",
        summary: "The record is published and allocated a permanent Record ID — never reused. From this point every copy points back to one authoritative record.",
        participants: ["Publication authority", "The platform's record service"],
        governance: ["Only an authorized record may publish", "A permanent identifier is allocated and never reused"],
        outputs: ["An Official Record with a permanent Record ID (SD-YYYY-NNNNNNNN) and a hash-stamped artefact"],
        evidence: ["The Record ID and the artefact hash are bound to the record"],
      },
      {
        title: "Certify",
        summary: "Governance and Preservation certificates are sealed — the institutional proof of how the record came to be and that it is preserved intact.",
        participants: ["The platform's certification service"],
        governance: ["Certificates are sealed to the record at publication, not added later"],
        outputs: ["A Governance Certificate (the approval chain satisfied)", "A Preservation Certificate (retention horizon + integrity hash)"],
        evidence: ["Both certificates and their hashes are attached to the record"],
      },
      {
        title: "Verify",
        summary: "Anyone holding a copy can independently confirm the record is genuine, unrevoked and untampered — by its Record ID, with no account.",
        participants: ["Any recipient — citizen, auditor, counterparty", "No login required"],
        governance: ["Verification is public and read-only", "Status is disclosed honestly — including revoked or evaluation records"],
        outputs: ["A verification result: institution, status, integrity hash", "A file-level match check against the issued artefact"],
        evidence: ["The institution's own certificates and hashes, checked live against the copy presented"],
      },
      {
        title: "Preserve",
        summary: "The record is sealed for its retention horizon with a tamper-evident hash, on infrastructure the institution controls — and remains verifiable for its full life.",
        participants: ["The institution's archive", "The platform's preservation service"],
        governance: ["Sealed for its retention horizon on infrastructure the institution controls", "Integrity is tamper-evident"],
        outputs: ["A preserved record that remains verifiable for its full retention life"],
        evidence: ["A tamper-evident integrity hash and the enforced retention horizon"],
      },
    ],
    facetParticipants: "Participants", facetGovernance: "Governance", facetOutputs: "Outputs", facetEvidence: "Evidence",
    backBtn: "Back", nextBtn: "Next stage",
    closeTitle: "From the cost today to the proof at the end.",
    closeLead: "See why the process is expensive today, watch one record move through it live, or verify a real record for yourself.",
    ctaCost: "The cost of publication", ctaWalkthrough: "Watch a record become official", ctaVerify: "Verify a record", ctaRoi: "ROI estimator",
  },
  roi: {
    backLink: "Procurement Center · Operational Model",
    title: "Model the scale of governed publication.",
    lead: "Enter your institution's own figures. This estimator reflects the scale of activity those figures imply — it does {em} promise savings. Dispatch does not reduce the judgement an official publication requires; it governs that work and removes the coordination and reconstruction effort around it. What you see below depends entirely on your own processes.",
    leadEm: "not",
    yourInstitution: "Your institution",
    fPublications: "Official publications / year",
    fReviewers: "Reviewing offices / publication", fReviewersHint: "Legal, compliance, subject-matter offices that review before approval.",
    fDepartments: "Departments involved / publication", fDepartmentsHint: "Distinct departments a publication is handed between.",
    fAudits: "Audits / evidence requests / year",
    yourAssumptions: "Your assumptions",
    fHoursPerReview: "Hours per review touch",
    fCoordPerHandoff: "Coordination hours per hand-off", fCoordPerHandoffHint: "Chasing, re-sending, reconciling versions between departments.",
    fAuditHoursPerPub: "Audit-assembly hours per publication", fAuditHoursPerPubHint: "Reconstructing the evidence trail for one publication, per audit.",
    fHourlyCost: "Blended staff cost / hour",
    currencyLabel: "Currency", resetBtn: "Reset to example figures",
    statRecords: "Permanent records / year", statRecordsSub: "Each receives a permanent Record ID and integrity hash.",
    statReviewTouches: "Review touches / year", statReviewTouchesSub: "Office-level reviews governed in policy order.",
    statEvidenceChains: "Evidence chains / year", statEvidenceChainsSub: "Generated automatically — not assembled by hand.",
    statGovernedEffort: "Governed effort / year", statGovernedEffortSub: "≈ {cost} at your blended rate.",
    whereEffortGoes: "Where the effort goes",
    effortRows: [
      { label: "Review & approval (judgement)", note: "Irreducible — Dispatch governs it, it does not remove it." },
      { label: "Coordination between departments", note: "Hand-off waste a governed workflow targets." },
      { label: "Audit & evidence assembly", note: "Reconstruction a standing evidence chain targets." },
    ],
    targetedLabel: "Effort Dispatch targets", perYear: "/ year · ≈",
    targetedNote: "About {pct}% of governed effort in this model is coordination and reconstruction — the part a single governed platform is designed to reduce. This is an illustrative reflection of your inputs, not a committed saving.",
    disclaimerBold: "This is an illustrative operational model, not a quotation or a guarantee.",
    disclaimerBody: "Every figure is derived only from the inputs and assumptions you provide, and real outcomes depend entirely on your institution's own processes, volumes and rates. Dispatch does not reduce the review or approval an official publication requires. No savings, ROI, payback or financial outcome is promised. Pricing is published separately on the {link}.",
    disclaimerLink: "pricing page",
    ctaCost: "The cost of publication", ctaLifecycle: "The governed lifecycle", ctaProcurement: "Procurement center",
  },
  evidence: {
    kicker: "Evidence", title: "See the governance, not the promise.",
    sub: "Every official record carries its own provenance — from how it works, to how it is governed, to what gets produced and how it is deployed.",
    steps: [
      { label: "How it works", lead: "A submission becomes an official record through a single governed path." },
      { label: "How it is governed", lead: "Every action is recorded to an append-only, hash-stamped audit trail." },
      { label: "What gets produced", lead: "A faithful, classified, hash-stamped record — PDF and DOCX." },
      { label: "How it is deployed", lead: "Into the sovereignty model your mandate requires." },
    ],
    archEyebrow: "Architecture Overview",
    archTitle: "System, governance, security & deployment — one reference.",
    archSub: "Cloud · Private · Sovereign · On-Premise · Air-Gapped. Print-ready for procurement.",
    archBtn: "View Architecture",
  },
};
