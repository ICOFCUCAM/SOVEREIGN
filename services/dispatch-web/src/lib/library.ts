// Layer 4 of the SEO ecosystem — the Knowledge Library. Long-form, authoritative
// articles (the "pillar" content) that establish topical authority and earn
// citations and links. Distinct from Layer 3 (/learn) concept pages: these are
// guides and deep-dives, cross-linked to the concept pages and the industry
// pages. Engineered for Article + FAQPage structured data and deep internal links.

export interface ArticleSection {
  h: string;        // section heading (anchored)
  p: string[];      // paragraphs
  list?: string[];  // optional bullet list under the paragraphs
}

export interface Article {
  slug: string;
  title: string;
  dek: string;            // standfirst / subtitle
  category: string;
  kicker: string;
  updated: string;        // ISO date, e.g. "2026-06-27"
  readingMinutes: number;
  intro: string[];        // 1–3 lead paragraphs
  sections: ArticleSection[];
  keyPoints: string[];    // "key takeaways"
  faqs: { q: string; a: string }[];
  relatedConcepts: string[];   // /learn slugs
  relatedIndustries: string[]; // industry slugs
  relatedArticles: string[];   // other library slugs
  metaTitle: string;
  metaDescription: string;
}

export const LIBRARY_BASE = "/library";

