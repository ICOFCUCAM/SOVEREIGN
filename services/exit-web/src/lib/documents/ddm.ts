import type { Classification } from "./registry";

// ── EXITOS → DISPATCH DOCUMENT MODEL (DDM v1) ──────────────────────
// One structured form for every generated document. Dispatch's engine lays it
// out (cover, numbering, contents, running header and footer with the
// classification, page numbers) and renders Markdown, HTML, PDF and DOCX from
// the same model, so the on-screen view, the Markdown and the PDF of a version
// cannot drift apart.
//
// Each ExitOS family maps onto a Dispatch document type, which fixes its
// layout: sell-side memoranda are a proposal package, the closing checklist a
// contract record, diligence findings a due-diligence report. A type's required
// section roles are carried by ExitOS's own sections where they fit, otherwise
// by a section ExitOS adds that states something true about the document
// (its scope, its basis, its limits). Sections keep their own order.

export interface ContentSection {
  readonly heading: string;
  readonly body?: string;
  readonly bullets?: readonly string[];
  readonly table?: { readonly headers: readonly string[]; readonly rows: ReadonlyArray<readonly string[]> };
}

export type Family = "memorandum" | "checklist" | "diligence";

export interface DdmInput {
  readonly family: Family;
  readonly typeId: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly classification: Classification;
  /** ISO date (YYYY-MM-DD) */
  readonly date: string;
  readonly version: string;
  readonly status: "draft" | "review" | "final";
  /** Who prepared it, e.g. "ExitOS Advisory" or the company's code name. */
  readonly owningBody: string;
  readonly audience: string;
  /** A short reference tying the rendered file back to its version (type, version, content hash). */
  readonly referenceCode: string;
  readonly sections: readonly ContentSection[];
  /** Stated limits: planning assumptions, sample data, review requirements. */
  readonly notices: readonly string[];
}

/** The DDM document (the shape packages/ddm-schema validates). */
export type DdmDocument = Record<string, unknown> & { ddmVersion: "1.0"; docType: string; sections: DdmSection[] };
interface DdmSection { id: string; heading: string; level: number; role?: string; order: number; blocks: Array<Record<string, unknown>> }

const LEVEL: Record<Classification, string> = {
  public: "PUBLIC",
  pre_nda: "CONFIDENTIAL — PRE-NDA",
  internal: "INTERNAL",
  board: "BOARD CONFIDENTIAL",
  confidential_nda: "STRICTLY CONFIDENTIAL — UNDER NDA",
  restricted_parties: "RESTRICTED — TRANSACTION PARTIES",
};
const HANDLING: Record<Classification, string> = {
  public: "May be shared publicly.",
  pre_nda: "For named prospective buyers before an NDA; identifies the company by code name only.",
  internal: "For the company and its advisers; not for buyers.",
  board: "For the board of directors and its advisers.",
  confidential_nda: "Only for parties bound by an executed NDA with the company.",
  restricted_parties: "Only for the parties to the transaction and their counsel.",
};

const DOC_TYPE: Record<Family, string> = { memorandum: "proposal_package", checklist: "contract_record", diligence: "due_diligence_report" };

// inline Markdown emphasis is not part of DDM text
const plain = (t: string): string => t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/_(.+?)_/g, "$1").trim();
const sid = (n: number): string => `s${n}`;

function blocks(s: ContentSection, id: string): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  if (s.body) out.push({ id: `${id}-p`, type: "paragraph", text: plain(s.body).slice(0, 5000) });
  if (s.bullets?.length) out.push({ id: `${id}-b`, type: "bullets", items: s.bullets.slice(0, 100).map((t) => ({ text: plain(t).slice(0, 2000) })) });
  if (s.table) {
    const cols = s.table.headers.map((h, i) => ({ key: `c${i}`, label: plain(h) || " " }));
    out.push({ id: `${id}-t`, type: "table", columns: cols, rows: s.table.rows.map((r) => cols.map((_, i) => ({ text: plain(r[i] ?? "") }))) });
  }
  if (!out.length) out.push({ id: `${id}-p`, type: "paragraph", text: "—" });
  return out;
}

const find = (secs: readonly ContentSection[], re: RegExp): number => secs.findIndex((s) => re.test(s.heading));

