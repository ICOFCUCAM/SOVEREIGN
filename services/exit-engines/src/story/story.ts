// ── THE COMPANY STORY ───────────────────────────────────────────────
// What a professional CIM needs that the headline intake does not hold: the
// company's history, products, customers, market, people, ownership and
// financial history, each material figure carrying where it came from.
//
// Every section is optional and may be partly filled: a founder saves what
// they have and returns later. Documents use only what is here, state each
// figure's provenance, and name what is missing; nothing is inferred.

/** Where a figure or claim comes from. */
export type Provenance =
  | 'founder'    // supplied by the founder, no document attached
  | 'source'     // supported by an uploaded source document
  | 'verified'   // independently verified (only through a verification process; the intake cannot set it)
  | 'estimated'  // an estimate, with its method stated
  | 'missing';   // not supplied

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  founder: 'supplied by the Company',
  source: 'supported by a source document',
  verified: 'independently verified',
  estimated: 'estimate (method stated)',
  missing: 'not yet supplied',
};

/** Provenance of one material figure. */
export interface FactMeta {
  readonly provenance: Provenance;
  readonly sourceId?: string;          // a SourceDocument id when provenance is 'source' (or 'verified')
  readonly period?: string;            // the reporting period it covers, e.g. "FY2025", "TTM to 2026-09"
  readonly asOf?: string;              // ISO date the figure is stated at
  readonly method?: string;            // required for 'estimated'
  readonly verification?: { readonly by: string; readonly at: string; readonly process: string };   // required for 'verified'
}

export interface SourceDocument {
  readonly id: string;
  readonly title: string;
  readonly kind: 'statutory_accounts' | 'management_accounts' | 'board_pack' | 'contract' | 'market_report' | 'cap_table' | 'other';
  readonly date: string;               // ISO date of the document
  readonly period?: string;            // reporting period it covers
  readonly dataRoomId?: string;        // the uploaded file in the data room, when uploaded
  readonly publisher?: string;         // for market reports: who published it
}

export interface Milestone { readonly year: number; readonly event: string }
export interface OwnershipChange { readonly date: string; readonly description: string }
export interface Product {
  readonly name: string;
  readonly description: string;
  readonly useCases?: string;
  readonly pricingModel?: string;
  readonly revenueSharePct?: number;   // 0..1
  readonly revenueShareMeta?: FactMeta;
  readonly differentiators?: string;
  readonly roadmap?: string;
}
export interface RevenueStream { readonly name: string; readonly sharePct: number; readonly recurring: boolean; readonly meta?: FactMeta }
export interface CustomerSegment { readonly name: string; readonly sharePct?: number; readonly description?: string; readonly meta?: FactMeta }
export interface CustomerProfile { readonly label: string; readonly segment?: string; readonly description: string; readonly since?: number }
export interface CaseStudy { readonly title: string; readonly summary: string; readonly outcome?: string; readonly approvedForUse: boolean }
export interface MarketEstimate {
  readonly label: string;              // e.g. "UK and Ireland mid-market analytics software"
  readonly valueUsd: number;
  readonly geography: string;
  readonly period: string;             // e.g. "2025"
  readonly methodology: string;        // how the figure was reached
  readonly growthPct?: number;         // annual growth of this market, when the source states it
  readonly meta: FactMeta;             // 'source' with a market report, or 'estimated' with a method
}
export interface Competitor { readonly name: string; readonly description?: string; readonly differentiation?: string }
export interface Leader { readonly name: string; readonly role: string; readonly bio: string; readonly responsibilities?: string; readonly since?: number; readonly founder?: boolean }
export interface HeadcountLine { readonly function: string; readonly count: number }
export interface Shareholder { readonly name: string; readonly kind: 'founder' | 'investor' | 'employee' | 'other'; readonly shareClass: string; readonly shares?: number; readonly pct: number }
export interface Instrument { readonly instrument: string; readonly amountUsd?: number; readonly terms: string }
export interface AnnualFinancials {
  readonly period: string;             // "FY2024"
  readonly periodEnd?: string;         // ISO date
  readonly revenueUsd?: number;
  readonly arrUsd?: number;
  readonly grossMarginPct?: number;
  readonly ebitdaUsd?: number;
  readonly meta: FactMeta;
}
export interface Forecast { readonly period: string; readonly revenueUsd?: number; readonly ebitdaUsd?: number; readonly basis: string }

