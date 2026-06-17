import type { ValuationConstitution } from '../valuation/institutional.js';
import { type Figure } from './figure.js';
import { valuationFacts, factMap } from './facts.js';
import { validateTraceability, type TraceabilityReport } from './traceability.js';

// ── LEVEL 3 · THE INSTITUTIONAL REPORTING SYSTEM ────────────────────
// Data Layer → Intelligence Layer (the Valuation Constitution) → Document
// Engine → rendered report. EVERY report — whatever its kind — carries the
// same nine canonical sections, drawn from the SAME intelligence object:
//
//   1. Executive Summary   2. Valuation        3. Buyer Universe
//   4. Comparable Transactions  5. Strategic Rationale
//   6. Expected Outcome    7. Confidence Analysis
//   8. Data Provenance     9. Disclaimers
//
// No document generates an unsupported figure, hardcodes an assumption,
// invents a premium or invents a buyer: prose numbers trace to a Figure,
// and every table is source data carrying its own provenance. The kind
// only changes the Executive Summary's framing and the title.

export type DocumentKind =
  | 'valuation_summary'
  | 'board_report'
  | 'market_update'
  | 'buyer_brief'
  | 'acquisition_recommendation'
  | 'exit_readiness';

export interface TracedSection {
  readonly heading: string;
  readonly body?: string;
  readonly bullets?: readonly string[];
  readonly tableHeaders?: readonly string[];
  readonly rows?: ReadonlyArray<readonly string[]>;
  readonly sourceData?: boolean;
  readonly exempt?: boolean;
}

export interface TracedDocument {
  readonly kind: DocumentKind;
  readonly title: string;
  readonly subtitle: string;
  readonly frameworkVersion: string;
  readonly facts: readonly Figure[];           // the institutional tear sheet
  readonly sections: readonly TracedSection[]; // the nine canonical sections
  readonly traceability: TraceabilityReport;
  readonly disclaimer: string;
}

export interface DocumentInputs {
  readonly constitution: ValuationConstitution;
}

const DOC_TITLES: Record<DocumentKind, string> = {
  valuation_summary: 'Valuation Summary',
  board_report: 'Board Report',
  market_update: 'Market Update',
  buyer_brief: 'Buyer Brief',
  acquisition_recommendation: 'Acquisition Recommendation',
  exit_readiness: 'Exit Readiness Report',
};

// The canonical nine section headings — every report has all of them.
export const REPORT_SECTIONS = [
  'Executive Summary', 'Valuation', 'Buyer Universe', 'Comparable Transactions',
  'Strategic Rationale', 'Expected Outcome', 'Confidence Analysis',
  'Data Provenance', 'Disclaimers',
] as const;

// strip numeric content so qualitative prose carries no untraced figures —
// the supporting numbers live in the fact sheet and source-data tables
const qualitative = (s: string): string =>
  s.replace(/\s*\([^)]*\d[^)]*\)/g, '')          // drop parentheticals containing a number
   .replace(/\s+\d[\d,.]*%?/g, '')               // drop bare numeric mentions
   .replace(/\s{2,}/g, ' ').trim();

function executiveLead(kind: DocumentKind, company: string, v: (k: string) => string): string {
  const head = `${company} — enterprise value ${v('enterprise_value')} (range ${v('enterprise_value_range')}) at ${v('confidence')} confidence, on a strategic-buyer basis.`;
  switch (kind) {
    case 'board_report':               return `Prepared for the Board. ${head} Supported by ${v('comparable_transactions')} comparable transactions and a qualified buyer universe of ${v('qualified_buyers')}.`;
    case 'market_update':              return `Market position update. ${head} The observed premium range is ${v('observed_premium_range')}; applied premium ${v('applied_premium')}.`;
    case 'buyer_brief':                return `Confidential buyer brief. ${head} Expected time to close ${v('expected_close_time')}.`;
    case 'acquisition_recommendation': return `Acquisition recommendation. ${head} ${v('qualified_buyers')} qualified buyers; applied premium ${v('applied_premium')}.`;
    case 'exit_readiness':             return `Exit readiness, in valuation terms. ${head} Expected time to close ${v('expected_close_time')}; data freshness ${v('data_freshness')}.`;
    default:                           return head;
  }
}

