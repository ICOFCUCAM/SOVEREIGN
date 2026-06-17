import type { ValuationConstitution } from '../valuation/institutional.js';
import { type Figure } from './figure.js';
import { valuationFacts, factMap } from './facts.js';
import { validateTraceability, type TraceabilityReport } from './traceability.js';

// ── LEVEL 3 · THE DOCUMENT ENGINE ───────────────────────────────────
// Data Layer → Intelligence Layer (the Valuation Constitution) → Document
// Engine → rendered document. Every institutional document type is produced
// here from the SAME intelligence object and the SAME fact sheet. No
// document computes a number; it references a Figure. The output carries a
// traceability report proving every number traces to a stored source.

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
}

export interface TracedDocument {
  readonly kind: DocumentKind;
  readonly title: string;
  readonly subtitle: string;
  readonly frameworkVersion: string;
  readonly facts: readonly Figure[];           // the institutional tear sheet
  readonly sections: readonly TracedSection[];
  readonly traceability: TraceabilityReport;
  readonly disclaimer: string;
}

export interface DocumentInputs {
  readonly constitution: ValuationConstitution;
  readonly readinessScore?: number;            // 0–100, when an exit-readiness figure is wanted
  readonly readinessBand?: string;
}

const DOC_TITLES: Record<DocumentKind, string> = {
  valuation_summary: 'Valuation Summary',
  board_report: 'Board Report',
  market_update: 'Market Update',
  buyer_brief: 'Buyer Brief',
  acquisition_recommendation: 'Acquisition Recommendation',
  exit_readiness: 'Exit Readiness Report',
};

