// Layer 3 of the SEO ecosystem — Problem / Concept Pages. One authoritative page
// per head-term query ("official publication", "evidence chain", "cryptographic
// sealing", …). These target informational and solution-category intent: each is
// a real reference written to win featured snippets and AI-answer citations, with
// a snippet-ready definition, why-it-matters stakes, how Sovereign Dispatch
// addresses it, FAQs, and dense internal links into the 70 industry pages.
//
// Deliberately NOT imaged with photos — concept pages rank on text depth,
// structured data (DefinedTerm + FAQPage + Article) and internal linking. A small
// set of reusable inline-SVG diagrams (see `diagram`) teaches where a picture helps.

export type ProblemDiagram = "chain" | "seal" | "lifecycle" | "shield" | "ledger" | "workflow";

export interface Problem {
  slug: string;
  term: string;               // the head term, as a heading ("Official Publication")
  category: string;           // grouping for the index hub
  kicker: string;             // small eyebrow label
  headline: string;           // the page promise
  lead: string;               // 1–2 sentence intro
  definition: string;         // snippet-ready definition (DefinedTerm + highlighted block)
  why: string[];              // the stakes — why this matters
  how: { t: string; d: string }[]; // how Sovereign Dispatch addresses it (3)
  faqs: { q: string; a: string }[]; // 3–4, emitted as FAQPage schema
  relatedIndustries: string[]; // industry slugs to link into
  relatedProblems: string[];   // other problem slugs to link
  diagram: ProblemDiagram;
  metaTitle: string;
  metaDescription: string;
}

export const PROBLEMS_BASE = "/learn";