export function renderDocument(kind: DocumentKind, inputs: DocumentInputs): TracedDocument {
  const c = inputs.constitution;
  const facts = valuationFacts(c);
  const fm = factMap(facts);
  const v = (key: string): string => fm.get(key)?.value ?? '—';
  const fwV = c.frameworkVersion;

  // ── source-data tables (each carries its own provenance) ──────────
  const factRows = facts.map((f) => [f.label, f.value, f.confidence, f.source, f.methodology]);
  const compRows = c.comparableTransactions.map((t) => [
    t.target, t.buyer, t.date ?? '—',
    t.priceUsd != null ? (t.priceUsd >= 1e9 ? `$${(t.priceUsd / 1e9).toFixed(2)}B` : `$${(t.priceUsd / 1e6).toFixed(0)}M`) : 'undisclosed',
    t.premiumPct != null ? `${Math.round(t.premiumPct * 100)}%` : '—',
    t.sourceRef,
  ]);
  const buyerRows = c.mostLikelyBuyers.map((b, i) => [String(i + 1), b.name, `${b.probabilityPct}%`, `${b.expectedDaysToCash}d`]);
  const driverRows = Object.entries(c.confidence.drivers).map(([k, val]) => [k, `${Math.round(val * 100)}%`]);
  const allVars = [...c.variables.company, ...c.variables.market, ...c.variables.buyer, ...c.variables.execution];
  const varRows = allVars.map((x) => [x.name, x.present ? x.value : '— absent', x.source, x.verification_status, x.methodology]);
  const provRows = Object.entries(c.provenanceSummary.bySource).map(([s, n]) => [s, String(n)]);

  const sections: TracedSection[] = [
    // 1 — Executive Summary (prose, validated)
    {
      heading: 'Executive Summary',
      body: executiveLead(kind, c.companyName, v),
      bullets: [
        `Enterprise value: ${v('enterprise_value')} midpoint, ${v('enterprise_value_range')} range`,
        `Confidence: ${v('confidence')} across ${v('methods_used')} weighted methods`,
        `Strategic premium: ${v('applied_premium')} (observed ${v('observed_premium_range')})`,
        `Buyer universe: ${v('qualified_buyers')} qualified; expected close ${v('expected_close_time')}`,
      ],
    },
    // 2 — Valuation (prose + fact sheet as source data)
    {
      heading: 'Valuation',
      body: `On a strategic-buyer basis the enterprise value is ${v('enterprise_value')} (range ${v('enterprise_value_range')}), prepared under ExitOS Valuation Framework v${fwV}. The midpoint is the financial baseline uplifted by an applied premium of ${v('applied_premium')}. The fact sheet below carries every figure with its source, confidence, methodology and date.`,
      tableHeaders: ['Figure', 'Value', 'Confidence', 'Source', 'Methodology'],
      rows: factRows,
      sourceData: true,
    },
    // 3 — Buyer Universe (prose cites qualified_buyers fact; table is registry data)
    {
      heading: 'Buyer Universe',
      body: `${v('qualified_buyers')} buyers clear the qualification bar within the screened universe. The most likely acquirers, ranked by fit-adjusted expected value, are below — every buyer drawn from the curated registry, none invented.`,
      tableHeaders: ['#', 'Buyer', 'Acquisition probability', 'Expected days to close'],
      rows: buyerRows,
      sourceData: true,
    },
    // 4 — Comparable Transactions (prose cites count fact; table is sourced precedent)
    {
      heading: 'Comparable Transactions',
      body: `${v('comparable_transactions')} same-sector precedent transactions inform the view, with an observed premium range of ${v('observed_premium_range')}. Each row traces to its source; lost bids are excluded.`,
      tableHeaders: ['Target', 'Acquirer', 'Date', 'Value', 'Premium', 'Source'],
      rows: compRows,
      sourceData: true,
    },
    // 5 — Strategic Rationale (qualitative — numbers stripped, live in the fact sheet)
    {
      heading: 'Strategic Rationale',
      body: 'Why a strategic acquirer would pay the premium above the financial-buyer baseline:',
      bullets: c.strategicRationale.map(qualitative),
    },
    // 6 — Expected Outcome (prose, validated)
    {
      heading: 'Expected Outcome',
      body: `A process anchored at ${v('enterprise_value')} is expected to close in ${v('expected_close_time')}, applying a premium of ${v('applied_premium')} within an observed range of ${v('observed_premium_range')}. The expectation is benchmarked to the ranked acquirers' completed-transaction records, not assumed.`,
    },
    // 7 — Confidence Analysis (prose cites confidence fact; driver table is derived data)
    {
      heading: 'Confidence Analysis',
      body: `Overall confidence is ${v('confidence')}. It is a composite of five drivers — data completeness, comparable depth, sector maturity, financial quality and data freshness — each shown below.`,
      tableHeaders: ['Driver', 'Score'],
      rows: driverRows,
      sourceData: true,
    },
    // 8 — Data Provenance (meta — exempt from numeric scan; it IS the provenance)
    {
      heading: 'Data Provenance',
      body: `${c.provenanceSummary.note} Required provenance fields: ${c.provenanceSummary.requiredFields.join(', ')}. Source tally — ${provRows.map(([s, n]) => `${s}: ${n}`).join('; ')}. Every variable the framework requires is below, present with a value or explicitly marked absent.`,
      tableHeaders: ['Variable', 'Value', 'Source', 'Verification', 'Methodology'],
      rows: varRows,
      sourceData: true,
      exempt: true,
    },
    // 9 — Disclaimers (meta — exempt; legal text governed by the framework)
    {
      heading: 'Disclaimers',
      body: c.disclaimer,
      exempt: true,
    },
  ];

  const traceability = validateTraceability(facts, sections, fwV);

  return {
    kind,
    title: `${c.companyName} — ${DOC_TITLES[kind]}`,
    subtitle: `Prepared under ExitOS Valuation Framework v${fwV} · ${v('confidence')} confidence · institutional report`,
    frameworkVersion: fwV,
    facts,
    sections,
    traceability,
    disclaimer: c.disclaimer,
  };
}

/** Render every institutional report from one intelligence object. */
export function renderDocumentSuite(inputs: DocumentInputs): Record<DocumentKind, TracedDocument> {
  const kinds: DocumentKind[] = ['valuation_summary', 'board_report', 'market_update', 'buyer_brief', 'acquisition_recommendation', 'exit_readiness'];
  return Object.fromEntries(kinds.map((k) => [k, renderDocument(k, inputs)])) as Record<DocumentKind, TracedDocument>;
}