export function renderDocument(kind: DocumentKind, inputs: DocumentInputs): TracedDocument {
  const c = inputs.constitution;
  const facts = valuationFacts(c);
  const fm = factMap(facts);
  const v = (key: string): string => fm.get(key)?.value ?? '—';
  const fwV = c.frameworkVersion;

  // top-likely-buyer NAMES are not numbers — safe to cite directly
  const topBuyers = c.mostLikelyBuyers.map((b) => b.name);
  const factRows = facts.map((f) => [f.label, f.value, f.confidence, f.source, f.methodology]);

  // the fact sheet — present in every document, the single tear block
  const factSheet: TracedSection = {
    heading: 'Valuation fact sheet',
    body: `Every figure below carries its source, confidence, methodology and date. No number in this document exists without one.`,
    tableHeaders: ['Figure', 'Value', 'Confidence', 'Source', 'Methodology'],
    rows: factRows,
  };

  let sections: TracedSection[];

  switch (kind) {
    case 'board_report':
      sections = [
        {
          heading: 'For the Board',
          body: `Management presents the current valuation position for ${c.companyName}, prepared under ${fwV ? `ExitOS Valuation Framework v${fwV}` : 'the ExitOS framework'}. The enterprise value midpoint is ${v('enterprise_value')} (range ${v('enterprise_value_range')}) at ${v('confidence')} confidence, supported by ${v('comparable_transactions')} comparable transactions and a qualified buyer universe of ${v('qualified_buyers')}.`,
        },
        {
          heading: 'Position & evidence',
          bullets: [
            `Enterprise value: ${v('enterprise_value')} midpoint, ${v('enterprise_value_range')} range`,
            `Strategic premium applied: ${v('applied_premium')}, within an observed range of ${v('observed_premium_range')}`,
            `Methods used: ${v('methods_used')}, weighted and normalized`,
            `Expected time to close: ${v('expected_close_time')}`,
            `Data freshness: ${v('data_freshness')}`,
          ],
        },
        {
          heading: 'Recommendation',
          body: `The evidence supports running a process anchored at the strategic midpoint of ${v('enterprise_value')}. The most likely acquirers are ${topBuyers.slice(0, 3).join(', ') || 'under continued screening'}. Confidence of ${v('confidence')} reflects the depth of comparable evidence and the freshness of the underlying registry.`,
        },
      ];
      break;

    case 'market_update':
      sections = [
        {
          heading: 'Market position',
          body: `Against current sector conditions, ${c.companyName} carries an enterprise value of ${v('enterprise_value')} (${v('enterprise_value_range')}). The observed premium range in comparable transactions is ${v('observed_premium_range')}, of which ${v('applied_premium')} is applied here.`,
        },
        {
          heading: 'Transaction evidence',
          body: `The view rests on ${v('comparable_transactions')} same-sector comparable transactions and a screened universe of ${v('qualified_buyers')} qualified buyers. Underlying registry data freshness is ${v('data_freshness')}.`,
          bullets: topBuyers.length ? [`Most active acquirers: ${topBuyers.join(', ')}`] : [],
        },
      ];
      break;

    case 'buyer_brief':
      sections = [
        {
          heading: 'The opportunity',
          body: `${c.companyName} is positioned for a strategic-buyer process at an enterprise value of ${v('enterprise_value')} (${v('enterprise_value_range')}), at ${v('confidence')} confidence.`,
        },
        {
          heading: 'Why it clears',
          bullets: [
            `${v('comparable_transactions')} comparable transactions on record`,
            `Applied premium ${v('applied_premium')} (observed range ${v('observed_premium_range')})`,
            `Expected close in ${v('expected_close_time')}`,
            `Qualified buyer universe: ${v('qualified_buyers')}`,
          ],
        },
      ];
      break;

    case 'acquisition_recommendation':
      sections = [
        {
          heading: 'Recommendation',
          body: `We recommend engaging ${topBuyers[0] ?? 'the lead acquirer'} and the wider qualified universe of ${v('qualified_buyers')} buyers, anchoring at the strategic midpoint of ${v('enterprise_value')} (${v('enterprise_value_range')}).`,
        },
        {
          heading: 'Basis',
          bullets: [
            `Confidence ${v('confidence')} across ${v('methods_used')} weighted methods`,
            `${v('comparable_transactions')} comparable transactions; applied premium ${v('applied_premium')}`,
            `Expected close ${v('expected_close_time')}; data freshness ${v('data_freshness')}`,
          ],
        },
        ...topBuyers.length ? [{ heading: 'Priority acquirers', bullets: topBuyers }] : [],
      ];
      break;

    case 'exit_readiness': {
      const readinessSections: TracedSection[] = [
        {
          heading: 'Readiness in valuation terms',
          body: `${c.companyName} is assessed against the value a strategic process could realize: an enterprise value of ${v('enterprise_value')} (${v('enterprise_value_range')}) at ${v('confidence')} confidence, with an expected close in ${v('expected_close_time')}.`,
        },
        {
          heading: 'What underpins it',
          bullets: [
            `${v('comparable_transactions')} comparable transactions; ${v('qualified_buyers')} qualified buyers`,
            `Applied premium ${v('applied_premium')} within an observed range of ${v('observed_premium_range')}`,
            `Registry freshness ${v('data_freshness')}`,
          ],
        },
      ];
      sections = readinessSections;
      break;
    }

    case 'valuation_summary':
    default:
      sections = [
        {
          heading: 'Conclusion',
          body: `On a strategic-buyer basis, the enterprise value of ${c.companyName} is ${v('enterprise_value')} (range ${v('enterprise_value_range')}), prepared under ExitOS Valuation Framework v${fwV}. The midpoint applies a strategic premium of ${v('applied_premium')} — drawn from observed precedent, within ${v('observed_premium_range')} — at ${v('confidence')} confidence.`,
        },
        {
          heading: 'Evidence',
          bullets: [
            `${v('methods_used')} weighted methodologies`,
            `${v('comparable_transactions')} comparable transactions`,
            `${v('qualified_buyers')} qualified buyers; expected close ${v('expected_close_time')}`,
            `Data freshness ${v('data_freshness')}`,
          ],
        },
      ];
  }

  const traceability = validateTraceability(facts, sections, fwV);

  return {
    kind,
    title: `${c.companyName} — ${DOC_TITLES[kind]}`,
    subtitle: `Prepared under ExitOS Valuation Framework v${fwV} · ${v('confidence')} confidence`,
    frameworkVersion: fwV,
    facts,                                // the tear sheet
    sections: [factSheet, ...sections],
    traceability,
    disclaimer: c.disclaimer,
  };
}

/** Render every institutional document from one intelligence object. */
export function renderDocumentSuite(inputs: DocumentInputs): Record<DocumentKind, TracedDocument> {
  const kinds: DocumentKind[] = ['valuation_summary', 'board_report', 'market_update', 'buyer_brief', 'acquisition_recommendation', 'exit_readiness'];
  return Object.fromEntries(kinds.map((k) => [k, renderDocument(k, inputs)])) as Record<DocumentKind, TracedDocument>;
}