export const ARTICLES: Article[] = [
  {
    slug: "what-is-an-official-record",
    title: "What Is an Official Record?",
    dek: "An Official Record is more than a document — it is a publication an institution can prove is genuine, authorised and unaltered for as long as it matters. This guide explains what that means and why it is different from an ordinary file.",
    category: "Foundations",
    kicker: "Foundations",
    updated: "2026-06-27",
    readingMinutes: 8,
    intro: [
      "Every institution publishes documents — orders, policies, certificates, decisions, notices. Most of them are ordinary files: a PDF, a scanned page, an email attachment. They look authoritative, but if challenged, the institution often cannot prove that a given file is the genuine, current, authorised version. An Official Record is the answer to that problem.",
      "An Official Record is a publication that an institution issues under its own authority, through a governed process, and seals so that anyone can later confirm it is genuine and unaltered. It carries its own proof. This guide explains what an Official Record is, what makes a document 'official', and how it differs from the documents most organisations rely on today.",
    ],
    sections: [
      {
        h: "The difference between a document and an Official Record",
        p: [
          "A document is content — words in a file. An Official Record is content plus three things the file alone cannot supply: authority, governance, and verifiability. Authority means it was issued under the standing of an office, not merely typed by a person. Governance means it passed an enforced approval process before it was released. Verifiability means anyone can later confirm both of those facts, and that the file has not changed since.",
          "This distinction matters because appearances are not proof. A letterhead, a signature, a stamp — all can be copied. A convincing forgery looks exactly like the real thing. What separates an Official Record from a convincing copy is not how it looks, but whether its authenticity can be independently checked.",
        ],
      },
      {
        h: "Authority bound to an office, not a person",
        p: [
          "Institutions are continuous; the people who staff them are not. An order signed today must remain valid when the official who signed it has moved on, retired, or been replaced. If authority is tied to an individual, it weakens the moment that individual leaves.",
          "An Official Record binds publication to the authority of an office. The decision was issued by the Registrar, the Minister, the Board — roles that persist. That is what keeps the record authoritative across every change of personnel and government, for the full period it must be relied on.",
        ],
      },
      {
        h: "Governed before publication, not after",
        p: [
          "The defining feature of an Official Record is that governance happens before the document is released, not reconstructed afterwards. An enforced approval chain runs first: the right offices approve, in the right order, bound to the exact version. Only the document that completes that chain is published as official.",
          "This is the opposite of how most publication works today, where the file is sent and the proof of approval — if it exists at all — is scattered across inboxes and meeting notes, to be gathered under pressure if anyone ever asks. With an Official Record, the evidence of authorisation is captured as the record is made.",
        ],
      },
      {
        h: "Permanently verifiable by anyone",
        p: [
          "An Official Record carries a permanent identifier and an integrity proof. The identifier resolves to the institution's authoritative record; the integrity proof ties the exact file to that record, so that altering a single byte breaks verification. Together they let anyone holding the document confirm that it is genuine and unaltered.",
          "Crucially, verification requires no account and no privileged access. A citizen, a court, a counterparty, another agency — anyone can check. Trust that depends on calling the issuer to confirm does not scale and fails exactly when the issuer is hardest to reach. An Official Record makes trust self-service.",
        ],
      },
      {
        h: "Why institutions need Official Records",
        p: [
          "The cost of not having them is paid later, and unpredictably: a regulation challenged in court, a certificate suspected of forgery, an audit that becomes an archaeology project, a decision whose approval no one can reconstruct. In each case the institution is forced to assert its authority rather than prove it.",
          "Official Records turn that exposure into routine. Because authority, governance and verifiability are built in at the moment of publication, responding to a challenge becomes retrieval rather than reconstruction — and the institution can stand behind every record it has issued.",
        ],
        list: [
          "Authority that outlives the individual who signed",
          "Approval proven, not asserted, on the exact version",
          "Any recipient can verify genuineness with no account",
          "Audits and challenges become retrieval, not reconstruction",
        ],
      },
    ],
    keyPoints: [
      "An Official Record is a publication issued under an institution's authority, governed before release, and permanently verifiable.",
      "It differs from an ordinary document by carrying its own proof of authority, approval and integrity.",
      "Authority is bound to an office, so the record stays valid across changes of personnel.",
      "Anyone can verify an Official Record independently, with no account.",
    ],
    faqs: [
      { q: "What makes a record official?", a: "A record is official when it is issued under an institution's authority through a governed approval process and is permanently verifiable — anyone can confirm who issued it and that it has not changed." },
      { q: "Is a signed PDF an Official Record?", a: "Not necessarily. A signature can be copied and a PDF can be altered. An Official Record adds authority bound to an office and an integrity proof anyone can verify independently." },
      { q: "How long does an Official Record stay valid?", a: "For as long as it must be relied on — often years or decades. Because authority is bound to an office and integrity is sealed, the record remains provable across that whole period." },
    ],
    relatedConcepts: ["official-publication", "document-authenticity", "governance-certificate", "document-verification"],
    relatedIndustries: ["government", "regulators", "justice", "central-banks"],
    relatedArticles: ["pdf-vs-official-publication", "the-publication-lifecycle", "what-is-document-governance"],
    metaTitle: "What Is an Official Record? A Complete Guide",
    metaDescription: "An Official Record is a publication issued under an institution's authority, governed before release and permanently verifiable. Learn what makes a record official and why it matters.",
  },
  {
    slug: "pdf-vs-official-publication",
    title: "The Difference Between a PDF and an Official Publication",
    dek: "A PDF carries content. An Official Publication carries proof. This guide explains why the format of a file says nothing about its authority — and what closes the gap.",
    category: "Foundations",
    kicker: "Foundations",
    updated: "2026-06-27",
    readingMinutes: 7,
    intro: [
      "Ask most organisations how they publish official documents and the answer is some version of: we make a PDF and send it. The PDF has become the default unit of institutional publication because it looks fixed and final. But 'looks fixed' and 'is provable' are very different things.",
      "This guide explains the difference between a PDF — a file format — and an Official Publication — a governed, verifiable act of an institution. Understanding the gap is the first step to closing it.",
    ],
    sections: [
      {
        h: "A PDF is a format, not an authority",
        p: [
          "PDF stands for Portable Document Format. It is a way of laying out content so it renders the same everywhere. That is genuinely useful — but it is a presentation property, not an authority property. A PDF says nothing about who issued the document, whether it was approved, or whether it has been altered since.",
          "Anyone can create a PDF. Anyone can edit one and re-save it. A PDF of a regulation, a certificate, or a board resolution is simply a copy of some content; nothing in the format ties it back to the institution that supposedly issued it, or proves it is the current version.",
        ],
      },
      {
        h: "Why 'looks final' is not 'is final'",
        p: [
          "Part of the PDF's appeal is that it feels locked — it is harder to casually edit than a word-processor file. But 'harder to edit' is not 'tamper-evident'. A determined editor can change a PDF and leave no visible trace, and the recipient has no reliable way to tell.",
          "The result is version confusion and quiet forgery. A superseded policy keeps circulating as if current. An altered certificate passes because it looks right. The institution cannot point to a single authoritative version, because every copy looks equally official.",
        ],
      },
      {
        h: "What an Official Publication adds",
        p: [
          "An Official Publication keeps the convenience of a portable file but adds the three things a PDF lacks: it is issued under the authority of an office, it is governed by an enforced approval chain before release, and it is sealed with an integrity proof and a permanent identifier so anyone can verify it.",
          "In practice this means the file can still be a PDF — but it is now backed by a record. Verifying the document confirms that the specific file is the genuine, approved, unaltered version, and reveals who issued it and under what authority.",
        ],
        list: [
          "PDF: portable layout, no proof of origin, approval or integrity",
          "Official Publication: portable file PLUS verifiable authority, governance and integrity",
          "PDF: every copy looks equally official",
          "Official Publication: one authoritative record any copy can be checked against",
        ],
      },
      {
        h: "You do not have to abandon PDFs",
        p: [
          "The point is not that PDFs are bad. They are a fine delivery format. The point is that the format is not where authority lives. Authority lives in governance and verifiability — and those have to be added deliberately.",
          "Sovereign Dispatch governs the publication and seals the record, then lets the document travel as a normal file. Recipients get something they already know how to open; institutions get something they can finally prove.",
        ],
      },
    ],
    keyPoints: [
      "A PDF is a presentation format; it carries no proof of who issued a document or whether it changed.",
      "'Looks final' is not 'tamper-evident' — a PDF can be altered without visible trace.",
      "An Official Publication adds authority, governance and a verifiable integrity proof.",
      "You can keep using PDFs as the delivery format while backing them with a verifiable record.",
    ],
    faqs: [
      { q: "Is a PDF legally valid?", a: "A PDF can hold legally relevant content, but the format itself does not prove who issued it or that it is unaltered. Legal weight comes from authority and verifiability, which a plain PDF lacks." },
      { q: "Can a PDF be tampered with?", a: "Yes. A PDF can be edited and re-saved with no visible trace. Without an integrity proof, a recipient cannot reliably tell an altered PDF from the original." },
      { q: "How do I make a PDF an official publication?", a: "Govern its approval and seal it with a verifiable integrity proof and a permanent record ID, so the file can be checked against the institution's authoritative record. Sovereign Dispatch does this while keeping the file portable." },
    ],
    relatedConcepts: ["official-publication", "tamper-proof-publication", "document-verification", "document-authenticity"],
    relatedIndustries: ["government", "universities", "healthcare", "civil-registration"],
    relatedArticles: ["what-is-an-official-record", "what-is-document-governance", "understanding-evidence-chains"],
    metaTitle: "PDF vs Official Publication — What's the Difference?",
    metaDescription: "A PDF is a format; an Official Publication is a governed, verifiable act of an institution. Learn why a file's format says nothing about its authority — and what closes the gap.",
  },
  {
    slug: "the-publication-lifecycle",
    title: "The Publication Lifecycle: From Draft to Permanent Record",
    dek: "Every official document travels the same path — create, review, approve, authorise, publish, certify, verify, preserve. This guide walks each stage and shows where authority and proof are won or lost.",
    category: "Foundations",
    kicker: "Foundations",
    updated: "2026-06-27",
    readingMinutes: 9,
    intro: [
      "Official publication is not a single act; it is a lifecycle. A document is created, reviewed, approved, authorised, published, certified, verified and preserved. At each stage, an institution either builds the authority and proof that make the result trustworthy — or it skips them, and pays later.",
      "This guide walks the publication lifecycle stage by stage. Understanding it explains why scattered, ad-hoc publishing is so fragile, and what a governed lifecycle produces instead: a permanent record an institution can stand behind.",
    ],
    sections: [
      {
        h: "Create and review",
        p: [
          "Every publication begins as a draft. In the create and review stages the content takes shape and is checked — for accuracy, for legal soundness, for fit with existing policy. The risk here is not the drafting itself but losing track of which version is which once several people are involved.",
          "A governed lifecycle keeps one working record and captures who contributed and reviewed, so that when the document later becomes official, it is unambiguous which exact version was approved.",
        ],
      },
      {
        h: "Approve and authorise",
        p: [
          "Approval is where governance is won or lost. The right offices must sign off, in the right order, bound to the exact version under review. Authorisation is the final step that gives the document the standing of the institution — issued under the authority of an office.",
          "When this happens in email and meetings, the proof of approval is fragile and incomplete. When it happens through an enforced chain, the evidence of who authorised what, and when, is captured as it occurs — not reconstructed afterwards.",
        ],
      },
      {
        h: "Publish and certify",
        p: [
          "Publishing releases the authorised document. Certification seals it: a permanent identifier and an integrity proof are bound to the exact file, producing the record that anyone can later verify. This is the moment an ordinary document becomes an Official Record.",
          "Certification is what makes the difference between sending a copy and issuing a record. The certificate travels with the publication and proves both its integrity and the governance behind it.",
        ],
      },
      {
        h: "Verify and preserve",
        p: [
          "Verification is the lifecycle turned outward: anyone holding the document can confirm it is genuine and unaltered, with no account. Preservation is the lifecycle turned forward: the record, its integrity proof and its approval chain are kept so the document remains provable for its full retention life.",
          "These last two stages are where the value compounds. A record that can be verified by anyone, and preserved as provable for decades, is an asset the institution can rely on long after the original authors have gone.",
        ],
        list: [
          "Create — the draft takes shape",
          "Review — accuracy and soundness are checked",
          "Approve — the right offices sign off, in order, on the exact version",
          "Authorise — the document gains the standing of an office",
          "Publish — the authorised document is released",
          "Certify — it is sealed into a verifiable Official Record",
          "Verify — anyone can confirm it is genuine and unaltered",
          "Preserve — it stays provable for its full retention life",
        ],
      },
      {
        h: "Why the lifecycle has to be governed end to end",
        p: [
          "A chain is only as strong as its weakest link, and the publication lifecycle is a chain. Perfect drafting cannot rescue a missing approval; a careful approval is wasted if the published file is not sealed. The stages reinforce each other only when they are governed together.",
          "That is the case for treating publication as one governed lifecycle rather than a series of disconnected steps. The output is not just a document that was published, but a record whose entire history can be proven — from first draft to permanent archive.",
        ],
      },
    ],
    keyPoints: [
      "Official publication is a lifecycle: create, review, approve, authorise, publish, certify, verify, preserve.",
      "Approval and authorisation are where governance is won or lost.",
      "Certification is the moment an ordinary document becomes a verifiable Official Record.",
      "The lifecycle is only trustworthy when governed end to end — a weak stage undermines the rest.",
    ],
    faqs: [
      { q: "What are the stages of the publication lifecycle?", a: "Create, review, approve, authorise, publish, certify, verify and preserve. Each stage builds the authority and proof that make the final record trustworthy." },
      { q: "At what point does a document become official?", a: "At certification — when the authorised document is sealed with an integrity proof and a permanent identifier, producing a record anyone can verify." },
      { q: "Why govern the whole lifecycle instead of just approval?", a: "Because the stages reinforce each other. A careful approval is wasted if the published file is not sealed; governing the lifecycle end to end is what makes the whole record provable." },
    ],
    relatedConcepts: ["policy-approval-workflow", "document-governance", "governance-certificate", "digital-preservation"],
    relatedIndustries: ["government", "healthcare", "universities", "regulators"],
    relatedArticles: ["what-is-an-official-record", "what-is-document-governance", "understanding-evidence-chains"],
    metaTitle: "The Publication Lifecycle — From Draft to Permanent Record",
    metaDescription: "Official publication is a lifecycle: create, review, approve, authorise, publish, certify, verify, preserve. Walk each stage and see where authority and proof are won or lost.",
  },
];

export const articleBySlug = (slug?: string): Article | undefined =>
  ARTICLES.find((a) => a.slug === slug);

export const LIBRARY_CATEGORIES: string[] = ARTICLES.reduce<string[]>((acc, a) => {
  if (!acc.includes(a.category)) acc.push(a.category);
  return acc;
}, []);
