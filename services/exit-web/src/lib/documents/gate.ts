import type { CompanyProfile } from "@exit/engines";
import type { IntakeField } from "../active-company";
import { documentType, type DocumentType } from "./registry";

// ── PRE-GENERATION GATE ─────────────────────────────────────────────
// Before a document is shown, copied or exported:
//  1. inputs — intake fields it depends on that still hold the demo company's
//     values make it a draft with those inputs named; they are never
//     presented as the company's own;
//  2. disclosure — a pre-NDA or public document may not contain the
//     company's name or its exact figures (revenue, ARR, valuation). The check
//     reads the rendered text, so it catches a leak whichever generator wrote it.

export interface DisclosureFinding {
  readonly kind: "company_name" | "exact_figure";
  readonly term: string;
  readonly what: string;
}

export interface GateResult {
  readonly type: DocumentType;
  /** Inputs still holding demo values: the document is a draft until they are confirmed. */
  readonly unconfirmed: readonly IntakeField[];
  /** Confidential content found in a pre-NDA or public document: it must not leave. */
  readonly disclosure: readonly DisclosureFinding[];
  readonly blocked: boolean;
}

const GATED = new Set(["public", "pre_nda"]);

/** The ways a dollar figure is written across ExitOS's generators. */
export function figureForms(usd: number): string[] {
  if (!Number.isFinite(usd) || usd <= 0) return [];
  const m = usd / 1e6;
  const forms = new Set<string>([
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(usd),  // $37,400,000
    usd.toLocaleString("en-US"),                                                                               // 37,400,000
    String(Math.round(usd)),                                                                                    // 37400000
  ]);
  // "$37.4M" is precise enough to identify; whole-million forms are only used when the figure is not a round million
  if (m >= 1 && Math.round(m * 10) % 10 !== 0) forms.add(`$${m.toFixed(1)}M`);
  if (m >= 1 && m * 100 % 100 !== 0) forms.add(`$${m.toFixed(2)}M`);
  return [...forms];
}

/** Confidential terms for a company: its name and its exact figures. */
export function confidentialTerms(company: CompanyProfile, extra: { valuationMidUsd?: number } = {}): DisclosureFinding[] {
  const out: DisclosureFinding[] = [];
  const name = company.name.trim();
  if (name.length >= 3) out.push({ kind: "company_name", term: name, what: "the company's name" });
  const figs: Array<[number | undefined, string]> = [
    [company.revenue.trailingTwelveMonthsRevenueUsd, "exact revenue"],
    [company.revenue.annualRecurringRevenueUsd, "exact ARR"],
    [extra.valuationMidUsd, "the valuation"],
  ];
  for (const [v, what] of figs) for (const term of figureForms(v ?? 0)) out.push({ kind: "exact_figure", term, what });
  return out;
}

/** Confidential terms that appear in a text (case-insensitive for the name). */
export function disclosureFindings(text: string, terms: readonly DisclosureFinding[]): DisclosureFinding[] {
  const lower = text.toLowerCase();
  return terms.filter((t) => (t.kind === "company_name" ? lower.includes(t.term.toLowerCase()) : text.includes(t.term)));
}

/** Run the gate for one document type over its rendered text. */
export function gateDocument(typeId: string, text: string, ctx: {
  company: CompanyProfile;
  unconfirmed: readonly IntakeField[];
  valuationMidUsd?: number;
}): GateResult {
  const type = documentType(typeId);
  const unconfirmed = type.inputs.filter((f) => ctx.unconfirmed.includes(f));
  const disclosure = GATED.has(type.classification) ? disclosureFindings(text, confidentialTerms(ctx.company, ctx)) : [];
  return { type, unconfirmed, disclosure, blocked: disclosure.length > 0 };
}

/** One plain sentence for the person about to send or export. */
export function gateMessage(g: GateResult, labels: Record<string, string>): string | null {
  if (g.disclosure.length) {
    const what = [...new Set(g.disclosure.map((d) => d.what))].join(" and ");
    return `Withheld: this ${g.type.classification === "public" ? "public" : "pre-NDA"} document contains ${what}, which may only be shared under an NDA.`;
  }
  if (g.unconfirmed.length) return `Draft: ${g.unconfirmed.map((f) => labels[f] ?? f).join(", ")} ${g.unconfirmed.length === 1 ? "is" : "are"} still the demo company's value${g.unconfirmed.length === 1 ? "" : "s"}. Confirm ${g.unconfirmed.length === 1 ? "it" : "them"} on Value my company.`;
  return null;
}