export interface CompanyStory {
  readonly version: 1;
  readonly updatedAt: string;
  readonly history?: { readonly origin?: string; readonly milestones: readonly Milestone[]; readonly ownershipChanges: readonly OwnershipChange[] };
  readonly products?: readonly Product[];
  readonly businessModel?: { readonly revenueStreams: readonly RevenueStream[]; readonly pricingNotes?: string };
  readonly customers?: {
    readonly segments: readonly CustomerSegment[];
    readonly profiles: readonly CustomerProfile[];
    readonly contractTerms?: string;
    readonly grossRetentionPct?: number; readonly grossRetentionMeta?: FactMeta;
    readonly logoChurnPct?: number; readonly logoChurnMeta?: FactMeta;
    readonly caseStudies: readonly CaseStudy[];
  };
  readonly salesMarketing?: { readonly channels?: string; readonly team?: string; readonly salesCycle?: string; readonly partners?: string };
  readonly market?: { readonly targetMarkets?: string; readonly geographies: readonly string[]; readonly estimates: readonly MarketEstimate[]; readonly competitors: readonly Competitor[] };
  readonly operations?: { readonly technology?: string; readonly intellectualProperty?: string; readonly operations?: string };
  readonly team?: { readonly leaders: readonly Leader[]; readonly headcount: readonly HeadcountLine[]; readonly headcountAsOf?: string; readonly structure?: string };
  readonly capitalization?: {
    readonly holders: readonly Shareholder[]; readonly shareClasses?: string; readonly optionPoolPct?: number;
    readonly instruments: readonly Instrument[]; readonly fullyDilutedShares?: number; readonly asOf?: string; readonly meta?: FactMeta;
  };
  readonly financials?: { readonly annual: readonly AnnualFinancials[]; readonly forecasts: readonly Forecast[]; readonly definitions?: string };
  readonly growth?: { readonly opportunities: ReadonlyArray<{ readonly title: string; readonly description: string }> };
  readonly risks?: ReadonlyArray<{ readonly title: string; readonly description: string; readonly mitigation?: string }>;
  readonly sources: readonly SourceDocument[];
  /** Provenance of the headline intake figures (revenue, ARR, margins …), keyed by intake field. */
  readonly headline?: Readonly<Record<string, FactMeta>>;
}

export const EMPTY_STORY: CompanyStory = { version: 1, updatedAt: '1970-01-01T00:00:00.000Z', sources: [] };

// ── provenance rules ──
/** The provenance a figure may actually claim, and why a claim was not accepted. */
export function effectiveProvenance(m: FactMeta | undefined, story: Pick<CompanyStory, 'sources'>): { provenance: Provenance; issue?: string } {
  if (!m) return { provenance: 'founder' };
  if (m.provenance === 'verified') {
    if (!m.verification?.process || !m.verification.by || !m.verification.at) return { provenance: m.sourceId ? 'source' : 'founder', issue: 'marked verified without a recorded verification' };
    return { provenance: 'verified' };
  }
  if (m.provenance === 'source') {
    if (!m.sourceId || !story.sources.some((s) => s.id === m.sourceId)) return { provenance: 'founder', issue: 'cites a source document that is not attached' };
    return { provenance: 'source' };
  }
  if (m.provenance === 'estimated' && !m.method?.trim()) return { provenance: 'missing', issue: 'an estimate without its method' };
  return { provenance: m.provenance };
}

/** A market-size figure a document may state: sourced or estimated with a method, and with geography, period and methodology. */
export function usableMarketEstimate(e: MarketEstimate, story: Pick<CompanyStory, 'sources'>): { ok: boolean; issue?: string } {
  if (!(e.valueUsd > 0)) return { ok: false, issue: 'no value' };
  if (!e.geography.trim() || !e.period.trim() || !e.methodology.trim()) return { ok: false, issue: 'needs its geography, period and methodology' };
  const p = effectiveProvenance(e.meta, story);
  if (p.provenance === 'source' || p.provenance === 'verified') return { ok: true };
  if (p.provenance === 'estimated') return { ok: true };
  return { ok: false, issue: p.issue ?? 'needs a source document or a documented estimate' };
}

/** A forecast a document may state: a period, at least one figure and its basis. */
export const usableForecast = (f: Forecast): boolean => !!f.period.trim() && !!f.basis.trim() && (f.revenueUsd != null || f.ebitdaUsd != null);

// ── completion ──
export type SectionId = 'history' | 'products' | 'businessModel' | 'customers' | 'salesMarketing' | 'market' | 'operations' | 'team' | 'capitalization' | 'financials' | 'growth' | 'risks' | 'sources';
export const SECTION_TITLE: Record<SectionId, string> = {
  history: 'Company history', products: 'Products and services', businessModel: 'Business model and revenue', customers: 'Customers',
  salesMarketing: 'Sales and marketing', market: 'Market and competitors', operations: 'Operations and technology', team: 'Management and workforce',
  capitalization: 'Ownership and capitalisation', financials: 'Financial history and forecasts', growth: 'Growth opportunities', risks: 'Risks and dependencies',
  sources: 'Source documents',
};
export type Completion = 'empty' | 'partial' | 'complete';
export interface SectionStatus { readonly id: SectionId; readonly status: Completion; readonly missing: readonly string[] }