/** Map content + family onto a DDM document whose required roles are all present. */
export function toDdm(input: DdmInput): DdmDocument {
  const secs = input.sections.filter((s) => s.heading.trim());
  if (!secs.length) throw new Error(`${input.typeId}: a document needs at least one section`);
  // Dispatch numbers sections itself, so a heading's own "3." prefix is dropped
  const heading = (h: string): string => plain(h).replace(/^\d+[.)]\s+/, "") || plain(h);
  const sections: DdmSection[] = secs.map((s, i) => ({ id: sid(i + 1), heading: heading(s.heading), level: 1, order: i + 1, blocks: blocks(s, sid(i + 1)) }));
  const roleAt = (i: number, role: string): void => { if (i >= 0 && !sections[i].role) sections[i].role = role; };
  const add = (heading: string, role: string, b: Array<Record<string, unknown>>): void => {
    const n = sections.length + 1;
    sections.push({ id: sid(n), heading, level: 1, role, order: n, blocks: b.map((x, k) => ({ ...x, id: `${sid(n)}-${k}` })) });
  };
  const noticeCallout = (title: string): Record<string, unknown> => ({ type: "callout", style: "info", title, text: input.notices.join(" ").slice(0, 3000) || "Prepared by ExitOS from the company's own figures." });

  if (input.family === "memorandum") {
    roleAt(0, "executive_summary");
    roleAt(secs.length > 1 ? 1 : -1, "approach");
    const process = find(secs, /process|timeline|next steps/i);
    if (process >= 0 && !sections[process].role) roleAt(process, "deliverables");
    else add("What recipients receive", "deliverables", [{ type: "paragraph", text: "This document, and on an executed NDA the materials it describes." }]);
    const val = find(secs, /valuation/i);
    if (val >= 0 && !sections[val].role) { roleAt(val, "commercials"); sections[val].blocks.push({ id: `${sections[val].id}-c`, ...noticeCallout("Basis") }); }
    else add("Basis and limitations", "commercials", [noticeCallout("Basis")]);
    if (!sections.some((s) => s.role === "approach")) add("Scope", "approach", [{ type: "paragraph", text: "The sections above." }]);
  } else if (input.family === "checklist") {
    roleAt(find(secs, /status/i) >= 0 ? find(secs, /status/i) : 0, "summary");
    const items = find(secs, /item/i);
    roleAt(items, "obligations");
    const owners = [...new Set((secs[items]?.table?.rows ?? []).map((r) => r[2]).filter(Boolean))];
    add("Owners", "parties", [{ type: "bullets", items: (owners.length ? owners : ["Not assigned"]).map((o) => ({ text: o })) }]);
    const timing = find(secs, /timing/i);
    if (timing >= 0) { roleAt(timing, "term"); sections[timing].blocks.push({ id: `${sections[timing].id}-c`, ...noticeCallout("Timing") }); }
    else add("Timing", "term", [noticeCallout("Timing")]);
  } else {
    roleAt(0, "summary");
    add("Scope", "scope", [{ type: "paragraph", text: "Rule-based checks on the company's own figures. No documents were read; findings are prompts for diligence, not conclusions." }]);
    roleAt(find(secs, /finding/i), "findings");
    if (!sections.some((s) => s.role === "findings")) roleAt(secs.length > 1 ? 1 : 0, "findings");
    const flagged = secs.flatMap((s) => (s.bullets ?? []).filter((b) => /high|red flag/i.test(b)));
    add("Red flags", "red_flags", [{ type: "bullets", items: (flagged.length ? flagged : ["None flagged at high severity."]).slice(0, 100).map((t) => ({ text: plain(t) })) }]);
    const rec = find(secs, /recommend/i);
    if (rec >= 0) { roleAt(rec, "recommendation"); sections[rec].blocks.push({ id: `${sections[rec].id}-c`, ...noticeCallout("Before acting") }); }
    else add("Recommendation", "recommendation", [noticeCallout("Before acting")]);
  }

  return {
    ddmVersion: "1.0",
    docType: DOC_TYPE[input.family],
    locale: "en-GB",
    metadata: {
      title: plain(input.title).slice(0, 300),
      ...(input.subtitle ? { subtitle: plain(input.subtitle).slice(0, 300) } : {}),
      owningBody: input.owningBody,
      audience: input.audience,
      referenceCode: input.referenceCode.slice(0, 100),
      date: input.date,
      version: input.version,
      status: input.status,
    },
    classification: { scheme: "corporate", level: LEVEL[input.classification], handling: HANDLING[input.classification] },
    sections,
  };
}
