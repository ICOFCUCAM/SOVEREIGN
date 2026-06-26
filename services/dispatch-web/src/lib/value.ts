// The seven ways Sovereign Dispatch creates financial value. Introduced on the
// homepage; each links to its own page (/value/:slug) rendered by ValuePage.
// Language is deliberately honest — potential benefits, not guaranteed ROI.

export interface ValueItem {
  slug: string;
  n: number;
  title: string;
  teaser: string;        // one line for the homepage card
  lead: string;          // page intro
  listTitle?: string;
  list?: string[];       // the friction / risk / evidence list
  body: string[];        // closing paragraphs
  caveat?: string;       // honest qualifier shown in muted type
  banner: string;        // /banners/<banner>.webp
}

export const VALUE_BASE = "/value";

export const VALUE: ValueItem[] = [
  {
    slug: "reduce-cost",
    n: 1,
    title: "Reduce the Cost of Publication",
    teaser: "Cut the administrative overhead between the experts you already employ.",
    lead: "Every official publication today often runs through a long, manual chain of work — and that process consumes staff hours.",
    listTitle: "What one publication can involve today",
    list: ["Drafting", "Email chains", "Manual approvals", "Meetings", "Legal review", "Version reconciliation", "Publishing", "Archiving", "Audit preparation"],
    body: [
      "Dispatch reduces the administrative overhead by making the workflow structured, traceable and governed.",
      "You are not replacing experts — you are reducing the friction between them.",
    ],
    banner: "default",
  },
  {
    slug: "prevent-errors",
    n: 2,
    title: "Prevent Expensive Errors",
    teaser: "Enforce governance before publication, not after the damage is done.",
    lead: "One incorrectly published document can be expensive.",
    listTitle: "What a single bad publication can cost",
    list: ["Legal disputes", "Regulatory penalties", "Public confusion", "Reputational damage", "Withdrawal and republication", "Emergency staff time"],
    body: ["Dispatch enforces governance before publication, reducing the chance of these costly mistakes."],
    banner: "default",
  },
  {
    slug: "reduce-audit",
    n: 3,
    title: "Reduce Audit Costs",
    teaser: "The evidence already exists — no reconstructing history at audit time.",
    lead: "Many institutions spend substantial time preparing for audits because they have to gather the proof after the fact.",
    listTitle: "What auditors ask for",
    list: ["Approval evidence", "Document versions", "Publication history", "Sign-offs", "Compliance records"],
    body: [
      "Dispatch keeps this evidence as part of the publication lifecycle.",
      "Instead of reconstructing history, the evidence already exists.",
    ],
    banner: "compliance",
  },
  {
    slug: "protect-knowledge",
    n: 4,
    title: "Protect Institutional Knowledge",
    teaser: "Decisions and their proof outlive the people who made them.",
    lead: "People retire. Officials change. Governments change. Companies restructure.",
    listTitle: "Where knowledge is lost",
    list: ["People retire", "Officials change", "Governments change", "Companies restructure"],
    body: [
      "Without proper governance, institutional knowledge can be lost or become difficult to verify.",
      "Dispatch preserves the publication history and evidence chain, reducing the cost of recovering or validating historical decisions.",
    ],
    banner: "compliance",
  },
  {
    slug: "accelerate-execution",
    n: 5,
    title: "Accelerate Decision Execution",
    teaser: "Move from draft to approved publication with less friction.",
    lead: "If a policy or board resolution can move from drafting to approved publication more efficiently, institutions may realize operational benefits sooner.",
    body: ["A governed, structured workflow removes the waiting, the chasing and the version confusion between steps — so decisions take effect when they are made, not weeks later."],
    caveat: "The exact financial impact depends on the institution; we do not promise a specific ROI without customer data to support it.",
    banner: "procurement",
  },
  {
    slug: "reduce-fragmentation",
    n: 6,
    title: "Reduce Software Fragmentation",
    teaser: "One governed workflow in place of several disconnected systems.",
    lead: "Many organizations run separate systems for each stage of publication.",
    listTitle: "The systems that pile up",
    list: ["Document management", "Approvals", "Compliance", "Publishing", "Archives"],
    body: ["If Dispatch consolidates some of these workflows, it can reduce licensing, maintenance and integration costs."],
    caveat: "Whether it replaces existing systems varies by customer; treat this as a potential benefit rather than a guarantee.",
    banner: "default",
  },
  {
    slug: "enable-services",
    n: 7,
    title: "Enable Digital Services",
    teaser: "Turn verified publications into online services citizens can trust.",
    lead: "This is where Dispatch becomes even more valuable.",
    body: [
      "Imagine a government that currently issues certificates manually. With Dispatch, verified official publications can be exposed through APIs — letting citizens, businesses and partner organizations confirm authenticity online.",
      "That can support digital public services and reduce manual verification work.",
    ],
    banner: "officialrecord",
  },
];

export const valueBySlug = (slug: string): ValueItem | undefined => VALUE.find((v) => v.slug === slug);