const filled = (s: string | undefined): boolean => !!s && s.trim().length > 0;

/** Each section's completion and what it still lacks — for the intake and for the CIM's gap statements. */
export function storyStatus(story: CompanyStory): SectionStatus[] {
  const st = (id: SectionId, parts: Array<[boolean, string]>): SectionStatus => {
    const have = parts.filter(([ok]) => ok).length;
    return { id, status: have === 0 ? 'empty' : have === parts.length ? 'complete' : 'partial', missing: parts.filter(([ok]) => !ok).map(([, what]) => what) };
  };
  const h = story.history, c = story.customers, m = story.market, t = story.team, cap = story.capitalization, f = story.financials;
  return [
    st('history', [[filled(h?.origin), 'how the company started'], [(h?.milestones.length ?? 0) > 0, 'major milestones'], [(h?.ownershipChanges.length ?? 0) > 0 || filled(h?.origin), 'ownership changes (or none)']]),
    st('products', [[(story.products?.length ?? 0) > 0, 'products and services'], [(story.products ?? []).some((p) => filled(p.pricingModel)), 'pricing model'], [(story.products ?? []).some((p) => filled(p.differentiators)), 'what differentiates them']]),
    st('businessModel', [[(story.businessModel?.revenueStreams.length ?? 0) > 0, 'revenue streams and their share of revenue']]),
    st('customers', [[(c?.segments.length ?? 0) > 0, 'customer segments'], [(c?.profiles.length ?? 0) > 0, 'representative customer profiles'], [filled(c?.contractTerms), 'contract terms'], [c?.grossRetentionPct != null || c?.logoChurnPct != null, 'retention or churn'], [(c?.caseStudies ?? []).some((x) => x.approvedForUse), 'an approved case study']]),
    st('salesMarketing', [[filled(story.salesMarketing?.channels), 'sales channels'], [filled(story.salesMarketing?.team) || filled(story.salesMarketing?.salesCycle), 'sales team or cycle']]),
    st('market', [[filled(m?.targetMarkets), 'target markets'], [(m?.estimates ?? []).some((e) => usableMarketEstimate(e, story).ok), 'a sourced market-size estimate'], [(m?.competitors.length ?? 0) > 0, 'named competitors']]),
    st('operations', [[filled(story.operations?.technology), 'technology'], [filled(story.operations?.intellectualProperty), 'intellectual property']]),
    st('team', [[(t?.leaders.length ?? 0) > 0, 'leadership biographies'], [(t?.headcount.length ?? 0) > 0, 'headcount by function'], [filled(t?.structure), 'organisation structure']]),
    st('capitalization', [[(cap?.holders.length ?? 0) > 0, 'shareholders and ownership'], [cap?.optionPoolPct != null, 'option pool'], [cap?.fullyDilutedShares != null, 'fully diluted share count']]),
    st('financials', [[(f?.annual.length ?? 0) > 0, 'historical annual financials'], [(f?.annual.length ?? 0) >= 2, 'at least two years of history'], [filled(f?.definitions), 'definitions (revenue, ARR, EBITDA)']]),
    st('growth', [[(story.growth?.opportunities.length ?? 0) > 0, 'growth opportunities']]),
    st('risks', [[(story.risks?.length ?? 0) > 0, 'material risks and dependencies']]),
    st('sources', [[story.sources.length > 0, 'source documents for the figures']]),
  ];
}

/** Share of sections complete (partial counts half), 0..1. */
export const storyCompleteness = (story: CompanyStory): number => {
  const s = storyStatus(story);
  return s.reduce((n, x) => n + (x.status === 'complete' ? 1 : x.status === 'partial' ? 0.5 : 0), 0) / s.length;
};

/** Every provenance problem in a story, for the intake to show before anything is generated. */
export function provenanceIssues(story: CompanyStory): string[] {
  const out: string[] = [];
  const check = (what: string, m: FactMeta | undefined): void => { const p = effectiveProvenance(m, story); if (p.issue) out.push(`${what}: ${p.issue}`); };
  for (const [k, m] of Object.entries(story.headline ?? {})) check(k, m);
  for (const a of story.financials?.annual ?? []) check(`financials ${a.period}`, a.meta);
  for (const e of story.market?.estimates ?? []) { const u = usableMarketEstimate(e, story); if (!u.ok) out.push(`market estimate "${e.label}": ${u.issue}`); }
  for (const p of story.products ?? []) check(`${p.name} revenue share`, p.revenueShareMeta);
  check('gross retention', story.customers?.grossRetentionMeta);
  check('capitalisation table', story.capitalization?.meta);
  for (const f of story.financials?.forecasts ?? []) if (!usableForecast(f)) out.push(`forecast ${f.period || '(no period)'}: needs a period, a figure and its basis`);
  return out;
}
