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
    relatedProblems: ["document-governance", "document-authenticity", "governance-certificate", "document-verification", "policy-document", "standard-operating-procedure"],
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
    relatedProblems: ["policy-approval-workflow", "official-publication", "publication-audit", "evidence-chain", "policy-document", "directive"],
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
    relatedProblems: ["policy-approval-workflow", "governance-certificate", "document-authenticity", "institutional-records", "gazetting-process"],
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
    relatedProblems: ["official-publication", "policy-approval-workflow", "regulatory-publication", "evidence-chain", "gazetting-process"],
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
    relatedProblems: ["official-publication", "document-verification", "evidence-chain", "publication-audit", "policy-document", "directive"],
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
    relatedProblems: ["document-authenticity", "official-publication", "evidence-chain", "institutional-records", "standard-operating-procedure", "directive"],
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
    relatedProblems: ["document-verification", "tamper-proof-publication", "cryptographic-sealing", "official-publication", "framework-document"],
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
    relatedProblems: ["digital-preservation", "official-publication", "document-governance", "evidence-chain", "standard-operating-procedure", "circular-letter"],
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
    relatedProblems: ["document-authenticity", "tamper-proof-publication", "official-publication", "cryptographic-sealing", "issuer-identity-verification", "source-verification"],
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
    relatedProblems: ["evidence-chain", "policy-approval-workflow", "document-governance", "publication-audit", "certificate-validation"],
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
    relatedProblems: ["evidence-chain", "document-governance", "governance-certificate", "institutional-records", "gazetting-process"],
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
  {
    "slug": "digital-signature",
    "term": "Digital Signature",
    "category": "Signatures & cryptography",
    "kicker": "Cryptographic execution",
    "headline": "Bind authorship and integrity into every signed record",
    "lead": "A digital signature ties a specific signer to an exact document state using public-key cryptography. Any later change to the bytes breaks the signature, making alteration evident.",
    "definition": "A digital signature is a cryptographic mechanism that uses a private key to bind a signer's identity to the exact contents of a document, so that any later modification is mathematically detectable.",
    "why": [
      "Without cryptographic binding, a signed PDF can be edited after approval and no one can prove which version was actually executed.",
      "Digital signatures let an institution demonstrate, years later, both who signed and that the bytes are unchanged since signing.",
      "Regulators and courts increasingly expect verifiable signing evidence rather than a scanned image of a name."
    ],
    "how": [
      {
        "t": "Key-based signing",
        "d": "Sovereign Dispatch applies a private-key signature over the canonical document content so the signer and the exact bytes are cryptographically linked."
      },
      {
        "t": "Independent verification",
        "d": "Every signed record carries a public verification path, letting any recipient confirm the signature without trusting our infrastructure."
      },
      {
        "t": "Tamper-evident archival",
        "d": "Signed artifacts are preserved with their signature intact, so a future reviewer can detect any change to the executed version."
      }
    ],
    "faqs": [
      {
        "q": "What is a digital signature?",
        "a": "A digital signature is a cryptographic mechanism that uses a private key to bind a signer's identity to the exact contents of a document, so any later modification is mathematically detectable."
      },
      {
        "q": "Is a digital signature the same as an electronic signature?",
        "a": "No. An electronic signature is any electronic indication of intent to sign, while a digital signature specifically uses cryptography to bind identity and content."
      },
      {
        "q": "Can a digital signature be forged?",
        "a": "Forging one requires the signer's private key. When keys are properly protected, a valid signature is strong evidence of authorship and integrity."
      }
    ],
    "relatedIndustries": [
      "government",
      "justice",
      "financial-institutions",
      "regulators"
    ],
    "relatedProblems": [
      "electronic-signature",
      "signature-verification",
      "cryptographic-sealing",
      "document-authenticity", "wet-signature"],
    "diagram": "seal",
    "metaTitle": "Digital Signature | Sovereign Dispatch",
    "metaDescription": "A digital signature cryptographically binds a signer to exact document contents, making any later change tamper-evident and independently verifiable."
  },
  {
    "slug": "electronic-signature",
    "term": "Electronic Signature",
    "category": "Signatures & cryptography",
    "kicker": "Intent to sign",
    "headline": "Capture binding intent without losing the evidence trail",
    "lead": "An electronic signature records a signer's intent in electronic form. Its evidential strength depends on how identity, consent and the document state are captured around it.",
    "definition": "An electronic signature is any electronic data, symbol, or process attached to or logically associated with a record that a person adopts with the intent to sign that record.",
    "why": [
      "Many electronic signatures are just typed names or clicks, with little evidence tying them to a verified person or a fixed document version.",
      "Institutions need the surrounding audit context, not only the mark, to defend a signature if it is later challenged.",
      "Weak electronic signing creates disputes about whether a party actually agreed and to exactly what."
    ],
    "how": [
      {
        "t": "Captured intent and consent",
        "d": "Sovereign Dispatch records the act of signing alongside the version signed, preserving the context that gives the signature meaning."
      },
      {
        "t": "Identity context",
        "d": "Signing events are linked to authenticated identities where required, strengthening the evidential weight of each mark."
      },
      {
        "t": "Locked document state",
        "d": "The exact content presented at signing is sealed, so it is clear what the signer actually adopted."
      }
    ],
    "faqs": [
      {
        "q": "What is an electronic signature?",
        "a": "An electronic signature is any electronic data, symbol, or process logically associated with a record that a person adopts with the intent to sign that record."
      },
      {
        "q": "Are electronic signatures legally valid?",
        "a": "In many jurisdictions they are, but validity depends on consent, identity evidence, and a reliable record of what was signed."
      },
      {
        "q": "How is it different from a digital signature?",
        "a": "An electronic signature captures intent in any electronic form, while a digital signature adds cryptographic binding of identity to content."
      }
    ],
    "relatedIndustries": [
      "government",
      "financial-institutions",
      "insurance",
      "municipalities"
    ],
    "relatedProblems": [
      "digital-signature",
      "advanced-electronic-signature",
      "signature-audit-trail",
      "document-verification", "wet-signature", "electronic-seal"],
    "diagram": "workflow",
    "metaTitle": "Electronic Signature | Sovereign Dispatch",
    "metaDescription": "An electronic signature records a signer's intent in electronic form; its strength depends on identity, consent, and a locked record of what was signed."
  },
  {
    "slug": "wet-signature",
    "term": "Wet Signature",
    "category": "Signatures & cryptography",
    "kicker": "Ink to evidence",
    "headline": "Preserve ink-signed originals as verifiable digital records",
    "lead": "A wet signature is a handwritten mark made in ink on a physical document. Carrying its authority into digital systems requires faithful capture and tamper-evident sealing.",
    "definition": "A wet signature is a handwritten signature physically applied in ink to a paper document, traditionally used as the primary evidence of a signer's assent.",
    "why": [
      "Many institutions still require ink originals for certain instruments, creating a gap between paper authority and digital workflows.",
      "A scanned wet signature alone proves little if the surrounding document can be altered after scanning.",
      "Lost or degraded paper originals can leave an organization unable to evidence a prior commitment."
    ],
    "how": [
      {
        "t": "Faithful digital capture",
        "d": "Sovereign Dispatch ingests scanned wet-signed originals and binds them to a fixed, sealed digital record."
      },
      {
        "t": "Tamper-evident custody",
        "d": "Once captured, the digitized original is sealed so any later alteration of the image or surrounding content is detectable."
      },
      {
        "t": "Chain to the source",
        "d": "Metadata links the digital record to its physical provenance, supporting later audit of where the ink original resides."
      }
    ],
    "faqs": [
      {
        "q": "What is a wet signature?",
        "a": "A wet signature is a handwritten signature physically applied in ink to a paper document, traditionally used as the primary evidence of a signer's assent."
      },
      {
        "q": "Is a wet signature still required anywhere?",
        "a": "Yes. Certain deeds, notarial acts, and regulated instruments still mandate ink originals in some jurisdictions."
      },
      {
        "q": "How do you digitize a wet signature safely?",
        "a": "Capture the signed original faithfully and seal it so the image and surrounding content become tamper-evident and verifiable."
      }
    ],
    "relatedIndustries": [
      "notarial-authorities",
      "land-registries",
      "justice",
      "archives"
    ],
    "relatedProblems": [
      "digital-signature",
      "document-authenticity",
      "digital-preservation"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Wet Signature | Sovereign Dispatch",
    "metaDescription": "A wet signature is a handwritten ink mark on paper. Learn how to carry its authority into tamper-evident, verifiable digital records."
  },
  {
    "slug": "qualified-electronic-signature",
    "term": "Qualified Electronic Signature",
    "category": "Signatures & cryptography",
    "kicker": "Highest assurance tier",
    "headline": "Reach the highest assurance tier for signed instruments",
    "lead": "A qualified electronic signature is the most stringent signature class under frameworks such as eIDAS, backed by a qualified certificate and a secure signature-creation device.",
    "definition": "A qualified electronic signature is an advanced electronic signature created by a qualified signature-creation device and based on a qualified certificate issued by a trusted provider, carrying the highest legal assurance in aligned frameworks.",
    "why": [
      "High-stakes cross-border instruments often demand the strongest signature class to be recognized without further proof.",
      "Lower-assurance signatures may be challenged precisely where the consequences are greatest.",
      "Institutions need to know which signing tier each instrument requires before execution, not after a dispute."
    ],
    "how": [
      {
        "t": "Tier-aware signing",
        "d": "Sovereign Dispatch structures workflows so instruments requiring qualified signatures route through the appropriate certificate and device path."
      },
      {
        "t": "Certificate provenance",
        "d": "Qualified-certificate signatures are preserved with their validation context so the assurance tier remains evidenceable later."
      },
      {
        "t": "Alignment, not certification",
        "d": "We support workflows aligned to qualified-signature requirements while leaving certification to accredited trust providers."
      }
    ],
    "faqs": [
      {
        "q": "What is a qualified electronic signature?",
        "a": "It is an advanced electronic signature created by a qualified signature-creation device and based on a qualified certificate, carrying the highest legal assurance in aligned frameworks."
      },
      {
        "q": "When is a qualified electronic signature required?",
        "a": "Typically for high-value or cross-border instruments where a framework demands the strongest, automatically recognized signature class."
      },
      {
        "q": "How does it differ from an advanced electronic signature?",
        "a": "A qualified signature adds a qualified certificate and a secure signature-creation device, raising assurance above an advanced signature."
      }
    ],
    "relatedIndustries": [
      "government",
      "financial-institutions",
      "central-banks",
      "foreign-affairs"
    ],
    "relatedProblems": [
      "advanced-electronic-signature",
      "digital-signing-certificate",
      "digital-signature",
      "signature-verification", "wet-signature", "electronic-seal"],
    "diagram": "shield",
    "metaTitle": "Qualified Electronic Signature | Sovereign Dispatch",
    "metaDescription": "A qualified electronic signature is the highest-assurance class, backed by a qualified certificate and secure device for the most sensitive instruments."
  },
  {
    "slug": "advanced-electronic-signature",
    "term": "Advanced Electronic Signature",
    "category": "Signatures & cryptography",
    "kicker": "Linked to the signer",
    "headline": "Tie each signature uniquely and detectably to its signer",
    "lead": "An advanced electronic signature is uniquely linked to its signer, capable of identifying them, and able to reveal any change to the signed data.",
    "definition": "An advanced electronic signature is an electronic signature that is uniquely linked to and capable of identifying the signer, created under their sole control, and linked to the data such that any later change is detectable.",
    "why": [
      "Basic electronic signatures rarely satisfy the linkage and tamper-detection requirements needed for regulated commitments.",
      "Institutions need signatures that can identify the signer, not merely record that someone clicked.",
      "When a signature must withstand scrutiny, the ability to detect post-signing changes is essential."
    ],
    "how": [
      {
        "t": "Signer-bound execution",
        "d": "Sovereign Dispatch links each signature to an identified signer under their control, satisfying the core advanced-signature criteria."
      },
      {
        "t": "Change detection",
        "d": "Signed data is bound so any later alteration of the document is revealed during verification."
      },
      {
        "t": "Evidence-grade records",
        "d": "Signature metadata is preserved so the linkage and integrity properties can be demonstrated long after signing."
      }
    ],
    "faqs": [
      {
        "q": "What is an advanced electronic signature?",
        "a": "It is an electronic signature uniquely linked to and capable of identifying the signer, under their sole control, and linked to the data so any later change is detectable."
      },
      {
        "q": "Is an advanced electronic signature legally stronger than a basic one?",
        "a": "Generally yes, because its linkage, identification, and tamper-detection properties give it greater evidential weight."
      },
      {
        "q": "Does it require a qualified certificate?",
        "a": "No. A qualified certificate and secure device elevate it to a qualified electronic signature, the next tier up."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "financial-institutions",
      "justice",
      "government"
    ],
    "relatedProblems": [
      "qualified-electronic-signature",
      "electronic-signature",
      "digital-signature",
      "signature-verification", "electronic-seal"],
    "diagram": "shield",
    "metaTitle": "Advanced Electronic Signature | Sovereign Dispatch",
    "metaDescription": "An advanced electronic signature is uniquely linked to its signer and reveals any post-signing change, giving regulated commitments stronger evidential weight."
  },
  {
    "slug": "electronic-seal",
    "term": "Electronic Seal",
    "category": "Signatures & cryptography",
    "kicker": "Organizational signing",
    "headline": "Assert organizational origin and integrity on every issued document",
    "lead": "An electronic seal binds a document to the issuing organization rather than an individual, asserting origin and integrity for institutional records and publications.",
    "definition": "An electronic seal (e-seal) is a cryptographic mark applied by a legal entity rather than a person, attesting to the origin and integrity of a document on behalf of the organization.",
    "why": [
      "Many institutional documents are issued by the organization itself, where an individual's signature is the wrong evidentiary unit.",
      "Without an organizational seal, recipients cannot reliably confirm that a record genuinely originated from the issuing body.",
      "Bulk-issued records such as certificates and statements need scalable, entity-level attestation."
    ],
    "how": [
      {
        "t": "Entity-level sealing",
        "d": "Sovereign Dispatch applies organizational e-seals so issued documents carry verifiable institutional origin."
      },
      {
        "t": "Integrity attestation",
        "d": "The seal binds to exact content, making any post-issuance change detectable by any recipient."
      },
      {
        "t": "Scalable issuance",
        "d": "Seals can be applied across high-volume publication runs while preserving per-document verifiability."
      }
    ],
    "faqs": [
      {
        "q": "What is an electronic seal?",
        "a": "An electronic seal is a cryptographic mark applied by a legal entity rather than a person, attesting to the origin and integrity of a document on behalf of the organization."
      },
      {
        "q": "How does an e-seal differ from a signature?",
        "a": "A signature attests to a person's intent, while an e-seal attests to a document's origin from an organization."
      },
      {
        "q": "When should an organization use an e-seal?",
        "a": "For documents issued by the institution itself, such as certificates, official notices, and bulk statements."
      }
    ],
    "relatedIndustries": [
      "government",
      "central-banks",
      "national-statistics",
      "civil-registration"
    ],
    "relatedProblems": [
      "cryptographic-sealing",
      "digital-signature",
      "official-publication",
      "document-authenticity"
    ],
    "diagram": "seal",
    "metaTitle": "Electronic Seal (e-Seal) | Sovereign Dispatch",
    "metaDescription": "An electronic seal binds a document to its issuing organization, attesting origin and integrity for institutional records and high-volume publications."
  },
  {
    "slug": "signature-verification",
    "term": "Signature Verification",
    "category": "Signatures & cryptography",
    "kicker": "Proof on demand",
    "headline": "Let anyone confirm a signature without trusting the issuer",
    "lead": "Signature verification is the process of confirming that a signature is valid, that it matches the document, and that the content is unchanged since signing.",
    "definition": "Signature verification is the process of cryptographically confirming that a signature is authentic, corresponds to the signed document, and that the document's contents have not changed since it was signed.",
    "why": [
      "A signature is only as useful as a recipient's ability to independently confirm it is genuine and intact.",
      "If verification depends on trusting one vendor's word, the signature loses much of its evidential value.",
      "Disputes often turn on whether a presented document is the exact version that was signed."
    ],
    "how": [
      {
        "t": "Open verification path",
        "d": "Sovereign Dispatch provides a verification route that confirms signature and content integrity without requiring trust in our systems."
      },
      {
        "t": "Version-exact matching",
        "d": "Verification confirms the presented bytes match what was signed, surfacing any alteration."
      },
      {
        "t": "Durable validation context",
        "d": "Validation evidence is preserved so a signature can still be checked long after execution."
      }
    ],
    "faqs": [
      {
        "q": "What is signature verification?",
        "a": "Signature verification is the process of cryptographically confirming that a signature is authentic, corresponds to the signed document, and that its contents are unchanged since signing."
      },
      {
        "q": "Who can verify a signature?",
        "a": "With an open verification path, any recipient can confirm validity and integrity independently of the issuer."
      },
      {
        "q": "What does a failed verification mean?",
        "a": "It usually means the document was altered after signing or the signature does not match, both of which warrant investigation."
      }
    ],
    "relatedIndustries": [
      "justice",
      "regulators",
      "financial-institutions",
      "law-enforcement"
    ],
    "relatedProblems": [
      "digital-signature",
      "document-verification",
      "signature-timestamp",
      "tamper-proof-publication", "issuer-identity-verification", "instant-verification"],
    "diagram": "shield",
    "metaTitle": "Signature Verification | Sovereign Dispatch",
    "metaDescription": "Signature verification confirms a signature is authentic, matches the document, and that contents are unchanged since signing, independently of the issuer."
  },
  {
    "slug": "counter-signature",
    "term": "Counter-Signature",
    "category": "Signatures & cryptography",
    "kicker": "Secondary endorsement",
    "headline": "Layer a second authority over an already-signed record",
    "lead": "A counter-signature is a second signature added to confirm, witness, or endorse a document already signed by another party, often signing over the first signature itself.",
    "definition": "A counter-signature is a signature applied after an initial signature to endorse, witness, or confirm it, typically binding over both the document and the original signature.",
    "why": [
      "Many institutional approvals require a second authority to ratify an instrument already signed by a primary party.",
      "If the counter-signature does not bind over the first signature, the relationship between the two can be disputed.",
      "Ordered endorsement is central to delegated authority and dual-control governance."
    ],
    "how": [
      {
        "t": "Signature-over-signature",
        "d": "Sovereign Dispatch lets a counter-signature bind over both the document and the prior signature, preserving the endorsement relationship."
      },
      {
        "t": "Ordered execution",
        "d": "Workflows enforce that the counter-signature follows the primary signature, reflecting the intended authority structure."
      },
      {
        "t": "Auditable endorsement",
        "d": "Each layer is recorded so reviewers can see who signed first and who counter-signed."
      }
    ],
    "faqs": [
      {
        "q": "What is a counter-signature?",
        "a": "A counter-signature is a signature applied after an initial signature to endorse, witness, or confirm it, typically binding over both the document and the original signature."
      },
      {
        "q": "Why use a counter-signature?",
        "a": "To have a second authority ratify or witness an instrument already signed, reinforcing dual-control governance."
      },
      {
        "q": "Does a counter-signature change the original document?",
        "a": "It adds an endorsing layer without altering the signed content, and binds over the first signature to preserve the relationship."
      }
    ],
    "relatedIndustries": [
      "government",
      "justice",
      "financial-institutions",
      "notarial-authorities"
    ],
    "relatedProblems": [
      "witnessed-signature",
      "multi-party-signing",
      "signature-authority",
      "signing-order"
    ],
    "diagram": "chain",
    "metaTitle": "Counter-Signature | Sovereign Dispatch",
    "metaDescription": "A counter-signature endorses or witnesses an already-signed document, binding over the original signature to preserve dual-control authority."
  },
  {
    "slug": "witnessed-signature",
    "term": "Witnessed Signature",
    "category": "Signatures & cryptography",
    "kicker": "Attested execution",
    "headline": "Record an independent witness to every signing event",
    "lead": "A witnessed signature is a signature attested by an independent party who confirms the signing took place, adding evidential weight for instruments that require it.",
    "definition": "A witnessed signature is a signature whose execution is observed and attested by an independent witness, who records that the signer signed the document as their own act.",
    "why": [
      "Certain deeds and instruments are only valid when execution is witnessed by an independent party.",
      "Without a recorded witness, the circumstances of signing can later be contested.",
      "Remote and digital execution make it harder to capture credible, durable witness evidence."
    ],
    "how": [
      {
        "t": "Witness attestation capture",
        "d": "Sovereign Dispatch records the witness's confirmation alongside the signer's act, binding both to the same document version."
      },
      {
        "t": "Linked identities",
        "d": "Signer and witness identities are associated with the signing event to support later scrutiny."
      },
      {
        "t": "Sealed event record",
        "d": "The witnessed execution is sealed so the attestation cannot be silently detached or altered."
      }
    ],
    "faqs": [
      {
        "q": "What is a witnessed signature?",
        "a": "A witnessed signature is a signature whose execution is observed and attested by an independent witness, who records that the signer signed the document as their own act."
      },
      {
        "q": "When is a witness required?",
        "a": "Often for deeds, wills, and certain regulated instruments where law mandates independent attestation of signing."
      },
      {
        "q": "Can a signature be witnessed remotely?",
        "a": "Depending on jurisdiction, yes, provided the witness can credibly observe the act and the attestation is reliably recorded."
      }
    ],
    "relatedIndustries": [
      "notarial-authorities",
      "justice",
      "land-registries",
      "government"
    ],
    "relatedProblems": [
      "counter-signature",
      "signing-ceremony",
      "remote-signing",
      "signature-audit-trail"
    ],
    "diagram": "workflow",
    "metaTitle": "Witnessed Signature | Sovereign Dispatch",
    "metaDescription": "A witnessed signature is attested by an independent party who confirms the signing took place, adding evidential weight to instruments that require it."
  },
  {
    "slug": "signing-ceremony",
    "term": "Signing Ceremony",
    "category": "Signatures & cryptography",
    "kicker": "Controlled execution",
    "headline": "Govern high-stakes execution as a controlled, recorded event",
    "lead": "A signing ceremony is a deliberate, controlled procedure for executing a high-stakes document, where each step, participant, and approval is recorded.",
    "definition": "A signing ceremony is a formally structured process for executing an important document in which the sequence of signers, controls, and attestations is followed and recorded as a single auditable event.",
    "why": [
      "For consequential instruments, ad hoc signing leaves gaps about who participated and in what order.",
      "A recorded ceremony provides defensible evidence that required controls and approvals were observed.",
      "Distributed and remote participants make disciplined, captured execution harder to achieve."
    ],
    "how": [
      {
        "t": "Structured execution flow",
        "d": "Sovereign Dispatch sequences participants and controls so the ceremony proceeds in the intended order."
      },
      {
        "t": "Recorded participation",
        "d": "Each signer, approver, and witness action is captured as part of one auditable ceremony record."
      },
      {
        "t": "Sealed outcome",
        "d": "The completed ceremony and its executed document are sealed together, preserving the full execution context."
      }
    ],
    "faqs": [
      {
        "q": "What is a signing ceremony?",
        "a": "A signing ceremony is a formally structured process for executing an important document in which the sequence of signers, controls, and attestations is followed and recorded as a single auditable event."
      },
      {
        "q": "When is a signing ceremony used?",
        "a": "For high-stakes instruments such as treaties, major contracts, and board-level resolutions where controlled, recorded execution matters."
      },
      {
        "q": "Can a signing ceremony be conducted remotely?",
        "a": "Yes, provided participation, order, and attestations are reliably captured for each remote participant."
      }
    ],
    "relatedIndustries": [
      "foreign-affairs",
      "parliaments",
      "central-banks",
      "government"
    ],
    "relatedProblems": [
      "signing-order",
      "multi-party-signing",
      "witnessed-signature",
      "signature-workflow"
    ],
    "diagram": "workflow",
    "metaTitle": "Signing Ceremony | Sovereign Dispatch",
    "metaDescription": "A signing ceremony executes a high-stakes document as a controlled, recorded event, capturing each signer, control, and attestation in one auditable record."
  },
  {
    "slug": "signature-authority",
    "term": "Signature Authority",
    "category": "Signatures & cryptography",
    "kicker": "Authorized to bind",
    "headline": "Prove the signer was actually authorized to commit",
    "lead": "Signature authority is the formal power a person holds to sign and bind an organization. A valid signature from an unauthorized signer can still be void.",
    "definition": "Signature authority is the documented power granted to an individual to execute documents that legally bind an organization, defining who may sign what and within which limits.",
    "why": [
      "A technically perfect signature is worthless if the signer lacked authority to commit the organization.",
      "Without enforced authority limits, individuals can bind an institution beyond their mandate.",
      "Auditors and counterparties increasingly ask for proof that a signer was authorized, not just that they signed."
    ],
    "how": [
      {
        "t": "Authority-aware routing",
        "d": "Sovereign Dispatch routes documents to signers whose mandate matches the instrument, enforcing who may sign what."
      },
      {
        "t": "Recorded mandate context",
        "d": "Each signature is associated with the authority under which it was made, supporting later validation."
      },
      {
        "t": "Limit enforcement",
        "d": "Workflows can reflect approval thresholds so signing stays within delegated limits."
      }
    ],
    "faqs": [
      {
        "q": "What is signature authority?",
        "a": "Signature authority is the documented power granted to an individual to execute documents that legally bind an organization, defining who may sign what and within which limits."
      },
      {
        "q": "Why does signature authority matter?",
        "a": "Because a signature from an unauthorized person may not bind the organization, even if the signature itself is valid."
      },
      {
        "q": "How is signature authority enforced?",
        "a": "By routing instruments only to mandated signers and recording the authority under which each signature was made."
      }
    ],
    "relatedIndustries": [
      "government",
      "financial-institutions",
      "municipalities",
      "regulators"
    ],
    "relatedProblems": [
      "signature-block",
      "policy-approval-workflow",
      "multi-party-signing",
      "signature-workflow"
    ],
    "diagram": "ledger",
    "metaTitle": "Signature Authority | Sovereign Dispatch",
    "metaDescription": "Signature authority is the formal power to sign and bind an organization. Learn how to prove a signer was actually authorized to commit."
  },
  {
    "slug": "signature-block",
    "term": "Signature Block",
    "category": "Signatures & cryptography",
    "kicker": "Structured execution area",
    "headline": "Make every signature block carry verifiable signer context",
    "lead": "A signature block is the structured area of a document that captures each signer's name, role, and the act of signing, anchoring execution to the right parties.",
    "definition": "A signature block is the designated section of a document that records each signer's identity, role, and signing details, structuring where and how execution occurs.",
    "why": [
      "Ambiguous or inconsistent signature blocks create confusion about who signed in what capacity.",
      "A signature detached from clear role and identity context is harder to rely on later.",
      "Multi-party instruments need well-defined blocks so each party's commitment is unambiguous."
    ],
    "how": [
      {
        "t": "Structured signer fields",
        "d": "Sovereign Dispatch defines clear signature blocks capturing name, role, and capacity for each party."
      },
      {
        "t": "Bound to execution",
        "d": "Each block is tied to the actual signing event so the recorded role matches who signed."
      },
      {
        "t": "Consistent layout",
        "d": "Standardized blocks reduce ambiguity across instruments and signing parties."
      }
    ],
    "faqs": [
      {
        "q": "What is a signature block?",
        "a": "A signature block is the designated section of a document that records each signer's identity, role, and signing details, structuring where and how execution occurs."
      },
      {
        "q": "What should a signature block contain?",
        "a": "Typically the signer's name, title or role, the capacity in which they sign, and the place for the signature itself."
      },
      {
        "q": "Why does the signature block matter?",
        "a": "It ties each signature to a clear identity and role, making the commitment unambiguous and easier to rely on."
      }
    ],
    "relatedIndustries": [
      "government",
      "justice",
      "financial-institutions",
      "professional-bodies"
    ],
    "relatedProblems": [
      "signature-authority",
      "multi-party-signing",
      "signature-workflow",
      "document-governance"
    ],
    "diagram": "workflow",
    "metaTitle": "Signature Block | Sovereign Dispatch",
    "metaDescription": "A signature block structures each signer's name, role, and capacity, anchoring execution to the right parties and reducing ambiguity over who signed."
  },
  {
    "slug": "remote-signing",
    "term": "Remote Signing",
    "category": "Signatures & cryptography",
    "kicker": "Execution at a distance",
    "headline": "Execute binding documents across distance without losing rigor",
    "lead": "Remote signing lets parties execute a document from different locations while preserving identity, intent, and integrity evidence for each signer.",
    "definition": "Remote signing is the execution of a document by signers in different physical locations, typically over a network, while still capturing identity, intent, and document integrity.",
    "why": [
      "Distributed institutions and counterparties cannot always sign in the same room, yet still need defensible execution.",
      "Remote execution can weaken evidence if identity and document state are not rigorously captured.",
      "Geography should not force a trade-off between convenience and evidential strength."
    ],
    "how": [
      {
        "t": "Distance-tolerant capture",
        "d": "Sovereign Dispatch captures each remote signer's identity context and intent against the same sealed document version."
      },
      {
        "t": "Synchronized document state",
        "d": "All parties sign the identical, locked content, so distance does not introduce version drift."
      },
      {
        "t": "Preserved evidence",
        "d": "The execution record is sealed across all locations, keeping the signing defensible regardless of where parties were."
      }
    ],
    "faqs": [
      {
        "q": "What is remote signing?",
        "a": "Remote signing is the execution of a document by signers in different physical locations, typically over a network, while still capturing identity, intent, and document integrity."
      },
      {
        "q": "Is remote signing as reliable as in-person signing?",
        "a": "It can be, provided identity, intent, and the exact signed version are rigorously captured for each remote party."
      },
      {
        "q": "What is the main risk of remote signing?",
        "a": "Weak identity assurance or version drift, both of which strong capture and a locked document state mitigate."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "foreign-affairs",
      "government",
      "insurance"
    ],
    "relatedProblems": [
      "signing-ceremony",
      "multi-party-signing",
      "witnessed-signature",
      "signature-workflow"
    ],
    "diagram": "workflow",
    "metaTitle": "Remote Signing | Sovereign Dispatch",
    "metaDescription": "Remote signing executes binding documents across distance while preserving identity, intent, and integrity evidence for every signer."
  },
  {
    "slug": "digital-signing-certificate",
    "term": "Digital Signing Certificate",
    "category": "Signatures & cryptography",
    "kicker": "Identity behind the key",
    "headline": "Anchor every signature to a verifiable identity certificate",
    "lead": "A digital signing certificate binds a signer's public key to their verified identity, letting recipients trust who actually produced a signature.",
    "definition": "A digital signing certificate is an electronic credential issued by a certificate authority that binds a signer's public key to their verified identity, enabling trust in signatures made with the corresponding private key.",
    "why": [
      "A signature is only meaningful if recipients can connect the signing key to a real, verified identity.",
      "Expired or revoked certificates can undermine a signature's validity if not tracked.",
      "The trust chain behind a certificate determines how far a signature can be relied upon."
    ],
    "how": [
      {
        "t": "Certificate-backed signing",
        "d": "Sovereign Dispatch ties signatures to signing certificates so the identity behind each key is verifiable."
      },
      {
        "t": "Validity context preserved",
        "d": "Certificate status at signing time is retained, supporting later checks against expiry or revocation."
      },
      {
        "t": "Trust-chain visibility",
        "d": "Verification surfaces the certificate chain so recipients can assess the basis for trust."
      }
    ],
    "faqs": [
      {
        "q": "What is a digital signing certificate?",
        "a": "It is an electronic credential issued by a certificate authority that binds a signer's public key to their verified identity, enabling trust in signatures made with the corresponding private key."
      },
      {
        "q": "Who issues digital signing certificates?",
        "a": "Certificate authorities, which verify the signer's identity before issuing the credential."
      },
      {
        "q": "What happens if a signing certificate is revoked?",
        "a": "Signatures may need to be evaluated against their status at signing time, which is why validity context is preserved."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "government",
      "regulators",
      "central-banks"
    ],
    "relatedProblems": [
      "digital-signature",
      "qualified-electronic-signature",
      "signature-verification",
      "cryptographic-sealing", "certificate-validation"],
    "diagram": "shield",
    "metaTitle": "Digital Signing Certificate | Sovereign Dispatch",
    "metaDescription": "A digital signing certificate binds a signer's public key to their verified identity, letting recipients trust who actually produced a signature."
  },
  {
    "slug": "signature-workflow",
    "term": "Signature Workflow",
    "category": "Signatures & cryptography",
    "kicker": "Execution by design",
    "headline": "Turn signing into a governed, repeatable institutional process",
    "lead": "A signature workflow defines the steps, roles, and order by which a document moves from drafting to fully executed, with controls at each stage.",
    "definition": "A signature workflow is the defined sequence of preparation, routing, signing, and finalization steps a document passes through to reach full execution, including the roles and approvals at each stage.",
    "why": [
      "Unstructured signing leads to missed approvals, wrong signers, and instruments executed out of order.",
      "Institutions need execution to be repeatable and auditable, not dependent on individual memory.",
      "A defined workflow makes it clear at any moment where a document stands and what remains."
    ],
    "how": [
      {
        "t": "Defined routing steps",
        "d": "Sovereign Dispatch encodes the preparation, signing, and finalization steps so each document follows the intended path."
      },
      {
        "t": "Role-based stages",
        "d": "Each stage is assigned to the right role, so the correct parties act at the correct time."
      },
      {
        "t": "Auditable progression",
        "d": "Workflow status and each transition are recorded, making execution traceable end to end."
      }
    ],
    "faqs": [
      {
        "q": "What is a signature workflow?",
        "a": "A signature workflow is the defined sequence of preparation, routing, signing, and finalization steps a document passes through to reach full execution, including the roles and approvals at each stage."
      },
      {
        "q": "Why use a signature workflow?",
        "a": "To make execution repeatable and auditable, reducing missed approvals and out-of-order signing."
      },
      {
        "q": "How is a signature workflow different from signing order?",
        "a": "Signing order is one part of a workflow; the workflow also covers preparation, routing, approvals, and finalization."
      }
    ],
    "relatedIndustries": [
      "government",
      "municipalities",
      "financial-institutions",
      "regulators"
    ],
    "relatedProblems": [
      "signing-order",
      "multi-party-signing",
      "policy-approval-workflow",
      "signature-authority"
    ],
    "diagram": "workflow",
    "metaTitle": "Signature Workflow | Sovereign Dispatch",
    "metaDescription": "A signature workflow defines the steps, roles, and order that move a document from draft to fully executed, with controls and audit at each stage."
  },
  {
    "slug": "multi-party-signing",
    "term": "Multi-Party Signing",
    "category": "Signatures & cryptography",
    "kicker": "Many signers, one record",
    "headline": "Coordinate many signers around one authoritative document",
    "lead": "Multi-party signing coordinates several signers on a single instrument, ensuring each signs the same version and that all required parties have executed.",
    "definition": "Multi-party signing is the execution of one document by multiple signers, where each party signs the same authoritative version and completion requires all required signatures.",
    "why": [
      "Agreements with many parties risk people signing different drafts or versions diverging mid-process.",
      "Institutions need certainty that every required party has executed before an instrument takes effect.",
      "Coordinating signers across organizations multiplies the chance of error without strong controls."
    ],
    "how": [
      {
        "t": "Single authoritative version",
        "d": "Sovereign Dispatch ensures all parties sign the same sealed document, preventing version divergence."
      },
      {
        "t": "Completion tracking",
        "d": "The platform tracks which required signatures are present and when the instrument is fully executed."
      },
      {
        "t": "Cross-party coordination",
        "d": "Signers across organizations are coordinated around one record with a clear, auditable status."
      }
    ],
    "faqs": [
      {
        "q": "What is multi-party signing?",
        "a": "Multi-party signing is the execution of one document by multiple signers, where each party signs the same authoritative version and completion requires all required signatures."
      },
      {
        "q": "How does multi-party signing prevent version conflicts?",
        "a": "By having every party sign one sealed, authoritative version rather than separate copies that can diverge."
      },
      {
        "q": "When is an instrument considered fully executed?",
        "a": "When all required signatures are present on the same version, which the workflow tracks explicitly."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "foreign-affairs",
      "government",
      "chambers-of-commerce"
    ],
    "relatedProblems": [
      "signing-order",
      "signature-workflow",
      "counter-signature",
      "signing-ceremony"
    ],
    "diagram": "chain",
    "metaTitle": "Multi-Party Signing | Sovereign Dispatch",
    "metaDescription": "Multi-party signing coordinates many signers on one authoritative document, ensuring each signs the same version and all required parties have executed."
  },
  {
    "slug": "signature-timestamp",
    "term": "Signature Timestamp",
    "category": "Signatures & cryptography",
    "kicker": "Proof of when",
    "headline": "Prove not just who signed, but exactly when",
    "lead": "A signature timestamp is trusted evidence of the moment a signature was applied, binding the act of signing to a verifiable point in time.",
    "definition": "A signature timestamp is a cryptographically asserted record of the time at which a signature was applied, providing tamper-evident proof of when the document was executed.",
    "why": [
      "Knowing who signed is incomplete without reliable proof of when they signed.",
      "Timing can be decisive for deadlines, priority, and whether a certificate was valid at signing.",
      "Self-reported clocks are easy to dispute, so independent timestamp evidence matters."
    ],
    "how": [
      {
        "t": "Trusted time binding",
        "d": "Sovereign Dispatch binds a verifiable timestamp to each signature, anchoring when execution occurred."
      },
      {
        "t": "Tamper-evident timing",
        "d": "The timestamp is sealed with the signature so the recorded time cannot be silently altered."
      },
      {
        "t": "Validity-at-signing context",
        "d": "Timestamps support later checks of whether certificates and authority were valid at the moment of signing."
      }
    ],
    "faqs": [
      {
        "q": "What is a signature timestamp?",
        "a": "A signature timestamp is a cryptographically asserted record of the time at which a signature was applied, providing tamper-evident proof of when the document was executed."
      },
      {
        "q": "Why is a signature timestamp important?",
        "a": "It proves when signing occurred, which can be decisive for deadlines, priority, and certificate validity at signing."
      },
      {
        "q": "Can a timestamp be trusted more than a system clock?",
        "a": "A trusted, cryptographically bound timestamp is far harder to dispute than a self-reported local clock."
      }
    ],
    "relatedIndustries": [
      "justice",
      "financial-institutions",
      "regulators",
      "intellectual-property"
    ],
    "relatedProblems": [
      "signature-verification",
      "digital-signature",
      "signature-audit-trail",
      "evidence-chain"
    ],
    "diagram": "ledger",
    "metaTitle": "Signature Timestamp | Sovereign Dispatch",
    "metaDescription": "A signature timestamp is tamper-evident proof of when a signature was applied, binding execution to a verifiable point in time."
  },
  {
    "slug": "signing-order",
    "term": "Signing Order",
    "category": "Signatures & cryptography",
    "kicker": "Sequence matters",
    "headline": "Enforce the exact sequence in which parties must sign",
    "lead": "Signing order is the defined sequence in which parties must execute a document, ensuring approvals and endorsements happen in their required order.",
    "definition": "Signing order is the prescribed sequence in which multiple signers must execute a document, ensuring each party signs only after the required prior signatures are in place.",
    "why": [
      "Some instruments are only valid if signed in a specific order, such as approval before ratification.",
      "Out-of-order signing can void an endorsement or break a chain of authority.",
      "Without enforced order, parties may sign prematurely against a version that later changes."
    ],
    "how": [
      {
        "t": "Enforced sequence",
        "d": "Sovereign Dispatch holds each signer until prior required signatures are complete, preserving the intended order."
      },
      {
        "t": "Order-aware routing",
        "d": "Documents advance to the next signer only when preconditions are met, preventing premature execution."
      },
      {
        "t": "Recorded sequence evidence",
        "d": "The actual order of execution is captured, so the sequence can be demonstrated later."
      }
    ],
    "faqs": [
      {
        "q": "What is signing order?",
        "a": "Signing order is the prescribed sequence in which multiple signers must execute a document, ensuring each party signs only after the required prior signatures are in place."
      },
      {
        "q": "Why does signing order matter?",
        "a": "Because some instruments are only valid when signed in a specific sequence, such as approval before ratification."
      },
      {
        "q": "What if someone signs out of order?",
        "a": "Enforced routing prevents premature signing, and the recorded sequence reveals any deviation for review."
      }
    ],
    "relatedIndustries": [
      "government",
      "parliaments",
      "financial-institutions",
      "justice"
    ],
    "relatedProblems": [
      "signature-workflow",
      "multi-party-signing",
      "counter-signature",
      "signature-authority", "order"],
    "diagram": "chain",
    "metaTitle": "Signing Order | Sovereign Dispatch",
    "metaDescription": "Signing order enforces the exact sequence in which parties must execute a document, so approvals and endorsements occur in their required order."
  },
  {
    "slug": "signature-audit-trail",
    "term": "Signature Audit Trail",
    "category": "Signatures & cryptography",
    "kicker": "The record behind the mark",
    "headline": "Keep a defensible record of every step behind a signature",
    "lead": "A signature audit trail is the chronological, tamper-evident record of every action surrounding a signing, from preparation to final execution.",
    "definition": "A signature audit trail is a chronological, tamper-evident record of all events associated with signing a document, including who acted, what they did, and when each step occurred.",
    "why": [
      "A signature alone rarely tells the full story; disputes often hinge on the surrounding sequence of events.",
      "An incomplete or alterable trail can leave an institution unable to defend how a document was executed.",
      "Auditors and courts increasingly expect a clear, durable record of the entire signing process."
    ],
    "how": [
      {
        "t": "End-to-end capture",
        "d": "Sovereign Dispatch records every signing-related event, from preparation through final execution, in sequence."
      },
      {
        "t": "Tamper-evident logging",
        "d": "The trail is sealed so entries cannot be silently changed or removed after the fact."
      },
      {
        "t": "Defensible reconstruction",
        "d": "The complete trail lets reviewers reconstruct exactly how and when a document was signed."
      }
    ],
    "faqs": [
      {
        "q": "What is a signature audit trail?",
        "a": "A signature audit trail is a chronological, tamper-evident record of all events associated with signing a document, including who acted, what they did, and when each step occurred."
      },
      {
        "q": "Why is a signature audit trail important?",
        "a": "Because disputes often turn on the sequence of events around signing, not just the signature itself."
      },
      {
        "q": "What does a signature audit trail typically capture?",
        "a": "Preparation, routing, identity events, the signing actions, and finalization, each with actor and timestamp."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "justice",
      "financial-institutions",
      "supreme-audit-institutions"
    ],
    "relatedProblems": [
      "signature-timestamp",
      "evidence-chain",
      "publication-audit",
      "signature-verification"
    ],
    "diagram": "ledger",
    "metaTitle": "Signature Audit Trail | Sovereign Dispatch",
    "metaDescription": "A signature audit trail is a chronological, tamper-evident record of every action behind a signing, from preparation to final execution."
  },
  {
    "slug": "public-key-infrastructure",
    "term": "Public Key Infrastructure",
    "category": "Signatures & cryptography",
    "kicker": "PKI foundations",
    "headline": "Bind identities to keys for verifiable records",
    "lead": "Public key infrastructure is the institutional plumbing that lets a reader trust who signed a record and confirm it has not changed.",
    "definition": "Public Key Infrastructure (PKI) is the combined system of certificate authorities, registration processes, policies, and software that issues, manages, and validates digital certificates binding public keys to verified identities.",
    "why": [
      "Without PKI, a digital signature only proves a key was used, not whose key it was.",
      "It lets verifiers check signatures years later against published trust anchors rather than private arrangements.",
      "Institutions can scope trust to named issuers, supporting audit and accountability."
    ],
    "how": [
      {
        "t": "Establish trust anchors",
        "d": "Define which certificate authorities the institution recognises and publish their root certificates."
      },
      {
        "t": "Issue and bind",
        "d": "Verify an identity, then issue a certificate binding that identity to a public key under a stated policy."
      },
      {
        "t": "Validate at use",
        "d": "Verifiers build a certificate chain to a trusted root and confirm none of the links are revoked or expired."
      }
    ],
    "faqs": [
      {
        "q": "What is public key infrastructure?",
        "a": "Public Key Infrastructure (PKI) is the combined system of certificate authorities, registration processes, policies, and software that issues, manages, and validates digital certificates binding public keys to verified identities."
      },
      {
        "q": "Is PKI the same as a single certificate?",
        "a": "No. A certificate is one artefact; PKI is the surrounding system of issuance, policy, validation, and revocation that gives certificates meaning."
      },
      {
        "q": "Does PKI guarantee a document is trustworthy?",
        "a": "No. It supports tamper-evident verification of signer identity and integrity, but the content's accuracy remains a separate institutional responsibility."
      }
    ],
    "relatedIndustries": [
      "government",
      "central-banks",
      "regulators",
      "financial-institutions"
    ],
    "relatedProblems": [
      "pki-digital-certificate",
      "certificate-authority",
      "root-of-trust",
      "public-private-key-pair", "public-verification"],
    "diagram": "shield",
    "metaTitle": "Public Key Infrastructure (PKI) Explained",
    "metaDescription": "Public key infrastructure binds verified identities to keys so readers can confirm who signed a record and that it remains tamper-evident."
  },
  {
    "slug": "pki-digital-certificate",
    "term": "Digital Certificate",
    "category": "Signatures & cryptography",
    "kicker": "PKI foundations",
    "headline": "Prove a key belongs to a named issuer",
    "lead": "A digital certificate is the signed statement that connects a public key to a verified institutional identity.",
    "definition": "A Digital Certificate is a cryptographically signed electronic credential that binds a public key to a verified identity, issued by a certificate authority and used to validate signatures and establish trust.",
    "why": [
      "It answers the core question of a signature: whose key produced it.",
      "Certificates carry validity periods and usage constraints that scope how a key may be relied upon.",
      "They can be checked against a trusted issuer without contacting the original signer."
    ],
    "how": [
      {
        "t": "Submit a request",
        "d": "An applicant generates a key pair and submits the public key with identity evidence to an issuer."
      },
      {
        "t": "Issuer signs",
        "d": "After verifying the applicant, the certificate authority signs a certificate binding the key to the identity."
      },
      {
        "t": "Distribute and rely",
        "d": "The certificate accompanies signed records so verifiers can confirm the binding and check validity."
      }
    ],
    "faqs": [
      {
        "q": "What is a digital certificate?",
        "a": "A Digital Certificate is a cryptographically signed electronic credential that binds a public key to a verified identity, issued by a certificate authority and used to validate signatures and establish trust."
      },
      {
        "q": "What is inside a certificate?",
        "a": "Typically the subject identity, the public key, issuer details, validity dates, usage constraints, and the issuer's signature over those fields."
      },
      {
        "q": "Can a certificate expire?",
        "a": "Yes. Certificates carry validity periods and may also be revoked early; verifiers should check both before relying on them."
      }
    ],
    "relatedIndustries": [
      "government",
      "universities",
      "regulators",
      "notarial-authorities"
    ],
    "relatedProblems": [
      "certificate-authority",
      "x509-certificate",
      "certificate-chain",
      "public-key-infrastructure", "certificate-of-origin"],
    "diagram": "seal",
    "metaTitle": "Digital Certificate: Binding Keys to Identity",
    "metaDescription": "A digital certificate links a public key to a verified identity, letting verifiers confirm who signed a record without contacting the signer."
  },
  {
    "slug": "certificate-authority",
    "term": "Certificate Authority",
    "category": "Signatures & cryptography",
    "kicker": "Trust providers",
    "headline": "The issuer that vouches for digital identities",
    "lead": "A certificate authority is the named party whose signature turns a raw public key into a credential others can trust.",
    "definition": "A Certificate Authority (CA) is a trusted entity that verifies identities and issues digital certificates, vouching for the binding between a public key and its holder under a published certification policy.",
    "why": [
      "Verifiers need a single accountable party to anchor trust rather than negotiating it case by case.",
      "A CA's published policy defines how rigorously identities are checked.",
      "Its root certificate becomes the trust anchor for every certificate it issues."
    ],
    "how": [
      {
        "t": "Publish a policy",
        "d": "The CA states how it verifies subjects and what its certificates may be used for."
      },
      {
        "t": "Vet and issue",
        "d": "It validates each applicant against that policy before signing a certificate."
      },
      {
        "t": "Maintain status",
        "d": "The CA publishes revocation data so verifiers can detect compromised or withdrawn certificates."
      }
    ],
    "faqs": [
      {
        "q": "What is a certificate authority?",
        "a": "A Certificate Authority (CA) is a trusted entity that verifies identities and issues digital certificates, vouching for the binding between a public key and its holder under a published certification policy."
      },
      {
        "q": "Why trust a particular CA?",
        "a": "Trust rests on its published policy, operational controls, and the institution's decision to include its root in a trust store."
      },
      {
        "q": "What if a CA is compromised?",
        "a": "Certificates it issued may be distrusted, and verifiers rely on revocation and root-store updates to stop accepting them."
      }
    ],
    "relatedIndustries": [
      "government",
      "central-banks",
      "regulators",
      "standards-bodies"
    ],
    "relatedProblems": [
      "pki-digital-certificate",
      "root-of-trust",
      "certificate-revocation",
      "public-key-infrastructure", "certificate-of-origin"],
    "diagram": "shield",
    "metaTitle": "Certificate Authority (CA) Explained",
    "metaDescription": "A certificate authority verifies identities and issues digital certificates, anchoring trust so verifiers can rely on signed records."
  },
  {
    "slug": "key-management",
    "term": "Key Management",
    "category": "Signatures & cryptography",
    "kicker": "Operational controls",
    "headline": "Protect signing keys across their full lifecycle",
    "lead": "Key management is the discipline that keeps signing keys secret, available, and accountable from creation to retirement.",
    "definition": "Key Management is the set of policies, procedures, and technical controls governing how cryptographic keys are generated, stored, used, rotated, and retired throughout their lifecycle.",
    "why": [
      "A signature is only as trustworthy as the secrecy of the private key behind it.",
      "Poor handling, not weak algorithms, is the most common cause of cryptographic failure.",
      "Clear custody and access records support audit when records are later challenged."
    ],
    "how": [
      {
        "t": "Generate securely",
        "d": "Create keys inside hardened modules so private material never appears in plain form."
      },
      {
        "t": "Control access",
        "d": "Restrict signing to authorised roles with logging and separation of duties."
      },
      {
        "t": "Plan retirement",
        "d": "Define rotation and revocation so keys are withdrawn cleanly when compromised or aged out."
      }
    ],
    "faqs": [
      {
        "q": "What is key management?",
        "a": "Key Management is the set of policies, procedures, and technical controls governing how cryptographic keys are generated, stored, used, rotated, and retired throughout their lifecycle."
      },
      {
        "q": "Where should private keys live?",
        "a": "In hardware security modules or equivalently protected stores where the private key cannot be exported in plain form."
      },
      {
        "q": "Does good key management guarantee security?",
        "a": "No. It substantially reduces risk and supports accountability, but no control fully eliminates the possibility of compromise."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "central-banks",
      "defence",
      "government"
    ],
    "relatedProblems": [
      "public-private-key-pair",
      "root-of-trust",
      "certificate-revocation", "instant-verification"],
    "diagram": "lifecycle",
    "metaTitle": "Key Management: Securing Signing Keys",
    "metaDescription": "Key management governs how cryptographic keys are generated, stored, used, rotated, and retired so signatures stay trustworthy and accountable."
  },
  {
    "slug": "hash-function",
    "term": "Hash Function",
    "category": "Signatures & cryptography",
    "kicker": "Integrity primitives",
    "headline": "Reduce any record to a fixed verifiable digest",
    "lead": "A hash function turns a document of any size into a short fingerprint that changes if a single byte changes.",
    "definition": "A Hash Function is a one-way mathematical algorithm that maps input data of any size to a fixed-length output, where any change to the input produces a different output, making it foundational to integrity verification.",
    "why": [
      "It lets verifiers compare a record against a recorded fingerprint instead of the whole original.",
      "Being one-way, it reveals nothing useful about the content from the digest alone.",
      "It underpins digital signatures, hash chains, and timestamping."
    ],
    "how": [
      {
        "t": "Compute a digest",
        "d": "Run the record through the hash to produce its fixed-length fingerprint."
      },
      {
        "t": "Record the value",
        "d": "Store or publish the digest so it can be checked later."
      },
      {
        "t": "Re-verify",
        "d": "Recompute the hash on the presented record and confirm it matches the recorded value."
      }
    ],
    "faqs": [
      {
        "q": "What is a hash function?",
        "a": "A Hash Function is a one-way mathematical algorithm that maps input data of any size to a fixed-length output, where any change to the input produces a different output, making it foundational to integrity verification."
      },
      {
        "q": "Is a hash reversible?",
        "a": "No. A secure hash is computationally infeasible to reverse, so the digest cannot reconstruct the original input."
      },
      {
        "q": "Does a matching hash prove authorship?",
        "a": "No. It evidences integrity, that the content is unchanged; authorship requires a signature over that hash."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "regulators",
      "research-institutes"
    ],
    "relatedProblems": [
      "sha-256",
      "digital-fingerprint",
      "merkle-tree",
      "hash-chain"
    ],
    "diagram": "seal",
    "metaTitle": "Hash Function Explained",
    "metaDescription": "A hash function maps any record to a fixed-length fingerprint that changes if the input changes, making it foundational to integrity verification."
  },
  {
    "slug": "sha-256",
    "term": "SHA-256",
    "category": "Signatures & cryptography",
    "kicker": "Integrity primitives",
    "headline": "A widely trusted 256-bit integrity digest",
    "lead": "SHA-256 is the specific hash algorithm institutions most often rely on to fingerprint records for verification.",
    "definition": "SHA-256 is a cryptographic hash function in the SHA-2 family that produces a fixed 256-bit digest, widely used to verify data integrity and underpin digital signatures and timestamps.",
    "why": [
      "Its 256-bit output makes accidental or deliberate collisions practically infeasible with current methods.",
      "It is standardised and broadly implemented, easing long-term verification.",
      "It is the default digest behind many signing and anchoring schemes."
    ],
    "how": [
      {
        "t": "Hash the record",
        "d": "Apply SHA-256 to produce a 256-bit digest, usually shown as 64 hexadecimal characters."
      },
      {
        "t": "Bind or publish",
        "d": "Sign or timestamp the digest, or publish it where it can be independently retrieved."
      },
      {
        "t": "Recompute to check",
        "d": "Recompute SHA-256 on the candidate file and compare digests byte for byte."
      }
    ],
    "faqs": [
      {
        "q": "What is SHA-256?",
        "a": "SHA-256 is a cryptographic hash function in the SHA-2 family that produces a fixed 256-bit digest, widely used to verify data integrity and underpin digital signatures and timestamps."
      },
      {
        "q": "How long is a SHA-256 digest?",
        "a": "It is 256 bits, commonly displayed as a 64-character hexadecimal string."
      },
      {
        "q": "Is SHA-256 considered broken?",
        "a": "No known practical collision attack exists against SHA-256 today, though cryptographic strength is always assessed over time."
      }
    ],
    "relatedIndustries": [
      "archives",
      "financial-institutions",
      "regulators",
      "national-statistics"
    ],
    "relatedProblems": [
      "hash-function",
      "digital-fingerprint",
      "trusted-timestamp",
      "merkle-tree"
    ],
    "diagram": "seal",
    "metaTitle": "SHA-256: The 256-bit Integrity Digest",
    "metaDescription": "SHA-256 produces a fixed 256-bit fingerprint of any record, widely used to verify integrity and underpin digital signatures and timestamps."
  },
  {
    "slug": "merkle-tree",
    "term": "Merkle Tree",
    "category": "Signatures & cryptography",
    "kicker": "Integrity primitives",
    "headline": "Verify one record against a whole dataset",
    "lead": "A Merkle tree lets a verifier confirm a single record belongs to a large set using only a short proof.",
    "definition": "A Merkle Tree is a structure that hashes data in pairs up to a single root hash, allowing efficient proof that any individual record is part of a dataset without revealing the whole set.",
    "why": [
      "It compresses the integrity of millions of records into one root value.",
      "An inclusion proof is small, so verification stays cheap even at scale.",
      "Changing any leaf changes the root, exposing tampering anywhere in the set."
    ],
    "how": [
      {
        "t": "Hash the leaves",
        "d": "Compute a hash of each record to form the tree's leaves."
      },
      {
        "t": "Combine upward",
        "d": "Hash pairs together level by level until a single root hash remains."
      },
      {
        "t": "Prove inclusion",
        "d": "Provide the sibling hashes along one path so a verifier can recompute the root."
      }
    ],
    "faqs": [
      {
        "q": "What is a Merkle tree?",
        "a": "A Merkle Tree is a structure that hashes data in pairs up to a single root hash, allowing efficient proof that any individual record is part of a dataset without revealing the whole set."
      },
      {
        "q": "What is a Merkle root?",
        "a": "The single hash at the top of the tree that summarises the integrity of every record beneath it."
      },
      {
        "q": "Why use a Merkle tree instead of one big hash?",
        "a": "It lets you prove a single record's inclusion with a compact proof, without hashing or disclosing the entire dataset."
      }
    ],
    "relatedIndustries": [
      "national-statistics",
      "financial-institutions",
      "archives",
      "stock-exchanges"
    ],
    "relatedProblems": [
      "hash-function",
      "hash-chain",
      "blockchain-anchoring",
      "sha-256"
    ],
    "diagram": "chain",
    "metaTitle": "Merkle Tree Explained",
    "metaDescription": "A Merkle tree hashes records up to one root, letting a verifier prove a single record belongs to a large dataset with a compact proof."
  },
  {
    "slug": "hash-chain",
    "term": "Hash Chain",
    "category": "Signatures & cryptography",
    "kicker": "Integrity primitives",
    "headline": "Link records so tampering breaks the chain",
    "lead": "A hash chain ties each record to the one before it, so altering history breaks every link that follows.",
    "definition": "A Hash Chain is a sequence of records in which each entry includes the hash of the previous entry, making any alteration to earlier records detectable through broken subsequent hashes.",
    "why": [
      "It turns an ordered log into a tamper-evident structure without external storage.",
      "Editing one entry invalidates the hashes of all later entries.",
      "It provides a low-cost integrity backbone for append-only records."
    ],
    "how": [
      {
        "t": "Hash each entry",
        "d": "Compute a digest of the new record together with the previous entry's hash."
      },
      {
        "t": "Append in order",
        "d": "Store entries sequentially so each carries the prior link."
      },
      {
        "t": "Walk the chain",
        "d": "Recompute hashes along the chain to confirm no link has been altered."
      }
    ],
    "faqs": [
      {
        "q": "What is a hash chain?",
        "a": "A Hash Chain is a sequence of records in which each entry includes the hash of the previous entry, making any alteration to earlier records detectable through broken subsequent hashes."
      },
      {
        "q": "How is a hash chain different from a blockchain?",
        "a": "A hash chain is the underlying linking technique; a blockchain adds consensus, distribution, and often proof mechanisms on top of it."
      },
      {
        "q": "Can a hash chain be edited unnoticed?",
        "a": "Editing an early entry breaks all later hashes, so changes are tamper-evident unless every following entry is recomputed and re-secured."
      }
    ],
    "relatedIndustries": [
      "justice",
      "law-enforcement",
      "archives",
      "regulators"
    ],
    "relatedProblems": [
      "hash-function",
      "merkle-tree",
      "blockchain-anchoring",
      "digital-fingerprint"
    ],
    "diagram": "chain",
    "metaTitle": "Hash Chain: Tamper-Evident Record Linking",
    "metaDescription": "A hash chain links each record to the previous one's hash, so altering earlier entries breaks later links and makes tampering detectable."
  },
  {
    "slug": "blockchain-anchoring",
    "term": "Blockchain Anchoring",
    "category": "Signatures & cryptography",
    "kicker": "External witnesses",
    "headline": "Pin a record's fingerprint to a public ledger",
    "lead": "Blockchain anchoring publishes a record's hash to a shared ledger so its existence and integrity can be checked independently.",
    "definition": "Blockchain Anchoring is the practice of recording a hash or Merkle root of one or more records onto a distributed ledger, creating an independent, timestamped reference for later integrity and existence verification.",
    "why": [
      "It places a verifiable reference outside any single institution's control.",
      "Anchoring a Merkle root can cover many records in one ledger entry.",
      "It strengthens existence and timing claims without exposing the records themselves."
    ],
    "how": [
      {
        "t": "Aggregate hashes",
        "d": "Combine record hashes, often into a Merkle root, to anchor many at once."
      },
      {
        "t": "Publish the anchor",
        "d": "Write the root to the ledger, which timestamps and replicates it."
      },
      {
        "t": "Verify later",
        "d": "Reproduce the hash and inclusion proof and match them to the on-ledger entry."
      }
    ],
    "faqs": [
      {
        "q": "What is blockchain anchoring?",
        "a": "Blockchain Anchoring is the practice of recording a hash or Merkle root of one or more records onto a distributed ledger, creating an independent, timestamped reference for later integrity and existence verification."
      },
      {
        "q": "Does the document go on the blockchain?",
        "a": "No. Only a hash or root is published, so the content stays private while integrity remains verifiable."
      },
      {
        "q": "Does anchoring guarantee a record is genuine?",
        "a": "No. It evidences that a specific hash existed by a certain time; authenticity of the underlying content is a separate matter."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "intellectual-property",
      "regulators",
      "land-registries"
    ],
    "relatedProblems": [
      "proof-of-existence",
      "trusted-timestamp",
      "merkle-tree",
      "hash-function"
    ],
    "diagram": "ledger",
    "metaTitle": "Blockchain Anchoring Explained",
    "metaDescription": "Blockchain anchoring records a hash or Merkle root on a distributed ledger, creating an independent timestamped reference for integrity verification."
  },
  {
    "slug": "proof-of-existence",
    "term": "Proof Of Existence",
    "category": "Signatures & cryptography",
    "kicker": "Existence and time",
    "headline": "Show a record existed at a given moment",
    "lead": "Proof of existence demonstrates that a specific record was present at or before a certain time, without revealing its contents.",
    "definition": "Proof of Existence is cryptographic evidence that a particular record, represented by its hash, existed at or before a specific point in time, typically established through timestamping or ledger anchoring.",
    "why": [
      "It supports priority and prior-art claims where timing matters.",
      "Using a hash, it proves existence without disclosing the underlying record.",
      "It can be re-checked years later against a durable external reference."
    ],
    "how": [
      {
        "t": "Hash the record",
        "d": "Produce a fingerprint that represents the record uniquely."
      },
      {
        "t": "Timestamp or anchor",
        "d": "Bind the hash to a trusted time source or ledger entry."
      },
      {
        "t": "Present the proof",
        "d": "Show the hash and its timestamp or inclusion proof to a verifier."
      }
    ],
    "faqs": [
      {
        "q": "What is proof of existence?",
        "a": "Proof of Existence is cryptographic evidence that a particular record, represented by its hash, existed at or before a specific point in time, typically established through timestamping or ledger anchoring."
      },
      {
        "q": "Does it reveal the document?",
        "a": "No. Only the hash is used to establish existence, so the content can remain confidential."
      },
      {
        "q": "Does proof of existence prove authorship?",
        "a": "No. It evidences timing and integrity of a record's hash, not who created it or whether its claims are true."
      }
    ],
    "relatedIndustries": [
      "intellectual-property",
      "research-institutes",
      "universities",
      "notarial-authorities"
    ],
    "relatedProblems": [
      "trusted-timestamp",
      "blockchain-anchoring",
      "hash-function",
      "time-stamping-authority"
    ],
    "diagram": "seal",
    "metaTitle": "Proof of Existence Explained",
    "metaDescription": "Proof of existence is cryptographic evidence that a record's hash existed at or before a given time, without revealing the record's contents."
  },
  {
    "slug": "trusted-timestamp",
    "term": "Trusted Timestamp",
    "category": "Signatures & cryptography",
    "kicker": "Existence and time",
    "headline": "Bind a record to a verifiable point in time",
    "lead": "A trusted timestamp attaches an independently attested time to a record's hash, so when it existed can be verified later.",
    "definition": "A Trusted Timestamp is a signed assertion from a trusted time source that a specific hash existed at a stated time, providing verifiable evidence of when a record came into being.",
    "why": [
      "It separates the question of when from who created or holds a record.",
      "An independent source carries more weight than a self-asserted date.",
      "It supports deadlines, sequencing, and prior-art and priority disputes."
    ],
    "how": [
      {
        "t": "Submit a hash",
        "d": "Send the record's digest, not the record, to a timestamping service."
      },
      {
        "t": "Receive a token",
        "d": "The service returns a signed token binding that hash to the asserted time."
      },
      {
        "t": "Verify the token",
        "d": "Check the signature and time against the trusted source's certificate."
      }
    ],
    "faqs": [
      {
        "q": "What is a trusted timestamp?",
        "a": "A Trusted Timestamp is a signed assertion from a trusted time source that a specific hash existed at a stated time, providing verifiable evidence of when a record came into being."
      },
      {
        "q": "Why not just use a file's date?",
        "a": "File dates are easily altered and self-asserted; a trusted timestamp is signed by an independent source and is verifiable."
      },
      {
        "q": "Can timestamps be backdated?",
        "a": "A properly operated timestamping authority signs the time at submission, making undetected backdating impractical."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "justice",
      "intellectual-property",
      "financial-institutions"
    ],
    "relatedProblems": [
      "time-stamping-authority",
      "proof-of-existence",
      "blockchain-anchoring",
      "hash-function"
    ],
    "diagram": "seal",
    "metaTitle": "Trusted Timestamp Explained",
    "metaDescription": "A trusted timestamp is a signed assertion from an independent time source that a record's hash existed at a stated time, verifiable later."
  },
  {
    "slug": "time-stamping-authority",
    "term": "Time-Stamping Authority",
    "category": "Signatures & cryptography",
    "kicker": "Trust providers",
    "headline": "The independent source that attests record timing",
    "lead": "A time-stamping authority is the trusted party that signs assertions of when a record's hash existed.",
    "definition": "A Time-Stamping Authority (TSA) is a trusted service that issues signed timestamp tokens binding a submitted hash to an accurate, attested time, enabling independent verification of when a record existed.",
    "why": [
      "Verifiers need an accountable, independent source for timing claims.",
      "A TSA's accurate clock and signing key make its tokens hard to forge.",
      "Its certificate lets tokens be validated long after issuance."
    ],
    "how": [
      {
        "t": "Maintain accurate time",
        "d": "The TSA synchronises to a reliable reference clock and protects its signing key."
      },
      {
        "t": "Issue tokens",
        "d": "On request, it signs the submitted hash together with the current time."
      },
      {
        "t": "Support verification",
        "d": "It publishes its certificate so tokens can be validated independently."
      }
    ],
    "faqs": [
      {
        "q": "What is a time-stamping authority?",
        "a": "A Time-Stamping Authority (TSA) is a trusted service that issues signed timestamp tokens binding a submitted hash to an accurate, attested time, enabling independent verification of when a record existed."
      },
      {
        "q": "How does a TSA differ from a certificate authority?",
        "a": "A CA attests identity for keys; a TSA attests the time at which a hash was presented to it."
      },
      {
        "q": "What does the TSA see of my document?",
        "a": "Only its hash. The record itself is not submitted, so its contents stay private."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "notarial-authorities",
      "intellectual-property",
      "government"
    ],
    "relatedProblems": [
      "trusted-timestamp",
      "proof-of-existence",
      "certificate-authority",
      "hash-function"
    ],
    "diagram": "shield",
    "metaTitle": "Time-Stamping Authority (TSA) Explained",
    "metaDescription": "A time-stamping authority issues signed tokens binding a hash to an attested time, enabling independent verification of when a record existed."
  },
  {
    "slug": "x509-certificate",
    "term": "X.509 Certificate",
    "category": "Signatures & cryptography",
    "kicker": "PKI foundations",
    "headline": "The standard format behind trusted certificates",
    "lead": "X.509 is the structured certificate format that lets different systems read and validate the same trust credentials.",
    "definition": "An X.509 Certificate is a digital certificate following the X.509 standard, which defines a structured format for binding a public key to an identity along with issuer, validity, and usage fields.",
    "why": [
      "A common format lets independent systems validate the same certificate.",
      "Its defined fields express identity, validity, and permitted uses precisely.",
      "It chains to issuers, enabling trust to be traced to a root."
    ],
    "how": [
      {
        "t": "Populate fields",
        "d": "Record subject, public key, issuer, validity dates, and usage extensions in the standard structure."
      },
      {
        "t": "Sign the certificate",
        "d": "The issuer signs the encoded fields to make the certificate verifiable."
      },
      {
        "t": "Parse and validate",
        "d": "Verifiers decode the fields, check the signature, and build a chain to a trusted root."
      }
    ],
    "faqs": [
      {
        "q": "What is an X.509 certificate?",
        "a": "An X.509 Certificate is a digital certificate following the X.509 standard, which defines a structured format for binding a public key to an identity along with issuer, validity, and usage fields."
      },
      {
        "q": "Why does the format matter?",
        "a": "A shared standard lets diverse systems read and validate the same certificate without bespoke arrangements."
      },
      {
        "q": "Are all digital certificates X.509?",
        "a": "Most certificates used in PKI are X.509, though other credential formats exist for specific purposes."
      }
    ],
    "relatedIndustries": [
      "standards-bodies",
      "government",
      "financial-institutions",
      "telecom-regulators"
    ],
    "relatedProblems": [
      "pki-digital-certificate",
      "certificate-chain",
      "certificate-authority",
      "public-key-infrastructure", "certificate-of-origin"],
    "diagram": "seal",
    "metaTitle": "X.509 Certificate Format Explained",
    "metaDescription": "An X.509 certificate is the standard structured format binding a public key to an identity with issuer, validity, and usage fields for validation."
  },
  {
    "slug": "certificate-revocation",
    "term": "Certificate Revocation",
    "category": "Signatures & cryptography",
    "kicker": "Operational controls",
    "headline": "Withdraw trust from a compromised certificate",
    "lead": "Certificate revocation lets an issuer declare a certificate invalid before it expires so verifiers stop relying on it.",
    "definition": "Certificate Revocation is the process by which a certificate authority declares a previously issued certificate invalid before its expiry, publishing that status so verifiers can refuse to rely on it.",
    "why": [
      "Keys can be compromised or details can change before a certificate expires.",
      "Verifiers need a current way to learn a certificate is no longer trustworthy.",
      "It limits the window in which a compromised credential can be misused."
    ],
    "how": [
      {
        "t": "Declare revocation",
        "d": "The issuer marks the certificate invalid and records the reason and time."
      },
      {
        "t": "Publish status",
        "d": "The status is distributed via revocation lists or online status checks."
      },
      {
        "t": "Check at use",
        "d": "Verifiers consult revocation status before accepting a signature."
      }
    ],
    "faqs": [
      {
        "q": "What is certificate revocation?",
        "a": "Certificate Revocation is the process by which a certificate authority declares a previously issued certificate invalid before its expiry, publishing that status so verifiers can refuse to rely on it."
      },
      {
        "q": "How do verifiers learn of revocation?",
        "a": "Through published revocation lists or online status checks that report whether a certificate remains valid."
      },
      {
        "q": "What about signatures made before revocation?",
        "a": "They may remain valid if a trusted timestamp shows they predate the compromise; timing evidence is essential here."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "government",
      "regulators",
      "central-banks"
    ],
    "relatedProblems": [
      "certificate-authority",
      "pki-digital-certificate",
      "trusted-timestamp", "certificate-validation", "birth-certificate-issuance"],
    "diagram": "lifecycle",
    "metaTitle": "Certificate Revocation Explained",
    "metaDescription": "Certificate revocation lets an issuer declare a certificate invalid before expiry and publish that status so verifiers stop relying on it."
  },
  {
    "slug": "root-of-trust",
    "term": "Root Of Trust",
    "category": "Signatures & cryptography",
    "kicker": "Trust providers",
    "headline": "The anchor every certificate chain leads back to",
    "lead": "A root of trust is the foundational, self-signed anchor an institution chooses to rely on when validating certificates.",
    "definition": "A Root of Trust is a foundational, inherently trusted component, typically a self-signed root certificate or secure hardware, from which all other trust in a system is derived.",
    "why": [
      "Every certificate chain must terminate at something accepted without further proof.",
      "Choosing roots deliberately scopes which issuers an institution recognises.",
      "Protecting the root is critical because its compromise undermines everything beneath it."
    ],
    "how": [
      {
        "t": "Select anchors",
        "d": "Decide which root certificates or hardware the institution will inherently trust."
      },
      {
        "t": "Protect the root",
        "d": "Hold root keys in secure hardware with strict, audited access."
      },
      {
        "t": "Chain to it",
        "d": "Validate end certificates by building a path back to a recognised root."
      }
    ],
    "faqs": [
      {
        "q": "What is a root of trust?",
        "a": "A Root of Trust is a foundational, inherently trusted component, typically a self-signed root certificate or secure hardware, from which all other trust in a system is derived."
      },
      {
        "q": "Why is a root self-signed?",
        "a": "Because it is the starting point; there is no higher authority to sign it, so trust in it is established by deliberate inclusion."
      },
      {
        "q": "What happens if a root is compromised?",
        "a": "Trust in everything chaining to it collapses, which is why root keys receive the strongest protection and audit."
      }
    ],
    "relatedIndustries": [
      "central-banks",
      "defence",
      "government",
      "standards-bodies"
    ],
    "relatedProblems": [
      "certificate-chain",
      "certificate-authority",
      "key-management",
      "public-key-infrastructure"
    ],
    "diagram": "shield",
    "metaTitle": "Root of Trust Explained",
    "metaDescription": "A root of trust is the foundational self-signed anchor from which all certificate trust derives, making its protection critical to the system."
  },
  {
    "slug": "digital-fingerprint",
    "term": "Digital Fingerprint",
    "category": "Signatures & cryptography",
    "kicker": "Integrity primitives",
    "headline": "A compact identifier unique to each record",
    "lead": "A digital fingerprint is the short hash value that uniquely represents a record for fast integrity checks.",
    "definition": "A Digital Fingerprint is the fixed-length hash value derived from a record that uniquely represents its exact contents, enabling integrity comparison without sharing the full record.",
    "why": [
      "It lets parties confirm they hold the identical record by comparing short values.",
      "Any change to the record yields a different fingerprint, exposing alteration.",
      "It can be published or signed in place of the full document."
    ],
    "how": [
      {
        "t": "Derive the value",
        "d": "Compute a cryptographic hash of the record to obtain its fingerprint."
      },
      {
        "t": "Share or store",
        "d": "Distribute the fingerprint for reference while keeping the record private."
      },
      {
        "t": "Compare to confirm",
        "d": "Recompute and match fingerprints to confirm two copies are identical."
      }
    ],
    "faqs": [
      {
        "q": "What is a digital fingerprint?",
        "a": "A Digital Fingerprint is the fixed-length hash value derived from a record that uniquely represents its exact contents, enabling integrity comparison without sharing the full record."
      },
      {
        "q": "Is a digital fingerprint the same as a hash?",
        "a": "In practice yes; fingerprint is the everyday term for the hash value that identifies a specific record."
      },
      {
        "q": "Can two records share a fingerprint?",
        "a": "With a strong hash, finding two records with the same fingerprint is computationally infeasible by current methods."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "intellectual-property",
      "research-institutes"
    ],
    "relatedProblems": [
      "hash-function",
      "sha-256",
      "proof-of-existence",
      "merkle-tree"
    ],
    "diagram": "seal",
    "metaTitle": "Digital Fingerprint Explained",
    "metaDescription": "A digital fingerprint is the hash value that uniquely represents a record, enabling integrity comparison without sharing the full document."
  },
  {
    "slug": "public-private-key-pair",
    "term": "Public-Private Key Pair",
    "category": "Signatures & cryptography",
    "kicker": "PKI foundations",
    "headline": "Two linked keys, one secret and one shared",
    "lead": "A public-private key pair lets one party sign records secretly while anyone can verify with the matching public key.",
    "definition": "A Public-Private Key Pair is a set of two mathematically linked keys where the private key is kept secret to create signatures and the public key is shared so others can verify them.",
    "why": [
      "It separates the power to sign from the ability to verify.",
      "Only the private key holder can produce a valid signature.",
      "The public key can be widely distributed without weakening security."
    ],
    "how": [
      {
        "t": "Generate the pair",
        "d": "Create the two linked keys together, keeping the private key protected."
      },
      {
        "t": "Sign privately",
        "d": "Use the private key to produce a signature over a record's hash."
      },
      {
        "t": "Verify publicly",
        "d": "Anyone with the public key confirms the signature matches the record."
      }
    ],
    "faqs": [
      {
        "q": "What is a public-private key pair?",
        "a": "A Public-Private Key Pair is a set of two mathematically linked keys where the private key is kept secret to create signatures and the public key is shared so others can verify them."
      },
      {
        "q": "Why can the public key be shared freely?",
        "a": "It can verify signatures but cannot create them or derive the private key, so sharing it does not weaken security."
      },
      {
        "q": "What if the private key is exposed?",
        "a": "Signatures it produced can no longer be trusted, so the certificate should be revoked and the key rotated."
      }
    ],
    "relatedIndustries": [
      "government",
      "financial-institutions",
      "universities",
      "defence"
    ],
    "relatedProblems": [
      "signature-algorithm",
      "key-management",
      "pki-digital-certificate", "public-verification"],
    "diagram": "shield",
    "metaTitle": "Public-Private Key Pair Explained",
    "metaDescription": "A public-private key pair has a secret signing key and a shareable verification key, separating the power to sign from the ability to verify."
  },
  {
    "slug": "certificate-chain",
    "term": "Certificate Chain",
    "category": "Signatures & cryptography",
    "kicker": "PKI foundations",
    "headline": "Trace trust from a record back to a root",
    "lead": "A certificate chain links a signer's certificate through intermediate issuers up to a trusted root.",
    "definition": "A Certificate Chain is the ordered sequence of certificates connecting an end certificate through any intermediate issuers to a trusted root certificate, allowing trust to be traced and validated.",
    "why": [
      "It lets verifiers reach a trusted root without trusting every issuer directly.",
      "Intermediates let roots stay offline and tightly protected.",
      "Each link's signature is checked, so a single broken link breaks the chain."
    ],
    "how": [
      {
        "t": "Assemble the path",
        "d": "Collect the end, intermediate, and root certificates in issuing order."
      },
      {
        "t": "Verify each link",
        "d": "Confirm each certificate is signed by the next one up the chain."
      },
      {
        "t": "Anchor to a root",
        "d": "Ensure the chain ends at a root the verifier already trusts."
      }
    ],
    "faqs": [
      {
        "q": "What is a certificate chain?",
        "a": "A Certificate Chain is the ordered sequence of certificates connecting an end certificate through any intermediate issuers to a trusted root certificate, allowing trust to be traced and validated."
      },
      {
        "q": "Why use intermediate certificates?",
        "a": "They let the root key stay offline and well protected while intermediates handle day-to-day issuance."
      },
      {
        "q": "What breaks a certificate chain?",
        "a": "A missing, expired, or revoked link, or one whose signature fails, prevents the chain from reaching a trusted root."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "government",
      "standards-bodies",
      "telecom-regulators"
    ],
    "relatedProblems": [
      "certificate-authority",
      "root-of-trust",
      "x509-certificate",
      "certificate-revocation", "birth-certificate-issuance"],
    "diagram": "chain",
    "metaTitle": "Certificate Chain Explained",
    "metaDescription": "A certificate chain links a signer's certificate through intermediate issuers to a trusted root, letting verifiers trace and validate trust."
  },
  {
    "slug": "signature-algorithm",
    "term": "Signature Algorithm",
    "category": "Signatures & cryptography",
    "kicker": "PKI foundations",
    "headline": "The maths that makes a signature verifiable",
    "lead": "A signature algorithm defines how a private key signs a record and how the public key later proves it.",
    "definition": "A Signature Algorithm is the cryptographic method, such as RSA or ECDSA, that defines how a private key produces a digital signature over a record's hash and how a public key verifies it.",
    "why": [
      "It determines the security strength and longevity of every signature produced.",
      "Verifiers must support the same algorithm to validate a signature.",
      "Algorithm choices age, so institutions plan for migration over time."
    ],
    "how": [
      {
        "t": "Hash the record",
        "d": "Reduce the record to a fixed digest the algorithm will sign."
      },
      {
        "t": "Sign with the private key",
        "d": "Apply the algorithm so only the private key holder could have produced the signature."
      },
      {
        "t": "Verify with the public key",
        "d": "Run the algorithm's verification step to confirm the signature matches the record and key."
      }
    ],
    "faqs": [
      {
        "q": "What is a signature algorithm?",
        "a": "A Signature Algorithm is the cryptographic method, such as RSA or ECDSA, that defines how a private key produces a digital signature over a record's hash and how a public key verifies it."
      },
      {
        "q": "Why do algorithm choices matter?",
        "a": "They set the security strength and how long signatures remain trustworthy, and verifiers must support the same algorithm to validate them."
      },
      {
        "q": "Do algorithms become outdated?",
        "a": "Yes. Cryptographic strength is reassessed over time, so institutions plan migrations to stronger algorithms when needed."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "government",
      "defence",
      "standards-bodies"
    ],
    "relatedProblems": [
      "public-private-key-pair",
      "hash-function",
      "key-management",
      "pki-digital-certificate"
    ],
    "diagram": "seal",
    "metaTitle": "Signature Algorithm Explained",
    "metaDescription": "A signature algorithm defines how a private key signs a record's hash and how the public key verifies it, setting each signature's strength."
  },
  {
    "slug": "audit-trail",
    "term": "Audit Trail",
    "category": "Integrity & proof",
    "kicker": "Accountability",
    "headline": "Reconstruct exactly who did what and when",
    "lead": "An audit trail records every action taken against a record so institutions can reconstruct history and answer scrutiny.",
    "definition": "An audit trail is a chronological, tamper-evident record of every action, actor, and timestamp associated with a document or system, captured so that the full history can later be reconstructed and reviewed.",
    "why": [
      "Auditors and courts ask not only what a record says but how it came to say it; a complete trail answers that.",
      "Without attributed actions, accountability collapses into assertion and disputes become unresolvable.",
      "Continuous logging deters internal misuse because every action carries a name and a time."
    ],
    "how": [
      {
        "t": "Capture at the source",
        "d": "Log actions where they happen, recording actor, action, timestamp, and the affected record identifier."
      },
      {
        "t": "Protect the log",
        "d": "Store entries append-only and seal them so later edits are detectable rather than silent."
      },
      {
        "t": "Make it reviewable",
        "d": "Expose the trail through readable views and exports that auditors can follow without special tooling."
      }
    ],
    "faqs": [
      {
        "q": "What is an audit trail?",
        "a": "An audit trail is a chronological, tamper-evident record of every action, actor, and timestamp tied to a document or system, captured so the full history can be reconstructed and reviewed."
      },
      {
        "q": "How is an audit trail different from a log file?",
        "a": "A general log records system events; an audit trail is curated for accountability, attributing each change to an actor and protecting entries from silent alteration."
      },
      {
        "q": "Can an audit trail be altered?",
        "a": "A well-designed trail is append-only and sealed, so alteration is detectable. We say tamper-evident rather than tamper-proof because the goal is reliable detection, not impossible change."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "financial-institutions",
      "supreme-audit-institutions"
    ],
    "relatedProblems": [
      "chain-of-custody",
      "non-repudiation",
      "append-only-log", "circular-letter"],
    "diagram": "ledger",
    "metaTitle": "Audit Trail: Reconstruct Who Did What and When",
    "metaDescription": "An audit trail is a tamper-evident, chronological record of every action, actor, and timestamp on a document, letting institutions reconstruct full history."
  },
  {
    "slug": "chain-of-custody",
    "term": "Chain of Custody",
    "category": "Integrity & proof",
    "kicker": "Provenance",
    "headline": "Prove unbroken control of a record over time",
    "lead": "Chain of custody documents every transfer of a record so its integrity can be defended whenever it is challenged.",
    "definition": "Chain of custody is the documented, unbroken sequence of who held, handled, or transferred a record and when, maintained so that the record's integrity and authenticity can be defended under challenge.",
    "why": [
      "A record is only as trustworthy as the account of how it was kept; gaps invite doubt.",
      "Legal and regulatory proceedings routinely test custody before they weigh content.",
      "Clear handover records contain disputes by showing exactly where responsibility sat at each moment."
    ],
    "how": [
      {
        "t": "Record every transfer",
        "d": "Capture each handover with the parties, time, and the record's verified state at the point of transfer."
      },
      {
        "t": "Bind state to handover",
        "d": "Attach a checksum or seal so the record's content at each transfer is provable, not merely asserted."
      },
      {
        "t": "Detect breaks",
        "d": "Flag any unexplained gap or mismatch so an incomplete chain surfaces before it reaches scrutiny."
      }
    ],
    "faqs": [
      {
        "q": "What is chain of custody?",
        "a": "Chain of custody is the documented, unbroken sequence of who held, handled, or transferred a record and when, maintained so the record's integrity and authenticity can be defended under challenge."
      },
      {
        "q": "Why does a broken chain matter?",
        "a": "An unexplained gap means no one can attest to what happened to the record during that interval, which can render it inadmissible or unreliable."
      },
      {
        "q": "How is custody bound to content?",
        "a": "Each transfer is recorded alongside a checksum or seal of the record, so the state at every handover is verifiable rather than taken on trust."
      }
    ],
    "relatedIndustries": [
      "justice",
      "law-enforcement",
      "customs-border",
      "regulators"
    ],
    "relatedProblems": [
      "evidence-preservation",
      "provenance",
      "audit-trail", "memorandum-of-decision"],
    "diagram": "chain",
    "metaTitle": "Chain of Custody: Prove Unbroken Control of Records",
    "metaDescription": "Chain of custody is the documented, unbroken sequence of who held and transferred a record, maintained so its integrity can be defended under challenge."
  },
  {
    "slug": "non-repudiation",
    "term": "Non-Repudiation",
    "category": "Integrity & proof",
    "kicker": "Accountability",
    "headline": "Stop signatories from denying what they signed",
    "lead": "Non-repudiation binds an action to an identity so strongly that the actor cannot credibly deny it later.",
    "definition": "Non-repudiation is the property by which a party cannot plausibly deny having performed an action or authored a record, because cryptographic and procedural evidence ties the action firmly to their identity.",
    "why": [
      "Approvals and signatures lose force if a signatory can later claim they never acted.",
      "Institutions need to enforce decisions against individuals, not just record that something happened.",
      "Strong attribution discourages reckless or fraudulent action because denial is no longer an exit."
    ],
    "how": [
      {
        "t": "Bind identity to action",
        "d": "Use authenticated signatures so each action carries verifiable proof of the actor behind it."
      },
      {
        "t": "Seal the evidence",
        "d": "Capture the signed content and its timestamp under a seal so the link cannot be quietly rewritten."
      },
      {
        "t": "Preserve the proof",
        "d": "Retain the signature material and verification chain for as long as the record may be questioned."
      }
    ],
    "faqs": [
      {
        "q": "What is non-repudiation?",
        "a": "Non-repudiation is the property by which a party cannot plausibly deny having performed an action or authored a record, because cryptographic and procedural evidence ties the action firmly to their identity."
      },
      {
        "q": "How is it achieved?",
        "a": "It combines authenticated digital signatures, trusted timestamps, and preserved verification evidence so the link between actor and action stays demonstrable over time."
      },
      {
        "q": "Does non-repudiation guarantee a signatory's intent?",
        "a": "No. It proves the action was taken under their credentials; questions of intent or coercion remain matters for procedure and law, not cryptography alone."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "government",
      "notarial-authorities",
      "justice"
    ],
    "relatedProblems": [
      "integrity-proof",
      "trust-anchor",
      "hash-verification", "memorandum-of-decision"],
    "diagram": "seal",
    "metaTitle": "Non-Repudiation: Bind Actions to Identity",
    "metaDescription": "Non-repudiation ensures a party cannot plausibly deny an action, because cryptographic and procedural evidence ties it firmly to their identity."
  },
  {
    "slug": "checksum",
    "term": "Checksum",
    "category": "Integrity & proof",
    "kicker": "Verification",
    "headline": "Catch any change to a file instantly",
    "lead": "A checksum condenses a file into a short value that changes if even one byte changes, exposing corruption or tampering.",
    "definition": "A checksum is a compact value derived from a file's contents so that any alteration, however small, produces a different value, allowing corruption or tampering to be detected by comparison.",
    "why": [
      "Files degrade or are altered in transit and storage, often without any visible sign.",
      "A short comparable value lets verification happen cheaply and repeatedly at scale.",
      "Recipients can confirm they hold exactly the file that was published, byte for byte."
    ],
    "how": [
      {
        "t": "Compute at publication",
        "d": "Generate the checksum when the file is finalized and record it alongside the record."
      },
      {
        "t": "Distribute the value",
        "d": "Publish the checksum so any holder can independently verify their copy."
      },
      {
        "t": "Compare on access",
        "d": "Recompute and compare on retrieval; a mismatch signals corruption or alteration."
      }
    ],
    "faqs": [
      {
        "q": "What is a checksum?",
        "a": "A checksum is a compact value derived from a file's contents so that any alteration, however small, produces a different value, allowing corruption or tampering to be detected by comparison."
      },
      {
        "q": "Is a checksum the same as a cryptographic hash?",
        "a": "A cryptographic hash is a strong checksum designed to resist deliberate forgery. Simple checksums catch accidental corruption but should not be relied on against a motivated adversary."
      },
      {
        "q": "What does a matching checksum prove?",
        "a": "It shows the file is bit-for-bit identical to the version that produced the recorded value, but it does not by itself establish who created the file or when."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "research-institutes",
      "government"
    ],
    "relatedProblems": [
      "hash-verification",
      "fixity-check",
      "data-integrity", "determination"],
    "diagram": "shield",
    "metaTitle": "Checksum: Detect Any Change to a File",
    "metaDescription": "A checksum is a compact value derived from a file's contents so any alteration produces a different value, letting you detect corruption or tampering."
  },
  {
    "slug": "fixity-check",
    "term": "Fixity Check",
    "category": "Integrity & proof",
    "kicker": "Preservation",
    "headline": "Confirm stored records have not silently decayed",
    "lead": "A fixity check periodically reverifies that preserved files remain unchanged, catching silent corruption before it spreads.",
    "definition": "A fixity check is the routine reverification of a stored record's checksum against a recorded baseline, performed to confirm that the file has not changed or degraded while in custody.",
    "why": [
      "Long-term storage suffers bit rot and media failure that corrupt files without warning.",
      "Preservation depends on catching corruption early, while good copies still exist to restore from.",
      "Regular evidence of fixity demonstrates that an archive is actively maintaining integrity, not merely holding files."
    ],
    "how": [
      {
        "t": "Set a baseline",
        "d": "Record each file's checksum at ingest as the reference against which future checks compare."
      },
      {
        "t": "Reverify on schedule",
        "d": "Recompute checksums at defined intervals across the holdings to surface drift."
      },
      {
        "t": "Act on mismatch",
        "d": "On any deviation, quarantine the file and restore from a verified copy, logging the event."
      }
    ],
    "faqs": [
      {
        "q": "What is a fixity check?",
        "a": "A fixity check is the routine reverification of a stored record's checksum against a recorded baseline, performed to confirm that the file has not changed or degraded while in custody."
      },
      {
        "q": "How often should fixity be checked?",
        "a": "Frequency depends on collection value, media reliability, and risk tolerance; many archives run periodic sweeps and verify on every access and transfer."
      },
      {
        "q": "What happens when a fixity check fails?",
        "a": "The affected file is isolated and restored from a known-good copy, and the incident is logged so the cause and scope can be investigated."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "museums",
      "heritage-authorities"
    ],
    "relatedProblems": [
      "checksum",
      "data-integrity",
      "evidence-preservation", "determination"],
    "diagram": "lifecycle",
    "metaTitle": "Fixity Check: Verify Stored Records Stay Unchanged",
    "metaDescription": "A fixity check reverifies a stored record's checksum against its baseline to confirm the file has not changed or degraded while in custody."
  },
  {
    "slug": "immutable-record",
    "term": "Immutable Record",
    "category": "Integrity & proof",
    "kicker": "Integrity",
    "headline": "Keep a record's content fixed once finalized",
    "lead": "An immutable record cannot be altered after it is committed, so what was published is exactly what remains.",
    "definition": "An immutable record is one whose content is fixed at the moment it is committed and cannot subsequently be changed; any correction is made by issuing a new linked record rather than overwriting the original.",
    "why": [
      "Decisions rely on records that will read tomorrow exactly as they read today.",
      "Overwriting destroys the prior state, erasing the evidence needed to reconstruct history.",
      "Fixed originals let corrections be transparent additions rather than silent substitutions."
    ],
    "how": [
      {
        "t": "Commit and freeze",
        "d": "Finalize content and seal it so the stored bytes cannot be edited in place."
      },
      {
        "t": "Correct by addition",
        "d": "Issue a new linked version for any change, preserving the superseded original."
      },
      {
        "t": "Verify on read",
        "d": "Check the seal whenever the record is retrieved to confirm it remains the committed content."
      }
    ],
    "faqs": [
      {
        "q": "What is an immutable record?",
        "a": "An immutable record is one whose content is fixed at the moment it is committed and cannot subsequently be changed; any correction is made by issuing a new linked record rather than overwriting the original."
      },
      {
        "q": "How are mistakes corrected in an immutable record?",
        "a": "Rather than editing the original, a new linked record supersedes it. The original stays intact, so the full history and the correction are both preserved."
      },
      {
        "q": "Is immutability absolute?",
        "a": "Storage can fail or be attacked, so immutability is enforced and made tamper-evident rather than treated as an unbreakable guarantee. Detection and recovery remain essential."
      }
    ],
    "relatedIndustries": [
      "central-banks",
      "land-registries",
      "civil-registration",
      "government"
    ],
    "relatedProblems": [
      "write-once-record",
      "append-only-log",
      "version-integrity", "determination"],
    "diagram": "ledger",
    "metaTitle": "Immutable Record: Fixed Content After Commit",
    "metaDescription": "An immutable record's content is fixed when committed and cannot be changed; corrections are issued as new linked records, preserving the original."
  },
  {
    "slug": "write-once-record",
    "term": "Write-Once Record",
    "category": "Integrity & proof",
    "kicker": "Integrity",
    "headline": "Write a record once, then only ever read it",
    "lead": "A write-once record is committed a single time and thereafter is read-only, removing any path for later modification.",
    "definition": "A write-once record is a record that can be written exactly once and never modified or deleted afterward, enforced so that the original entry remains permanently available for reading and verification.",
    "why": [
      "Some records must be provably original, with no possibility of later edits.",
      "Read-only enforcement removes a whole class of insider and accidental modification risk.",
      "Permanence supports retention obligations that demand records survive intact for fixed periods."
    ],
    "how": [
      {
        "t": "Enforce single write",
        "d": "Allow one commit per record and reject any subsequent write or delete attempt."
      },
      {
        "t": "Seal on commit",
        "d": "Bind a checksum at write time so the read-only state is independently verifiable."
      },
      {
        "t": "Layer with append",
        "d": "Capture related updates as new write-once entries rather than touching the original."
      }
    ],
    "faqs": [
      {
        "q": "What is a write-once record?",
        "a": "A write-once record is a record that can be written exactly once and never modified or deleted afterward, enforced so the original entry remains permanently available for reading and verification."
      },
      {
        "q": "How does write-once differ from immutable?",
        "a": "They overlap closely; write-once stresses the single-write enforcement and read-only access model, while immutability stresses that committed content cannot change."
      },
      {
        "q": "Can a write-once record be retired?",
        "a": "It can be marked superseded or expired under retention rules, but the original entry itself is not edited or deleted while it must remain available."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "securities-regulators",
      "regulators",
      "central-banks"
    ],
    "relatedProblems": [
      "immutable-record",
      "append-only-log",
      "sealed-record", "ruling"],
    "diagram": "ledger",
    "metaTitle": "Write-Once Record: Write Once, Read Forever",
    "metaDescription": "A write-once record can be written exactly once and never modified or deleted, keeping the original permanently available for reading and verification."
  },
  {
    "slug": "integrity-proof",
    "term": "Integrity Proof",
    "category": "Integrity & proof",
    "kicker": "Verification",
    "headline": "Carry evidence that a record is unchanged",
    "lead": "An integrity proof is portable evidence that lets anyone confirm a record is exactly as it was sealed.",
    "definition": "An integrity proof is a self-contained, verifiable piece of evidence, typically cryptographic, that demonstrates a record has not changed since it was sealed, checkable by any party without trusting the holder.",
    "why": [
      "Trust should not require taking the custodian's word that a record is unchanged.",
      "Independent verifiability lets recipients confirm integrity even across institutional boundaries.",
      "Portable proofs survive migrations and handovers that would otherwise reset confidence."
    ],
    "how": [
      {
        "t": "Generate at seal",
        "d": "Produce the proof when the record is committed, binding it to the exact content."
      },
      {
        "t": "Travel with the record",
        "d": "Distribute the proof alongside the record so verification needs no back-channel."
      },
      {
        "t": "Verify independently",
        "d": "Let any party recompute and check the proof against the content they hold."
      }
    ],
    "faqs": [
      {
        "q": "What is an integrity proof?",
        "a": "An integrity proof is a self-contained, verifiable piece of evidence, typically cryptographic, that demonstrates a record has not changed since it was sealed, checkable by any party without trusting the holder."
      },
      {
        "q": "Who can verify an integrity proof?",
        "a": "Anyone with the record and the proof can verify it, including parties outside the issuing institution, which is what makes the evidence portable and independent."
      },
      {
        "q": "Does an integrity proof show authorship?",
        "a": "It establishes that content is unchanged. Authorship and authorization come from signatures and identity binding, which are complementary rather than the same thing."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "standards-bodies",
      "intellectual-property",
      "government"
    ],
    "relatedProblems": [
      "hash-verification",
      "proof-of-integrity",
      "non-repudiation", "ruling"],
    "diagram": "shield",
    "metaTitle": "Integrity Proof: Verifiable Evidence a Record Is Unchanged",
    "metaDescription": "An integrity proof is self-contained cryptographic evidence that a record is unchanged since sealing, checkable by any party without trusting the holder."
  },
  {
    "slug": "provenance",
    "term": "Provenance",
    "category": "Integrity & proof",
    "kicker": "Provenance",
    "headline": "Trace a record back to its origin",
    "lead": "Provenance documents where a record came from and how it changed, so its origin and lineage can be trusted.",
    "definition": "Provenance is the documented origin and history of a record, capturing its source, authorship, and the sequence of changes it underwent, so its lineage and authenticity can be established.",
    "why": [
      "Confidence in a record depends on knowing where it came from and what shaped it.",
      "Provenance distinguishes an authoritative original from a derivative or a forgery.",
      "Documented lineage supports reuse, citation, and accountability across institutions."
    ],
    "how": [
      {
        "t": "Record origin",
        "d": "Capture source, author, and the conditions under which the record was created."
      },
      {
        "t": "Track transformations",
        "d": "Log each change with its actor and time so the lineage is continuous."
      },
      {
        "t": "Bind to the record",
        "d": "Attach provenance metadata under a seal so it travels with and matches the record."
      }
    ],
    "faqs": [
      {
        "q": "What is provenance?",
        "a": "Provenance is the documented origin and history of a record, capturing its source, authorship, and the sequence of changes it underwent, so its lineage and authenticity can be established."
      },
      {
        "q": "How does provenance differ from an audit trail?",
        "a": "An audit trail logs actions within a system; provenance is the broader account of origin and lineage, often spanning systems and including authorship and source context."
      },
      {
        "q": "Why is provenance important for authenticity?",
        "a": "Authenticity rests on being able to show a record is what it claims to be; provenance supplies the origin and lineage that support or refute that claim."
      }
    ],
    "relatedIndustries": [
      "museums",
      "archives",
      "heritage-authorities",
      "intellectual-property"
    ],
    "relatedProblems": [
      "record-provenance",
      "chain-of-custody",
      "data-integrity", "ruling"],
    "diagram": "chain",
    "metaTitle": "Provenance: Trace a Record to Its Origin",
    "metaDescription": "Provenance is the documented origin and history of a record, capturing source, authorship, and changes so its lineage and authenticity can be established."
  },
  {
    "slug": "data-integrity",
    "term": "Data Integrity",
    "category": "Integrity & proof",
    "kicker": "Integrity",
    "headline": "Keep data accurate and unchanged end to end",
    "lead": "Data integrity ensures information stays accurate, complete, and consistent from creation through every use and transfer.",
    "definition": "Data integrity is the assurance that data remains accurate, complete, and consistent across its entire lifecycle, with any unauthorized or accidental change being prevented or detectable.",
    "why": [
      "Decisions built on corrupted or altered data inherit those defects, often invisibly.",
      "Integrity spans creation, storage, processing, and transfer, so any weak link undermines the whole.",
      "Demonstrable integrity is increasingly a regulatory expectation, not just good practice."
    ],
    "how": [
      {
        "t": "Control changes",
        "d": "Restrict who can modify data and require authenticated, recorded actions for every change."
      },
      {
        "t": "Detect alteration",
        "d": "Apply checksums and validation so unauthorized or accidental changes surface quickly."
      },
      {
        "t": "Preserve consistency",
        "d": "Use controls that keep related data coherent across copies, systems, and transfers."
      }
    ],
    "faqs": [
      {
        "q": "What is data integrity?",
        "a": "Data integrity is the assurance that data remains accurate, complete, and consistent across its entire lifecycle, with any unauthorized or accidental change being prevented or detectable."
      },
      {
        "q": "How is data integrity different from data security?",
        "a": "Security protects data from unauthorized access; integrity concerns whether the data is correct and unchanged. They overlap but answer different questions."
      },
      {
        "q": "What threatens data integrity?",
        "a": "Hardware faults, software bugs, transfer errors, and deliberate tampering can all corrupt data, which is why both prevention and detection controls are needed."
      }
    ],
    "relatedIndustries": [
      "pharmaceuticals",
      "healthcare",
      "regulators",
      "national-statistics"
    ],
    "relatedProblems": [
      "checksum",
      "version-integrity",
      "tamper-detection", "order"],
    "diagram": "shield",
    "metaTitle": "Data Integrity: Accurate, Unchanged Data End to End",
    "metaDescription": "Data integrity assures data stays accurate, complete, and consistent across its lifecycle, with unauthorized or accidental change prevented or detectable."
  },
  {
    "slug": "version-integrity",
    "term": "Version Integrity",
    "category": "Integrity & proof",
    "kicker": "Integrity",
    "headline": "Know precisely which version you are trusting",
    "lead": "Version integrity ties each revision to verifiable evidence so the right version is always identifiable and intact.",
    "definition": "Version integrity is the assurance that every revision of a record is uniquely identified, unaltered, and correctly ordered, so the precise version a party relies on can be confirmed and distinguished from all others.",
    "why": [
      "Acting on the wrong version of a policy or record causes real and avoidable harm.",
      "Without verifiable versioning, an outdated or altered copy can masquerade as current.",
      "Clear lineage between versions makes corrections auditable rather than confusing."
    ],
    "how": [
      {
        "t": "Identify each version",
        "d": "Assign a unique identifier and checksum to every revision at the moment it is committed."
      },
      {
        "t": "Order and link",
        "d": "Record the sequence and the relationship between versions so supersession is explicit."
      },
      {
        "t": "Verify on use",
        "d": "Confirm the identifier and checksum when a version is consumed to prove it is the intended one."
      }
    ],
    "faqs": [
      {
        "q": "What is version integrity?",
        "a": "Version integrity is the assurance that every revision of a record is uniquely identified, unaltered, and correctly ordered, so the precise version a party relies on can be confirmed and distinguished from all others."
      },
      {
        "q": "How is version integrity enforced?",
        "a": "Each revision receives a unique identifier and checksum, versions are explicitly ordered and linked, and identifiers are verified at the point of use."
      },
      {
        "q": "Why not just keep the latest version?",
        "a": "Earlier versions are often legally and operationally significant. Version integrity preserves and distinguishes all of them, not only the current one."
      }
    ],
    "relatedIndustries": [
      "standards-bodies",
      "regulators",
      "government",
      "professional-bodies"
    ],
    "relatedProblems": [
      "immutable-record",
      "data-integrity",
      "record-provenance", "order"],
    "diagram": "lifecycle",
    "metaTitle": "Version Integrity: Know Which Version You Trust",
    "metaDescription": "Version integrity ensures every revision is uniquely identified, unaltered, and correctly ordered, so the precise version relied on can be confirmed."
  },
  {
    "slug": "hash-verification",
    "term": "Hash Verification",
    "category": "Integrity & proof",
    "kicker": "Verification",
    "headline": "Confirm a file matches its expected fingerprint",
    "lead": "Hash verification recomputes a record's cryptographic fingerprint and compares it to an expected value to confirm integrity.",
    "definition": "Hash verification is the process of recomputing a record's cryptographic hash and comparing it to a trusted expected value, confirming that the record is unaltered when the values match.",
    "why": [
      "A cryptographic hash detects any change, however subtle, including deliberate forgery.",
      "Recomputation lets recipients verify integrity themselves without trusting the source.",
      "Matching hashes provide a clear, binary signal that scales across large holdings."
    ],
    "how": [
      {
        "t": "Record the expected hash",
        "d": "Compute and securely store the hash when the record is sealed."
      },
      {
        "t": "Recompute on check",
        "d": "Generate the hash again from the current bytes whenever verification is needed."
      },
      {
        "t": "Compare and decide",
        "d": "A match confirms integrity; a mismatch flags alteration or corruption for action."
      }
    ],
    "faqs": [
      {
        "q": "What is hash verification?",
        "a": "Hash verification is the process of recomputing a record's cryptographic hash and comparing it to a trusted expected value, confirming that the record is unaltered when the values match."
      },
      {
        "q": "Why use a cryptographic hash rather than a simple checksum?",
        "a": "Cryptographic hashes are designed to resist deliberate forgery, so a match is meaningful even against a motivated adversary, not just accidental corruption."
      },
      {
        "q": "What does a hash mismatch indicate?",
        "a": "It means the current content differs from when the expected hash was recorded, signalling corruption or tampering that warrants investigation."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "financial-institutions",
      "intellectual-property",
      "research-institutes"
    ],
    "relatedProblems": [
      "checksum",
      "integrity-proof",
      "tamper-detection", "issuer-identity-verification", "source-verification", "instant-verification"],
    "diagram": "shield",
    "metaTitle": "Hash Verification: Confirm a File's Fingerprint",
    "metaDescription": "Hash verification recomputes a record's cryptographic hash and compares it to a trusted expected value, confirming the record is unaltered when they match."
  },
  {
    "slug": "tamper-detection",
    "term": "Tamper Detection",
    "category": "Integrity & proof",
    "kicker": "Verification",
    "headline": "Surface unauthorized changes the moment they occur",
    "lead": "Tamper detection makes any unauthorized alteration to a record visible, turning silent edits into detectable events.",
    "definition": "Tamper detection is the capability to reliably reveal any unauthorized alteration to a record, making changes evident through cryptographic seals, checksums, or linked logs rather than allowing them to pass unnoticed.",
    "why": [
      "The danger of tampering is its silence; undetected changes erode trust without warning.",
      "Making alteration evident shifts the burden, since any change must now survive verification.",
      "Visible tamper-evidence supports investigation and accountability after an incident."
    ],
    "how": [
      {
        "t": "Seal the baseline",
        "d": "Bind a cryptographic seal or hash to the record's committed state."
      },
      {
        "t": "Reverify continuously",
        "d": "Check the record against its seal on access and on a schedule to catch drift."
      },
      {
        "t": "Alert and log",
        "d": "Raise an alert and record the event whenever verification fails, preserving evidence."
      }
    ],
    "faqs": [
      {
        "q": "What is tamper detection?",
        "a": "Tamper detection is the capability to reliably reveal any unauthorized alteration to a record, making changes evident through cryptographic seals, checksums, or linked logs rather than allowing them to pass unnoticed."
      },
      {
        "q": "Is tamper detection the same as tamper-proofing?",
        "a": "No. We favour tamper-evident over tamper-proof: the realistic goal is to make any change reliably detectable, not to claim change is impossible."
      },
      {
        "q": "What should happen when tampering is detected?",
        "a": "The system should alert responsible parties, log the event, isolate the affected record, and restore from a verified copy while the cause is investigated."
      }
    ],
    "relatedIndustries": [
      "justice",
      "law-enforcement",
      "regulators",
      "financial-institutions"
    ],
    "relatedProblems": [
      "hash-verification",
      "sealed-record",
      "data-integrity", "by-law"],
    "diagram": "shield",
    "metaTitle": "Tamper Detection: Surface Unauthorized Changes",
    "metaDescription": "Tamper detection reliably reveals any unauthorized alteration to a record through seals, checksums, or linked logs, turning silent edits into evident events."
  },
  {
    "slug": "append-only-log",
    "term": "Append-Only Log",
    "category": "Integrity & proof",
    "kicker": "Integrity",
    "headline": "Add entries forever, change none of them",
    "lead": "An append-only log accepts new entries but never edits or deletes existing ones, preserving a faithful history.",
    "definition": "An append-only log is a sequential record to which entries can only be added, never altered or removed, so the accumulated history remains complete and any attempt to rewrite the past is detectable.",
    "why": [
      "Histories that can be edited can be falsified; append-only removes that path.",
      "A complete, ordered sequence is the foundation for audit, reconstruction, and dispute resolution.",
      "Linking entries makes any insertion or deletion break the chain and become visible."
    ],
    "how": [
      {
        "t": "Permit only appends",
        "d": "Accept new entries at the end and reject edits or deletions of prior entries."
      },
      {
        "t": "Chain entries",
        "d": "Bind each entry to its predecessor so the sequence cannot be silently rewritten."
      },
      {
        "t": "Verify the chain",
        "d": "Recheck the links to confirm completeness and detect any broken or reordered history."
      }
    ],
    "faqs": [
      {
        "q": "What is an append-only log?",
        "a": "An append-only log is a sequential record to which entries can only be added, never altered or removed, so the accumulated history remains complete and any attempt to rewrite the past is detectable."
      },
      {
        "q": "How does an append-only log resist tampering?",
        "a": "Entries are chained so each depends on the prior one; removing, editing, or reordering any entry breaks the chain and is detectable on verification."
      },
      {
        "q": "Can entries ever be removed for legal reasons?",
        "a": "Rather than deleting, an append-only design records a new entry that marks or supersedes the earlier one, preserving the integrity of the sequence."
      }
    ],
    "relatedIndustries": [
      "central-banks",
      "financial-institutions",
      "regulators",
      "electoral-commissions"
    ],
    "relatedProblems": [
      "audit-trail",
      "immutable-record",
      "write-once-record", "by-law"],
    "diagram": "ledger",
    "metaTitle": "Append-Only Log: Add Entries, Change None",
    "metaDescription": "An append-only log accepts new entries but never edits or deletes existing ones, keeping a complete history where any rewrite of the past is detectable."
  },
  {
    "slug": "sealed-record",
    "term": "Sealed Record",
    "category": "Integrity & proof",
    "kicker": "Integrity",
    "headline": "Lock a record's state with a verifiable seal",
    "lead": "A sealed record carries a cryptographic seal that binds its content, so any later change breaks the seal visibly.",
    "definition": "A sealed record is a record whose committed content is bound by a cryptographic seal, such that the content can be verified as authentic and unchanged, and any alteration invalidates the seal.",
    "why": [
      "A seal turns a static file into something whose integrity can be checked at any time.",
      "Binding content to a seal lets recipients trust the record without trusting the channel.",
      "An invalidated seal is an unmistakable signal that the record has been disturbed."
    ],
    "how": [
      {
        "t": "Seal at commit",
        "d": "Bind a cryptographic seal to the record's exact content when it is finalized."
      },
      {
        "t": "Distribute with proof",
        "d": "Provide the seal alongside the record so any holder can verify it."
      },
      {
        "t": "Check the seal",
        "d": "Verify on access; a broken seal flags alteration and triggers response."
      }
    ],
    "faqs": [
      {
        "q": "What is a sealed record?",
        "a": "A sealed record is a record whose committed content is bound by a cryptographic seal, such that the content can be verified as authentic and unchanged, and any alteration invalidates the seal."
      },
      {
        "q": "What does it mean if a seal is invalid?",
        "a": "An invalid seal means the content no longer matches what was sealed, indicating alteration or corruption that should be investigated and the record restored."
      },
      {
        "q": "Does sealing prevent change?",
        "a": "Sealing makes change tamper-evident rather than impossible. Anyone can still alter their copy, but the broken seal reveals it on verification."
      }
    ],
    "relatedIndustries": [
      "government",
      "notarial-authorities",
      "land-registries",
      "regulators"
    ],
    "relatedProblems": [
      "tamper-detection",
      "proof-of-integrity",
      "integrity-proof", "by-law"],
    "diagram": "seal",
    "metaTitle": "Sealed Record: Lock State with a Verifiable Seal",
    "metaDescription": "A sealed record binds its committed content with a cryptographic seal, so the content verifies as unchanged and any alteration invalidates the seal."
  },
  {
    "slug": "proof-of-integrity",
    "term": "Proof of Integrity",
    "category": "Integrity & proof",
    "kicker": "Verification",
    "headline": "Demonstrate integrity on demand to any verifier",
    "lead": "Proof of integrity lets an institution show, with evidence anyone can check, that a record is unchanged since sealing.",
    "definition": "Proof of integrity is demonstrable, independently checkable evidence that a record remains exactly as it was committed, presented on demand so any verifier can confirm integrity without relying on the custodian's assurance.",
    "why": [
      "Assurances carry little weight in disputes; checkable evidence settles them.",
      "On-demand proof lets integrity be confirmed at the moment a record is questioned.",
      "Independent verification withstands scrutiny that internal claims cannot."
    ],
    "how": [
      {
        "t": "Anchor the baseline",
        "d": "Record a trusted hash or seal of the committed content as the reference point."
      },
      {
        "t": "Produce on request",
        "d": "Generate verifiable proof that the current content matches the anchored baseline."
      },
      {
        "t": "Enable third-party checks",
        "d": "Provide the evidence and method so external parties can verify for themselves."
      }
    ],
    "faqs": [
      {
        "q": "What is proof of integrity?",
        "a": "Proof of integrity is demonstrable, independently checkable evidence that a record remains exactly as it was committed, presented on demand so any verifier can confirm integrity without relying on the custodian's assurance."
      },
      {
        "q": "How does it differ from an integrity proof?",
        "a": "They are closely related; proof of integrity emphasizes the act of demonstrating integrity on demand to a verifier, while an integrity proof is the portable evidence artifact itself."
      },
      {
        "q": "What does proof of integrity not establish?",
        "a": "It confirms content is unchanged, not who authored or authorized it. Identity and authorization rest on signatures and procedure, which complement the proof."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "supreme-audit-institutions",
      "justice",
      "financial-institutions"
    ],
    "relatedProblems": [
      "integrity-proof",
      "hash-verification",
      "sealed-record", "ordinance"],
    "diagram": "shield",
    "metaTitle": "Proof of Integrity: Demonstrate Records Are Unchanged",
    "metaDescription": "Proof of integrity is independently checkable evidence that a record is exactly as committed, presented on demand so any verifier can confirm it."
  },
  {
    "slug": "record-provenance",
    "term": "Record Provenance",
    "category": "Integrity & proof",
    "kicker": "Provenance",
    "headline": "Bind a record to its full documented lineage",
    "lead": "Record provenance attaches a verifiable account of origin and custody to each record, making its lineage part of the record.",
    "definition": "Record provenance is the verifiable lineage bound to an individual record, documenting its origin, authorship, custody, and changes so that the record itself carries the evidence of where it came from.",
    "why": [
      "A record evaluated without its lineage invites doubt about its authenticity.",
      "Binding provenance to the record keeps origin evidence from being lost in handovers.",
      "Verifiable lineage supports admissibility, citation, and confident reuse."
    ],
    "how": [
      {
        "t": "Capture lineage",
        "d": "Record origin, authorship, custody transfers, and changes as the record's history."
      },
      {
        "t": "Bind to the record",
        "d": "Seal the provenance metadata to the record so the two cannot be separated unnoticed."
      },
      {
        "t": "Verify lineage",
        "d": "Check the bound provenance on access to confirm it is intact and consistent."
      }
    ],
    "faqs": [
      {
        "q": "What is record provenance?",
        "a": "Record provenance is the verifiable lineage bound to an individual record, documenting its origin, authorship, custody, and changes so that the record itself carries the evidence of where it came from."
      },
      {
        "q": "How does it relate to chain of custody?",
        "a": "Chain of custody focuses on the sequence of who held a record; record provenance is broader, also capturing origin, authorship, and transformations bound to the record."
      },
      {
        "q": "Why bind provenance to the record itself?",
        "a": "Separately stored metadata can be lost or mismatched in transfers. Binding it under a seal keeps lineage with the record and makes separation detectable."
      }
    ],
    "relatedIndustries": [
      "archives",
      "museums",
      "intellectual-property",
      "national-libraries"
    ],
    "relatedProblems": [
      "provenance",
      "chain-of-custody",
      "version-integrity", "ordinance"],
    "diagram": "chain",
    "metaTitle": "Record Provenance: Bind Lineage to the Record",
    "metaDescription": "Record provenance binds verifiable lineage, origin, authorship, custody, and changes to each record, so it carries evidence of where it came from."
  },
  {
    "slug": "trust-anchor",
    "term": "Trust Anchor",
    "category": "Integrity & proof",
    "kicker": "Trust",
    "headline": "Root verification in one authoritative reference",
    "lead": "A trust anchor is the authoritative starting point from which a chain of verification derives its trust.",
    "definition": "A trust anchor is an authoritative, independently trusted reference, such as a root key or published baseline, from which verification chains derive their trust, so that confidence in many records traces back to one well-protected source.",
    "why": [
      "Verification must begin somewhere trusted; without an anchor, every check is circular.",
      "Concentrating trust in a protected root lets it be guarded with proportionate rigor.",
      "A shared anchor lets independent parties reach the same verification result."
    ],
    "how": [
      {
        "t": "Establish the anchor",
        "d": "Define and publish the authoritative reference, such as a root key or sealed baseline."
      },
      {
        "t": "Protect it rigorously",
        "d": "Guard the anchor with strong controls, since trust in everything derived depends on it."
      },
      {
        "t": "Chain verification to it",
        "d": "Build proofs that trace back to the anchor so confidence has a clear, checkable root."
      }
    ],
    "faqs": [
      {
        "q": "What is a trust anchor?",
        "a": "A trust anchor is an authoritative, independently trusted reference, such as a root key or published baseline, from which verification chains derive their trust, so that confidence in many records traces back to one well-protected source."
      },
      {
        "q": "Why does a trust anchor need strong protection?",
        "a": "Because everything verified through it inherits its trust, compromise of the anchor undermines all derived proofs, so it warrants the most rigorous safeguards."
      },
      {
        "q": "Can there be more than one trust anchor?",
        "a": "Yes. Institutions often maintain multiple anchors for different domains, and may rotate or cross-certify them under controlled procedures."
      }
    ],
    "relatedIndustries": [
      "central-banks",
      "government",
      "standards-bodies",
      "data-protection"
    ],
    "relatedProblems": [
      "non-repudiation",
      "integrity-proof",
      "proof-of-integrity", "ordinance"],
    "diagram": "chain",
    "metaTitle": "Trust Anchor: Root Verification in One Reference",
    "metaDescription": "A trust anchor is an authoritative, independently trusted reference from which verification chains derive trust, rooting confidence in one protected source."
  },
  {
    "slug": "evidence-preservation",
    "term": "Evidence Preservation",
    "category": "Integrity & proof",
    "kicker": "Preservation",
    "headline": "Keep evidence intact, attributable, and admissible",
    "lead": "Evidence preservation safeguards records so they stay intact, attributable, and defensible from collection through to use.",
    "definition": "Evidence preservation is the disciplined safeguarding of records and their integrity, custody, and context from the moment of collection onward, so that they remain intact, attributable, and admissible when needed.",
    "why": [
      "Evidence that cannot be shown intact and properly handled may be excluded or discounted.",
      "Integrity and custody must be maintained continuously, not reconstructed after the fact.",
      "Preserving context alongside content keeps evidence meaningful and defensible over time."
    ],
    "how": [
      {
        "t": "Secure on collection",
        "d": "Capture the record, seal its state, and begin custody documentation immediately."
      },
      {
        "t": "Maintain custody and fixity",
        "d": "Track every transfer and reverify integrity so intactness is demonstrable throughout."
      },
      {
        "t": "Preserve context",
        "d": "Retain provenance and surrounding metadata so the evidence remains interpretable and admissible."
      }
    ],
    "faqs": [
      {
        "q": "What is evidence preservation?",
        "a": "Evidence preservation is the disciplined safeguarding of records and their integrity, custody, and context from the moment of collection onward, so that they remain intact, attributable, and admissible when needed."
      },
      {
        "q": "Why is preservation more than just storage?",
        "a": "Storage keeps bytes; preservation also maintains custody, fixity, and context so the evidence stays defensible and admissible, not merely retained."
      },
      {
        "q": "Does evidence preservation guarantee admissibility?",
        "a": "No. It strengthens the case for admissibility by maintaining integrity and custody, but admissibility ultimately rests with the relevant legal or regulatory authority."
      }
    ],
    "relatedIndustries": [
      "justice",
      "law-enforcement",
      "anti-corruption-agencies",
      "regulators"
    ],
    "relatedProblems": [
      "chain-of-custody",
      "fixity-check",
      "audit-trail", "code-of-practice"],
    "diagram": "lifecycle",
    "metaTitle": "Evidence Preservation: Keep Records Admissible",
    "metaDescription": "Evidence preservation safeguards records' integrity, custody, and context from collection onward, so they stay intact, attributable, and admissible when needed."
  },
  {
    "slug": "records-retention",
    "term": "Records Retention",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Keep the right records for exactly the right time",
    "lead": "Retention turns ad hoc keeping into a defensible discipline, balancing legal duty against the cost and risk of holding data too long.",
    "definition": "Records retention is the practice of keeping records for a defined period determined by legal, regulatory, operational, and historical requirements, then disposing of them in a controlled way once that period ends.",
    "why": [
      "Holding records longer than required inflates storage cost and expands the surface for breach, discovery, and subpoena.",
      "Disposing of records too early can breach statutory duties and destroy evidence an organisation may later need.",
      "A documented retention basis lets an institution defend both what it kept and what it deleted under scrutiny."
    ],
    "how": [
      {
        "t": "Establish requirements",
        "d": "Map the legal, regulatory, and business obligations that set minimum and maximum holding periods for each kind of record."
      },
      {
        "t": "Apply consistently",
        "d": "Bind retention rules to record types so the same duration is applied uniformly across systems and locations."
      },
      {
        "t": "Trigger disposition",
        "d": "Use defined start events and clocks to flag records for review and controlled destruction or transfer at term."
      }
    ],
    "faqs": [
      {
        "q": "What is records retention?",
        "a": "Records retention is the practice of keeping records for a defined period set by legal, regulatory, operational, and historical requirements, then disposing of them in a controlled way once that period ends."
      },
      {
        "q": "Is keeping everything forever safer?",
        "a": "No. Over-retention raises storage cost and legal exposure, and many regimes require deletion once a lawful purpose ends, so indefinite keeping can itself be a breach."
      },
      {
        "q": "Who decides retention periods?",
        "a": "Periods derive from statute, regulation, and business need, typically codified by records and legal teams into an approved schedule rather than left to individual judgement."
      }
    ],
    "relatedIndustries": [
      "government",
      "healthcare",
      "financial-institutions",
      "regulators"
    ],
    "relatedProblems": [
      "retention-schedule",
      "records-disposition",
      "statutory-retention",
      "legal-hold"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Records Retention | Sovereign Dispatch",
    "metaDescription": "Records retention keeps records for a defined, defensible period, then disposes of them in a controlled way. Learn the requirements, triggers, and risks."
  },
  {
    "slug": "retention-schedule",
    "term": "Retention Schedule",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "One authority for how long every record lives",
    "lead": "A retention schedule converts scattered rules into a single, auditable instrument that staff and systems can act on with confidence.",
    "definition": "A retention schedule is a controlled document that lists an organisation's record types and assigns each a retention period and a final disposition action, anchored to the legal and business basis for that decision.",
    "why": [
      "Without a single schedule, retention decisions fragment across teams and become impossible to defend or audit.",
      "A schedule lets disposition be automated and consistent rather than dependent on individual memory.",
      "Regulators and auditors expect a documented basis for every retention and destruction decision."
    ],
    "how": [
      {
        "t": "Inventory record types",
        "d": "Group holdings into record series or classes that share a common retention requirement and disposition."
      },
      {
        "t": "Assign periods and actions",
        "d": "Set a retention period and final action for each entry, citing the statutory or business authority behind it."
      },
      {
        "t": "Approve and version",
        "d": "Submit the schedule for formal approval and maintain dated versions so each decision traces to the rule in force."
      }
    ],
    "faqs": [
      {
        "q": "What is a retention schedule?",
        "a": "A retention schedule is a controlled document listing an organisation's record types and assigning each a retention period and final disposition action, anchored to the legal and business basis for the decision."
      },
      {
        "q": "How is it different from a retention policy?",
        "a": "A policy states principles and responsibilities; a schedule is the operational instrument that assigns concrete periods and disposition actions to specific record types."
      },
      {
        "q": "How often should it be reviewed?",
        "a": "Schedules are reviewed on a regular cycle and whenever law, regulation, or business activity changes, with each revision versioned for traceability."
      }
    ],
    "relatedIndustries": [
      "government",
      "universities",
      "regulators",
      "archives"
    ],
    "relatedProblems": [
      "records-retention",
      "records-classification",
      "records-disposition",
      "disposal-authority"
    ],
    "diagram": "ledger",
    "metaTitle": "Retention Schedule | Sovereign Dispatch",
    "metaDescription": "A retention schedule assigns each record type a retention period and disposition action with a documented authority. Learn how to build and govern one."
  },
  {
    "slug": "records-lifecycle",
    "term": "Records Lifecycle",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Govern a record from creation to final fate",
    "lead": "The lifecycle view treats every record as a managed asset with distinct stages, each carrying its own controls and risks.",
    "definition": "The records lifecycle is the sequence of stages a record passes through, from creation and active use to inactive storage and ultimate disposition by destruction or permanent archival.",
    "why": [
      "Treating records as static files hides the changing controls each stage demands, from access to preservation.",
      "A lifecycle model lets governance attach the right action to the right moment instead of reacting late.",
      "Mapping stages exposes where records linger past their useful life and accumulate avoidable risk."
    ],
    "how": [
      {
        "t": "Define the stages",
        "d": "Name the lifecycle phases your records move through and the controls that apply within each."
      },
      {
        "t": "Attach transitions",
        "d": "Specify the events that move a record from one stage to the next, such as case closure or supersession."
      },
      {
        "t": "Govern each phase",
        "d": "Apply access, storage, and retention rules appropriate to the stage and record the moves for audit."
      }
    ],
    "faqs": [
      {
        "q": "What is the records lifecycle?",
        "a": "The records lifecycle is the sequence of stages a record passes through, from creation and active use to inactive storage and ultimate disposition by destruction or permanent archival."
      },
      {
        "q": "Why model records as a lifecycle?",
        "a": "Because the controls a record needs change over time; a lifecycle model lets governance apply the right access, storage, and disposition action at each stage."
      },
      {
        "q": "Where does retention fit?",
        "a": "Retention governs how long a record stays in active and inactive stages before the lifecycle ends in disposition, whether destruction or transfer to archive."
      }
    ],
    "relatedIndustries": [
      "government",
      "healthcare",
      "archives",
      "universities"
    ],
    "relatedProblems": [
      "records-retention",
      "records-disposition",
      "transfer-to-archive",
      "recordkeeping"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Records Lifecycle | Sovereign Dispatch",
    "metaDescription": "The records lifecycle spans creation, active use, inactive storage, and disposition. Learn the stages, transitions, and controls for each phase."
  },
  {
    "slug": "records-disposition",
    "term": "Records Disposition",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "End a record's life on the record",
    "lead": "Disposition is the controlled, evidenced final act of recordkeeping, closing the loop on every retention decision an institution makes.",
    "definition": "Records disposition is the final action taken on a record when its retention period ends, either secure destruction or transfer to permanent archival, carried out and documented under an approved authority.",
    "why": [
      "Uncontrolled destruction can erase evidence and breach legal duties, exposing the organisation to sanction.",
      "Documented disposition proves a record was destroyed lawfully rather than to conceal or evade.",
      "Clear disposition prevents indefinite accumulation that drives cost and discovery exposure."
    ],
    "how": [
      {
        "t": "Confirm eligibility",
        "d": "Verify the retention period has elapsed and no legal hold or pending request blocks the action."
      },
      {
        "t": "Execute the action",
        "d": "Carry out secure destruction or transfer to archive as the schedule specifies for that record series."
      },
      {
        "t": "Record the proof",
        "d": "Capture who authorised and performed the disposition, when, and under which schedule entry."
      }
    ],
    "faqs": [
      {
        "q": "What is records disposition?",
        "a": "Records disposition is the final action taken on a record when its retention period ends, either secure destruction or transfer to permanent archival, carried out and documented under an approved authority."
      },
      {
        "q": "Is disposition always destruction?",
        "a": "No. Disposition can mean destruction for routine records or transfer to permanent archive for records with enduring legal, historical, or evidential value."
      },
      {
        "q": "Why document disposition?",
        "a": "A disposition record proves the action was lawful and authorised, which protects the organisation if the destruction is later questioned."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "archives",
      "justice"
    ],
    "relatedProblems": [
      "records-retention",
      "retention-schedule",
      "disposal-authority",
      "transfer-to-archive"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Records Disposition | Sovereign Dispatch",
    "metaDescription": "Records disposition is the documented final action, destruction or archival, taken when retention ends under approved authority. Learn how to do it defensibly."
  },
  {
    "slug": "recordkeeping",
    "term": "Recordkeeping",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Make records reliable evidence of what happened",
    "lead": "Recordkeeping is the discipline that ensures decisions and transactions leave behind trustworthy, usable evidence rather than scattered files.",
    "definition": "Recordkeeping is the systematic creation, capture, and maintenance of records as authentic and reliable evidence of an organisation's activities, decisions, and obligations.",
    "why": [
      "Without disciplined recordkeeping, an organisation cannot reliably prove what it decided or did.",
      "Sound recordkeeping underpins accountability, audit, and the ability to respond to legal demands.",
      "Records captured without integrity controls lose evidential weight precisely when they are most needed."
    ],
    "how": [
      {
        "t": "Capture at the source",
        "d": "Record activities and decisions as they happen, with enough context to make them meaningful later."
      },
      {
        "t": "Fix metadata",
        "d": "Bind identity, date, author, and classification to each record so it remains findable and interpretable."
      },
      {
        "t": "Maintain integrity",
        "d": "Protect records against unauthorised change and preserve them for their full retention period."
      }
    ],
    "faqs": [
      {
        "q": "What is recordkeeping?",
        "a": "Recordkeeping is the systematic creation, capture, and maintenance of records as authentic and reliable evidence of an organisation's activities, decisions, and obligations."
      },
      {
        "q": "How does it differ from data storage?",
        "a": "Storage simply holds data; recordkeeping ensures records are authentic, reliable, and contextual enough to serve as evidence over their full retention period."
      },
      {
        "q": "What makes a record trustworthy?",
        "a": "Trustworthiness rests on authenticity, integrity, reliability, and usability, supported by metadata and controls that prevent undetected alteration."
      }
    ],
    "relatedIndustries": [
      "government",
      "justice",
      "healthcare",
      "financial-institutions"
    ],
    "relatedProblems": [
      "recordkeeping-system",
      "recordkeeping-metadata",
      "records-classification",
      "records-retention"
    ],
    "diagram": "ledger",
    "metaTitle": "Recordkeeping | Sovereign Dispatch",
    "metaDescription": "Recordkeeping is the disciplined creation and maintenance of records as authentic, reliable evidence. Learn the controls that give records evidential weight."
  },
  {
    "slug": "file-plan",
    "term": "File Plan",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Give every record a known, logical home",
    "lead": "A file plan is the map that tells staff and systems where each record belongs and how it should be governed.",
    "definition": "A file plan is a structured scheme that organises an organisation's records into logical groupings, linking each grouping to its classification, access rules, and retention requirements.",
    "why": [
      "Without a file plan, records scatter into ad hoc folders that no one can search or govern consistently.",
      "A shared plan lets retention and access rules attach to groupings rather than to individual files.",
      "Consistent filing is the foundation that makes disposition and transfer reliable at scale."
    ],
    "how": [
      {
        "t": "Design the structure",
        "d": "Build a hierarchy of functions and activities that reflects how the organisation actually works."
      },
      {
        "t": "Bind governance rules",
        "d": "Attach classification, access, and retention requirements to each grouping in the plan."
      },
      {
        "t": "Maintain over time",
        "d": "Review and adjust the plan as functions change, keeping prior structures traceable for older records."
      }
    ],
    "faqs": [
      {
        "q": "What is a file plan?",
        "a": "A file plan is a structured scheme that organises records into logical groupings, linking each grouping to its classification, access rules, and retention requirements."
      },
      {
        "q": "How does a file plan relate to classification?",
        "a": "Classification names what a record is; the file plan places it within a structured hierarchy where shared governance rules can be applied."
      },
      {
        "q": "Is a file plan only for physical records?",
        "a": "No. A file plan governs both physical and electronic records, providing one consistent structure regardless of where records reside."
      }
    ],
    "relatedIndustries": [
      "government",
      "universities",
      "municipalities",
      "archives"
    ],
    "relatedProblems": [
      "records-classification",
      "record-series",
      "records-inventory",
      "retention-schedule"
    ],
    "diagram": "ledger",
    "metaTitle": "File Plan | Sovereign Dispatch",
    "metaDescription": "A file plan organises records into logical groupings linked to classification, access, and retention rules. Learn how to design and maintain one."
  },
  {
    "slug": "records-classification",
    "term": "Records Classification",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Sort records so governance can follow",
    "lead": "Classification is the act that lets retention, access, and disposition rules attach to records automatically rather than case by case.",
    "definition": "Records classification is the process of assigning records to defined categories based on their function, content, or value, so that consistent retention, access, and handling rules can be applied.",
    "why": [
      "Unclassified records cannot inherit consistent retention or access rules, forcing manual judgement at every turn.",
      "Classification lets large volumes be governed by rule rather than by individual decision.",
      "Accurate categories are the precondition for reliable disposition and transfer."
    ],
    "how": [
      {
        "t": "Define categories",
        "d": "Establish a classification scheme based on business function, record type, or sensitivity."
      },
      {
        "t": "Assign at capture",
        "d": "Classify records as they are created so governance applies from the start, not retroactively."
      },
      {
        "t": "Audit accuracy",
        "d": "Sample and review classifications so misfiled records are corrected before they distort disposition."
      }
    ],
    "faqs": [
      {
        "q": "What is records classification?",
        "a": "Records classification is the process of assigning records to defined categories based on function, content, or value, so consistent retention, access, and handling rules can be applied."
      },
      {
        "q": "Why classify records at all?",
        "a": "Classification lets retention and access rules attach to categories, allowing large volumes to be governed by rule instead of individual judgement."
      },
      {
        "q": "When should records be classified?",
        "a": "Ideally at the point of capture, so governance applies from creation; retrospective classification is possible but slower and more error-prone."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "financial-institutions",
      "archives"
    ],
    "relatedProblems": [
      "file-plan",
      "record-series",
      "records-retention",
      "recordkeeping-metadata"
    ],
    "diagram": "ledger",
    "metaTitle": "Records Classification | Sovereign Dispatch",
    "metaDescription": "Records classification assigns records to categories so retention, access, and handling rules apply consistently. Learn schemes and capture-time tagging."
  },
  {
    "slug": "vital-records",
    "term": "Vital Records",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Protect the records the institution cannot lose",
    "lead": "Vital records are the small subset whose loss would halt operations or destroy legal standing, and they demand special protection.",
    "definition": "Vital records are the records essential to an organisation's continued operation and legal standing, such that their loss would cause severe disruption and they require heightened protection and recovery planning.",
    "why": [
      "A small fraction of records carry disproportionate consequence if destroyed in a disaster.",
      "Identifying vital records lets protection effort concentrate where loss would be catastrophic.",
      "Recovery planning depends on knowing which records must survive an interruption."
    ],
    "how": [
      {
        "t": "Identify the essentials",
        "d": "Determine which records the organisation could not function or assert its rights without."
      },
      {
        "t": "Protect and duplicate",
        "d": "Apply enhanced safeguards and off-site copies so a single event cannot destroy the only instance."
      },
      {
        "t": "Test recovery",
        "d": "Rehearse retrieval of vital records so continuity plans work under real disruption."
      }
    ],
    "faqs": [
      {
        "q": "What are vital records?",
        "a": "Vital records are the records essential to an organisation's continued operation and legal standing, whose loss would cause severe disruption and which require heightened protection and recovery planning."
      },
      {
        "q": "How are vital records different from permanent records?",
        "a": "Vital records are essential to current operations and continuity; permanent records have enduring historical value. A record can be one, both, or neither."
      },
      {
        "q": "What share of records are vital?",
        "a": "Typically a small minority, which is why identifying them lets protective effort and cost focus where the consequence of loss is greatest."
      }
    ],
    "relatedIndustries": [
      "government",
      "central-banks",
      "energy-utilities",
      "emergency-management"
    ],
    "relatedProblems": [
      "records-inventory",
      "records-retention",
      "recordkeeping-system",
      "transfer-to-archive"
    ],
    "diagram": "shield",
    "metaTitle": "Vital Records | Sovereign Dispatch",
    "metaDescription": "Vital records are those essential to operations and legal standing, requiring heightened protection and recovery planning. Learn how to identify and safeguard them."
  },
  {
    "slug": "disposal-authority",
    "term": "Disposal Authority",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Authorise destruction so it can be defended",
    "lead": "A disposal authority is the formal permission that turns records destruction from a risk into a defensible, sanctioned act.",
    "definition": "A disposal authority is a formally approved instrument that grants permission to destroy or transfer specified records once defined conditions are met, providing the legal basis for disposition decisions.",
    "why": [
      "Destroying records without sanctioned authority exposes staff and the organisation to legal challenge.",
      "An approved authority lets routine disposition proceed at scale without case-by-case sign-off.",
      "Documented authority is what proves a destruction was lawful rather than evasive."
    ],
    "how": [
      {
        "t": "Define the scope",
        "d": "Specify which record series the authority covers and the conditions under which disposal is permitted."
      },
      {
        "t": "Secure approval",
        "d": "Obtain sign-off from the accountable body, and where required, an external archival or regulatory authority."
      },
      {
        "t": "Govern its use",
        "d": "Apply the authority through the schedule and log every disposal action taken under it."
      }
    ],
    "faqs": [
      {
        "q": "What is a disposal authority?",
        "a": "A disposal authority is a formally approved instrument granting permission to destroy or transfer specified records once defined conditions are met, providing the legal basis for disposition decisions."
      },
      {
        "q": "Who issues a disposal authority?",
        "a": "It is approved by the accountable internal body and, in many public bodies, sanctioned by a national archives or regulator before destruction can proceed."
      },
      {
        "q": "Can records be destroyed without one?",
        "a": "Doing so leaves destruction unauthorised and hard to defend; a disposal authority is what evidences that the action was sanctioned and lawful."
      }
    ],
    "relatedIndustries": [
      "government",
      "archives",
      "regulators",
      "justice"
    ],
    "relatedProblems": [
      "records-disposition",
      "retention-schedule",
      "records-retention",
      "records-management-policy"
    ],
    "diagram": "shield",
    "metaTitle": "Disposal Authority | Sovereign Dispatch",
    "metaDescription": "A disposal authority is the approved instrument granting permission to destroy or transfer records once conditions are met. Learn scope, approval, and use."
  },
  {
    "slug": "records-management-policy",
    "term": "Records Management Policy",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Set the rules that make records defensible",
    "lead": "The policy is the governing statement that gives recordkeeping its mandate, scope, and accountable owners across the institution.",
    "definition": "A records management policy is an approved statement that defines an organisation's principles, responsibilities, and requirements for creating, maintaining, retaining, and disposing of records.",
    "why": [
      "Without a policy, recordkeeping practice varies by team and cannot be enforced or audited.",
      "A policy assigns accountability, so responsibility for records does not fall through the cracks.",
      "It provides the mandate that schedules, classification, and disposition all operate under."
    ],
    "how": [
      {
        "t": "State principles and scope",
        "d": "Define what counts as a record, which activities are covered, and the standards that apply."
      },
      {
        "t": "Assign responsibilities",
        "d": "Name the roles accountable for governance, custody, and day-to-day recordkeeping."
      },
      {
        "t": "Approve and communicate",
        "d": "Have the governing body adopt the policy and ensure staff understand their obligations under it."
      }
    ],
    "faqs": [
      {
        "q": "What is a records management policy?",
        "a": "A records management policy is an approved statement defining an organisation's principles, responsibilities, and requirements for creating, maintaining, retaining, and disposing of records."
      },
      {
        "q": "How does the policy relate to the schedule?",
        "a": "The policy sets principles and accountability; the retention schedule is the operational instrument that applies those principles to specific record types."
      },
      {
        "q": "Who approves the policy?",
        "a": "It is adopted by the governing body or senior accountable officer, giving recordkeeping a formal mandate that can be enforced across the organisation."
      }
    ],
    "relatedIndustries": [
      "government",
      "universities",
      "regulators",
      "ngos"
    ],
    "relatedProblems": [
      "records-retention",
      "retention-schedule",
      "disposal-authority",
      "recordkeeping"
    ],
    "diagram": "workflow",
    "metaTitle": "Records Management Policy | Sovereign Dispatch",
    "metaDescription": "A records management policy defines principles, responsibilities, and requirements for managing records across their life. Learn what it must cover."
  },
  {
    "slug": "recordkeeping-metadata",
    "term": "Recordkeeping Metadata",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "The data that keeps records meaningful over time",
    "lead": "Metadata is what lets a record stay findable, interpretable, and trustworthy long after its creators have moved on.",
    "definition": "Recordkeeping metadata is the structured information that describes a record's content, context, structure, and management history, enabling it to remain authentic, findable, and interpretable over time.",
    "why": [
      "A record stripped of context loses meaning and evidential value as the years pass.",
      "Metadata is what lets retention rules, access controls, and searches operate on records automatically.",
      "Management metadata records who did what to a record, supporting integrity and audit."
    ],
    "how": [
      {
        "t": "Capture at creation",
        "d": "Record identity, author, date, and classification when the record is first captured."
      },
      {
        "t": "Maintain through events",
        "d": "Log custody, access, and disposition actions so the management history stays complete."
      },
      {
        "t": "Preserve alongside the record",
        "d": "Keep metadata bound to the record through migrations and transfers so context is never lost."
      }
    ],
    "faqs": [
      {
        "q": "What is recordkeeping metadata?",
        "a": "Recordkeeping metadata is structured information describing a record's content, context, structure, and management history, enabling it to remain authentic, findable, and interpretable over time."
      },
      {
        "q": "Why does metadata matter for retention?",
        "a": "Retention rules act on metadata such as record type and creation date; without it, disposition cannot be triggered reliably or automatically."
      },
      {
        "q": "What happens if metadata is lost?",
        "a": "A record can become unfindable, uninterpretable, or unprovable as evidence, even if the content itself survives intact."
      }
    ],
    "relatedIndustries": [
      "government",
      "archives",
      "national-libraries",
      "research-institutes"
    ],
    "relatedProblems": [
      "recordkeeping",
      "records-classification",
      "recordkeeping-system",
      "records-lifecycle"
    ],
    "diagram": "ledger",
    "metaTitle": "Recordkeeping Metadata | Sovereign Dispatch",
    "metaDescription": "Recordkeeping metadata describes a record's content, context, and management history so it stays authentic and findable over time. Learn what to capture."
  },
  {
    "slug": "record-series",
    "term": "Record Series",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Group like records so rules apply once",
    "lead": "The record series is the unit on which retention and disposition operate, letting one rule govern many records at once.",
    "definition": "A record series is a group of records that share the same function, format, or filing arrangement and are therefore managed as a single unit for retention and disposition.",
    "why": [
      "Managing records one by one does not scale; series let rules apply to coherent groups.",
      "Series are the natural unit on which retention schedules and disposal authorities operate.",
      "Grouping by series keeps related records together through their shared lifecycle."
    ],
    "how": [
      {
        "t": "Identify common functions",
        "d": "Group records that arise from the same activity and share a retention requirement."
      },
      {
        "t": "Define series boundaries",
        "d": "Set clear criteria for what belongs in each series so filing stays consistent."
      },
      {
        "t": "Attach the schedule entry",
        "d": "Link each series to its retention period and disposition action in the schedule."
      }
    ],
    "faqs": [
      {
        "q": "What is a record series?",
        "a": "A record series is a group of records that share the same function, format, or filing arrangement and are managed as a single unit for retention and disposition."
      },
      {
        "q": "Why manage records as series?",
        "a": "Series let one retention and disposition rule govern many related records, making large-volume recordkeeping consistent and scalable."
      },
      {
        "q": "How does a series relate to classification?",
        "a": "Classification places records into categories; a series is the grouping of like records within that scheme on which retention rules actually operate."
      }
    ],
    "relatedIndustries": [
      "government",
      "archives",
      "universities",
      "regulators"
    ],
    "relatedProblems": [
      "records-classification",
      "file-plan",
      "retention-schedule",
      "records-disposition"
    ],
    "diagram": "ledger",
    "metaTitle": "Record Series | Sovereign Dispatch",
    "metaDescription": "A record series groups records sharing a function or format so retention and disposition rules apply once. Learn how series structure recordkeeping."
  },
  {
    "slug": "transfer-to-archive",
    "term": "Transfer To Archive",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Move enduring records into permanent custody",
    "lead": "Transfer is the controlled handover that moves records of lasting value out of active systems and into preservation.",
    "definition": "Transfer to archive is the controlled process of moving records with enduring value from active or inactive custody into an archival repository for permanent preservation, with custody and context formally handed over.",
    "why": [
      "Records of lasting value need preservation conditions that active systems are not built to provide.",
      "A controlled transfer preserves provenance and chain of custody, protecting evidential value.",
      "Moving inactive permanent records out of active systems reduces clutter and cost."
    ],
    "how": [
      {
        "t": "Select eligible records",
        "d": "Identify records whose schedule entry specifies permanent retention or archival transfer."
      },
      {
        "t": "Prepare and describe",
        "d": "Package records with their metadata and context so meaning survives the move."
      },
      {
        "t": "Hand over custody",
        "d": "Transfer the records and document the change of custody so provenance stays unbroken."
      }
    ],
    "faqs": [
      {
        "q": "What is transfer to archive?",
        "a": "Transfer to archive is the controlled process of moving records with enduring value from active or inactive custody into an archival repository for permanent preservation, with custody and context formally handed over."
      },
      {
        "q": "Which records get transferred?",
        "a": "Records whose retention schedule specifies permanent value or archival disposition, typically a small fraction of an organisation's holdings."
      },
      {
        "q": "Why document the transfer?",
        "a": "Documenting the change of custody preserves provenance and chain of custody, which sustains the records' authenticity and evidential value."
      }
    ],
    "relatedIndustries": [
      "archives",
      "government",
      "national-libraries",
      "heritage-authorities"
    ],
    "relatedProblems": [
      "records-disposition",
      "records-lifecycle",
      "vital-records",
      "records-appraisal"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Transfer to Archive | Sovereign Dispatch",
    "metaDescription": "Transfer to archive moves records of enduring value into permanent custody with provenance intact. Learn selection, preparation, and custody handover."
  },
  {
    "slug": "legal-hold",
    "term": "Legal Hold",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Suspend disposal when litigation looms",
    "lead": "A legal hold overrides routine destruction so evidence survives for litigation, investigation, or audit.",
    "definition": "A legal hold is a directive that suspends the normal disposition of specified records when they may be relevant to anticipated or active litigation, investigation, or audit, preserving them until the hold is lifted.",
    "why": [
      "Destroying records subject to litigation, even on schedule, can constitute spoliation and draw sanctions.",
      "A hold ensures potentially relevant evidence survives routine disposition processes.",
      "Documented holds prove the organisation preserved evidence in good faith."
    ],
    "how": [
      {
        "t": "Identify scope",
        "d": "Determine which records and custodians are relevant to the matter triggering the hold."
      },
      {
        "t": "Suspend disposition",
        "d": "Override scheduled destruction for the in-scope records so they cannot be deleted."
      },
      {
        "t": "Release when clear",
        "d": "Lift the hold once the matter resolves, returning records to normal retention and disposition."
      }
    ],
    "faqs": [
      {
        "q": "What is a legal hold?",
        "a": "A legal hold is a directive that suspends the normal disposition of specified records when they may be relevant to anticipated or active litigation, investigation, or audit, preserving them until the hold is lifted."
      },
      {
        "q": "Does a legal hold override retention schedules?",
        "a": "Yes. While a hold is in force it suspends scheduled disposition for the in-scope records, even if their retention period would otherwise have ended."
      },
      {
        "q": "What happens when the hold ends?",
        "a": "Once lifted, the affected records return to their normal retention schedule and may then be disposed of if their period has elapsed."
      }
    ],
    "relatedIndustries": [
      "justice",
      "financial-institutions",
      "regulators",
      "law-enforcement"
    ],
    "relatedProblems": [
      "records-disposition",
      "records-retention",
      "retention-schedule",
      "statutory-retention"
    ],
    "diagram": "shield",
    "metaTitle": "Legal Hold | Sovereign Dispatch",
    "metaDescription": "A legal hold suspends routine disposition of records relevant to litigation or investigation until lifted. Learn scope, suspension, and release."
  },
  {
    "slug": "records-inventory",
    "term": "Records Inventory",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Know what records you hold before you govern them",
    "lead": "An inventory is the survey that reveals what records exist, where they live, and what they need before any schedule can be applied.",
    "definition": "A records inventory is a systematic survey that identifies and describes the records an organisation holds, including their location, volume, format, and series, as the basis for retention and management decisions.",
    "why": [
      "You cannot schedule or protect records you have not first located and described.",
      "An inventory exposes duplicate, orphaned, and over-retained holdings that drive risk and cost.",
      "It is the evidence base for building a defensible retention schedule and file plan."
    ],
    "how": [
      {
        "t": "Survey holdings",
        "d": "Locate records across systems and sites, capturing their format, volume, and location."
      },
      {
        "t": "Describe by series",
        "d": "Group findings into record series and note the function each set of records supports."
      },
      {
        "t": "Feed governance",
        "d": "Use the inventory to inform the file plan, retention schedule, and protection priorities."
      }
    ],
    "faqs": [
      {
        "q": "What is a records inventory?",
        "a": "A records inventory is a systematic survey that identifies and describes the records an organisation holds, including their location, volume, format, and series, as the basis for retention and management decisions."
      },
      {
        "q": "Why conduct an inventory?",
        "a": "Because retention, classification, and protection all depend on first knowing what records exist and where; an inventory provides that evidence base."
      },
      {
        "q": "How often should it be repeated?",
        "a": "Inventories are refreshed periodically and after major system or organisational change so the records picture stays accurate."
      }
    ],
    "relatedIndustries": [
      "government",
      "municipalities",
      "universities",
      "archives"
    ],
    "relatedProblems": [
      "records-appraisal",
      "file-plan",
      "retention-schedule",
      "vital-records"
    ],
    "diagram": "ledger",
    "metaTitle": "Records Inventory | Sovereign Dispatch",
    "metaDescription": "A records inventory surveys what records an organisation holds, where, and in what form, as the basis for retention and management. Learn how to run one."
  },
  {
    "slug": "retention-period",
    "term": "Retention Period",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Define exactly how long a record must be kept",
    "lead": "The retention period is the concrete duration that turns a retention policy into an actionable, auditable rule.",
    "definition": "A retention period is the length of time a record must be kept before it becomes eligible for disposition, measured from a defined trigger event and grounded in legal or business requirements.",
    "why": [
      "A retention rule without a defined duration and trigger cannot be applied or enforced.",
      "Clear periods prevent both premature destruction and indefinite over-retention.",
      "Documented periods let disposition be automated and defended under audit."
    ],
    "how": [
      {
        "t": "Set the duration",
        "d": "Determine the minimum keep time from statute, regulation, and business need."
      },
      {
        "t": "Define the trigger",
        "d": "Specify the event that starts the clock, such as case closure or end of a financial year."
      },
      {
        "t": "Calculate eligibility",
        "d": "Combine trigger and duration to determine when each record becomes eligible for disposition."
      }
    ],
    "faqs": [
      {
        "q": "What is a retention period?",
        "a": "A retention period is the length of time a record must be kept before it becomes eligible for disposition, measured from a defined trigger event and grounded in legal or business requirements."
      },
      {
        "q": "What is a retention trigger?",
        "a": "A trigger is the event that starts the retention clock, such as file closure or the end of a financial year, ensuring the period is calculated consistently."
      },
      {
        "q": "Does the period end mean automatic deletion?",
        "a": "No. The end of the period makes a record eligible for disposition, which then proceeds under the schedule unless a legal hold or other block applies."
      }
    ],
    "relatedIndustries": [
      "government",
      "financial-institutions",
      "healthcare",
      "regulators"
    ],
    "relatedProblems": [
      "records-retention",
      "retention-schedule",
      "statutory-retention",
      "records-disposition"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Retention Period | Sovereign Dispatch",
    "metaDescription": "A retention period is how long a record must be kept before disposition, measured from a trigger event. Learn how durations and triggers are set."
  },
  {
    "slug": "records-appraisal",
    "term": "Records Appraisal",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Decide which records deserve to endure",
    "lead": "Appraisal is the judgement that separates records worth preserving permanently from those that may be destroyed in time.",
    "definition": "Records appraisal is the evaluation of records to determine their value and the retention or disposition they warrant, weighing legal, administrative, financial, and historical significance.",
    "why": [
      "Not every record merits permanent keeping; appraisal decides where lasting value truly lies.",
      "Sound appraisal underpins defensible retention periods and disposition decisions.",
      "It ensures archives preserve significant records rather than indiscriminate volume."
    ],
    "how": [
      {
        "t": "Assess value",
        "d": "Weigh each record series for its legal, administrative, financial, and historical significance."
      },
      {
        "t": "Assign disposition",
        "d": "Recommend a retention period and final action, from routine destruction to permanent preservation."
      },
      {
        "t": "Document the basis",
        "d": "Record the reasoning so appraisal decisions can be reviewed and defended later."
      }
    ],
    "faqs": [
      {
        "q": "What is records appraisal?",
        "a": "Records appraisal is the evaluation of records to determine their value and the retention or disposition they warrant, weighing legal, administrative, financial, and historical significance."
      },
      {
        "q": "Who carries out appraisal?",
        "a": "It is typically conducted by records and archival professionals, often with input from business owners and, for public records, a national archives authority."
      },
      {
        "q": "How does appraisal relate to retention?",
        "a": "Appraisal determines a record's value, which informs the retention period and disposition recorded against its series in the schedule."
      }
    ],
    "relatedIndustries": [
      "archives",
      "government",
      "national-libraries",
      "heritage-authorities"
    ],
    "relatedProblems": [
      "transfer-to-archive",
      "records-disposition",
      "records-inventory",
      "retention-schedule"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Records Appraisal | Sovereign Dispatch",
    "metaDescription": "Records appraisal evaluates records' legal, administrative, and historical value to set retention and disposition. Learn how appraisal decisions are made."
  },
  {
    "slug": "recordkeeping-system",
    "term": "Recordkeeping System",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "The system that keeps records trustworthy at scale",
    "lead": "A recordkeeping system is the infrastructure that captures, controls, and preserves records as reliable evidence across their full life.",
    "definition": "A recordkeeping system is the combination of people, policies, and technology that captures, manages, and maintains records as authentic and reliable evidence throughout their retention.",
    "why": [
      "Ad hoc storage cannot enforce retention, access, or integrity controls consistently.",
      "A dedicated system binds metadata and rules to records so governance operates automatically.",
      "Reliable evidence over decades requires a system built for preservation, not just storage."
    ],
    "how": [
      {
        "t": "Capture with context",
        "d": "Bring records into the system with the metadata that makes them evidence, not just files."
      },
      {
        "t": "Enforce controls",
        "d": "Apply classification, access, retention, and integrity rules through the system itself."
      },
      {
        "t": "Preserve over time",
        "d": "Migrate and maintain records so they stay accessible and authentic across format change."
      }
    ],
    "faqs": [
      {
        "q": "What is a recordkeeping system?",
        "a": "A recordkeeping system is the combination of people, policies, and technology that captures, manages, and maintains records as authentic and reliable evidence throughout their retention."
      },
      {
        "q": "Is a document store a recordkeeping system?",
        "a": "Not on its own. A recordkeeping system adds the metadata, controls, and preservation needed to keep records authentic and reliable as evidence over time."
      },
      {
        "q": "What controls should it enforce?",
        "a": "Classification, access, retention and disposition, and integrity protection, all bound to records so governance is applied consistently rather than manually."
      }
    ],
    "relatedIndustries": [
      "government",
      "financial-institutions",
      "healthcare",
      "archives"
    ],
    "relatedProblems": [
      "recordkeeping",
      "recordkeeping-metadata",
      "records-classification",
      "records-retention"
    ],
    "diagram": "ledger",
    "metaTitle": "Recordkeeping System | Sovereign Dispatch",
    "metaDescription": "A recordkeeping system combines people, policy, and technology to keep records authentic and reliable throughout retention. Learn what it must enforce."
  },
  {
    "slug": "statutory-retention",
    "term": "Statutory Retention",
    "category": "Records & preservation",
    "kicker": "Records & preservation",
    "headline": "Keep records as long as the law demands",
    "lead": "Statutory retention is where the keeping of records stops being a choice and becomes a legal obligation.",
    "definition": "Statutory retention is the legally mandated minimum period for which specific records must be kept, set by legislation or regulation and binding regardless of an organisation's own preferences.",
    "why": [
      "Failing to keep records for a statutory minimum can itself be an offence or regulatory breach.",
      "Statutory periods set a floor that internal schedules must meet or exceed.",
      "Knowing which records carry statutory duties prevents premature, unlawful destruction."
    ],
    "how": [
      {
        "t": "Map legal requirements",
        "d": "Identify the statutes and regulations that impose minimum retention on each record type."
      },
      {
        "t": "Set the floor",
        "d": "Ensure schedule entries never fall below the statutory minimum for affected records."
      },
      {
        "t": "Monitor change",
        "d": "Track legislative change so retention periods stay aligned as the law evolves."
      }
    ],
    "faqs": [
      {
        "q": "What is statutory retention?",
        "a": "Statutory retention is the legally mandated minimum period for which specific records must be kept, set by legislation or regulation and binding regardless of an organisation's own preferences."
      },
      {
        "q": "How does it differ from a retention period?",
        "a": "A retention period is any defined keep time; statutory retention is one imposed by law, setting a binding minimum that internal schedules must respect."
      },
      {
        "q": "What if statutory and business needs differ?",
        "a": "The schedule must satisfy the statutory minimum, but an organisation may retain longer for business or historical reasons subject to other legal limits."
      }
    ],
    "relatedIndustries": [
      "government",
      "tax-authorities",
      "financial-institutions",
      "labor-authorities"
    ],
    "relatedProblems": [
      "retention-period",
      "records-retention",
      "retention-schedule",
      "legal-hold", "statutory-instrument"],
    "diagram": "shield",
    "metaTitle": "Statutory Retention | Sovereign Dispatch",
    "metaDescription": "Statutory retention is the legally mandated minimum period records must be kept, set by law. Learn how to map requirements and set the retention floor."
  },
  {
    "slug": "oais-reference-model",
    "term": "OAIS Reference Model",
    "category": "Records & preservation",
    "kicker": "Preservation architecture",
    "headline": "A shared blueprint for preserving records for decades",
    "lead": "The OAIS reference model gives institutions a common vocabulary and functional architecture for trustworthy long-term preservation.",
    "definition": "The OAIS Reference Model is an ISO-standardised conceptual framework (ISO 14721) that defines the functions, information packages, and responsibilities an archive needs to preserve digital information for a designated community over the long term.",
    "why": [
      "It establishes a vendor-neutral common language that lets auditors, archivists, and engineers describe preservation systems consistently.",
      "Its functional entities clarify accountability for ingest, storage, and access rather than leaving roles implicit.",
      "Compliance is widely expected by funders, regulators, and certification schemes evaluating institutional repositories."
    ],
    "how": [
      {
        "t": "Map the functional entities",
        "d": "Identify how Ingest, Archival Storage, Data Management, Access, Administration, and Preservation Planning map onto your existing systems and teams."
      },
      {
        "t": "Define the designated community",
        "d": "Document who must be able to understand the preserved information, since this scope drives metadata and format decisions."
      },
      {
        "t": "Align packages and workflows",
        "d": "Structure submission, archival, and dissemination packages so each transition through the model is traceable and reversible."
      }
    ],
    "faqs": [
      {
        "q": "What is the OAIS reference model?",
        "a": "The OAIS Reference Model is an ISO 14721 conceptual framework defining the functions, information packages, and responsibilities an archive needs to preserve digital information for a designated community over the long term."
      },
      {
        "q": "Is OAIS a piece of software?",
        "a": "No. OAIS is a conceptual reference model, not an implementation. Many preservation systems claim OAIS alignment, but the model itself describes functions and responsibilities rather than code."
      },
      {
        "q": "Who maintains the OAIS standard?",
        "a": "OAIS originated with the Consultative Committee for Space Data Systems and is published as an ISO standard, periodically revised to reflect evolving preservation practice."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "government",
      "research-institutes"
    ],
    "relatedProblems": [
      "archival-information-package",
      "trusted-digital-repository",
      "preservation-planning", "code-of-practice", "terms-of-reference"],
    "diagram": "lifecycle",
    "metaTitle": "OAIS Reference Model | Sovereign Dispatch",
    "metaDescription": "The OAIS reference model (ISO 14721) defines the functions and packages an archive needs for trustworthy long-term digital preservation."
  },
  {
    "slug": "archival-information-package",
    "term": "Archival Information Package",
    "category": "Records & preservation",
    "kicker": "Preservation packaging",
    "headline": "Bundling content and context for durable storage",
    "lead": "An archival information package binds preserved content to the metadata that keeps it intelligible long after its creators are gone.",
    "definition": "An Archival Information Package (AIP) is the OAIS unit of storage that combines the content information to be preserved with the preservation description information needed to understand, manage, and authenticate it over time.",
    "why": [
      "It keeps preservation metadata travelling with the content, so meaning is not lost when systems change.",
      "It provides a stable, auditable unit that fixity checks and migration workflows can act on.",
      "It separates what is stored from what is delivered, allowing dissemination to evolve without altering the archived original."
    ],
    "how": [
      {
        "t": "Assemble content information",
        "d": "Combine the data object with the representation information required to render and interpret it correctly."
      },
      {
        "t": "Attach preservation description",
        "d": "Include provenance, fixity, context, and reference information so the package remains authenticatable."
      },
      {
        "t": "Register and seal",
        "d": "Assign a persistent identifier and record fixity values so the AIP can be monitored throughout its retention period."
      }
    ],
    "faqs": [
      {
        "q": "What is an archival information package?",
        "a": "An Archival Information Package (AIP) is the OAIS unit of storage that combines content to be preserved with the preservation description information needed to understand, manage, and authenticate it over time."
      },
      {
        "q": "How does an AIP differ from a SIP?",
        "a": "A Submission Information Package is what a producer hands to the archive; the archive transforms it into an AIP suited for long-term storage and management."
      },
      {
        "q": "Can an AIP change over time?",
        "a": "Its essential content is preserved, but an AIP may be updated through versioning during migration or metadata enrichment, with each change recorded in provenance."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "research-institutes",
      "government"
    ],
    "relatedProblems": [
      "oais-reference-model",
      "submission-information-package",
      "preservation-metadata", "code-of-practice"],
    "diagram": "ledger",
    "metaTitle": "Archival Information Package (AIP) | Sovereign Dispatch",
    "metaDescription": "An archival information package binds preserved content to the provenance and fixity metadata that keep it intelligible and authentic over time."
  },
  {
    "slug": "format-migration",
    "term": "Format Migration",
    "category": "Records & preservation",
    "kicker": "Preservation action",
    "headline": "Moving content to formats that survive the decades",
    "lead": "Format migration keeps records readable by converting them to sustainable formats before their original encodings fall out of support.",
    "definition": "Format migration is the preservation action of converting a digital object from an obsolete or at-risk file format into a more sustainable one while retaining its significant properties and recording the change.",
    "why": [
      "It mitigates the risk that content becomes unreadable as software and codecs are retired.",
      "It allows institutions to consolidate on well-documented formats that are easier to manage and validate.",
      "It preserves a defensible record of each transformation, supporting later claims of authenticity."
    ],
    "how": [
      {
        "t": "Identify significant properties",
        "d": "Define which characteristics of the object must survive conversion, such as layout, colour, or structure."
      },
      {
        "t": "Select a target format",
        "d": "Choose a sustainable, openly documented format appropriate to the content and designated community."
      },
      {
        "t": "Validate and record",
        "d": "Compare source and target, confirm properties are retained, and log the migration in preservation metadata."
      }
    ],
    "faqs": [
      {
        "q": "What is format migration?",
        "a": "Format migration is the preservation action of converting a digital object from an obsolete or at-risk file format into a more sustainable one while retaining its significant properties and recording the change."
      },
      {
        "q": "Does migration alter the original?",
        "a": "Good practice retains the original alongside the migrated version so the transformation can be reviewed and, if needed, repeated with better tools."
      },
      {
        "q": "When should migration happen?",
        "a": "Migration is typically triggered by preservation planning when a format shows signs of obsolescence or when a more sustainable target becomes preferred."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "museums",
      "government"
    ],
    "relatedProblems": [
      "file-format-obsolescence",
      "preservation-planning",
      "normalization", "guidance-note"],
    "diagram": "workflow",
    "metaTitle": "Format Migration in Digital Preservation | Sovereign Dispatch",
    "metaDescription": "Format migration converts at-risk file formats into sustainable ones while retaining significant properties and recording each change for authenticity."
  },
  {
    "slug": "bit-level-preservation",
    "term": "Bit-Level Preservation",
    "category": "Records & preservation",
    "kicker": "Preservation baseline",
    "headline": "Guaranteeing the bytes themselves never silently change",
    "lead": "Bit-level preservation is the foundation layer that ensures stored files remain byte-for-byte intact across storage and time.",
    "definition": "Bit-level preservation is the practice of maintaining a digital object's exact sequence of bits unchanged over time through redundancy, fixity monitoring, and managed storage, without yet addressing future renderability.",
    "why": [
      "It is the minimum guarantee on which all higher preservation actions depend.",
      "It detects and corrects silent data corruption before it propagates through backups.",
      "It provides the evidence needed to assert that a file has not been altered since deposit."
    ],
    "how": [
      {
        "t": "Maintain redundant copies",
        "d": "Store multiple geographically and technologically diverse copies to survive media and site failures."
      },
      {
        "t": "Monitor fixity",
        "d": "Compute and periodically re-verify checksums to detect any bit-level change."
      },
      {
        "t": "Repair from known-good copies",
        "d": "When corruption is found, restore the affected object from a verified replica and log the event."
      }
    ],
    "faqs": [
      {
        "q": "What is bit-level preservation?",
        "a": "Bit-level preservation is the practice of maintaining a digital object's exact sequence of bits unchanged over time through redundancy, fixity monitoring, and managed storage, without yet addressing future renderability."
      },
      {
        "q": "Is bit-level preservation enough?",
        "a": "It is necessary but not sufficient. Bits can remain intact while the format becomes unreadable, so it must be paired with format and renderability strategies."
      },
      {
        "q": "How is corruption detected?",
        "a": "By generating cryptographic checksums at deposit and re-verifying them on a schedule, so any divergence signals corruption to be repaired."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "government",
      "research-institutes"
    ],
    "relatedProblems": [
      "fixity-for-preservation",
      "archival-storage",
      "digital-continuity", "guidance-note"],
    "diagram": "shield",
    "metaTitle": "Bit-Level Preservation | Sovereign Dispatch",
    "metaDescription": "Bit-level preservation keeps files byte-for-byte intact over time through redundancy, fixity monitoring, and repair from known-good copies."
  },
  {
    "slug": "digital-continuity",
    "term": "Digital Continuity",
    "category": "Records & preservation",
    "kicker": "Preservation outcome",
    "headline": "Keeping information usable for as long as it is needed",
    "lead": "Digital continuity ensures information stays complete, available, and usable for the entire period an institution relies on it.",
    "definition": "Digital continuity is the ability of an organisation to maintain digital information so that it remains complete, available, and usable for as long as it is needed, despite changes in technology and systems.",
    "why": [
      "It links preservation to business need, ensuring effort is spent where information must remain usable.",
      "It surfaces dependencies on software, formats, and infrastructure before they cause loss.",
      "It supports legal, regulatory, and operational obligations that outlast the systems that created the records."
    ],
    "how": [
      {
        "t": "Define usability requirements",
        "d": "Establish what 'usable' means for each information set, including who must use it and how."
      },
      {
        "t": "Map technical dependencies",
        "d": "Identify the formats, applications, and infrastructure each information set relies upon."
      },
      {
        "t": "Manage change deliberately",
        "d": "Plan migrations and system transitions so continuity is preserved rather than discovered broken."
      }
    ],
    "faqs": [
      {
        "q": "What is digital continuity?",
        "a": "Digital continuity is the ability of an organisation to maintain digital information so it remains complete, available, and usable for as long as it is needed, despite changes in technology and systems."
      },
      {
        "q": "How does it differ from backup?",
        "a": "Backup protects against loss; continuity additionally ensures the recovered information remains usable and understandable over time."
      },
      {
        "q": "Who owns digital continuity?",
        "a": "It is typically a shared responsibility between records management, IT, and information governance, anchored to defined business requirements."
      }
    ],
    "relatedIndustries": [
      "government",
      "archives",
      "regulators",
      "research-institutes"
    ],
    "relatedProblems": [
      "long-term-archiving",
      "file-format-obsolescence",
      "preservation-planning", "guidance-note"],
    "diagram": "lifecycle",
    "metaTitle": "Digital Continuity Explained | Sovereign Dispatch",
    "metaDescription": "Digital continuity keeps information complete, available, and usable for as long as it is needed, despite changing technology and systems."
  },
  {
    "slug": "long-term-archiving",
    "term": "Long-Term Archiving",
    "category": "Records & preservation",
    "kicker": "Preservation discipline",
    "headline": "Holding records safely beyond a single technology era",
    "lead": "Long-term archiving manages digital records across generations of hardware, software, and staff so they remain trustworthy.",
    "definition": "Long-term archiving is the managed retention of digital records over periods long enough that the technology, organisation, and designated community will change, requiring active strategies to keep them accessible and authentic.",
    "why": [
      "It addresses obligations that extend far past the life of any single system or vendor.",
      "It forces explicit planning for format, media, and organisational change rather than passive storage.",
      "It underpins institutional memory, accountability, and legal admissibility over decades."
    ],
    "how": [
      {
        "t": "Set retention horizons",
        "d": "Establish how long each class of record must survive and what authenticity it must retain."
      },
      {
        "t": "Adopt active management",
        "d": "Combine fixity, migration, and monitoring rather than relying on dormant storage."
      },
      {
        "t": "Plan for succession",
        "d": "Document systems and decisions so future custodians can continue the work without the original team."
      }
    ],
    "faqs": [
      {
        "q": "What is long-term archiving?",
        "a": "Long-term archiving is the managed retention of digital records over periods long enough that technology, organisation, and community will change, requiring active strategies to keep them accessible and authentic."
      },
      {
        "q": "How long is long-term?",
        "a": "There is no fixed number; it is any horizon long enough that technological and organisational change must be planned for, often decades or indefinitely."
      },
      {
        "q": "Is cloud storage long-term archiving?",
        "a": "Cloud storage can be one component, but archiving also requires fixity, format management, and governance that raw storage does not provide."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "government",
      "central-banks"
    ],
    "relatedProblems": [
      "digital-continuity",
      "archival-storage",
      "preservation-planning", "position-statement"],
    "diagram": "ledger",
    "metaTitle": "Long-Term Archiving | Sovereign Dispatch",
    "metaDescription": "Long-term archiving manages digital records across changing technology and staff so they stay accessible, authentic, and trustworthy for decades."
  },
  {
    "slug": "preservation-metadata",
    "term": "Preservation Metadata",
    "category": "Records & preservation",
    "kicker": "Preservation evidence",
    "headline": "The record of what a file is and what was done to it",
    "lead": "Preservation metadata captures the technical, provenance, and rights information needed to keep digital objects usable and trustworthy.",
    "definition": "Preservation metadata is the structured information that supports the long-term preservation of digital objects, documenting their technical characteristics, provenance, fixity, context, and the actions performed on them.",
    "why": [
      "It enables future custodians to understand and render objects without their original creators.",
      "It records every preservation action, supporting defensible claims of authenticity.",
      "It drives automation, letting systems decide when migration or fixity checks are due."
    ],
    "how": [
      {
        "t": "Adopt a metadata standard",
        "d": "Use an established scheme such as PREMIS to ensure interoperability and completeness."
      },
      {
        "t": "Capture at ingest",
        "d": "Record technical and provenance metadata as objects enter the archive, when context is richest."
      },
      {
        "t": "Update on every action",
        "d": "Log migrations, fixity checks, and repairs so the object's history remains continuous."
      }
    ],
    "faqs": [
      {
        "q": "What is preservation metadata?",
        "a": "Preservation metadata is structured information supporting long-term preservation, documenting an object's technical characteristics, provenance, fixity, context, and the actions performed on it."
      },
      {
        "q": "What standard is commonly used?",
        "a": "PREMIS is the most widely adopted preservation metadata standard, often expressed alongside packaging standards like METS."
      },
      {
        "q": "How is it different from descriptive metadata?",
        "a": "Descriptive metadata helps people find and cite an object; preservation metadata helps systems keep it usable and authentic over time."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "research-institutes",
      "museums"
    ],
    "relatedProblems": [
      "archival-information-package",
      "authenticity-in-preservation",
      "fixity-for-preservation", "position-statement"],
    "diagram": "ledger",
    "metaTitle": "Preservation Metadata (PREMIS) | Sovereign Dispatch",
    "metaDescription": "Preservation metadata documents a digital object's technical traits, provenance, fixity, and preservation actions to keep it usable and authentic."
  },
  {
    "slug": "trusted-digital-repository",
    "term": "Trusted Digital Repository",
    "category": "Records & preservation",
    "kicker": "Repository assurance",
    "headline": "A repository institutions can demonstrably rely on",
    "lead": "A trusted digital repository proves, through audit and certification, that it can preserve digital content reliably over the long term.",
    "definition": "A Trusted Digital Repository is one whose mission, organisation, and technical infrastructure can be independently assessed to demonstrate that it reliably preserves and provides access to digital content for its designated community over the long term.",
    "why": [
      "It replaces unverifiable assurances with evidence depositors and auditors can examine.",
      "Certification schemes provide a recognised benchmark for institutional preservation capability.",
      "It clarifies organisational, financial, and technical responsibilities, not just storage."
    ],
    "how": [
      {
        "t": "Document the mandate",
        "d": "Establish the repository's mission, designated community, and long-term commitment in policy."
      },
      {
        "t": "Demonstrate sustainability",
        "d": "Show the organisational and financial continuity needed to honour preservation commitments."
      },
      {
        "t": "Pursue certification",
        "d": "Align to a recognised audit framework such as CoreTrustSeal or ISO 16363 and undergo assessment."
      }
    ],
    "faqs": [
      {
        "q": "What is a trusted digital repository?",
        "a": "A Trusted Digital Repository is one whose mission, organisation, and infrastructure can be independently assessed to demonstrate it reliably preserves and provides access to digital content for its designated community over the long term."
      },
      {
        "q": "How does a repository become trusted?",
        "a": "Through transparent policies, demonstrated sustainability, and assessment against recognised frameworks such as CoreTrustSeal, nestor, or ISO 16363."
      },
      {
        "q": "Is trust about technology alone?",
        "a": "No. Trust spans organisational viability, finances, and governance as well as technical infrastructure, since preservation must outlast any single system."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "research-institutes",
      "government"
    ],
    "relatedProblems": [
      "oais-reference-model",
      "digital-archiving-standard",
      "preservation-planning", "charter"],
    "diagram": "shield",
    "metaTitle": "Trusted Digital Repository | Sovereign Dispatch",
    "metaDescription": "A trusted digital repository proves through audit and certification that it can reliably preserve and provide access to digital content over time."
  },
  {
    "slug": "file-format-obsolescence",
    "term": "File Format Obsolescence",
    "category": "Records & preservation",
    "kicker": "Preservation risk",
    "headline": "When the format outlives the software that reads it",
    "lead": "File format obsolescence is the slow threat that renders perfectly intact files unreadable as their software support disappears.",
    "definition": "File format obsolescence is the risk that a digital object becomes unusable because the software, hardware, or specifications needed to interpret its file format are no longer available or supported.",
    "why": [
      "Intact bits are worthless if nothing can interpret them, making obsolescence a primary preservation risk.",
      "It often advances quietly, becoming visible only when access is finally attempted.",
      "Anticipating it lets institutions migrate or emulate before knowledge and tools vanish."
    ],
    "how": [
      {
        "t": "Profile your formats",
        "d": "Inventory the file formats held and identify those with weak or declining support."
      },
      {
        "t": "Monitor risk signals",
        "d": "Track vendor support, specification availability, and community tooling using format registries."
      },
      {
        "t": "Plan a response",
        "d": "Decide per format whether migration, emulation, or normalization best preserves access."
      }
    ],
    "faqs": [
      {
        "q": "What is file format obsolescence?",
        "a": "File format obsolescence is the risk that a digital object becomes unusable because the software, hardware, or specifications needed to interpret its file format are no longer available or supported."
      },
      {
        "q": "How is obsolescence risk assessed?",
        "a": "By profiling holdings and consulting format registries that track support, documentation, and community tooling to flag at-risk formats."
      },
      {
        "q": "What are the main responses?",
        "a": "The principal strategies are migration to a sustainable format, emulation of the original environment, or normalization at ingest."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "museums",
      "research-institutes"
    ],
    "relatedProblems": [
      "format-migration",
      "emulation",
      "normalization", "charter"],
    "diagram": "lifecycle",
    "metaTitle": "File Format Obsolescence | Sovereign Dispatch",
    "metaDescription": "File format obsolescence is the risk that intact files become unreadable as the software and specifications to interpret them disappear."
  },
  {
    "slug": "emulation",
    "term": "Emulation",
    "category": "Records & preservation",
    "kicker": "Preservation strategy",
    "headline": "Reviving original software to keep content authentic",
    "lead": "Emulation preserves digital objects by recreating the computing environment they were built to run in, rather than altering the objects themselves.",
    "definition": "Emulation is a preservation strategy that recreates the original hardware or software environment of a digital object on current systems, allowing the object to be rendered in its native form without modifying it.",
    "why": [
      "It preserves look, feel, and behaviour that migration may not fully capture.",
      "It suits complex or interactive objects such as software, games, and dynamic documents.",
      "It leaves the original object untouched, supporting strong authenticity claims."
    ],
    "how": [
      {
        "t": "Capture the environment",
        "d": "Document and preserve the operating system, dependencies, and configuration the object requires."
      },
      {
        "t": "Provide an emulator",
        "d": "Deploy or maintain an emulator capable of running that environment on current infrastructure."
      },
      {
        "t": "Verify rendering",
        "d": "Confirm the object behaves as expected and record the emulation setup in preservation metadata."
      }
    ],
    "faqs": [
      {
        "q": "What is emulation in digital preservation?",
        "a": "Emulation is a preservation strategy that recreates the original hardware or software environment of a digital object on current systems, letting it render in its native form without modifying it."
      },
      {
        "q": "When is emulation preferred over migration?",
        "a": "Emulation suits complex, interactive, or behaviour-rich objects where converting the file would lose significant properties."
      },
      {
        "q": "What are the challenges of emulation?",
        "a": "Maintaining emulators, preserving original software and its licensing, and capturing complete environments all require ongoing effort and expertise."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "museums",
      "research-institutes"
    ],
    "relatedProblems": [
      "file-format-obsolescence",
      "format-migration",
      "authenticity-in-preservation", "charter"],
    "diagram": "workflow",
    "metaTitle": "Emulation in Digital Preservation | Sovereign Dispatch",
    "metaDescription": "Emulation preserves digital objects by recreating their original computing environment, rendering them natively without altering the files."
  },
  {
    "slug": "fixity-for-preservation",
    "term": "Fixity For Preservation",
    "category": "Records & preservation",
    "kicker": "Preservation integrity",
    "headline": "Proving stored files have not silently changed",
    "lead": "Fixity for preservation uses checksums to detect any change to a stored object and to evidence its integrity over time.",
    "definition": "Fixity for preservation is the practice of generating and periodically re-verifying cryptographic checksums for digital objects so that any alteration, corruption, or loss can be detected and documented over their retention period.",
    "why": [
      "It provides objective evidence that a file is the same as when it was deposited.",
      "It catches silent corruption early, before it spreads into backups and replicas.",
      "It supplies the integrity record that authenticity and audit claims depend on."
    ],
    "how": [
      {
        "t": "Generate checksums at ingest",
        "d": "Compute a strong hash for every object as it enters the archive and store it in metadata."
      },
      {
        "t": "Re-verify on a schedule",
        "d": "Periodically recompute and compare checksums across all copies to detect divergence."
      },
      {
        "t": "Act on mismatches",
        "d": "Repair from a verified copy when a check fails and record the event in the object's history."
      }
    ],
    "faqs": [
      {
        "q": "What is fixity for preservation?",
        "a": "Fixity for preservation is the practice of generating and periodically re-verifying cryptographic checksums for digital objects so any alteration, corruption, or loss can be detected and documented over their retention period."
      },
      {
        "q": "Which checksum algorithms are used?",
        "a": "Algorithms such as SHA-256 are common; the priority is a strong, well-documented hash recorded consistently in preservation metadata."
      },
      {
        "q": "How often should fixity be checked?",
        "a": "Frequency depends on risk and storage; many archives verify on a recurring schedule and after every transfer or migration event."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "government",
      "justice"
    ],
    "relatedProblems": [
      "bit-level-preservation",
      "authenticity-in-preservation",
      "preservation-metadata", "terms-of-reference"],
    "diagram": "seal",
    "metaTitle": "Fixity for Preservation | Sovereign Dispatch",
    "metaDescription": "Fixity for preservation uses periodic checksum verification to detect and document any change to stored digital objects over their retention period."
  },
  {
    "slug": "ingest-workflow",
    "term": "Ingest Workflow",
    "category": "Records & preservation",
    "kicker": "Preservation intake",
    "headline": "Turning deposited files into preservable archives",
    "lead": "The ingest workflow is where deposited content is validated, described, and transformed into trustworthy archival packages.",
    "definition": "An ingest workflow is the OAIS Ingest process that receives submissions, validates and characterises them, generates preservation metadata, and produces archival information packages ready for long-term storage.",
    "why": [
      "It is the gateway where authenticity, completeness, and format risk are first established.",
      "Decisions made at ingest shape an object's entire preservation lifecycle.",
      "Consistent intake makes downstream automation and audit feasible at scale."
    ],
    "how": [
      {
        "t": "Validate submissions",
        "d": "Check that received packages are complete, virus-free, and conform to deposit agreements."
      },
      {
        "t": "Characterise and enrich",
        "d": "Identify formats, extract technical metadata, and generate fixity values for each object."
      },
      {
        "t": "Produce archival packages",
        "d": "Assemble validated content and metadata into AIPs and transfer them to archival storage."
      }
    ],
    "faqs": [
      {
        "q": "What is an ingest workflow?",
        "a": "An ingest workflow is the OAIS Ingest process that receives submissions, validates and characterises them, generates preservation metadata, and produces archival information packages ready for long-term storage."
      },
      {
        "q": "Why is ingest so important?",
        "a": "Ingest is where authenticity, completeness, and format risk are first established, so its decisions shape the object's entire preservation lifecycle."
      },
      {
        "q": "Can ingest be automated?",
        "a": "Much of it can, including validation, characterisation, and metadata generation, though policy decisions and exception handling still need human oversight."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "research-institutes",
      "government"
    ],
    "relatedProblems": [
      "submission-information-package",
      "normalization",
      "archival-information-package", "terms-of-reference"],
    "diagram": "workflow",
    "metaTitle": "Ingest Workflow in Digital Preservation | Sovereign Dispatch",
    "metaDescription": "An ingest workflow validates, characterises, and packages deposited content into archival information packages ready for long-term preservation."
  },
  {
    "slug": "normalization",
    "term": "Normalization",
    "category": "Records & preservation",
    "kicker": "Preservation action",
    "headline": "Standardising formats at the moment of intake",
    "lead": "Normalization converts incoming files to preferred preservation formats at ingest, reducing the diversity an archive must manage.",
    "definition": "Normalization is the preservation action of converting submitted digital objects into a limited set of preferred, sustainable formats at the point of ingest, reducing format diversity and future migration burden.",
    "why": [
      "It limits the number of formats the archive must monitor and eventually migrate.",
      "It addresses obsolescence risk proactively rather than waiting for it to materialise.",
      "It produces predictable, well-documented objects that are easier to validate and render."
    ],
    "how": [
      {
        "t": "Define preferred formats",
        "d": "Establish a small set of sustainable target formats per content type in policy."
      },
      {
        "t": "Convert at ingest",
        "d": "Transform incoming objects to the preferred formats while retaining significant properties."
      },
      {
        "t": "Keep the original",
        "d": "Preserve the submitted version alongside the normalized one and record the action in metadata."
      }
    ],
    "faqs": [
      {
        "q": "What is normalization in digital preservation?",
        "a": "Normalization is the preservation action of converting submitted digital objects into a limited set of preferred, sustainable formats at ingest, reducing format diversity and future migration burden."
      },
      {
        "q": "How does normalization differ from migration?",
        "a": "Normalization happens at ingest to standardise incoming formats; migration happens later to move objects off formats that have become at-risk."
      },
      {
        "q": "Should the original be discarded after normalization?",
        "a": "No. The submitted original is normally retained so the normalization can be reviewed or repeated with improved tools."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "research-institutes",
      "museums"
    ],
    "relatedProblems": [
      "ingest-workflow",
      "format-migration",
      "file-format-obsolescence", "decree"],
    "diagram": "workflow",
    "metaTitle": "Normalization at Ingest | Sovereign Dispatch",
    "metaDescription": "Normalization converts submitted files to preferred sustainable formats at ingest, reducing format diversity and future migration burden."
  },
  {
    "slug": "submission-information-package",
    "term": "Submission Information Package",
    "category": "Records & preservation",
    "kicker": "Preservation packaging",
    "headline": "What a depositor hands the archive to preserve",
    "lead": "A submission information package is the agreed bundle of content and metadata a producer delivers into an archive's ingest process.",
    "definition": "A Submission Information Package (SIP) is the OAIS package delivered by a producer to an archive, containing the digital content and accompanying metadata agreed in the submission agreement for transformation into archival storage.",
    "why": [
      "It sets clear expectations for what producers must supply, reducing intake disputes.",
      "Its quality directly determines how readily content can be preserved.",
      "It defines the boundary of responsibility transferring from producer to archive."
    ],
    "how": [
      {
        "t": "Agree the submission terms",
        "d": "Document required content, formats, and metadata in a submission agreement with the producer."
      },
      {
        "t": "Package consistently",
        "d": "Bundle content and metadata in an agreed structure so ingest can process it reliably."
      },
      {
        "t": "Validate on receipt",
        "d": "Check completeness and conformance before transforming the SIP into an AIP."
      }
    ],
    "faqs": [
      {
        "q": "What is a submission information package?",
        "a": "A Submission Information Package (SIP) is the OAIS package delivered by a producer to an archive, containing the digital content and metadata agreed in the submission agreement for transformation into archival storage."
      },
      {
        "q": "How does a SIP become an AIP?",
        "a": "During ingest the archive validates, characterises, and enriches the SIP, producing an Archival Information Package suited for long-term storage."
      },
      {
        "q": "Who defines a SIP's contents?",
        "a": "The producer and archive define them together in a submission agreement that specifies required content, formats, and metadata."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "research-institutes",
      "government"
    ],
    "relatedProblems": [
      "ingest-workflow",
      "archival-information-package",
      "dissemination-information-package", "decree"],
    "diagram": "ledger",
    "metaTitle": "Submission Information Package (SIP) | Sovereign Dispatch",
    "metaDescription": "A submission information package is the content and metadata a producer delivers into an archive's ingest process for long-term preservation."
  },
  {
    "slug": "dissemination-information-package",
    "term": "Dissemination Information Package",
    "category": "Records & preservation",
    "kicker": "Preservation access",
    "headline": "Delivering archived content to those who request it",
    "lead": "A dissemination information package is what the archive assembles to deliver preserved content to a consumer on request.",
    "definition": "A Dissemination Information Package (DIP) is the OAIS package an archive produces in response to a consumer request, derived from one or more archival information packages and tailored for delivery and use.",
    "why": [
      "It lets access formats evolve without altering the preserved archival originals.",
      "It supports tailoring delivery to different consumers and use cases.",
      "It carries the context and provenance consumers need to trust what they receive."
    ],
    "how": [
      {
        "t": "Interpret the request",
        "d": "Determine which archival packages and which properties the consumer needs delivered."
      },
      {
        "t": "Derive the package",
        "d": "Generate the DIP from the relevant AIPs, applying any required access-format conversion."
      },
      {
        "t": "Include provenance",
        "d": "Attach the context and authenticity information the consumer needs to rely on the content."
      }
    ],
    "faqs": [
      {
        "q": "What is a dissemination information package?",
        "a": "A Dissemination Information Package (DIP) is the OAIS package an archive produces in response to a consumer request, derived from one or more archival information packages and tailored for delivery and use."
      },
      {
        "q": "How does a DIP relate to an AIP?",
        "a": "The DIP is generated from one or more AIPs; the AIP remains the preserved original while the DIP is the access-oriented delivery."
      },
      {
        "q": "Can a DIP differ from the stored format?",
        "a": "Yes. A DIP may convert content to a more convenient access format while the archival original stays unchanged in storage."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "research-institutes",
      "government"
    ],
    "relatedProblems": [
      "submission-information-package",
      "archival-information-package",
      "oais-reference-model", "decree"],
    "diagram": "workflow",
    "metaTitle": "Dissemination Information Package (DIP) | Sovereign Dispatch",
    "metaDescription": "A dissemination information package is what an archive assembles from archival packages to deliver preserved content to consumers on request."
  },
  {
    "slug": "preservation-planning",
    "term": "Preservation Planning",
    "category": "Records & preservation",
    "kicker": "Preservation foresight",
    "headline": "Deciding today what keeps records usable tomorrow",
    "lead": "Preservation planning watches for risks to digital holdings and prepares the actions that will keep them accessible and authentic.",
    "definition": "Preservation planning is the OAIS function that monitors the archive's environment and holdings for risks, evaluates strategies, and recommends actions such as migration or emulation to keep digital objects accessible and authentic.",
    "why": [
      "It turns preservation from reactive firefighting into deliberate, evidence-based decisions.",
      "It anticipates obsolescence while the tools and knowledge to respond still exist.",
      "It documents the rationale behind preservation actions, supporting accountability."
    ],
    "how": [
      {
        "t": "Monitor the environment",
        "d": "Track format support, technology trends, and the changing needs of the designated community."
      },
      {
        "t": "Assess holdings against risk",
        "d": "Identify which objects and formats are most exposed and require action."
      },
      {
        "t": "Recommend and trigger actions",
        "d": "Evaluate options, choose strategies, and initiate migrations or emulation plans with recorded reasoning."
      }
    ],
    "faqs": [
      {
        "q": "What is preservation planning?",
        "a": "Preservation planning is the OAIS function that monitors the archive's environment and holdings for risks, evaluates strategies, and recommends actions such as migration or emulation to keep digital objects accessible and authentic."
      },
      {
        "q": "How does planning relate to action?",
        "a": "Planning identifies risks and recommends strategies; the actual migrations, normalizations, or emulations are then carried out by other preservation processes."
      },
      {
        "q": "What tools support preservation planning?",
        "a": "Format registries, technology watch services, and planning methodologies help assess risk and compare candidate preservation strategies."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "research-institutes",
      "government"
    ],
    "relatedProblems": [
      "file-format-obsolescence",
      "format-migration",
      "digital-continuity"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Preservation Planning | Sovereign Dispatch",
    "metaDescription": "Preservation planning monitors risks to digital holdings and recommends actions like migration or emulation to keep them accessible and authentic."
  },
  {
    "slug": "digital-archiving-standard",
    "term": "Digital Archiving Standard",
    "category": "Records & preservation",
    "kicker": "Preservation conformance",
    "headline": "Common rules that make archives interoperable and auditable",
    "lead": "Digital archiving standards give institutions shared, auditable expectations for how digital content should be preserved.",
    "definition": "A digital archiving standard is a published specification, such as ISO 14721 or ISO 16363, that defines requirements or models for preserving and managing digital information so that practice can be consistent, interoperable, and independently assessed.",
    "why": [
      "Standards make preservation claims verifiable rather than self-asserted.",
      "They enable interoperability between systems, institutions, and successors.",
      "They give auditors and funders a recognised benchmark for assessment."
    ],
    "how": [
      {
        "t": "Select relevant standards",
        "d": "Identify which models and audit standards apply to your mandate and content types."
      },
      {
        "t": "Map practice to requirements",
        "d": "Compare current processes against each standard and document gaps."
      },
      {
        "t": "Evidence conformance",
        "d": "Maintain the policies and records that demonstrate compliance during certification or audit."
      }
    ],
    "faqs": [
      {
        "q": "What is a digital archiving standard?",
        "a": "A digital archiving standard is a published specification, such as ISO 14721 or ISO 16363, that defines requirements or models for preserving and managing digital information so practice can be consistent, interoperable, and independently assessed."
      },
      {
        "q": "Which standards are most common?",
        "a": "ISO 14721 (OAIS), ISO 16363 for repository audit, and PREMIS for preservation metadata are among the most widely referenced."
      },
      {
        "q": "Are standards mandatory?",
        "a": "They are often voluntary but are frequently required by funders, regulators, or certification schemes as evidence of trustworthy practice."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "standards-bodies",
      "government"
    ],
    "relatedProblems": [
      "oais-reference-model",
      "trusted-digital-repository",
      "preservation-metadata"
    ],
    "diagram": "shield",
    "metaTitle": "Digital Archiving Standards | Sovereign Dispatch",
    "metaDescription": "Digital archiving standards like ISO 14721 and ISO 16363 set shared, auditable expectations for preserving and managing digital information."
  },
  {
    "slug": "archival-storage",
    "term": "Archival Storage",
    "category": "Records & preservation",
    "kicker": "Preservation infrastructure",
    "headline": "Storage built to keep packages safe for the long haul",
    "lead": "Archival storage is the managed infrastructure that holds archival packages, monitors their integrity, and refreshes their media over time.",
    "definition": "Archival storage is the OAIS function and infrastructure responsible for storing, maintaining, and retrieving archival information packages, including media management, replication, and fixity monitoring over the long term.",
    "why": [
      "It provides the durable, monitored foundation on which preservation depends.",
      "It manages media refresh and replication so storage failures do not become losses.",
      "It supports reliable retrieval, ensuring preserved content can actually be produced when needed."
    ],
    "how": [
      {
        "t": "Replicate across diversity",
        "d": "Keep multiple copies on diverse media and locations to survive failures and disasters."
      },
      {
        "t": "Monitor and refresh media",
        "d": "Track media health and migrate to new media before degradation causes loss."
      },
      {
        "t": "Verify and retrieve",
        "d": "Run fixity checks on stored packages and confirm that retrieval works reliably."
      }
    ],
    "faqs": [
      {
        "q": "What is archival storage?",
        "a": "Archival storage is the OAIS function and infrastructure responsible for storing, maintaining, and retrieving archival information packages, including media management, replication, and fixity monitoring over the long term."
      },
      {
        "q": "How is it different from ordinary storage?",
        "a": "Archival storage adds active integrity monitoring, planned media refresh, and replication policies aimed at decades-long reliability rather than short-term availability."
      },
      {
        "q": "Does archival storage prevent obsolescence?",
        "a": "It protects the bits and media but not the file formats; format obsolescence is addressed separately through preservation planning and migration."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "government",
      "central-banks"
    ],
    "relatedProblems": [
      "bit-level-preservation",
      "fixity-for-preservation",
      "long-term-archiving"
    ],
    "diagram": "shield",
    "metaTitle": "Archival Storage in Digital Preservation | Sovereign Dispatch",
    "metaDescription": "Archival storage is the managed infrastructure that holds archival packages, monitors integrity, replicates copies, and refreshes media over time."
  },
  {
    "slug": "authenticity-in-preservation",
    "term": "Authenticity In Preservation",
    "category": "Records & preservation",
    "kicker": "Preservation trust",
    "headline": "Proving a preserved record is what it claims to be",
    "lead": "Authenticity in preservation is the evidence chain that lets a future user trust a record is genuine and unaltered since deposit.",
    "definition": "Authenticity in preservation is the quality of a preserved digital object being demonstrably what it purports to be, established through documented identity, integrity, and provenance maintained across its entire preservation lifecycle.",
    "why": [
      "It underpins the legal, evidential, and historical value of preserved records.",
      "It distinguishes a trustworthy archive from mere storage of files.",
      "It depends on continuous evidence, since any unrecorded gap undermines trust."
    ],
    "how": [
      {
        "t": "Establish identity at ingest",
        "d": "Record what the object is, where it came from, and who deposited it as it enters the archive."
      },
      {
        "t": "Maintain integrity evidence",
        "d": "Use fixity and controlled processes to show the object has not changed except through documented actions."
      },
      {
        "t": "Preserve unbroken provenance",
        "d": "Log every preservation action so the chain of custody and transformation is continuous and reviewable."
      }
    ],
    "faqs": [
      {
        "q": "What is authenticity in preservation?",
        "a": "Authenticity in preservation is the quality of a preserved digital object being demonstrably what it purports to be, established through documented identity, integrity, and provenance maintained across its entire preservation lifecycle."
      },
      {
        "q": "How is authenticity demonstrated?",
        "a": "Through continuous evidence of identity, integrity, and provenance, including fixity records and logged preservation actions, rather than a single signature."
      },
      {
        "q": "Does migration threaten authenticity?",
        "a": "Only if undocumented. When migrations are recorded with rationale and verification, authenticity is maintained through controlled, transparent change."
      }
    ],
    "relatedIndustries": [
      "archives",
      "justice",
      "government",
      "national-libraries"
    ],
    "relatedProblems": [
      "fixity-for-preservation",
      "preservation-metadata",
      "format-migration"
    ],
    "diagram": "chain",
    "metaTitle": "Authenticity in Digital Preservation | Sovereign Dispatch",
    "metaDescription": "Authenticity in preservation proves a record is genuine and unaltered since deposit through documented identity, integrity, and provenance."
  },
  {
    "slug": "official-gazette",
    "term": "Official gazette",
    "category": "Operations & workflow",
    "kicker": "Publishing of record",
    "headline": "Give every official act a single authoritative home",
    "lead": "The official gazette is the state's instrument of record, where laws, appointments and notices acquire public effect.",
    "definition": "An official gazette is the government's authoritative periodical of record, in which legislation, regulations, appointments and statutory notices are published to give them public legal effect.",
    "why": [
      "Centralises legally effective publication so citizens and courts share one source of truth.",
      "Establishes the moment an instrument becomes enforceable through a recorded publication date.",
      "Creates a durable, citable archive that underpins legal certainty for decades."
    ],
    "how": [
      {
        "t": "Intake and validation",
        "d": "Departments submit instruments through a controlled channel where authority and format are checked before acceptance."
      },
      {
        "t": "Sealed compilation",
        "d": "Accepted notices are compiled into a dated issue and cryptographically sealed so the published version is tamper-evident."
      },
      {
        "t": "Release and archive",
        "d": "The issue is released on a fixed schedule and preserved in an immutable archive with a verifiable index."
      }
    ],
    "faqs": [
      {
        "q": "What is an official gazette?",
        "a": "An official gazette is the government's authoritative periodical of record, in which legislation, regulations, appointments and statutory notices are published to give them public legal effect."
      },
      {
        "q": "Who may publish in an official gazette?",
        "a": "Typically only authorised public bodies and officers may submit instruments, with the gazette office validating authority before publication."
      },
      {
        "q": "Is a digital gazette legally valid?",
        "a": "Where enabling law recognises electronic publication, a sealed digital gazette carries the same legal effect, provided integrity and the publication date are verifiable."
      }
    ],
    "relatedIndustries": [
      "government",
      "parliaments",
      "justice",
      "national-libraries"
    ],
    "relatedProblems": [
      "government-gazette",
      "gazette-notice",
      "publication-of-record",
      "proclamation", "official-letter"],
    "diagram": "ledger",
    "metaTitle": "Official Gazette: The Government's Record of Authority",
    "metaDescription": "An official gazette is the authoritative periodical where laws, appointments and statutory notices are published to take legal effect. Learn how it works."
  },
  {
    "slug": "government-gazette",
    "term": "Government gazette",
    "category": "Operations & workflow",
    "kicker": "Publishing of record",
    "headline": "Publish state acts with provable authority and timing",
    "lead": "A government gazette consolidates official acts of the executive into a dated, citable publication of record.",
    "definition": "A government gazette is the official publication issued by a government to record and disseminate legislation, executive decisions, appointments and public notices in a single authoritative series.",
    "why": [
      "Provides one accountable channel for all legally effective government communications.",
      "Anchors enforceability to a documented issue date that courts and citizens can rely on.",
      "Reduces disputes over authenticity by tying each notice to a sealed, verifiable issue."
    ],
    "how": [
      {
        "t": "Authorised submission",
        "d": "Ministries lodge notices through credentialed accounts so each entry carries traceable departmental authority."
      },
      {
        "t": "Editorial assembly",
        "d": "Gazette staff order, number and proof notices into a structured issue with a stable citation scheme."
      },
      {
        "t": "Sealed publication",
        "d": "The completed issue is sealed and timestamped, then distributed and archived for permanent reference."
      }
    ],
    "faqs": [
      {
        "q": "What is a government gazette?",
        "a": "A government gazette is the official publication issued by a government to record and disseminate legislation, executive decisions, appointments and public notices in a single authoritative series."
      },
      {
        "q": "How does it differ from an official gazette?",
        "a": "The terms are often used interchangeably; some jurisdictions reserve government gazette for executive acts and run separate series for legislature or courts."
      },
      {
        "q": "Can private parties be required to gazette notices?",
        "a": "Yes; many statutes require companies or individuals to place prescribed notices in the gazette for them to have legal effect."
      }
    ],
    "relatedIndustries": [
      "government",
      "municipalities",
      "regulators",
      "national-statistics"
    ],
    "relatedProblems": [
      "official-gazette",
      "gazette-notice",
      "extraordinary-gazette",
      "publication-of-record"
    ],
    "diagram": "ledger",
    "metaTitle": "Government Gazette: Official Acts on the Record",
    "metaDescription": "A government gazette records legislation, executive decisions and public notices in one authoritative series. See how authority and timing are proven."
  },
  {
    "slug": "gazette-notice",
    "term": "Gazette notice",
    "category": "Operations & workflow",
    "kicker": "Public notices",
    "headline": "Turn a single notice into a dated public-record entry",
    "lead": "A gazette notice is the atomic unit of official publication, carrying a discrete legal message with its own citation and date.",
    "definition": "A gazette notice is an individual entry published in an official gazette that communicates a specific legal act, appointment, requirement or announcement and takes effect from its publication date.",
    "why": [
      "Gives each official act a uniquely citable reference for legal and administrative use.",
      "Fixes the precise date from which obligations or rights arising from the notice apply.",
      "Supports accountability by linking each notice to its issuing authority and sealed issue."
    ],
    "how": [
      {
        "t": "Drafting to template",
        "d": "Issuing bodies prepare the notice against a controlled template that enforces required fields and references."
      },
      {
        "t": "Numbering and placement",
        "d": "The gazette office assigns a unique notice number and positions it within the dated issue."
      },
      {
        "t": "Sealing and citation",
        "d": "The notice is sealed within the issue and given a permanent citation that resolves to a verifiable record."
      }
    ],
    "faqs": [
      {
        "q": "What is a gazette notice?",
        "a": "A gazette notice is an individual entry published in an official gazette that communicates a specific legal act, appointment, requirement or announcement and takes effect from its publication date."
      },
      {
        "q": "How is a gazette notice cited?",
        "a": "Notices are usually cited by gazette name, issue number or date and the assigned notice number, allowing precise retrieval of the record."
      },
      {
        "q": "When does a gazette notice take effect?",
        "a": "Unless the notice specifies a later date, it generally takes effect from the date of the gazette issue in which it appears."
      }
    ],
    "relatedIndustries": [
      "government",
      "municipalities",
      "land-registries",
      "intellectual-property"
    ],
    "relatedProblems": [
      "public-notice",
      "legal-notice",
      "statutory-notice",
      "publication-date-of-record"
    ],
    "diagram": "seal",
    "metaTitle": "Gazette Notice: One Citable, Dated Official Entry",
    "metaDescription": "A gazette notice is a single official entry communicating a legal act and taking effect from its publication date. Learn how notices are numbered and cited."
  },
  {
    "slug": "gazetting-process",
    "term": "Gazetting process",
    "category": "Operations & workflow",
    "kicker": "Workflow",
    "headline": "Move a notice from draft to legal effect, traceably",
    "lead": "The gazetting process is the controlled workflow that carries an instrument from submission to sealed, effective publication.",
    "definition": "The gazetting process is the end-to-end workflow by which an instrument is submitted, validated, compiled, approved and published in an official gazette so that it acquires legal effect.",
    "why": [
      "Standardises how notices reach legal effect, reducing errors and procedural challenges.",
      "Creates an auditable trail from submission to publication for every instrument.",
      "Aligns departments around shared deadlines, formats and authority checks."
    ],
    "how": [
      {
        "t": "Controlled submission",
        "d": "Authorised users lodge instruments with metadata that records who submitted what and when."
      },
      {
        "t": "Validation and approval",
        "d": "Editorial and legal checks confirm authority, format and content before an issue is approved."
      },
      {
        "t": "Seal and release",
        "d": "The approved issue is sealed, timestamped and released on schedule, with the full trail retained."
      }
    ],
    "faqs": [
      {
        "q": "What is the gazetting process?",
        "a": "The gazetting process is the end-to-end workflow by which an instrument is submitted, validated, compiled, approved and published in an official gazette so that it acquires legal effect."
      },
      {
        "q": "How long does gazetting take?",
        "a": "Timeframes vary by jurisdiction and issue schedule; controlled workflows shorten cycles by removing manual handoffs and rework."
      },
      {
        "q": "Can the gazetting process be digital end to end?",
        "a": "Yes; where the law permits electronic publication, the entire workflow can run digitally with sealed, verifiable outputs."
      }
    ],
    "relatedIndustries": [
      "government",
      "parliaments",
      "regulators",
      "municipalities"
    ],
    "relatedProblems": [
      "gazette-notice",
      "official-gazette",
      "notice-of-publication",
      "commencement-notice"
    ],
    "diagram": "workflow",
    "metaTitle": "Gazetting Process: From Draft to Legal Effect",
    "metaDescription": "The gazetting process is the controlled workflow that takes an instrument from submission to sealed, effective publication. See the key stages."
  },
  {
    "slug": "proclamation",
    "term": "Proclamation",
    "category": "Operations & workflow",
    "kicker": "Executive acts",
    "headline": "Publish a head-of-state act with verifiable provenance",
    "lead": "A proclamation is a formal executive declaration whose authority depends on correct, verifiable official publication.",
    "definition": "A proclamation is a formal public declaration issued under executive or head-of-state authority, such as bringing a law into force or declaring a state of emergency, that takes effect upon official publication.",
    "why": [
      "Marks high-authority acts that carry immediate legal and constitutional consequences.",
      "Requires unambiguous publication so the public can rely on the act's existence and timing.",
      "Demands strong provenance because proclamations are frequently relied on in litigation."
    ],
    "how": [
      {
        "t": "Authority confirmation",
        "d": "The issuing office verifies that the signatory holds the constitutional power to proclaim."
      },
      {
        "t": "Official drafting",
        "d": "The proclamation is prepared in prescribed form with effective dates and references clearly stated."
      },
      {
        "t": "Sealed publication",
        "d": "It is published in the gazette and sealed so its text and date are tamper-evident and citable."
      }
    ],
    "faqs": [
      {
        "q": "What is a proclamation?",
        "a": "A proclamation is a formal public declaration issued under executive or head-of-state authority, such as bringing a law into force or declaring a state of emergency, that takes effect upon official publication."
      },
      {
        "q": "How does a proclamation differ from a statute?",
        "a": "A statute is enacted by the legislature, while a proclamation is an executive instrument, often used to commence or implement a statute."
      },
      {
        "q": "When does a proclamation take effect?",
        "a": "A proclamation usually takes effect on its publication date or a specified date stated within it."
      }
    ],
    "relatedIndustries": [
      "government",
      "parliaments",
      "justice",
      "foreign-affairs"
    ],
    "relatedProblems": [
      "commencement-notice",
      "official-announcement",
      "official-gazette",
      "publication-date-of-record"
    ],
    "diagram": "seal",
    "metaTitle": "Proclamation: Executive Declarations on the Record",
    "metaDescription": "A proclamation is a formal executive declaration that takes effect on official publication. Learn how authority, timing and provenance are established."
  },
  {
    "slug": "public-notice",
    "term": "Public notice",
    "category": "Operations & workflow",
    "kicker": "Public notices",
    "headline": "Reach the public with provable, dated official notice",
    "lead": "A public notice gives formal, verifiable notification of a matter that affects rights, obligations or the public interest.",
    "definition": "A public notice is an official communication published to inform the public of a decision, proposal or requirement, providing formal notification that affected parties are deemed to have received.",
    "why": [
      "Satisfies legal duties to inform affected parties before a decision takes effect.",
      "Creates evidence that notification occurred on a specific, verifiable date.",
      "Protects later decisions from challenge by documenting transparent due process."
    ],
    "how": [
      {
        "t": "Define the audience",
        "d": "The issuer identifies who must be notified and the channel the law prescribes."
      },
      {
        "t": "Publish with timestamp",
        "d": "The notice is published through the official channel and timestamped to fix the notification date."
      },
      {
        "t": "Retain proof",
        "d": "A sealed record of the notice and its date is preserved as evidence that notice was duly given."
      }
    ],
    "faqs": [
      {
        "q": "What is a public notice?",
        "a": "A public notice is an official communication published to inform the public of a decision, proposal or requirement, providing formal notification that affected parties are deemed to have received."
      },
      {
        "q": "Where are public notices published?",
        "a": "Depending on the requirement, public notices appear in official gazettes, designated newspapers or official websites that the relevant law recognises."
      },
      {
        "q": "Why does the publication date matter?",
        "a": "The date often starts a notice period or limitation window, so a verifiable publication date is essential to legal certainty."
      }
    ],
    "relatedIndustries": [
      "municipalities",
      "government",
      "land-registries",
      "consumer-protection"
    ],
    "relatedProblems": [
      "legal-notice",
      "statutory-notice",
      "notice-period",
      "publication-date-of-record", "public-verification"],
    "diagram": "shield",
    "metaTitle": "Public Notice: Formal, Dated Notification to the Public",
    "metaDescription": "A public notice formally informs the public of a decision or requirement on a verifiable date. Learn how to give and prove official notice."
  },
  {
    "slug": "legal-notice",
    "term": "Legal notice",
    "category": "Operations & workflow",
    "kicker": "Public notices",
    "headline": "Publish notices that satisfy statutory duties to inform",
    "lead": "A legal notice is a formally required communication whose validity rests on correct publication and provable timing.",
    "definition": "A legal notice is a formal communication that a law or court requires to be published so that affected parties are deemed informed and prescribed legal consequences may follow.",
    "why": [
      "Discharges a statutory or judicial duty to notify before rights are affected.",
      "Provides defensible proof that notice was given in the required form and time.",
      "Reduces the risk that a decision is set aside for defective notification."
    ],
    "how": [
      {
        "t": "Confirm the requirement",
        "d": "The issuer identifies the governing rule, prescribed wording and required publication channel."
      },
      {
        "t": "Publish to spec",
        "d": "The notice is published exactly as required, with content and format aligned to the rule."
      },
      {
        "t": "Seal the evidence",
        "d": "A tamper-evident record of the published notice and date is retained for proof of compliance."
      }
    ],
    "faqs": [
      {
        "q": "What is a legal notice?",
        "a": "A legal notice is a formal communication that a law or court requires to be published so that affected parties are deemed informed and prescribed legal consequences may follow."
      },
      {
        "q": "How does a legal notice differ from a public notice?",
        "a": "Every legal notice is a public notice, but a legal notice specifically fulfils a binding statutory or judicial publication requirement."
      },
      {
        "q": "What happens if a legal notice is defective?",
        "a": "Defective publication can invalidate the notice and any dependent decision, which is why provable, compliant publication matters."
      }
    ],
    "relatedIndustries": [
      "justice",
      "government",
      "law-enforcement",
      "notarial-authorities"
    ],
    "relatedProblems": [
      "statutory-notice",
      "public-notice",
      "notice-period",
      "gazette-notice"
    ],
    "diagram": "shield",
    "metaTitle": "Legal Notice: Publication That Meets the Law",
    "metaDescription": "A legal notice is a publication required by law or a court so affected parties are deemed informed. Learn how to publish and prove it correctly."
  },
  {
    "slug": "statutory-notice",
    "term": "Statutory notice",
    "category": "Operations & workflow",
    "kicker": "Public notices",
    "headline": "Meet statute-mandated publication with verifiable records",
    "lead": "A statutory notice is publication that a specific statute compels, with form and timing dictated by the law itself.",
    "definition": "A statutory notice is a notice that a particular statute expressly requires to be published, with prescribed content, channel and timing that must be followed for the notice to be valid.",
    "why": [
      "Ensures compliance with the exact publication conditions a statute imposes.",
      "Establishes that mandatory steps occurred within statutory time limits.",
      "Limits liability by evidencing that the prescribed procedure was followed precisely."
    ],
    "how": [
      {
        "t": "Map statutory requirements",
        "d": "Identify the statute's rules on wording, channel, recipients and timing for the notice."
      },
      {
        "t": "Publish and timestamp",
        "d": "Publish through the prescribed channel and capture a verifiable timestamp for the act."
      },
      {
        "t": "Preserve compliance proof",
        "d": "Retain a sealed record demonstrating the notice met every statutory condition."
      }
    ],
    "faqs": [
      {
        "q": "What is a statutory notice?",
        "a": "A statutory notice is a notice that a particular statute expressly requires to be published, with prescribed content, channel and timing that must be followed for the notice to be valid."
      },
      {
        "q": "Who issues statutory notices?",
        "a": "They are issued by whichever authority or party the statute designates, such as regulators, councils or companies."
      },
      {
        "q": "Can a statutory notice be served digitally?",
        "a": "Only if the governing statute permits electronic publication or service; otherwise the prescribed traditional channel must be used."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "municipalities",
      "labor-authorities",
      "competition-authorities"
    ],
    "relatedProblems": [
      "legal-notice",
      "public-notice",
      "notice-period",
      "commencement-notice", "statutory-instrument"],
    "diagram": "shield",
    "metaTitle": "Statutory Notice: Publication a Statute Demands",
    "metaDescription": "A statutory notice is publication a specific statute requires, with prescribed form and timing. Learn how to comply and keep verifiable records."
  },
  {
    "slug": "official-bulletin",
    "term": "Official bulletin",
    "category": "Operations & workflow",
    "kicker": "Publishing of record",
    "headline": "Issue routine official information on a dependable record",
    "lead": "An official bulletin is a regular publication through which an authority issues notices, decisions and updates of record.",
    "definition": "An official bulletin is a periodical issued by a public authority to publish official notices, decisions and administrative information, serving as a recognised record of those communications.",
    "why": [
      "Provides a predictable channel for recurring official announcements and decisions.",
      "Builds a continuous, dated archive that supports accountability and reference.",
      "Reduces ambiguity by tying each communication to a sealed, identifiable issue."
    ],
    "how": [
      {
        "t": "Collect contributions",
        "d": "Departments submit items for the bulletin through a controlled, attributable channel."
      },
      {
        "t": "Compile the issue",
        "d": "Items are organised, dated and numbered into a coherent bulletin issue."
      },
      {
        "t": "Seal and distribute",
        "d": "The issue is sealed, timestamped and distributed, then archived for ongoing reference."
      }
    ],
    "faqs": [
      {
        "q": "What is an official bulletin?",
        "a": "An official bulletin is a periodical issued by a public authority to publish official notices, decisions and administrative information, serving as a recognised record of those communications."
      },
      {
        "q": "Is a bulletin the same as a gazette?",
        "a": "They overlap; a gazette is usually the principal state record, while bulletins are often issued by specific bodies for their own domains."
      },
      {
        "q": "Do bulletins carry legal effect?",
        "a": "Some do where law designates them for particular notices; otherwise they serve as authoritative administrative records."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "central-banks",
      "standards-bodies",
      "professional-bodies"
    ],
    "relatedProblems": [
      "official-journal",
      "official-announcement",
      "notice-of-publication",
      "publication-of-record", "official-letter"],
    "diagram": "ledger",
    "metaTitle": "Official Bulletin: A Dependable Record of Notices",
    "metaDescription": "An official bulletin is a periodical through which an authority publishes notices and decisions of record. Learn how issues are compiled and sealed."
  },
  {
    "slug": "official-journal",
    "term": "Official journal",
    "category": "Operations & workflow",
    "kicker": "Publishing of record",
    "headline": "Establish a primary record for legally effective texts",
    "lead": "An official journal is the authoritative series in which an institution's binding texts are published to take effect.",
    "definition": "An official journal is the authoritative publication of an institution or jurisdiction in which legislation, regulations and official acts are published as the primary, citable record that gives them effect.",
    "why": [
      "Designates a single primary source for the binding texts of an institution.",
      "Fixes legal effect to a documented date of publication in the journal.",
      "Provides a stable citation framework that supports long-term legal reference."
    ],
    "how": [
      {
        "t": "Authoritative intake",
        "d": "Only instruments from competent bodies are accepted, with authority recorded at submission."
      },
      {
        "t": "Structured publication",
        "d": "Texts are organised into numbered series and issues with consistent citation references."
      },
      {
        "t": "Seal and preserve",
        "d": "Each issue is sealed and preserved so the primary record stays verifiable over time."
      }
    ],
    "faqs": [
      {
        "q": "What is an official journal?",
        "a": "An official journal is the authoritative publication of an institution or jurisdiction in which legislation, regulations and official acts are published as the primary, citable record that gives them effect."
      },
      {
        "q": "How does an official journal relate to a gazette?",
        "a": "Both are records of authority; some jurisdictions use journal for the primary legal series and gazette for broader notices, while others treat them as synonyms."
      },
      {
        "q": "Is the journal version the authentic text?",
        "a": "Yes; the version published in the official journal is normally the authentic text that prevails over copies or summaries."
      }
    ],
    "relatedIndustries": [
      "government",
      "parliaments",
      "regulators",
      "national-libraries"
    ],
    "relatedProblems": [
      "official-bulletin",
      "official-gazette",
      "publication-of-record",
      "publication-date-of-record", "official-letter"],
    "diagram": "ledger",
    "metaTitle": "Official Journal: The Primary Record of Binding Texts",
    "metaDescription": "An official journal is the authoritative series where binding texts are published to take effect. Learn how authenticity and citation are maintained."
  },
  {
    "slug": "notice-of-publication",
    "term": "Notice of publication",
    "category": "Operations & workflow",
    "kicker": "Public notices",
    "headline": "Confirm and prove that publication has occurred",
    "lead": "A notice of publication formally records that a document was published, fixing the fact and date for later reliance.",
    "definition": "A notice of publication is a formal record or statement confirming that a specified document or instrument has been published, evidencing the fact and date of publication for legal and administrative purposes.",
    "why": [
      "Provides direct evidence that a required publication actually took place.",
      "Establishes the publication date that triggers downstream legal effects.",
      "Simplifies audits by linking the published item to a confirmed publication event."
    ],
    "how": [
      {
        "t": "Capture the event",
        "d": "The system records the moment publication occurs, including the item and channel."
      },
      {
        "t": "Generate the notice",
        "d": "A confirmation is produced stating what was published and when, with references."
      },
      {
        "t": "Seal for evidence",
        "d": "The confirmation is sealed so it can serve as tamper-evident proof of publication."
      }
    ],
    "faqs": [
      {
        "q": "What is a notice of publication?",
        "a": "A notice of publication is a formal record or statement confirming that a specified document or instrument has been published, evidencing the fact and date of publication for legal and administrative purposes."
      },
      {
        "q": "Why issue a notice of publication?",
        "a": "It supplies proof that publication occurred, which is often needed to start time limits or to defend a decision against challenge."
      },
      {
        "q": "Is it the same as the published document?",
        "a": "No; it is a separate confirmation about the publication event, not the substantive document itself."
      }
    ],
    "relatedIndustries": [
      "government",
      "intellectual-property",
      "land-registries",
      "securities-regulators"
    ],
    "relatedProblems": [
      "publication-date-of-record",
      "gazette-notice",
      "public-notice",
      "publication-of-record"
    ],
    "diagram": "seal",
    "metaTitle": "Notice of Publication: Proof a Document Went Public",
    "metaDescription": "A notice of publication confirms that a document was published and fixes the date. Learn how publication events are captured and sealed as evidence."
  },
  {
    "slug": "publication-of-record",
    "term": "Publication of record",
    "category": "Operations & workflow",
    "kicker": "Publishing of record",
    "headline": "Designate one source the public can authoritatively trust",
    "lead": "A publication of record is the recognised authoritative source whose published version governs in case of dispute.",
    "definition": "A publication of record is the officially recognised source in which a document is published as authoritative, so that its published version is treated as the definitive text for legal and reference purposes.",
    "why": [
      "Removes ambiguity by naming one source as definitive over copies and summaries.",
      "Strengthens legal certainty because the recognised version prevails in disputes.",
      "Underpins long-term reference with a stable, citable authoritative record."
    ],
    "how": [
      {
        "t": "Designate the source",
        "d": "Law or policy names the publication that holds authoritative status for the relevant documents."
      },
      {
        "t": "Publish authentically",
        "d": "Documents are published in that source with integrity controls that fix the authentic text."
      },
      {
        "t": "Preserve and verify",
        "d": "The record is preserved so anyone can later verify the authoritative version and its date."
      }
    ],
    "faqs": [
      {
        "q": "What is a publication of record?",
        "a": "A publication of record is the officially recognised source in which a document is published as authoritative, so that its published version is treated as the definitive text for legal and reference purposes."
      },
      {
        "q": "Why does a publication of record matter?",
        "a": "When versions conflict, the publication of record settles which text is authoritative, providing certainty for courts and citizens."
      },
      {
        "q": "Can a website be a publication of record?",
        "a": "Yes, where the law designates it and the published versions are integrity-protected and verifiably dated."
      }
    ],
    "relatedIndustries": [
      "government",
      "national-libraries",
      "archives",
      "regulators"
    ],
    "relatedProblems": [
      "public-record-publishing",
      "official-journal",
      "publication-date-of-record",
      "official-gazette"
    ],
    "diagram": "ledger",
    "metaTitle": "Publication of Record: The Definitive Authoritative Source",
    "metaDescription": "A publication of record is the recognised source whose published version governs in disputes. Learn how authoritative texts are published and preserved."
  },
  {
    "slug": "public-record-publishing",
    "term": "Public record publishing",
    "category": "Operations & workflow",
    "kicker": "Publishing of record",
    "headline": "Make public records available with integrity and access",
    "lead": "Public record publishing makes official records openly available while keeping their authenticity and dates verifiable.",
    "definition": "Public record publishing is the practice of issuing official records to the public in a form that preserves their authenticity, completeness and date so they remain reliable for inspection and citation.",
    "why": [
      "Supports transparency obligations by making official records openly accessible.",
      "Maintains trust by keeping published records authentic and verifiably dated.",
      "Reduces dispute by ensuring the public copy matches the authoritative original."
    ],
    "how": [
      {
        "t": "Prepare the record",
        "d": "Records are validated and formatted so the published version reflects the authoritative source."
      },
      {
        "t": "Publish with integrity",
        "d": "Each record is sealed and dated so readers can confirm it is unaltered and current."
      },
      {
        "t": "Provide durable access",
        "d": "Records are hosted with stable references and preserved for long-term public inspection."
      }
    ],
    "faqs": [
      {
        "q": "What is public record publishing?",
        "a": "Public record publishing is the practice of issuing official records to the public in a form that preserves their authenticity, completeness and date so they remain reliable for inspection and citation."
      },
      {
        "q": "How is integrity preserved when publishing records?",
        "a": "Records are sealed and timestamped so any later alteration is detectable, keeping the public version tamper-evident."
      },
      {
        "q": "Does publishing a record make it permanent?",
        "a": "Publishing supports permanence when paired with preservation and stable references, but durability depends on ongoing archiving."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "government",
      "national-statistics"
    ],
    "relatedProblems": [
      "publication-of-record",
      "official-gazette",
      "publication-date-of-record",
      "notice-of-publication"
    ],
    "diagram": "ledger",
    "metaTitle": "Public Record Publishing: Authentic, Accessible Records",
    "metaDescription": "Public record publishing issues official records to the public while preserving authenticity and dates. Learn how integrity and access are maintained."
  },
  {
    "slug": "commencement-notice",
    "term": "Commencement notice",
    "category": "Operations & workflow",
    "kicker": "Executive acts",
    "headline": "Fix exactly when a law begins to apply",
    "lead": "A commencement notice publishes the date a law or provision comes into operation, removing doubt about timing.",
    "definition": "A commencement notice is an official publication that specifies the date on which a statute or particular provisions enter into force, giving legal certainty about when the law begins to apply.",
    "why": [
      "Eliminates uncertainty about the precise start date of legal obligations.",
      "Allows staged implementation by commencing different provisions on different dates.",
      "Provides a verifiable record that obligations could not arise before the stated date."
    ],
    "how": [
      {
        "t": "Determine commencement",
        "d": "The responsible authority decides which provisions commence and on what date."
      },
      {
        "t": "Publish the notice",
        "d": "The commencement notice is published in the gazette with clear dates and references."
      },
      {
        "t": "Seal and link",
        "d": "The notice is sealed and linked to the affected statute so the timing is verifiable."
      }
    ],
    "faqs": [
      {
        "q": "What is a commencement notice?",
        "a": "A commencement notice is an official publication that specifies the date on which a statute or particular provisions enter into force, giving legal certainty about when the law begins to apply."
      },
      {
        "q": "Why are commencement notices used separately from statutes?",
        "a": "They let lawmakers enact a statute first and bring it into force later, sometimes in stages, once preparations are complete."
      },
      {
        "q": "Where is a commencement notice published?",
        "a": "It is normally published in the official gazette so the in-force date is part of the public record."
      }
    ],
    "relatedIndustries": [
      "parliaments",
      "government",
      "justice",
      "regulators"
    ],
    "relatedProblems": [
      "proclamation",
      "gazette-notice",
      "publication-date-of-record",
      "statutory-notice"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Commencement Notice: When a Law Takes Effect",
    "metaDescription": "A commencement notice publishes the date a statute or provision enters into force. Learn how in-force dates are fixed and recorded with certainty."
  },
  {
    "slug": "gazette-supplement",
    "term": "Gazette supplement",
    "category": "Operations & workflow",
    "kicker": "Publishing of record",
    "headline": "Publish lengthy instruments without breaking the record",
    "lead": "A gazette supplement carries bulky or specialised material as an extension of a gazette issue, with the same authority.",
    "definition": "A gazette supplement is an additional part issued alongside a main gazette to publish lengthy or specialised instruments, such as full statutes or regulations, while remaining part of the official record.",
    "why": [
      "Keeps the main gazette readable while still publishing voluminous instruments.",
      "Preserves authoritative status for content too large for the principal issue.",
      "Maintains a coherent citation link between the supplement and its parent issue."
    ],
    "how": [
      {
        "t": "Identify supplement content",
        "d": "Lengthy or specialised instruments are flagged for publication in a dedicated supplement."
      },
      {
        "t": "Compile and reference",
        "d": "The supplement is assembled and cross-referenced to the main issue it accompanies."
      },
      {
        "t": "Seal as one record",
        "d": "Supplement and main issue are sealed and dated together so both carry equal authority."
      }
    ],
    "faqs": [
      {
        "q": "What is a gazette supplement?",
        "a": "A gazette supplement is an additional part issued alongside a main gazette to publish lengthy or specialised instruments, such as full statutes or regulations, while remaining part of the official record."
      },
      {
        "q": "Does a supplement carry the same authority as the main gazette?",
        "a": "Yes; a supplement is part of the official record and content published in it has the same legal standing."
      },
      {
        "q": "Why are supplements used?",
        "a": "They allow large texts to be published in full without overloading the principal gazette issue, preserving readability and order."
      }
    ],
    "relatedIndustries": [
      "government",
      "parliaments",
      "national-libraries",
      "regulators"
    ],
    "relatedProblems": [
      "extraordinary-gazette",
      "official-gazette",
      "publication-of-record",
      "gazette-notice"
    ],
    "diagram": "ledger",
    "metaTitle": "Gazette Supplement: Lengthy Texts, Same Authority",
    "metaDescription": "A gazette supplement publishes bulky or specialised instruments as part of the official record. Learn how supplements link to the main gazette issue."
  },
  {
    "slug": "extraordinary-gazette",
    "term": "Extraordinary gazette",
    "category": "Operations & workflow",
    "kicker": "Publishing of record",
    "headline": "Publish urgent acts outside the normal schedule",
    "lead": "An extraordinary gazette is a special issue released between regular editions to give urgent acts immediate effect.",
    "definition": "An extraordinary gazette is a special, unscheduled gazette issue published outside the ordinary cycle to give immediate legal effect to urgent instruments such as emergency proclamations or time-critical notices.",
    "why": [
      "Enables urgent legal acts to take effect without waiting for the regular issue.",
      "Preserves the same authority and integrity controls under time pressure.",
      "Documents the exact timing of emergency measures for later accountability."
    ],
    "how": [
      {
        "t": "Trigger urgent publication",
        "d": "An authorised request initiates an out-of-cycle issue for a time-critical instrument."
      },
      {
        "t": "Expedited validation",
        "d": "Authority and format are confirmed quickly without bypassing essential controls."
      },
      {
        "t": "Seal and timestamp",
        "d": "The special issue is sealed and precisely timestamped to fix when the act took effect."
      }
    ],
    "faqs": [
      {
        "q": "What is an extraordinary gazette?",
        "a": "An extraordinary gazette is a special, unscheduled gazette issue published outside the ordinary cycle to give immediate legal effect to urgent instruments such as emergency proclamations or time-critical notices."
      },
      {
        "q": "When is an extraordinary gazette used?",
        "a": "It is used for emergencies or time-critical acts that cannot wait for the next scheduled gazette, such as declarations or urgent regulations."
      },
      {
        "q": "Does an extraordinary gazette have full legal effect?",
        "a": "Yes; provided it follows the prescribed process, its contents carry the same legal effect as the ordinary gazette."
      }
    ],
    "relatedIndustries": [
      "government",
      "emergency-management",
      "justice",
      "central-banks"
    ],
    "relatedProblems": [
      "proclamation",
      "gazette-supplement",
      "official-gazette",
      "publication-date-of-record"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Extraordinary Gazette: Urgent Acts, Immediate Effect",
    "metaDescription": "An extraordinary gazette is a special issue for urgent acts published outside the normal cycle. Learn how urgent publication keeps authority and timing."
  },
  {
    "slug": "publication-date-of-record",
    "term": "Publication date of record",
    "category": "Operations & workflow",
    "kicker": "Timing",
    "headline": "Anchor legal effect to one verifiable publication date",
    "lead": "The publication date of record is the authoritative date that determines when a published act takes effect.",
    "definition": "A publication date of record is the official, authoritative date assigned to a published instrument, from which its legal effect and any related time periods are calculated.",
    "why": [
      "Determines the precise moment legal rights and obligations begin to run.",
      "Provides a single agreed reference point that prevents timing disputes.",
      "Supports calculation of notice periods, deadlines and limitation windows."
    ],
    "how": [
      {
        "t": "Assign at publication",
        "d": "The authoritative date is fixed when the instrument is officially published, not when drafted."
      },
      {
        "t": "Bind to the record",
        "d": "The date is sealed with the published instrument so it cannot be altered undetected."
      },
      {
        "t": "Expose for verification",
        "d": "The date is made independently verifiable so any party can confirm it later."
      }
    ],
    "faqs": [
      {
        "q": "What is a publication date of record?",
        "a": "A publication date of record is the official, authoritative date assigned to a published instrument, from which its legal effect and any related time periods are calculated."
      },
      {
        "q": "Why is the publication date of record important?",
        "a": "It anchors legal effect and time limits, so a verifiable date prevents disputes about when obligations began."
      },
      {
        "q": "Can the publication date differ from the effect date?",
        "a": "Yes; an instrument may set a later effective date, but the publication date of record still fixes when it entered the public record."
      }
    ],
    "relatedIndustries": [
      "government",
      "justice",
      "securities-regulators",
      "land-registries"
    ],
    "relatedProblems": [
      "notice-period",
      "commencement-notice",
      "notice-of-publication",
      "publication-of-record"
    ],
    "diagram": "seal",
    "metaTitle": "Publication Date of Record: When Effect Begins",
    "metaDescription": "The publication date of record is the authoritative date that fixes when a published act takes effect. Learn how it anchors deadlines and legal effect."
  },
  {
    "slug": "notice-period",
    "term": "Notice period",
    "category": "Operations & workflow",
    "kicker": "Timing",
    "headline": "Calculate required notice from a provable starting date",
    "lead": "A notice period is the interval that must elapse after publication before a decision or requirement can take effect.",
    "definition": "A notice period is the legally required interval between the publication of a notice and the moment its subject matter takes effect, giving affected parties time to respond or comply.",
    "why": [
      "Guarantees affected parties a fair opportunity to react before effects begin.",
      "Depends on a verifiable start date so the period can be calculated reliably.",
      "Protects decisions from challenge by evidencing that required time was given."
    ],
    "how": [
      {
        "t": "Fix the start",
        "d": "The notice period begins from the verifiable publication date of the relevant notice."
      },
      {
        "t": "Apply the rule",
        "d": "The prescribed duration is applied, accounting for any rules on counting days."
      },
      {
        "t": "Record the window",
        "d": "The start, duration and end are recorded against the sealed notice for proof."
      }
    ],
    "faqs": [
      {
        "q": "What is a notice period?",
        "a": "A notice period is the legally required interval between the publication of a notice and the moment its subject matter takes effect, giving affected parties time to respond or comply."
      },
      {
        "q": "When does a notice period start?",
        "a": "It typically starts from the verifiable publication date of record, though specific rules on counting days vary by jurisdiction."
      },
      {
        "q": "What if a notice period is not observed?",
        "a": "Acting before the period expires can invalidate the resulting decision, which is why a provable start date is essential."
      }
    ],
    "relatedIndustries": [
      "municipalities",
      "regulators",
      "justice",
      "labor-authorities"
    ],
    "relatedProblems": [
      "publication-date-of-record",
      "public-notice",
      "statutory-notice",
      "legal-notice"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Notice Period: Required Time Before Effect",
    "metaDescription": "A notice period is the interval after publication before a decision takes effect. Learn how it is calculated from a provable publication date."
  },
  {
    "slug": "official-announcement",
    "term": "Official announcement",
    "category": "Operations & workflow",
    "kicker": "Public notices",
    "headline": "Communicate official decisions with attributable authority",
    "lead": "An official announcement is an authoritative public statement issued by a body to communicate a decision or position.",
    "definition": "An official announcement is an authoritative communication issued by a public body or institution to inform the public of a decision, position or event, attributed to the issuing authority and published of record.",
    "why": [
      "Provides a clear, attributable channel for authoritative public communication.",
      "Reduces misinformation by tying statements to a verifiable issuing authority.",
      "Creates a dated record of what was announced and when for accountability."
    ],
    "how": [
      {
        "t": "Confirm authority",
        "d": "The announcement is approved by the body authorised to speak on the matter."
      },
      {
        "t": "Publish and attribute",
        "d": "It is published through an official channel with clear attribution to the issuer."
      },
      {
        "t": "Seal the record",
        "d": "A sealed, dated copy is retained so the announcement's content and timing are verifiable."
      }
    ],
    "faqs": [
      {
        "q": "What is an official announcement?",
        "a": "An official announcement is an authoritative communication issued by a public body or institution to inform the public of a decision, position or event, attributed to the issuing authority and published of record."
      },
      {
        "q": "How does an announcement differ from a notice?",
        "a": "A notice usually carries specific legal consequences, while an announcement primarily communicates information, though it may still be of record."
      },
      {
        "q": "Why attribute and seal announcements?",
        "a": "Attribution and sealing let the public verify who issued the statement and confirm it has not been altered after publication."
      }
    ],
    "relatedIndustries": [
      "government",
      "central-banks",
      "broadcasting-authorities",
      "foreign-affairs"
    ],
    "relatedProblems": [
      "public-notice",
      "official-bulletin",
      "notice-of-publication",
      "proclamation"
    ],
    "diagram": "shield",
    "metaTitle": "Official Announcement: Attributable Public Statements",
    "metaDescription": "An official announcement is an authoritative, attributable communication of a decision or position, published of record. Learn how authority is verified."
  },
  {
    "slug": "approval-workflow-design",
    "term": "Approval workflow",
    "category": "Governance & compliance",
    "kicker": "Structured sign-off",
    "headline": "Route documents through the right approvers, every time",
    "lead": "An approval workflow turns ad-hoc sign-off into a repeatable, auditable sequence of reviews before a document can be published.",
    "definition": "An approval workflow is a defined sequence of review and authorization steps that a document must pass through, in order, before it can be published or treated as final.",
    "why": [
      "Without a defined route, documents reach publication through inconsistent channels, leaving gaps no one is accountable for.",
      "A structured workflow makes each approval position explicit, so reviewers know what they are signing off and when.",
      "Recorded approval steps give auditors a tamper-evident trail showing the document followed the governance the institution declared."
    ],
    "how": [
      {
        "t": "Map the required steps",
        "d": "Identify every review the document must pass, from drafting through legal, finance and executive sign-off, and fix their order."
      },
      {
        "t": "Assign approvers to roles",
        "d": "Bind each step to a role or office rather than a named individual, so the workflow survives staff changes."
      },
      {
        "t": "Capture each transition",
        "d": "Record who approved, when and on what version, producing an evidence chain aligned to your governance framework."
      }
    ],
    "faqs": [
      {
        "q": "What is an approval workflow?",
        "a": "An approval workflow is a defined sequence of review and authorization steps that a document must pass through, in order, before it can be published or treated as final."
      },
      {
        "q": "How does it differ from an ad-hoc sign-off?",
        "a": "Ad-hoc sign-off relies on memory and email; a workflow fixes the steps, the order and the responsible roles so nothing is skipped."
      },
      {
        "q": "Can steps run in parallel?",
        "a": "Yes. Many workflows combine sequential gates with parallel reviews, provided each reviewer's decision is independently recorded."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "financial-institutions",
      "universities"
    ],
    "relatedProblems": [
      "sign-off-process",
      "approval-chain-management",
      "authorization-matrix",
      "approval-audit-trail"
    ],
    "diagram": "workflow",
    "metaTitle": "Approval Workflow: Structured Document Sign-Off",
    "metaDescription": "An approval workflow routes documents through defined, auditable review steps before publication. Learn how to design and record approval sequences."
  },
  {
    "slug": "sign-off-process",
    "term": "Sign-off process",
    "category": "Governance & compliance",
    "kicker": "Final authorization",
    "headline": "Make the moment of approval explicit and recorded",
    "lead": "A sign-off process defines who confirms a document is correct and complete, and how that confirmation is captured as evidence.",
    "definition": "A sign-off process is the set of steps by which an authorized person formally confirms that a document is approved, recording that confirmation as a verifiable act.",
    "why": [
      "A confirmation that exists only in conversation cannot be relied on later when accountability is questioned.",
      "A defined sign-off process names the authorized confirmer and the conditions they are attesting to.",
      "Captured sign-offs create durable evidence that the right person approved the right version at a known time."
    ],
    "how": [
      {
        "t": "Define the attestation",
        "d": "State precisely what the signer is confirming, such as factual accuracy, legal alignment or budget authority."
      },
      {
        "t": "Identify the authorized signer",
        "d": "Tie sign-off to a position holding the mandate, so authority is verifiable against the governance record."
      },
      {
        "t": "Record the act tamper-evidently",
        "d": "Capture the signer, version and timestamp in a sealed record that later changes cannot silently overwrite."
      }
    ],
    "faqs": [
      {
        "q": "What is a sign-off process?",
        "a": "A sign-off process is the set of steps by which an authorized person formally confirms that a document is approved, recording that confirmation as a verifiable act."
      },
      {
        "q": "Is a sign-off the same as a signature?",
        "a": "A signature is one way to express sign-off; the process also covers who may sign, what they attest to and how the act is preserved."
      },
      {
        "q": "What if the signer was not authorized?",
        "a": "A sign-off carries weight only when the signer holds the relevant mandate, which is why authority should be checked at the moment of sign-off."
      }
    ],
    "relatedIndustries": [
      "government",
      "justice",
      "financial-institutions",
      "healthcare"
    ],
    "relatedProblems": [
      "approval-workflow-design",
      "signing-authority",
      "decision-record-keeping",
      "authorization-control"
    ],
    "diagram": "seal",
    "metaTitle": "Sign-Off Process: Recorded Final Authorization",
    "metaDescription": "A sign-off process captures who confirmed a document is approved and on what version. Learn to define attestations and record sign-off as evidence."
  },
  {
    "slug": "delegated-authority-framework",
    "term": "Delegated authority",
    "category": "Governance & compliance",
    "kicker": "Devolved power",
    "headline": "Devolve decisions without losing the audit trail",
    "lead": "Delegated authority lets a governing body grant specific decision-making powers to named roles, within defined limits and full traceability.",
    "definition": "Delegated authority is the formal grant of specific decision-making power from a governing body to a subordinate role, exercised within stated limits and conditions.",
    "why": [
      "Concentrating every decision at the top creates bottlenecks and obscures who actually acted on the institution's behalf.",
      "A clear delegation records exactly which powers were devolved, to whom, and under what constraints.",
      "Traceable delegation lets auditors confirm that each decision was made by someone genuinely empowered to make it."
    ],
    "how": [
      {
        "t": "Define the scope of power",
        "d": "State precisely what the delegate may decide, including monetary thresholds and document types covered."
      },
      {
        "t": "Bind it to conditions",
        "d": "Attach limits, expiry and reporting duties so the delegation cannot be stretched beyond its intent."
      },
      {
        "t": "Record and publish the grant",
        "d": "Capture the delegation in the governance record so its existence and scope are independently verifiable."
      }
    ],
    "faqs": [
      {
        "q": "What is delegated authority?",
        "a": "Delegated authority is the formal grant of specific decision-making power from a governing body to a subordinate role, exercised within stated limits and conditions."
      },
      {
        "q": "Can authority be sub-delegated?",
        "a": "Only if the original grant permits it; otherwise sub-delegation exceeds the mandate and the resulting decisions may be invalid."
      },
      {
        "q": "Does the delegating body keep responsibility?",
        "a": "Yes. Delegation devolves the power to act but the governing body remains accountable for the framework it set."
      }
    ],
    "relatedIndustries": [
      "government",
      "municipalities",
      "central-banks",
      "regulators"
    ],
    "relatedProblems": [
      "delegation-of-authority-instrument",
      "authorization-matrix",
      "mandate-of-office",
      "signing-authority", "framework-document"],
    "diagram": "chain",
    "metaTitle": "Delegated Authority: Devolved Decision Power",
    "metaDescription": "Delegated authority grants specific decision powers to named roles within defined limits. Learn how to scope, condition and record delegation."
  },
  {
    "slug": "delegation-of-authority-instrument",
    "term": "Delegation of authority instrument",
    "category": "Governance & compliance",
    "kicker": "Formal grant",
    "headline": "Put the grant of power on the record",
    "lead": "A delegation of authority instrument is the formal document that creates and evidences devolved decision-making power within an institution.",
    "definition": "A delegation of authority instrument is the formal document that records the grant of specific powers from a delegator to a delegate, defining scope, limits and duration.",
    "why": [
      "Powers that exist only by custom cannot be proven when a decision is later challenged.",
      "A written instrument fixes the scope and limits of the grant so its boundaries are unambiguous.",
      "A preserved instrument lets reviewers verify that an exercised power was actually conferred and still in force."
    ],
    "how": [
      {
        "t": "State delegator and delegate",
        "d": "Name the granting body and the receiving role, anchoring the chain of authority both backward and forward."
      },
      {
        "t": "Enumerate powers and limits",
        "d": "List each conferred power with its thresholds, exclusions and any conditions of exercise."
      },
      {
        "t": "Seal and version the document",
        "d": "Apply a tamper-evident seal so amendments are tracked and the operative version is always identifiable."
      }
    ],
    "faqs": [
      {
        "q": "What is a delegation of authority instrument?",
        "a": "A delegation of authority instrument is the formal document that records the grant of specific powers from a delegator to a delegate, defining scope, limits and duration."
      },
      {
        "q": "How is it different from delegated authority itself?",
        "a": "Delegated authority is the power; the instrument is the document that creates, scopes and evidences that power."
      },
      {
        "q": "How long does an instrument last?",
        "a": "It lasts until its stated expiry, revocation, or the departure of the delegating mandate, whichever the instrument specifies."
      }
    ],
    "relatedIndustries": [
      "government",
      "parliaments",
      "central-banks",
      "financial-institutions"
    ],
    "relatedProblems": [
      "delegated-authority-framework",
      "mandate-of-office",
      "authorization-control",
      "decision-record-keeping", "statutory-instrument"],
    "diagram": "chain",
    "metaTitle": "Delegation of Authority Instrument Explained",
    "metaDescription": "A delegation of authority instrument formally records the grant of decision powers, scope and limits. Learn how to draft and seal one as evidence."
  },
  {
    "slug": "authorization-matrix",
    "term": "Authorization matrix",
    "category": "Governance & compliance",
    "kicker": "Authority mapping",
    "headline": "See at a glance who can approve what",
    "lead": "An authorization matrix maps decision types against the roles empowered to approve them, removing ambiguity about who holds which authority.",
    "definition": "An authorization matrix is a structured table mapping decision or document types to the roles authorized to approve them, often qualified by value thresholds or conditions.",
    "why": [
      "When authority is undocumented, approvals are sought from the wrong people and genuine gaps go unnoticed.",
      "A matrix makes every authority relationship explicit in one place, comparable and reviewable.",
      "A maintained matrix lets auditors test whether each approval came from a role the institution authorized."
    ],
    "how": [
      {
        "t": "List decision categories",
        "d": "Break activity into the document and decision types that actually require authorization, avoiding vague catch-alls."
      },
      {
        "t": "Assign authorized roles",
        "d": "For each category, name the roles empowered to approve and any value or risk thresholds that apply."
      },
      {
        "t": "Govern changes to the matrix",
        "d": "Treat the matrix itself as a controlled document, sealing each version so its evolution is traceable."
      }
    ],
    "faqs": [
      {
        "q": "What is an authorization matrix?",
        "a": "An authorization matrix is a structured table mapping decision or document types to the roles authorized to approve them, often qualified by value thresholds or conditions."
      },
      {
        "q": "How does it relate to delegated authority?",
        "a": "It is often the practical summary of many delegations, showing in one view the authority each role holds."
      },
      {
        "q": "Who owns the matrix?",
        "a": "Typically a governance or compliance function owns it, but changes should follow the same approval discipline as any controlled document."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "government",
      "insurance",
      "regulators"
    ],
    "relatedProblems": [
      "delegated-authority-framework",
      "segregation-of-duties",
      "authorization-control",
      "approval-hierarchy"
    ],
    "diagram": "ledger",
    "metaTitle": "Authorization Matrix: Who Can Approve What",
    "metaDescription": "An authorization matrix maps decision types to the roles empowered to approve them. Learn how to build, threshold and govern an authority matrix."
  },
  {
    "slug": "segregation-of-duties",
    "term": "Segregation of duties",
    "category": "Governance & compliance",
    "kicker": "Conflict control",
    "headline": "Separate authoring from approving to reduce risk",
    "lead": "Segregation of duties splits incompatible responsibilities across different people so no single individual can both create and approve a document unchecked.",
    "definition": "Segregation of duties is the control principle that incompatible responsibilities, such as preparing and approving a document, must be assigned to different people.",
    "why": [
      "When one person both prepares and approves, errors and misconduct can pass without independent challenge.",
      "Splitting duties forces a second person into the path, creating a natural point of scrutiny.",
      "Documented separation lets auditors confirm that no conflicting roles were concentrated in a single actor."
    ],
    "how": [
      {
        "t": "Identify incompatible pairs",
        "d": "Determine which combinations of duties, such as authoring and approving, must never sit with one person."
      },
      {
        "t": "Allocate roles accordingly",
        "d": "Assign the conflicting duties to distinct roles and enforce the split in the workflow itself."
      },
      {
        "t": "Evidence the separation",
        "d": "Record the identities behind each step so the independence of preparer and approver is provable."
      }
    ],
    "faqs": [
      {
        "q": "What is segregation of duties?",
        "a": "Segregation of duties is the control principle that incompatible responsibilities, such as preparing and approving a document, must be assigned to different people."
      },
      {
        "q": "How does it relate to maker-checker?",
        "a": "Maker-checker is a common implementation of segregation of duties, separating the person who makes a change from the one who verifies it."
      },
      {
        "q": "What if staffing is too small to separate roles?",
        "a": "Where full separation is impractical, compensating controls such as independent review or enhanced logging help mitigate the concentration of duties."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "central-banks",
      "supreme-audit-institutions",
      "insurance"
    ],
    "relatedProblems": [
      "maker-checker-control",
      "four-eyes-principle",
      "authorization-control",
      "authorization-matrix"
    ],
    "diagram": "shield",
    "metaTitle": "Segregation of Duties: Separating Key Roles",
    "metaDescription": "Segregation of duties assigns incompatible responsibilities to different people. Learn how to identify conflicts and evidence the separation."
  },
  {
    "slug": "maker-checker-control",
    "term": "Maker-checker control",
    "category": "Governance & compliance",
    "kicker": "Dual control",
    "headline": "Pair every change with an independent verifier",
    "lead": "A maker-checker control requires one person to make a change and a different person to verify it before the change takes effect.",
    "definition": "A maker-checker control is a dual-control mechanism in which one person creates or changes a record and a second, independent person reviews and authorizes it before it becomes effective.",
    "why": [
      "A single actor working alone can introduce undetected errors that propagate into published records.",
      "Requiring a separate checker inserts an independent review at the point of change, not after the fact.",
      "Recorded maker and checker identities provide evidence that two distinct people stood behind each change."
    ],
    "how": [
      {
        "t": "Separate the two roles",
        "d": "Ensure the maker and checker are always different people, with the system preventing self-approval."
      },
      {
        "t": "Define what the checker verifies",
        "d": "Specify the checks the verifier must perform, from accuracy to authority, so review is substantive not nominal."
      },
      {
        "t": "Log both identities",
        "d": "Capture maker, checker, version and time in a tamper-evident record aligned to your control framework."
      }
    ],
    "faqs": [
      {
        "q": "What is a maker-checker control?",
        "a": "A maker-checker control is a dual-control mechanism in which one person creates or changes a record and a second, independent person reviews and authorizes it before it becomes effective."
      },
      {
        "q": "Is maker-checker the same as four-eyes?",
        "a": "They overlap; maker-checker is a specific two-role pattern, while the four-eyes principle is the broader requirement for two-person review."
      },
      {
        "q": "Can the same person be maker and checker?",
        "a": "No. The control only works when the two roles are held by different people, which the system should enforce."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "central-banks",
      "securities-regulators",
      "insurance"
    ],
    "relatedProblems": [
      "four-eyes-principle",
      "segregation-of-duties",
      "authorization-control",
      "approval-workflow-design"
    ],
    "diagram": "shield",
    "metaTitle": "Maker-Checker Control: Dual Verification",
    "metaDescription": "A maker-checker control pairs the person making a change with an independent verifier. Learn how to separate the roles and record both identities."
  },
  {
    "slug": "four-eyes-principle",
    "term": "Four-eyes principle",
    "category": "Governance & compliance",
    "kicker": "Two-person review",
    "headline": "Require two people to stand behind a decision",
    "lead": "The four-eyes principle requires that significant decisions and documents be reviewed and approved by at least two authorized people.",
    "definition": "The four-eyes principle is the governance requirement that a significant action or document be reviewed and authorized by at least two people before it takes effect.",
    "why": [
      "Decisions made by one person carry no independent check against bias, error or pressure.",
      "Requiring a second authorized reviewer brings a fresh perspective before the action becomes final.",
      "Capturing both reviewers' decisions evidences that the institution applied genuine dual oversight."
    ],
    "how": [
      {
        "t": "Set the trigger threshold",
        "d": "Define which decisions are significant enough to require two-person review, by value, risk or document type."
      },
      {
        "t": "Ensure reviewer independence",
        "d": "Require the second reviewer to be distinct and free of conflict, not merely a rubber stamp."
      },
      {
        "t": "Record both approvals",
        "d": "Capture each reviewer's identity, decision and version so the dual review is independently verifiable."
      }
    ],
    "faqs": [
      {
        "q": "What is the four-eyes principle?",
        "a": "The four-eyes principle is the governance requirement that a significant action or document be reviewed and authorized by at least two people before it takes effect."
      },
      {
        "q": "Does it always mean exactly two people?",
        "a": "At least two; higher-risk matters may require more reviewers, but two is the minimum the principle establishes."
      },
      {
        "q": "How is it enforced?",
        "a": "Workflows can block finalization until two distinct authorized approvals are recorded, preventing single-person completion."
      }
    ],
    "relatedIndustries": [
      "central-banks",
      "financial-institutions",
      "nuclear-regulators",
      "defence"
    ],
    "relatedProblems": [
      "maker-checker-control",
      "segregation-of-duties",
      "approval-hierarchy",
      "authorization-control"
    ],
    "diagram": "shield",
    "metaTitle": "Four-Eyes Principle: Two-Person Approval",
    "metaDescription": "The four-eyes principle requires at least two authorized people to review significant decisions. Learn how to set triggers and record dual approval."
  },
  {
    "slug": "approval-hierarchy",
    "term": "Approval hierarchy",
    "category": "Governance & compliance",
    "kicker": "Tiered authority",
    "headline": "Match approval depth to decision significance",
    "lead": "An approval hierarchy arranges authority in tiers so that the level of sign-off required rises with the significance of the decision.",
    "definition": "An approval hierarchy is a tiered ordering of approval authority in which higher-impact decisions require sign-off from more senior or numerous roles.",
    "why": [
      "Treating every decision the same way either over-burdens routine work or under-scrutinizes major commitments.",
      "A hierarchy calibrates the depth of review to the stakes, directing senior attention where it matters.",
      "A documented hierarchy lets reviewers confirm that each decision reached the level of authority its significance demanded."
    ],
    "how": [
      {
        "t": "Define the tiers",
        "d": "Establish levels of authority and the thresholds, such as value or risk, that move a decision between them."
      },
      {
        "t": "Map roles to tiers",
        "d": "Assign each role its approval ceiling so it is clear what a role may and may not authorize alone."
      },
      {
        "t": "Enforce escalation by tier",
        "d": "Configure the workflow to route decisions to the correct tier and capture each tier's approval."
      }
    ],
    "faqs": [
      {
        "q": "What is an approval hierarchy?",
        "a": "An approval hierarchy is a tiered ordering of approval authority in which higher-impact decisions require sign-off from more senior or numerous roles."
      },
      {
        "q": "How does it differ from an approval chain?",
        "a": "A hierarchy concerns the levels of authority by significance; a chain concerns the specific ordered sequence a given document follows."
      },
      {
        "q": "Who sets the thresholds?",
        "a": "The governing body sets thresholds as part of its delegation framework, and they should be recorded as a controlled reference."
      }
    ],
    "relatedIndustries": [
      "government",
      "financial-institutions",
      "universities",
      "municipalities"
    ],
    "relatedProblems": [
      "escalation-path",
      "approval-chain-management",
      "authorization-matrix",
      "delegated-authority-framework"
    ],
    "diagram": "chain",
    "metaTitle": "Approval Hierarchy: Tiered Sign-Off Levels",
    "metaDescription": "An approval hierarchy scales required sign-off to decision significance. Learn to define tiers, map roles and enforce escalation by impact."
  },
  {
    "slug": "escalation-path",
    "term": "Escalation path",
    "category": "Governance & compliance",
    "kicker": "Routing rules",
    "headline": "Send stalled or exceptional decisions to the right level",
    "lead": "An escalation path defines where a decision goes when it exceeds a role's authority, stalls, or meets a condition requiring higher review.",
    "definition": "An escalation path is the predefined route by which a decision is referred to a higher or alternative authority when it exceeds limits, stalls, or triggers a defined condition.",
    "why": [
      "Without a defined path, decisions beyond someone's authority stall silently or are resolved by whoever is available.",
      "A clear path states exactly where an out-of-limit or contested matter must go next.",
      "Recorded escalations evidence that exceptions were referred to a properly empowered authority rather than handled informally."
    ],
    "how": [
      {
        "t": "Define escalation triggers",
        "d": "Specify the conditions, such as exceeding a threshold or a deadlock, that require referral upward."
      },
      {
        "t": "Name the receiving authority",
        "d": "For each trigger, identify the role or body that must take the decision once escalated."
      },
      {
        "t": "Capture the handover",
        "d": "Record when and why a matter was escalated and who resolved it, preserving the decision trail."
      }
    ],
    "faqs": [
      {
        "q": "What is an escalation path?",
        "a": "An escalation path is the predefined route by which a decision is referred to a higher or alternative authority when it exceeds limits, stalls, or triggers a defined condition."
      },
      {
        "q": "When should escalation trigger automatically?",
        "a": "Whenever a decision exceeds a role's authority or breaches a defined timeout, the workflow should refer it without relying on manual judgment."
      },
      {
        "q": "Does escalation transfer accountability?",
        "a": "It transfers the decision to the receiving authority, who then becomes accountable for the choice they make."
      }
    ],
    "relatedIndustries": [
      "government",
      "emergency-management",
      "regulators",
      "financial-institutions"
    ],
    "relatedProblems": [
      "approval-hierarchy",
      "conditional-approval",
      "approval-chain-management",
      "authorization-control"
    ],
    "diagram": "workflow",
    "metaTitle": "Escalation Path: Routing Exceptional Decisions",
    "metaDescription": "An escalation path refers out-of-limit or stalled decisions to a higher authority. Learn to define triggers, name receivers and record handovers."
  },
  {
    "slug": "decision-record-keeping",
    "term": "Decision record",
    "category": "Governance & compliance",
    "kicker": "Captured choices",
    "headline": "Preserve what was decided, by whom and why",
    "lead": "A decision record captures a governance decision, the authority behind it, and the rationale, so the choice can be evidenced long after the meeting ends.",
    "definition": "A decision record is a preserved account of a governance decision, capturing what was decided, by whom under what authority, and on what basis.",
    "why": [
      "Decisions remembered only by participants become disputed and unverifiable over time.",
      "A structured record fixes the decision, its authority and its reasoning at the moment it was made.",
      "Sealed decision records let auditors and successors confirm the choice was made properly and has not been altered."
    ],
    "how": [
      {
        "t": "Capture the decision and context",
        "d": "Record the question, the decision reached, and the options or rationale considered."
      },
      {
        "t": "Attribute authority",
        "d": "Note who decided and the mandate under which they acted, linking to the relevant delegation."
      },
      {
        "t": "Seal the record",
        "d": "Apply a tamper-evident seal so the decision and its date cannot later be quietly revised."
      }
    ],
    "faqs": [
      {
        "q": "What is a decision record?",
        "a": "A decision record is a preserved account of a governance decision, capturing what was decided, by whom under what authority, and on what basis."
      },
      {
        "q": "How does it differ from minutes?",
        "a": "Minutes narrate a meeting; a decision record isolates a specific decision with its authority and rationale for durable reference."
      },
      {
        "q": "How long should decision records be kept?",
        "a": "They should be retained for at least as long as the decision has effect or any applicable legal retention period requires."
      }
    ],
    "relatedIndustries": [
      "government",
      "parliaments",
      "universities",
      "ngos"
    ],
    "relatedProblems": [
      "sign-off-process",
      "approval-audit-trail",
      "mandate-of-office", "memorandum-of-decision"],
    "diagram": "ledger",
    "metaTitle": "Decision Record: Preserving Governance Choices",
    "metaDescription": "A decision record captures what was decided, by whom and why. Learn how to attribute authority, capture rationale and seal the record as evidence."
  },
  {
    "slug": "authority-to-publish",
    "term": "Authority to publish",
    "category": "Governance & compliance",
    "kicker": "Publishing mandate",
    "headline": "Control who can release a document as official",
    "lead": "Authority to publish is the specific power to release a document as an official institutional record, distinct from authoring or approving its content.",
    "definition": "Authority to publish is the formally granted power to release a document as an official institutional record, separate from the authority to author or approve it.",
    "why": [
      "If anyone with access can publish, the institution cannot vouch for which documents truly speak in its name.",
      "Naming who holds publishing authority separates the act of release from the act of drafting or approving.",
      "Recorded publishing authority lets readers verify that an official document was released by someone empowered to do so."
    ],
    "how": [
      {
        "t": "Separate publish from approve",
        "d": "Treat releasing a document as a distinct authorized act, not an automatic consequence of content approval."
      },
      {
        "t": "Grant the power explicitly",
        "d": "Confer authority to publish on specific roles through the delegation framework, with any scope limits."
      },
      {
        "t": "Bind release to identity",
        "d": "Capture who exercised publishing authority and seal the released version so its provenance is provable."
      }
    ],
    "faqs": [
      {
        "q": "What is authority to publish?",
        "a": "Authority to publish is the formally granted power to release a document as an official institutional record, separate from the authority to author or approve it."
      },
      {
        "q": "Why separate it from approval?",
        "a": "Separating release from approval prevents an approved draft being published prematurely or by someone without the mandate to speak officially."
      },
      {
        "q": "Can publishing authority be limited?",
        "a": "Yes. It can be scoped to document types, channels or thresholds, just like any other delegated power."
      }
    ],
    "relatedIndustries": [
      "government",
      "national-statistics",
      "central-banks",
      "regulators"
    ],
    "relatedProblems": [
      "signing-authority",
      "delegated-authority-framework",
      "authorization-control",
      "approval-workflow-design"
    ],
    "diagram": "seal",
    "metaTitle": "Authority to Publish: Control Over Release",
    "metaDescription": "Authority to publish is the power to release a document as an official record. Learn to separate it from approval and bind release to identity."
  },
  {
    "slug": "signing-authority",
    "term": "Signing authority",
    "category": "Governance & compliance",
    "kicker": "Power to sign",
    "headline": "Define who can bind the institution by signature",
    "lead": "Signing authority is the formally conferred power to sign documents that commit or bind the institution, within stated limits.",
    "definition": "Signing authority is the formally conferred power to sign documents on behalf of an institution, binding it within defined limits and document types.",
    "why": [
      "A signature from someone without the mandate may leave the institution unbound or exposed to dispute.",
      "Defining signing authority states exactly who can commit the institution and to what extent.",
      "Verifiable signing authority lets counterparties and auditors confirm a signed document was executed by an empowered person."
    ],
    "how": [
      {
        "t": "Specify what may be signed",
        "d": "List the document types and value limits each signing role may execute on the institution's behalf."
      },
      {
        "t": "Link to the mandate",
        "d": "Trace each signing power back to the delegation or office that confers it, so authority is provable."
      },
      {
        "t": "Seal the signed record",
        "d": "Bind the signer's identity to the document with a tamper-evident seal capturing version and time."
      }
    ],
    "faqs": [
      {
        "q": "What is signing authority?",
        "a": "Signing authority is the formally conferred power to sign documents on behalf of an institution, binding it within defined limits and document types."
      },
      {
        "q": "How does it differ from authority to publish?",
        "a": "Signing authority binds the institution to the document's content; authority to publish governs releasing the document as an official record."
      },
      {
        "q": "Can signing authority have monetary limits?",
        "a": "Yes. It is commonly tiered by value, so larger commitments require a more senior signatory."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "government",
      "notarial-authorities",
      "chambers-of-commerce"
    ],
    "relatedProblems": [
      "authority-to-publish",
      "delegated-authority-framework",
      "authorization-matrix",
      "sign-off-process"
    ],
    "diagram": "seal",
    "metaTitle": "Signing Authority: Power to Bind by Signature",
    "metaDescription": "Signing authority is the power to sign documents that bind an institution. Learn how to scope it, link it to the mandate and seal signed records."
  },
  {
    "slug": "approval-chain-management",
    "term": "Approval chain",
    "category": "Governance & compliance",
    "kicker": "Ordered approvals",
    "headline": "Trace every link from draft to final approval",
    "lead": "An approval chain is the ordered sequence of approvers a specific document passes through, each link recorded as evidence of who approved when.",
    "definition": "An approval chain is the ordered sequence of approvers through which a specific document passes, with each approval recorded as a verifiable link in the chain.",
    "why": [
      "When approvals are scattered across emails, no one can reconstruct the full path a document took.",
      "A defined chain links each approval to the next, making the complete route visible end to end.",
      "An unbroken, sealed chain lets auditors confirm no required approval was skipped or back-dated."
    ],
    "how": [
      {
        "t": "Order the approvers",
        "d": "Set the precise sequence of approvals the document must collect before it is final."
      },
      {
        "t": "Validate each link",
        "d": "Confirm at every step that the approver holds the authority for that approval before advancing."
      },
      {
        "t": "Seal the completed chain",
        "d": "Preserve the full ordered set of approvals so the chain can be verified as intact later."
      }
    ],
    "faqs": [
      {
        "q": "What is an approval chain?",
        "a": "An approval chain is the ordered sequence of approvers through which a specific document passes, with each approval recorded as a verifiable link in the chain."
      },
      {
        "q": "What breaks an approval chain?",
        "a": "A skipped step, an approval by an unauthorized role, or a silent change after approval all break the integrity of the chain."
      },
      {
        "q": "How is chain integrity verified?",
        "a": "By checking that each recorded approval is present, in order, by an authorized role, and that the approved version was not altered."
      }
    ],
    "relatedIndustries": [
      "government",
      "financial-institutions",
      "regulators",
      "insurance"
    ],
    "relatedProblems": [
      "approval-workflow-design",
      "approval-hierarchy",
      "approval-audit-trail",
      "authorization-control"
    ],
    "diagram": "chain",
    "metaTitle": "Approval Chain: Ordered, Verifiable Sign-Offs",
    "metaDescription": "An approval chain is the ordered sequence of approvers a document passes through. Learn how to order, validate and seal each link as evidence."
  },
  {
    "slug": "authorization-control",
    "term": "Authorization control",
    "category": "Governance & compliance",
    "kicker": "Access to approve",
    "headline": "Ensure only empowered roles can authorize actions",
    "lead": "An authorization control enforces that an action proceeds only when performed by a role holding the authority to perform it.",
    "definition": "An authorization control is a mechanism that permits an action to proceed only when the actor holds the verified authority required for it.",
    "why": [
      "If authority is assumed rather than enforced, actions can be taken by people who were never empowered to take them.",
      "An authorization control checks the actor's mandate at the moment of action, not afterward.",
      "Enforced and logged controls give auditors evidence that every authorized action was backed by genuine authority."
    ],
    "how": [
      {
        "t": "Bind permissions to authority",
        "d": "Tie each privileged action to the delegation or matrix entry that grants it, not to convenience."
      },
      {
        "t": "Check authority at execution",
        "d": "Verify the actor's mandate when the action is attempted and block it if authority is absent or expired."
      },
      {
        "t": "Log allowed and denied attempts",
        "d": "Record both successful and refused authorizations so the control's operation is itself auditable."
      }
    ],
    "faqs": [
      {
        "q": "What is an authorization control?",
        "a": "An authorization control is a mechanism that permits an action to proceed only when the actor holds the verified authority required for it."
      },
      {
        "q": "How does it relate to the authorization matrix?",
        "a": "The matrix declares who may do what; the authorization control enforces that declaration at the point of action."
      },
      {
        "q": "Should denied attempts be recorded?",
        "a": "Yes. Logging refusals is as important as logging approvals, since it reveals attempts to act beyond authority."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "central-banks",
      "data-protection",
      "defence"
    ],
    "relatedProblems": [
      "authorization-matrix",
      "segregation-of-duties",
      "delegated-authority-framework",
      "approval-chain-management"
    ],
    "diagram": "shield",
    "metaTitle": "Authorization Control: Enforcing Authority",
    "metaDescription": "An authorization control lets an action proceed only when the actor holds verified authority. Learn to bind permissions and log attempts."
  },
  {
    "slug": "mandate-of-office",
    "term": "Mandate of office",
    "category": "Governance & compliance",
    "kicker": "Office-bound power",
    "headline": "Tie authority to the role, not the person",
    "lead": "A mandate of office is the set of powers and duties attached to a position itself, so authority transfers cleanly when the holder changes.",
    "definition": "A mandate of office is the body of powers and responsibilities attached to a defined position, exercised by whoever lawfully holds that office.",
    "why": [
      "When authority is tied to an individual, it lapses or becomes uncertain the moment that person leaves.",
      "Attaching the mandate to the office keeps powers stable across appointments and succession.",
      "A recorded mandate lets others verify that the current office-holder genuinely holds the powers they exercise."
    ],
    "how": [
      {
        "t": "Define the office's powers",
        "d": "Document the decisions, approvals and duties the position carries, independent of any individual."
      },
      {
        "t": "Record appointment and tenure",
        "d": "Capture who holds the office and for what period, so authority can be tied to a verifiable holder."
      },
      {
        "t": "Govern transitions",
        "d": "On appointment or departure, update the record so the mandate's current holder is always provable."
      }
    ],
    "faqs": [
      {
        "q": "What is a mandate of office?",
        "a": "A mandate of office is the body of powers and responsibilities attached to a defined position, exercised by whoever lawfully holds that office."
      },
      {
        "q": "How does it differ from delegated authority?",
        "a": "A mandate inheres in the office itself, whereas delegated authority is granted by one party to another and can be revoked."
      },
      {
        "q": "What happens when an office is vacant?",
        "a": "Its powers usually cannot be exercised until lawfully filled or temporarily assigned, which the governance record should reflect."
      }
    ],
    "relatedIndustries": [
      "government",
      "parliaments",
      "municipalities",
      "central-banks"
    ],
    "relatedProblems": [
      "delegated-authority-framework",
      "signing-authority",
      "decision-record-keeping",
      "governance-framework-alignment"
    ],
    "diagram": "chain",
    "metaTitle": "Mandate of Office: Authority Bound to Role",
    "metaDescription": "A mandate of office attaches powers to a position, not a person. Learn to define office powers, record tenure and govern transitions."
  },
  {
    "slug": "governance-framework-alignment",
    "term": "Governance framework",
    "category": "Governance & compliance",
    "kicker": "Structured oversight",
    "headline": "Align approvals to a coherent oversight structure",
    "lead": "A governance framework sets the rules, roles and controls under which decisions are made and approvals are granted across an institution.",
    "definition": "A governance framework is the structured set of rules, roles and controls that defines how decisions are authorized and overseen within an institution.",
    "why": [
      "Without a coherent framework, individual controls operate in isolation and gaps between them go unmanaged.",
      "A framework aligns approvals, delegations and controls into a single, consistent structure of oversight.",
      "An articulated framework lets auditors assess whether practice aligns with the governance the institution declares."
    ],
    "how": [
      {
        "t": "Define principles and roles",
        "d": "State the oversight principles and the roles responsible for decisions, approvals and review."
      },
      {
        "t": "Connect the controls",
        "d": "Show how delegation, segregation of duties and approval workflows fit together under the framework."
      },
      {
        "t": "Evidence alignment",
        "d": "Record how decisions follow the framework so conformance can be tested rather than assumed."
      }
    ],
    "faqs": [
      {
        "q": "What is a governance framework?",
        "a": "A governance framework is the structured set of rules, roles and controls that defines how decisions are authorized and overseen within an institution."
      },
      {
        "q": "Does a framework guarantee good decisions?",
        "a": "No. A framework sets the structure for sound decision-making and accountability, but it does not by itself guarantee outcomes."
      },
      {
        "q": "How is alignment with a framework shown?",
        "a": "By evidencing that approvals, delegations and controls were applied as the framework prescribes, through recorded and reviewable steps."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "universities",
      "financial-institutions"
    ],
    "relatedProblems": [
      "authorization-matrix",
      "segregation-of-duties",
      "approval-audit-trail",
      "mandate-of-office", "framework-document"],
    "diagram": "shield",
    "metaTitle": "Governance Framework: Aligned Oversight",
    "metaDescription": "A governance framework defines the rules, roles and controls for authorizing decisions. Learn how to align approvals and evidence conformance."
  },
  {
    "slug": "approval-audit-trail",
    "term": "Approval audit",
    "category": "Governance & compliance",
    "kicker": "Reviewable history",
    "headline": "Reconstruct exactly how an approval was granted",
    "lead": "An approval audit examines the recorded trail of an approval to confirm it followed the institution's rules of authority and sequence.",
    "definition": "An approval audit is a review of the recorded approval trail for a document, confirming that the required steps, authorities and sequence were genuinely followed.",
    "why": [
      "An approval that cannot be reconstructed afterward provides no real assurance that it was properly granted.",
      "An audit tests the recorded trail against the rules the institution set for who must approve and in what order.",
      "A reviewable, tamper-evident trail lets an auditor reach a defensible conclusion rather than rely on assurances."
    ],
    "how": [
      {
        "t": "Assemble the trail",
        "d": "Gather the recorded approvals, versions and timestamps that constitute the document's approval history."
      },
      {
        "t": "Test against the rules",
        "d": "Compare the trail to the required workflow, hierarchy and authorities to find gaps or anomalies."
      },
      {
        "t": "Confirm record integrity",
        "d": "Verify the trail's seals so the audit relies on evidence that has not been altered since capture."
      }
    ],
    "faqs": [
      {
        "q": "What is an approval audit?",
        "a": "An approval audit is a review of the recorded approval trail for a document, confirming that the required steps, authorities and sequence were genuinely followed."
      },
      {
        "q": "What does an approval audit look for?",
        "a": "It looks for missing approvals, sign-offs by unauthorized roles, out-of-order steps, and any changes made after approval."
      },
      {
        "q": "What makes an approval auditable?",
        "a": "Approvals are auditable when each step is recorded with identity, version and time in a tamper-evident form that can be independently checked."
      }
    ],
    "relatedIndustries": [
      "supreme-audit-institutions",
      "regulators",
      "financial-institutions",
      "government"
    ],
    "relatedProblems": [
      "approval-chain-management",
      "decision-record-keeping",
      "authorization-control",
      "governance-framework-alignment"
    ],
    "diagram": "ledger",
    "metaTitle": "Approval Audit: Reviewing the Approval Trail",
    "metaDescription": "An approval audit reviews the recorded trail to confirm required authorities and sequence were followed. Learn how to assemble and test it."
  },
  {
    "slug": "conditional-approval",
    "term": "Conditional approval",
    "category": "Governance & compliance",
    "kicker": "Approval with terms",
    "headline": "Approve subject to conditions, then track them",
    "lead": "A conditional approval grants sign-off only if specified conditions are met, requiring the conditions to be tracked through to satisfaction.",
    "definition": "A conditional approval is a sign-off granted subject to stated conditions, which take effect only once those conditions are satisfied and recorded.",
    "why": [
      "Approvals given verbally with caveats lose the caveats, leaving documents treated as fully approved when they are not.",
      "Recording conditions makes the limits of an approval explicit and binding on later use.",
      "Tracking conditions to closure evidences that the approval only took full effect once its terms were genuinely met."
    ],
    "how": [
      {
        "t": "State the conditions clearly",
        "d": "Write each condition so it is testable and unambiguous about what must occur before the approval is effective."
      },
      {
        "t": "Track to satisfaction",
        "d": "Record progress against each condition and who confirmed it, leaving no condition open without notice."
      },
      {
        "t": "Seal the final status",
        "d": "Capture when all conditions were met so the approval's transition to full effect is verifiable."
      }
    ],
    "faqs": [
      {
        "q": "What is a conditional approval?",
        "a": "A conditional approval is a sign-off granted subject to stated conditions, which take effect only once those conditions are satisfied and recorded."
      },
      {
        "q": "Is a document final under conditional approval?",
        "a": "Not until every condition is met and recorded; before that, the approval is contingent and the document should not be treated as final."
      },
      {
        "q": "Who confirms conditions are met?",
        "a": "Confirmation should come from a role with authority over each condition, with the confirmation recorded as part of the approval trail."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "financial-institutions",
      "pharmaceuticals",
      "public-procurement"
    ],
    "relatedProblems": [
      "escalation-path",
      "approval-workflow-design",
      "decision-record-keeping",
      "approval-audit-trail"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Conditional Approval: Sign-Off With Terms",
    "metaDescription": "A conditional approval grants sign-off subject to stated conditions tracked to satisfaction. Learn how to state, track and seal conditions."
  },
  {
    "slug": "board-minutes-management",
    "term": "Board minutes",
    "category": "Operations & workflow",
    "kicker": "Board records",
    "headline": "Make every board meeting defensibly documented",
    "lead": "Board minutes are the official account of what a board decided and why. When they are produced, approved and preserved under governance controls, they become the institution's primary evidence of decisions.",
    "definition": "Board minutes are the formal written record of a board meeting, capturing attendance, matters considered, decisions reached and the basis for them. They serve as the authoritative evidence that a board acted and how it acted.",
    "why": [
      "Minutes are the first document examined when a board decision is challenged by regulators, courts or shareholders, so their integrity determines whether a decision can be defended.",
      "Loose drafting, late approval or untracked edits create ambiguity about what was actually decided, exposing directors to personal liability.",
      "A governed minute-taking process produces a consistent, time-stamped record that survives staff turnover and reconstructs decisions years later."
    ],
    "how": [
      {
        "t": "Capture under a fixed template",
        "d": "Record attendance, quorum, conflicts, matters tabled and resolutions using a consistent structure so every meeting produces comparable, complete evidence."
      },
      {
        "t": "Approve and lock",
        "d": "Route the draft for chair and board approval, then seal the approved version so later edits are visible and the canonical record is unambiguous."
      },
      {
        "t": "Preserve with provenance",
        "d": "Store approved minutes with author, timestamp and version history so the chain from draft to adopted record is auditable."
      }
    ],
    "faqs": [
      {
        "q": "What are board minutes?",
        "a": "Board minutes are the formal written record of a board meeting, capturing attendance, matters considered, decisions reached and the basis for them, serving as authoritative evidence of how the board acted."
      },
      {
        "q": "When do minutes become official?",
        "a": "Minutes are typically draft until the board formally approves them, usually at the next meeting. Approval should be recorded and the adopted version preserved so it cannot be silently altered."
      },
      {
        "q": "How long should minutes be retained?",
        "a": "Retention is governed by company law and sector rules and is frequently permanent or for the life of the entity. Aligning your retention schedule with statutory requirements supports defensibility."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "central-banks",
      "development-banks",
      "stock-exchanges"
    ],
    "relatedProblems": [
      "board-resolution-software",
      "board-pack-management",
      "board-meeting-record",
      "minute-book-management"
    ],
    "diagram": "ledger",
    "metaTitle": "Board Minutes: Governed Records of Board Decisions",
    "metaDescription": "Board minutes are the official record of board decisions. Learn how governed capture, approval and preservation make them defensible evidence."
  },
  {
    "slug": "minute-book-management",
    "term": "Minute book",
    "category": "Operations & workflow",
    "kicker": "Corporate records",
    "headline": "Keep the company's decision history intact and accessible",
    "lead": "The minute book is the consolidated record of a company's board and shareholder proceedings. Maintained under governance controls, it becomes a continuous, verifiable history rather than a scattered file.",
    "definition": "Minute book is the official, ordered collection of a company's meeting minutes, resolutions and related governance records. It is the central repository auditors, regulators and successors rely on to reconstruct corporate decisions.",
    "why": [
      "When ownership, directors or advisers change, the minute book is the single source that explains how the company reached its current state, so gaps create real legal and transactional risk.",
      "In due diligence and litigation, an incomplete or disordered minute book undermines confidence in every decision it should record.",
      "A governed minute book maintains continuity across decades, surviving system migrations and personnel changes that would otherwise fragment the record."
    ],
    "how": [
      {
        "t": "Centralize the record",
        "d": "Hold all approved minutes, resolutions and certificates in one governed repository rather than dispersed inboxes and drives."
      },
      {
        "t": "Maintain chronological integrity",
        "d": "Index entries by date and meeting so the sequence of decisions is complete and any missing period is obvious."
      },
      {
        "t": "Seal each entry",
        "d": "Preserve every approved document with provenance so the book can be verified entry by entry, not taken on trust."
      }
    ],
    "faqs": [
      {
        "q": "What is a minute book?",
        "a": "A minute book is the official, ordered collection of a company's meeting minutes, resolutions and related governance records, serving as the central repository for reconstructing corporate decisions."
      },
      {
        "q": "Can a minute book be kept digitally?",
        "a": "Yes, where law permits, provided the digital record offers integrity, provenance and accessibility equivalent to or better than paper, with controls that prevent undetected alteration."
      },
      {
        "q": "Who is responsible for the minute book?",
        "a": "The company secretary or equivalent officer typically maintains it, ensuring entries are complete, approved and preserved in line with statutory obligations."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "chambers-of-commerce",
      "professional-bodies",
      "central-banks"
    ],
    "relatedProblems": [
      "board-minutes-management",
      "statutory-register-management",
      "board-resolution-software",
      "company-register-management"
    ],
    "diagram": "ledger",
    "metaTitle": "Minute Book: The Company's Decision Record",
    "metaDescription": "A minute book is the ordered record of a company's meetings and resolutions. Learn how to keep it complete, sealed and audit-ready."
  },
  {
    "slug": "written-resolution-workflow",
    "term": "Written resolution",
    "category": "Operations & workflow",
    "kicker": "Resolutions",
    "headline": "Pass decisions out of session without losing rigor",
    "lead": "A written resolution lets a board or members decide without convening a meeting. Governed properly, it carries the same evidential weight as a decision minuted in session.",
    "definition": "Written resolution is a decision adopted by directors or members in writing rather than at a convened meeting, signed or assented to by the required participants. It is valid only when the prescribed thresholds and procedures are met.",
    "why": [
      "Out-of-session decisions are common and fast, but informal email approvals leave no defensible record of who agreed and when.",
      "If the required majority, eligibility or circulation steps are not evidenced, the resolution can later be void or challenged.",
      "A governed written-resolution process captures each participant's assent with provenance, so the decision is as auditable as any minuted vote."
    ],
    "how": [
      {
        "t": "Circulate the exact text",
        "d": "Issue the resolution wording to all eligible participants so everyone assents to identical terms, not paraphrases."
      },
      {
        "t": "Record each assent",
        "d": "Capture every signature or approval with signer identity and timestamp to evidence that the threshold was met."
      },
      {
        "t": "Seal the adopted resolution",
        "d": "Lock the passed resolution and file it to the minute book so its validity can be verified later."
      }
    ],
    "faqs": [
      {
        "q": "What is a written resolution?",
        "a": "A written resolution is a decision adopted by directors or members in writing rather than at a convened meeting, signed or assented to by the required participants under the prescribed procedure."
      },
      {
        "q": "Is a written resolution as valid as a meeting vote?",
        "a": "Yes, when the governing rules permit it and the required thresholds, eligibility and circulation steps are satisfied and evidenced. Missing any step can render it invalid."
      },
      {
        "q": "Do all participants need to sign?",
        "a": "It depends on the entity's rules. Some require unanimity, others a stated majority. The process should record exactly who assented to prove the threshold was reached."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "professional-bodies",
      "ngos",
      "development-banks"
    ],
    "relatedProblems": [
      "board-resolution-software",
      "circular-resolution-workflow",
      "directors-written-consent",
      "shareholder-resolution-record"
    ],
    "diagram": "workflow",
    "metaTitle": "Written Resolution: Out-of-Session Decisions, Done Right",
    "metaDescription": "A written resolution lets boards and members decide without a meeting. Learn how to evidence assent and thresholds so it holds up."
  },
  {
    "slug": "agm-resolution-record",
    "term": "AGM resolution",
    "category": "Operations & workflow",
    "kicker": "Shareholder governance",
    "headline": "Record annual general meeting decisions beyond dispute",
    "lead": "AGM resolutions formalize the decisions members take at the annual general meeting. Captured and sealed under governance controls, they form the authoritative record of shareholder will.",
    "definition": "AGM resolution is a decision passed by members at a company's annual general meeting, such as approving accounts, appointing directors or declaring dividends. It records the formal exercise of shareholder authority.",
    "why": [
      "AGM outcomes affect dividends, director mandates and accounts approval, so any doubt about the count or wording has wide consequences.",
      "Where voting, quorum or notice is poorly evidenced, resolutions can be challenged and the meeting's authority questioned.",
      "A governed record ties each resolution to its votes, notice and quorum evidence, producing a defensible account of what members decided."
    ],
    "how": [
      {
        "t": "Fix the resolution text",
        "d": "Record the exact wording put to members so the adopted decision is unambiguous and matches the notice circulated."
      },
      {
        "t": "Evidence the vote",
        "d": "Capture quorum, voting method and results so the outcome and its threshold can be verified afterwards."
      },
      {
        "t": "Seal and file",
        "d": "Lock the adopted resolution into the minute book with provenance so it stands as the authoritative member decision."
      }
    ],
    "faqs": [
      {
        "q": "What is an AGM resolution?",
        "a": "An AGM resolution is a decision passed by members at a company's annual general meeting, such as approving accounts or appointing directors, recording the formal exercise of shareholder authority."
      },
      {
        "q": "What is the difference between ordinary and special resolutions?",
        "a": "Ordinary resolutions pass on a simple majority, while special resolutions require a higher threshold set by law or constitution. The record should evidence which threshold applied and was met."
      },
      {
        "q": "Must AGM resolutions be filed publicly?",
        "a": "Certain resolutions must be filed with a registry under company law, while others are kept internally. The governed record supports both internal proof and any required external filing."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "stock-exchanges",
      "securities-regulators",
      "development-banks"
    ],
    "relatedProblems": [
      "shareholder-resolution-record",
      "board-resolution-software",
      "register-of-members-management",
      "board-minutes-management"
    ],
    "diagram": "ledger",
    "metaTitle": "AGM Resolution: Recording Shareholder Decisions",
    "metaDescription": "An AGM resolution records decisions members take at the annual general meeting. Learn how to evidence wording, votes and quorum."
  },
  {
    "slug": "statutory-register-management",
    "term": "Statutory register",
    "category": "Operations & workflow",
    "kicker": "Statutory records",
    "headline": "Keep mandatory company registers current and verifiable",
    "lead": "Statutory registers are the records a company is legally required to maintain about its directors, members and affairs. Governance controls keep them accurate, current and provable.",
    "definition": "Statutory register is a record a company must maintain by law, such as registers of directors, members or charges. It evidences the company's legal state to regulators, members and third parties.",
    "why": [
      "Statutory registers are relied on by regulators, lenders and counterparties as the authoritative statement of who governs and owns the company.",
      "Out-of-date or inconsistent registers can breach company law, trigger penalties and undermine transactions that depend on them.",
      "A governed register links every entry to the resolution or filing that authorized it, so accuracy can be demonstrated, not merely asserted."
    ],
    "how": [
      {
        "t": "Define each register's scope",
        "d": "Maintain a clear schedule of required registers and the data each must hold to satisfy statute."
      },
      {
        "t": "Update on authorized events",
        "d": "Record changes only against the appointing resolution, transfer or filing that authorizes them, with timestamps."
      },
      {
        "t": "Preserve change history",
        "d": "Keep prior states and provenance so any historical position of the register can be reconstructed and verified."
      }
    ],
    "faqs": [
      {
        "q": "What is a statutory register?",
        "a": "A statutory register is a record a company must maintain by law, such as registers of directors, members or charges, evidencing the company's legal state to regulators, members and third parties."
      },
      {
        "q": "Where must statutory registers be kept?",
        "a": "Law usually requires them at the registered office or a permitted alternative location, available for inspection. Digital maintenance is allowed where it meets statutory integrity and access standards."
      },
      {
        "q": "What happens if a register is inaccurate?",
        "a": "Inaccuracy can breach company law and expose officers to penalties, and can also invalidate reliance by third parties. A governed update process reduces this risk."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "land-registries",
      "chambers-of-commerce",
      "central-banks"
    ],
    "relatedProblems": [
      "register-of-directors-management",
      "register-of-members-management",
      "register-of-charges-management",
      "company-register-management", "register-of-secretaries"],
    "diagram": "ledger",
    "metaTitle": "Statutory Register: Mandatory Company Records",
    "metaDescription": "A statutory register is a record companies must keep by law. Learn how governed updates keep directors, members and charges provable."
  },
  {
    "slug": "register-of-directors-management",
    "term": "Register of directors",
    "category": "Operations & workflow",
    "kicker": "Statutory records",
    "headline": "Prove who governs the company, and since when",
    "lead": "The register of directors records the people legally responsible for governing a company. Maintained under governance controls, it is the verifiable statement of current and past directorships.",
    "definition": "Register of directors is the statutory record of a company's current and former directors, including their appointment and cessation details. It establishes who holds governing authority and over what period.",
    "why": [
      "Counterparties and regulators rely on the register to confirm who can lawfully bind and govern the company, so errors affect the validity of acts taken in its name.",
      "Unevidenced appointments or delayed removals create gaps in the authority record that can be exploited or disputed.",
      "A governed register ties each entry to the board or member resolution that effected it, so directorship can be proven at any date."
    ],
    "how": [
      {
        "t": "Record from source decisions",
        "d": "Enter appointments and cessations only against the resolution or notice that authorized them, capturing effective dates."
      },
      {
        "t": "Maintain full history",
        "d": "Keep former directors and their service periods so authority at any past moment can be reconstructed."
      },
      {
        "t": "Seal each change",
        "d": "Preserve entries with provenance so the register can be independently verified against its underlying acts."
      }
    ],
    "faqs": [
      {
        "q": "What is a register of directors?",
        "a": "A register of directors is the statutory record of a company's current and former directors, including appointment and cessation details, establishing who holds governing authority and over what period."
      },
      {
        "q": "Does the register prove a director's authority?",
        "a": "It provides strong evidence of who was appointed and when, especially when each entry links to the authorizing resolution. It supports, alongside the constitution, conclusions about authority."
      },
      {
        "q": "Must changes be filed externally?",
        "a": "Many jurisdictions require appointments and cessations to be notified to a public registry within set deadlines. The internal register and the external filing should remain consistent."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "central-banks",
      "chambers-of-commerce",
      "professional-bodies"
    ],
    "relatedProblems": [
      "statutory-register-management",
      "certificate-of-incumbency",
      "secretarys-certificate",
      "company-register-management", "register-of-secretaries"],
    "diagram": "ledger",
    "metaTitle": "Register of Directors: Proof of Who Governs",
    "metaDescription": "A register of directors records current and former directors. Learn how governed entries prove appointments, cessations and authority."
  },
  {
    "slug": "register-of-members-management",
    "term": "Register of members",
    "category": "Operations & workflow",
    "kicker": "Statutory records",
    "headline": "Establish ownership of the company beyond dispute",
    "lead": "The register of members records who owns shares in a company. Maintained under governance controls, it is the authoritative statement of membership and the rights that flow from it.",
    "definition": "Register of members is the statutory record of a company's shareholders, their holdings and the dates of entry and exit. It is the primary evidence of legal ownership and of the rights attaching to membership.",
    "why": [
      "Voting, dividends and pre-emption rights all flow from the register, so its accuracy directly determines who can exercise ownership rights.",
      "Untracked transfers or allotments break the ownership chain and can invalidate distributions and votes.",
      "A governed register links each entry to the transfer, allotment or resolution behind it, so ownership at any date is provable."
    ],
    "how": [
      {
        "t": "Record from instruments",
        "d": "Update holdings only against valid transfers, allotments or court orders, recording effective dates and consideration where relevant."
      },
      {
        "t": "Keep entry and exit history",
        "d": "Preserve former members and prior holdings so historical ownership and entitlements can be reconstructed."
      },
      {
        "t": "Seal the register state",
        "d": "Lock each updated state with provenance so the ownership record can be verified rather than trusted."
      }
    ],
    "faqs": [
      {
        "q": "What is a register of members?",
        "a": "A register of members is the statutory record of a company's shareholders, their holdings and the dates of entry and exit, serving as primary evidence of legal ownership and membership rights."
      },
      {
        "q": "Is the register conclusive proof of ownership?",
        "a": "In many jurisdictions it is strong, often presumptive, evidence of ownership, though it can be corrected for error. A governed update history strengthens its reliability."
      },
      {
        "q": "Who can inspect the register of members?",
        "a": "Members and, subject to safeguards, others may have inspection rights under company law. Access controls should honor these rights while protecting against misuse of the data."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "stock-exchanges",
      "securities-regulators",
      "central-banks"
    ],
    "relatedProblems": [
      "statutory-register-management",
      "beneficial-ownership-register",
      "shareholder-resolution-record",
      "company-register-management", "register-of-secretaries"],
    "diagram": "ledger",
    "metaTitle": "Register of Members: Proof of Share Ownership",
    "metaDescription": "A register of members records shareholders and their holdings. Learn how governed entries make ownership and rights provable."
  },
  {
    "slug": "corporate-seal-controls",
    "term": "Corporate seal",
    "category": "Operations & workflow",
    "kicker": "Execution controls",
    "headline": "Control the company's mark of formal execution",
    "lead": "The corporate seal is the company's formal mark of execution on documents. Under governance controls, every use is authorized, recorded and verifiable, so sealed documents are trustworthy.",
    "definition": "Corporate seal is the company's official mark used to execute documents in its name, evidencing that the company formally adopted them. Its use should be authorized and recorded to prevent misuse.",
    "why": [
      "A sealed document carries the company's formal commitment, so unauthorized sealing can bind the company to obligations it never approved.",
      "Without a record of who authorized and applied the seal, contested documents cannot be defended or repudiated with confidence.",
      "A governed seal process logs each application against an authorizing resolution, creating a verifiable trail of legitimate execution."
    ],
    "how": [
      {
        "t": "Restrict custody",
        "d": "Hold the seal, physical or electronic, under defined custody with named officers responsible for its use."
      },
      {
        "t": "Authorize each use",
        "d": "Permit sealing only against an enabling resolution or delegated authority, recording the document and signatories."
      },
      {
        "t": "Log and seal the record",
        "d": "Maintain a register of sealings with provenance so each application can be verified after the fact."
      }
    ],
    "faqs": [
      {
        "q": "What is a corporate seal?",
        "a": "A corporate seal is the company's official mark used to execute documents in its name, evidencing that the company formally adopted them, with use that should be authorized and recorded."
      },
      {
        "q": "Is a corporate seal still required?",
        "a": "Many jurisdictions no longer mandate a physical seal and allow execution by authorized signatories. Where a seal is used, governing its application remains important to prevent misuse."
      },
      {
        "q": "How is seal misuse prevented?",
        "a": "By restricting custody, requiring an authorizing resolution for each use and maintaining a sealing register. These controls let the company prove or deny that a sealing was legitimate."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "notarial-authorities",
      "land-registries",
      "central-banks"
    ],
    "relatedProblems": [
      "secretarys-certificate",
      "board-resolution-software",
      "directors-written-consent",
      "certificate-of-incumbency"
    ],
    "diagram": "shield",
    "metaTitle": "Corporate Seal: Controlled Formal Execution",
    "metaDescription": "A corporate seal marks formal execution of company documents. Learn how custody, authorization and logging prevent misuse."
  },
  {
    "slug": "secretarys-certificate",
    "term": "Secretary's certificate",
    "category": "Operations & workflow",
    "kicker": "Officer certification",
    "headline": "Certify corporate facts that counterparties can rely on",
    "lead": "A secretary's certificate is an officer's formal attestation of corporate facts, such as resolutions or signing authority. Issued under governance controls, it gives counterparties a verifiable basis to act.",
    "definition": "Secretary's certificate is a document in which a company's secretary attests to corporate facts, such as the passing of a resolution, the incumbency of officers or the company's good standing. It allows third parties to rely on those facts.",
    "why": [
      "Lenders, counterparties and notaries often require certified confirmation of authority before transacting, so the certificate is a gateway to deals closing.",
      "If the underlying facts are misstated or the certificate is forged, parties relying on it suffer loss and the company faces dispute.",
      "A governed certificate is tied to the resolutions and registers it certifies, with provenance that lets recipients verify it independently."
    ],
    "how": [
      {
        "t": "Anchor to source records",
        "d": "Draw certified facts directly from approved resolutions and statutory registers rather than from memory or summaries."
      },
      {
        "t": "Attest with authority",
        "d": "Have the secretary or authorized officer certify, recording their identity and the date of attestation."
      },
      {
        "t": "Seal for verification",
        "d": "Issue the certificate with provenance so recipients can confirm it is genuine and unaltered."
      }
    ],
    "faqs": [
      {
        "q": "What is a secretary's certificate?",
        "a": "A secretary's certificate is a document in which a company's secretary attests to corporate facts, such as a resolution or officer incumbency, allowing third parties to rely on those facts."
      },
      {
        "q": "Why do counterparties request one?",
        "a": "It gives them a defensible basis to conclude that a transaction is duly authorized, reducing the risk that the company later denies the authority of its signatories."
      },
      {
        "q": "What makes a certificate reliable?",
        "a": "Reliability comes from anchoring certified facts to approved resolutions and registers, certification by an authorized officer, and provenance that lets recipients verify the document."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "notarial-authorities",
      "development-banks",
      "central-banks"
    ],
    "relatedProblems": [
      "certificate-of-incumbency",
      "board-resolution-software",
      "corporate-seal-controls",
      "register-of-directors-management", "birth-certificate-issuance"],
    "diagram": "seal",
    "metaTitle": "Secretary's Certificate: Certifying Corporate Facts",
    "metaDescription": "A secretary's certificate attests to resolutions, authority and standing. Learn how to anchor and seal it so counterparties can rely on it."
  },
  {
    "slug": "certificate-of-incumbency",
    "term": "Certificate of incumbency",
    "category": "Operations & workflow",
    "kicker": "Officer certification",
    "headline": "Confirm who holds office, for those who must rely on it",
    "lead": "A certificate of incumbency confirms the current directors, officers and authorized signatories of a company. Produced under governance controls, it gives banks and counterparties a verifiable statement of who acts for the company.",
    "definition": "Certificate of incumbency is a document confirming the identities, offices and signing authority of a company's directors and officers at a given date. It is used by banks and counterparties to verify who may act on the company's behalf.",
    "why": [
      "Banks and counterparties open accounts and execute transactions on the strength of incumbency confirmation, so accuracy is a precondition for those activities.",
      "If office-holders are misstated, parties may accept instructions from people lacking authority, exposing all sides to loss.",
      "A governed certificate draws from the register of directors and authorizing resolutions, so the stated office-holders can be verified against source records."
    ],
    "how": [
      {
        "t": "Source from the register",
        "d": "Compile incumbents from the current register of directors and officers rather than ad hoc lists."
      },
      {
        "t": "State authority precisely",
        "d": "Record each person's office and signing authority as conferred by resolution or constitution, with the effective date."
      },
      {
        "t": "Seal as at a date",
        "d": "Issue the certificate fixed to a date with provenance so reliance is anchored to a verifiable point in time."
      }
    ],
    "faqs": [
      {
        "q": "What is a certificate of incumbency?",
        "a": "A certificate of incumbency is a document confirming the identities, offices and signing authority of a company's directors and officers at a given date, used to verify who may act for the company."
      },
      {
        "q": "Who issues a certificate of incumbency?",
        "a": "It is typically issued by the company secretary or a registered agent, attesting to the current office-holders. Its reliability depends on alignment with the underlying registers."
      },
      {
        "q": "Why is it dated to a specific moment?",
        "a": "Because office-holders change, the certificate confirms the position as at a stated date so that any party relying on it knows precisely what point in time it reflects."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "notarial-authorities",
      "central-banks",
      "development-banks"
    ],
    "relatedProblems": [
      "secretarys-certificate",
      "register-of-directors-management",
      "statutory-register-management",
      "board-resolution-software"
    ],
    "diagram": "seal",
    "metaTitle": "Certificate of Incumbency: Verifying Office-Holders",
    "metaDescription": "A certificate of incumbency confirms a company's directors, officers and signing authority. Learn how to source and seal it for reliance."
  },
  {
    "slug": "board-pack-management",
    "term": "Board pack",
    "category": "Operations & workflow",
    "kicker": "Meeting materials",
    "headline": "Give directors a complete, governed basis to decide",
    "lead": "The board pack is the curated set of papers directors receive before a meeting. Assembled and preserved under governance controls, it evidences the information on which decisions were based.",
    "definition": "Board pack is the collection of agenda, reports and supporting papers circulated to directors ahead of a board meeting. It documents the information available to the board when it made its decisions.",
    "why": [
      "Decisions are judged partly on the information directors had, so the pack is evidence of whether the board was properly informed.",
      "If papers are circulated inconsistently or cannot be reconstructed, it becomes hard to show that directors discharged their duty of care.",
      "A governed board pack fixes exactly which version of each paper was put before the board, so the evidential basis of a decision is preserved."
    ],
    "how": [
      {
        "t": "Assemble against the agenda",
        "d": "Compile papers mapped to agenda items so every matter for decision has its supporting material identified."
      },
      {
        "t": "Version the contents",
        "d": "Fix the circulated version of each paper so the record reflects exactly what directors received, not later revisions."
      },
      {
        "t": "Preserve with the minutes",
        "d": "Seal the final pack and link it to the meeting record so the information basis of each decision is auditable."
      }
    ],
    "faqs": [
      {
        "q": "What is a board pack?",
        "a": "A board pack is the collection of agenda, reports and supporting papers circulated to directors ahead of a board meeting, documenting the information available to the board when it decided."
      },
      {
        "q": "Why preserve the board pack?",
        "a": "Because the quality of a decision is assessed against the information directors had, preserving the exact pack evidences that the board was properly informed at the time."
      },
      {
        "q": "Should the board pack be linked to the minutes?",
        "a": "Yes. Linking the sealed pack to the meeting record connects each decision to the material that supported it, strengthening the defensibility of the whole governance file."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "central-banks",
      "development-banks",
      "ngos"
    ],
    "relatedProblems": [
      "board-minutes-management",
      "board-meeting-record",
      "board-resolution-software",
      "minute-book-management"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Board Pack: Governed Meeting Materials",
    "metaDescription": "A board pack is the papers directors receive before a meeting. Learn how to version and preserve it as the basis for decisions."
  },
  {
    "slug": "board-meeting-record",
    "term": "Board meeting record",
    "category": "Operations & workflow",
    "kicker": "Board records",
    "headline": "Bind the agenda, papers and decisions into one file",
    "lead": "The board meeting record is the complete file of a single board meeting, from notice and pack to minutes and resolutions. Held under governance controls, it is a self-contained, verifiable account of that meeting.",
    "definition": "Board meeting record is the consolidated set of documents for one board meeting, including notice, agenda, board pack, attendance, minutes and resolutions. It provides a complete, ordered account of how the meeting was convened and what it decided.",
    "why": [
      "Scrutiny of a decision usually requires the whole meeting context, so a fragmented record forces costly reconstruction from scattered sources.",
      "Missing notice or attendance evidence can put the validity of the meeting itself in question, not just an individual decision.",
      "A governed meeting record binds every component with provenance, so the convening, conduct and outcomes of the meeting are provable together."
    ],
    "how": [
      {
        "t": "Bundle by meeting",
        "d": "Group notice, agenda, pack, attendance, minutes and resolutions into a single file per meeting."
      },
      {
        "t": "Evidence procedure",
        "d": "Include proof of notice, quorum and attendance so the meeting's validity, not only its outcomes, can be demonstrated."
      },
      {
        "t": "Seal the bundle",
        "d": "Lock the completed record with provenance so the meeting can be reviewed as one coherent, verifiable unit."
      }
    ],
    "faqs": [
      {
        "q": "What is a board meeting record?",
        "a": "A board meeting record is the consolidated set of documents for one board meeting, including notice, agenda, pack, attendance, minutes and resolutions, providing a complete account of the meeting."
      },
      {
        "q": "How does it differ from minutes?",
        "a": "Minutes capture the decisions and discussion, while the meeting record bundles the minutes with the notice, pack, attendance and resolutions to evidence the meeting's validity and full context."
      },
      {
        "q": "Why bundle everything together?",
        "a": "Bundling lets reviewers assess a decision with its full procedural context in one place, avoiding reconstruction and reducing the risk that the meeting's validity is later doubted."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "central-banks",
      "development-banks",
      "ngos"
    ],
    "relatedProblems": [
      "board-minutes-management",
      "board-pack-management",
      "board-resolution-software",
      "minute-book-management"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Board Meeting Record: One Verifiable Meeting File",
    "metaDescription": "A board meeting record bundles notice, pack, minutes and resolutions for one meeting. Learn how to assemble and seal it as evidence."
  },
  {
    "slug": "shareholder-resolution-record",
    "term": "Shareholder resolution",
    "category": "Operations & workflow",
    "kicker": "Shareholder governance",
    "headline": "Record member decisions with provable authority",
    "lead": "A shareholder resolution is a decision passed by a company's members. Captured and sealed under governance controls, it is the authoritative evidence of the will of the company's owners.",
    "definition": "Shareholder resolution is a decision adopted by a company's members, whether at a general meeting or in writing, on matters reserved to them. It records the exercise of ownership authority over the company.",
    "why": [
      "Constitutional changes, director appointments and major transactions often require member approval, so the resolution record gates significant corporate acts.",
      "If quorum, eligibility or majority is not evidenced, the resolution and the acts depending on it can be challenged.",
      "A governed record ties each resolution to its voting evidence and threshold, so member authority can be proven rather than assumed."
    ],
    "how": [
      {
        "t": "Fix wording and class",
        "d": "Record the exact resolution text and the member class entitled to vote so the decision and eligibility are clear."
      },
      {
        "t": "Capture the vote",
        "d": "Evidence quorum, method and result so the applicable majority can be shown to have been met."
      },
      {
        "t": "Seal into the record",
        "d": "Lock the adopted resolution with provenance and file it so its validity is verifiable over time."
      }
    ],
    "faqs": [
      {
        "q": "What is a shareholder resolution?",
        "a": "A shareholder resolution is a decision adopted by a company's members, at a general meeting or in writing, on matters reserved to them, recording the exercise of ownership authority over the company."
      },
      {
        "q": "How does it differ from a board resolution?",
        "a": "A board resolution is passed by directors exercising management authority, while a shareholder resolution is passed by members exercising ownership authority over reserved matters such as constitutional changes."
      },
      {
        "q": "Can shareholder resolutions be passed in writing?",
        "a": "Often yes, where the constitution and law permit, through a written or circular process. The same evidential rigor on eligibility and thresholds should apply as at a meeting."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "stock-exchanges",
      "securities-regulators",
      "development-banks"
    ],
    "relatedProblems": [
      "agm-resolution-record",
      "register-of-members-management",
      "written-resolution-workflow",
      "board-resolution-software"
    ],
    "diagram": "ledger",
    "metaTitle": "Shareholder Resolution: Recording Member Decisions",
    "metaDescription": "A shareholder resolution records decisions by company members. Learn how to evidence wording, eligibility and votes so it holds up."
  },
  {
    "slug": "circular-resolution-workflow",
    "term": "Circular resolution",
    "category": "Operations & workflow",
    "kicker": "Resolutions",
    "headline": "Pass board decisions by circulation with full rigor",
    "lead": "A circular resolution lets directors decide by circulating a document for signature instead of meeting. Governed properly, it produces the same defensible record as a decision taken in session.",
    "definition": "Circular resolution is a board decision adopted by circulating the resolution to directors for their signature or assent rather than convening a meeting. It is valid only when the constitution permits it and the required directors assent.",
    "why": [
      "Boards frequently need decisions between meetings, and circulation is faster than convening, but informal sign-off leaves the decision poorly evidenced.",
      "If the constitution's circulation rules or the required assents are not satisfied and recorded, the resolution can be invalid.",
      "A governed circular process records each director's assent with provenance, producing a decision as auditable as any minuted vote."
    ],
    "how": [
      {
        "t": "Confirm the power to circulate",
        "d": "Check the constitution permits circular resolutions and the matter is eligible before circulating."
      },
      {
        "t": "Circulate identical text",
        "d": "Send the same resolution wording to all directors so each assents to the same terms."
      },
      {
        "t": "Record and seal assents",
        "d": "Capture each signature with identity and timestamp, then seal the adopted resolution into the minute book."
      }
    ],
    "faqs": [
      {
        "q": "What is a circular resolution?",
        "a": "A circular resolution is a board decision adopted by circulating the resolution to directors for signature or assent rather than convening a meeting, valid only when permitted and the required directors assent."
      },
      {
        "q": "How does it differ from a written resolution?",
        "a": "The terms overlap and usage varies by jurisdiction; both describe out-of-session decisions in writing. The key is that the relevant rules on eligibility and thresholds are met and evidenced."
      },
      {
        "q": "Do all directors have to sign?",
        "a": "It depends on the constitution. Some require all directors entitled to vote to assent, others a majority. The record should show exactly who assented to prove validity."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "professional-bodies",
      "ngos",
      "development-banks"
    ],
    "relatedProblems": [
      "written-resolution-workflow",
      "directors-written-consent",
      "board-resolution-software",
      "board-minutes-management", "circular-letter"],
    "diagram": "workflow",
    "metaTitle": "Circular Resolution: Board Decisions by Circulation",
    "metaDescription": "A circular resolution lets directors decide without meeting. Learn how to confirm authority, capture assent and seal the record."
  },
  {
    "slug": "company-register-management",
    "term": "Company register",
    "category": "Operations & workflow",
    "kicker": "Corporate records",
    "headline": "Maintain the company's books of record as one trusted source",
    "lead": "The company register is the consolidated set of books a company maintains about its constitution, governance and ownership. Under governance controls, it becomes a single, verifiable source of corporate truth.",
    "definition": "Company register is the collected set of statutory and governance records a company keeps, spanning directors, members, charges and resolutions. It is the consolidated source for the company's legal and ownership state.",
    "why": [
      "Due diligence, financing and litigation all draw on the company register, so fragmentation across systems creates risk and delay at the worst moments.",
      "Inconsistencies between books, such as a directorship recorded in one register but not another, undermine confidence in the whole.",
      "A governed register keeps each book linked to its authorizing acts and to the others, so the company's state can be presented coherently and verifiably."
    ],
    "how": [
      {
        "t": "Consolidate the books",
        "d": "Bring statutory registers and governance records into one governed system rather than disconnected files."
      },
      {
        "t": "Cross-reference entries",
        "d": "Link related entries across registers so a single change is reflected consistently everywhere it matters."
      },
      {
        "t": "Seal and snapshot",
        "d": "Preserve register states with provenance so the company's position at any date can be produced and verified."
      }
    ],
    "faqs": [
      {
        "q": "What is a company register?",
        "a": "A company register is the collected set of statutory and governance records a company keeps, spanning directors, members, charges and resolutions, serving as the consolidated source for its legal and ownership state."
      },
      {
        "q": "How does it relate to a statutory register?",
        "a": "Statutory registers are the legally mandated books, while the company register is the broader consolidated set that holds them alongside resolutions and governance records in one coherent source."
      },
      {
        "q": "Why consolidate the registers?",
        "a": "Consolidation removes inconsistencies between books and lets the company present a single, verifiable picture of its state during due diligence, financing or disputes."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "chambers-of-commerce",
      "central-banks",
      "land-registries"
    ],
    "relatedProblems": [
      "statutory-register-management",
      "minute-book-management",
      "register-of-charges-management",
      "beneficial-ownership-register"
    ],
    "diagram": "ledger",
    "metaTitle": "Company Register: A Single Source of Corporate Truth",
    "metaDescription": "A company register consolidates a company's statutory and governance books. Learn how to keep it coherent, sealed and audit-ready."
  },
  {
    "slug": "register-of-charges-management",
    "term": "Register of charges",
    "category": "Operations & workflow",
    "kicker": "Statutory records",
    "headline": "Track security over company assets, accurately and on time",
    "lead": "The register of charges records security interests granted over a company's assets. Maintained under governance controls, it gives lenders and the company a verifiable picture of encumbrances.",
    "definition": "Register of charges is the record of security interests, such as mortgages and fixed or floating charges, granted over a company's assets. It evidences which assets are encumbered and in whose favor.",
    "why": [
      "Lenders rely on charge records to assess priority and security, so inaccuracy can derail financing and create disputes over ranking.",
      "Failure to record or register a charge on time can affect its validity and the lender's priority, with serious consequences.",
      "A governed register links each charge to its instrument and registration evidence, so encumbrances and their dates can be proven."
    ],
    "how": [
      {
        "t": "Record from the instrument",
        "d": "Enter each charge from its security document, capturing the chargee, asset and date created."
      },
      {
        "t": "Track registration deadlines",
        "d": "Record statutory registration of each charge so validity and priority steps are evidenced and not missed."
      },
      {
        "t": "Maintain satisfaction history",
        "d": "Record releases and satisfactions with provenance so the current and historical encumbrance position is verifiable."
      }
    ],
    "faqs": [
      {
        "q": "What is a register of charges?",
        "a": "A register of charges is the record of security interests, such as mortgages and fixed or floating charges, granted over a company's assets, evidencing which assets are encumbered and in whose favor."
      },
      {
        "q": "Why are registration deadlines important?",
        "a": "In many jurisdictions a charge must be registered with a public registry within a set period, or it may be void against a liquidator or creditors. Tracking deadlines protects validity and priority."
      },
      {
        "q": "How are released charges handled?",
        "a": "Satisfactions and releases should be recorded with provenance so the register accurately reflects current encumbrances and supports a verifiable history of past security."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "development-banks",
      "land-registries",
      "central-banks"
    ],
    "relatedProblems": [
      "statutory-register-management",
      "company-register-management",
      "secretarys-certificate",
      "board-resolution-software"
    ],
    "diagram": "ledger",
    "metaTitle": "Register of Charges: Tracking Security Interests",
    "metaDescription": "A register of charges records security over company assets. Learn how governed entries evidence encumbrances, deadlines and releases."
  },
  {
    "slug": "beneficial-ownership-register",
    "term": "Beneficial ownership register",
    "category": "Operations & workflow",
    "kicker": "Ownership transparency",
    "headline": "Evidence who ultimately owns and controls the company",
    "lead": "The beneficial ownership register records the individuals who ultimately own or control a company. Maintained under governance controls, it supports transparency obligations with a verifiable, current record.",
    "definition": "Beneficial ownership register is the record of the natural persons who ultimately own or control a company, beyond the immediate legal shareholders. It supports anti-money-laundering and transparency obligations by identifying real ownership.",
    "why": [
      "Regulators and counterparties increasingly require disclosure of ultimate ownership, so an inaccurate register can breach law and stall onboarding.",
      "Ownership structures change and can be layered, making it easy for the register to fall out of date without disciplined updating.",
      "A governed register ties each beneficial owner to the evidence of control and the date identified, so disclosures can be substantiated."
    ],
    "how": [
      {
        "t": "Identify ultimate owners",
        "d": "Trace ownership and control through intermediate entities to the natural persons who ultimately benefit or control."
      },
      {
        "t": "Evidence the basis of control",
        "d": "Record the shareholding, voting or control mechanism establishing each person's beneficial interest, with dates."
      },
      {
        "t": "Seal and refresh",
        "d": "Preserve entries with provenance and update on ownership changes so disclosures remain current and verifiable."
      }
    ],
    "faqs": [
      {
        "q": "What is a beneficial ownership register?",
        "a": "A beneficial ownership register is the record of the natural persons who ultimately own or control a company beyond immediate legal shareholders, supporting transparency and anti-money-laundering obligations."
      },
      {
        "q": "How does it differ from the register of members?",
        "a": "The register of members records legal shareholders, while the beneficial ownership register looks through legal owners to the natural persons who ultimately benefit from or control the company."
      },
      {
        "q": "What triggers an update?",
        "a": "Changes in ownership, control or the identity of beneficial owners trigger updates. A governed process records each change with provenance so the register stays current and provable."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "tax-authorities",
      "anti-corruption-agencies",
      "securities-regulators"
    ],
    "relatedProblems": [
      "register-of-members-management",
      "statutory-register-management",
      "company-register-management",
      "secretarys-certificate"
    ],
    "diagram": "ledger",
    "metaTitle": "Beneficial Ownership Register: Who Really Owns It",
    "metaDescription": "A beneficial ownership register records ultimate owners and controllers. Learn how governed entries substantiate transparency disclosures."
  },
  {
    "slug": "directors-written-consent",
    "term": "Directors' written consent",
    "category": "Operations & workflow",
    "kicker": "Resolutions",
    "headline": "Capture director agreement with provable validity",
    "lead": "Directors' written consent records directors agreeing to an action in writing instead of at a meeting. Governed properly, it is a defensible substitute for a minuted decision.",
    "definition": "Directors' written consent is the written agreement of directors to a corporate action taken without a meeting, signed or assented to by the required directors. It evidences board approval where the constitution permits action by consent.",
    "why": [
      "Routine and time-sensitive approvals often proceed by consent, but unrecorded email agreement leaves the approval unproven.",
      "If the required directors or the constitution's consent rules are not satisfied and evidenced, the action may lack valid board authority.",
      "A governed consent process records each director's agreement with identity and timestamp, so the approval is as defensible as a meeting vote."
    ],
    "how": [
      {
        "t": "Confirm consent is permitted",
        "d": "Verify the constitution allows the action by written consent and identify which directors must agree."
      },
      {
        "t": "State the action precisely",
        "d": "Record the exact action consented to so each director agrees to identical terms."
      },
      {
        "t": "Record and seal consents",
        "d": "Capture each director's assent with provenance and file it to the minute book for verification."
      }
    ],
    "faqs": [
      {
        "q": "What is directors' written consent?",
        "a": "Directors' written consent is the written agreement of directors to a corporate action taken without a meeting, signed or assented to by the required directors, evidencing board approval where permitted."
      },
      {
        "q": "How does it differ from a written resolution?",
        "a": "Usage varies by jurisdiction and the terms often overlap; both record out-of-session board agreement in writing. What matters is that the constitution's requirements are met and evidenced."
      },
      {
        "q": "Is unanimity always required?",
        "a": "Not necessarily. Some constitutions require all directors to consent, others a stated number. The record should show which directors agreed so the requirement can be confirmed."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "professional-bodies",
      "ngos",
      "development-banks"
    ],
    "relatedProblems": [
      "written-resolution-workflow",
      "circular-resolution-workflow",
      "board-resolution-software",
      "board-minutes-management"
    ],
    "diagram": "workflow",
    "metaTitle": "Directors' Written Consent: Provable Board Approval",
    "metaDescription": "Directors' written consent records board agreement without a meeting. Learn how to confirm authority, capture assent and seal it."
  },
  {
    "slug": "register-of-secretaries",
    "term": "Register of secretaries",
    "category": "Operations & workflow",
    "kicker": "Statutory records",
    "headline": "Record who holds the company secretary office, verifiably",
    "lead": "The register of secretaries records the people appointed as company secretary. Maintained under governance controls, it is the verifiable statement of who holds this office and over what period.",
    "definition": "Register of secretaries is the statutory record of a company's current and former company secretaries, including appointment and cessation details. It establishes who holds the secretarial office responsible for governance administration.",
    "why": [
      "Many certificates and filings are issued in the secretary's name, so reliance on them depends on confirming who validly held the office.",
      "Unevidenced appointments or delayed removals create gaps that can call into question documents the secretary purported to certify.",
      "A governed register links each entry to the resolution that effected it, so the holder of the secretarial office can be proven at any date."
    ],
    "how": [
      {
        "t": "Record from source decisions",
        "d": "Enter appointments and cessations only against the resolution or notice that authorized them, with effective dates."
      },
      {
        "t": "Maintain office history",
        "d": "Keep former secretaries and their service periods so the office-holder at any past moment can be reconstructed."
      },
      {
        "t": "Seal each change",
        "d": "Preserve entries with provenance so the register can be independently verified against its underlying acts."
      }
    ],
    "faqs": [
      {
        "q": "What is a register of secretaries?",
        "a": "A register of secretaries is the statutory record of a company's current and former company secretaries, including appointment and cessation details, establishing who holds the secretarial office."
      },
      {
        "q": "Why does the secretary's office matter for reliance?",
        "a": "Because certificates and filings are often issued in the secretary's name, parties relying on them benefit from being able to confirm who validly held the office at the relevant time."
      },
      {
        "q": "Must changes be filed externally?",
        "a": "Where a company is required to have a secretary, appointments and cessations are often notified to a public registry. The internal register and external filing should stay consistent."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "central-banks",
      "chambers-of-commerce",
      "professional-bodies"
    ],
    "relatedProblems": [
      "register-of-directors-management",
      "secretarys-certificate",
      "statutory-register-management",
      "certificate-of-incumbency"
    ],
    "diagram": "ledger",
    "metaTitle": "Register of Secretaries: Who Holds the Office",
    "metaDescription": "A register of secretaries records current and former company secretaries. Learn how governed entries prove the office-holder."
  },
  {
    "slug": "compliance-evidence",
    "term": "Compliance evidence",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Make every compliance claim defensible on demand",
    "lead": "When an auditor asks how you know a control held, the answer is the evidence you can produce, not the policy you intended.",
    "definition": "Compliance evidence is the documented proof that an organisation met a specific regulatory or policy obligation, captured in a form that an auditor or regulator can independently verify.",
    "why": [
      "Stated controls carry no weight in an audit unless backed by evidence that the control actually operated as described.",
      "Evidence scattered across inboxes and drives is hard to locate under deadline pressure and easy to dispute later.",
      "Sealed, time-stamped evidence lets reviewers confirm what existed and when, reducing back-and-forth and re-work."
    ],
    "how": [
      {
        "t": "Capture at the source",
        "d": "Record evidence when a control runs, not retroactively, so the artefact reflects the actual event rather than a later reconstruction."
      },
      {
        "t": "Seal and timestamp",
        "d": "Apply a cryptographic seal so the evidence carries a verifiable record of its content and the moment it was fixed."
      },
      {
        "t": "Index for retrieval",
        "d": "Tag each artefact to the obligation it supports so a request maps to a specific, retrievable record."
      }
    ],
    "faqs": [
      {
        "q": "What is compliance evidence?",
        "a": "It is the documented proof that an organisation met a specific regulatory or policy obligation, captured so an auditor or regulator can independently verify it."
      },
      {
        "q": "Does sealing evidence guarantee an audit passes?",
        "a": "No. Sealing establishes that an artefact is authentic and unchanged since capture; whether it satisfies a requirement remains the auditor's judgement."
      },
      {
        "q": "How long should evidence be retained?",
        "a": "Retention follows the applicable regime and your records schedule; the platform preserves artefacts and their seals for the period you define."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "regulators",
      "healthcare",
      "energy-utilities"
    ],
    "relatedProblems": [
      "control-evidence",
      "audit-readiness",
      "evidence-management",
      "compliance-trail"
    ],
    "diagram": "shield",
    "metaTitle": "Compliance Evidence: Proof Auditors Can Verify",
    "metaDescription": "Compliance evidence is verifiable proof a control or obligation was met. Learn how to capture, seal, and index it for audit readiness."
  },
  {
    "slug": "control-evidence",
    "term": "Control evidence",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Prove your controls operated, not just existed",
    "lead": "A control on paper is a design; a control with evidence is something a reviewer can test.",
    "definition": "Control evidence is the artefact set demonstrating that a specific internal control operated effectively over a defined period, supporting an assessment of operating effectiveness rather than design alone.",
    "why": [
      "Auditors distinguish design effectiveness from operating effectiveness, and only evidence can establish the latter.",
      "Gaps in control evidence often surface late, forcing rushed sampling and weakening the assurance conclusion.",
      "A consistent evidence record across periods makes recurring controls cheaper to test each cycle."
    ],
    "how": [
      {
        "t": "Define the evidence per control",
        "d": "For each control, specify the artefact that demonstrates it ran, so capture is deliberate rather than improvised."
      },
      {
        "t": "Bind evidence to the period",
        "d": "Timestamp each artefact so reviewers can confirm the control operated within the assessment window."
      },
      {
        "t": "Preserve the population",
        "d": "Retain the full set of control events, not only sampled items, so testing can be re-performed if challenged."
      }
    ],
    "faqs": [
      {
        "q": "What is control evidence?",
        "a": "It is the artefact set demonstrating that a specific internal control operated effectively over a defined period, supporting an operating-effectiveness assessment rather than design alone."
      },
      {
        "q": "How is it different from compliance evidence?",
        "a": "Control evidence focuses on whether an internal control functioned over time; compliance evidence proves a particular obligation was met. They often overlap."
      },
      {
        "q": "Can it support a SOC or ISO assessment?",
        "a": "It can align your records to those frameworks, but the assessment and any certification rest with the qualified assessor, not the platform."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "insurance",
      "healthcare",
      "pharmaceuticals"
    ],
    "relatedProblems": [
      "compliance-evidence",
      "controls-documentation",
      "internal-audit-evidence",
      "control-attestation"
    ],
    "diagram": "shield",
    "metaTitle": "Control Evidence: Show Controls Operated Effectively",
    "metaDescription": "Control evidence demonstrates an internal control operated over a period. Capture, timestamp, and preserve it for credible assurance."
  },
  {
    "slug": "audit-readiness",
    "term": "Audit readiness",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Be ready before the auditor asks",
    "lead": "Readiness is the difference between answering a request in minutes and scrambling for a week.",
    "definition": "Audit readiness is the ongoing state in which an organisation can produce complete, authentic evidence for its obligations at any time, without a special preparation effort.",
    "why": [
      "Treating audits as one-off projects produces stale, hard-to-find evidence and recurring fire drills.",
      "Continuous readiness shortens audit cycles and lowers the cost of each engagement.",
      "Authentic, sealed records reduce disputes over whether an artefact was altered after the fact."
    ],
    "how": [
      {
        "t": "Maintain a live evidence base",
        "d": "Keep evidence current as controls run, so a request draws on what already exists rather than a scramble."
      },
      {
        "t": "Map evidence to requirements",
        "d": "Link each obligation to its supporting artefacts so coverage gaps are visible before an auditor finds them."
      },
      {
        "t": "Seal for integrity",
        "d": "Fix artefacts with verifiable seals so their authenticity is not in question during review."
      }
    ],
    "faqs": [
      {
        "q": "What is audit readiness?",
        "a": "It is the ongoing state in which an organisation can produce complete, authentic evidence for its obligations at any time, without a special preparation effort."
      },
      {
        "q": "Is readiness a one-time project?",
        "a": "No. It is a continuous state; the value comes from evidence staying current and retrievable between audits, not only just before one."
      },
      {
        "q": "Does it guarantee a clean audit?",
        "a": "No. Readiness ensures evidence is available and authentic; the audit opinion still depends on the auditor's findings."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "regulators",
      "government",
      "energy-utilities"
    ],
    "relatedProblems": [
      "audit-preparation",
      "compliance-evidence",
      "evidence-management",
      "compliance-trail"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Audit Readiness: Always Prepared to Be Audited",
    "metaDescription": "Audit readiness is the state of producing authentic evidence on demand. Learn how to stay continuously ready rather than scrambling."
  },
  {
    "slug": "regulatory-filing",
    "term": "Regulatory filing",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Prove what you filed and exactly when",
    "lead": "Months later, the question is rarely whether you filed, but whether you can show the exact version you submitted.",
    "definition": "A regulatory filing is a document or dataset an organisation submits to a regulator to satisfy a legal reporting obligation, where the submitted version and its timing must remain provable.",
    "why": [
      "Disputes over filings often turn on which version was submitted and at what moment, not whether a submission occurred.",
      "Reconstructing a filing's exact content after the fact is error-prone without a sealed record of the original.",
      "A verifiable filing record protects the organisation if a regulator's copy is questioned or lost."
    ],
    "how": [
      {
        "t": "Seal the submitted version",
        "d": "Fix the exact artefact you file so its content can later be confirmed byte-for-byte."
      },
      {
        "t": "Record the submission moment",
        "d": "Capture a trusted timestamp at filing so timing is independently verifiable."
      },
      {
        "t": "Retain alongside acknowledgements",
        "d": "Store the regulator's receipt with the sealed filing so the round trip is documented as one record."
      }
    ],
    "faqs": [
      {
        "q": "What is a regulatory filing?",
        "a": "It is a document or dataset an organisation submits to a regulator to satisfy a legal reporting obligation, where the submitted version and its timing must remain provable."
      },
      {
        "q": "How do I prove which version I filed?",
        "a": "By sealing the exact submitted artefact at the time of filing, so its content and timestamp can be independently verified later."
      },
      {
        "q": "Does this replace the regulator's own portal?",
        "a": "No. It creates your own authoritative record of what you submitted, complementing whatever channel the regulator requires."
      }
    ],
    "relatedIndustries": [
      "securities-regulators",
      "financial-institutions",
      "central-banks",
      "tax-authorities"
    ],
    "relatedProblems": [
      "regulatory-submission",
      "compliance-reporting",
      "regulatory-recordkeeping",
      "compliance-evidence"
    ],
    "diagram": "seal",
    "metaTitle": "Regulatory Filing: Prove the Version You Submitted",
    "metaDescription": "A regulatory filing must remain provable in content and timing. Seal and timestamp submissions for a defensible filing record."
  },
  {
    "slug": "attestation",
    "term": "Attestation",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Bind a signed statement to its evidence",
    "lead": "An attestation is only as strong as the proof that the right person signed the right statement at the right time.",
    "definition": "Attestation is a formal statement by an authorised individual affirming that something is true or that an obligation was met, recorded so the signer, content, and timing are verifiable.",
    "why": [
      "Unbound attestations can be repudiated if the signed content or signer cannot be established later.",
      "Auditors weight an attestation by the credibility of the person and the evidence behind it.",
      "A sealed attestation links the affirmation to the underlying records it relies on, closing the loop."
    ],
    "how": [
      {
        "t": "Identify the signer",
        "d": "Tie the statement to an authenticated individual so authorship is not in doubt."
      },
      {
        "t": "Seal statement and basis",
        "d": "Bind the affirmation to the evidence it rests on so the two cannot be separated or swapped."
      },
      {
        "t": "Timestamp the affirmation",
        "d": "Record when the attestation was made so its currency can be assessed against the period it covers."
      }
    ],
    "faqs": [
      {
        "q": "What is an attestation?",
        "a": "It is a formal statement by an authorised individual affirming that something is true or that an obligation was met, recorded so the signer, content, and timing are verifiable."
      },
      {
        "q": "How does it differ from a certification?",
        "a": "An attestation is a signer's affirmation; a certification is a determination by an accredited body. The platform supports attestations, not the issuance of certifications."
      },
      {
        "q": "Can an attestation be revoked?",
        "a": "The original sealed record persists, but a superseding statement can be recorded so the current position and its history are both clear."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "professional-bodies",
      "regulators",
      "accounting-standards-boards"
    ],
    "relatedProblems": [
      "control-attestation",
      "compliance-evidence",
      "compliance-certificate",
      "assurance-report"
    ],
    "diagram": "seal",
    "metaTitle": "Attestation: Signed Affirmations Bound to Evidence",
    "metaDescription": "An attestation affirms an obligation was met. Bind signer, content, and timing so the statement stays verifiable and defensible."
  },
  {
    "slug": "conformity-assessment",
    "term": "Conformity assessment",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Document conformity so reviewers can re-check it",
    "lead": "Showing a product or process conforms to a standard depends on the evidence trail a reviewer can follow.",
    "definition": "Conformity assessment is the process of determining whether a product, service, or system meets the requirements of a standard or regulation, supported by documented evidence of the checks performed.",
    "why": [
      "A conformity claim is only credible if the underlying tests and reviews are documented and reproducible.",
      "Lost or unsealed assessment records can invalidate a claim even when the work was done correctly.",
      "Structured evidence lets a surveillance review confirm conformity without repeating every step."
    ],
    "how": [
      {
        "t": "Record each requirement check",
        "d": "Document the result against every applicable requirement so coverage is explicit."
      },
      {
        "t": "Preserve test artefacts",
        "d": "Seal the underlying test data and reports so they cannot be quietly revised after the conclusion."
      },
      {
        "t": "Link conclusion to evidence",
        "d": "Connect the conformity statement to the specific artefacts that support it for traceability."
      }
    ],
    "faqs": [
      {
        "q": "What is conformity assessment?",
        "a": "It is the process of determining whether a product, service, or system meets the requirements of a standard or regulation, supported by documented evidence of the checks performed."
      },
      {
        "q": "Does the platform certify conformity?",
        "a": "No. It helps you document and preserve conformity evidence; a determination of conformity rests with the competent or accredited body."
      },
      {
        "q": "How does evidence support surveillance?",
        "a": "Sealed, indexed assessment records let a reviewer re-examine the basis for a conformity claim without re-running every check."
      }
    ],
    "relatedIndustries": [
      "standards-bodies",
      "manufacturing",
      "pharmaceuticals",
      "food-safety"
    ],
    "relatedProblems": [
      "compliance-evidence",
      "controls-documentation",
      "assurance-report",
      "audit-readiness"
    ],
    "diagram": "shield",
    "metaTitle": "Conformity Assessment: Documented, Reproducible Checks",
    "metaDescription": "Conformity assessment determines if something meets a standard. Document and seal the evidence so reviewers can re-check the claim."
  },
  {
    "slug": "compliance-register",
    "term": "Compliance register",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "One authoritative view of every obligation",
    "lead": "You cannot demonstrate compliance with obligations you have not catalogued in one trustworthy place.",
    "definition": "A compliance register is a maintained record of an organisation's applicable obligations, the owners responsible for them, and their current status, kept as an authoritative reference.",
    "why": [
      "Obligations spread across teams and spreadsheets drift out of date and leave coverage gaps unnoticed.",
      "A single register makes ownership explicit so nothing falls between functions.",
      "A versioned register shows how obligations and their status evolved, which matters when scope is questioned."
    ],
    "how": [
      {
        "t": "Catalogue obligations",
        "d": "List each applicable requirement with its source so the register is grounded in authority, not assumption."
      },
      {
        "t": "Assign accountable owners",
        "d": "Attach a responsible owner to every entry so status has someone behind it."
      },
      {
        "t": "Version the register",
        "d": "Seal each revision so changes to scope and status are traceable over time."
      }
    ],
    "faqs": [
      {
        "q": "What is a compliance register?",
        "a": "It is a maintained record of an organisation's applicable obligations, the owners responsible for them, and their current status, kept as an authoritative reference."
      },
      {
        "q": "How is it different from a risk register?",
        "a": "A compliance register tracks obligations and their status; a risk register tracks risks and treatments. They are related but answer different questions."
      },
      {
        "q": "How often should it be updated?",
        "a": "It should reflect changes as obligations or ownership shift; sealing each revision preserves the history of those updates."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "regulators",
      "energy-utilities",
      "insurance"
    ],
    "relatedProblems": [
      "controls-documentation",
      "compliance-gap",
      "compliance-reporting",
      "regulatory-recordkeeping"
    ],
    "diagram": "ledger",
    "metaTitle": "Compliance Register: One Source for Obligations",
    "metaDescription": "A compliance register catalogues obligations, owners, and status. Version it so coverage and accountability stay traceable."
  },
  {
    "slug": "controls-documentation",
    "term": "Controls documentation",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Describe controls so they can be tested",
    "lead": "If a reviewer cannot tell from your documentation how a control works, they cannot conclude it is effective.",
    "definition": "Controls documentation is the structured description of an organisation's internal controls, covering their objective, design, owner, and operation, maintained as the reference for testing and assurance.",
    "why": [
      "Vague or outdated control descriptions force reviewers to reconstruct intent, slowing and weakening assessment.",
      "Clear documentation aligns the people who run controls with the people who test them.",
      "Versioned documentation shows when a control's design changed, which is essential for period-based testing."
    ],
    "how": [
      {
        "t": "State objective and design",
        "d": "Describe what each control is meant to achieve and how it works so testing has a clear benchmark."
      },
      {
        "t": "Name the owner",
        "d": "Record who operates the control so questions and evidence requests have a destination."
      },
      {
        "t": "Track design changes",
        "d": "Seal each version so a reviewer can align testing to the design in force during the period."
      }
    ],
    "faqs": [
      {
        "q": "What is controls documentation?",
        "a": "It is the structured description of an organisation's internal controls, covering their objective, design, owner, and operation, maintained as the reference for testing and assurance."
      },
      {
        "q": "How is it different from control evidence?",
        "a": "Documentation describes how a control should work; control evidence proves it actually operated. Reviewers use both together."
      },
      {
        "q": "Why version it?",
        "a": "Because control designs change, and testing must align to the version that was in force during the assessment period."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "insurance",
      "healthcare",
      "manufacturing"
    ],
    "relatedProblems": [
      "control-evidence",
      "compliance-register",
      "internal-audit-evidence",
      "control-attestation"
    ],
    "diagram": "shield",
    "metaTitle": "Controls Documentation: Describe Controls for Testing",
    "metaDescription": "Controls documentation describes objective, design, owner, and operation of each control. Version it so testing aligns to the design in force."
  },
  {
    "slug": "evidence-management",
    "term": "Evidence management",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Keep evidence findable, authentic, and intact",
    "lead": "Evidence you cannot locate, or whose integrity you cannot prove, may as well not exist.",
    "definition": "Evidence management is the disciplined capture, organisation, preservation, and retrieval of compliance and control evidence so that it remains authentic and available throughout its required life.",
    "why": [
      "Evidence dispersed across systems is hard to retrieve under deadline and easy to dispute later.",
      "Without integrity controls, evidence can be challenged as altered, undermining otherwise sound work.",
      "Structured management lets the same evidence serve multiple audits and regulators without rework."
    ],
    "how": [
      {
        "t": "Centralise capture",
        "d": "Bring evidence into one governed store so it is not stranded in inboxes and personal drives."
      },
      {
        "t": "Seal on intake",
        "d": "Apply integrity seals as evidence arrives so any later alteration is detectable."
      },
      {
        "t": "Index and govern access",
        "d": "Tag artefacts to obligations and control who can view them so retrieval is fast and access is accountable."
      }
    ],
    "faqs": [
      {
        "q": "What is evidence management?",
        "a": "It is the disciplined capture, organisation, preservation, and retrieval of compliance and control evidence so it remains authentic and available throughout its required life."
      },
      {
        "q": "Why not just use shared drives?",
        "a": "Shared drives rarely prove integrity or control access; evidence management adds sealing, indexing, and governance that audits depend on."
      },
      {
        "q": "Does it prove evidence wasn't altered?",
        "a": "Integrity seals make alteration detectable from capture onward; they cannot vouch for what happened before evidence entered the system."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "healthcare",
      "regulators",
      "pharmaceuticals"
    ],
    "relatedProblems": [
      "compliance-evidence",
      "control-evidence",
      "audit-readiness",
      "compliance-trail"
    ],
    "diagram": "ledger",
    "metaTitle": "Evidence Management: Authentic, Findable Records",
    "metaDescription": "Evidence management captures, seals, and indexes compliance evidence so it stays authentic and retrievable across audits."
  },
  {
    "slug": "audit-preparation",
    "term": "Audit preparation",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Turn an audit from scramble into routine",
    "lead": "Good preparation means the auditor's first request meets evidence that is already assembled.",
    "definition": "Audit preparation is the structured work of assembling, reviewing, and organising evidence and responses ahead of an audit so that requests can be met accurately and on time.",
    "why": [
      "Last-minute preparation produces gaps, inconsistencies, and avoidable findings.",
      "Pre-assembled, mapped evidence shortens fieldwork and reduces auditor follow-ups.",
      "Reviewing evidence before the auditor does lets you address weaknesses on your own terms."
    ],
    "how": [
      {
        "t": "Anticipate requests",
        "d": "Map likely evidence requests to the obligations in scope so artefacts are ready before they are asked for."
      },
      {
        "t": "Pre-review for gaps",
        "d": "Check the assembled evidence for completeness so weaknesses are addressed early, not exposed mid-audit."
      },
      {
        "t": "Package by topic",
        "d": "Organise evidence around the audit's areas so each request maps to a prepared set."
      }
    ],
    "faqs": [
      {
        "q": "What is audit preparation?",
        "a": "It is the structured work of assembling, reviewing, and organising evidence and responses ahead of an audit so requests can be met accurately and on time."
      },
      {
        "q": "How does it relate to audit readiness?",
        "a": "Readiness is the continuous state of having evidence available; preparation is the focused effort for a specific engagement. Strong readiness shrinks preparation."
      },
      {
        "q": "Can preparation guarantee no findings?",
        "a": "No. It reduces avoidable findings and surprises, but the audit conclusion still rests with the auditor."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "government",
      "energy-utilities",
      "universities"
    ],
    "relatedProblems": [
      "audit-readiness",
      "evidence-management",
      "compliance-evidence",
      "internal-audit-evidence"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Audit Preparation: Assemble Evidence in Advance",
    "metaDescription": "Audit preparation assembles and reviews evidence ahead of fieldwork. Map requests and pre-check gaps to avoid surprises."
  },
  {
    "slug": "compliance-reporting",
    "term": "Compliance reporting",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Report compliance you can stand behind",
    "lead": "A compliance report is only as trustworthy as the evidence its figures can be traced back to.",
    "definition": "Compliance reporting is the periodic communication of an organisation's compliance status to internal leadership or external authorities, derived from underlying evidence that supports each statement made.",
    "why": [
      "Reports built on unverifiable inputs expose the organisation if figures are later challenged.",
      "Traceability from report to source evidence lets reviewers confirm conclusions rather than take them on trust.",
      "Sealed report versions show exactly what was communicated at each point in time."
    ],
    "how": [
      {
        "t": "Source from evidence",
        "d": "Derive each reported statement from preserved evidence so the report can be substantiated."
      },
      {
        "t": "Preserve report versions",
        "d": "Seal each issued report so the exact content and timing communicated are provable."
      },
      {
        "t": "Trace figures to records",
        "d": "Link reported metrics to their underlying artefacts so a reviewer can follow the chain back."
      }
    ],
    "faqs": [
      {
        "q": "What is compliance reporting?",
        "a": "It is the periodic communication of an organisation's compliance status to internal leadership or external authorities, derived from underlying evidence that supports each statement made."
      },
      {
        "q": "How do I make a report defensible?",
        "a": "By tracing each statement to preserved evidence and sealing the issued version so its content and timing are provable."
      },
      {
        "q": "Does reporting prove compliance?",
        "a": "A report communicates status; the underlying evidence substantiates it. Reporting without supporting evidence is an assertion, not proof."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "regulators",
      "central-banks",
      "insurance"
    ],
    "relatedProblems": [
      "compliance-evidence",
      "regulatory-submission",
      "assurance-report",
      "compliance-register"
    ],
    "diagram": "workflow",
    "metaTitle": "Compliance Reporting: Status You Can Substantiate",
    "metaDescription": "Compliance reporting communicates status from underlying evidence. Trace figures to records and seal versions for defensible reports."
  },
  {
    "slug": "assurance-report",
    "term": "Assurance report",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Anchor conclusions to verifiable evidence",
    "lead": "The conclusion in an assurance report carries weight only if the evidence behind it can be re-examined.",
    "definition": "An assurance report is a structured conclusion, typically by an independent reviewer, on whether a subject matter meets defined criteria, supported by the evidence the conclusion rests upon.",
    "why": [
      "An assurance conclusion is contestable if the evidence base cannot be located or verified.",
      "Sealed evidence lets a reader confirm the conclusion was grounded in records that have not since changed.",
      "Preserving the basis protects both the reviewer and the subject organisation if findings are later questioned."
    ],
    "how": [
      {
        "t": "Define the criteria",
        "d": "State the criteria the subject matter is assessed against so the conclusion is interpretable."
      },
      {
        "t": "Bind evidence to conclusion",
        "d": "Link the report's conclusion to the specific sealed artefacts that support it."
      },
      {
        "t": "Preserve the basis",
        "d": "Retain the evidence so the conclusion can be re-examined if challenged after issuance."
      }
    ],
    "faqs": [
      {
        "q": "What is an assurance report?",
        "a": "It is a structured conclusion, typically by an independent reviewer, on whether a subject matter meets defined criteria, supported by the evidence the conclusion rests upon."
      },
      {
        "q": "Does the platform issue the report?",
        "a": "No. It preserves and binds the evidence behind an assurance conclusion; the conclusion itself is the reviewer's, not the platform's."
      },
      {
        "q": "Why preserve the evidence base?",
        "a": "So the conclusion can be re-examined against the original, unaltered records if it is questioned after issuance."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "professional-bodies",
      "regulators",
      "accounting-standards-boards"
    ],
    "relatedProblems": [
      "attestation",
      "compliance-evidence",
      "control-evidence",
      "compliance-reporting"
    ],
    "diagram": "seal",
    "metaTitle": "Assurance Report: Conclusions Grounded in Evidence",
    "metaDescription": "An assurance report concludes whether a subject meets criteria. Bind and preserve the evidence so the conclusion can be re-examined."
  },
  {
    "slug": "compliance-trail",
    "term": "Compliance trail",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Follow compliance from decision to proof",
    "lead": "When a reviewer asks how a requirement was met, a clear trail answers in steps, not anecdotes.",
    "definition": "A compliance trail is the connected sequence of records linking an obligation to the actions, decisions, and evidence that demonstrate it was satisfied, traceable end to end.",
    "why": [
      "Disconnected records force reviewers to infer the path between obligation and proof, inviting doubt.",
      "An end-to-end trail lets anyone follow how a requirement was met without privileged knowledge.",
      "Sealed links in the trail show the sequence was not assembled or reordered after the fact."
    ],
    "how": [
      {
        "t": "Link obligation to action",
        "d": "Connect each requirement to the steps taken to meet it so the path is explicit."
      },
      {
        "t": "Attach evidence at each step",
        "d": "Bind the supporting artefact to each action so the trail carries its own proof."
      },
      {
        "t": "Seal the sequence",
        "d": "Fix the links so the order and timing of the trail are verifiable."
      }
    ],
    "faqs": [
      {
        "q": "What is a compliance trail?",
        "a": "It is the connected sequence of records linking an obligation to the actions, decisions, and evidence that demonstrate it was satisfied, traceable end to end."
      },
      {
        "q": "How does it differ from an audit log?",
        "a": "An audit log records system events; a compliance trail connects an obligation to the decisions and evidence proving it was met, which may draw on logs."
      },
      {
        "q": "Why seal the sequence?",
        "a": "So a reviewer can confirm the trail reflects the actual order and timing of events rather than a later reconstruction."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "healthcare",
      "energy-utilities",
      "regulators"
    ],
    "relatedProblems": [
      "compliance-evidence",
      "evidence-management",
      "audit-readiness",
      "regulatory-recordkeeping"
    ],
    "diagram": "chain",
    "metaTitle": "Compliance Trail: Obligation to Proof, Traceable",
    "metaDescription": "A compliance trail links an obligation to the actions and evidence that satisfied it. Seal the sequence for end-to-end traceability."
  },
  {
    "slug": "regulatory-submission",
    "term": "Regulatory submission",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Keep an authoritative record of what you sent",
    "lead": "Your own provable record of a submission protects you when a regulator's copy is contested.",
    "definition": "A regulatory submission is any package of documents or data delivered to an authority to meet a requirement, where the organisation must be able to prove the content, completeness, and timing of what it sent.",
    "why": [
      "Submissions are frequently revised, and only a sealed record shows which package actually went out.",
      "Completeness disputes are hard to resolve without proof of every item included.",
      "An independent submission record reduces reliance on the authority's systems for your own defence."
    ],
    "how": [
      {
        "t": "Seal the full package",
        "d": "Fix every document and dataset in the submission as one record so completeness is provable."
      },
      {
        "t": "Timestamp delivery",
        "d": "Capture a trusted timestamp at submission so timing can be independently confirmed."
      },
      {
        "t": "Retain acknowledgements",
        "d": "Keep the authority's receipt with the sealed package so the exchange is documented together."
      }
    ],
    "faqs": [
      {
        "q": "What is a regulatory submission?",
        "a": "It is any package of documents or data delivered to an authority to meet a requirement, where the organisation must be able to prove the content, completeness, and timing of what it sent."
      },
      {
        "q": "How is it different from a regulatory filing?",
        "a": "The terms overlap; a submission often denotes a broader package of documents and data, while a filing tends to mean a defined statutory form. Both need provable records."
      },
      {
        "q": "Why keep my own record?",
        "a": "So you can independently prove content, completeness, and timing if the authority's copy is lost or disputed."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "financial-institutions",
      "pharmaceuticals",
      "securities-regulators"
    ],
    "relatedProblems": [
      "regulatory-filing",
      "compliance-reporting",
      "regulatory-recordkeeping",
      "compliance-evidence"
    ],
    "diagram": "seal",
    "metaTitle": "Regulatory Submission: Prove What You Delivered",
    "metaDescription": "A regulatory submission must be provable in content, completeness, and timing. Seal the package and retain receipts for a defensible record."
  },
  {
    "slug": "control-attestation",
    "term": "Control attestation",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Sign off on controls with evidence attached",
    "lead": "A control owner's sign-off means more when it is bound to the evidence that the control ran.",
    "definition": "Control attestation is a formal affirmation by a control owner that a specific control operated as intended over a period, recorded with the signer, scope, and supporting evidence.",
    "why": [
      "Sign-offs detached from evidence are weak and can be repudiated when scrutinised.",
      "Binding the affirmation to control evidence lets reviewers verify the basis behind it.",
      "A timestamped attestation establishes who took responsibility for the control and when."
    ],
    "how": [
      {
        "t": "Scope the affirmation",
        "d": "State precisely which control and period the attestation covers so it is not over-read."
      },
      {
        "t": "Attach the evidence",
        "d": "Bind the supporting control evidence to the statement so the basis travels with it."
      },
      {
        "t": "Identify and timestamp",
        "d": "Tie the affirmation to an authenticated owner and a recorded time so accountability is clear."
      }
    ],
    "faqs": [
      {
        "q": "What is control attestation?",
        "a": "It is a formal affirmation by a control owner that a specific control operated as intended over a period, recorded with the signer, scope, and supporting evidence."
      },
      {
        "q": "How is it different from a general attestation?",
        "a": "Control attestation is specifically about a control's operation over a period; a general attestation can affirm any matter. Both bind signer, content, and timing."
      },
      {
        "q": "Does signing off prove the control worked?",
        "a": "The affirmation states the owner's position; the attached evidence substantiates it. Reviewers assess both together."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "insurance",
      "healthcare",
      "manufacturing"
    ],
    "relatedProblems": [
      "control-evidence",
      "attestation",
      "controls-documentation",
      "internal-audit-evidence"
    ],
    "diagram": "seal",
    "metaTitle": "Control Attestation: Sign-Off Bound to Evidence",
    "metaDescription": "Control attestation affirms a control operated over a period, bound to its evidence. Scope, attach, and timestamp for accountable sign-off."
  },
  {
    "slug": "compliance-certificate",
    "term": "Compliance certificate",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Issue certificates anyone can verify",
    "lead": "A certificate is useful only if a recipient can confirm it is genuine and still valid.",
    "definition": "A compliance certificate is a formal document affirming that a party met a defined requirement at a point in time, issued so its authenticity and validity can be independently verified.",
    "why": [
      "Certificates that cannot be verified are easily forged or presented after expiry.",
      "Independent verification lets relying parties trust a certificate without contacting the issuer each time.",
      "Sealing the certificate preserves exactly what was affirmed and when."
    ],
    "how": [
      {
        "t": "State the requirement and scope",
        "d": "Make clear what was met and over what scope so the certificate is not over-interpreted."
      },
      {
        "t": "Seal for authenticity",
        "d": "Apply a verifiable seal so a recipient can confirm the certificate is genuine and unaltered."
      },
      {
        "t": "Record validity terms",
        "d": "Capture the point-in-time basis and any expiry so relying parties can judge current validity."
      }
    ],
    "faqs": [
      {
        "q": "What is a compliance certificate?",
        "a": "It is a formal document affirming that a party met a defined requirement at a point in time, issued so its authenticity and validity can be independently verified."
      },
      {
        "q": "Is this the same as accredited certification?",
        "a": "No. The platform helps issue and verify the document's authenticity; it does not act as an accredited certification body, and the affirmation remains the issuer's."
      },
      {
        "q": "How does a recipient verify it?",
        "a": "By checking the cryptographic seal, which confirms the certificate is genuine and unchanged since issuance, plus any stated validity terms."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "professional-bodies",
      "standards-bodies",
      "chambers-of-commerce"
    ],
    "relatedProblems": [
      "attestation",
      "compliance-evidence",
      "conformity-assessment",
      "control-attestation"
    ],
    "diagram": "seal",
    "metaTitle": "Compliance Certificate: Issue and Verify Authenticity",
    "metaDescription": "A compliance certificate affirms a requirement was met at a point in time. Seal it so recipients can independently verify authenticity."
  },
  {
    "slug": "internal-audit-evidence",
    "term": "Internal audit evidence",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Support internal audit findings that hold up",
    "lead": "An internal audit finding stands or falls on the evidence the team can produce to back it.",
    "definition": "Internal audit evidence is the information gathered by an internal audit function to support its findings and conclusions, preserved so that the basis for each conclusion remains examinable.",
    "why": [
      "Findings challenged by management need preserved, authentic evidence to hold their ground.",
      "Sealed working papers protect the integrity and independence of the audit conclusion.",
      "A reliable evidence base lets external auditors place reliance on internal audit work."
    ],
    "how": [
      {
        "t": "Capture working papers",
        "d": "Preserve the information and analysis behind each finding so conclusions are traceable."
      },
      {
        "t": "Seal for integrity",
        "d": "Fix working papers so they cannot be altered after the conclusion is formed."
      },
      {
        "t": "Link finding to evidence",
        "d": "Connect each finding to its supporting artefacts so the basis is directly examinable."
      }
    ],
    "faqs": [
      {
        "q": "What is internal audit evidence?",
        "a": "It is the information gathered by an internal audit function to support its findings and conclusions, preserved so the basis for each conclusion remains examinable."
      },
      {
        "q": "Why seal working papers?",
        "a": "Sealing preserves their integrity and independence, so findings cannot be quietly revised after the fact and the basis stays trustworthy."
      },
      {
        "q": "Can external auditors rely on it?",
        "a": "They may place reliance where the evidence is authentic and well-organised, but the extent of reliance is their professional judgement."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "government",
      "energy-utilities",
      "universities"
    ],
    "relatedProblems": [
      "control-evidence",
      "evidence-management",
      "audit-preparation",
      "compliance-trail"
    ],
    "diagram": "ledger",
    "metaTitle": "Internal Audit Evidence: Findings That Hold Up",
    "metaDescription": "Internal audit evidence supports findings and conclusions. Capture, seal, and link working papers so the basis stays examinable."
  },
  {
    "slug": "regulatory-recordkeeping",
    "term": "Regulatory recordkeeping",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Retain records the regulator can rely on",
    "lead": "Recordkeeping obligations are met not by storing files, but by being able to produce authentic ones on request.",
    "definition": "Regulatory recordkeeping is the obligation to create, retain, and produce specified records for a defined period in a form authorities can rely on, with integrity preserved throughout.",
    "why": [
      "Many regimes specify not only what to keep but for how long and in what verifiable form.",
      "Records whose integrity cannot be shown may be rejected even when retained correctly.",
      "Disciplined retention avoids both premature destruction and the cost of keeping everything forever."
    ],
    "how": [
      {
        "t": "Apply retention schedules",
        "d": "Hold each record for its required period so obligations are met without indefinite accumulation."
      },
      {
        "t": "Preserve integrity",
        "d": "Seal records so their authenticity is demonstrable across the full retention window."
      },
      {
        "t": "Enable production",
        "d": "Index records so a regulator's request can be met accurately and on time."
      }
    ],
    "faqs": [
      {
        "q": "What is regulatory recordkeeping?",
        "a": "It is the obligation to create, retain, and produce specified records for a defined period in a form authorities can rely on, with integrity preserved throughout."
      },
      {
        "q": "Does keeping a file satisfy the obligation?",
        "a": "Not on its own. Many regimes require records in a verifiable, tamper-evident form and within a defined retention period, both of which must be demonstrable."
      },
      {
        "q": "What about destroying records on time?",
        "a": "Retention schedules govern when records may or must be destroyed; the platform supports holding records for their required period before disposition."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "financial-institutions",
      "tax-authorities",
      "healthcare"
    ],
    "relatedProblems": [
      "regulatory-submission",
      "evidence-management",
      "compliance-trail",
      "compliance-evidence"
    ],
    "diagram": "ledger",
    "metaTitle": "Regulatory Recordkeeping: Retain, Preserve, Produce",
    "metaDescription": "Regulatory recordkeeping requires records authorities can rely on. Apply schedules, preserve integrity, and enable timely production."
  },
  {
    "slug": "compliance-gap",
    "term": "Compliance gap",
    "category": "Governance & compliance",
    "kicker": "Assurance & audit readiness",
    "headline": "Find the gaps before an auditor does",
    "lead": "Every unmet obligation is a gap, and gaps you have not found are the ones that surface during an audit.",
    "definition": "A compliance gap is a difference between an obligation and the organisation's current state of meeting it, identified so it can be tracked, prioritised, and closed.",
    "why": [
      "Undocumented gaps recur and surprise the organisation during external scrutiny.",
      "Recording a gap with its evidence shows reviewers it is known and being managed, not ignored.",
      "Tracking remediation over time demonstrates good-faith progress against obligations."
    ],
    "how": [
      {
        "t": "Compare obligation to state",
        "d": "Assess each obligation against current evidence to surface where coverage falls short."
      },
      {
        "t": "Record and prioritise",
        "d": "Document each gap with its severity and owner so remediation is deliberate, not ad hoc."
      },
      {
        "t": "Track to closure",
        "d": "Seal the remediation record so progress and the eventual close-out are traceable."
      }
    ],
    "faqs": [
      {
        "q": "What is a compliance gap?",
        "a": "It is a difference between an obligation and the organisation's current state of meeting it, identified so it can be tracked, prioritised, and closed."
      },
      {
        "q": "Is recording a gap risky?",
        "a": "A documented, managed gap with a remediation plan generally reflects better than an undocumented one discovered during an audit; consider applicable privilege and disclosure norms."
      },
      {
        "q": "How does a gap analysis relate to the compliance register?",
        "a": "Gap analysis compares register obligations against current evidence; the gaps it surfaces feed remediation tracking and prioritisation."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "regulators",
      "energy-utilities",
      "healthcare"
    ],
    "relatedProblems": [
      "compliance-register",
      "audit-readiness",
      "controls-documentation",
      "compliance-evidence"
    ],
    "diagram": "workflow",
    "metaTitle": "Compliance Gap: Find and Close Them First",
    "metaDescription": "A compliance gap is the distance between an obligation and meeting it. Identify, record, and track gaps to closure before audits."
  },
  {
    "slug": "document-authentication",
    "term": "Document authentication",
    "category": "Verification & authenticity",
    "kicker": "Confirm a document is genuine",
    "headline": "Prove documents are genuine, not forged",
    "lead": "Authentication establishes that a document originates from its claimed issuer and has not been altered since issue.",
    "definition": "Document authentication is the process of confirming that a document was issued by its stated authority and remains unaltered, typically by verifying a cryptographic seal or registry record against the original.",
    "why": [
      "Recipients increasingly demand proof that a document is genuine before relying on it for legal, financial, or administrative decisions.",
      "Forged or altered documents expose institutions to fraud, liability, and reputational damage that authentication helps surface early.",
      "Authentication converts trust in a piece of paper into trust in a verifiable, tamper-evident record."
    ],
    "how": [
      {
        "t": "Seal at source",
        "d": "The issuing authority binds a cryptographic seal to the document content at the moment of publication."
      },
      {
        "t": "Register the record",
        "d": "A verification record is written to a tamper-evident ledger so the authentic version can later be matched."
      },
      {
        "t": "Check on demand",
        "d": "Any recipient recomputes the seal and compares it to the registry to confirm authenticity."
      }
    ],
    "faqs": [
      {
        "q": "What is document authentication?",
        "a": "Document authentication is the process of confirming that a document was issued by its stated authority and remains unaltered, by verifying a cryptographic seal or registry record against the original."
      },
      {
        "q": "Does authentication guarantee a document is legally valid?",
        "a": "No. Authentication confirms origin and integrity; legal validity depends on the document's content and applicable law, which authentication does not assess."
      },
      {
        "q": "Can authentication detect later changes?",
        "a": "Yes. Because the seal is bound to exact content, any alteration makes the recomputed seal diverge, making tampering evident."
      }
    ],
    "relatedIndustries": [
      "government",
      "universities",
      "justice",
      "regulators"
    ],
    "relatedProblems": [
      "document-verification",
      "tamper-proof-publication",
      "document-authenticity",
      "cryptographic-sealing"
    ],
    "diagram": "seal",
    "metaTitle": "Document Authentication: Prove Documents Are Genuine",
    "metaDescription": "Document authentication confirms a document came from its stated issuer and is unaltered, using tamper-evident seals and verification records."
  },
  {
    "slug": "certificate-verification",
    "term": "Certificate verification",
    "category": "Verification & authenticity",
    "kicker": "Confirm a certificate is real",
    "headline": "Let anyone confirm a certificate is real",
    "lead": "Certificate verification lets a recipient confirm that an issued certificate is authentic and currently valid.",
    "definition": "Certificate verification is the act of confirming that a certificate was issued by the named authority, matches the registered record, and has not been revoked or altered.",
    "why": [
      "Certificates carry consequential claims about qualifications, compliance, or status that third parties must be able to trust.",
      "Verifiable certificates reduce reliance on slow, manual confirmation calls between institutions.",
      "Public verification deters forgery by making fraudulent certificates easy to detect."
    ],
    "how": [
      {
        "t": "Issue with record",
        "d": "Each certificate is registered with a tamper-evident verification record at issuance."
      },
      {
        "t": "Expose a lookup",
        "d": "A verification portal or code lets holders and relying parties query the record."
      },
      {
        "t": "Return status",
        "d": "The check returns authenticity, issuer identity, and current validity, including any revocation."
      }
    ],
    "faqs": [
      {
        "q": "What is certificate verification?",
        "a": "Certificate verification is the act of confirming that a certificate was issued by the named authority, matches the registered record, and has not been revoked or altered."
      },
      {
        "q": "How is verification different from issuance?",
        "a": "Issuance creates and registers the certificate; verification later checks an existing certificate against that registered record."
      },
      {
        "q": "Can a verified certificate later become invalid?",
        "a": "Yes. Verification reflects current status, so a certificate may show as revoked or expired even though it was once valid."
      }
    ],
    "relatedIndustries": [
      "universities",
      "professional-bodies",
      "standards-bodies",
      "regulators"
    ],
    "relatedProblems": [
      "document-verification",
      "governance-certificate",
      "document-authenticity",
      "institutional-records"
    ],
    "diagram": "shield",
    "metaTitle": "Certificate Verification: Confirm a Certificate Is Real",
    "metaDescription": "Certificate verification confirms a certificate came from the named issuer, matches its record, and is not revoked or altered."
  },
  {
    "slug": "credential-verification",
    "term": "Credential verification",
    "category": "Verification & authenticity",
    "kicker": "Validate a person's credential",
    "headline": "Validate credentials without chasing issuers",
    "lead": "Credential verification confirms that a claimed qualification or authorization genuinely belongs to its holder.",
    "definition": "Credential verification is the process of confirming that a credential, such as a licence, degree, or accreditation, was genuinely issued to the named holder and remains valid.",
    "why": [
      "Employers, regulators, and partners must confirm credentials before granting trust, access, or responsibility.",
      "Manual credential checks are slow and inconsistent across institutions and borders.",
      "Tamper-evident verification deters credential fraud and protects the value of legitimate qualifications."
    ],
    "how": [
      {
        "t": "Bind to holder",
        "d": "The credential record links the qualification to a named holder and issuing authority."
      },
      {
        "t": "Provide verification",
        "d": "A portal or API lets relying parties confirm the credential against the issuer's record."
      },
      {
        "t": "Reflect status",
        "d": "Verification surfaces validity, expiry, or revocation so decisions rely on current data."
      }
    ],
    "faqs": [
      {
        "q": "What is credential verification?",
        "a": "Credential verification is the process of confirming that a credential, such as a licence, degree, or accreditation, was genuinely issued to the named holder and remains valid."
      },
      {
        "q": "Does it expose private data?",
        "a": "No. Well-designed verification confirms validity and issuer without disclosing more personal data than the relying party needs."
      },
      {
        "q": "Who can verify a credential?",
        "a": "Any party the holder shares the credential or code with can run a verification against the issuer's authoritative record."
      }
    ],
    "relatedIndustries": [
      "professional-bodies",
      "universities",
      "healthcare",
      "labor-authorities"
    ],
    "relatedProblems": [
      "document-verification",
      "document-authenticity",
      "governance-certificate",
      "institutional-records", "document-authentication", "qr-code-verification"],
    "diagram": "shield",
    "metaTitle": "Credential Verification: Validate a Holder's Credential",
    "metaDescription": "Credential verification confirms a licence, degree, or accreditation was genuinely issued to the named holder and remains valid."
  },
  {
    "slug": "qr-code-verification",
    "term": "QR-code verification",
    "category": "Verification & authenticity",
    "kicker": "Scan to confirm authenticity",
    "headline": "Turn a scan into instant proof",
    "lead": "QR-code verification lets anyone scan a printed or on-screen code to confirm a document's authenticity.",
    "definition": "QR-code verification is a method of authenticating a document by scanning an embedded code that resolves to the issuer's verification record for that document.",
    "why": [
      "A scannable code makes verification accessible to recipients without specialist tools or accounts.",
      "Linking each document to its own record reduces the chance of accepting a forged or substituted copy.",
      "On-the-spot verification supports field use, counters, and cross-border presentation of documents."
    ],
    "how": [
      {
        "t": "Embed the code",
        "d": "A unique QR code pointing to the document's verification record is printed on or attached to issuance."
      },
      {
        "t": "Resolve to record",
        "d": "Scanning opens the issuer's verification page for that specific document."
      },
      {
        "t": "Compare on screen",
        "d": "The viewer compares displayed details and seal status to the document in hand."
      }
    ],
    "faqs": [
      {
        "q": "What is QR-code verification?",
        "a": "QR-code verification is a method of authenticating a document by scanning an embedded code that resolves to the issuer's verification record for that document."
      },
      {
        "q": "Can a QR code itself be forged?",
        "a": "A code can be copied, but it resolves to the issuer's authoritative record, so a forged document's details will not match the genuine record."
      },
      {
        "q": "Do recipients need an app?",
        "a": "Usually not. Most QR codes open in a standard camera or browser and resolve to the issuer's verification page directly."
      }
    ],
    "relatedIndustries": [
      "government",
      "municipalities",
      "universities",
      "customs-border"
    ],
    "relatedProblems": [
      "document-verification",
      "document-authenticity",
      "tamper-proof-publication",
      "official-publication"
    ],
    "diagram": "shield",
    "metaTitle": "QR-Code Verification: Scan to Confirm Authenticity",
    "metaDescription": "QR-code verification authenticates a document by scanning an embedded code that resolves to the issuer's verification record."
  },
  {
    "slug": "verification-portal",
    "term": "Verification portal",
    "category": "Verification & authenticity",
    "kicker": "A public place to verify",
    "headline": "Give the public one place to verify",
    "lead": "A verification portal is a public-facing service where anyone can confirm whether a document is authentic.",
    "definition": "A verification portal is an issuer-hosted online service where recipients can confirm that a document or credential is genuine by matching it against the authoritative record.",
    "why": [
      "A single, trusted destination reduces confusion about where and how to verify an institution's documents.",
      "A public portal lets relying parties confirm authenticity without contacting the issuer directly.",
      "Centralizing verification makes fraudulent documents easier to expose and report."
    ],
    "how": [
      {
        "t": "Host at the issuer",
        "d": "The portal runs under the issuer's verified domain so users trust the source."
      },
      {
        "t": "Accept identifiers",
        "d": "Users enter a code, scan a QR, or upload a document to locate its record."
      },
      {
        "t": "Display the result",
        "d": "The portal returns issuer identity, seal status, and validity for the queried document."
      }
    ],
    "faqs": [
      {
        "q": "What is a verification portal?",
        "a": "A verification portal is an issuer-hosted online service where recipients can confirm that a document or credential is genuine by matching it against the authoritative record."
      },
      {
        "q": "Why host it at the issuer's domain?",
        "a": "Because relying on the issuer's verified domain helps users trust the verification source rather than a third party that could be spoofed."
      },
      {
        "q": "Does a portal store the documents?",
        "a": "It stores tamper-evident verification records rather than full documents, allowing matching without holding sensitive content unnecessarily."
      }
    ],
    "relatedIndustries": [
      "government",
      "universities",
      "regulators",
      "professional-bodies"
    ],
    "relatedProblems": [
      "document-verification",
      "official-publication",
      "document-authenticity",
      "publication-audit"
    ],
    "diagram": "shield",
    "metaTitle": "Verification Portal: One Public Place to Verify",
    "metaDescription": "A verification portal is an issuer-hosted service where anyone can confirm a document is genuine against the authoritative record."
  },
  {
    "slug": "anti-forgery-controls",
    "term": "Anti-forgery controls",
    "category": "Verification & authenticity",
    "kicker": "Make forgery detectable",
    "headline": "Make forged documents easy to expose",
    "lead": "Anti-forgery controls are measures that make counterfeit documents detectable and hard to pass off as genuine.",
    "definition": "Anti-forgery controls are the cryptographic, registry, and verification measures that make it possible to detect when a document has been counterfeited or substituted.",
    "why": [
      "Forgery undermines the authority of official documents and the institutions that issue them.",
      "Detectable forgery deters attempts and reduces downstream fraud losses.",
      "Tamper-evident controls give recipients a reliable basis to reject counterfeit documents."
    ],
    "how": [
      {
        "t": "Seal each document",
        "d": "A cryptographic seal binds content to issuer, so altered or fabricated copies fail verification."
      },
      {
        "t": "Register authentic records",
        "d": "Genuine documents are recorded so any document without a matching record is suspect."
      },
      {
        "t": "Enable easy checking",
        "d": "Public verification lets recipients spot forgeries without specialist forensic tools."
      }
    ],
    "faqs": [
      {
        "q": "What are anti-forgery controls?",
        "a": "Anti-forgery controls are the cryptographic, registry, and verification measures that make it possible to detect when a document has been counterfeited or substituted."
      },
      {
        "q": "Do they prevent forgery entirely?",
        "a": "No control prevents all attempts, but tamper-evident controls make forgeries detectable so they fail when verified against the authoritative record."
      },
      {
        "q": "How do controls help recipients?",
        "a": "They let recipients confirm a document against the issuer's record, so counterfeits that lack a matching record are exposed."
      }
    ],
    "relatedIndustries": [
      "government",
      "customs-border",
      "financial-institutions",
      "law-enforcement"
    ],
    "relatedProblems": [
      "document-verification",
      "tamper-proof-publication",
      "document-authenticity",
      "cryptographic-sealing"
    ],
    "diagram": "shield",
    "metaTitle": "Anti-Forgery Controls: Make Forgery Detectable",
    "metaDescription": "Anti-forgery controls are cryptographic and registry measures that make counterfeit or substituted documents detectable when verified."
  },
  {
    "slug": "document-fraud-prevention",
    "term": "Document fraud prevention",
    "category": "Verification & authenticity",
    "kicker": "Reduce document fraud exposure",
    "headline": "Cut document fraud before it spreads",
    "lead": "Document fraud prevention reduces the risk that fake or altered documents are accepted as genuine.",
    "definition": "Document fraud prevention is the combined use of tamper-evident sealing, registry records, and verification to reduce the likelihood that fraudulent documents are relied upon.",
    "why": [
      "Document fraud causes financial loss, regulatory breaches, and erosion of institutional trust.",
      "Early detection at the point of reliance limits the damage fraud can cause.",
      "Verifiable documents shift the burden of proof toward fraudsters and away from honest recipients."
    ],
    "how": [
      {
        "t": "Authenticate at use",
        "d": "Recipients verify each document against the issuer's record before acting on it."
      },
      {
        "t": "Detect tampering",
        "d": "Cryptographic seals reveal alterations so modified documents are rejected."
      },
      {
        "t": "Trace and report",
        "d": "Verification records support investigation and reporting of suspected fraud."
      }
    ],
    "faqs": [
      {
        "q": "What is document fraud prevention?",
        "a": "Document fraud prevention is the combined use of tamper-evident sealing, registry records, and verification to reduce the likelihood that fraudulent documents are relied upon."
      },
      {
        "q": "Can it stop all fraud?",
        "a": "No approach eliminates fraud entirely, but verification makes fraudulent documents far more likely to be detected before they are accepted."
      },
      {
        "q": "Where does prevention happen?",
        "a": "Prevention works at issuance, through sealing and registration, and at reliance, through verification against the authoritative record."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "insurance",
      "government",
      "law-enforcement"
    ],
    "relatedProblems": [
      "document-verification",
      "tamper-proof-publication",
      "document-authenticity",
      "evidence-chain"
    ],
    "diagram": "shield",
    "metaTitle": "Document Fraud Prevention: Cut Fraud at the Source",
    "metaDescription": "Document fraud prevention uses tamper-evident sealing, records, and verification to reduce the chance fraudulent documents are relied upon."
  },
  {
    "slug": "verification-api",
    "term": "Verification API",
    "category": "Verification & authenticity",
    "kicker": "Verify inside your systems",
    "headline": "Embed verification into any system",
    "lead": "A verification API lets software confirm document authenticity automatically within existing workflows.",
    "definition": "A verification API is a programmatic interface that lets external systems confirm a document's authenticity and status against the issuer's authoritative record.",
    "why": [
      "Many verifications happen inside automated processes that cannot rely on manual portal checks.",
      "An API embeds authenticity checks directly into onboarding, claims, and compliance flows.",
      "Programmatic verification scales to high volumes while keeping checks consistent."
    ],
    "how": [
      {
        "t": "Authenticate callers",
        "d": "Relying systems authenticate to the API to request verification securely."
      },
      {
        "t": "Submit an identifier",
        "d": "The caller sends a document identifier or seal for matching against the record."
      },
      {
        "t": "Return structured status",
        "d": "The API responds with issuer identity, integrity, and validity in machine-readable form."
      }
    ],
    "faqs": [
      {
        "q": "What is a verification API?",
        "a": "A verification API is a programmatic interface that lets external systems confirm a document's authenticity and status against the issuer's authoritative record."
      },
      {
        "q": "How does it differ from a portal?",
        "a": "A portal serves people through a web page, while an API serves software, returning machine-readable results for automated workflows."
      },
      {
        "q": "Does the API expose document contents?",
        "a": "It is designed to return authenticity and status data, disclosing only what the relying system needs rather than full content."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "insurance",
      "regulators",
      "tax-authorities"
    ],
    "relatedProblems": [
      "document-verification",
      "document-authenticity",
      "institutional-records",
      "publication-audit"
    ],
    "diagram": "workflow",
    "metaTitle": "Verification API: Embed Verification in Any System",
    "metaDescription": "A verification API lets software confirm a document's authenticity and status against the issuer's authoritative record automatically."
  },
  {
    "slug": "online-document-verification",
    "term": "Online document verification",
    "category": "Verification & authenticity",
    "kicker": "Verify over the web",
    "headline": "Verify documents from anywhere online",
    "lead": "Online document verification lets recipients confirm authenticity over the web without contacting the issuer.",
    "definition": "Online document verification is the confirmation of a document's authenticity through a web-based service that matches it against the issuer's authoritative record.",
    "why": [
      "Documents now circulate digitally and across borders, where in-person checks are impractical.",
      "Web-based verification gives remote recipients immediate access to authoritative confirmation.",
      "Self-service online checks reduce the burden on issuer support teams."
    ],
    "how": [
      {
        "t": "Reach the service",
        "d": "The recipient opens the issuer's verification service from any connected device."
      },
      {
        "t": "Provide the document",
        "d": "They enter a code, scan a QR, or upload the file to locate its record."
      },
      {
        "t": "Receive confirmation",
        "d": "The service returns authenticity, issuer, and validity for the document."
      }
    ],
    "faqs": [
      {
        "q": "What is online document verification?",
        "a": "Online document verification is the confirmation of a document's authenticity through a web-based service that matches it against the issuer's authoritative record."
      },
      {
        "q": "Is online verification as reliable as in person?",
        "a": "It can be more reliable, because it checks against the issuer's authoritative record rather than relying on visual inspection alone."
      },
      {
        "q": "What if there is no internet access?",
        "a": "Online verification needs connectivity; offline scenarios require alternative checks such as cached records or printed verification details."
      }
    ],
    "relatedIndustries": [
      "government",
      "universities",
      "financial-institutions",
      "foreign-affairs"
    ],
    "relatedProblems": [
      "document-verification",
      "official-publication",
      "document-authenticity",
      "institutional-records"
    ],
    "diagram": "shield",
    "metaTitle": "Online Document Verification: Verify From Anywhere",
    "metaDescription": "Online document verification confirms a document's authenticity over the web by matching it against the issuer's authoritative record."
  },
  {
    "slug": "document-validation",
    "term": "Document validation",
    "category": "Verification & authenticity",
    "kicker": "Confirm a document is in order",
    "headline": "Confirm a document is valid and current",
    "lead": "Document validation confirms that a document is authentic, complete, and currently in force.",
    "definition": "Document validation is the process of confirming that a document is genuine, structurally complete, and currently valid, distinguishing it from documents that are forged, incomplete, or expired.",
    "why": [
      "Relying on an authentic but expired or superseded document can be as harmful as accepting a forgery.",
      "Validation combines authenticity with status to support sound decisions.",
      "Consistent validation reduces disputes over whether a document could be relied upon."
    ],
    "how": [
      {
        "t": "Verify authenticity",
        "d": "The document is matched against the issuer's record to confirm it is genuine."
      },
      {
        "t": "Check completeness",
        "d": "Validation confirms required elements and seals are present and intact."
      },
      {
        "t": "Confirm current status",
        "d": "The check surfaces expiry, revocation, or supersession affecting validity."
      }
    ],
    "faqs": [
      {
        "q": "What is document validation?",
        "a": "Document validation is the process of confirming that a document is genuine, structurally complete, and currently valid, distinguishing it from forged, incomplete, or expired documents."
      },
      {
        "q": "How does validation differ from verification?",
        "a": "Verification focuses on authenticity and integrity, while validation also confirms completeness and current status such as expiry or revocation."
      },
      {
        "q": "Can a genuine document fail validation?",
        "a": "Yes. An authentic document can still fail validation if it has expired, been revoked, or been superseded by a newer version."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "financial-institutions",
      "customs-border",
      "immigration-authorities"
    ],
    "relatedProblems": [
      "document-verification",
      "document-authenticity",
      "institutional-records",
      "regulatory-publication"
    ],
    "diagram": "workflow",
    "metaTitle": "Document Validation: Confirm Valid and Current",
    "metaDescription": "Document validation confirms a document is genuine, complete, and currently in force, distinguishing it from forged or expired copies."
  },
  {
    "slug": "authenticity-check",
    "term": "Authenticity check",
    "category": "Verification & authenticity",
    "kicker": "A quick genuineness test",
    "headline": "Run a fast check for genuineness",
    "lead": "An authenticity check is a quick test that confirms whether a document is genuine.",
    "definition": "An authenticity check is a discrete test that confirms whether a document originates from its claimed issuer and remains unaltered, returning a clear genuine-or-not result.",
    "why": [
      "Recipients often need a fast, unambiguous answer about whether a document can be trusted.",
      "A simple check lowers the barrier to verifying documents at the point of use.",
      "Clear results reduce hesitation and disputes when accepting or rejecting documents."
    ],
    "how": [
      {
        "t": "Locate the record",
        "d": "The check finds the document's authoritative verification record."
      },
      {
        "t": "Compare the seal",
        "d": "It compares the document's seal and details against that record."
      },
      {
        "t": "Return a verdict",
        "d": "The check reports a clear genuine, altered, or not-found outcome."
      }
    ],
    "faqs": [
      {
        "q": "What is an authenticity check?",
        "a": "An authenticity check is a discrete test that confirms whether a document originates from its claimed issuer and remains unaltered, returning a clear genuine-or-not result."
      },
      {
        "q": "What does a not-found result mean?",
        "a": "A not-found result means no matching authoritative record exists, which should prompt caution as the document may be fabricated or mistyped."
      },
      {
        "q": "Is a single check enough?",
        "a": "A check confirms authenticity at that moment; high-stakes decisions may also consider status, completeness, and the document's content."
      }
    ],
    "relatedIndustries": [
      "government",
      "financial-institutions",
      "insurance",
      "universities"
    ],
    "relatedProblems": [
      "document-verification",
      "document-authenticity",
      "tamper-proof-publication",
      "institutional-records"
    ],
    "diagram": "shield",
    "metaTitle": "Authenticity Check: A Fast Test for Genuineness",
    "metaDescription": "An authenticity check is a quick test confirming a document came from its claimed issuer and is unaltered, with a clear result."
  },
  {
    "slug": "verification-record",
    "term": "Verification record",
    "category": "Verification & authenticity",
    "kicker": "The proof behind a check",
    "headline": "Keep durable proof behind every check",
    "lead": "A verification record is the authoritative entry that a check relies on to confirm authenticity.",
    "definition": "A verification record is the tamper-evident registry entry that captures a document's seal, issuer, and status, against which later authenticity checks are matched.",
    "why": [
      "Verification is only as trustworthy as the record it consults.",
      "A durable record lets authenticity be confirmed long after issuance.",
      "Recording status changes keeps verification results accurate over time."
    ],
    "how": [
      {
        "t": "Create at issuance",
        "d": "A record is written when the document is sealed and published."
      },
      {
        "t": "Protect integrity",
        "d": "The record is held in a tamper-evident ledger so it cannot be silently altered."
      },
      {
        "t": "Update status",
        "d": "Revocation or supersession is recorded so checks reflect current reality."
      }
    ],
    "faqs": [
      {
        "q": "What is a verification record?",
        "a": "A verification record is the tamper-evident registry entry that captures a document's seal, issuer, and status, against which later authenticity checks are matched."
      },
      {
        "q": "Does the record contain the full document?",
        "a": "Typically not. It holds a seal and metadata sufficient to confirm authenticity without necessarily storing the complete document."
      },
      {
        "q": "What keeps the record trustworthy?",
        "a": "Holding it in a tamper-evident ledger makes any change to the record detectable, preserving confidence in verification results."
      }
    ],
    "relatedIndustries": [
      "archives",
      "regulators",
      "government",
      "justice"
    ],
    "relatedProblems": [
      "document-authenticity",
      "evidence-chain",
      "institutional-records",
      "publication-audit"
    ],
    "diagram": "ledger",
    "metaTitle": "Verification Record: The Proof Behind Each Check",
    "metaDescription": "A verification record is the tamper-evident registry entry capturing a document's seal, issuer, and status for authenticity checks."
  },
  {
    "slug": "proof-of-authenticity",
    "term": "Proof of authenticity",
    "category": "Verification & authenticity",
    "kicker": "Evidence a document is real",
    "headline": "Carry portable proof a document is real",
    "lead": "Proof of authenticity is the verifiable evidence that a document is genuine and unaltered.",
    "definition": "Proof of authenticity is the cryptographic and registry evidence that demonstrates a document was issued by its stated authority and has not been altered since.",
    "why": [
      "Asserting that a document is genuine carries little weight without evidence anyone can check.",
      "Portable proof lets a document defend its own authenticity wherever it travels.",
      "Verifiable evidence supports reliance in legal, regulatory, and commercial settings."
    ],
    "how": [
      {
        "t": "Generate the evidence",
        "d": "A cryptographic seal and registry record are created at issuance."
      },
      {
        "t": "Travel with the document",
        "d": "Identifiers and codes let the proof accompany the document to recipients."
      },
      {
        "t": "Verify independently",
        "d": "Any party recomputes and matches the proof against the issuer's record."
      }
    ],
    "faqs": [
      {
        "q": "What is proof of authenticity?",
        "a": "Proof of authenticity is the cryptographic and registry evidence that demonstrates a document was issued by its stated authority and has not been altered since."
      },
      {
        "q": "Is a signature alone proof of authenticity?",
        "a": "A handwritten signature can be forged; cryptographic proof tied to an authoritative record provides stronger, checkable evidence of authenticity."
      },
      {
        "q": "Can proof be checked without the issuer present?",
        "a": "Yes. Proof is designed so any recipient can verify it independently against the issuer's published record."
      }
    ],
    "relatedIndustries": [
      "justice",
      "notarial-authorities",
      "government",
      "intellectual-property"
    ],
    "relatedProblems": [
      "document-authenticity",
      "evidence-chain",
      "cryptographic-sealing",
      "tamper-proof-publication"
    ],
    "diagram": "seal",
    "metaTitle": "Proof of Authenticity: Evidence a Document Is Real",
    "metaDescription": "Proof of authenticity is cryptographic and registry evidence showing a document was issued by its stated authority and is unaltered."
  },
  {
    "slug": "certificate-validation",
    "term": "Certificate validation",
    "category": "Verification & authenticity",
    "kicker": "Confirm a certificate still holds",
    "headline": "Confirm a certificate still holds today",
    "lead": "Certificate validation confirms that a certificate is authentic and remains valid for reliance.",
    "definition": "Certificate validation is the process of confirming that a certificate is genuine and currently in force, accounting for expiry, revocation, and any conditions on its validity.",
    "why": [
      "A certificate may be authentic yet no longer valid due to expiry or revocation.",
      "Validation prevents reliance on certificates that have lapsed or been withdrawn.",
      "Confirming current validity protects decisions that depend on the certificate's claims."
    ],
    "how": [
      {
        "t": "Authenticate first",
        "d": "The certificate is matched to its record to confirm it is genuine."
      },
      {
        "t": "Evaluate status",
        "d": "Validation checks expiry, revocation, and any stated conditions."
      },
      {
        "t": "Return validity",
        "d": "The result states whether the certificate may currently be relied upon."
      }
    ],
    "faqs": [
      {
        "q": "What is certificate validation?",
        "a": "Certificate validation is the process of confirming that a certificate is genuine and currently in force, accounting for expiry, revocation, and conditions on its validity."
      },
      {
        "q": "How is it different from verification?",
        "a": "Verification confirms a certificate is authentic; validation additionally confirms it remains valid for reliance right now."
      },
      {
        "q": "Why can a real certificate be invalid?",
        "a": "A genuine certificate can expire, be revoked, or fall outside its stated conditions, all of which validation is designed to surface."
      }
    ],
    "relatedIndustries": [
      "standards-bodies",
      "regulators",
      "professional-bodies",
      "financial-institutions"
    ],
    "relatedProblems": [
      "document-verification",
      "governance-certificate",
      "document-authenticity",
      "regulatory-publication"
    ],
    "diagram": "workflow",
    "metaTitle": "Certificate Validation: Confirm It Still Holds",
    "metaDescription": "Certificate validation confirms a certificate is genuine and currently in force, accounting for expiry, revocation, and conditions."
  },
  {
    "slug": "issuer-identity-verification",
    "term": "Issuer identity verification",
    "category": "Verification & authenticity",
    "kicker": "Confirm who issued it",
    "headline": "Confirm exactly who issued a document",
    "lead": "Issuer identity verification confirms which authority actually issued a document.",
    "definition": "Issuer identity verification is the confirmation that a document was issued by the specific, named authority it claims, rather than an impostor or spoofed source.",
    "why": [
      "Knowing a document is sealed matters little if the sealing party cannot be trusted.",
      "Confirming issuer identity defends against impersonation of legitimate authorities.",
      "Reliable issuer identity anchors the whole chain of trust in a document."
    ],
    "how": [
      {
        "t": "Tie to an identity",
        "d": "Each seal is bound to a verified issuer identity at publication."
      },
      {
        "t": "Anchor the identity",
        "d": "The issuer's identity is anchored to a trusted, verifiable source such as a known domain or registry."
      },
      {
        "t": "Surface on check",
        "d": "Verification reveals the confirmed issuer so recipients can judge trust."
      }
    ],
    "faqs": [
      {
        "q": "What is issuer identity verification?",
        "a": "Issuer identity verification is the confirmation that a document was issued by the specific, named authority it claims, rather than an impostor or spoofed source."
      },
      {
        "q": "Why verify the issuer, not just the seal?",
        "a": "A seal only matters if the party that applied it is genuinely the claimed authority, so confirming issuer identity prevents trusting impersonators."
      },
      {
        "q": "How is issuer identity anchored?",
        "a": "Identity is tied to a trusted, verifiable source such as a recognized domain or registry, so recipients can confirm the issuer independently."
      }
    ],
    "relatedIndustries": [
      "government",
      "central-banks",
      "regulators",
      "foreign-affairs"
    ],
    "relatedProblems": [
      "document-authenticity",
      "official-publication",
      "document-verification",
      "cryptographic-sealing"
    ],
    "diagram": "shield",
    "metaTitle": "Issuer Identity Verification: Confirm Who Issued It",
    "metaDescription": "Issuer identity verification confirms a document came from the specific named authority it claims, not an impostor or spoofed source."
  },
  {
    "slug": "source-verification",
    "term": "Source verification",
    "category": "Verification & authenticity",
    "kicker": "Trace a document to its origin",
    "headline": "Trace any document back to its source",
    "lead": "Source verification confirms that a document genuinely originates from its authoritative source.",
    "definition": "Source verification is the confirmation that a document traces back to the authoritative source it claims, establishing provenance rather than relying on the copy in hand.",
    "why": [
      "Copies circulate widely, and only the authoritative source can settle authenticity disputes.",
      "Establishing provenance prevents reliance on doctored or out-of-context copies.",
      "Source-anchored trust supports citation, evidence, and regulatory reliance."
    ],
    "how": [
      {
        "t": "Identify the source",
        "d": "The document points to the authoritative source that published it."
      },
      {
        "t": "Match against origin",
        "d": "Verification compares the copy to the source's authoritative record."
      },
      {
        "t": "Confirm provenance",
        "d": "A match confirms the copy faithfully represents the source document."
      }
    ],
    "faqs": [
      {
        "q": "What is source verification?",
        "a": "Source verification is the confirmation that a document traces back to the authoritative source it claims, establishing provenance rather than relying on the copy in hand."
      },
      {
        "q": "Why is provenance important?",
        "a": "Provenance ensures a copy faithfully represents an authoritative original, preventing reliance on doctored or out-of-context versions."
      },
      {
        "q": "Does it work for shared copies?",
        "a": "Yes. Any copy can be matched back to the authoritative source record, so even widely shared documents can be traced to origin."
      }
    ],
    "relatedIndustries": [
      "national-libraries",
      "archives",
      "national-statistics",
      "research-institutes"
    ],
    "relatedProblems": [
      "document-authenticity",
      "official-publication",
      "evidence-chain",
      "institutional-records"
    ],
    "diagram": "chain",
    "metaTitle": "Source Verification: Trace a Document to Origin",
    "metaDescription": "Source verification confirms a document traces back to the authoritative source it claims, establishing provenance over the copy in hand."
  },
  {
    "slug": "instant-verification",
    "term": "Instant verification",
    "category": "Verification & authenticity",
    "kicker": "Confirm in seconds",
    "headline": "Confirm authenticity in seconds, not days",
    "lead": "Instant verification returns an authenticity result immediately at the point of need.",
    "definition": "Instant verification is the immediate confirmation of a document's authenticity at the point of use, replacing delayed manual checks with a real-time result.",
    "why": [
      "Manual confirmation between institutions can take days, stalling decisions.",
      "Immediate results let recipients act on trusted documents without delay.",
      "Real-time checking improves experience while preserving rigorous authenticity."
    ],
    "how": [
      {
        "t": "Query the record",
        "d": "A code or scan instantly locates the document's verification record."
      },
      {
        "t": "Match in real time",
        "d": "The system compares the document to the record without manual steps."
      },
      {
        "t": "Return immediately",
        "d": "An authenticity and status result is shown within seconds."
      }
    ],
    "faqs": [
      {
        "q": "What is instant verification?",
        "a": "Instant verification is the immediate confirmation of a document's authenticity at the point of use, replacing delayed manual checks with a real-time result."
      },
      {
        "q": "Does speed reduce rigor?",
        "a": "No. Instant verification still matches against the authoritative record; it removes manual delay rather than weakening the underlying check."
      },
      {
        "q": "What does an instant result include?",
        "a": "It typically returns authenticity, issuer identity, and current validity so recipients can act immediately and confidently."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "customs-border",
      "municipalities",
      "social-security"
    ],
    "relatedProblems": [
      "document-verification",
      "document-authenticity",
      "institutional-records",
      "official-publication"
    ],
    "diagram": "shield",
    "metaTitle": "Instant Verification: Confirm Authenticity in Seconds",
    "metaDescription": "Instant verification returns a document's authenticity result immediately at the point of use, replacing slow manual confirmation."
  },
  {
    "slug": "public-verification",
    "term": "Public verification",
    "category": "Verification & authenticity",
    "kicker": "Anyone can confirm it",
    "headline": "Let anyone confirm a document openly",
    "lead": "Public verification lets any member of the public confirm a document's authenticity.",
    "definition": "Public verification is the capability for any third party, without special access, to confirm that a document is authentic against the issuer's authoritative record.",
    "why": [
      "Trust in official documents grows when anyone can independently confirm them.",
      "Open verification reduces dependence on the issuer answering individual queries.",
      "Broad checkability makes forgeries easier to expose across society."
    ],
    "how": [
      {
        "t": "Publish a check route",
        "d": "The issuer offers a public portal, code, or scan for verification."
      },
      {
        "t": "Require no account",
        "d": "Anyone can verify without credentials or special access."
      },
      {
        "t": "Return clear status",
        "d": "The result confirms authenticity, issuer, and validity to the public."
      }
    ],
    "faqs": [
      {
        "q": "What is public verification?",
        "a": "Public verification is the capability for any third party, without special access, to confirm that a document is authentic against the issuer's authoritative record."
      },
      {
        "q": "Does public verification expose private data?",
        "a": "It is designed to confirm authenticity and status without disclosing sensitive content beyond what the document holder shares."
      },
      {
        "q": "Why make verification public?",
        "a": "Open checkability strengthens trust and makes forgeries easier to expose, since anyone can confirm a document against the issuer's record."
      }
    ],
    "relatedIndustries": [
      "government",
      "electoral-commissions",
      "parliaments",
      "municipalities"
    ],
    "relatedProblems": [
      "document-verification",
      "official-publication",
      "document-authenticity",
      "publication-audit"
    ],
    "diagram": "shield",
    "metaTitle": "Public Verification: Anyone Can Confirm a Document",
    "metaDescription": "Public verification lets any third party confirm a document's authenticity against the issuer's authoritative record without special access."
  },
  {
    "slug": "admissible-evidence",
    "term": "Admissible evidence",
    "category": "Legal & evidentiary",
    "kicker": "Evidence that a tribunal will accept",
    "headline": "Make institutional records ready for the courtroom",
    "lead": "Whether a document is accepted by a court turns on relevance, reliability, and the integrity of how it was produced and kept.",
    "definition": "Admissible evidence is material a court or tribunal is permitted to consider because it satisfies the relevant rules on relevance, authenticity, and reliability. It contrasts with material excluded for being unreliable, prejudicial, or improperly obtained.",
    "why": [
      "Documents kept without a verifiable chain of custody are easier to challenge on authenticity grounds, raising the cost of relying on them later.",
      "Institutions often discover gaps in provenance only when a record is needed as evidence, long after the events it describes.",
      "Predictable, well-documented record-keeping reduces disputes about whether a record can be relied upon at all."
    ],
    "how": [
      {
        "t": "Capture provenance at creation",
        "d": "Record who produced a document, when, and under what authority, so its origin can be reconstructed rather than reconstructed from memory."
      },
      {
        "t": "Preserve integrity over time",
        "d": "Use tamper-evident storage and verifiable seals so any later alteration is detectable and the record's state is demonstrable."
      },
      {
        "t": "Maintain an auditable trail",
        "d": "Keep an unbroken log of access, transfers, and changes so the record's handling can be explained end to end."
      }
    ],
    "faqs": [
      {
        "q": "What is admissible evidence?",
        "a": "Admissible evidence is material a court or tribunal is permitted to consider because it meets the applicable rules on relevance, authenticity, and reliability, as opposed to material that is excluded."
      },
      {
        "q": "Does good record-keeping guarantee admissibility?",
        "a": "No. Admissibility is decided by the tribunal under the governing rules. Strong provenance and integrity controls support a record but do not predetermine any ruling."
      },
      {
        "q": "How does this platform relate to admissibility?",
        "a": "It helps institutions document provenance, preserve integrity, and produce audit trails, which are factors commonly weighed when reliability and authenticity are assessed. It is not legal advice."
      }
    ],
    "relatedIndustries": [
      "justice",
      "government",
      "regulators",
      "law-enforcement"
    ],
    "relatedProblems": [
      "documentary-evidence",
      "authentication-of-evidence",
      "evidentiary-weight",
      "legal-admissibility"
    ],
    "diagram": "shield",
    "metaTitle": "Admissible Evidence: Records Courts Will Accept",
    "metaDescription": "How relevance, authenticity, and reliable record-keeping shape whether institutional documents can be admitted as evidence. Concept overview, not legal advice."
  },
  {
    "slug": "evidentiary-weight",
    "term": "Evidentiary weight",
    "category": "Legal & evidentiary",
    "kicker": "How much a record persuades",
    "headline": "Strengthen how convincingly your records speak",
    "lead": "Admission is only the threshold; the weight a tribunal gives a document depends on how trustworthy and well-supported it appears.",
    "definition": "Evidentiary weight is the degree of persuasive force a tribunal assigns to a piece of evidence once it has been admitted. It reflects how reliable, corroborated, and probative the material is, not merely whether it is allowed.",
    "why": [
      "Two admitted documents can carry very different persuasive force depending on their provenance and how consistently they are supported.",
      "Weak provenance invites argument that a record deserves little reliance even when it cannot be excluded outright.",
      "Demonstrable integrity controls let a record stand on its own rather than depending on a witness's recollection."
    ],
    "how": [
      {
        "t": "Show contemporaneous creation",
        "d": "Timestamp records at the moment they are made so their proximity to the events they describe is evident."
      },
      {
        "t": "Corroborate with linked records",
        "d": "Connect a document to related approvals, logs, and source material so it is not an isolated assertion."
      },
      {
        "t": "Evidence non-alteration",
        "d": "Apply verifiable seals so a record's unchanged state since creation can be demonstrated, not merely asserted."
      }
    ],
    "faqs": [
      {
        "q": "What is evidentiary weight?",
        "a": "Evidentiary weight is the persuasive force a tribunal assigns to admitted evidence, reflecting how reliable, corroborated, and probative it is rather than whether it is admissible."
      },
      {
        "q": "How is weight different from admissibility?",
        "a": "Admissibility is the threshold question of whether evidence may be considered. Weight is the separate judgment of how much that evidence persuades once admitted."
      },
      {
        "q": "Can a platform increase evidentiary weight?",
        "a": "It can support factors a tribunal may weigh, such as provenance, timestamping, and integrity. The weight ultimately assigned remains a matter for the tribunal."
      }
    ],
    "relatedIndustries": [
      "justice",
      "regulators",
      "financial-institutions",
      "government"
    ],
    "relatedProblems": [
      "admissible-evidence",
      "documentary-evidence",
      "best-evidence-rule",
      "authentication-of-evidence"
    ],
    "diagram": "shield",
    "metaTitle": "Evidentiary Weight: How Records Persuade",
    "metaDescription": "Evidentiary weight is the persuasive force a tribunal gives admitted evidence. How provenance and integrity controls support it. Concept overview only."
  },
  {
    "slug": "best-evidence-rule",
    "term": "Best evidence rule",
    "category": "Legal & evidentiary",
    "kicker": "Prefer the original",
    "headline": "Keep originals provable when only copies remain",
    "lead": "Many legal traditions prefer the original of a document over a copy, making the integrity of your primary record a practical concern.",
    "definition": "Best evidence rule is the principle preferring the original of a document when its contents are in issue, accepting copies only under defined conditions. It exists to reduce the risk of error or alteration introduced by reproduction.",
    "why": [
      "When contents are disputed, the absence of a verifiable original can weaken reliance on a copy.",
      "Digital records blur the line between original and copy, making demonstrable integrity more important than physical primacy.",
      "Institutions need to show that a presented version corresponds to the authoritative source."
    ],
    "how": [
      {
        "t": "Designate the authoritative record",
        "d": "Identify which stored instance is the source of truth so copies can be traced back to it."
      },
      {
        "t": "Bind copies to the original",
        "d": "Link each reproduction to the authoritative record so equivalence can be demonstrated."
      },
      {
        "t": "Detect divergence",
        "d": "Use verifiable seals so any difference between a copy and the original record is detectable."
      }
    ],
    "faqs": [
      {
        "q": "What is the best evidence rule?",
        "a": "The best evidence rule is a principle preferring the original of a document when its contents are in issue, accepting copies only under defined conditions, to reduce the risk of reproduction error or alteration."
      },
      {
        "q": "Does it still apply to digital documents?",
        "a": "Its application to digital records varies by jurisdiction, where the concept of an original is interpreted through integrity and reliability. Specifics are a question for qualified counsel."
      },
      {
        "q": "How does the platform help?",
        "a": "It helps designate an authoritative record and demonstrate that copies correspond to it through verifiable integrity controls. It does not determine how any rule applies."
      }
    ],
    "relatedIndustries": [
      "justice",
      "archives",
      "land-registries",
      "notarial-authorities"
    ],
    "relatedProblems": [
      "original-document",
      "certified-copy",
      "true-copy",
      "documentary-evidence"
    ],
    "diagram": "seal",
    "metaTitle": "Best Evidence Rule: Why Originals Matter",
    "metaDescription": "The best evidence rule prefers original documents over copies. How integrity controls support authoritative records in digital systems. Concept overview only."
  },
  {
    "slug": "legal-validity",
    "term": "Legal validity",
    "category": "Legal & evidentiary",
    "kicker": "Recognised as legally effective",
    "headline": "Give documents a recognisable basis for effect",
    "lead": "A document carries legal validity when it meets the formal requirements for the legal effect it claims, from signatures to authority and form.",
    "definition": "Legal validity is the quality of a document satisfying the formal and substantive requirements needed for it to have legal effect. A valid document is recognised as capable of producing the rights, obligations, or status it asserts.",
    "why": [
      "A defect in form or authority can render a document ineffective regardless of how carefully it was stored.",
      "Institutions issuing many documents need consistent controls so validity is not a case-by-case accident.",
      "Recipients and counterparties increasingly expect to verify that a document was issued under proper authority."
    ],
    "how": [
      {
        "t": "Encode required formalities",
        "d": "Build the necessary signatures, approvals, and form elements into the issuance workflow so they are not omitted."
      },
      {
        "t": "Bind issuing authority",
        "d": "Tie each document to the authorised role or body that issued it so its basis of authority is clear."
      },
      {
        "t": "Make validity checkable",
        "d": "Allow recipients to confirm a document's issuance and integrity through a verifiable record."
      }
    ],
    "faqs": [
      {
        "q": "What is legal validity?",
        "a": "Legal validity is the quality of a document satisfying the formal and substantive requirements needed for it to have legal effect, so it is recognised as capable of producing the rights or status it asserts."
      },
      {
        "q": "Is validity the same as admissibility?",
        "a": "No. Validity concerns whether a document is legally effective; admissibility concerns whether it may be considered as evidence. A document can be valid but face separate evidentiary questions."
      },
      {
        "q": "Can the platform make a document valid?",
        "a": "It can help ensure required formalities and issuing authority are captured and verifiable, but validity depends on the governing law. This is a concept overview, not legal advice."
      }
    ],
    "relatedIndustries": [
      "government",
      "notarial-authorities",
      "civil-registration",
      "regulators"
    ],
    "relatedProblems": [
      "enforceability",
      "self-authenticating-document",
      "notarized-document",
      "legal-admissibility"
    ],
    "diagram": "shield",
    "metaTitle": "Legal Validity: When Documents Take Effect",
    "metaDescription": "Legal validity is whether a document meets the requirements for legal effect. How issuance controls support it. Concept overview, not legal advice."
  },
  {
    "slug": "enforceability",
    "term": "Enforceability",
    "category": "Legal & evidentiary",
    "kicker": "Capable of being upheld",
    "headline": "Support documents that can be relied on and upheld",
    "lead": "Beyond being valid, a document is enforceable when its terms can actually be upheld and acted upon through legal process.",
    "definition": "Enforceability is the capacity of a document's terms to be upheld and given effect through legal process. It depends on validity, clarity of terms, and the ability to prove the document's authenticity when relied upon.",
    "why": [
      "An otherwise valid document is of little use if its authenticity cannot be proven when it is invoked.",
      "Disputes over whether terms were altered after agreement can undermine enforcement.",
      "Clear provenance and integrity reduce avenues for challenging a document at the point it matters most."
    ],
    "how": [
      {
        "t": "Fix the agreed state",
        "d": "Seal the document at the moment of agreement so the operative version is unambiguous."
      },
      {
        "t": "Preserve signatory evidence",
        "d": "Retain verifiable records of who assented and when, so consent can be demonstrated."
      },
      {
        "t": "Enable proof on demand",
        "d": "Make authenticity and integrity confirmable later without depending on the original drafters."
      }
    ],
    "faqs": [
      {
        "q": "What is enforceability?",
        "a": "Enforceability is the capacity of a document's terms to be upheld and given effect through legal process, depending on validity, clarity, and the ability to prove its authenticity when relied upon."
      },
      {
        "q": "What can make a document unenforceable?",
        "a": "Factors include defects in formation, ambiguous terms, or an inability to prove authenticity, among others. The specifics are governed by applicable law and are a matter for counsel."
      },
      {
        "q": "How does the platform support enforceability?",
        "a": "It helps fix the agreed state of a document and preserve verifiable evidence of authenticity and assent. Whether terms are enforced remains a legal determination."
      }
    ],
    "relatedIndustries": [
      "justice",
      "financial-institutions",
      "insurance",
      "notarial-authorities"
    ],
    "relatedProblems": [
      "legal-validity",
      "sworn-statement",
      "documentary-evidence",
      "authentication-of-evidence"
    ],
    "diagram": "shield",
    "metaTitle": "Enforceability: Upholding Document Terms",
    "metaDescription": "Enforceability is whether a document's terms can be upheld through legal process. How provenance and integrity support it. Concept overview only."
  },
  {
    "slug": "original-document",
    "term": "Original document",
    "category": "Legal & evidentiary",
    "kicker": "The authoritative primary record",
    "headline": "Define the original when everything is digital",
    "lead": "The notion of an original anchors many evidentiary rules, yet in digital systems the original is defined by integrity rather than physical primacy.",
    "definition": "Original document refers to the authoritative primary instance of a record, from which copies derive and against which they are measured. In digital contexts, originality is established through verifiable integrity rather than physical first creation.",
    "why": [
      "Without a designated original, every instance of a record can claim equal authority, complicating disputes.",
      "Digital duplication makes physical primacy meaningless, so integrity must define the authoritative version.",
      "Evidentiary rules that prefer originals require institutions to point to a specific authoritative record."
    ],
    "how": [
      {
        "t": "Anchor the authoritative instance",
        "d": "Establish a single record as the original and seal it so its state is fixed."
      },
      {
        "t": "Derive copies transparently",
        "d": "Generate copies that reference the original so their lineage is clear."
      },
      {
        "t": "Verify against the anchor",
        "d": "Allow any instance to be checked against the sealed original to confirm it is unaltered."
      }
    ],
    "faqs": [
      {
        "q": "What is an original document?",
        "a": "An original document is the authoritative primary instance of a record, from which copies derive and against which they are measured, with originality in digital contexts established through verifiable integrity."
      },
      {
        "q": "Can a digital file be an original?",
        "a": "Yes, in many frameworks a digital record can serve as an original where its integrity and authenticity are demonstrable. How that is treated depends on the jurisdiction."
      },
      {
        "q": "How does the platform establish originality?",
        "a": "It seals an authoritative instance and lets copies be verified against it, supporting a clear concept of the original. It does not adjudicate originality under law."
      }
    ],
    "relatedIndustries": [
      "archives",
      "land-registries",
      "notarial-authorities",
      "national-libraries"
    ],
    "relatedProblems": [
      "best-evidence-rule",
      "certified-copy",
      "true-copy",
      "attested-copy"
    ],
    "diagram": "seal",
    "metaTitle": "Original Document: The Authoritative Record",
    "metaDescription": "An original document is the authoritative primary instance of a record. How digital originality rests on verifiable integrity. Concept overview only."
  },
  {
    "slug": "certified-copy",
    "term": "Certified copy",
    "category": "Legal & evidentiary",
    "kicker": "A copy attested as faithful",
    "headline": "Issue copies recipients can trust as faithful",
    "lead": "A certified copy carries a formal attestation that it faithfully reproduces an original, letting recipients rely on it without seeing the source.",
    "definition": "Certified copy refers to a reproduction of a document accompanied by a formal statement from an authorised person or body attesting that it is a true and complete reproduction of the original. It allows reliance on the copy in place of the original.",
    "why": [
      "Originals are often retained securely, so recipients depend on certified copies for routine reliance.",
      "An attestation is only as good as the ability to confirm who made it and that the copy is unaltered since.",
      "Forged or altered certifications undermine the entire chain of reliance on copies."
    ],
    "how": [
      {
        "t": "Bind certification to source",
        "d": "Link the certifying statement to the specific original it reproduces so the relationship is traceable."
      },
      {
        "t": "Attribute the certifier",
        "d": "Record the authorised role issuing the certification so its authority can be confirmed."
      },
      {
        "t": "Seal the certified copy",
        "d": "Apply a verifiable seal so any later change to the certified copy is detectable."
      }
    ],
    "faqs": [
      {
        "q": "What is a certified copy?",
        "a": "A certified copy is a reproduction accompanied by a formal statement from an authorised person attesting that it is a true and complete reproduction of the original, allowing reliance on the copy in place of the original."
      },
      {
        "q": "Who can certify a copy?",
        "a": "The persons or bodies authorised to certify vary by jurisdiction and document type, and may include notaries, officials, or designated institutional roles. This is determined by applicable rules."
      },
      {
        "q": "How does the platform support certified copies?",
        "a": "It binds certifications to their source originals, attributes the certifier, and seals the result for verification. It does not confer certifying authority."
      }
    ],
    "relatedIndustries": [
      "notarial-authorities",
      "civil-registration",
      "government",
      "universities"
    ],
    "relatedProblems": [
      "true-copy",
      "attested-copy",
      "original-document",
      "self-authenticating-document", "certified-true-copy"],
    "diagram": "seal",
    "metaTitle": "Certified Copy: Trusted Document Reproductions",
    "metaDescription": "A certified copy is attested as a true reproduction of an original. How certification can be bound and verified. Concept overview, not legal advice."
  },
  {
    "slug": "true-copy",
    "term": "True copy",
    "category": "Legal & evidentiary",
    "kicker": "An exact reproduction",
    "headline": "Prove a copy matches its source exactly",
    "lead": "A true copy is one that exactly reproduces an original in content, and demonstrating that exactness is what gives it practical value.",
    "definition": "True copy refers to a reproduction that exactly matches the content of the original document it reproduces, without omission or alteration. Its usefulness depends on being able to demonstrate that exact correspondence.",
    "why": [
      "Recipients accept a true copy in place of an original only if its exact correspondence can be trusted.",
      "Even minor undetected differences between a copy and its source can have material consequences.",
      "Manual comparison does not scale, so institutions need a verifiable basis for asserting exactness."
    ],
    "how": [
      {
        "t": "Capture a source fingerprint",
        "d": "Record an integrity value for the original so any copy can be compared against it."
      },
      {
        "t": "Verify exact correspondence",
        "d": "Check a copy against the source fingerprint to confirm it reproduces the content without change."
      },
      {
        "t": "Flag any divergence",
        "d": "Surface differences immediately so a non-matching copy is never mistaken for a true copy."
      }
    ],
    "faqs": [
      {
        "q": "What is a true copy?",
        "a": "A true copy is a reproduction that exactly matches the content of the original document it reproduces, without omission or alteration, and whose usefulness depends on demonstrating that exact correspondence."
      },
      {
        "q": "How is a true copy different from a certified copy?",
        "a": "A true copy is about exact content correspondence; a certified copy adds a formal attestation by an authorised person. A copy can be true without being formally certified."
      },
      {
        "q": "How does the platform demonstrate a true copy?",
        "a": "It captures an integrity fingerprint of the original and verifies copies against it, flagging any divergence. It supports the demonstration but does not certify under law."
      }
    ],
    "relatedIndustries": [
      "archives",
      "government",
      "universities",
      "land-registries"
    ],
    "relatedProblems": [
      "certified-copy",
      "attested-copy",
      "original-document",
      "best-evidence-rule", "certified-true-copy"],
    "diagram": "seal",
    "metaTitle": "True Copy: Proving Exact Reproductions",
    "metaDescription": "A true copy exactly reproduces an original's content. How integrity fingerprints demonstrate exact correspondence. Concept overview, not legal advice."
  },
  {
    "slug": "attested-copy",
    "term": "Attested copy",
    "category": "Legal & evidentiary",
    "kicker": "Witnessed as genuine",
    "headline": "Back copies with a verifiable witnessing record",
    "lead": "An attested copy bears a witness's confirmation that it corresponds to the original, adding a layer of human verification to reproductions.",
    "definition": "Attested copy refers to a reproduction confirmed by a witness or authorised person who signs to verify that it corresponds to the original. The attestation records who vouched for the copy and when.",
    "why": [
      "An attestation's value rests on being able to confirm the witness's identity and that nothing changed afterward.",
      "Where copies pass through many hands, an unverifiable attestation provides little assurance.",
      "Institutions need attestations that remain checkable long after the witness is unavailable."
    ],
    "how": [
      {
        "t": "Record the witnessing act",
        "d": "Capture who attested, in what capacity, and against which original, as a structured record."
      },
      {
        "t": "Attribute the attestor",
        "d": "Bind the attestation to a verifiable identity so its source can be confirmed later."
      },
      {
        "t": "Seal the attested result",
        "d": "Apply a verifiable seal so the attested copy and its attestation cannot be silently altered."
      }
    ],
    "faqs": [
      {
        "q": "What is an attested copy?",
        "a": "An attested copy is a reproduction confirmed by a witness or authorised person who signs to verify that it corresponds to the original, recording who vouched for the copy and when."
      },
      {
        "q": "How does it differ from a certified copy?",
        "a": "The terms overlap and vary by jurisdiction; attestation emphasises a witness vouching for correspondence, while certification often implies a formal official statement. Local rules govern the distinction."
      },
      {
        "q": "How does the platform support attestation?",
        "a": "It records the witnessing act, attributes the attestor verifiably, and seals the result. It does not grant authority to attest, which is governed by applicable rules."
      }
    ],
    "relatedIndustries": [
      "notarial-authorities",
      "civil-registration",
      "justice",
      "government"
    ],
    "relatedProblems": [
      "certified-copy",
      "true-copy",
      "sworn-statement",
      "self-authenticating-document", "certified-true-copy"],
    "diagram": "seal",
    "metaTitle": "Attested Copy: Witnessed Reproductions",
    "metaDescription": "An attested copy is confirmed by a witness as corresponding to the original. How witnessing can be recorded and verified. Concept overview only."
  },
  {
    "slug": "sworn-statement",
    "term": "Sworn statement",
    "category": "Legal & evidentiary",
    "kicker": "A statement made under oath",
    "headline": "Preserve sworn statements as tamper-evident records",
    "lead": "A sworn statement carries the weight of an oath, and preserving exactly what was sworn, by whom, and when is central to its later use.",
    "definition": "Sworn statement refers to a declaration of fact made under oath or affirmation before an authorised officer, with the maker accepting legal consequences for falsehood. Its evidentiary use depends on preserving the exact statement and the circumstances of swearing.",
    "why": [
      "If the recorded statement can be altered after swearing, its reliability collapses.",
      "Disputes often turn on precisely what was sworn, making an immutable record valuable.",
      "The identity of the maker and the officer must remain confirmable over time."
    ],
    "how": [
      {
        "t": "Seal at the moment of swearing",
        "d": "Fix the statement's content when sworn so the operative version is unambiguous."
      },
      {
        "t": "Record the swearing circumstances",
        "d": "Capture the officer, place, and time so the context of the oath is preserved."
      },
      {
        "t": "Bind maker identity",
        "d": "Attribute the statement to a verifiable identity so authorship can be confirmed."
      }
    ],
    "faqs": [
      {
        "q": "What is a sworn statement?",
        "a": "A sworn statement is a declaration of fact made under oath or affirmation before an authorised officer, with the maker accepting legal consequences for falsehood, whose use depends on preserving the exact statement and swearing circumstances."
      },
      {
        "q": "Is a sworn statement the same as an affidavit?",
        "a": "An affidavit is a common form of sworn written statement, but terminology and formal requirements vary by jurisdiction. The precise distinctions are a matter for applicable law."
      },
      {
        "q": "How does the platform help?",
        "a": "It seals the statement at swearing, records the circumstances, and binds maker identity for later verification. It does not administer oaths or provide legal advice."
      }
    ],
    "relatedIndustries": [
      "justice",
      "notarial-authorities",
      "law-enforcement",
      "immigration-authorities"
    ],
    "relatedProblems": [
      "affidavit-record",
      "documentary-evidence",
      "enforceability",
      "authentication-of-evidence", "position-statement"],
    "diagram": "seal",
    "metaTitle": "Sworn Statement: Preserving Oath Records",
    "metaDescription": "A sworn statement is a declaration made under oath before an authorised officer. How to preserve what was sworn. Concept overview, not legal advice."
  },
  {
    "slug": "affidavit-record",
    "term": "Affidavit record",
    "category": "Legal & evidentiary",
    "kicker": "A written sworn declaration",
    "headline": "Keep affidavits provable from oath to filing",
    "lead": "An affidavit is a written sworn statement whose value as evidence depends on an unbroken, verifiable record from oath to use.",
    "definition": "Affidavit record refers to the preserved written statement sworn before an authorised officer, together with the evidence of its swearing and subsequent handling. Maintaining it intact supports its reliability when later submitted as evidence.",
    "why": [
      "An affidavit relied on months later must be shown to be the same document that was sworn.",
      "Gaps in handling between swearing and filing invite challenges to authenticity.",
      "The jurat and signatures must remain verifiable for the affidavit to carry its intended weight."
    ],
    "how": [
      {
        "t": "Fix content at execution",
        "d": "Seal the affidavit when sworn so its text and exhibits are locked."
      },
      {
        "t": "Preserve the jurat",
        "d": "Keep the officer's certification of swearing bound to the statement it certifies."
      },
      {
        "t": "Track custody to filing",
        "d": "Maintain an auditable trail from execution through submission so handling is accountable."
      }
    ],
    "faqs": [
      {
        "q": "What is an affidavit record?",
        "a": "An affidavit record is the preserved written statement sworn before an authorised officer, together with the evidence of its swearing and handling, kept intact to support reliability when submitted as evidence."
      },
      {
        "q": "What is a jurat?",
        "a": "A jurat is the officer's certification that a statement was sworn or affirmed before them, recording the circumstances of execution. Its form is governed by applicable rules."
      },
      {
        "q": "How does the platform support affidavits?",
        "a": "It seals the affidavit at execution, keeps the jurat bound to it, and tracks custody to filing. It does not administer oaths or offer legal advice."
      }
    ],
    "relatedIndustries": [
      "justice",
      "notarial-authorities",
      "law-enforcement",
      "immigration-authorities"
    ],
    "relatedProblems": [
      "sworn-statement",
      "documentary-evidence",
      "exhibit",
      "chain-of-custody"
    ],
    "diagram": "chain",
    "metaTitle": "Affidavit Record: From Oath to Filing",
    "metaDescription": "An affidavit record is a sworn written statement preserved with its swearing evidence. How to keep it provable. Concept overview, not legal advice."
  },
  {
    "slug": "exhibit",
    "term": "Exhibit",
    "category": "Legal & evidentiary",
    "kicker": "A document presented in proceedings",
    "headline": "Present exhibits that hold up under scrutiny",
    "lead": "An exhibit is a document formally introduced in proceedings, and its acceptance hinges on showing it is what it claims to be.",
    "definition": "Exhibit refers to a document or object formally introduced and identified in legal or administrative proceedings as evidence. Its acceptance depends on demonstrating authenticity and an unbroken link to its source.",
    "why": [
      "An exhibit challenged as not genuine can be excluded or discounted regardless of its content.",
      "Marking and referencing must remain stable so the exhibit relied upon is unambiguous.",
      "Links between an exhibit and the statement or filing it supports must be preserved."
    ],
    "how": [
      {
        "t": "Identify and mark",
        "d": "Assign a stable identifier to each exhibit so references remain unambiguous throughout proceedings."
      },
      {
        "t": "Bind to its source",
        "d": "Link the exhibit to its origin and to any statement it accompanies so the connection is traceable."
      },
      {
        "t": "Seal against alteration",
        "d": "Apply a verifiable seal so the exhibit's state when introduced is demonstrable."
      }
    ],
    "faqs": [
      {
        "q": "What is an exhibit?",
        "a": "An exhibit is a document or object formally introduced and identified in proceedings as evidence, whose acceptance depends on demonstrating authenticity and an unbroken link to its source."
      },
      {
        "q": "How is an exhibit authenticated?",
        "a": "Authentication methods vary, but generally require showing the item is what it is claimed to be, often through provenance, witnesses, or self-authenticating features. The governing rules apply."
      },
      {
        "q": "How does the platform support exhibits?",
        "a": "It assigns stable identifiers, binds exhibits to their sources, and seals them for verification. Whether an exhibit is admitted is for the tribunal to decide."
      }
    ],
    "relatedIndustries": [
      "justice",
      "law-enforcement",
      "regulators",
      "government"
    ],
    "relatedProblems": [
      "documentary-evidence",
      "authentication-of-evidence",
      "chain-of-custody",
      "admissible-evidence"
    ],
    "diagram": "chain",
    "metaTitle": "Exhibit: Documents Introduced as Evidence",
    "metaDescription": "An exhibit is a document formally introduced in proceedings as evidence. How authenticity and source links support it. Concept overview only."
  },
  {
    "slug": "documentary-evidence",
    "term": "Documentary evidence",
    "category": "Legal & evidentiary",
    "kicker": "Proof in document form",
    "headline": "Turn institutional documents into reliable proof",
    "lead": "Documentary evidence is proof contained in documents, and its persuasiveness depends on the integrity and provenance of those documents.",
    "definition": "Documentary evidence is evidence in the form of documents, whether written, printed, or digital, offered to prove facts in issue. Its reliability rests on the authenticity, integrity, and provenance of the documents presented.",
    "why": [
      "Documents are only as persuasive as the confidence that they are genuine and unaltered.",
      "Large institutions generate vast records, few of which are preserved with evidence in mind.",
      "Provenance gaps discovered during a dispute are costly and sometimes irreparable."
    ],
    "how": [
      {
        "t": "Preserve from creation",
        "d": "Capture and seal records as they are made so their evidentiary state is established early."
      },
      {
        "t": "Maintain provenance",
        "d": "Keep an unbroken account of origin and handling so each document's history is reconstructable."
      },
      {
        "t": "Enable verification",
        "d": "Allow authenticity and integrity to be confirmed independently when a document is relied upon."
      }
    ],
    "faqs": [
      {
        "q": "What is documentary evidence?",
        "a": "Documentary evidence is evidence in the form of documents, whether written, printed, or digital, offered to prove facts in issue, with reliability resting on authenticity, integrity, and provenance."
      },
      {
        "q": "How is documentary evidence different from testimony?",
        "a": "Documentary evidence resides in documents themselves, while testimony is given orally by witnesses. The two are often used together, and rules govern how each is treated."
      },
      {
        "q": "How does the platform support it?",
        "a": "It preserves records from creation, maintains provenance, and enables independent verification of authenticity and integrity. It is a concept overview, not legal advice."
      }
    ],
    "relatedIndustries": [
      "justice",
      "regulators",
      "financial-institutions",
      "government"
    ],
    "relatedProblems": [
      "admissible-evidence",
      "evidentiary-weight",
      "authentication-of-evidence",
      "exhibit"
    ],
    "diagram": "shield",
    "metaTitle": "Documentary Evidence: Proof in Documents",
    "metaDescription": "Documentary evidence is proof in document form, reliant on authenticity and provenance. How to preserve it. Concept overview, not legal advice."
  },
  {
    "slug": "authentication-of-evidence",
    "term": "Authentication of evidence",
    "category": "Legal & evidentiary",
    "kicker": "Showing evidence is genuine",
    "headline": "Show that evidence is what it claims to be",
    "lead": "Before evidence persuades, it must be authenticated, shown to be what its proponent claims, through provenance, features, or testimony.",
    "definition": "Authentication of evidence is the process of establishing that a piece of evidence is genuinely what its proponent claims it to be. It is a precondition to reliance, satisfied through provenance, distinctive features, or witness testimony.",
    "why": [
      "Unauthenticated material can be excluded or given little weight no matter how relevant it seems.",
      "Self-authenticating features reduce reliance on witnesses who may be unavailable later.",
      "Authentication is easier when integrity and provenance were captured at the outset."
    ],
    "how": [
      {
        "t": "Embed verifiable origin",
        "d": "Capture origin metadata and seals so a document carries its own evidence of source."
      },
      {
        "t": "Support independent checking",
        "d": "Let a verifier confirm authenticity without needing the original creator's testimony."
      },
      {
        "t": "Preserve distinctive markers",
        "d": "Retain seals, signatures, and identifiers that distinguish a genuine record from an impostor."
      }
    ],
    "faqs": [
      {
        "q": "What is authentication of evidence?",
        "a": "Authentication of evidence is the process of establishing that evidence is genuinely what its proponent claims, serving as a precondition to reliance and satisfied through provenance, distinctive features, or testimony."
      },
      {
        "q": "Is authentication the same as admissibility?",
        "a": "Authentication is one requirement that contributes to admissibility, but it is not the only one. Other rules, such as those on relevance, also apply under the governing framework."
      },
      {
        "q": "How does the platform support authentication?",
        "a": "It embeds verifiable origin, supports independent checking, and preserves distinctive markers. Whether evidence is authenticated and admitted remains for the tribunal."
      }
    ],
    "relatedIndustries": [
      "justice",
      "law-enforcement",
      "regulators",
      "intellectual-property"
    ],
    "relatedProblems": [
      "documentary-evidence",
      "self-authenticating-document",
      "admissible-evidence",
      "exhibit"
    ],
    "diagram": "shield",
    "metaTitle": "Authentication of Evidence: Proving Genuineness",
    "metaDescription": "Authentication establishes that evidence is what it claims to be. How provenance and seals support it. Concept overview, not legal advice."
  },
  {
    "slug": "legal-admissibility",
    "term": "Legal admissibility",
    "category": "Legal & evidentiary",
    "kicker": "Eligibility to be considered",
    "headline": "Keep records eligible to be considered as proof",
    "lead": "Legal admissibility is the eligibility of evidence to be considered by a tribunal, governed by rules on relevance, authenticity, and reliability.",
    "definition": "Legal admissibility is the eligibility of a piece of evidence to be considered by a court or tribunal under the applicable procedural and evidentiary rules. It is distinct from the weight ultimately given to admitted evidence.",
    "why": [
      "Records prepared without admissibility in mind may be challenged on authenticity or reliability grounds.",
      "Frameworks for handling records help align practice with what tribunals commonly expect.",
      "Demonstrable integrity and provenance address recurring objections before they arise."
    ],
    "how": [
      {
        "t": "Align with reliability expectations",
        "d": "Structure record-keeping so authenticity and integrity can be shown when required."
      },
      {
        "t": "Document handling",
        "d": "Maintain trails that explain how a record was produced and kept."
      },
      {
        "t": "Make provenance demonstrable",
        "d": "Ensure origin and chain of handling can be evidenced rather than assumed."
      }
    ],
    "faqs": [
      {
        "q": "What is legal admissibility?",
        "a": "Legal admissibility is the eligibility of evidence to be considered by a court or tribunal under applicable procedural and evidentiary rules, distinct from the weight given to admitted evidence."
      },
      {
        "q": "What can make evidence inadmissible?",
        "a": "Reasons vary by jurisdiction and may include irrelevance, unreliability, improper acquisition, or failure to authenticate. The governing rules determine admissibility in each case."
      },
      {
        "q": "Does the platform guarantee admissibility?",
        "a": "No. It helps align record-keeping with factors tribunals commonly weigh, such as authenticity and provenance, but admissibility is always decided by the tribunal."
      }
    ],
    "relatedIndustries": [
      "justice",
      "regulators",
      "government",
      "financial-institutions"
    ],
    "relatedProblems": [
      "admissible-evidence",
      "evidentiary-weight",
      "authentication-of-evidence",
      "best-evidence-rule"
    ],
    "diagram": "shield",
    "metaTitle": "Legal Admissibility: Eligibility as Evidence",
    "metaDescription": "Legal admissibility is whether evidence may be considered by a tribunal. How record-keeping aligns with expectations. Concept overview only."
  },
  {
    "slug": "self-authenticating-document",
    "term": "Self-authenticating document",
    "category": "Legal & evidentiary",
    "kicker": "Genuine on its face",
    "headline": "Issue documents that verify themselves",
    "lead": "Some documents carry features that establish their genuineness without separate proof, reducing the burden of authentication.",
    "definition": "Self-authenticating document refers to a document whose genuineness is established by its own recognised features, such as official seals or certifications, without requiring extrinsic evidence. Such features reduce the need for separate authentication testimony.",
    "why": [
      "Relying on witnesses to authenticate routine records is fragile and does not scale.",
      "Recognisable, verifiable features let a document stand on its own when relied upon.",
      "Digital seals can extend self-authenticating qualities to electronic records."
    ],
    "how": [
      {
        "t": "Embed recognisable features",
        "d": "Apply official seals and certifications that a verifier can recognise and check."
      },
      {
        "t": "Make features verifiable",
        "d": "Ensure the embedded markers can be independently confirmed as genuine."
      },
      {
        "t": "Bind features to content",
        "d": "Tie seals to the document's content so altering one invalidates the other."
      }
    ],
    "faqs": [
      {
        "q": "What is a self-authenticating document?",
        "a": "A self-authenticating document is one whose genuineness is established by its own recognised features, such as official seals or certifications, without requiring extrinsic evidence to authenticate it."
      },
      {
        "q": "Which documents are self-authenticating?",
        "a": "Categories vary by jurisdiction and commonly include certain official records and certified copies. Whether a document qualifies is determined by the applicable evidentiary rules."
      },
      {
        "q": "How does the platform support this?",
        "a": "It embeds verifiable seals bound to content so documents can carry recognisable, checkable features. Whether a document is treated as self-authenticating depends on the law."
      }
    ],
    "relatedIndustries": [
      "government",
      "notarial-authorities",
      "regulators",
      "civil-registration"
    ],
    "relatedProblems": [
      "authentication-of-evidence",
      "notarized-document",
      "apostille",
      "certified-copy"
    ],
    "diagram": "seal",
    "metaTitle": "Self-Authenticating Document: Genuine on Its Face",
    "metaDescription": "A self-authenticating document proves its genuineness through its own features. How verifiable seals support it. Concept overview, not legal advice."
  },
  {
    "slug": "notarized-document",
    "term": "Notarized document",
    "category": "Legal & evidentiary",
    "kicker": "Verified by a notary",
    "headline": "Preserve notarial acts as verifiable records",
    "lead": "A notarized document carries a notary's verification of signing or content, and preserving that act intact is essential to its later use.",
    "definition": "Notarized document refers to a document bearing a notary public's official act verifying matters such as the identity of signatories or the execution of the document. The notarial act adds an independent layer of verification to the record.",
    "why": [
      "The value of notarization depends on the notarial act remaining verifiable and unaltered.",
      "Forged or detached notarial certificates undermine reliance on notarized records.",
      "Cross-border use often requires the notarial act to be confirmable by foreign authorities."
    ],
    "how": [
      {
        "t": "Bind the notarial act",
        "d": "Keep the notary's certificate inseparably linked to the document it concerns."
      },
      {
        "t": "Attribute the notary",
        "d": "Record the notary's identity and authority so the act can be confirmed."
      },
      {
        "t": "Seal the combined record",
        "d": "Apply a verifiable seal so the document and its notarization cannot be silently changed."
      }
    ],
    "faqs": [
      {
        "q": "What is a notarized document?",
        "a": "A notarized document is one bearing a notary public's official act verifying matters such as signatory identity or execution, adding an independent layer of verification to the record."
      },
      {
        "q": "What does notarization prove?",
        "a": "Notarization typically attests to matters the notary verified, such as identity and signing, within the scope permitted by law. It does not by itself attest to the truth of the document's contents."
      },
      {
        "q": "How does the platform support notarized documents?",
        "a": "It binds the notarial act to the document, attributes the notary, and seals the combined record for verification. It does not perform notarial acts."
      }
    ],
    "relatedIndustries": [
      "notarial-authorities",
      "foreign-affairs",
      "civil-registration",
      "government"
    ],
    "relatedProblems": [
      "apostille",
      "self-authenticating-document",
      "certified-copy",
      "legal-validity"
    ],
    "diagram": "seal",
    "metaTitle": "Notarized Document: Notarial Verification",
    "metaDescription": "A notarized document bears a notary's official act verifying signing or identity. How to preserve it. Concept overview, not legal advice."
  },
  {
    "slug": "apostille",
    "term": "Apostille",
    "category": "Legal & evidentiary",
    "kicker": "Cross-border document recognition",
    "headline": "Make official documents recognisable across borders",
    "lead": "An apostille certifies the origin of a public document for use abroad, streamlining recognition between participating countries.",
    "definition": "Apostille refers to a standardised certificate that authenticates the origin of a public document, such as the signature and authority of the official who issued it, for use in other countries party to the relevant convention. It simplifies cross-border recognition by replacing chains of further legalisation.",
    "why": [
      "Cross-border reliance on documents fails when foreign authorities cannot confirm their origin.",
      "Apostille certificates themselves must be verifiable to retain their assurance.",
      "Digital issuance and verification are increasingly expected alongside paper apostilles."
    ],
    "how": [
      {
        "t": "Bind apostille to source",
        "d": "Link the apostille certificate to the specific public document it authenticates."
      },
      {
        "t": "Make origin confirmable",
        "d": "Capture the issuing authority's details so the certificate's basis can be verified."
      },
      {
        "t": "Seal for cross-border checking",
        "d": "Apply verifiable integrity so a foreign verifier can confirm the apostille and document are unaltered."
      }
    ],
    "faqs": [
      {
        "q": "What is an apostille?",
        "a": "An apostille is a standardised certificate that authenticates the origin of a public document, such as the signature and authority of the issuing official, for use in countries party to the relevant convention, simplifying cross-border recognition."
      },
      {
        "q": "What does an apostille certify?",
        "a": "An apostille certifies the origin of a public document, including the authenticity of a signature, seal, or stamp, not the content of the document itself. Its scope is set by the convention."
      },
      {
        "q": "How does the platform support apostilles?",
        "a": "It binds an apostille to its source document, captures issuing-authority details, and seals the result for cross-border verification. It does not issue apostilles."
      }
    ],
    "relatedIndustries": [
      "foreign-affairs",
      "notarial-authorities",
      "civil-registration",
      "government"
    ],
    "relatedProblems": [
      "notarized-document",
      "certified-copy",
      "self-authenticating-document",
      "legal-validity"
    ],
    "diagram": "seal",
    "metaTitle": "Apostille: Cross-Border Document Recognition",
    "metaDescription": "An apostille certifies a public document's origin for use abroad. How issuance can be bound and verified. Concept overview, not legal advice."
  },
  {
    "slug": "certified-true-copy",
    "term": "Certified true copy",
    "category": "Legal & evidentiary",
    "kicker": "Attested and exact",
    "headline": "Combine exact reproduction with formal attestation",
    "lead": "A certified true copy unites two assurances: that a copy exactly matches its original and that an authorised person formally attests to that fact.",
    "definition": "Certified true copy refers to a reproduction that both exactly matches the original and bears a formal certification by an authorised person attesting to that exact correspondence. It combines demonstrable content equivalence with an attributable certifying act.",
    "why": [
      "Recipients relying on a copy benefit when both exactness and a responsible certifier are demonstrable.",
      "A certification detached from the copy it concerns provides little assurance.",
      "Cross-organisation reliance scales only when certified copies remain independently verifiable."
    ],
    "how": [
      {
        "t": "Verify exact correspondence",
        "d": "Confirm the copy matches the original through an integrity check before certification."
      },
      {
        "t": "Bind the certifying act",
        "d": "Attach the authorised certifier's attestation to the verified copy so the two are inseparable."
      },
      {
        "t": "Seal for verification",
        "d": "Apply a verifiable seal so the certified true copy and its attestation cannot be silently altered."
      }
    ],
    "faqs": [
      {
        "q": "What is a certified true copy?",
        "a": "Certified true copy refers to a reproduction that both exactly matches the original and bears a formal certification by an authorised person attesting to that correspondence, combining content equivalence with an attributable certifying act."
      },
      {
        "q": "How does it differ from a certified copy?",
        "a": "The terms overlap and usage varies by jurisdiction; certified true copy emphasises both exact correspondence and formal certification. Whether a distinction applies depends on local rules."
      },
      {
        "q": "How does the platform support certified true copies?",
        "a": "It verifies exact correspondence, binds the certifying act to the copy, and seals the result for verification. It does not confer certifying authority or give legal advice."
      }
    ],
    "relatedIndustries": [
      "notarial-authorities",
      "civil-registration",
      "government",
      "universities"
    ],
    "relatedProblems": [
      "certified-copy",
      "true-copy",
      "attested-copy",
      "self-authenticating-document"
    ],
    "diagram": "seal",
    "metaTitle": "Certified True Copy: Exact and Attested",
    "metaDescription": "A certified true copy is both an exact reproduction and formally attested. How correspondence and certification combine. Concept overview only."
  },
  {
    "slug": "version-control",
    "term": "Version control",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Keep every document version traceable and current",
    "lead": "When two people edit the same policy, version control decides whose copy is authoritative — and proves it.",
    "definition": "Version control is the discipline of recording, sequencing, and distinguishing successive states of a document so that the authoritative version is always identifiable and earlier states remain retrievable.",
    "why": [
      "Without disciplined versioning, decisions get made against stale or unofficial copies, creating legal and operational exposure.",
      "Auditors and courts expect to see how a document evolved, not just its final state, and version control supplies that lineage.",
      "Distributed teams need a single rule for which copy governs, otherwise parallel edits silently diverge."
    ],
    "how": [
      {
        "t": "Assign sequential identifiers",
        "d": "Every saved state receives a unique, ordered version label so progression is unambiguous to any reader."
      },
      {
        "t": "Lock the authoritative copy",
        "d": "Designate one stored instance as governing and route all changes through it rather than scattered local files."
      },
      {
        "t": "Preserve prior states",
        "d": "Retain superseded versions in an accessible store so earlier decisions can be reconstructed and explained."
      }
    ],
    "faqs": [
      {
        "q": "What is version control?",
        "a": "Version control is the discipline of recording and sequencing successive document states so the authoritative version is always identifiable and earlier states remain retrievable."
      },
      {
        "q": "How is it different from simple file backups?",
        "a": "Backups protect against loss; version control adds ordered identity and intent, letting you reason about which version governs and why it changed."
      },
      {
        "q": "Does version control guarantee no errors enter a document?",
        "a": "No. It makes changes visible and reversible, which supports review, but it does not itself validate the correctness of any edit."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "universities",
      "financial-institutions"
    ],
    "relatedProblems": [
      "document-control",
      "revision-history",
      "change-control",
      "single-source-of-truth"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Version Control for Institutional Documents",
    "metaDescription": "Version control keeps every document state ordered and traceable so the authoritative copy is always clear. See how institutions apply it."
  },
  {
    "slug": "document-control",
    "term": "Document control",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Govern who can change which document, when",
    "lead": "Document control is the difference between a folder of files and a managed body of record.",
    "definition": "Document control is the systematic management of how documents are created, reviewed, approved, distributed, and retired, ensuring only authorised, current versions are in use.",
    "why": [
      "Uncontrolled documents circulate without ownership, so no one can confirm whether a given copy is approved or current.",
      "Regulated environments require demonstrable control over which version reaches which audience at which time.",
      "Control reduces the risk that obsolete instructions drive live operational or legal decisions."
    ],
    "how": [
      {
        "t": "Define a controlled register",
        "d": "Maintain a central index that lists each controlled document, its owner, status, and current version."
      },
      {
        "t": "Gate creation and change",
        "d": "Require defined roles to author and approve changes so unmanaged copies never gain authority."
      },
      {
        "t": "Control distribution and retirement",
        "d": "Govern how approved versions are released and how superseded ones are withdrawn from circulation."
      }
    ],
    "faqs": [
      {
        "q": "What is document control?",
        "a": "Document control is the systematic management of how documents are created, reviewed, approved, distributed, and retired, ensuring only authorised current versions are in use."
      },
      {
        "q": "Is document control the same as document storage?",
        "a": "No. Storage holds files; document control governs their status, ownership, and lifecycle so the right version is used at the right time."
      },
      {
        "q": "Does document control prevent unauthorised access?",
        "a": "It governs versioning and circulation, but access security is a complementary control; the two work together rather than substitute for each other."
      }
    ],
    "relatedIndustries": [
      "pharmaceuticals",
      "healthcare",
      "manufacturing",
      "regulators"
    ],
    "relatedProblems": [
      "controlled-document",
      "document-register",
      "document-status",
      "change-control"
    ],
    "diagram": "workflow",
    "metaTitle": "Document Control: Managing Records End to End",
    "metaDescription": "Document control governs how documents are created, approved, distributed, and retired so only current authorised versions are used. Learn the practice."
  },
  {
    "slug": "controlled-document",
    "term": "Controlled document",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Mark the documents that must stay authoritative",
    "lead": "Not every file needs governance — but the ones that bind the institution must be controlled.",
    "definition": "A controlled document is a document formally placed under document-control rules, meaning its version, owner, status, and distribution are managed rather than left to ad hoc copying.",
    "why": [
      "Treating every file as controlled is impractical, so institutions must designate which documents carry governing weight.",
      "A controlled designation signals to readers that the copy is maintained, current, and accountable to an owner.",
      "Mixing controlled and uncontrolled copies without labelling invites use of outdated instructions."
    ],
    "how": [
      {
        "t": "Classify on creation",
        "d": "Decide at authorship whether a document is controlled, and record that designation in the register."
      },
      {
        "t": "Mark copies clearly",
        "d": "Apply visible status and version marking so a reader can tell a controlled copy from an informational print."
      },
      {
        "t": "Tie to an owner",
        "d": "Assign each controlled document an accountable owner responsible for its currency and review."
      }
    ],
    "faqs": [
      {
        "q": "What is a controlled document?",
        "a": "A controlled document is a document formally placed under document-control rules, so its version, owner, status, and distribution are managed rather than left to ad hoc copying."
      },
      {
        "q": "How do I know if a copy is controlled?",
        "a": "Controlled copies carry explicit version and status marking and trace back to a register entry; uncontrolled prints should be labelled as such."
      },
      {
        "q": "Are all institutional documents controlled?",
        "a": "No. Institutions designate which documents carry governing weight; informational or transient material is usually left uncontrolled to keep the system manageable."
      }
    ],
    "relatedIndustries": [
      "pharmaceuticals",
      "manufacturing",
      "healthcare",
      "regulators"
    ],
    "relatedProblems": [
      "document-control",
      "document-register",
      "document-status",
      "document-owner"
    ],
    "diagram": "shield",
    "metaTitle": "Controlled Document: What It Means and Why",
    "metaDescription": "A controlled document is one under formal document-control rules for version, owner, and distribution. Learn how institutions designate and mark them."
  },
  {
    "slug": "document-register",
    "term": "Document register",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "One index that tracks every controlled document",
    "lead": "If you cannot list every governing document, you cannot claim to control them.",
    "definition": "A document register is a central index of all controlled documents, recording each document's identifier, owner, current version, status, and review schedule.",
    "why": [
      "Without a register, no one can answer how many controlled documents exist or which versions are current.",
      "Auditors use the register as the entry point to test whether stated controls are actually maintained.",
      "A complete register prevents orphaned documents that drift out of review and quietly become unreliable."
    ],
    "how": [
      {
        "t": "Capture core metadata",
        "d": "Record identifier, title, owner, current version, status, and next review date for each entry."
      },
      {
        "t": "Keep it authoritative",
        "d": "Update the register whenever status or version changes so it never lags the documents it tracks."
      },
      {
        "t": "Make it the lookup point",
        "d": "Direct users to the register to confirm currency rather than trusting local copies."
      }
    ],
    "faqs": [
      {
        "q": "What is a document register?",
        "a": "A document register is a central index of all controlled documents, recording each document's identifier, owner, current version, status, and review schedule."
      },
      {
        "q": "What should a register contain at minimum?",
        "a": "At minimum it should hold a unique identifier, title, owner, current version, status, and the next review date for every controlled document."
      },
      {
        "q": "Does a register replace the documents themselves?",
        "a": "No. It indexes and describes them; the controlled documents remain the authoritative source, with the register pointing to the current version of each."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "government",
      "manufacturing",
      "universities"
    ],
    "relatedProblems": [
      "document-control",
      "controlled-document",
      "document-numbering",
      "review-cycle"
    ],
    "diagram": "ledger",
    "metaTitle": "Document Register: The Index of Controlled Records",
    "metaDescription": "A document register centrally indexes every controlled document with owner, version, and status. See what it must capture and why auditors start there."
  },
  {
    "slug": "single-source-of-truth",
    "term": "Single source of truth",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "End conflicting copies with one governing record",
    "lead": "When three teams cite three versions of the same policy, none of them is trustworthy.",
    "definition": "A single source of truth is a designated authoritative location where the governing version of a document lives, so all copies and references defer to it rather than competing with it.",
    "why": [
      "Parallel copies diverge over time, and without one governing record, disputes over which version applies become unresolvable.",
      "Decision-makers need confidence that the document they cite is the same one the institution stands behind.",
      "A single source reduces duplicated maintenance, since updates happen once rather than across scattered copies."
    ],
    "how": [
      {
        "t": "Designate the authoritative store",
        "d": "Name one location as governing and make every other copy explicitly derivative of it."
      },
      {
        "t": "Reference, don't duplicate",
        "d": "Have downstream systems link to the source rather than embedding static copies that drift."
      },
      {
        "t": "Control write access",
        "d": "Allow changes only at the source so updates propagate from one place instead of many."
      }
    ],
    "faqs": [
      {
        "q": "What is a single source of truth?",
        "a": "A single source of truth is a designated authoritative location where the governing version of a document lives, so all copies and references defer to it."
      },
      {
        "q": "Does this mean only one copy can exist?",
        "a": "No. Copies may exist for convenience, but only the source is authoritative; copies must be identifiable as derivative and not relied on as governing."
      },
      {
        "q": "Can a single source of truth eliminate disagreement entirely?",
        "a": "It removes ambiguity about which version governs, but it does not resolve disputes about the content itself, which still require review and decision."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "government",
      "regulators",
      "central-banks"
    ],
    "relatedProblems": [
      "master-document",
      "version-control",
      "document-control",
      "document-versioning", "source-verification"],
    "diagram": "ledger",
    "metaTitle": "Single Source of Truth for Documents",
    "metaDescription": "A single source of truth designates one authoritative location for the governing document version so copies defer to it. Learn how institutions enforce it."
  },
  {
    "slug": "master-document",
    "term": "Master document",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Define the original that all copies derive from",
    "lead": "Every controlled copy needs an original it answers to — that original is the master.",
    "definition": "A master document is the authoritative original instance of a controlled document from which all approved copies and distributions are derived and against which they are validated.",
    "why": [
      "Copies are only as trustworthy as the master they descend from, so the master must be unambiguously identified.",
      "Validation of a circulating copy depends on comparison against a known master.",
      "Without a defined master, edits may be applied to derivative copies and never reach the governing original."
    ],
    "how": [
      {
        "t": "Hold the master centrally",
        "d": "Store the master in the controlled environment, not on individual workstations, so it remains the reference."
      },
      {
        "t": "Derive copies from it",
        "d": "Generate distributed copies from the master rather than from earlier copies to avoid drift."
      },
      {
        "t": "Reconcile edits upstream",
        "d": "Route any approved change back into the master so it remains the definitive version."
      }
    ],
    "faqs": [
      {
        "q": "What is a master document?",
        "a": "A master document is the authoritative original instance of a controlled document from which all approved copies are derived and against which they are validated."
      },
      {
        "q": "How does a master differ from a single source of truth?",
        "a": "The master is the original document instance; a single source of truth is the governing location where that master lives. They are closely related concepts."
      },
      {
        "q": "Can there be more than one master per document?",
        "a": "No. By definition a controlled document has one master; multiple masters would defeat the purpose of having a definitive original."
      }
    ],
    "relatedIndustries": [
      "pharmaceuticals",
      "manufacturing",
      "standards-bodies",
      "regulators"
    ],
    "relatedProblems": [
      "single-source-of-truth",
      "controlled-document",
      "document-versioning",
      "superseded-document"
    ],
    "diagram": "ledger",
    "metaTitle": "Master Document: The Authoritative Original",
    "metaDescription": "A master document is the authoritative original from which approved copies derive and against which they validate. Learn how to hold and maintain it."
  },
  {
    "slug": "revision-history",
    "term": "Revision history",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Show exactly how a document reached its state",
    "lead": "A clean final document tells you little; its revision history tells the story auditors want.",
    "definition": "Revision history is the recorded sequence of changes made to a document over time, capturing what changed, when, by whom, and under what authority.",
    "why": [
      "Reconstructing past decisions requires knowing not just the current text but how and why it evolved.",
      "Revision history supports accountability by tying each change to a person and an approval.",
      "Disputes about intent often turn on the sequence of edits, which only a complete history can supply."
    ],
    "how": [
      {
        "t": "Log every change event",
        "d": "Record the nature of each change, its timestamp, the author, and the approval that authorised it."
      },
      {
        "t": "Keep entries immutable",
        "d": "Prevent retroactive editing of history so the record of evolution stays trustworthy."
      },
      {
        "t": "Link to versions",
        "d": "Connect each history entry to the resulting version so readers can move between change and state."
      }
    ],
    "faqs": [
      {
        "q": "What is revision history?",
        "a": "Revision history is the recorded sequence of changes made to a document over time, capturing what changed, when, by whom, and under what authority."
      },
      {
        "q": "How detailed should revision history be?",
        "a": "It should be detailed enough to reconstruct each change and its authorisation; the precise granularity depends on regulatory and evidentiary needs."
      },
      {
        "q": "Is revision history the same as version control?",
        "a": "No. Version control identifies and sequences document states; revision history records the substance and authority of the changes between them."
      }
    ],
    "relatedIndustries": [
      "justice",
      "regulators",
      "financial-institutions",
      "government"
    ],
    "relatedProblems": [
      "version-control",
      "change-control",
      "redlining",
      "document-versioning"
    ],
    "diagram": "chain",
    "metaTitle": "Revision History: Tracking Document Change",
    "metaDescription": "Revision history records what changed in a document, when, by whom, and under what authority. Learn how institutions capture and protect it."
  },
  {
    "slug": "change-control",
    "term": "Change control",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Make every document change deliberate and approved",
    "lead": "Uncontrolled edits are how an approved policy quietly becomes something no one signed off on.",
    "definition": "Change control is the governed process by which proposed changes to a controlled document are requested, assessed, approved, and implemented before they take effect.",
    "why": [
      "Edits applied without review can introduce errors or conflicts that an approval step would have caught.",
      "Regulated documents must show that each change passed a defined gate rather than slipping in informally.",
      "Change control creates a defensible record that the institution governed how its documents evolved."
    ],
    "how": [
      {
        "t": "Require a change request",
        "d": "Have proposed changes raised formally, with rationale, rather than applied directly to the master."
      },
      {
        "t": "Assess before approval",
        "d": "Review the impact of a change against related documents and obligations before it is accepted."
      },
      {
        "t": "Implement under authority",
        "d": "Apply approved changes through controlled steps that update the version and the register."
      }
    ],
    "faqs": [
      {
        "q": "What is change control?",
        "a": "Change control is the governed process by which proposed changes to a controlled document are requested, assessed, approved, and implemented before they take effect."
      },
      {
        "q": "How does change control relate to version control?",
        "a": "Change control governs whether and how a change is made; version control records the resulting states. They operate together in a managed document system."
      },
      {
        "q": "Does change control slow everything down?",
        "a": "It adds defined steps, but those steps are scaled to risk; routine low-impact changes can follow lighter paths than high-impact ones."
      }
    ],
    "relatedIndustries": [
      "pharmaceuticals",
      "nuclear-regulators",
      "manufacturing",
      "regulators"
    ],
    "relatedProblems": [
      "document-control",
      "document-approval-status",
      "revision-history",
      "review-cycle"
    ],
    "diagram": "workflow",
    "metaTitle": "Change Control for Controlled Documents",
    "metaDescription": "Change control governs how proposed document changes are requested, assessed, approved, and implemented before taking effect. Learn the gated process."
  },
  {
    "slug": "document-versioning",
    "term": "Document versioning",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Name document states so currency is unmistakable",
    "lead": "Two files called final are a versioning failure waiting to mislead someone.",
    "definition": "Document versioning is the practice of assigning structured, sequential labels to successive document states so each can be uniquely identified and ordered relative to the others.",
    "why": [
      "Ad hoc labels like final or new give no reliable ordering, so readers cannot tell which state is latest.",
      "Structured versioning lets references point precisely at a state rather than an ambiguous copy.",
      "Clear version labels are the foundation auditors rely on when tracing a document's progression."
    ],
    "how": [
      {
        "t": "Adopt a labelling scheme",
        "d": "Use a consistent scheme such as major and minor increments so progression and significance are legible."
      },
      {
        "t": "Increment on issue",
        "d": "Advance the version label whenever a new state is approved and released, not on every draft save."
      },
      {
        "t": "Display the label",
        "d": "Surface the version on the document itself so any reader can confirm which state they hold."
      }
    ],
    "faqs": [
      {
        "q": "What is document versioning?",
        "a": "Document versioning is the practice of assigning structured, sequential labels to successive document states so each can be uniquely identified and ordered."
      },
      {
        "q": "Should drafts get version numbers too?",
        "a": "Schemes often distinguish draft from issued states, for example using minor increments for drafts and major increments at approval, but conventions vary."
      },
      {
        "q": "Does versioning by itself keep documents accurate?",
        "a": "No. It identifies and orders states clearly, but accuracy still depends on review and change control applied to the content."
      }
    ],
    "relatedIndustries": [
      "manufacturing",
      "standards-bodies",
      "universities",
      "regulators"
    ],
    "relatedProblems": [
      "version-control",
      "document-numbering",
      "revision-history",
      "single-source-of-truth"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Document Versioning: Labelling States Clearly",
    "metaDescription": "Document versioning assigns structured sequential labels to document states so each is uniquely identified and ordered. Learn schemes that prevent confusion."
  },
  {
    "slug": "superseded-document",
    "term": "Superseded document",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Retire old versions without losing the record",
    "lead": "A replaced version should stop governing the present but still explain the past.",
    "definition": "A superseded document is a version that has been replaced by a newer approved version and is no longer authoritative for current use, while remaining retained for historical reference.",
    "why": [
      "If superseded versions stay in circulation as if current, users may act on outdated instructions.",
      "Yet discarding them entirely destroys the record needed to explain prior decisions.",
      "Clear superseded status lets institutions retire versions safely while preserving lineage."
    ],
    "how": [
      {
        "t": "Mark on replacement",
        "d": "When a new version is approved, immediately flag the prior one as superseded in the register."
      },
      {
        "t": "Withdraw from active use",
        "d": "Remove superseded versions from points of use so the current version is the one encountered."
      },
      {
        "t": "Retain for reference",
        "d": "Keep superseded versions in a controlled archive so historical states remain reconstructable."
      }
    ],
    "faqs": [
      {
        "q": "What is a superseded document?",
        "a": "A superseded document is a version replaced by a newer approved version, no longer authoritative for current use but retained for historical reference."
      },
      {
        "q": "Should superseded documents be deleted?",
        "a": "Usually not. They are withdrawn from active use but retained in a controlled archive so earlier decisions remain explainable and auditable."
      },
      {
        "q": "How is superseded different from obsolete?",
        "a": "Superseded means replaced by a newer version; obsolete means no longer in use at all, whether or not a replacement exists."
      }
    ],
    "relatedIndustries": [
      "pharmaceuticals",
      "regulators",
      "archives",
      "manufacturing"
    ],
    "relatedProblems": [
      "obsolete-document",
      "document-status",
      "master-document",
      "version-control"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Superseded Document: Retiring Old Versions",
    "metaDescription": "A superseded document is a replaced version, no longer authoritative but retained for reference. Learn how to mark, withdraw, and archive it safely."
  },
  {
    "slug": "document-hierarchy",
    "term": "Document hierarchy",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Order documents so authority flows top down",
    "lead": "A procedure that contradicts the policy above it is a hierarchy problem, not a wording one.",
    "definition": "A document hierarchy is the structured ranking of an institution's controlled documents by authority and scope, so higher-level documents govern and constrain those beneath them.",
    "why": [
      "Without a defined hierarchy, lower-level documents can conflict with the policies they should implement.",
      "A clear hierarchy tells readers which document prevails when two appear to disagree.",
      "Structuring documents by level makes change impact easier to trace from policy down to procedure."
    ],
    "how": [
      {
        "t": "Define the levels",
        "d": "Establish tiers such as policy, standard, procedure, and record, with clear authority at each level."
      },
      {
        "t": "Map each document",
        "d": "Place every controlled document at its correct tier so its scope and authority are explicit."
      },
      {
        "t": "Enforce precedence",
        "d": "Resolve conflicts in favour of the higher tier and align lower documents accordingly."
      }
    ],
    "faqs": [
      {
        "q": "What is a document hierarchy?",
        "a": "A document hierarchy is the structured ranking of controlled documents by authority and scope, so higher-level documents govern and constrain those beneath them."
      },
      {
        "q": "Why does hierarchy matter for control?",
        "a": "It establishes precedence, so when documents appear to conflict, readers know which governs, and changes can be traced through dependent tiers."
      },
      {
        "q": "Is a document hierarchy the same as a folder structure?",
        "a": "No. Folders organise storage; a hierarchy ranks authority. A document can sit anywhere in storage yet hold a specific level of governing weight."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "standards-bodies",
      "defence"
    ],
    "relatedProblems": [
      "document-control",
      "document-register",
      "document-numbering",
      "single-source-of-truth"
    ],
    "diagram": "chain",
    "metaTitle": "Document Hierarchy: Ordering Authority",
    "metaDescription": "A document hierarchy ranks controlled documents by authority so higher-level documents govern lower ones. Learn how to define tiers and enforce precedence."
  },
  {
    "slug": "document-numbering",
    "term": "Document numbering",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Give every document a unique, durable identifier",
    "lead": "You cannot reliably reference a document that lacks a stable, unique number.",
    "definition": "Document numbering is the practice of assigning each controlled document a unique, persistent identifier that distinguishes it from all others and supports unambiguous reference.",
    "why": [
      "Titles change and duplicate, so referencing by title alone leads to confusion and misidentification.",
      "A stable identifier lets other documents and systems cite a document without ambiguity.",
      "Consistent numbering supports the register and makes the body of documents searchable and auditable."
    ],
    "how": [
      {
        "t": "Design a numbering scheme",
        "d": "Define a structure that encodes useful attributes such as type or owning function while staying unique."
      },
      {
        "t": "Assign at registration",
        "d": "Issue the identifier when the document enters the register so it is governed from creation."
      },
      {
        "t": "Keep numbers persistent",
        "d": "Retain the identifier across versions so references remain valid even as the content evolves."
      }
    ],
    "faqs": [
      {
        "q": "What is document numbering?",
        "a": "Document numbering is the practice of assigning each controlled document a unique, persistent identifier that distinguishes it from all others and supports unambiguous reference."
      },
      {
        "q": "Should the number change when the document is revised?",
        "a": "Generally no. The identifier persists across versions while the version label changes, so references to the document remain stable."
      },
      {
        "q": "Can a numbering scheme encode meaning?",
        "a": "It can encode attributes such as type or owning function, but schemes should avoid embedding details likely to change, which would force renumbering."
      }
    ],
    "relatedIndustries": [
      "manufacturing",
      "standards-bodies",
      "regulators",
      "government"
    ],
    "relatedProblems": [
      "document-register",
      "document-versioning",
      "document-hierarchy",
      "controlled-document"
    ],
    "diagram": "ledger",
    "metaTitle": "Document Numbering: Unique Identifiers",
    "metaDescription": "Document numbering assigns each controlled document a unique persistent identifier for unambiguous reference. Learn how to design and apply a scheme."
  },
  {
    "slug": "document-status",
    "term": "Document status",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Tell readers instantly whether a document governs",
    "lead": "Draft, approved, or withdrawn — status is the first thing a reader must be able to trust.",
    "definition": "Document status is the recorded state of a controlled document within its lifecycle, such as draft, under review, approved, superseded, or obsolete, indicating how it may be relied upon.",
    "why": [
      "A reader needs to know whether a document is authoritative before acting on it.",
      "Status distinguishes a working draft from an approved instruction, preventing premature reliance.",
      "Tracking status across the lifecycle lets the institution manage documents as they move and retire."
    ],
    "how": [
      {
        "t": "Define a status set",
        "d": "Establish a clear, limited set of statuses covering the document lifecycle from draft to obsolete."
      },
      {
        "t": "Display status prominently",
        "d": "Surface the current status on the document and in the register so reliance is informed."
      },
      {
        "t": "Transition under control",
        "d": "Change status only through defined steps, such as approval, so the state always reflects reality."
      }
    ],
    "faqs": [
      {
        "q": "What is document status?",
        "a": "Document status is the recorded state of a controlled document within its lifecycle, such as draft, under review, approved, superseded, or obsolete, indicating how it may be relied upon."
      },
      {
        "q": "Why display status on the document itself?",
        "a": "Because readers may encounter a copy outside the register; visible status lets them judge reliability without separate lookup, reducing misuse."
      },
      {
        "q": "Who changes a document's status?",
        "a": "Status transitions follow defined steps, typically driven by the owner and approval roles, so the recorded state always reflects an authorised decision."
      }
    ],
    "relatedIndustries": [
      "pharmaceuticals",
      "healthcare",
      "regulators",
      "manufacturing"
    ],
    "relatedProblems": [
      "document-approval-status",
      "document-control",
      "obsolete-document",
      "effective-date"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Document Status: Signalling Reliability",
    "metaDescription": "Document status records where a controlled document sits in its lifecycle, from draft to obsolete, signalling how it may be relied on. Learn to manage it."
  },
  {
    "slug": "effective-date",
    "term": "Effective date",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Pin exactly when a document begins to govern",
    "lead": "Approval and effect are not the same moment — and conflating them creates gaps.",
    "definition": "An effective date is the specified date on which an approved document version becomes operative and authoritative, governing actions taken from that point forward.",
    "why": [
      "Approval may precede the date a document is meant to take effect, so the two must be recorded separately.",
      "An explicit effective date resolves which version governs an action by reference to when it occurred.",
      "Clear effective dating prevents gaps or overlaps when one version replaces another."
    ],
    "how": [
      {
        "t": "Record approval and effect",
        "d": "Capture both when a version was approved and the date it becomes operative, as distinct fields."
      },
      {
        "t": "Sequence transitions",
        "d": "Align the effective date of a new version with the retirement of the prior one to avoid gaps."
      },
      {
        "t": "Surface the date",
        "d": "Display the effective date so readers can judge which version applied at a given time."
      }
    ],
    "faqs": [
      {
        "q": "What is an effective date?",
        "a": "An effective date is the specified date on which an approved document version becomes operative and authoritative, governing actions taken from that point forward."
      },
      {
        "q": "How does an effective date differ from an approval date?",
        "a": "Approval marks when a version was authorised; the effective date marks when it begins to govern. The effective date can be later than approval."
      },
      {
        "q": "Why track effective dates at all?",
        "a": "Because determining which version governed a past action depends on knowing when each version took effect, which is essential for audit and dispute resolution."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "financial-institutions",
      "government",
      "central-banks"
    ],
    "relatedProblems": [
      "document-status",
      "superseded-document",
      "document-approval-status",
      "version-control"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Effective Date: When a Document Governs",
    "metaDescription": "An effective date is when an approved document version becomes operative and authoritative. Learn why it is distinct from approval and how to track it."
  },
  {
    "slug": "document-owner",
    "term": "Document owner",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Assign one person accountable for each document",
    "lead": "A document with no owner is a document no one keeps current.",
    "definition": "A document owner is the named role or individual accountable for a controlled document's accuracy, currency, review, and lifecycle decisions throughout its existence.",
    "why": [
      "Without an accountable owner, documents drift out of date because no one is responsible for reviewing them.",
      "Ownership gives a clear point of contact for questions, changes, and approvals.",
      "Auditors look for named accountability to confirm that control is real rather than nominal."
    ],
    "how": [
      {
        "t": "Name an owner per document",
        "d": "Assign each controlled document a specific owner role and record it in the register."
      },
      {
        "t": "Define owner duties",
        "d": "Make clear that the owner is responsible for currency, review scheduling, and change decisions."
      },
      {
        "t": "Reassign on change",
        "d": "Update ownership promptly when roles change so accountability never lapses."
      }
    ],
    "faqs": [
      {
        "q": "What is a document owner?",
        "a": "A document owner is the named role or individual accountable for a controlled document's accuracy, currency, review, and lifecycle decisions throughout its existence."
      },
      {
        "q": "Should ownership be a person or a role?",
        "a": "Assigning ownership to a role rather than an individual is often more durable, since responsibility persists even as the people in the role change."
      },
      {
        "q": "Does the owner make every change personally?",
        "a": "Not necessarily. The owner is accountable for the document's currency and approvals; others may author changes that the owner reviews and authorises."
      }
    ],
    "relatedIndustries": [
      "government",
      "healthcare",
      "universities",
      "regulators"
    ],
    "relatedProblems": [
      "document-control",
      "controlled-document",
      "review-cycle",
      "document-register"
    ],
    "diagram": "shield",
    "metaTitle": "Document Owner: Accountability for Records",
    "metaDescription": "A document owner is the named role accountable for a controlled document's accuracy, currency, and review. Learn how ownership keeps documents reliable."
  },
  {
    "slug": "review-cycle",
    "term": "Review cycle",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Schedule documents to be checked before they decay",
    "lead": "A policy that is never revisited slowly stops describing how things actually work.",
    "definition": "A review cycle is the scheduled, recurring process by which a controlled document is re-examined for continued accuracy and relevance, and either reaffirmed or revised.",
    "why": [
      "Documents that are never revisited drift from current practice, regulation, or intent.",
      "A defined cycle ensures review happens by schedule rather than only when a problem surfaces.",
      "Recording review dates demonstrates that the institution actively maintains its documents."
    ],
    "how": [
      {
        "t": "Set review intervals",
        "d": "Assign each document a review frequency proportionate to its risk and rate of change."
      },
      {
        "t": "Track due dates",
        "d": "Hold next-review dates in the register and prompt owners as reviews approach."
      },
      {
        "t": "Record the outcome",
        "d": "Capture whether each review reaffirmed or revised the document, with the date and reviewer."
      }
    ],
    "faqs": [
      {
        "q": "What is a review cycle?",
        "a": "A review cycle is the scheduled, recurring process by which a controlled document is re-examined for continued accuracy and relevance, and either reaffirmed or revised."
      },
      {
        "q": "How often should documents be reviewed?",
        "a": "Frequency should reflect each document's risk and rate of change; high-impact documents warrant shorter cycles than stable, low-risk ones."
      },
      {
        "q": "What if a review finds no change is needed?",
        "a": "The document is reaffirmed and the review is recorded with its date, which itself evidences that the document remains current and maintained."
      }
    ],
    "relatedIndustries": [
      "healthcare",
      "pharmaceuticals",
      "regulators",
      "universities"
    ],
    "relatedProblems": [
      "document-owner",
      "change-control",
      "document-status",
      "effective-date"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Review Cycle: Keeping Documents Current",
    "metaDescription": "A review cycle re-examines a controlled document on schedule for accuracy and relevance, then reaffirms or revises it. Learn how to set and track cycles."
  },
  {
    "slug": "redlining",
    "term": "Redlining",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Make proposed edits visible before they are accepted",
    "lead": "Negotiating a document is easier when every proposed change is shown, not hidden.",
    "definition": "Redlining is the practice of marking proposed additions, deletions, and edits visibly against a document so reviewers can see and decide on each change before it is accepted.",
    "why": [
      "Silent edits make it hard to know what actually changed between two versions of a document.",
      "Visible markup lets reviewers evaluate each proposed change deliberately rather than accepting them in bulk.",
      "Redlines create a clear record of what was negotiated, which supports later reconstruction of intent."
    ],
    "how": [
      {
        "t": "Mark changes visibly",
        "d": "Show insertions and deletions distinctly against the baseline so each is individually reviewable."
      },
      {
        "t": "Attribute proposals",
        "d": "Associate each marked change with who proposed it so review can weigh source and rationale."
      },
      {
        "t": "Resolve before issue",
        "d": "Accept or reject each redline through review so the issued version reflects deliberate decisions."
      }
    ],
    "faqs": [
      {
        "q": "What is redlining?",
        "a": "Redlining is the practice of marking proposed additions, deletions, and edits visibly against a document so reviewers can see and decide on each change before it is accepted."
      },
      {
        "q": "How does redlining relate to revision history?",
        "a": "Redlining shows proposed changes during review; revision history records accepted changes after the fact. Redlines often feed the eventual history entry."
      },
      {
        "q": "Is redlining only for legal documents?",
        "a": "No. It originated in contract negotiation but applies wherever proposed document changes benefit from visible, reviewable markup before acceptance."
      }
    ],
    "relatedIndustries": [
      "justice",
      "financial-institutions",
      "regulators",
      "intellectual-property"
    ],
    "relatedProblems": [
      "change-control",
      "revision-history",
      "document-approval-status",
      "version-control"
    ],
    "diagram": "workflow",
    "metaTitle": "Redlining: Visible Document Markup",
    "metaDescription": "Redlining marks proposed additions, deletions, and edits visibly so reviewers decide on each before acceptance. Learn how it fits document control."
  },
  {
    "slug": "document-approval-status",
    "term": "Document approval status",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Show whether a document has cleared its sign-off",
    "lead": "Before anyone relies on a document, they must know it actually passed approval.",
    "definition": "Document approval status is the recorded indication of whether a document version has completed its required approvals, distinguishing authorised versions from those still pending or rejected.",
    "why": [
      "Acting on an unapproved version exposes the institution to using content that was never authorised.",
      "Approval status separates a finished draft from a version that has genuinely cleared sign-off.",
      "A recorded approval status provides the evidence that required authorisations actually occurred."
    ],
    "how": [
      {
        "t": "Capture approval outcomes",
        "d": "Record whether each required approval was granted, pending, or rejected for the version."
      },
      {
        "t": "Gate release on approval",
        "d": "Allow a version to become effective only once its approval status is fully granted."
      },
      {
        "t": "Display the status",
        "d": "Surface approval status alongside the version so reliance is based on confirmed authorisation."
      }
    ],
    "faqs": [
      {
        "q": "What is document approval status?",
        "a": "Document approval status is the recorded indication of whether a document version has completed its required approvals, distinguishing authorised versions from those still pending or rejected."
      },
      {
        "q": "How is approval status different from document status?",
        "a": "Document status spans the whole lifecycle; approval status focuses specifically on whether required sign-offs are complete for a given version."
      },
      {
        "q": "Does approval status prove who approved a version?",
        "a": "It records that approvals were completed; tying status to identified approvers and timestamps is what makes it evidentially useful for audit."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "regulators",
      "government",
      "pharmaceuticals"
    ],
    "relatedProblems": [
      "document-status",
      "change-control",
      "effective-date",
      "redlining"
    ],
    "diagram": "workflow",
    "metaTitle": "Document Approval Status Explained",
    "metaDescription": "Document approval status records whether a version has cleared required approvals, separating authorised versions from pending or rejected ones. Learn more."
  },
  {
    "slug": "obsolete-document",
    "term": "Obsolete document",
    "category": "Operations & workflow",
    "kicker": "Document control & version management",
    "headline": "Withdraw documents that should no longer be used",
    "lead": "A document past its usefulness is a liability until it is clearly marked out of use.",
    "definition": "An obsolete document is a controlled document declared no longer valid for use, whether or not it has a replacement, and withdrawn from active circulation while retained as record.",
    "why": [
      "If obsolete documents remain accessible as if current, users may follow instructions that no longer apply.",
      "Declaring obsolescence formally removes ambiguity about whether a document still carries authority.",
      "Retaining obsolete documents as record preserves the history that explains why they were withdrawn."
    ],
    "how": [
      {
        "t": "Declare obsolescence",
        "d": "Formally record that a document is no longer valid for use, with the date and authority for the decision."
      },
      {
        "t": "Withdraw from use",
        "d": "Remove obsolete documents from points of use and mark any retained copies clearly as obsolete."
      },
      {
        "t": "Retain as record",
        "d": "Keep obsolete documents in a controlled archive so the historical record stays intact."
      }
    ],
    "faqs": [
      {
        "q": "What is an obsolete document?",
        "a": "An obsolete document is a controlled document declared no longer valid for use, whether or not it has a replacement, and withdrawn from circulation while retained as record."
      },
      {
        "q": "How does obsolete differ from superseded?",
        "a": "A superseded document has been replaced by a newer version; an obsolete document is no longer in use at all, which may or may not involve a replacement."
      },
      {
        "q": "Should obsolete documents be destroyed?",
        "a": "Usually they are withdrawn from use but retained under retention rules, since the historical record may be needed for audit or to explain past decisions."
      }
    ],
    "relatedIndustries": [
      "pharmaceuticals",
      "manufacturing",
      "archives",
      "regulators"
    ],
    "relatedProblems": [
      "superseded-document",
      "document-status",
      "document-control",
      "review-cycle"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Obsolete Document: Withdrawing From Use",
    "metaDescription": "An obsolete document is declared no longer valid for use and withdrawn from circulation while retained as record. Learn how to declare and manage it."
  },
  {
    "slug": "policy-document",
    "term": "Policy document",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Govern policy documents people can trust",
    "lead": "A policy document sets out an institution's settled position and the rules people must follow. Its authority depends on showing it was approved, published, and left unaltered.",
    "definition": "A policy document is an officially adopted instrument that states an organisation's binding position, principles, or rules on a defined subject and the obligations that flow from them.",
    "why": [
      "Readers act on policy as if it were authoritative, so an unverified or stale copy can expose the institution to legal and operational risk.",
      "Policies are revised frequently, making it easy for superseded versions to keep circulating long after they were withdrawn.",
      "Disputes often turn on what the policy said and who approved it on a specific date, which an undocumented file cannot answer."
    ],
    "how": [
      {
        "t": "Record the approval",
        "d": "Capture who adopted the policy, under what authority, and on what date so the mandate behind it is explicit and reviewable."
      },
      {
        "t": "Seal the published version",
        "d": "Bind each released version to a cryptographic fingerprint so any later alteration is detectable and the canonical text is unambiguous."
      },
      {
        "t": "Govern supersession",
        "d": "Mark prior versions as withdrawn and link forward to the current text so readers always reach the version in force."
      }
    ],
    "faqs": [
      {
        "q": "What is a policy document?",
        "a": "A policy document is an officially adopted instrument that states an organisation's binding position, principles, or rules on a defined subject and the obligations that flow from them."
      },
      {
        "q": "How is a policy document different from guidance?",
        "a": "A policy sets mandatory positions and obligations, whereas guidance explains how to apply them. Policies are typically adopted by a defined authority and carry direct compliance weight."
      },
      {
        "q": "How can readers confirm a policy is current?",
        "a": "By verifying it against a governed register that records the approving authority, version, effective date, and supersession status, so withdrawn text is clearly distinguished from the version in force."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "universities",
      "healthcare"
    ],
    "relatedProblems": [
      "official-publication",
      "document-governance",
      "policy-approval-workflow",
      "publication-audit"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Policy Document: Definition, Approval & Governance",
    "metaDescription": "What a policy document is, why version control and approval matter, and how to govern and verify the authoritative text people rely on."
  },
  {
    "slug": "standard-operating-procedure",
    "term": "Standard operating procedure",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Keep operating procedures verifiable and current",
    "lead": "A standard operating procedure defines the controlled steps a task must follow. When lives, safety, or compliance depend on it, staff need certainty they hold the approved version.",
    "definition": "A standard operating procedure is a formally approved instrument that prescribes the exact, repeatable steps personnel must follow to perform a defined task consistently and safely.",
    "why": [
      "Operational safety and audit findings depend on staff executing the approved steps, not an outdated or unofficial copy.",
      "Procedures change as equipment, regulation, or risk evolves, so an uncontrolled SOP quickly drifts out of compliance.",
      "Inspectors and investigators ask which procedure was in force at the time of an incident, a question only governed records can settle."
    ],
    "how": [
      {
        "t": "Define the controlled steps",
        "d": "Set out each step, responsible role, and acceptance criteria so the procedure is unambiguous and repeatable across teams."
      },
      {
        "t": "Authorise before release",
        "d": "Route the SOP through a recorded approval so its issue is traceable to an accountable owner and effective date."
      },
      {
        "t": "Verify at point of use",
        "d": "Let staff confirm a copy against the sealed master so floor-level use never relies on a printout of uncertain provenance."
      }
    ],
    "faqs": [
      {
        "q": "What is a standard operating procedure?",
        "a": "A standard operating procedure is a formally approved instrument that prescribes the exact, repeatable steps personnel must follow to perform a defined task consistently and safely."
      },
      {
        "q": "Why must SOPs be version-controlled?",
        "a": "Because procedures change with equipment, regulation, and risk. Uncontrolled copies let superseded steps stay in use, which undermines safety and creates audit exposure."
      },
      {
        "q": "How do staff know an SOP is the approved version?",
        "a": "They verify the document against a governed master that records the approving owner, version, and effective date, so the controlled copy is distinguishable from any informal one."
      }
    ],
    "relatedIndustries": [
      "healthcare",
      "pharmaceuticals",
      "manufacturing",
      "nuclear-regulators"
    ],
    "relatedProblems": [
      "document-governance",
      "publication-audit",
      "document-verification",
      "official-publication"
    ],
    "diagram": "workflow",
    "metaTitle": "Standard Operating Procedure: Definition & Control",
    "metaDescription": "What an SOP is, why controlled versions matter for safety and audit, and how to approve, seal, and verify the procedure in force."
  },
  {
    "slug": "directive",
    "term": "Directive",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Issue directives with provable authority",
    "lead": "A directive instructs named parties to act and binds them to a result. Recipients must be able to confirm it genuinely came from the issuing authority.",
    "definition": "A directive is an authoritative instrument issued by a competent body that obliges identified recipients to achieve a specified outcome or take a required action.",
    "why": [
      "Recipients are expected to comply, so a forged or altered directive can compel wrongful action with serious consequences.",
      "Directives often set deadlines and conditions, making the precise wording and issue date legally significant.",
      "Authority to issue a directive is limited, so its provenance and signing chain must be demonstrable, not assumed."
    ],
    "how": [
      {
        "t": "Establish the mandate",
        "d": "Record the legal or delegated authority under which the directive is issued so its binding force can be traced."
      },
      {
        "t": "Seal and attribute",
        "d": "Bind the directive to the issuing office with a cryptographic seal so recipients can confirm origin and integrity."
      },
      {
        "t": "Track acknowledgement",
        "d": "Log distribution and receipt so the institution can show who was served and when the obligation took effect."
      }
    ],
    "faqs": [
      {
        "q": "What is a directive?",
        "a": "A directive is an authoritative instrument issued by a competent body that obliges identified recipients to achieve a specified outcome or take a required action."
      },
      {
        "q": "How does a directive differ from guidance?",
        "a": "A directive is binding and compels action by named parties, while guidance advises without obligation. A directive's force depends on the issuer's authority to give it."
      },
      {
        "q": "How can a recipient verify a directive is genuine?",
        "a": "By checking its cryptographic seal and the recorded issuing authority against a governed register, confirming both origin and that the text has not been altered."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "defence",
      "central-banks"
    ],
    "relatedProblems": [
      "official-publication",
      "document-authenticity",
      "document-verification",
      "regulatory-publication"
    ],
    "diagram": "seal",
    "metaTitle": "Directive: Definition, Authority & Verification",
    "metaDescription": "What a directive is, why its authority and wording matter, and how recipients verify origin, integrity, and the obligation it imposes."
  },
  {
    "slug": "circular-letter",
    "term": "Circular letter",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Distribute circulars without losing authenticity",
    "lead": "A circular letter communicates the same official instruction or notice to many recipients at once. At scale, each copy must remain provably authentic and unaltered.",
    "definition": "A circular letter is an official communication issued in identical form to a defined group of recipients to convey instructions, clarifications, or notices from an issuing authority.",
    "why": [
      "Circulars reach wide audiences quickly, so a tampered copy can spread incorrect instructions across an entire network.",
      "Numbering and dates carry meaning, and gaps or duplicates undermine confidence in the official record.",
      "Recipients frequently forward circulars onward, making integrity hard to preserve without a verifiable original."
    ],
    "how": [
      {
        "t": "Assign a registered number",
        "d": "Issue each circular under a sequential reference so the series is complete and each notice is individually identifiable."
      },
      {
        "t": "Seal the canonical copy",
        "d": "Fix the authoritative text with a cryptographic fingerprint so every distributed copy can be checked against it."
      },
      {
        "t": "Publish a verifiable register",
        "d": "Maintain an accessible index of issued circulars so recipients can confirm a given number, date, and status."
      }
    ],
    "faqs": [
      {
        "q": "What is a circular letter?",
        "a": "A circular letter is an official communication issued in identical form to a defined group of recipients to convey instructions, clarifications, or notices from an issuing authority."
      },
      {
        "q": "Why are circulars numbered?",
        "a": "Sequential numbering lets recipients confirm the series is complete and reference a specific circular precisely, which also exposes missing or duplicated notices."
      },
      {
        "q": "How is the authenticity of a circular preserved when it is forwarded?",
        "a": "By sealing the canonical text and publishing it in a verifiable register, so any forwarded copy can be matched against the issuing authority's original."
      }
    ],
    "relatedIndustries": [
      "government",
      "central-banks",
      "tax-authorities",
      "regulators"
    ],
    "relatedProblems": [
      "official-publication",
      "document-authenticity",
      "regulatory-publication",
      "publication-audit"
    ],
    "diagram": "ledger",
    "metaTitle": "Circular Letter: Definition & Authentic Distribution",
    "metaDescription": "What a circular letter is, why numbering and integrity matter, and how to seal and register notices issued to many recipients at once."
  },
  {
    "slug": "memorandum-of-decision",
    "term": "Memorandum of decision",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Record decisions that withstand later scrutiny",
    "lead": "A memorandum of decision captures what was decided, by whom, and on what basis. Its value lies in being a fixed, tamper-evident record of that moment.",
    "definition": "A memorandum of decision is an official instrument that records a determination reached by an authorised body or officer, together with the reasons and authority underpinning it.",
    "why": [
      "Decisions are challenged after the fact, so a contemporaneous, unalterable record is the institution's primary defence.",
      "The reasoning behind a decision matters as much as the outcome when its lawfulness is later examined.",
      "Without sealing, a memorandum can be quietly revised, casting doubt on whether the record reflects the original decision."
    ],
    "how": [
      {
        "t": "Capture decision and basis",
        "d": "Record the decision, the deciding authority, the date, and the reasons relied upon so the rationale is preserved."
      },
      {
        "t": "Seal at the moment of record",
        "d": "Fingerprint the memorandum when finalised so its contents are fixed and any later change is evident."
      },
      {
        "t": "Preserve in an audit chain",
        "d": "Store the sealed record in a tamper-evident chain so its existence and timing can be independently confirmed."
      }
    ],
    "faqs": [
      {
        "q": "What is a memorandum of decision?",
        "a": "A memorandum of decision is an official instrument that records a determination reached by an authorised body or officer, together with the reasons and authority underpinning it."
      },
      {
        "q": "Why record the reasons, not just the outcome?",
        "a": "Because the lawfulness and fairness of a decision often depend on the reasoning. A record of the basis lets reviewers test whether the decision was properly made."
      },
      {
        "q": "How does sealing protect a memorandum of decision?",
        "a": "Sealing fixes the contents with a cryptographic fingerprint at the time of record, so any later alteration is detectable and the original decision remains provable."
      }
    ],
    "relatedIndustries": [
      "justice",
      "government",
      "regulators",
      "ombudsman-offices"
    ],
    "relatedProblems": [
      "board-resolution-software",
      "evidence-chain",
      "document-governance",
      "institutional-records"
    ],
    "diagram": "chain",
    "metaTitle": "Memorandum of Decision: Definition & Record-Keeping",
    "metaDescription": "What a memorandum of decision is, why recording the reasons matters, and how to seal and preserve a defensible record of the determination."
  },
  {
    "slug": "determination",
    "term": "Determination",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Publish determinations parties can rely on",
    "lead": "A determination is a binding finding made by an authorised body on a contested or factual question. Parties act on it, so its authenticity and finality must be clear.",
    "definition": "A determination is an official instrument recording a binding finding or conclusion reached by an authorised body on a specific question, often after a defined assessment or process.",
    "why": [
      "A determination changes parties' rights or obligations, so reliance on a false copy can cause real legal harm.",
      "Determinations may be subject to appeal windows, making the issue date and finality status critical to verify.",
      "Because they resolve disputes, determinations are prime targets for forgery or selective alteration."
    ],
    "how": [
      {
        "t": "Tie to the deciding authority",
        "d": "Record the body, its jurisdiction, and the process followed so the determination's authority is demonstrable."
      },
      {
        "t": "Seal the issued finding",
        "d": "Bind the final text to a cryptographic seal so its integrity and origin can be independently verified."
      },
      {
        "t": "Publish status and dates",
        "d": "Show the issue date and finality or appeal status so parties know whether the determination is settled."
      }
    ],
    "faqs": [
      {
        "q": "What is a determination?",
        "a": "A determination is an official instrument recording a binding finding or conclusion reached by an authorised body on a specific question, often after a defined assessment or process."
      },
      {
        "q": "How does a determination differ from a ruling?",
        "a": "The terms overlap, but a determination typically resolves a factual or eligibility question through assessment, while a ruling commonly interprets law or rules applied to a case."
      },
      {
        "q": "How can a party confirm a determination is authentic and final?",
        "a": "By verifying its seal and issuing authority in a governed register, and checking the recorded issue date and appeal or finality status."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "tax-authorities",
      "social-security",
      "competition-authorities"
    ],
    "relatedProblems": [
      "legal-publication",
      "document-authenticity",
      "evidence-chain",
      "regulatory-publication"
    ],
    "diagram": "seal",
    "metaTitle": "Determination: Definition, Finality & Verification",
    "metaDescription": "What a determination is, why finality and issue dates matter, and how parties verify the authenticity of a binding official finding."
  },
  {
    "slug": "ruling",
    "term": "Ruling",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Make rulings verifiable and citable",
    "lead": "A ruling states how law or rules apply to a question, and others rely on it as authority. Its text and provenance must be beyond doubt to be safely cited.",
    "definition": "A ruling is an official instrument in which an authorised body interprets and applies law, regulation, or rules to a specific question, producing an authoritative and citable conclusion.",
    "why": [
      "Rulings are cited as precedent or guidance, so an altered version can propagate an incorrect interpretation widely.",
      "The precise wording of a ruling governs its scope, making textual integrity essential to correct reliance.",
      "Rulings can be revised, clarified, or overturned, so their current status must be ascertainable."
    ],
    "how": [
      {
        "t": "Record issuing authority",
        "d": "Capture the body, its competence, and the question decided so the ruling's standing is clear when cited."
      },
      {
        "t": "Seal the authoritative text",
        "d": "Fix the ruling with a cryptographic fingerprint so citations reference an unaltered, verifiable original."
      },
      {
        "t": "Maintain status linkage",
        "d": "Link each ruling to any clarification, revision, or reversal so users can see whether it still stands."
      }
    ],
    "faqs": [
      {
        "q": "What is a ruling?",
        "a": "A ruling is an official instrument in which an authorised body interprets and applies law, regulation, or rules to a specific question, producing an authoritative and citable conclusion."
      },
      {
        "q": "Why does the exact wording of a ruling matter?",
        "a": "Because the wording defines the ruling's scope and reach. Even small alterations can change how it is applied, so textual integrity is essential to safe reliance."
      },
      {
        "q": "How can someone confirm a ruling is current?",
        "a": "By checking a governed register that records the ruling's seal, issuing authority, and any later clarification, revision, or reversal affecting its status."
      }
    ],
    "relatedIndustries": [
      "justice",
      "tax-authorities",
      "securities-regulators",
      "customs-border"
    ],
    "relatedProblems": [
      "legal-publication",
      "document-authenticity",
      "official-publication",
      "document-verification"
    ],
    "diagram": "seal",
    "metaTitle": "Ruling: Definition, Citation & Integrity",
    "metaDescription": "What a ruling is, why exact wording and current status matter, and how to seal and verify an authoritative, citable interpretation."
  },
  {
    "slug": "order",
    "term": "Order",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Serve orders with demonstrable validity",
    "lead": "An order commands a party to act or refrain, often with immediate effect. Enforcement depends on proving the order was validly issued and properly served.",
    "definition": "An order is an authoritative instrument issued by a competent body that commands a named party to do or refrain from a specified act, typically with binding and enforceable effect.",
    "why": [
      "Orders carry coercive force, so their validity must be provable before any enforcement step is taken.",
      "Service and timing determine when an order bites, making a verifiable record of issue and delivery essential.",
      "A forged or altered order can wrongfully compel or restrain conduct, exposing institutions to liability."
    ],
    "how": [
      {
        "t": "Document issuing power",
        "d": "Record the authority, the case or matter, and the act commanded so the order's legal basis is explicit."
      },
      {
        "t": "Seal and serve",
        "d": "Bind the order with a cryptographic seal and record service so origin, integrity, and delivery are all provable."
      },
      {
        "t": "Track effect and discharge",
        "d": "Log when the order takes effect and when it is varied or discharged so its current force is unambiguous."
      }
    ],
    "faqs": [
      {
        "q": "What is an order?",
        "a": "An order is an authoritative instrument issued by a competent body that commands a named party to do or refrain from a specified act, typically with binding and enforceable effect."
      },
      {
        "q": "Why is proof of service important for an order?",
        "a": "Because an order's obligations usually take effect on proper service. A verifiable record of when and how it was served is often required before enforcement."
      },
      {
        "q": "How is the validity of an order verified?",
        "a": "By confirming its cryptographic seal, the issuing authority, and the recorded service details against a governed register, establishing origin, integrity, and effect."
      }
    ],
    "relatedIndustries": [
      "justice",
      "law-enforcement",
      "regulators",
      "competition-authorities"
    ],
    "relatedProblems": [
      "legal-publication",
      "document-authenticity",
      "evidence-chain",
      "document-verification"
    ],
    "diagram": "chain",
    "metaTitle": "Order: Definition, Validity & Service",
    "metaDescription": "What an order is, why validity and service must be provable, and how to seal, serve, and track an enforceable official command."
  },
  {
    "slug": "by-law",
    "term": "By-law",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Keep by-laws authoritative and accessible",
    "lead": "A by-law is a rule made under delegated power to govern a body or locality. The public must be able to find the version in force and trust it is genuine.",
    "definition": "A by-law is a subordinate rule enacted under delegated authority by an organisation or local body to regulate its own affairs or a defined area within the limits of that authority.",
    "why": [
      "By-laws bind members or residents, so an outdated or unofficial copy can lead people to follow rules no longer in force.",
      "By-laws are amended over time, and consolidating those changes accurately is essential to knowing the current rule.",
      "Because they derive from delegated power, by-laws must stay within their enabling authority to remain valid."
    ],
    "how": [
      {
        "t": "Anchor to enabling power",
        "d": "Record the authority under which the by-law is made so its validity can be traced to a lawful source."
      },
      {
        "t": "Maintain a consolidated text",
        "d": "Fold amendments into a sealed consolidated version so users read one accurate, current rule rather than scattered changes."
      },
      {
        "t": "Publish with verification",
        "d": "Release the by-law in a register where the public can confirm the version in force and its authenticity."
      }
    ],
    "faqs": [
      {
        "q": "What is a by-law?",
        "a": "A by-law is a subordinate rule enacted under delegated authority by an organisation or local body to regulate its own affairs or a defined area within the limits of that authority."
      },
      {
        "q": "How does a by-law differ from an ordinance?",
        "a": "Both are subordinate rules, but a by-law is typically made by an organisation or local body for its own governance, while an ordinance is often a broader local law with wider application. Usage varies by jurisdiction."
      },
      {
        "q": "How can the public find the by-law in force?",
        "a": "Through a governed register that maintains a sealed, consolidated text reflecting all amendments, so the current rule is clearly distinguished from superseded versions."
      }
    ],
    "relatedIndustries": [
      "municipalities",
      "government",
      "professional-bodies",
      "chambers-of-commerce"
    ],
    "relatedProblems": [
      "official-publication",
      "document-governance",
      "regulatory-publication",
      "publication-audit"
    ],
    "diagram": "lifecycle",
    "metaTitle": "By-law: Definition, Authority & Current Text",
    "metaDescription": "What a by-law is, why consolidation and authority matter, and how the public verifies the genuine version of a subordinate rule in force."
  },
  {
    "slug": "ordinance",
    "term": "Ordinance",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Publish ordinances with a trusted record",
    "lead": "An ordinance is a local law enacted by a competent authority. Residents and officials act on it, so the official text must be authentic and current.",
    "definition": "An ordinance is a local legislative instrument enacted by a competent authority to regulate conduct or matters within its jurisdiction, carrying legal force in that area.",
    "why": [
      "Ordinances are enforced against residents and businesses, so reliance on a wrong version can cause unlawful action.",
      "Amendments and repeals accumulate, making an accurate consolidated record necessary to state the current law.",
      "Enforcement and disputes require proof of what the ordinance said on a given date, which only a governed record supplies."
    ],
    "how": [
      {
        "t": "Record enactment",
        "d": "Capture the enacting authority, the adoption date, and the commencement date so the ordinance's force is traceable."
      },
      {
        "t": "Seal each version",
        "d": "Bind every enacted and amended text to a cryptographic fingerprint so historical and current versions are both provable."
      },
      {
        "t": "Publish an accessible register",
        "d": "Maintain a public register where the in-force text and its history can be verified by anyone affected."
      }
    ],
    "faqs": [
      {
        "q": "What is an ordinance?",
        "a": "An ordinance is a local legislative instrument enacted by a competent authority to regulate conduct or matters within its jurisdiction, carrying legal force in that area."
      },
      {
        "q": "Why keep the historical text of an ordinance?",
        "a": "Because enforcement and disputes often concern conduct under an earlier version. A sealed history lets the institution prove what the law was on any given date."
      },
      {
        "q": "How is the current ordinance text verified?",
        "a": "By consulting a governed register that holds a sealed, consolidated version reflecting all amendments and repeals, with each version independently checkable."
      }
    ],
    "relatedIndustries": [
      "municipalities",
      "government",
      "parliaments",
      "environmental-agencies"
    ],
    "relatedProblems": [
      "government-publication-workflow",
      "official-publication",
      "regulatory-publication",
      "document-governance"
    ],
    "diagram": "ledger",
    "metaTitle": "Ordinance: Definition, Enactment & Verification",
    "metaDescription": "What an ordinance is, why version history matters for enforcement, and how to seal and publish a trusted record of local law."
  },
  {
    "slug": "code-of-practice",
    "term": "Code of practice",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Maintain codes of practice with clear authority",
    "lead": "A code of practice sets recognised standards of conduct or method for a sector. Compliance and enforcement depend on referencing the authentic, current edition.",
    "definition": "A code of practice is an official instrument that sets out recommended or required standards of conduct, method, or quality for a defined activity, against which compliance can be assessed.",
    "why": [
      "Compliance is judged against the code, so referencing a superseded edition can produce wrong assessments.",
      "Codes are revised as practice and risk evolve, and the applicable edition often depends on the relevant date.",
      "Because codes may be cited in regulation or contracts, their authenticity and edition must be verifiable."
    ],
    "how": [
      {
        "t": "Identify the issuing body",
        "d": "Record who maintains the code and under what mandate so its standing and scope are clear to users."
      },
      {
        "t": "Version each edition",
        "d": "Seal each edition with a fingerprint and effective date so the applicable text can be identified for any period."
      },
      {
        "t": "Link to obligations",
        "d": "Where a code is referenced by law or contract, align the published edition with those references so reliance stays accurate."
      }
    ],
    "faqs": [
      {
        "q": "What is a code of practice?",
        "a": "A code of practice is an official instrument that sets out recommended or required standards of conduct, method, or quality for a defined activity, against which compliance can be assessed."
      },
      {
        "q": "Is a code of practice mandatory?",
        "a": "It depends. Some codes are advisory, while others become binding where law or contract requires compliance. The code's status and the referencing instrument determine its force."
      },
      {
        "q": "How do users find the correct edition of a code?",
        "a": "By consulting a governed register that seals each edition with its effective date, so the edition applicable to a given period is clearly identifiable and verifiable."
      }
    ],
    "relatedIndustries": [
      "standards-bodies",
      "professional-bodies",
      "regulators",
      "food-safety"
    ],
    "relatedProblems": [
      "regulatory-publication",
      "official-publication",
      "document-governance",
      "document-verification"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Code of Practice: Definition, Editions & Compliance",
    "metaDescription": "What a code of practice is, why the applicable edition matters, and how to seal, version, and verify recognised standards of conduct."
  },
  {
    "slug": "guidance-note",
    "term": "Guidance note",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Issue guidance notes people can verify",
    "lead": "A guidance note explains how to interpret or apply rules in practice. Readers rely on it, so its source and currency must be clear without overstating its force.",
    "definition": "A guidance note is an official instrument that explains how an issuing body interprets or expects rules, policies, or standards to be applied in practice, without itself creating new binding obligations.",
    "why": [
      "Readers shape behaviour around guidance, so a tampered or stale note can drive incorrect compliance decisions.",
      "Guidance is updated as interpretation evolves, making the publication date and version material to its reliability.",
      "Misrepresenting guidance as binding, or vice versa, distorts how obligations are understood and applied."
    ],
    "how": [
      {
        "t": "State scope and status",
        "d": "Make clear what the note covers and that it explains rather than creates obligations, so its weight is not overstated."
      },
      {
        "t": "Seal and date",
        "d": "Fix each version with a cryptographic fingerprint and publication date so readers can confirm currency and integrity."
      },
      {
        "t": "Cross-reference sources",
        "d": "Link the note to the rules it interprets so readers can trace guidance back to its authoritative basis."
      }
    ],
    "faqs": [
      {
        "q": "What is a guidance note?",
        "a": "A guidance note is an official instrument that explains how an issuing body interprets or expects rules, policies, or standards to be applied in practice, without itself creating new binding obligations."
      },
      {
        "q": "Does a guidance note carry legal force?",
        "a": "Generally it does not create new obligations, but it signals how an issuer expects rules to be applied. Its persuasive weight depends on the issuer and the underlying rule it interprets."
      },
      {
        "q": "How can a reader confirm guidance is current?",
        "a": "By checking the note against a governed register recording its version, publication date, and seal, so superseded interpretations are distinguishable from the current note."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "tax-authorities",
      "data-protection",
      "financial-institutions"
    ],
    "relatedProblems": [
      "regulatory-publication",
      "official-publication",
      "document-governance",
      "document-verification"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Guidance Note: Definition, Status & Currency",
    "metaDescription": "What a guidance note is, why its status and currency matter, and how to seal, date, and verify interpretive guidance without overstating force."
  },
  {
    "slug": "position-statement",
    "term": "Position statement",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Publish position statements that hold up",
    "lead": "A position statement records an institution's official stance on an issue. Stakeholders quote it, so the published wording and its date must be verifiable.",
    "definition": "A position statement is an official instrument that sets out an organisation's formally adopted stance on a defined issue, together with the reasoning that supports it.",
    "why": [
      "Stakeholders and media quote position statements, so an altered version can misrepresent the institution's stance.",
      "Positions evolve, making it important to distinguish the current statement from earlier ones and know the adoption date.",
      "Because they are public and attributable, position statements are vulnerable to selective editing or fabrication."
    ],
    "how": [
      {
        "t": "Record adoption",
        "d": "Capture who adopted the position and when so the statement is attributable to an accountable authority."
      },
      {
        "t": "Seal the published text",
        "d": "Bind the statement to a cryptographic fingerprint so any quoted or circulated copy can be checked against the original."
      },
      {
        "t": "Version on change",
        "d": "Issue a new sealed version when the position shifts and link back so the history of the stance is preserved."
      }
    ],
    "faqs": [
      {
        "q": "What is a position statement?",
        "a": "A position statement is an official instrument that sets out an organisation's formally adopted stance on a defined issue, together with the reasoning that supports it."
      },
      {
        "q": "How is a position statement different from a policy?",
        "a": "A position statement expresses an organisation's stance and reasoning on an issue, while a policy sets binding rules and obligations. A position can inform policy but does not itself compel action."
      },
      {
        "q": "How can a quoted position statement be verified?",
        "a": "By matching the quoted text against the sealed version in a governed register, which records the adopting authority and adoption date for the statement in force."
      }
    ],
    "relatedIndustries": [
      "ngos",
      "professional-bodies",
      "human-rights-commissions",
      "standards-bodies"
    ],
    "relatedProblems": [
      "official-publication",
      "document-authenticity",
      "document-governance",
      "document-verification"
    ],
    "diagram": "seal",
    "metaTitle": "Position Statement: Definition & Verification",
    "metaDescription": "What a position statement is, why its wording and date matter, and how to seal, version, and verify an organisation's official stance."
  },
  {
    "slug": "framework-document",
    "term": "Framework document",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Govern framework documents that set alignment",
    "lead": "A framework document defines structure, principles, and roles that other instruments align to. Because so much hangs off it, its authoritative version must be unambiguous.",
    "definition": "A framework document is an official instrument that establishes the overarching structure, principles, and responsibilities within which more detailed rules, policies, or activities are aligned and developed.",
    "why": [
      "Subordinate instruments align to the framework, so an outdated framework can cascade misalignment across many documents.",
      "Frameworks define roles and boundaries, making textual precision essential to avoid gaps or overlaps in responsibility.",
      "Because frameworks are foundational and long-lived, their version history and current text must be clearly governed."
    ],
    "how": [
      {
        "t": "Set structure and roles",
        "d": "Define the principles, boundaries, and responsibilities the framework establishes so dependent instruments align to a stable base."
      },
      {
        "t": "Seal each revision",
        "d": "Fingerprint every version with an effective date so the authoritative framework is always identifiable."
      },
      {
        "t": "Map dependencies",
        "d": "Record which instruments rely on the framework so a revision's downstream impact can be reviewed and managed."
      }
    ],
    "faqs": [
      {
        "q": "What is a framework document?",
        "a": "A framework document is an official instrument that establishes the overarching structure, principles, and responsibilities within which more detailed rules, policies, or activities are aligned and developed."
      },
      {
        "q": "How does a framework differ from a policy?",
        "a": "A framework sets the overarching structure and principles that many instruments align to, while a policy states specific binding rules. Policies typically sit within and align to a framework."
      },
      {
        "q": "Why does framework version control matter so much?",
        "a": "Because many subordinate instruments depend on it. An unclear or outdated framework can propagate misalignment widely, so its authoritative version must be governed and verifiable."
      }
    ],
    "relatedIndustries": [
      "government",
      "central-banks",
      "universities",
      "development-banks"
    ],
    "relatedProblems": [
      "document-governance",
      "official-publication",
      "policy-approval-workflow",
      "publication-audit"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Framework Document: Definition & Governance",
    "metaDescription": "What a framework document is, why version control matters when others align to it, and how to seal and govern its authoritative text."
  },
  {
    "slug": "charter",
    "term": "Charter",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Preserve charters as founding authority",
    "lead": "A charter establishes a body's existence, powers, and purpose. As a founding instrument it must remain provably authentic for the entire life of the organisation.",
    "definition": "A charter is a foundational instrument that formally establishes an entity, defines its purpose and powers, and sets the terms under which it operates.",
    "why": [
      "A charter is the source of a body's authority, so any doubt about its authenticity undermines everything done under it.",
      "Charters are long-lived and rarely amended, making preservation of the original text over decades essential.",
      "Amendments to a charter change fundamental powers, so each change must be traceable and verifiable."
    ],
    "how": [
      {
        "t": "Seal the founding text",
        "d": "Fingerprint the original charter so its authentic text is preserved and provable for the life of the entity."
      },
      {
        "t": "Record each amendment",
        "d": "Capture every amendment with its authority and date so the chain from founding to current text is unbroken."
      },
      {
        "t": "Preserve for the long term",
        "d": "Store the sealed charter and its history in durable, tamper-evident form so authenticity survives across generations."
      }
    ],
    "faqs": [
      {
        "q": "What is a charter?",
        "a": "A charter is a foundational instrument that formally establishes an entity, defines its purpose and powers, and sets the terms under which it operates."
      },
      {
        "q": "Why is a charter's authenticity so important?",
        "a": "Because the charter is the source of the entity's authority. If its authenticity is in doubt, every power exercised and action taken under it can be questioned."
      },
      {
        "q": "How is a charter preserved over decades?",
        "a": "By sealing the founding text and each amendment in a durable, tamper-evident chain, so the original and its full amendment history remain verifiable over time."
      }
    ],
    "relatedIndustries": [
      "universities",
      "municipalities",
      "chambers-of-commerce",
      "national-libraries"
    ],
    "relatedProblems": [
      "institutional-records",
      "digital-preservation",
      "document-authenticity",
      "evidence-chain"
    ],
    "diagram": "chain",
    "metaTitle": "Charter: Definition, Authority & Preservation",
    "metaDescription": "What a charter is, why its authenticity underpins an entity's authority, and how to seal and preserve a founding instrument long term."
  },
  {
    "slug": "terms-of-reference",
    "term": "Terms of reference",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Set terms of reference that stay authoritative",
    "lead": "Terms of reference define the mandate, scope, and authority of a body or task. Members and reviewers rely on the agreed text, so it must be fixed and verifiable.",
    "definition": "Terms of reference are an official instrument that defines the purpose, scope, authority, and membership of a body, project, or task, setting the boundaries within which it operates.",
    "why": [
      "Mandate disputes turn on the agreed scope, so an altered terms of reference can expand or shrink authority improperly.",
      "Terms of reference are revised as work evolves, making it important to know which version governs at a given time.",
      "Reviewers test whether a body acted within its mandate, which requires a verifiable record of the terms in force."
    ],
    "how": [
      {
        "t": "Define scope and authority",
        "d": "Set out the purpose, powers, membership, and limits so the mandate is explicit and not open to drift."
      },
      {
        "t": "Seal the agreed version",
        "d": "Fingerprint the adopted terms so the governing text is fixed and any later change is evident."
      },
      {
        "t": "Govern revisions",
        "d": "Record amendments with their approval and date so the version in force is always identifiable."
      }
    ],
    "faqs": [
      {
        "q": "What are terms of reference?",
        "a": "Terms of reference are an official instrument that defines the purpose, scope, authority, and membership of a body, project, or task, setting the boundaries within which it operates."
      },
      {
        "q": "Why do terms of reference need version control?",
        "a": "Because mandate disputes hinge on the agreed scope. Version control ensures the terms in force at a given time can be identified and that scope was not altered without approval."
      },
      {
        "q": "How is the governing terms of reference verified?",
        "a": "By checking a governed register that seals each adopted version with its approval and date, so the version in force is clearly distinguished from superseded ones."
      }
    ],
    "relatedIndustries": [
      "government",
      "supreme-audit-institutions",
      "ngos",
      "research-institutes"
    ],
    "relatedProblems": [
      "document-governance",
      "official-publication",
      "institutional-records",
      "publication-audit"
    ],
    "diagram": "workflow",
    "metaTitle": "Terms of Reference: Definition & Governance",
    "metaDescription": "What terms of reference are, why the governing version matters for mandate, and how to seal and govern the agreed scope and authority."
  },
  {
    "slug": "official-letter",
    "term": "Official letter",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Make official letters provably authentic",
    "lead": "An official letter conveys a formal communication or decision under an institution's authority. Recipients act on it, so its origin and integrity must be verifiable.",
    "definition": "An official letter is a formal written communication issued under the authority of an institution or officer to convey a decision, notice, or position to a named recipient.",
    "why": [
      "Recipients take action on official letters, so a forged or altered letter can trigger wrongful steps in their name.",
      "Letters often confirm rights, deadlines, or decisions, making their date and exact wording legally relevant.",
      "Letterheads and signatures are easily imitated, so genuine authenticity must rest on more than appearance."
    ],
    "how": [
      {
        "t": "Attribute to authority",
        "d": "Record the issuing office and signing officer so the letter is tied to an accountable source."
      },
      {
        "t": "Seal for integrity",
        "d": "Bind the letter to a cryptographic fingerprint so the recipient can confirm it is unaltered and genuine."
      },
      {
        "t": "Enable independent checks",
        "d": "Provide a verification path so a recipient or third party can confirm the letter against the issuer's record."
      }
    ],
    "faqs": [
      {
        "q": "What is an official letter?",
        "a": "An official letter is a formal written communication issued under the authority of an institution or officer to convey a decision, notice, or position to a named recipient."
      },
      {
        "q": "Why isn't a letterhead enough to prove authenticity?",
        "a": "Because letterheads and signatures can be copied. Reliable authenticity rests on a verifiable seal tied to the issuing authority, which a forged letter cannot reproduce."
      },
      {
        "q": "How can a recipient verify an official letter?",
        "a": "By checking its cryptographic seal and issuing authority through a verification path linked to the institution's record, confirming both origin and integrity."
      }
    ],
    "relatedIndustries": [
      "government",
      "foreign-affairs",
      "immigration-authorities",
      "civil-registration"
    ],
    "relatedProblems": [
      "official-publication",
      "document-authenticity",
      "document-verification",
      "evidence-chain"
    ],
    "diagram": "seal",
    "metaTitle": "Official Letter: Definition & Authenticity",
    "metaDescription": "What an official letter is, why letterheads do not prove authenticity, and how recipients verify the origin and integrity of a formal communication."
  },
  {
    "slug": "decree",
    "term": "Decree",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Publish decrees with an unbroken record",
    "lead": "A decree is an authoritative command with the force of law issued by a competent authority. Its legitimacy depends on a verifiable record of issue and text.",
    "definition": "A decree is an authoritative legal instrument issued by a competent executive or sovereign authority that has binding force within its jurisdiction from the moment of issue.",
    "why": [
      "Decrees take effect quickly and bind broadly, so an inauthentic copy can carry serious unlawful consequences.",
      "The issuing authority and date establish a decree's legitimacy, making a verifiable record indispensable.",
      "Decrees are frequently amended or repealed, so their current status must be clearly ascertainable."
    ],
    "how": [
      {
        "t": "Record issuing authority",
        "d": "Capture the authority, legal basis, and issue date so the decree's legitimacy and effect are traceable."
      },
      {
        "t": "Seal the official text",
        "d": "Bind the decree to a cryptographic fingerprint so the authentic text is fixed and verifiable from issue."
      },
      {
        "t": "Maintain status history",
        "d": "Link each decree to amendments and repeals so users can confirm whether it remains in force."
      }
    ],
    "faqs": [
      {
        "q": "What is a decree?",
        "a": "A decree is an authoritative legal instrument issued by a competent executive or sovereign authority that has binding force within its jurisdiction from the moment of issue."
      },
      {
        "q": "How does a decree differ from a statute?",
        "a": "A decree is typically issued by an executive or sovereign authority and often takes effect on issue, while a statute is enacted through a legislature. The exact relationship depends on the jurisdiction's constitutional order."
      },
      {
        "q": "How is a decree's authenticity established?",
        "a": "Through a governed record that seals the official text and captures the issuing authority, legal basis, and issue date, with its amendment and repeal history maintained."
      }
    ],
    "relatedIndustries": [
      "government",
      "parliaments",
      "foreign-affairs",
      "central-banks"
    ],
    "relatedProblems": [
      "government-publication-workflow",
      "official-publication",
      "document-authenticity",
      "regulatory-publication"
    ],
    "diagram": "chain",
    "metaTitle": "Decree: Definition, Authority & Authenticity",
    "metaDescription": "What a decree is, why its authority and current status matter, and how to seal, record, and verify an authoritative legal command."
  },
  {
    "slug": "statutory-instrument",
    "term": "Statutory instrument",
    "category": "Concepts & definitions",
    "kicker": "Official instruments",
    "headline": "Publish statutory instruments people can trust",
    "lead": "A statutory instrument is subordinate legislation made under powers granted by primary law. Because it carries legal force, its authentic text and currency are critical.",
    "definition": "A statutory instrument is a form of subordinate legislation made by an authority under powers delegated by primary legislation, carrying legal force within the limits of that delegated power.",
    "why": [
      "Statutory instruments bind the public, so reliance on an unofficial or superseded version can lead to unlawful conduct.",
      "They are made under delegated powers, so staying within the enabling legislation is essential to their validity.",
      "Frequent amendment means the in-force text must be accurately consolidated and verifiable at any date."
    ],
    "how": [
      {
        "t": "Anchor to enabling law",
        "d": "Record the primary legislation and the specific power exercised so the instrument's validity can be traced."
      },
      {
        "t": "Seal each made version",
        "d": "Fingerprint the instrument as made and as amended so each version's authentic text is preserved and provable."
      },
      {
        "t": "Publish a consolidated register",
        "d": "Maintain a verifiable register with the in-force consolidated text so the public can confirm the current law."
      }
    ],
    "faqs": [
      {
        "q": "What is a statutory instrument?",
        "a": "A statutory instrument is a form of subordinate legislation made by an authority under powers delegated by primary legislation, carrying legal force within the limits of that delegated power."
      },
      {
        "q": "How does a statutory instrument differ from primary legislation?",
        "a": "Primary legislation is enacted by a legislature, while a statutory instrument is made under powers that primary legislation delegates. The instrument is valid only within those delegated limits."
      },
      {
        "q": "How can the public verify the in-force text?",
        "a": "Through a governed register that seals each version and maintains an accurate consolidated text, so the current statutory instrument is distinguishable from superseded versions."
      }
    ],
    "relatedIndustries": [
      "government",
      "parliaments",
      "regulators",
      "national-statistics"
    ],
    "relatedProblems": [
      "government-publication-workflow",
      "regulatory-publication",
      "official-publication",
      "document-governance"
    ],
    "diagram": "ledger",
    "metaTitle": "Statutory Instrument: Definition & In-Force Text",
    "metaDescription": "What a statutory instrument is, why delegated power and currency matter, and how to seal and publish a trusted, consolidated legal text."
  },
  {
    "slug": "certificate-issuance",
    "term": "Certificate issuance",
    "category": "Verification & authenticity",
    "kicker": "Issuance",
    "headline": "Issue certificates that anyone can later verify",
    "lead": "When an institution issues a certificate, the record of who authorised it, what it attests, and when it was sealed must survive long after the signer has moved on.",
    "definition": "Certificate issuance is the governed process of creating, authorising, and releasing an official certificate so that its origin, content, and validity can be independently verified at any future point.",
    "why": [
      "A certificate is only as trustworthy as the issuance trail behind it; without a recorded approval chain, a forged copy is indistinguishable from a genuine one.",
      "Issuing bodies face liability when certificates are repudiated, duplicated, or altered, so the moment of issuance must be captured as durable evidence.",
      "Recipients and third parties increasingly demand machine-checkable proof rather than a stamp or signature that cannot be examined remotely."
    ],
    "how": [
      {
        "t": "Capture the authorisation",
        "d": "Record which official or body approved issuance, under what authority, and against which template before the certificate is released."
      },
      {
        "t": "Seal the content",
        "d": "Bind the certificate's exact content to a cryptographic seal at the moment of issuance so any later change is detectable."
      },
      {
        "t": "Expose a verification path",
        "d": "Publish a route by which a holder or relying party can confirm the certificate was genuinely issued and remains valid."
      }
    ],
    "faqs": [
      {
        "q": "What is certificate issuance?",
        "a": "Certificate issuance is the governed process of creating, authorising, and releasing an official certificate so that its origin, content, and validity can be independently verified at any future point."
      },
      {
        "q": "Does issuance need to be cryptographic?",
        "a": "Not always, but a cryptographic seal at issuance gives the strongest evidence that the certificate has not been altered and was genuinely released by the issuing body."
      },
      {
        "q": "Who is accountable for an issued certificate?",
        "a": "The issuing institution remains accountable; a clear issuance record identifies the authorising official and the authority under which the certificate was released."
      }
    ],
    "relatedIndustries": [
      "government",
      "universities",
      "professional-bodies",
      "regulators"
    ],
    "relatedProblems": [
      "digital-credential",
      "issuance-workflow",
      "certificate-template",
      "tamper-evident-certificate", "document-authentication", "verification-api"],
    "diagram": "seal",
    "metaTitle": "Certificate Issuance | Verifiable Official Certificates",
    "metaDescription": "Certificate issuance is the governed process of creating, authorising, and releasing certificates whose origin and validity can be independently verified."
  },
  {
    "slug": "digital-credential",
    "term": "Digital credential",
    "category": "Verification & authenticity",
    "kicker": "Credentials",
    "headline": "Replace paper credentials with verifiable digital proof",
    "lead": "A digital credential carries the same authority as a printed certificate while remaining checkable by software, without a phone call to the issuer.",
    "definition": "A digital credential is an electronically issued attestation of a qualification, status, or entitlement whose authenticity and current validity can be confirmed without contacting the issuer directly.",
    "why": [
      "Paper credentials are slow to verify and easy to counterfeit, while a well-designed digital credential lets relying parties confirm authenticity in seconds.",
      "Holders need to present credentials across borders and systems, so a portable digital form reduces friction without weakening trust.",
      "Issuers reduce fraud and administrative cost when verification no longer depends on manual lookups or reissued copies."
    ],
    "how": [
      {
        "t": "Bind identity to attestation",
        "d": "Tie the credential to the holder and to the specific claim being made so it cannot be reassigned or repurposed."
      },
      {
        "t": "Sign at issuance",
        "d": "Apply the issuer's cryptographic signature so any party can confirm the credential came from the stated authority."
      },
      {
        "t": "Support status checks",
        "d": "Provide a current-status signal so verifiers learn if a credential has been suspended or withdrawn."
      }
    ],
    "faqs": [
      {
        "q": "What is a digital credential?",
        "a": "A digital credential is an electronically issued attestation of a qualification, status, or entitlement whose authenticity and current validity can be confirmed without contacting the issuer directly."
      },
      {
        "q": "How is it different from a scanned certificate?",
        "a": "A scanned image only shows a picture; a digital credential carries a verifiable signature and status that software can check independently."
      },
      {
        "q": "Can a digital credential be revoked?",
        "a": "Yes; a revocation or status mechanism lets the issuer mark a credential as withdrawn so verifiers no longer treat it as valid."
      }
    ],
    "relatedIndustries": [
      "universities",
      "professional-bodies",
      "government",
      "financial-institutions"
    ],
    "relatedProblems": [
      "verifiable-credential",
      "credential-revocation",
      "certificate-issuance",
      "e-certificate", "qr-code-verification", "online-document-verification"],
    "diagram": "shield",
    "metaTitle": "Digital Credential | Verifiable Electronic Attestation",
    "metaDescription": "A digital credential is an electronically issued attestation whose authenticity and validity can be confirmed without contacting the issuer."
  },
  {
    "slug": "verifiable-credential",
    "term": "Verifiable credential",
    "category": "Verification & authenticity",
    "kicker": "Credentials",
    "headline": "Make every credential check itself against its issuer",
    "lead": "A verifiable credential carries the cryptographic evidence needed for a relying party to confirm both who issued it and that it has not been tampered with.",
    "definition": "A verifiable credential is a tamper-evident, cryptographically signed attestation that allows any relying party to confirm the issuer's identity and the integrity of the claim it carries.",
    "why": [
      "Relying parties cannot always reach the issuer, so a credential that proves its own provenance removes a single point of failure.",
      "Tamper-evidence means a single altered field invalidates the signature, making silent forgery detectable rather than plausible.",
      "Standardised verification lets credentials cross organisational and national boundaries without bespoke integration each time."
    ],
    "how": [
      {
        "t": "Encode the claim structurally",
        "d": "Express the attestation in a structured form so verifiers parse fields consistently rather than reading free text."
      },
      {
        "t": "Sign with issuer keys",
        "d": "Sign the credential with keys traceable to the issuer so its origin is provable to any holder."
      },
      {
        "t": "Verify integrity on presentation",
        "d": "Allow the verifier to recompute the signature and detect any modification before accepting the claim."
      }
    ],
    "faqs": [
      {
        "q": "What is a verifiable credential?",
        "a": "A verifiable credential is a tamper-evident, cryptographically signed attestation that allows any relying party to confirm the issuer's identity and the integrity of the claim it carries."
      },
      {
        "q": "Does verification require the issuer to be online?",
        "a": "Integrity and origin can often be verified offline using the issuer's published keys, though current status may still need a separate check."
      },
      {
        "q": "What happens if a field is changed?",
        "a": "Any change breaks the cryptographic signature, so the credential fails verification and is treated as untrustworthy."
      }
    ],
    "relatedIndustries": [
      "universities",
      "government",
      "professional-bodies",
      "regulators"
    ],
    "relatedProblems": [
      "digital-credential",
      "tamper-evident-certificate",
      "credential-revocation",
      "certificate-issuance", "qr-code-verification", "online-document-verification"],
    "diagram": "shield",
    "metaTitle": "Verifiable Credential | Tamper-Evident Attestation",
    "metaDescription": "A verifiable credential is a cryptographically signed attestation that lets any party confirm the issuer's identity and the claim's integrity."
  },
  {
    "slug": "licence-issuance",
    "term": "Licence issuance",
    "category": "Verification & authenticity",
    "kicker": "Issuance",
    "headline": "Issue licences with a verifiable grant of authority",
    "lead": "When a regulator grants a licence, the permission, its conditions, and its expiry must be recorded so the public and inspectors can confirm what was actually authorised.",
    "definition": "Licence issuance is the controlled process by which an authority grants a formal permission, recording its scope, conditions, and validity period so the grant can be verified by holders and third parties.",
    "why": [
      "A licence confers legal permission, so any ambiguity about its scope or expiry exposes both the holder and the issuing authority to risk.",
      "Inspectors and counterparties need to confirm a licence is genuine and current, not lapsed or fabricated.",
      "Conditions attached at issuance must remain linked to the licence so enforcement can reference exactly what was granted."
    ],
    "how": [
      {
        "t": "Define scope and conditions",
        "d": "Record precisely what the licence permits and the conditions under which it remains valid."
      },
      {
        "t": "Set and bind validity",
        "d": "Attach an effective and expiry date so verifiers can determine whether the licence is currently in force."
      },
      {
        "t": "Make the grant checkable",
        "d": "Provide a verification route so the public can confirm the licence and its status without contacting the office."
      }
    ],
    "faqs": [
      {
        "q": "What is licence issuance?",
        "a": "Licence issuance is the controlled process by which an authority grants a formal permission, recording its scope, conditions, and validity period so the grant can be verified by holders and third parties."
      },
      {
        "q": "How can someone confirm a licence is current?",
        "a": "A verification route linked to the licence reports its current status, distinguishing an in-force licence from one that has expired or been revoked."
      },
      {
        "q": "Are licence conditions part of the record?",
        "a": "Yes; conditions attached at issuance remain bound to the licence so enforcement and verification reference the same terms."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "government",
      "municipalities",
      "telecom-regulators"
    ],
    "relatedProblems": [
      "permit-issuance",
      "registration-certificate",
      "credential-revocation",
      "issuance-workflow", "verification-portal", "online-document-verification"],
    "diagram": "workflow",
    "metaTitle": "Licence Issuance | Verifiable Grant of Authority",
    "metaDescription": "Licence issuance is the controlled process of granting a permission with recorded scope, conditions, and validity that holders and third parties can verify."
  },
  {
    "slug": "permit-issuance",
    "term": "Permit issuance",
    "category": "Verification & authenticity",
    "kicker": "Issuance",
    "headline": "Issue permits inspectors can verify on the spot",
    "lead": "A permit authorises a specific activity for a defined period, and field inspectors must be able to confirm it is genuine without returning to the office.",
    "definition": "Permit issuance is the process of granting and recording time-bound authorisation for a defined activity so that its authenticity, scope, and expiry can be confirmed during inspection.",
    "why": [
      "Permits are often checked in the field, so verification has to work away from the issuing system, not only at the counter.",
      "A permit's scope and expiry determine whether an activity is lawful, making accurate recording essential to enforcement.",
      "Forged or copied permits undermine safety and revenue, so issuance must produce evidence that resists duplication."
    ],
    "how": [
      {
        "t": "Record activity and location",
        "d": "Capture exactly which activity, site, or holder the permit covers so inspectors know its limits."
      },
      {
        "t": "Time-box the authorisation",
        "d": "Set clear start and end dates so an expired permit is unambiguously distinguishable from a current one."
      },
      {
        "t": "Enable field verification",
        "d": "Provide a check that works during inspection so genuineness can be confirmed without office access."
      }
    ],
    "faqs": [
      {
        "q": "What is permit issuance?",
        "a": "Permit issuance is the process of granting and recording time-bound authorisation for a defined activity so that its authenticity, scope, and expiry can be confirmed during inspection."
      },
      {
        "q": "How is a permit verified in the field?",
        "a": "A field-accessible check linked to the permit confirms it is genuine and current, even when the inspector is away from the issuing system."
      },
      {
        "q": "What stops a permit from being copied?",
        "a": "Binding the permit to a verifiable seal means a duplicated image fails verification, distinguishing it from the genuine issuance."
      }
    ],
    "relatedIndustries": [
      "municipalities",
      "regulators",
      "government",
      "environmental-agencies"
    ],
    "relatedProblems": [
      "licence-issuance",
      "registration-certificate",
      "issuance-workflow",
      "tamper-evident-certificate", "verification-portal", "document-validation"],
    "diagram": "workflow",
    "metaTitle": "Permit Issuance | Field-Verifiable Authorisation",
    "metaDescription": "Permit issuance grants and records time-bound authorisation for an activity so its authenticity, scope, and expiry can be confirmed during inspection."
  },
  {
    "slug": "diploma-issuance",
    "term": "Diploma issuance",
    "category": "Verification & authenticity",
    "kicker": "Issuance",
    "headline": "Issue diplomas employers can trust at a glance",
    "lead": "A diploma is verified for decades after graduation, so the way it is issued must let future employers and registries confirm it without reaching the awarding institution.",
    "definition": "Diploma issuance is the formal awarding and recording of an academic qualification so that the award, the awarding body, and the graduate's identity can be verified long after graduation.",
    "why": [
      "Diplomas are checked years or decades later, often by parties who cannot easily contact the original institution.",
      "Diploma fraud is widespread, so issuance must create durable evidence that distinguishes a genuine award from a fabricated one.",
      "Institutions protect their reputation when verification of their awards is reliable and resistant to forgery."
    ],
    "how": [
      {
        "t": "Bind award to graduate",
        "d": "Link the diploma to the graduate's verified identity and the specific qualification conferred."
      },
      {
        "t": "Seal at conferral",
        "d": "Apply a tamper-evident seal when the award is granted so later alterations are detectable."
      },
      {
        "t": "Offer lasting verification",
        "d": "Provide a verification path that remains available long after the cohort has graduated."
      }
    ],
    "faqs": [
      {
        "q": "What is diploma issuance?",
        "a": "Diploma issuance is the formal awarding and recording of an academic qualification so that the award, the awarding body, and the graduate's identity can be verified long after graduation."
      },
      {
        "q": "How do employers verify an issued diploma?",
        "a": "A verification path linked to the diploma confirms the award and the issuing institution, reducing reliance on slow manual checks."
      },
      {
        "q": "Does issuance prevent diploma fraud?",
        "a": "It cannot stop fabrication outright, but a sealed, verifiable issuance makes fraudulent copies detectable and easier to challenge."
      }
    ],
    "relatedIndustries": [
      "universities",
      "national-libraries",
      "professional-bodies",
      "government"
    ],
    "relatedProblems": [
      "academic-certificate",
      "certificate-issuance",
      "tamper-evident-certificate",
      "e-certificate", "verification-portal", "document-validation"],
    "diagram": "seal",
    "metaTitle": "Diploma Issuance | Verifiable Academic Awards",
    "metaDescription": "Diploma issuance is the formal awarding and recording of a qualification so the award, awarding body, and graduate can be verified after graduation."
  },
  {
    "slug": "academic-certificate",
    "term": "Academic certificate",
    "category": "Verification & authenticity",
    "kicker": "Credentials",
    "headline": "Award academic certificates that verify themselves",
    "lead": "An academic certificate records a completed course or qualification, and its value depends on whether a third party can confirm it was genuinely awarded.",
    "definition": "An academic certificate is an institution-issued record of completed study or attainment whose authenticity and awarding body can be independently verified by employers and registries.",
    "why": [
      "Academic certificates underpin hiring and admission decisions, so their authenticity has direct consequences for relying parties.",
      "Counterfeit certificates are common, making verifiable issuance a meaningful defence rather than a formality.",
      "Graduates benefit when their attainment can be confirmed quickly across institutions and borders."
    ],
    "how": [
      {
        "t": "Record attainment precisely",
        "d": "Capture the programme, level, and result so the certificate reflects exactly what was achieved."
      },
      {
        "t": "Attach issuer authority",
        "d": "Bind the certificate to the awarding institution so verifiers can confirm the source."
      },
      {
        "t": "Provide a check route",
        "d": "Expose a verification route so employers and registries confirm authenticity without manual contact."
      }
    ],
    "faqs": [
      {
        "q": "What is an academic certificate?",
        "a": "An academic certificate is an institution-issued record of completed study or attainment whose authenticity and awarding body can be independently verified by employers and registries."
      },
      {
        "q": "How is it different from a diploma?",
        "a": "A diploma typically marks a full qualification, while a certificate may record a specific course or component; both rely on verifiable issuance."
      },
      {
        "q": "Can an academic certificate be checked abroad?",
        "a": "Yes; a verifiable certificate lets overseas employers and registries confirm the award without contacting the issuing institution."
      }
    ],
    "relatedIndustries": [
      "universities",
      "professional-bodies",
      "government",
      "national-libraries"
    ],
    "relatedProblems": [
      "diploma-issuance",
      "professional-certificate",
      "certificate-issuance",
      "digital-credential", "certificate-verification", "document-validation"],
    "diagram": "seal",
    "metaTitle": "Academic Certificate | Verifiable Study Records",
    "metaDescription": "An academic certificate is an institution-issued record of study whose authenticity and awarding body can be independently verified by employers and registries."
  },
  {
    "slug": "professional-certificate",
    "term": "Professional certificate",
    "category": "Verification & authenticity",
    "kicker": "Credentials",
    "headline": "Certify professionals so clients can verify standing",
    "lead": "A professional certificate signals that its holder meets a defined standard, and the public must be able to confirm that standing is current and genuine.",
    "definition": "A professional certificate is a body-issued attestation that its holder meets a defined competency or licensing standard, with authenticity and current standing that relying parties can verify.",
    "why": [
      "Clients and employers rely on professional certificates to assess competence, so false claims carry real safety and financial risk.",
      "Standing can lapse or be withdrawn, so verification must report current status, not only past issuance.",
      "Professional bodies protect their members and the public when certificates are difficult to forge and easy to check."
    ],
    "how": [
      {
        "t": "Anchor to the standard",
        "d": "Tie the certificate to the specific competency or licensing standard the holder has met."
      },
      {
        "t": "Track current standing",
        "d": "Maintain a status signal so verifiers can tell whether the certificate remains in good standing."
      },
      {
        "t": "Publish verification",
        "d": "Offer a public check so clients confirm both authenticity and current status."
      }
    ],
    "faqs": [
      {
        "q": "What is a professional certificate?",
        "a": "A professional certificate is a body-issued attestation that its holder meets a defined competency or licensing standard, with authenticity and current standing that relying parties can verify."
      },
      {
        "q": "Why does current standing matter?",
        "a": "A certificate may be genuine yet lapsed or suspended, so verification of current standing prevents reliance on outdated qualifications."
      },
      {
        "q": "Who issues professional certificates?",
        "a": "Recognised professional bodies or regulators issue them, and binding the certificate to that issuer lets verifiers confirm its source."
      }
    ],
    "relatedIndustries": [
      "professional-bodies",
      "regulators",
      "healthcare",
      "financial-institutions"
    ],
    "relatedProblems": [
      "academic-certificate",
      "accreditation-certificate",
      "credential-revocation",
      "digital-credential", "certificate-verification", "authenticity-check"],
    "diagram": "shield",
    "metaTitle": "Professional Certificate | Verifiable Competency Proof",
    "metaDescription": "A professional certificate attests that its holder meets a defined standard, with authenticity and current standing that relying parties can verify."
  },
  {
    "slug": "certificate-of-origin",
    "term": "Certificate of origin",
    "category": "Verification & authenticity",
    "kicker": "Trade",
    "headline": "Issue origin certificates customs can authenticate",
    "lead": "A certificate of origin determines tariffs and market access, so customs authorities must be able to confirm it was issued by an authorised body and not altered in transit.",
    "definition": "A certificate of origin is an authorised attestation of where goods were produced, issued so that customs and trade partners can verify its source and integrity for tariff and compliance purposes.",
    "why": [
      "Origin determines duties and eligibility under trade agreements, so a forged certificate can defraud revenue and distort markets.",
      "Customs officials in the destination country cannot easily contact the issuing chamber, so the certificate must prove its own provenance.",
      "Exporters face delays and penalties when origin documents cannot be authenticated quickly at the border."
    ],
    "how": [
      {
        "t": "Attest production origin",
        "d": "Record the goods and the country or region of production against the supporting evidence."
      },
      {
        "t": "Bind the issuing body",
        "d": "Link the certificate to the authorised chamber or authority so verifiers confirm legitimacy."
      },
      {
        "t": "Seal for border checks",
        "d": "Apply a tamper-evident seal so any alteration in transit is detectable by customs."
      }
    ],
    "faqs": [
      {
        "q": "What is a certificate of origin?",
        "a": "A certificate of origin is an authorised attestation of where goods were produced, issued so that customs and trade partners can verify its source and integrity for tariff and compliance purposes."
      },
      {
        "q": "Who issues a certificate of origin?",
        "a": "Authorised chambers of commerce or trade authorities issue them, and binding the certificate to that issuer lets customs confirm its legitimacy."
      },
      {
        "q": "How does customs detect tampering?",
        "a": "A tamper-evident seal applied at issuance fails verification if any field is altered, signalling that the certificate cannot be trusted."
      }
    ],
    "relatedIndustries": [
      "customs-border",
      "chambers-of-commerce",
      "regulators",
      "government"
    ],
    "relatedProblems": [
      "certified-document-issuance",
      "tamper-evident-certificate",
      "certificate-issuance",
      "registration-certificate"
    ],
    "diagram": "chain",
    "metaTitle": "Certificate of Origin | Customs-Verifiable Attestation",
    "metaDescription": "A certificate of origin attests where goods were produced so customs and trade partners can verify its source and integrity for tariff purposes."
  },
  {
    "slug": "birth-certificate-issuance",
    "term": "Birth certificate issuance",
    "category": "Verification & authenticity",
    "kicker": "Civil registration",
    "headline": "Issue birth certificates that resist forgery for life",
    "lead": "A birth certificate is a foundational identity document relied on across a lifetime, so its issuance must produce a record that resists forgery and remains verifiable for decades.",
    "definition": "Birth certificate issuance is the civil-registration process of recording a birth and producing an official certificate whose authenticity and registry source can be verified throughout the holder's life.",
    "why": [
      "Birth certificates underpin passports, benefits, and legal status, so a fraudulent one cascades into wider identity fraud.",
      "These documents are presented decades after issuance, often to parties who cannot reach the original registry.",
      "Registries bear responsibility for the integrity of foundational identity records, making verifiable issuance essential."
    ],
    "how": [
      {
        "t": "Record the registered birth",
        "d": "Capture the birth registration details against the authoritative civil register."
      },
      {
        "t": "Seal the certificate",
        "d": "Apply a tamper-evident seal so later alteration of names or dates is detectable."
      },
      {
        "t": "Enable lifelong verification",
        "d": "Provide a verification route to the registry that remains usable across the holder's life."
      }
    ],
    "faqs": [
      {
        "q": "What is birth certificate issuance?",
        "a": "Birth certificate issuance is the civil-registration process of recording a birth and producing an official certificate whose authenticity and registry source can be verified throughout the holder's life."
      },
      {
        "q": "Why is forgery resistance important here?",
        "a": "Because the certificate anchors a person's legal identity, a forged copy can unlock passports and benefits, so issuance must make alteration detectable."
      },
      {
        "q": "Can an issued birth certificate be re-verified later?",
        "a": "Yes; a registry-linked verification route lets relying parties confirm authenticity even decades after issuance."
      }
    ],
    "relatedIndustries": [
      "civil-registration",
      "government",
      "social-security",
      "immigration-authorities"
    ],
    "relatedProblems": [
      "certificate-issuance",
      "tamper-evident-certificate",
      "registration-certificate",
      "certified-document-issuance"
    ],
    "diagram": "seal",
    "metaTitle": "Birth Certificate Issuance | Verifiable Civil Records",
    "metaDescription": "Birth certificate issuance records a birth and produces a certificate whose authenticity and registry source can be verified throughout the holder's life."
  },
  {
    "slug": "title-deed-issuance",
    "term": "Title deed issuance",
    "category": "Verification & authenticity",
    "kicker": "Registration",
    "headline": "Issue title deeds buyers and lenders can verify",
    "lead": "A title deed proves ownership of land or property, so its issuance must produce a record that buyers, lenders, and courts can verify against the official register.",
    "definition": "Title deed issuance is the land-registry process of recording and issuing proof of property ownership so that the right it confers can be verified against the authoritative register.",
    "why": [
      "Property transactions hinge on clear ownership, so a forged or ambiguous deed can enable fraud and protracted disputes.",
      "Lenders and buyers must confirm a deed reflects the current register, not a superseded or fabricated record.",
      "Land registries carry the authoritative record, so issuance must keep the deed verifiable against that source."
    ],
    "how": [
      {
        "t": "Record the ownership right",
        "d": "Capture the parcel, owner, and interest exactly as held in the authoritative register."
      },
      {
        "t": "Seal against alteration",
        "d": "Apply a tamper-evident seal so changes to ownership or boundaries are detectable."
      },
      {
        "t": "Link to the register",
        "d": "Provide a verification path back to the registry so relying parties confirm the deed is current."
      }
    ],
    "faqs": [
      {
        "q": "What is title deed issuance?",
        "a": "Title deed issuance is the land-registry process of recording and issuing proof of property ownership so that the right it confers can be verified against the authoritative register."
      },
      {
        "q": "How do lenders verify a title deed?",
        "a": "A verification path linking the deed to the land registry lets lenders confirm the recorded ownership is current and genuine."
      },
      {
        "q": "What protects a deed from forgery?",
        "a": "A tamper-evident seal binds the deed's content at issuance so any later alteration fails verification against the register."
      }
    ],
    "relatedIndustries": [
      "land-registries",
      "government",
      "notarial-authorities",
      "financial-institutions"
    ],
    "relatedProblems": [
      "registration-certificate",
      "certified-document-issuance",
      "tamper-evident-certificate",
      "certificate-issuance", "anti-forgery-controls", "authenticity-check"],
    "diagram": "ledger",
    "metaTitle": "Title Deed Issuance | Register-Verifiable Ownership",
    "metaDescription": "Title deed issuance records and issues proof of property ownership so the right it confers can be verified against the authoritative land register."
  },
  {
    "slug": "registration-certificate",
    "term": "Registration certificate",
    "category": "Verification & authenticity",
    "kicker": "Registration",
    "headline": "Issue registration certificates third parties can confirm",
    "lead": "A registration certificate proves an entity or asset is recorded with an authority, and counterparties need to confirm that registration is genuine and active.",
    "definition": "A registration certificate is an authority-issued confirmation that an entity, asset, or activity is recorded in an official register, with authenticity and current status that third parties can verify.",
    "why": [
      "Registration certificates support contracts, licences, and compliance, so a false one can mislead counterparties and regulators.",
      "Registration status can change, so verification must reveal whether the record is active, suspended, or struck off.",
      "Authorities reduce fraud and disputes when their certificates are bound to the authoritative register."
    ],
    "how": [
      {
        "t": "Confirm the register entry",
        "d": "Record exactly what is registered and the official register that holds it."
      },
      {
        "t": "Reflect current status",
        "d": "Bind a status signal so verifiers can see whether the registration remains active."
      },
      {
        "t": "Expose verification",
        "d": "Provide a route to confirm the certificate against the authoritative register."
      }
    ],
    "faqs": [
      {
        "q": "What is a registration certificate?",
        "a": "A registration certificate is an authority-issued confirmation that an entity, asset, or activity is recorded in an official register, with authenticity and current status that third parties can verify."
      },
      {
        "q": "Why check status as well as authenticity?",
        "a": "A certificate may be genuine but the registration may have lapsed or been struck off, so status verification prevents reliance on outdated records."
      },
      {
        "q": "Who issues registration certificates?",
        "a": "The authority that maintains the relevant register issues them, and binding the certificate to that register lets third parties verify it."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "chambers-of-commerce",
      "land-registries"
    ],
    "relatedProblems": [
      "certificate-issuance",
      "title-deed-issuance",
      "licence-issuance",
      "certified-document-issuance", "certificate-verification", "authenticity-check"],
    "diagram": "ledger",
    "metaTitle": "Registration Certificate | Verifiable Register Proof",
    "metaDescription": "A registration certificate confirms an entity or asset is recorded in an official register, with authenticity and status that third parties can verify."
  },
  {
    "slug": "accreditation-certificate",
    "term": "Accreditation certificate",
    "category": "Verification & authenticity",
    "kicker": "Credentials",
    "headline": "Issue accreditation proof stakeholders can verify",
    "lead": "An accreditation certificate signals that an organisation meets a recognised standard, and stakeholders must be able to confirm the accreditation is genuine and in force.",
    "definition": "An accreditation certificate is a recognised body's attestation that an organisation meets a defined standard, with authenticity and validity period that stakeholders can independently verify.",
    "why": [
      "Accreditation underpins trust in laboratories, schools, and providers, so a false claim can mislead the public and partners.",
      "Accreditation has a defined term and scope, so verification must confirm both that it is current and what it covers.",
      "Accrediting bodies protect the meaning of their mark when certificates are verifiable and difficult to fake."
    ],
    "how": [
      {
        "t": "State the standard and scope",
        "d": "Record the standard met and the precise scope of the accreditation granted."
      },
      {
        "t": "Bind validity period",
        "d": "Attach the accreditation term so verifiers can confirm it remains in force."
      },
      {
        "t": "Provide verification",
        "d": "Expose a check route so stakeholders confirm authenticity and scope with the accrediting body."
      }
    ],
    "faqs": [
      {
        "q": "What is an accreditation certificate?",
        "a": "An accreditation certificate is a recognised body's attestation that an organisation meets a defined standard, with authenticity and validity period that stakeholders can independently verify."
      },
      {
        "q": "Why does scope matter in verification?",
        "a": "Accreditation often covers specific activities, so verifying the scope prevents an organisation from implying broader recognition than was granted."
      },
      {
        "q": "How do stakeholders confirm it is current?",
        "a": "A verification route linked to the accrediting body reports the certificate's validity, distinguishing current accreditation from expired or withdrawn."
      }
    ],
    "relatedIndustries": [
      "standards-bodies",
      "regulators",
      "universities",
      "healthcare"
    ],
    "relatedProblems": [
      "professional-certificate",
      "certificate-issuance",
      "credential-revocation",
      "digital-credential", "anti-forgery-controls", "verification-record"],
    "diagram": "shield",
    "metaTitle": "Accreditation Certificate | Verifiable Standard Proof",
    "metaDescription": "An accreditation certificate attests an organisation meets a defined standard, with authenticity and validity that stakeholders can independently verify."
  },
  {
    "slug": "tamper-evident-certificate",
    "term": "Tamper-evident certificate",
    "category": "Verification & authenticity",
    "kicker": "Authenticity",
    "headline": "Issue certificates that reveal any alteration",
    "lead": "A tamper-evident certificate is built so that any change to its content becomes detectable, turning silent forgery into an obvious verification failure.",
    "definition": "A tamper-evident certificate is an issued certificate cryptographically bound to its content so that any later alteration of its data causes verification to fail.",
    "why": [
      "Certificates are valuable targets for alteration, so binding content to a seal makes undetected forgery far harder.",
      "Verifiers need a clear signal, not a judgement call, so a failed check provides an unambiguous outcome.",
      "Issuers limit their liability when they can demonstrate that an altered certificate could not pass verification."
    ],
    "how": [
      {
        "t": "Hash the content at issuance",
        "d": "Compute a cryptographic digest of the certificate's exact content when it is issued."
      },
      {
        "t": "Bind the seal to the issuer",
        "d": "Sign the digest with issuer keys so origin and integrity are checked together."
      },
      {
        "t": "Re-verify on presentation",
        "d": "Recompute and compare the digest at verification so any change is detected immediately."
      }
    ],
    "faqs": [
      {
        "q": "What is a tamper-evident certificate?",
        "a": "A tamper-evident certificate is an issued certificate cryptographically bound to its content so that any later alteration of its data causes verification to fail."
      },
      {
        "q": "Does tamper-evidence prevent changes?",
        "a": "It does not prevent someone from editing a copy, but it makes that edit detectable so the altered certificate fails verification."
      },
      {
        "q": "What is the difference from tamper-proof?",
        "a": "Tamper-proof implies prevention, which is rarely absolute; tamper-evident honestly describes making any alteration detectable."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "universities",
      "financial-institutions"
    ],
    "relatedProblems": [
      "certificate-issuance",
      "verifiable-credential",
      "certified-document-issuance",
      "digital-credential", "anti-forgery-controls", "verification-record"],
    "diagram": "seal",
    "metaTitle": "Tamper-Evident Certificate | Detectable Alteration",
    "metaDescription": "A tamper-evident certificate is bound to its content so any later alteration of its data causes verification to fail, exposing forgery."
  },
  {
    "slug": "credential-revocation",
    "term": "Credential revocation",
    "category": "Verification & authenticity",
    "kicker": "Lifecycle",
    "headline": "Withdraw credentials so verifiers stop trusting them",
    "lead": "A credential may need to be cancelled before it expires, and revocation ensures verifiers learn it should no longer be accepted.",
    "definition": "Credential revocation is the controlled process of marking a previously issued credential as withdrawn so that verifiers treat it as no longer valid.",
    "why": [
      "Credentials are sometimes issued in error, obtained fraudulently, or rendered invalid by changed circumstances, so withdrawal must be possible.",
      "Without a revocation signal, a genuinely issued credential continues to verify even after it should no longer be trusted.",
      "Issuers and relying parties depend on revocation to keep verification decisions aligned with current reality."
    ],
    "how": [
      {
        "t": "Record the revocation event",
        "d": "Capture who revoked the credential, when, and on what basis."
      },
      {
        "t": "Publish a status signal",
        "d": "Expose the revoked status so verifiers can check it during validation."
      },
      {
        "t": "Fail verification cleanly",
        "d": "Ensure a revoked credential returns an unambiguous invalid result on check."
      }
    ],
    "faqs": [
      {
        "q": "What is credential revocation?",
        "a": "Credential revocation is the controlled process of marking a previously issued credential as withdrawn so that verifiers treat it as no longer valid."
      },
      {
        "q": "How is revocation different from expiry?",
        "a": "Expiry is a pre-set end date, while revocation withdraws a credential early in response to error, fraud, or changed circumstances."
      },
      {
        "q": "How do verifiers learn a credential is revoked?",
        "a": "A published status signal, checked during verification, reports the revocation so the credential returns an invalid result."
      }
    ],
    "relatedIndustries": [
      "professional-bodies",
      "regulators",
      "government",
      "healthcare"
    ],
    "relatedProblems": [
      "digital-credential",
      "verifiable-credential",
      "professional-certificate",
      "issuance-workflow", "document-fraud-prevention", "verification-record"],
    "diagram": "lifecycle",
    "metaTitle": "Credential Revocation | Withdrawing Trusted Credentials",
    "metaDescription": "Credential revocation marks a previously issued credential as withdrawn so verifiers treat it as no longer valid before its expiry."
  },
  {
    "slug": "e-certificate",
    "term": "E-certificate",
    "category": "Verification & authenticity",
    "kicker": "Issuance",
    "headline": "Issue electronic certificates with built-in verification",
    "lead": "An e-certificate delivers an official attestation in electronic form while carrying the evidence a recipient needs to prove it is genuine.",
    "definition": "An e-certificate is an electronically issued and delivered certificate that carries embedded evidence allowing its authenticity and issuer to be verified without a paper original.",
    "why": [
      "Electronic delivery is faster and cheaper than paper, but only retains trust if the recipient can prove the file is genuine.",
      "Recipients share e-certificates widely, so verification must work for any party who receives a copy.",
      "Issuers cut reissuance and postage costs when an e-certificate can be re-verified rather than physically re-sent."
    ],
    "how": [
      {
        "t": "Embed verifiable evidence",
        "d": "Carry a signature or seal within the electronic certificate so its authenticity travels with it."
      },
      {
        "t": "Bind to the issuer",
        "d": "Link the e-certificate to the issuing body so verifiers confirm where it came from."
      },
      {
        "t": "Provide an independent check",
        "d": "Offer a verification route any recipient can use without a paper original."
      }
    ],
    "faqs": [
      {
        "q": "What is an e-certificate?",
        "a": "An e-certificate is an electronically issued and delivered certificate that carries embedded evidence allowing its authenticity and issuer to be verified without a paper original."
      },
      {
        "q": "Is an e-certificate as trustworthy as paper?",
        "a": "When it carries a verifiable seal, an e-certificate can be more trustworthy than paper, since its authenticity is machine-checkable."
      },
      {
        "q": "What if an e-certificate is forwarded?",
        "a": "Verification works for any recipient because the embedded evidence and issuer binding travel with the certificate."
      }
    ],
    "relatedIndustries": [
      "universities",
      "government",
      "professional-bodies",
      "regulators"
    ],
    "relatedProblems": [
      "digital-credential",
      "certificate-issuance",
      "certificate-template",
      "tamper-evident-certificate", "document-fraud-prevention", "proof-of-authenticity"],
    "diagram": "seal",
    "metaTitle": "E-Certificate | Verifiable Electronic Certificates",
    "metaDescription": "An e-certificate is an electronically issued certificate carrying embedded evidence so its authenticity and issuer can be verified without paper."
  },
  {
    "slug": "certificate-template",
    "term": "Certificate template",
    "category": "Verification & authenticity",
    "kicker": "Issuance",
    "headline": "Govern certificate templates for consistent issuance",
    "lead": "A certificate template defines the structure and fields of what an institution issues, and controlling it keeps every certificate consistent and verifiable.",
    "definition": "A certificate template is a governed, reusable definition of a certificate's structure and required fields, used to ensure that every issued certificate is consistent and verifiable.",
    "why": [
      "Inconsistent certificates are harder to verify and easier to imitate, so a controlled template strengthens authenticity.",
      "Templates encode the issuer's authority and required fields, reducing errors and omissions at issuance.",
      "Verification logic depends on predictable structure, so a governed template makes automated checking reliable."
    ],
    "how": [
      {
        "t": "Define required fields",
        "d": "Specify the mandatory content and structure every certificate of this type must carry."
      },
      {
        "t": "Control template changes",
        "d": "Govern who can alter the template so issuance stays aligned with policy and standards."
      },
      {
        "t": "Link template to verification",
        "d": "Ensure the template's structure supports the verification checks applied at issuance."
      }
    ],
    "faqs": [
      {
        "q": "What is a certificate template?",
        "a": "A certificate template is a governed, reusable definition of a certificate's structure and required fields, used to ensure that every issued certificate is consistent and verifiable."
      },
      {
        "q": "Why govern templates?",
        "a": "Uncontrolled templates lead to inconsistent or non-compliant certificates, so governance keeps issuance aligned with policy and easy to verify."
      },
      {
        "q": "How does a template aid verification?",
        "a": "A predictable structure lets verification logic locate and check fields reliably, supporting consistent automated validation."
      }
    ],
    "relatedIndustries": [
      "government",
      "universities",
      "regulators",
      "professional-bodies"
    ],
    "relatedProblems": [
      "certificate-issuance",
      "issuance-workflow",
      "e-certificate",
      "certified-document-issuance", "verification-api", "proof-of-authenticity"],
    "diagram": "workflow",
    "metaTitle": "Certificate Template | Governed Issuance Consistency",
    "metaDescription": "A certificate template is a governed definition of a certificate's structure and fields, used to ensure every issued certificate is consistent and verifiable."
  },
  {
    "slug": "issuance-workflow",
    "term": "Issuance workflow",
    "category": "Verification & authenticity",
    "kicker": "Issuance",
    "headline": "Govern the path from request to verifiable certificate",
    "lead": "An issuance workflow defines the controlled steps from request to release, recording the approvals that make a certificate's origin defensible.",
    "definition": "An issuance workflow is the governed sequence of approval and control steps that moves a certificate request through to a sealed, verifiable release.",
    "why": [
      "An ungoverned issuance path leaves no record of who approved a certificate, weakening accountability and verification.",
      "Controlled steps catch errors and unauthorised requests before a certificate is released into circulation.",
      "A documented workflow lets the issuer demonstrate that each certificate followed an authorised path."
    ],
    "how": [
      {
        "t": "Define approval gates",
        "d": "Specify the checks and authorisations a request must pass before issuance."
      },
      {
        "t": "Record each step",
        "d": "Capture who acted at each stage so the issuance trail is reconstructable."
      },
      {
        "t": "Seal at release",
        "d": "Apply the verifiable seal only after the workflow's controls are satisfied."
      }
    ],
    "faqs": [
      {
        "q": "What is an issuance workflow?",
        "a": "An issuance workflow is the governed sequence of approval and control steps that moves a certificate request through to a sealed, verifiable release."
      },
      {
        "q": "Why record each step?",
        "a": "Recording each approval makes the issuance trail reconstructable, supporting accountability and the certificate's defensibility."
      },
      {
        "q": "Where does sealing fit in the workflow?",
        "a": "The verifiable seal is applied at release, only after the workflow's approval gates and controls have been satisfied."
      }
    ],
    "relatedIndustries": [
      "government",
      "regulators",
      "universities",
      "municipalities"
    ],
    "relatedProblems": [
      "certificate-issuance",
      "certificate-template",
      "licence-issuance",
      "credential-revocation", "verification-api", "proof-of-authenticity"],
    "diagram": "workflow",
    "metaTitle": "Issuance Workflow | Governed Certificate Release",
    "metaDescription": "An issuance workflow is the governed sequence of approval and control steps that moves a certificate request through to a sealed, verifiable release."
  },
  {
    "slug": "certified-document-issuance",
    "term": "Certified document issuance",
    "category": "Verification & authenticity",
    "kicker": "Issuance",
    "headline": "Issue certified copies that prove their own origin",
    "lead": "A certified document carries an official attestation of authenticity, and its issuance must let relying parties confirm that certification rather than take it on trust.",
    "definition": "Certified document issuance is the process of producing an officially attested document or copy so that its certification, issuer, and integrity can be independently verified.",
    "why": [
      "Certified documents are relied on in legal, financial, and administrative settings where a false attestation carries real consequences.",
      "Relying parties often cannot reach the certifying office, so the document must carry verifiable proof of its certification.",
      "Issuers protect the value of their attestation when certified documents resist forgery and remain checkable."
    ],
    "how": [
      {
        "t": "Attest the document",
        "d": "Record the official certification of the document or copy and the basis for it."
      },
      {
        "t": "Bind issuer and integrity",
        "d": "Link the certification to the issuing authority and seal the content against alteration."
      },
      {
        "t": "Enable independent checks",
        "d": "Provide a verification route so relying parties confirm the certification without manual contact."
      }
    ],
    "faqs": [
      {
        "q": "What is certified document issuance?",
        "a": "Certified document issuance is the process of producing an officially attested document or copy so that its certification, issuer, and integrity can be independently verified."
      },
      {
        "q": "How is a certified document verified?",
        "a": "A verification route linked to the issuing authority confirms the certification and that the document's content has not been altered."
      },
      {
        "q": "Why not just trust an official stamp?",
        "a": "A stamp can be copied; binding the certification to a verifiable seal lets relying parties confirm authenticity rather than assume it."
      }
    ],
    "relatedIndustries": [
      "notarial-authorities",
      "government",
      "justice",
      "civil-registration"
    ],
    "relatedProblems": [
      "certificate-issuance",
      "tamper-evident-certificate",
      "registration-certificate",
      "issuance-workflow", "document-authentication", "document-fraud-prevention"],
    "diagram": "chain",
    "metaTitle": "Certified Document Issuance | Verifiable Attestation",
    "metaDescription": "Certified document issuance produces an officially attested document so its certification, issuer, and integrity can be independently verified."
  },
  {
    "slug": "document-fraud",
    "term": "Document fraud",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Detect document fraud before it spreads",
    "lead": "Fabricated or deceptively altered records can pass as genuine when nothing binds content to a verifiable origin.",
    "definition": "Document fraud is the deliberate creation, alteration, or use of a record intended to deceive, such as inventing content, falsifying figures, or misrepresenting authorship and date.",
    "why": [
      "Fraudulent documents that enter the record can trigger wrongful payments, legal liability, and loss of public trust before detection.",
      "Without a verifiable origin, recipients cannot distinguish a fabricated record from a legitimate one by inspection alone.",
      "Fraud often surfaces only during disputes or audits, when remediation is costly and reputational damage is already done."
    ],
    "how": [
      {
        "t": "Bind content to origin",
        "d": "Governed publication ties each document to an authenticated issuer and an immutable record of its content, so substitutions become visible."
      },
      {
        "t": "Make verification public",
        "d": "Anyone holding a copy can check it against the issuer's sealed reference, shrinking the window where a forgery passes unchallenged."
      },
      {
        "t": "Log every state change",
        "d": "An append-only history records issuance, revision, and revocation, so altered or fabricated versions stand apart from the official one."
      }
    ],
    "faqs": [
      {
        "q": "What is document fraud?",
        "a": "Document fraud is the deliberate creation, alteration, or use of a record intended to deceive, such as inventing content, falsifying figures, or misrepresenting authorship and date."
      },
      {
        "q": "Can governed publication stop all fraud?",
        "a": "No. It does not prevent someone from attempting deception, but it makes tampering tamper-evident and gives recipients a reliable way to verify authenticity, reducing the chance fraud goes undetected."
      },
      {
        "q": "How is fraud detected after the fact?",
        "a": "A sealed reference and append-only history let investigators compare a questioned copy against the authoritative record and pinpoint where it diverges."
      }
    ],
    "relatedIndustries": [
      "government",
      "financial-institutions",
      "justice",
      "regulators"
    ],
    "relatedProblems": [
      "document-forgery",
      "altered-document",
      "fake-certificate",
      "unverifiable-document"
    ],
    "diagram": "shield",
    "metaTitle": "Document Fraud: Detect and Mitigate the Risk",
    "metaDescription": "Document fraud deceives by fabricating or altering records. Learn how governed, tamper-evident publication helps detect fraud and verify authenticity."
  },
  {
    "slug": "document-forgery",
    "term": "Document forgery",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Make forged documents fail verification",
    "lead": "A convincing counterfeit can imitate letterhead and signatures, yet still lack any genuine link to the issuing body.",
    "definition": "Document forgery is the production of a counterfeit record designed to imitate a genuine one, reproducing its appearance, formatting, or signatures to pass as authentic.",
    "why": [
      "Visual fidelity makes forgeries hard to spot, so reliance on appearance alone exposes recipients to deception.",
      "Forged credentials and certificates can unlock access, payments, or legal standing that the holder never legitimately earned.",
      "Once a forgery circulates, distinguishing it from the original requires authoritative reference that informal copies cannot provide."
    ],
    "how": [
      {
        "t": "Anchor to issuer identity",
        "d": "Each genuine record is cryptographically sealed by its authenticated issuer, so a forgery without that seal fails verification."
      },
      {
        "t": "Publish a canonical reference",
        "d": "A single authoritative version lets recipients confirm whether a presented copy matches what the issuer actually published."
      },
      {
        "t": "Expose imitation attempts",
        "d": "Because the seal covers exact content, reproduced appearance alone cannot satisfy verification of a forged copy."
      }
    ],
    "faqs": [
      {
        "q": "What is document forgery?",
        "a": "Document forgery is the production of a counterfeit record designed to imitate a genuine one, reproducing its appearance, formatting, or signatures to pass as authentic."
      },
      {
        "q": "How does forgery differ from fraud?",
        "a": "Forgery focuses on counterfeiting a document's form to look real, while fraud is the broader intent to deceive; a forged document is often the instrument of fraud."
      },
      {
        "q": "Does a seal prevent forgery?",
        "a": "It does not prevent someone from attempting a counterfeit, but it makes forgeries tamper-evident and unverifiable against the issuer's authoritative record."
      }
    ],
    "relatedIndustries": [
      "government",
      "universities",
      "law-enforcement",
      "notarial-authorities"
    ],
    "relatedProblems": [
      "document-fraud",
      "signature-forgery",
      "fake-certificate",
      "unverifiable-document"
    ],
    "diagram": "seal",
    "metaTitle": "Document Forgery: Counterfeits That Fail Checks",
    "metaDescription": "Document forgery counterfeits genuine records. See how issuer-sealed, tamper-evident publication makes forged copies fail verification."
  },
  {
    "slug": "backdating",
    "term": "Backdating",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Prove when a document truly existed",
    "lead": "Assigning a false earlier date to a record can fabricate compliance, priority, or eligibility that never existed at the time.",
    "definition": "Backdating is the practice of marking a document with an earlier date than when it was actually created or finalized, often to imply prior compliance, authorization, or timing advantage.",
    "why": [
      "A backdated approval or contract can manufacture a paper trail that misrepresents when obligations or rights took effect.",
      "Self-asserted dates carry no independent proof, so disputes over timing become difficult to resolve from the document alone.",
      "Backdating undermines deadlines, filing priority, and regulatory windows that depend on trustworthy chronology."
    ],
    "how": [
      {
        "t": "Timestamp at publication",
        "d": "Governed publication records an independent time of sealing that cannot be retroactively reassigned to an earlier date."
      },
      {
        "t": "Anchor order immutably",
        "d": "An append-only ledger fixes the sequence of records, so inserting an earlier-dated document out of order is detectable."
      },
      {
        "t": "Separate stated from sealed date",
        "d": "Verifiers can compare a document's claimed date against its trustworthy publication time to flag inconsistencies."
      }
    ],
    "faqs": [
      {
        "q": "What is backdating?",
        "a": "Backdating is the practice of marking a document with an earlier date than when it was actually created or finalized, often to imply prior compliance, authorization, or timing advantage."
      },
      {
        "q": "Why is backdating a risk?",
        "a": "It can fabricate compliance, contractual priority, or eligibility, distorting deadlines and rights that depend on accurate chronology."
      },
      {
        "q": "How does sealing help?",
        "a": "An independent publication timestamp and append-only ordering establish when a record genuinely existed, making a falsely earlier date detectable."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "financial-institutions",
      "justice",
      "tax-authorities"
    ],
    "relatedProblems": [
      "record-falsification",
      "version-confusion",
      "missing-approval",
      "document-repudiation"
    ],
    "diagram": "ledger",
    "metaTitle": "Backdating: Prove a Document's True Date",
    "metaDescription": "Backdating falsifies when a record existed. Learn how independent timestamps and append-only ordering make backdated documents detectable."
  },
  {
    "slug": "version-confusion",
    "term": "Version confusion",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Always know which version is authoritative",
    "lead": "When multiple drafts circulate without a clear canonical copy, people act on superseded or unapproved text.",
    "definition": "Version confusion is the failure mode in which several variants of a document circulate simultaneously, leaving recipients unsure which one is current, approved, or authoritative.",
    "why": [
      "Acting on an outdated or unapproved version can propagate errors, void approvals, and create contradictory records.",
      "Without a single canonical reference, teams waste effort reconciling copies and disputing which text governs.",
      "Confusion over the current version is a frequent root cause of compliance gaps and contested decisions."
    ],
    "how": [
      {
        "t": "Designate one canonical copy",
        "d": "Governed publication marks exactly one sealed version as authoritative, so recipients can always identify the official text."
      },
      {
        "t": "Track supersession explicitly",
        "d": "A lifecycle record shows which versions are current, superseded, or withdrawn, removing ambiguity."
      },
      {
        "t": "Verify the copy in hand",
        "d": "Anyone can check whether a held copy matches the current authoritative version or an outdated variant."
      }
    ],
    "faqs": [
      {
        "q": "What is version confusion?",
        "a": "Version confusion is the failure mode in which several variants of a document circulate simultaneously, leaving recipients unsure which one is current, approved, or authoritative."
      },
      {
        "q": "Why does it matter?",
        "a": "People may act on superseded or unapproved text, propagating errors and creating contradictory records that are hard to reconcile."
      },
      {
        "q": "How is it mitigated?",
        "a": "Designating a single sealed canonical version and tracking supersession lets anyone confirm which document currently governs."
      }
    ],
    "relatedIndustries": [
      "government",
      "healthcare",
      "standards-bodies",
      "manufacturing"
    ],
    "relatedProblems": [
      "orphaned-document",
      "shadow-document",
      "altered-document",
      "missing-approval"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Version Confusion: Identify the Authoritative Copy",
    "metaDescription": "Version confusion leaves recipients unsure which document is current. Learn how canonical, sealed publication keeps the authoritative version clear."
  },
  {
    "slug": "unauthorized-publication",
    "term": "Unauthorized publication",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Stop records from going out unapproved",
    "lead": "A document released without proper sign-off can commit an institution to positions it never formally adopted.",
    "definition": "Unauthorized publication is the release of a document to recipients or the public without the approvals, authority, or controls the institution requires before issuance.",
    "why": [
      "Premature or rogue releases can disclose draft positions, breach confidentiality, or bind the organization unintentionally.",
      "Once a document is out, retraction rarely undoes the reliance and harm that recipients have already acted upon.",
      "Lack of an enforced gate between approval and release leaves issuance to individual discretion and error."
    ],
    "how": [
      {
        "t": "Gate release on approval",
        "d": "Governed publication permits issuance only after required approvals are recorded, aligning release with authority."
      },
      {
        "t": "Bind authority to issuer",
        "d": "Each published record carries the authenticated identity of the body that authorized it, so unauthorized releases are distinguishable."
      },
      {
        "t": "Record the release event",
        "d": "An append-only log captures who published what and when, supporting investigation if an unauthorized release occurs."
      }
    ],
    "faqs": [
      {
        "q": "What is unauthorized publication?",
        "a": "Unauthorized publication is the release of a document to recipients or the public without the approvals, authority, or controls the institution requires before issuance."
      },
      {
        "q": "What harm can it cause?",
        "a": "It can disclose confidential or draft material and commit the institution to positions it never formally adopted, with limited ability to undo reliance."
      },
      {
        "q": "How does governance reduce it?",
        "a": "Releasing only after recorded approvals and binding issuer authority to each record helps align publication with legitimate sign-off."
      }
    ],
    "relatedIndustries": [
      "government",
      "central-banks",
      "regulators",
      "parliaments"
    ],
    "relatedProblems": [
      "missing-approval",
      "shadow-document",
      "document-repudiation",
      "audit-failure"
    ],
    "diagram": "workflow",
    "metaTitle": "Unauthorized Publication: Gate Release on Approval",
    "metaDescription": "Unauthorized publication releases records without sign-off. Learn how approval-gated, issuer-bound publication mitigates premature or rogue releases."
  },
  {
    "slug": "document-repudiation",
    "term": "Document repudiation",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Make denial of a record untenable",
    "lead": "A party may later deny issuing or approving a document, leaving counterparties without proof of who stood behind it.",
    "definition": "Document repudiation is the denial by an author or signatory that they created, approved, or issued a record, undermining its evidentiary value when no binding proof of origin exists.",
    "why": [
      "If origin cannot be proven, a counterparty can disown commitments, weakening contracts, approvals, and official statements.",
      "Repudiation disputes are slow and costly to resolve when authenticity rests on memory or unverifiable copies.",
      "The absence of non-repudiation erodes confidence that institutional records carry accountable authorship."
    ],
    "how": [
      {
        "t": "Bind issuer cryptographically",
        "d": "A seal tied to the issuer's authenticated identity provides evidence of origin that is difficult to credibly deny."
      },
      {
        "t": "Preserve an immutable record",
        "d": "An append-only history shows that the record was issued under that identity at a specific time."
      },
      {
        "t": "Enable independent verification",
        "d": "Third parties can confirm authorship against the sealed reference without relying on the issuer's cooperation."
      }
    ],
    "faqs": [
      {
        "q": "What is document repudiation?",
        "a": "Document repudiation is the denial by an author or signatory that they created, approved, or issued a record, undermining its evidentiary value when no binding proof of origin exists."
      },
      {
        "q": "Why is non-repudiation important?",
        "a": "It lets counterparties and courts rely on the proven origin of a record, preventing parties from disowning commitments after the fact."
      },
      {
        "q": "How is repudiation mitigated?",
        "a": "Binding each record to an authenticated issuer and preserving an immutable, independently verifiable history makes denial of authorship far harder to sustain."
      }
    ],
    "relatedIndustries": [
      "justice",
      "financial-institutions",
      "notarial-authorities",
      "regulators"
    ],
    "relatedProblems": [
      "signature-forgery",
      "unverifiable-document",
      "record-falsification",
      "backdating"
    ],
    "diagram": "seal",
    "metaTitle": "Document Repudiation: Prove Who Stood Behind It",
    "metaDescription": "Document repudiation denies authorship of a record. Learn how issuer-bound, verifiable sealing provides non-repudiation evidence of origin."
  },
  {
    "slug": "lost-records",
    "term": "Lost records",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Keep critical records findable and intact",
    "lead": "Records scattered across drives and inboxes can become unfindable exactly when an audit or dispute needs them.",
    "definition": "Lost records are documents that an institution can no longer locate, retrieve, or confirm the integrity of, whether through misfiling, system failure, or undocumented handling.",
    "why": [
      "Missing records can defeat audits, legal holds, and regulatory requests, exposing the institution to penalties and adverse inference.",
      "When a record cannot be retrieved, its content and the decisions it supported become unverifiable.",
      "Ad hoc storage without a system of record makes loss likely and recovery uncertain."
    ],
    "how": [
      {
        "t": "Maintain a system of record",
        "d": "Governed publication keeps each official document in a durable, indexed registry rather than scattered copies."
      },
      {
        "t": "Preserve integrity proofs",
        "d": "Sealed references let the institution confirm a retrieved record is intact and unaltered, not just present."
      },
      {
        "t": "Track custody continuously",
        "d": "An append-only history shows where a record has been, reducing undocumented handling that leads to loss."
      }
    ],
    "faqs": [
      {
        "q": "What are lost records?",
        "a": "Lost records are documents that an institution can no longer locate, retrieve, or confirm the integrity of, whether through misfiling, system failure, or undocumented handling."
      },
      {
        "q": "What is the impact of lost records?",
        "a": "They can defeat audits and legal requests and render the decisions they supported unverifiable, exposing the institution to penalties."
      },
      {
        "q": "How does governed publication help?",
        "a": "A durable indexed registry with sealed integrity proofs makes records findable and confirms they are intact when retrieved, reducing loss risk."
      }
    ],
    "relatedIndustries": [
      "archives",
      "government",
      "national-libraries",
      "land-registries"
    ],
    "relatedProblems": [
      "document-loss",
      "orphaned-document",
      "audit-failure",
      "broken-chain-of-custody"
    ],
    "diagram": "ledger",
    "metaTitle": "Lost Records: Keep Documents Findable & Intact",
    "metaDescription": "Lost records defeat audits and disputes. Learn how a governed system of record with integrity proofs keeps documents findable and verifiable."
  },
  {
    "slug": "audit-failure",
    "term": "Audit failure",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Survive scrutiny with a defensible record",
    "lead": "Audits fail when an institution cannot produce complete, authentic evidence of what it published and approved.",
    "definition": "Audit failure is the inability to demonstrate, with reliable evidence, that records were authentic, approved, and unaltered, leaving findings, controls, or decisions unsupportable under examination.",
    "why": [
      "An audit that cannot trace approvals and changes may issue adverse findings, sanctions, or qualified opinions.",
      "Gaps and inconsistencies in the record erode confidence in every related control and decision.",
      "Reconstructing evidence after the fact is unreliable and undermines the institution's credibility."
    ],
    "how": [
      {
        "t": "Produce a complete trail",
        "d": "An append-only history of issuance, approval, and revision gives auditors a continuous, reviewable record."
      },
      {
        "t": "Demonstrate integrity",
        "d": "Sealed references let auditors confirm that examined documents match what was originally published."
      },
      {
        "t": "Tie records to authority",
        "d": "Each record's link to its approving body shows controls operated as intended, supporting audit conclusions."
      }
    ],
    "faqs": [
      {
        "q": "What is audit failure?",
        "a": "Audit failure is the inability to demonstrate, with reliable evidence, that records were authentic, approved, and unaltered, leaving findings, controls, or decisions unsupportable under examination."
      },
      {
        "q": "What causes audit failure?",
        "a": "Incomplete trails, unverifiable documents, and missing approvals leave examiners unable to confirm that controls operated and records are authentic."
      },
      {
        "q": "How does governance reduce it?",
        "a": "A continuous append-only trail, integrity proofs, and records tied to approving authority give auditors defensible evidence under scrutiny."
      }
    ],
    "relatedIndustries": [
      "supreme-audit-institutions",
      "regulators",
      "financial-institutions",
      "government"
    ],
    "relatedProblems": [
      "broken-chain-of-custody",
      "missing-approval",
      "lost-records",
      "record-falsification"
    ],
    "diagram": "ledger",
    "metaTitle": "Audit Failure: Build a Defensible Record",
    "metaDescription": "Audit failure means evidence can't support findings. Learn how append-only trails and integrity proofs help records survive examination."
  },
  {
    "slug": "broken-chain-of-custody",
    "term": "Broken chain of custody",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Keep custody unbroken from issuance on",
    "lead": "A gap in who held a document and when can render it inadmissible or unreliable as evidence.",
    "definition": "A broken chain of custody is a lapse in the documented, continuous record of who controlled a document and when, leaving periods in which it could have been altered, substituted, or mishandled.",
    "why": [
      "Unaccounted gaps invite challenges that a record was tampered with while unsupervised, weakening its evidentiary weight.",
      "Custody breaks can render documents inadmissible or trigger adverse inferences in legal and regulatory proceedings.",
      "Once continuity is lost, it usually cannot be reconstructed credibly after the fact."
    ],
    "how": [
      {
        "t": "Record every transfer",
        "d": "Governed publication logs each handling and access event, leaving no undocumented gap in custody."
      },
      {
        "t": "Seal at each state",
        "d": "Integrity proofs at issuance and change show the record was not altered during periods of control."
      },
      {
        "t": "Make the chain reviewable",
        "d": "An append-only history presents an unbroken, verifiable account of custody for examiners and courts."
      }
    ],
    "faqs": [
      {
        "q": "What is a broken chain of custody?",
        "a": "A broken chain of custody is a lapse in the documented, continuous record of who controlled a document and when, leaving periods in which it could have been altered, substituted, or mishandled."
      },
      {
        "q": "Why does an unbroken chain matter?",
        "a": "Continuous custody supports a record's reliability and admissibility; gaps invite claims of tampering and can lead to exclusion or adverse inference."
      },
      {
        "q": "How is the chain protected?",
        "a": "Logging every transfer, sealing at each state, and presenting an append-only history give a verifiable, continuous account of custody."
      }
    ],
    "relatedIndustries": [
      "justice",
      "law-enforcement",
      "customs-border",
      "regulators"
    ],
    "relatedProblems": [
      "document-tampering",
      "lost-records",
      "audit-failure",
      "document-loss"
    ],
    "diagram": "chain",
    "metaTitle": "Broken Chain of Custody: Keep Custody Unbroken",
    "metaDescription": "A broken chain of custody invites tampering claims. Learn how logged transfers and integrity proofs keep custody continuous and reviewable."
  },
  {
    "slug": "document-tampering",
    "term": "Document tampering",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Make every alteration tamper-evident",
    "lead": "Quiet edits to a published record can change obligations and facts without leaving any obvious trace.",
    "definition": "Document tampering is the unauthorized alteration of a record's content after it was finalized, such as changing figures, terms, or text to misrepresent its meaning.",
    "why": [
      "Subtle edits can shift liabilities, approvals, or facts while the document still appears legitimate.",
      "If alteration leaves no trace, recipients have no way to know they are relying on a corrupted record.",
      "Tampering disputes are hard to resolve without an authoritative reference for the original content."
    ],
    "how": [
      {
        "t": "Seal exact content",
        "d": "A cryptographic seal covers the precise content, so any later alteration breaks verification and becomes tamper-evident."
      },
      {
        "t": "Preserve the original",
        "d": "An immutable reference retains the published content for comparison against any questioned copy."
      },
      {
        "t": "Log authorized changes",
        "d": "Legitimate revisions are recorded as new sealed versions, distinguishing them from unauthorized edits."
      }
    ],
    "faqs": [
      {
        "q": "What is document tampering?",
        "a": "Document tampering is the unauthorized alteration of a record's content after it was finalized, such as changing figures, terms, or text to misrepresent its meaning."
      },
      {
        "q": "Can tampering be prevented entirely?",
        "a": "No. Governed publication does not stop someone from editing a copy, but it makes alterations tamper-evident and verifiable against the sealed original."
      },
      {
        "q": "How is tampering detected?",
        "a": "Because a seal covers exact content, any change breaks verification, and the immutable original allows precise comparison."
      }
    ],
    "relatedIndustries": [
      "justice",
      "financial-institutions",
      "regulators",
      "healthcare"
    ],
    "relatedProblems": [
      "altered-document",
      "document-fraud",
      "broken-chain-of-custody",
      "record-falsification"
    ],
    "diagram": "seal",
    "metaTitle": "Document Tampering: Make Alterations Evident",
    "metaDescription": "Document tampering alters finalized records quietly. Learn how content sealing makes alterations tamper-evident and verifiable against the original."
  },
  {
    "slug": "fake-certificate",
    "term": "Fake certificate",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Verify certificates against the issuer",
    "lead": "Counterfeit diplomas, licences, and compliance certificates grant standing their holders never earned.",
    "definition": "A fake certificate is a counterfeit or fraudulently obtained attestation, such as a diploma, licence, or compliance record, presented to claim a qualification or status that was not genuinely granted.",
    "why": [
      "Accepting a fake certificate can place unqualified individuals in regulated roles or grant undeserved benefits.",
      "Visual checks fail against high-quality counterfeits, and issuing bodies are often slow to confirm authenticity.",
      "Undetected fake certificates expose institutions to safety, legal, and reputational consequences."
    ],
    "how": [
      {
        "t": "Seal certificates at issuance",
        "d": "Genuine certificates are cryptographically sealed by the issuing body, so counterfeits without that seal fail verification."
      },
      {
        "t": "Offer instant verification",
        "d": "Relying parties can confirm a certificate against the issuer's authoritative record rather than trusting its appearance."
      },
      {
        "t": "Support revocation status",
        "d": "A lifecycle record shows whether a certificate remains valid, revoked, or expired."
      }
    ],
    "faqs": [
      {
        "q": "What is a fake certificate?",
        "a": "A fake certificate is a counterfeit or fraudulently obtained attestation, such as a diploma, licence, or compliance record, presented to claim a qualification or status that was not genuinely granted."
      },
      {
        "q": "Why are fake certificates dangerous?",
        "a": "They can place unqualified people in regulated roles or grant undeserved benefits, creating safety, legal, and reputational risk."
      },
      {
        "q": "How can a certificate be verified?",
        "a": "Sealing certificates at issuance lets relying parties verify them against the issuer's authoritative record and check revocation status, rather than trusting appearance."
      }
    ],
    "relatedIndustries": [
      "universities",
      "professional-bodies",
      "regulators",
      "government"
    ],
    "relatedProblems": [
      "document-forgery",
      "unverifiable-document",
      "document-fraud",
      "altered-document"
    ],
    "diagram": "shield",
    "metaTitle": "Fake Certificate: Verify Against the Issuer",
    "metaDescription": "Fake certificates claim unearned status. Learn how issuer-sealed certificates and instant verification expose counterfeits and show revocation status."
  },
  {
    "slug": "altered-document",
    "term": "Altered document",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Detect changes against the original",
    "lead": "A genuine record that has been quietly edited can mislead more effectively than an obvious forgery.",
    "definition": "An altered document is a genuine record whose content has been modified after issuance, whether by addition, deletion, or substitution, so that it no longer matches the version originally published.",
    "why": [
      "Because the document began as authentic, alterations can be especially convincing and hard to challenge.",
      "Modified figures, dates, or clauses can change rights and obligations while the document still looks official.",
      "Without the original for comparison, recipients cannot tell an altered copy from the genuine one."
    ],
    "how": [
      {
        "t": "Preserve the sealed original",
        "d": "Governed publication retains the originally published content as an immutable reference for comparison."
      },
      {
        "t": "Verify content exactly",
        "d": "A seal over precise content means any alteration breaks verification and is flagged as tamper-evident."
      },
      {
        "t": "Distinguish official revisions",
        "d": "Authorized changes appear as new sealed versions, separating legitimate updates from unauthorized alteration."
      }
    ],
    "faqs": [
      {
        "q": "What is an altered document?",
        "a": "An altered document is a genuine record whose content has been modified after issuance, whether by addition, deletion, or substitution, so that it no longer matches the version originally published."
      },
      {
        "q": "How is alteration different from forgery?",
        "a": "Alteration changes a genuine record after issuance, while forgery creates a counterfeit from scratch; both misrepresent the authentic content."
      },
      {
        "q": "How is an altered document detected?",
        "a": "Comparing a copy against the sealed original and verifying exact content makes any post-issuance change tamper-evident."
      }
    ],
    "relatedIndustries": [
      "justice",
      "land-registries",
      "financial-institutions",
      "regulators"
    ],
    "relatedProblems": [
      "document-tampering",
      "record-falsification",
      "version-confusion",
      "document-fraud"
    ],
    "diagram": "seal",
    "metaTitle": "Altered Document: Detect Changes vs the Original",
    "metaDescription": "An altered document edits a genuine record after issuance. Learn how a sealed original and exact verification make alterations tamper-evident."
  },
  {
    "slug": "missing-approval",
    "term": "Missing approval",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "No issuance without recorded sign-off",
    "lead": "A document that was published without its required approvals carries authority it never legitimately received.",
    "definition": "Missing approval is the failure mode in which a document is finalized or issued without the sign-offs the institution requires, leaving its authority and validity unsupported.",
    "why": [
      "Records issued without required approvals may be invalid, unenforceable, or non-compliant from the outset.",
      "Gaps in approval undermine audits and expose decision-makers to accountability for steps that were skipped.",
      "When approvals are tracked informally, omissions are easy to miss until a dispute or examination."
    ],
    "how": [
      {
        "t": "Require approvals before issuance",
        "d": "Governed publication permits release only when the required sign-offs are recorded, preventing un-approved issuance."
      },
      {
        "t": "Record each approval",
        "d": "An append-only log captures who approved what and when, making the approval chain reviewable."
      },
      {
        "t": "Expose gaps on verification",
        "d": "Verifiers can confirm that a record carries its required approvals rather than assuming they exist."
      }
    ],
    "faqs": [
      {
        "q": "What is missing approval?",
        "a": "Missing approval is the failure mode in which a document is finalized or issued without the sign-offs the institution requires, leaving its authority and validity unsupported."
      },
      {
        "q": "Why is it a problem?",
        "a": "Records issued without required approvals may be invalid or non-compliant, undermine audits, and expose decision-makers to accountability."
      },
      {
        "q": "How does governance address it?",
        "a": "Requiring recorded approvals before issuance and logging each sign-off makes the approval chain enforceable and reviewable."
      }
    ],
    "relatedIndustries": [
      "government",
      "healthcare",
      "regulators",
      "financial-institutions"
    ],
    "relatedProblems": [
      "unauthorized-publication",
      "audit-failure",
      "version-confusion",
      "shadow-document"
    ],
    "diagram": "workflow",
    "metaTitle": "Missing Approval: No Issuance Without Sign-Off",
    "metaDescription": "Missing approval issues records without required sign-offs. Learn how approval-gated publication makes the approval chain enforceable and reviewable."
  },
  {
    "slug": "orphaned-document",
    "term": "Orphaned document",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Leave no record without an owner",
    "lead": "Records with no clear owner, source, or context drift out of governance and lose their authority over time.",
    "definition": "An orphaned document is a record that has lost its connection to an accountable owner, originating system, or governing context, making its status, authority, and currency impossible to confirm.",
    "why": [
      "Without an owner, no one maintains, retires, or vouches for the record, so its reliability decays.",
      "Orphaned records can be mistaken for authoritative even when superseded or never approved.",
      "They accumulate as institutional liabilities that surface unpredictably during audits and disputes."
    ],
    "how": [
      {
        "t": "Bind ownership at issuance",
        "d": "Governed publication attaches an accountable owner and origin to every record, preventing orphaning."
      },
      {
        "t": "Maintain governing context",
        "d": "Lifecycle metadata keeps each record linked to its status, authority, and currency."
      },
      {
        "t": "Flag unmanaged records",
        "d": "Records lacking governance links can be identified and remediated rather than circulating unchecked."
      }
    ],
    "faqs": [
      {
        "q": "What is an orphaned document?",
        "a": "An orphaned document is a record that has lost its connection to an accountable owner, originating system, or governing context, making its status, authority, and currency impossible to confirm."
      },
      {
        "q": "Why are orphaned documents risky?",
        "a": "With no owner to maintain or retire them, they can be mistaken for authoritative even when superseded, becoming liabilities in audits and disputes."
      },
      {
        "q": "How are they prevented?",
        "a": "Binding an accountable owner and governing context to each record at issuance, and flagging unmanaged records, keeps documents within governance."
      }
    ],
    "relatedIndustries": [
      "archives",
      "government",
      "universities",
      "national-libraries"
    ],
    "relatedProblems": [
      "shadow-document",
      "lost-records",
      "version-confusion",
      "document-loss"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Orphaned Document: Leave No Record Ownerless",
    "metaDescription": "An orphaned document loses its owner and context. Learn how binding ownership and governing context at issuance keeps records accountable."
  },
  {
    "slug": "shadow-document",
    "term": "Shadow document",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Surface records outside official control",
    "lead": "Unofficial copies and side versions circulate outside governance, competing with the authoritative record.",
    "definition": "A shadow document is an unofficial or unsanctioned copy or variant of a record that circulates outside the institution's controlled system, competing with the authoritative version.",
    "why": [
      "Shadow copies may be outdated, altered, or never approved, yet recipients can mistake them for official.",
      "Decisions based on shadow documents diverge from the governed record, creating inconsistency and risk.",
      "Because they live outside controls, shadow documents evade approval, retention, and verification."
    ],
    "how": [
      {
        "t": "Establish a canonical source",
        "d": "Governed publication provides one authoritative version recipients can rely on instead of informal copies."
      },
      {
        "t": "Enable copy verification",
        "d": "Anyone can check whether a document in hand matches the official record or is an unsanctioned shadow copy."
      },
      {
        "t": "Govern the full lifecycle",
        "d": "Controlled issuance, revision, and retirement reduce the gaps where shadow documents take hold."
      }
    ],
    "faqs": [
      {
        "q": "What is a shadow document?",
        "a": "A shadow document is an unofficial or unsanctioned copy or variant of a record that circulates outside the institution's controlled system, competing with the authoritative version."
      },
      {
        "q": "Why are shadow documents a problem?",
        "a": "They may be outdated, altered, or unapproved yet be mistaken for official, leading to inconsistent decisions outside governance."
      },
      {
        "q": "How are they mitigated?",
        "a": "A canonical authoritative source and copy verification let recipients distinguish the official record from unsanctioned shadow copies."
      }
    ],
    "relatedIndustries": [
      "government",
      "healthcare",
      "financial-institutions",
      "manufacturing"
    ],
    "relatedProblems": [
      "orphaned-document",
      "version-confusion",
      "unauthorized-publication",
      "unverifiable-document"
    ],
    "diagram": "shield",
    "metaTitle": "Shadow Document: Surface Records Outside Control",
    "metaDescription": "A shadow document circulates outside governance. Learn how a canonical source and copy verification distinguish official records from shadow copies."
  },
  {
    "slug": "signature-forgery",
    "term": "Signature forgery",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Bind signatures to verifiable identity",
    "lead": "A forged or copied signature can fabricate consent and authority that the named party never gave.",
    "definition": "Signature forgery is the unauthorized reproduction or fabrication of a person's or institution's signature to make a document appear approved, signed, or authorized by them.",
    "why": [
      "A forged signature can fabricate consent, approval, or liability that the named party never granted.",
      "Handwritten and image-based signatures are easily copied and offer no reliable proof of who signed.",
      "Disputes over a contested signature are difficult to resolve without verifiable proof of authorship."
    ],
    "how": [
      {
        "t": "Bind to authenticated identity",
        "d": "Governed publication ties a signature to a verified issuer identity rather than a copyable image or mark."
      },
      {
        "t": "Seal signed content",
        "d": "A cryptographic seal links the signatory to exact content, so a pasted or forged signature fails verification."
      },
      {
        "t": "Provide non-repudiation evidence",
        "d": "Verifiable proof of who signed and what they signed supports resolution of contested signatures."
      }
    ],
    "faqs": [
      {
        "q": "What is signature forgery?",
        "a": "Signature forgery is the unauthorized reproduction or fabrication of a person's or institution's signature to make a document appear approved, signed, or authorized by them."
      },
      {
        "q": "Why is it hard to detect?",
        "a": "Handwritten and image-based signatures are easily copied and offer no reliable proof of who actually signed, making contested signatures hard to resolve."
      },
      {
        "q": "How is forgery mitigated?",
        "a": "Binding a signature to an authenticated identity and sealing it over exact content makes forged or pasted signatures tamper-evident and verifiable."
      }
    ],
    "relatedIndustries": [
      "notarial-authorities",
      "justice",
      "financial-institutions",
      "government"
    ],
    "relatedProblems": [
      "document-forgery",
      "document-repudiation",
      "document-fraud",
      "altered-document"
    ],
    "diagram": "seal",
    "metaTitle": "Signature Forgery: Bind Signatures to Identity",
    "metaDescription": "Signature forgery fabricates consent. Learn how binding signatures to authenticated identity and sealed content makes forged signatures verifiable."
  },
  {
    "slug": "record-falsification",
    "term": "Record falsification",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Make falsified entries stand out",
    "lead": "Editing, inserting, or deleting entries in official records can rewrite the institutional account of events.",
    "definition": "Record falsification is the deliberate creation, alteration, or removal of entries in official records to misrepresent facts, transactions, or events.",
    "why": [
      "Falsified records can conceal misconduct, misstate finances, or distort the official account of what occurred.",
      "Editable registers without integrity controls allow entries to be changed or deleted without trace.",
      "When the record itself is corrupted, downstream reports, audits, and decisions inherit the falsehood."
    ],
    "how": [
      {
        "t": "Use append-only records",
        "d": "An immutable, append-only ledger prevents silent editing or deletion of past entries."
      },
      {
        "t": "Seal each entry",
        "d": "Integrity proofs over each record make insertions and alterations tamper-evident."
      },
      {
        "t": "Preserve a verifiable history",
        "d": "A continuous sealed history lets examiners detect where the record was falsified."
      }
    ],
    "faqs": [
      {
        "q": "What is record falsification?",
        "a": "Record falsification is the deliberate creation, alteration, or removal of entries in official records to misrepresent facts, transactions, or events."
      },
      {
        "q": "Why is it serious?",
        "a": "It can conceal misconduct and misstate finances, and because downstream reports rely on the record, the falsehood propagates into audits and decisions."
      },
      {
        "q": "How is it mitigated?",
        "a": "Append-only records, sealed entries, and a verifiable history make insertions, edits, and deletions tamper-evident rather than silent."
      }
    ],
    "relatedIndustries": [
      "financial-institutions",
      "tax-authorities",
      "supreme-audit-institutions",
      "regulators"
    ],
    "relatedProblems": [
      "document-tampering",
      "backdating",
      "audit-failure",
      "document-fraud"
    ],
    "diagram": "ledger",
    "metaTitle": "Record Falsification: Make Entries Tamper-Evident",
    "metaDescription": "Record falsification rewrites official entries. Learn how append-only records and sealed entries make insertions and deletions tamper-evident."
  },
  {
    "slug": "document-loss",
    "term": "Document loss",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Preserve records against permanent loss",
    "lead": "Format decay, system migrations, and deletion can erase records the institution is obligated to keep.",
    "definition": "Document loss is the permanent disappearance or destruction of a record through deletion, corruption, format obsolescence, or failed preservation, removing both its content and evidentiary value.",
    "why": [
      "Losing a required record can breach retention obligations and defeat legal, audit, and historical needs.",
      "Format obsolescence and failed migrations can make records unreadable even when files survive.",
      "Loss is often irreversible, so prevention matters more than recovery."
    ],
    "how": [
      {
        "t": "Maintain durable preservation",
        "d": "Governed publication keeps records in a managed registry with retention and redundancy rather than fragile copies."
      },
      {
        "t": "Verify integrity over time",
        "d": "Sealed references let the institution confirm preserved records remain intact and readable, not silently corrupted."
      },
      {
        "t": "Track lifecycle and retention",
        "d": "Lifecycle controls govern when records are retained or retired, preventing premature or accidental loss."
      }
    ],
    "faqs": [
      {
        "q": "What is document loss?",
        "a": "Document loss is the permanent disappearance or destruction of a record through deletion, corruption, format obsolescence, or failed preservation, removing both its content and evidentiary value."
      },
      {
        "q": "How does it differ from lost records?",
        "a": "Lost records may still exist but cannot be located, whereas document loss means the record is permanently gone or unreadable."
      },
      {
        "q": "How is loss mitigated?",
        "a": "Durable managed preservation, ongoing integrity verification, and lifecycle retention controls reduce the risk of permanent or premature loss."
      }
    ],
    "relatedIndustries": [
      "archives",
      "national-libraries",
      "government",
      "museums"
    ],
    "relatedProblems": [
      "lost-records",
      "orphaned-document",
      "broken-chain-of-custody",
      "audit-failure"
    ],
    "diagram": "lifecycle",
    "metaTitle": "Document Loss: Preserve Records Durably",
    "metaDescription": "Document loss permanently erases records. Learn how durable preservation, integrity checks, and retention controls reduce the risk of loss."
  },
  {
    "slug": "unverifiable-document",
    "term": "Unverifiable document",
    "category": "Legal & evidentiary",
    "kicker": "Risk & failure modes",
    "headline": "Give every record a way to be checked",
    "lead": "A record no one can independently confirm carries little evidentiary weight, however genuine it may be.",
    "definition": "An unverifiable document is a record whose authenticity, origin, or integrity cannot be independently confirmed, leaving recipients to trust it on appearance alone.",
    "why": [
      "When authenticity cannot be confirmed, even genuine records are open to challenge and carry weak evidentiary value.",
      "Recipients forced to rely on appearance cannot distinguish authentic records from altered or forged ones.",
      "Unverifiable documents slow transactions and disputes that hinge on proving a record is what it claims."
    ],
    "how": [
      {
        "t": "Attach verifiable proof",
        "d": "Governed publication seals each record with proof of origin and integrity that anyone can check."
      },
      {
        "t": "Enable independent checking",
        "d": "Recipients verify a document against the issuer's authoritative reference without needing the issuer's involvement."
      },
      {
        "t": "Expose status clearly",
        "d": "Verification reveals whether a record is authentic, altered, current, or revoked."
      }
    ],
    "faqs": [
      {
        "q": "What is an unverifiable document?",
        "a": "An unverifiable document is a record whose authenticity, origin, or integrity cannot be independently confirmed, leaving recipients to trust it on appearance alone."
      },
      {
        "q": "Why is verifiability important?",
        "a": "Without it, even genuine records are open to challenge and carry weak evidentiary value, since recipients cannot prove the record is what it claims."
      },
      {
        "q": "How is a document made verifiable?",
        "a": "Sealing each record with proof of origin and integrity lets recipients independently confirm its authenticity, currency, and revocation status."
      }
    ],
    "relatedIndustries": [
      "regulators",
      "justice",
      "financial-institutions",
      "notarial-authorities"
    ],
    "relatedProblems": [
      "fake-certificate",
      "document-repudiation",
      "document-fraud",
      "shadow-document"
    ],
    "diagram": "shield",
    "metaTitle": "Unverifiable Document: Give Records a Way to Check",
    "metaDescription": "An unverifiable document can't confirm its authenticity. Learn how sealed proof of origin and integrity makes records independently verifiable."
  },
];

export const problemBySlug = (slug?: string): Problem | undefined =>
  PROBLEMS.find((p) => p.slug === slug);

export const PROBLEM_CATEGORIES: string[] = PROBLEMS.reduce<string[]>((acc, p) => {
  if (!acc.includes(p.category)) acc.push(p.category);
  return acc;
}, []);