export const PROBLEMS: Problem[] = [
  {
    slug: "official-publication",
    term: "Official Publication",
    category: "Concepts & definitions",
    kicker: "Concept",
    headline: "What an official publication is — and what makes it official.",
    lead: "Anyone can publish a document. An official publication is different: it is issued under the authority of an institution and can be proven genuine for as long as it matters.",
    definition:
      "An official publication is a document issued under the authority of an institution — not an individual — through a governed approval process, and made permanently verifiable so that anyone can confirm it is the genuine, current version.",
    why: [
      "A PDF emailed around an organisation looks identical whether it is the approved final version or an early draft. Nothing on the file proves which.",
      "When a publication is challenged years later — in court, in an audit, by the public — the institution must be able to prove who approved it, in what order, and that the file has not changed since.",
      "Most institutions cannot prove this. The approval lived in email and meetings; the published file is just a copy with no durable link back to the authority that issued it.",
    ],
    how: [
      { t: "Issued by an office, not a person", d: "Sovereign Dispatch binds every publication to the authority of an office, so it stays valid when the individual who signed it has moved on." },
      { t: "Governed before it is published", d: "An enforced approval chain runs before the document is released — the official version is the one that completed governance, and nothing else can pass as official." },
      { t: "Permanently verifiable", d: "Each publication carries a permanent Record ID and integrity proof, so anyone can confirm it is genuine and unaltered — with no account." },
    ],
    faqs: [
      { q: "What is the difference between a document and an official publication?", a: "A document is just a file. An official publication is issued under an institution's authority through a governed process and is permanently verifiable — you can prove who issued it and that it has not changed." },
      { q: "How do you prove a publication is official?", a: "By verifying its permanent Record ID and integrity proof against the issuing institution's record. Sovereign Dispatch lets anyone do this without an account." },
      { q: "Does a signature or letterhead make a publication official?", a: "No. A signature or letterhead can be copied. Authority bound to an office plus a verifiable integrity proof is what makes a publication provably official." },
    ],
    relatedIndustries: ["government", "regulators", "justice", "central-banks"],
    relatedProblems: ["document-governance", "document-authenticity", "governance-certificate", "document-verification"],
    diagram: "shield",
    metaTitle: "What Is an Official Publication? Definition & How to Prove One",
    metaDescription: "An official publication is a document issued under an institution's authority through a governed process and made permanently verifiable. Learn what makes a publication official and how to prove it.",
  },
  {
    slug: "document-governance",
    term: "Document Governance",
    category: "Concepts & definitions",
    kicker: "Concept",
    headline: "Document governance: control over how records are approved and issued.",
    lead: "Document governance is the discipline of controlling how a document is drafted, reviewed, approved and published — so that what goes out is provably authorised.",
    definition:
      "Document governance is the set of controls that determine how a document moves from draft to authorised publication: who may approve it, in what order, and how the resulting record is preserved and verified.",
    why: [
      "Without governance, the question 'who approved this and on what basis?' has no reliable answer — the trail is scattered across inboxes and shared drives.",
      "Ungoverned publication is where expensive mistakes happen: a draft released as final, a superseded version still circulating, an approval that never actually occurred.",
      "Governance is not bureaucracy for its own sake — it is the difference between authority you can defend and authority you merely assert.",
    ],
    how: [
      { t: "Enforced approval chains", d: "Approvals happen in a defined order, bound to named offices. The workflow cannot be skipped, and the record shows exactly how authorisation was given." },
      { t: "One authoritative version", d: "Dispatch maintains a single governed record; superseded and draft versions cannot be mistaken for the current, official one." },
      { t: "Evidence captured as you go", d: "The governance trail is recorded as the document is made — never reconstructed afterwards under pressure." },
    ],
    faqs: [
      { q: "What is document governance?", a: "It is the control over how a document is approved and issued — who may authorise it, in what order, and how the record is preserved and verified." },
      { q: "How is document governance different from document management?", a: "Document management stores and organises files. Document governance controls and proves how they are authorised and published." },
      { q: "Why does document governance matter?", a: "It lets an institution prove its publications are genuine and authorised — essential for audits, legal challenges and public trust." },
    ],
    relatedIndustries: ["government", "healthcare", "financial-institutions", "universities"],
    relatedProblems: ["policy-approval-workflow", "official-publication", "publication-audit", "evidence-chain"],
    diagram: "workflow",
    metaTitle: "What Is Document Governance? Definition, Controls & Why It Matters",
    metaDescription: "Document governance controls how a document is approved and issued — who authorises it, in what order, and how the record is preserved and verified. Learn the controls and why they matter.",
  },
  {
    slug: "board-resolution-software",
    term: "Board Resolution Software",
    category: "Operations & workflow",
    kicker: "Solution",
    headline: "Board resolution software that makes every resolution provable.",
    lead: "Board resolution software governs how a board's decisions are proposed, approved and recorded — and, done right, makes each resolution permanently verifiable.",
    definition:
      "Board resolution software is a system for drafting, approving and recording the formal decisions of a board or council, so that each resolution is attributable, version-controlled and provably authentic.",
    why: [
      "A board resolution is the legal basis for action — opening accounts, appointing officers, committing funds. If its authenticity is doubted, every act that relied on it is exposed.",
      "Resolutions managed in documents and email cannot prove who voted, when it was approved, or that the recorded text matches what the board actually passed.",
      "When a regulator, auditor or counterparty asks for proof of a resolution, reconstructing it from minutes and inboxes is slow and unconvincing.",
    ],
    how: [
      { t: "Attributable approval", d: "Each resolution is approved through a governed chain bound to named offices, so who authorised it — and in what order — is on the record." },
      { t: "One authoritative text", d: "The passed resolution is a single governed record; drafts and amendments cannot be mistaken for the adopted version." },
      { t: "Provable to third parties", d: "Each resolution carries a permanent Record ID, so a bank, registry or counterparty can confirm it is genuine without access to internal systems." },
    ],
    faqs: [
      { q: "What does board resolution software do?", a: "It governs how a board's decisions are drafted, approved and recorded, and makes each resolution attributable and permanently verifiable." },
      { q: "Why not just keep resolutions in minutes and documents?", a: "Minutes and documents cannot prove who approved a resolution or that the text is unaltered. Governed software captures that proof as the resolution is passed." },
      { q: "Can a third party verify a board resolution?", a: "Yes — with Sovereign Dispatch each resolution has a permanent Record ID that a counterparty can verify independently, with no account." },
    ],
    relatedIndustries: ["financial-institutions", "development-banks", "insurance", "universities"],
    relatedProblems: ["policy-approval-workflow", "governance-certificate", "document-authenticity", "institutional-records"],
    diagram: "workflow",
    metaTitle: "Board Resolution Software — Make Every Resolution Provable",
    metaDescription: "Board resolution software governs how a board's decisions are approved and recorded, making each resolution attributable, version-controlled and permanently verifiable by third parties.",
  },
  {
    slug: "government-publication-workflow",
    term: "Government Publication Workflow",
    category: "Operations & workflow",
    kicker: "Workflow",
    headline: "A government publication workflow that proves its own authority.",
    lead: "A government publication workflow is the path an order, regulation or notice takes from drafting to official gazette — and it should produce proof, not just a PDF.",
    definition:
      "A government publication workflow is the governed process by which a public body drafts, reviews, approves and issues an official document — such as an executive order, regulation or gazette notice — as an authoritative public record.",
    why: [
      "Public authority depends on documents that remain provably genuine for years — a regulation must be defensible long after the official who signed it has gone.",
      "When the workflow lives in email and shared drives, the government cannot reliably show how a published instrument was approved, or that the circulating copy is the genuine one.",
      "Citizens, courts and other agencies need to trust the published text. A workflow that ends in an ordinary file gives them nothing to verify against.",
    ],
    how: [
      { t: "Authority bound to the office", d: "Publication is issued under the authority of an office, so an instrument stays valid across changes of personnel and government." },
      { t: "Governed end to end", d: "Drafting, legal review and approval run as an enforced chain; only the instrument that completed governance is published as official." },
      { t: "Verifiable by anyone", d: "Each gazette notice or order carries a permanent Record ID, so any citizen or agency can confirm the genuine, current version — with no account." },
    ],
    faqs: [
      { q: "What is a government publication workflow?", a: "It is the governed process a public body uses to draft, approve and issue an official document — like an order, regulation or gazette notice — as an authoritative public record." },
      { q: "How is it different from a normal document workflow?", a: "It must produce durable, public proof: authority bound to an office and a publication anyone can verify, not just an approved file." },
      { q: "How can the public verify a government publication?", a: "By checking its permanent Record ID against the issuing body's record — Sovereign Dispatch makes this possible for anyone, without an account." },
    ],
    relatedIndustries: ["government", "municipalities", "parliaments", "regulators"],
    relatedProblems: ["official-publication", "policy-approval-workflow", "regulatory-publication", "evidence-chain"],
    diagram: "workflow",
    metaTitle: "Government Publication Workflow — From Draft to Verifiable Gazette",
    metaDescription: "A government publication workflow governs how a public body drafts, approves and issues orders, regulations and gazette notices as authoritative, permanently verifiable public records.",
  },
  {
    slug: "regulatory-publication",
    term: "Regulatory Publication",
    category: "Concepts & definitions",
    kicker: "Concept",
    headline: "Regulatory publication that the regulated can rely on.",
    lead: "A regulatory publication — a rule, licence, determination or notice — carries legal force. It must be provably the genuine, current instrument the moment it is read.",
    definition:
      "A regulatory publication is an authoritative document issued by a regulator — such as a rule, licence, enforcement decision or public notice — that imposes or confirms legal obligations and must be verifiable as genuine and current.",
    why: [
      "Regulated entities act on the published rule. If they cannot prove which version was in force when they acted, compliance itself becomes contestable.",
      "A circulating copy of a regulation cannot prove it is the current text — amendments and withdrawals are easy to miss and impossible to verify from the file alone.",
      "Enforcement decisions are litigated for years; the regulator must be able to show who decided what, on which version, and that the record is unaltered.",
    ],
    how: [
      { t: "One authoritative instrument", d: "Dispatch keeps a single governed version of each rule or decision; superseded text cannot pass as current." },
      { t: "Attributable decisions", d: "Every determination is approved under a named office and bound to the exact version, on the record." },
      { t: "Independently verifiable", d: "Each publication carries a permanent Record ID any regulated party can verify — with no account." },
    ],
    faqs: [
      { q: "What is a regulatory publication?", a: "An authoritative document issued by a regulator — a rule, licence, determination or notice — that carries legal force and must be verifiable as genuine and current." },
      { q: "Why must regulatory publications be verifiable?", a: "Because regulated entities and courts rely on the exact text in force. Verifiability lets them prove which version applied and that it is unaltered." },
      { q: "How does a regulated entity check a publication is current?", a: "By verifying its permanent Record ID against the regulator's record — Sovereign Dispatch makes this independent and account-free." },
    ],
    relatedIndustries: ["regulators", "central-banks", "securities-regulators", "telecom-regulators"],
    relatedProblems: ["official-publication", "document-verification", "evidence-chain", "publication-audit"],
    diagram: "shield",
    metaTitle: "Regulatory Publication — Rules & Decisions the Regulated Can Trust",
    metaDescription: "A regulatory publication is an authoritative rule, licence or decision that carries legal force. Learn what makes it reliable and how regulated parties verify the genuine, current version.",
  },
  {
    slug: "legal-publication",
    term: "Legal Publication",
    category: "Concepts & definitions",
    kicker: "Concept",
    headline: "Legal publication where the authentic text is provable.",
    lead: "A legal publication — a judgment, ruling, statute or legal notice — is relied on as authoritative. Its exact, authentic text must be provable, sometimes for decades.",
    definition:
      "A legal publication is an authoritative legal document — such as a judgment, ruling, statutory instrument or legal notice — whose exact text and provenance must be verifiable for it to be relied on in law.",
    why: [
      "Courts, lawyers and citizens rely on the precise text of what was decided or enacted. A wrong or altered version undermines the rule of law itself.",
      "A circulating copy of a judgment or statute cannot prove it is the authentic version, nor that it has not been edited since publication.",
      "When authenticity is challenged, the issuing body must show the exact version and the chain of approval — not reconstruct it from memory.",
    ],
    how: [
      { t: "The authentic text, governed", d: "Dispatch maintains a single authoritative record of each judgment or instrument; drafts and superseded versions cannot pass as authentic." },
      { t: "Provenance on the record", d: "Who issued the publication, under what authority, and on which version is captured as the record is made." },
      { t: "Verifiable for its full life", d: "Each legal publication carries a permanent Record ID, verifiable by anyone for as long as it is relied on." },
    ],
    faqs: [
      { q: "What is a legal publication?", a: "An authoritative legal document — judgment, ruling, statute or legal notice — whose exact text and provenance must be verifiable to be relied on in law." },
      { q: "How do you prove a legal publication is authentic?", a: "By verifying its permanent Record ID and integrity proof against the issuing body's record, confirming the exact text is genuine and unaltered." },
      { q: "Why is the exact version so important?", a: "Because legal effect turns on precise wording. Relying on a superseded or altered version can change the outcome of a case." },
    ],
    relatedIndustries: ["justice", "parliaments", "law-enforcement", "notarial-authorities"],
    relatedProblems: ["document-authenticity", "official-publication", "evidence-chain", "institutional-records"],
    diagram: "shield",
    metaTitle: "Legal Publication — Proving the Authentic Text of Judgments & Statutes",
    metaDescription: "A legal publication is an authoritative judgment, ruling or statute whose exact text and provenance must be verifiable. Learn how the authentic text is governed and proven.",
  },
  {
    slug: "evidence-chain",
    term: "Evidence Chain",
    category: "Integrity & proof",
    kicker: "Integrity",
    headline: "An evidence chain that exists before anyone asks for it.",
    lead: "An evidence chain is the unbroken record of how a document was approved and issued — captured as it happened, so it can be trusted when it is needed.",
    definition:
      "An evidence chain is a complete, ordered and tamper-evident record of every step in a document's approval and publication — who acted, when, and on which version — captured as the document is made rather than reconstructed afterwards.",
    why: [
      "When a publication is questioned, the value of the proof depends entirely on when it was created. Evidence assembled after the challenge is weak and contestable.",
      "Most organisations only build the trail when an auditor or court demands it — gathering emails, sign-offs and versions under time pressure, with gaps.",
      "An evidence chain that is recorded continuously, in order, and sealed against change is the difference between proving authority and asserting it.",
    ],
    how: [
      { t: "Captured as it happens", d: "Every approval step is recorded the moment it occurs, in order — never reconstructed later." },
      { t: "Tamper-evident", d: "The chain is sealed with integrity proofs, so any later change is detectable; the record either verifies intact or it does not." },
      { t: "Ready on demand", d: "Because the chain already exists, responding to an audit or legal challenge is retrieval, not reconstruction." },
    ],
    faqs: [
      { q: "What is an evidence chain?", a: "A complete, ordered, tamper-evident record of how a document was approved and issued — who acted, when, and on which version — captured as it happened." },
      { q: "Why does the timing of evidence matter?", a: "Evidence created as events occur is far stronger than evidence assembled after a challenge, which is prone to gaps and disputes." },
      { q: "How is an evidence chain kept tamper-evident?", a: "By sealing each step with cryptographic integrity proofs, so any subsequent alteration is detectable on verification." },
    ],
    relatedIndustries: ["justice", "anti-corruption-agencies", "supreme-audit-institutions", "regulators"],
    relatedProblems: ["cryptographic-sealing", "publication-audit", "document-authenticity", "governance-certificate"],
    diagram: "chain",
    metaTitle: "What Is an Evidence Chain? Definition & Why Timing Matters",
    metaDescription: "An evidence chain is a complete, ordered, tamper-evident record of how a document was approved and issued, captured as it happened. Learn why it beats evidence reconstructed after the fact.",
  },
  {
    slug: "document-authenticity",
    term: "Document Authenticity",
    category: "Integrity & proof",
    kicker: "Integrity",
    headline: "Document authenticity you can prove, not just claim.",
    lead: "Document authenticity is the property of being provably genuine — the real document, issued by who it claims, unchanged since. Most documents only assert it.",
    definition:
      "Document authenticity is the verifiable property that a document is genuine: issued by the claimed authority and unaltered since publication, provable by anyone rather than merely asserted by appearance.",
    why: [
      "Letterheads, signatures and seals can all be copied. Appearance is not proof — a convincing forgery looks exactly like the real thing.",
      "When a document's authenticity matters most — a certificate, a licence, a ruling — the recipient often has no independent way to confirm it is genuine.",
      "Authenticity that depends on calling the issuer to check does not scale and breaks down precisely when the issuer is hardest to reach.",
    ],
    how: [
      { t: "Bound to the issuing office", d: "Each publication is issued under a named authority, so its origin is part of the record, not an inference from letterhead." },
      { t: "Integrity proof per document", d: "A cryptographic proof ties the exact file to its record; altering a single byte breaks verification." },
      { t: "Anyone can verify", d: "A permanent Record ID lets any recipient confirm authenticity independently — with no account and no call to the issuer." },
    ],
    faqs: [
      { q: "What is document authenticity?", a: "The verifiable property that a document is genuine — issued by the claimed authority and unaltered since publication — provable by anyone, not just asserted." },
      { q: "Why isn't a signature or seal enough?", a: "Signatures and seals can be copied. Real authenticity needs a verifiable integrity proof tied to the issuing authority." },
      { q: "How can I verify a document is authentic?", a: "Verify its permanent Record ID and integrity proof against the issuer's record. Sovereign Dispatch lets anyone do this without an account." },
    ],
    relatedIndustries: ["civil-registration", "intellectual-property", "notarial-authorities", "universities"],
    relatedProblems: ["document-verification", "tamper-proof-publication", "cryptographic-sealing", "official-publication"],
    diagram: "seal",
    metaTitle: "Document Authenticity — How to Prove a Document Is Genuine",
    metaDescription: "Document authenticity is the verifiable property of being genuine and unaltered. Learn why signatures and seals aren't enough and how to prove a document is authentic.",
  },
  {
    slug: "institutional-records",
    term: "Institutional Records",
    category: "Concepts & definitions",
    kicker: "Concept",
    headline: "Institutional records that outlive the people who made them.",
    lead: "Institutional records are the durable memory of an organisation — decisions, publications and acts that must remain authoritative long after individuals move on.",
    definition:
      "Institutional records are the authoritative documents an organisation must preserve as durable proof of its decisions and acts — bound to the authority of offices rather than individuals, and kept verifiable for their full retention life.",
    why: [
      "An institution's authority is continuous, but its people are not. A record tied to a person who has left loses its anchor.",
      "Records scattered across personal drives and inboxes degrade into uncertainty — the organisation cannot say with confidence what it decided or published.",
      "Retention obligations can run for decades. A record that cannot be proven genuine years later fails exactly when it is most needed.",
    ],
    how: [
      { t: "Bound to offices", d: "Records are issued under the authority of an office, so they remain attributable and valid across every change of personnel." },
      { t: "Single source of truth", d: "Dispatch holds one authoritative record; copies and drafts cannot displace it." },
      { t: "Verifiable for their full life", d: "Each record carries a permanent Record ID and integrity proof, verifiable for as long as it must be retained." },
    ],
    faqs: [
      { q: "What are institutional records?", a: "The authoritative documents an organisation must preserve as durable proof of its decisions and acts, bound to offices and kept verifiable for their retention life." },
      { q: "Why bind records to offices instead of people?", a: "Because authority is continuous while individuals change. Binding to an office keeps a record valid after the person who created it has gone." },
      { q: "How long must institutional records remain verifiable?", a: "Often for decades, depending on retention law. The integrity proof must hold for the full retention period." },
    ],
    relatedIndustries: ["archives", "national-libraries", "government", "universities"],
    relatedProblems: ["digital-preservation", "official-publication", "document-governance", "evidence-chain"],
    diagram: "ledger",
    metaTitle: "Institutional Records — Durable, Verifiable Organisational Memory",
    metaDescription: "Institutional records are the authoritative documents an organisation preserves as durable proof of its decisions, bound to offices and kept verifiable for their full retention life.",
  },
  {
    slug: "digital-preservation",
    term: "Digital Preservation",
    category: "Integrity & proof",
    kicker: "Preservation",
    headline: "Digital preservation that keeps records provable, not just stored.",
    lead: "Digital preservation keeps records usable and trustworthy over the long term. Storing a file is not enough — preservation must also keep it provably genuine.",
    definition:
      "Digital preservation is the practice of keeping digital records accessible, usable and provably authentic over the long term — protecting not only the file itself but the evidence that it is the genuine, unaltered record.",
    why: [
      "A file can survive for decades and still be worthless as proof if no one can show it is the genuine, unaltered version.",
      "Backups protect against loss, but not against doubt — a restored file looks identical whether or not it was tampered with along the way.",
      "Preservation that ignores authenticity leaves an archive full of documents nobody can fully trust.",
    ],
    how: [
      { t: "Integrity preserved with the file", d: "Each record's integrity proof is preserved alongside it, so authenticity can be verified for the full retention period." },
      { t: "Authority preserved too", d: "The issuing office and approval chain are preserved as part of the record, not lost to staff turnover." },
      { t: "Verifiable at any point", d: "A permanent Record ID means a preserved record can be confirmed genuine decades after it was issued." },
    ],
    faqs: [
      { q: "What is digital preservation?", a: "Keeping digital records accessible, usable and provably authentic over the long term — preserving the evidence of genuineness, not just the file." },
      { q: "Isn't a backup enough for preservation?", a: "No. Backups protect against loss but not against doubt. Preservation must also keep a record provably unaltered." },
      { q: "How do you preserve authenticity, not just the file?", a: "By preserving the integrity proof and approval record with the document, so it can be verified as genuine far into the future." },
    ],
    relatedIndustries: ["archives", "national-libraries", "museums", "heritage-authorities"],
    relatedProblems: ["institutional-records", "tamper-proof-publication", "evidence-chain", "document-authenticity"],
    diagram: "ledger",
    metaTitle: "Digital Preservation — Keeping Records Usable AND Provable",
    metaDescription: "Digital preservation keeps records accessible and provably authentic over the long term, preserving the evidence of genuineness — not just the file. Learn why storage alone isn't enough.",
  },
  {
    slug: "document-verification",
    term: "Document Verification",
    category: "Integrity & proof",
    kicker: "Verification",
    headline: "Document verification anyone can do, with no account.",
    lead: "Document verification is confirming that a document is genuine and unaltered. The best verification needs no special access — anyone can do it.",
    definition:
      "Document verification is the process of confirming that a document is genuine and unaltered — ideally by checking a permanent identifier and integrity proof against the issuer's record, independently and without privileged access.",
    why: [
      "Verification that requires calling the issuer or logging into a portal fails the people who most need it — recipients, the public, other institutions.",
      "If verification is hard, it does not happen, and forgeries circulate unchallenged.",
      "Trust scales only when anyone holding a document can confirm it themselves, in seconds, against the source of truth.",
    ],
    how: [
      { t: "Permanent Record ID", d: "Every publication carries an ID that resolves to its authoritative record at the issuing institution." },
      { t: "Exact-file integrity check", d: "Verification confirms the specific file is byte-for-byte the issued version; any change is detected." },
      { t: "Open to everyone", d: "Anyone can verify a record with no account, so trust does not depend on insider access." },
    ],
    faqs: [
      { q: "What is document verification?", a: "Confirming that a document is genuine and unaltered, ideally by checking a permanent identifier and integrity proof against the issuer's record." },
      { q: "Do I need an account to verify a document?", a: "With Sovereign Dispatch, no. Verification is open to anyone so trust does not depend on privileged access." },
      { q: "What does verification actually check?", a: "That the document maps to a genuine issued record and that the exact file is unaltered since publication." },
    ],
    relatedIndustries: ["civil-registration", "universities", "customs-border", "chambers-of-commerce"],
    relatedProblems: ["document-authenticity", "tamper-proof-publication", "official-publication", "cryptographic-sealing"],
    diagram: "seal",
    metaTitle: "Document Verification — Confirm a Document Is Genuine, No Account",
    metaDescription: "Document verification confirms a document is genuine and unaltered by checking a permanent Record ID and integrity proof against the issuer — independently, with no account.",
  },
  {
    slug: "tamper-proof-publication",
    term: "Tamper-Proof Publication",
    category: "Integrity & proof",
    kicker: "Integrity",
    headline: "Tamper-evident publication: any change is detectable.",
    lead: "A tamper-proof — more precisely, tamper-evident — publication is one where any alteration after issue can be detected. You cannot prevent edits to a copy, but you can make them provable.",
    definition:
      "A tamper-evident publication is a document sealed at issue with an integrity proof, so that any alteration to it afterwards is detectable on verification — the record either confirms intact or fails, leaving no room for a silent change.",
    why: [
      "Anyone can edit a copied file. The real protection is not preventing edits but making the genuine version provable and any tampering obvious.",
      "Without tamper-evidence, an altered document can circulate as if genuine, and the recipient has no way to know.",
      "'Tamper-proof' is the goal people ask for; 'tamper-evident' is what is technically achievable and, for proof, sufficient — a change that is always detected cannot deceive.",
    ],
    how: [
      { t: "Sealed at issue", d: "Each publication is sealed with a cryptographic integrity proof at the moment it becomes official." },
      { t: "Any change breaks the seal", d: "Altering a single byte causes verification to fail, so tampering cannot pass unnoticed." },
      { t: "The genuine version is provable", d: "A permanent Record ID always points to the authentic record, so the real version can be confirmed against any copy." },
    ],
    faqs: [
      { q: "Is anything truly tamper-proof?", a: "You cannot stop someone editing a copy. What is achievable — and sufficient — is tamper-evidence: any alteration is reliably detected on verification." },
      { q: "How is a publication made tamper-evident?", a: "By sealing it with a cryptographic integrity proof at issue, so any later change breaks verification." },
      { q: "What stops a forged copy from circulating?", a: "The permanent Record ID points to the genuine record, so any copy can be checked against the authentic version and forgeries exposed." },
    ],
    relatedIndustries: ["regulators", "justice", "central-banks", "anti-corruption-agencies"],
    relatedProblems: ["cryptographic-sealing", "document-authenticity", "document-verification", "evidence-chain"],
    diagram: "seal",
    metaTitle: "Tamper-Proof (Tamper-Evident) Publication — Make Changes Detectable",
    metaDescription: "A tamper-evident publication is sealed at issue so any later alteration is detectable on verification. Learn why tamper-evident beats 'tamper-proof' and how sealing works.",
  },
  {
    slug: "cryptographic-sealing",
    term: "Cryptographic Sealing",
    category: "Integrity & proof",
    kicker: "Integrity",
    headline: "Cryptographic sealing: binding proof to the exact document.",
    lead: "Cryptographic sealing ties a mathematical proof to a document so that its authenticity and integrity can be verified by anyone — and any change is exposed.",
    definition:
      "Cryptographic sealing is the use of cryptographic hashing and signatures to bind a verifiable proof to a document at the moment it is issued, so that its integrity (it is unaltered) and origin (who issued it) can be confirmed independently.",
    why: [
      "A claim of authenticity is only as good as the ability to check it. Cryptography turns 'trust us' into 'verify it yourself'.",
      "A cryptographic hash is a fingerprint of the exact file: change one byte and the fingerprint changes, so tampering is mathematically detectable.",
      "Binding that proof to the issuing authority means a recipient can confirm both that the document is unaltered and who stands behind it.",
    ],
    how: [
      { t: "Hash the exact file", d: "At issue, a cryptographic hash captures the document's exact contents as a unique fingerprint." },
      { t: "Bind to the authority", d: "The seal ties that fingerprint to the issuing office's record, establishing origin alongside integrity." },
      { t: "Verify independently", d: "Anyone can recompute the fingerprint and check it against the record — no trust in the holder required." },
    ],
    faqs: [
      { q: "What is cryptographic sealing?", a: "Binding a cryptographic proof — a hash and signature — to a document at issue, so its integrity and origin can be verified independently." },
      { q: "How does a hash detect tampering?", a: "A hash is a fingerprint of the exact file. Changing any part changes the fingerprint, so an altered document fails verification." },
      { q: "Does cryptographic sealing prove who issued a document?", a: "Yes — the seal binds the integrity proof to the issuing authority's record, establishing origin as well as integrity." },
    ],
    relatedIndustries: ["central-banks", "securities-regulators", "defence", "intellectual-property"],
    relatedProblems: ["tamper-proof-publication", "document-authenticity", "evidence-chain", "governance-certificate"],
    diagram: "seal",
    metaTitle: "Cryptographic Sealing — How Documents Are Made Verifiable",
    metaDescription: "Cryptographic sealing binds a hash and signature to a document at issue, so its integrity and origin can be verified independently and any change is exposed. Learn how it works.",
  },
  {
    slug: "governance-certificate",
    term: "Governance Certificate",
    category: "Integrity & proof",
    kicker: "Proof",
    headline: "A governance certificate: the proof of how a record was authorised.",
    lead: "A governance certificate is the portable proof that a publication completed its approval chain — who authorised it, in what order, on which version.",
    definition:
      "A governance certificate is a verifiable attestation issued with a publication that records how it was authorised — the approving offices, the order of approval, and the exact version — so its governance can be proven without access to internal systems.",
    why: [
      "Knowing a document is unaltered is half the story; the other half is proving it was properly authorised in the first place.",
      "Approval that lived in email cannot travel with the document. When proof of authorisation is needed elsewhere, it has to be reassembled.",
      "A certificate that carries the governance with the publication turns 'it was approved, trust us' into something a third party can check.",
    ],
    how: [
      { t: "Records the approval chain", d: "The certificate captures which offices approved the publication, and in what order, bound to the exact version." },
      { t: "Travels with the record", d: "Governance proof is attached to the publication, so it can be shown wherever the document goes." },
      { t: "Independently verifiable", d: "Tied to the permanent Record ID, the certificate can be confirmed by anyone, with no account." },
    ],
    faqs: [
      { q: "What is a governance certificate?", a: "A verifiable attestation issued with a publication that records how it was authorised — the approving offices, the order, and the exact version." },
      { q: "How is it different from an integrity proof?", a: "An integrity proof shows a document is unaltered. A governance certificate shows it was properly authorised. Together they prove a publication is both genuine and legitimate." },
      { q: "Can a third party check a governance certificate?", a: "Yes — it is tied to the permanent Record ID and can be verified by anyone without internal access." },
    ],
    relatedIndustries: ["financial-institutions", "regulators", "government", "supreme-audit-institutions"],
    relatedProblems: ["evidence-chain", "policy-approval-workflow", "document-governance", "publication-audit"],
    diagram: "shield",
    metaTitle: "Governance Certificate — Portable Proof a Record Was Authorised",
    metaDescription: "A governance certificate records how a publication was authorised — the approving offices, the order and the exact version — so its governance can be proven by anyone, with no internal access.",
  },
  {
    slug: "publication-audit",
    term: "Publication Audit",
    category: "Operations & workflow",
    kicker: "Assurance",
    headline: "A publication audit that is retrieval, not reconstruction.",
    lead: "A publication audit examines how documents were approved and issued. When the evidence already exists, the audit is a search — not a scramble.",
    definition:
      "A publication audit is a review of how an institution's documents were approved, issued and preserved — verifying that each publication followed governance and can be proven genuine, ideally against evidence captured as the records were made.",
    why: [
      "Audits are expensive mostly because the proof is assembled after the fact — emails chased, sign-offs located, versions reconciled under deadline.",
      "Gaps discovered at audit time are the worst time to discover them, and reconstructed evidence invites doubt.",
      "When governance evidence is captured continuously, an audit becomes retrieval of records that already exist, in order, and sealed.",
    ],
    how: [
      { t: "Evidence already exists", d: "Approval chains and integrity proofs are recorded as publications are made, so there is nothing to reconstruct." },
      { t: "Complete and in order", d: "The governance trail is continuous and ordered, closing the gaps that audits usually surface." },
      { t: "Verifiable by the auditor", d: "An auditor can independently confirm each record is genuine and properly authorised, with no privileged access." },
    ],
    faqs: [
      { q: "What is a publication audit?", a: "A review of how documents were approved, issued and preserved — verifying each followed governance and can be proven genuine." },
      { q: "Why are publication audits so costly?", a: "Because proof is usually assembled after the fact. When evidence is captured as records are made, the audit is retrieval, not reconstruction." },
      { q: "How does continuous evidence reduce audit cost?", a: "It removes the scramble: the approval trail and integrity proofs already exist, complete and in order, ready to retrieve." },
    ],
    relatedIndustries: ["supreme-audit-institutions", "regulators", "financial-institutions", "healthcare"],
    relatedProblems: ["evidence-chain", "document-governance", "governance-certificate", "institutional-records"],
    diagram: "ledger",
    metaTitle: "Publication Audit — Make It Retrieval, Not Reconstruction",
    metaDescription: "A publication audit reviews how documents were approved and issued. When governance evidence is captured as records are made, the audit becomes retrieval, not a costly reconstruction.",
  },
  {
    slug: "policy-approval-workflow",
    term: "Policy Approval Workflow",
    category: "Operations & workflow",
    kicker: "Workflow",
    headline: "A policy approval workflow that proves the approval happened.",
    lead: "A policy approval workflow is the path a policy takes from draft to adoption. Done right, it does not just route the document — it proves how it was approved.",
    definition:
      "A policy approval workflow is the governed sequence by which a policy is drafted, reviewed and authorised before publication — defining who approves it, in what order, and producing a verifiable record that the approval occurred.",
    why: [
      "A policy released without provable approval is a liability: if it is later challenged, the institution cannot show it was properly authorised.",
      "Approvals captured in email and chat cannot prove order, completeness or that the approved text matches what was published.",
      "The workflow should end not in an approved file but in a record that proves the approval — durable, attributable, verifiable.",
    ],
    how: [
      { t: "Defined, enforced order", d: "Approvals run in a set sequence bound to named offices; steps cannot be skipped or back-dated." },
      { t: "Bound to the exact text", d: "Approval attaches to the precise version, so the published policy is provably the one that was authorised." },
      { t: "Proof, not just routing", d: "The workflow produces a verifiable governance record — evidence the approval happened, ready on demand." },
    ],
    faqs: [
      { q: "What is a policy approval workflow?", a: "The governed sequence by which a policy is drafted, reviewed and authorised before publication, producing a verifiable record that the approval occurred." },
      { q: "Why isn't an email approval enough?", a: "Email cannot reliably prove the order of approvals, their completeness, or that the approved text matches what was published." },
      { q: "What should a policy approval workflow produce?", a: "Not just an approved file, but a verifiable governance record proving how and by whom the policy was authorised." },
    ],
    relatedIndustries: ["government", "healthcare", "universities", "financial-institutions"],
    relatedProblems: ["document-governance", "governance-certificate", "board-resolution-software", "official-publication"],
    diagram: "workflow",
    metaTitle: "Policy Approval Workflow — Prove the Approval, Not Just the File",
    metaDescription: "A policy approval workflow governs how a policy is drafted, reviewed and authorised, producing a verifiable record that the approval occurred — not just an approved file.",
  },
];

export const problemBySlug = (slug?: string): Problem | undefined =>
  PROBLEMS.find((p) => p.slug === slug);

export const PROBLEM_CATEGORIES: string[] = PROBLEMS.reduce<string[]>((acc, p) => {
  if (!acc.includes(p.category)) acc.push(p.category);
  return acc;
}, []);
