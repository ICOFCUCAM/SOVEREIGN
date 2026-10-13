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
  verified: 'independently verified by an authorised reviewer',
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
  /** Set only from an independent verification record (exitos_verifications), never by the owner. */
  readonly verification?: VerificationSummary;
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
  /** The headline intake figures as saved with the story, so a reviewer verifies the value the documents use. */
  readonly figures?: Readonly<Record<string, number | string | boolean>>;
}

export const EMPTY_STORY: CompanyStory = { version: 1, updatedAt: '1970-01-01T00:00:00.000Z', sources: [] };

const filled = (s: string | undefined | null): boolean => typeof s === 'string' && s.trim().length > 0;

// ── provenance rules ──
/** The provenance a figure may actually claim, and why a claim was not accepted. */
export function effectiveProvenance(m: FactMeta | undefined, story: Pick<CompanyStory, 'sources'>): { provenance: Provenance; issue?: string } {
  if (!m) return { provenance: 'founder' };
  if (m.provenance === 'verified') {
    const v = m.verification;
    if (!v?.id || !v.reviewer || !v.role || !v.at || !v.scope || !(v.evidence?.length)) return { provenance: m.sourceId ? 'source' : 'founder', issue: 'marked verified without a recorded independent verification' };
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
  if (!(Number(e.valueUsd) > 0)) return { ok: false, issue: 'no value' };
  if (!filled(e.geography) || !filled(e.period) || !filled(e.methodology)) return { ok: false, issue: 'needs its geography, period and methodology' };
  const p = effectiveProvenance(e.meta, story);
  if (p.provenance === 'source' || p.provenance === 'verified') return { ok: true };
  if (p.provenance === 'estimated') return { ok: true };
  return { ok: false, issue: p.issue ?? 'needs a source document or a documented estimate' };
}

/** A forecast a document may state: a period, at least one figure and its basis. */
export const usableForecast = (f: Forecast): boolean => filled(f.period) && filled(f.basis) && (f.revenueUsd != null || f.ebitdaUsd != null);

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


/** Each section's completion and what it still lacks — for the intake and for the CIM's gap statements. */
export function storyStatus(story: CompanyStory): SectionStatus[] {
  // anything typed into a section counts as started, even before it is usable
  const touched = (v: unknown): boolean => v != null && (typeof v === 'string' ? v.trim().length > 0 : typeof v === 'number' ? Number.isFinite(v) : typeof v === 'boolean' ? v : Array.isArray(v) ? v.some(touched) : typeof v === 'object' ? Object.values(v as object).some(touched) : false);
  const st = (id: SectionId, parts: Array<[boolean, string]>): SectionStatus => {
    const have = parts.filter(([ok]) => ok).length;
    const started = have > 0 || touched((story as unknown as Record<string, unknown>)[id]);
    return { id, status: !started ? 'empty' : have === parts.length ? 'complete' : 'partial', missing: parts.filter(([ok]) => !ok).map(([, what]) => what) };
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
  for (const a of story.financials?.annual ?? []) check(`financials ${a.period || '(no period)'}`, a.meta);
  for (const e of story.market?.estimates ?? []) { const u = usableMarketEstimate(e, story); if (!u.ok) out.push(`market estimate "${e.label || '(unnamed)'}": ${u.issue}`); }
  for (const p of story.products ?? []) check(`${p.name || '(unnamed product)'} revenue share`, p.revenueShareMeta);
  check('gross retention', story.customers?.grossRetentionMeta);
  check('capitalisation table', story.capitalization?.meta);
  for (const f of story.financials?.forecasts ?? []) if (!usableForecast(f)) out.push(`forecast ${f.period || '(no period)'}: needs a period, a figure and its basis`);
  return out;
}

// ── a story fit for documents ──
/** The story with incomplete rows removed: what a document may be written from. The intake keeps
 *  everything the founder has typed; generators only ever see complete entries. */
export function cleanStory(st: CompanyStory): CompanyStory {
  const keep = <T>(xs: readonly T[] | undefined, ok: (x: T) => boolean): T[] => (xs ?? []).filter((x) => x != null && ok(x));
  const txt = (x: unknown): boolean => typeof x === 'string' && x.trim().length > 0;
  const num = (x: unknown): boolean => typeof x === 'number' && Number.isFinite(x);
  const out: { -readonly [K in keyof CompanyStory]: CompanyStory[K] } = { ...st, sources: keep(st.sources, (d) => txt(d.id) && txt(d.title) && txt(d.date)) };
  if (st.history) out.history = { ...st.history, milestones: keep(st.history.milestones, (m) => num(m.year) && txt(m.event)), ownershipChanges: keep(st.history.ownershipChanges, (o) => txt(o.date) && txt(o.description)) };
  if (st.products) out.products = keep(st.products, (p) => txt(p.name) && txt(p.description));
  if (st.businessModel) out.businessModel = { ...st.businessModel, revenueStreams: keep(st.businessModel.revenueStreams, (r) => txt(r.name) && num(r.sharePct)) };
  if (st.customers) out.customers = { ...st.customers, segments: keep(st.customers.segments, (x) => txt(x.name)), profiles: keep(st.customers.profiles, (x) => txt(x.label) && txt(x.description)), caseStudies: keep(st.customers.caseStudies, (x) => txt(x.title) && txt(x.summary)) };
  if (st.market) out.market = { ...st.market, geographies: keep(st.market.geographies, txt), estimates: keep(st.market.estimates, (e) => txt(e.label) && num(e.valueUsd)), competitors: keep(st.market.competitors, (x) => txt(x.name)) };
  if (st.team) out.team = { ...st.team, leaders: keep(st.team.leaders, (l) => txt(l.name) && txt(l.role) && txt(l.bio)), headcount: keep(st.team.headcount, (h) => txt(h.function) && num(h.count)) };
  if (st.capitalization) out.capitalization = { ...st.capitalization, holders: keep(st.capitalization.holders, (h) => txt(h.name) && num(h.pct)), instruments: keep(st.capitalization.instruments, (x) => txt(x.instrument) && txt(x.terms)) };
  if (st.financials) out.financials = { ...st.financials, annual: keep(st.financials.annual, (a) => txt(a.period) && (num(a.revenueUsd) || num(a.arrUsd))), forecasts: keep(st.financials.forecasts, usableForecast) };
  if (st.growth) out.growth = { opportunities: keep(st.growth.opportunities, (g) => txt(g.title) && txt(g.description)) };
  if (st.risks) out.risks = keep(st.risks, (r) => txt(r.title) && txt(r.description));
  return out;
}

// ── independent verification ──
// A verification is a record made by an authorised professional reviewer whom the
// company has engaged for that competence, about one claim, with the evidence they
// reviewed, its scope, limitations and expiry. It is stored apart from the story
// (exitos_verifications); the owner cannot create one. It holds a snapshot of the
// claim's value: when the value changes, the verification is stale and no longer
// counts. ExitOS's own format, calculation and consistency checks are not
// verification, and counsel review of legal matters does not verify figures.

export type Competence = 'financial' | 'legal' | 'commercial';
/** A claim a reviewer can verify: a headline figure, an annual period, a market estimate, gross retention or the cap table. */
export type ClaimKey = `figure:${string}` | `annual:${string}` | `market:${string}` | 'retention:gross' | 'cap';

export interface Verification {
  readonly id: string;
  readonly claim: ClaimKey;
  /** The claim's value when it was verified (meta stripped). */
  readonly value: unknown;
  readonly reviewer: string;              // reviewer's name
  readonly role: string;                  // e.g. "Chartered accountant, Example LLP"
  readonly competence: Competence;
  readonly evidence: ReadonlyArray<{ readonly description: string; readonly sourceId?: string }>;
  readonly scope: string;
  readonly limitations?: string;
  readonly verifiedAt: string;
  readonly expiresAt?: string;
  readonly revalidateWhen?: string;
  readonly revokedAt?: string;
  /** Set by the database when the story's value for the claim changed after verification. */
  readonly staleAt?: string;
}
export interface VerificationSummary {
  readonly id: string; readonly reviewer: string; readonly role: string; readonly at: string; readonly scope: string;
  readonly evidence: readonly string[]; readonly expiresAt?: string; readonly limitations?: string;
}

/** Which competence may verify a claim. */
export const claimCompetence = (claim: ClaimKey): readonly Competence[] =>
  claim === 'cap' ? ['legal', 'financial'] : claim.startsWith('market:') ? ['commercial'] : ['financial'];

const stripMeta = (v: unknown): unknown => {
  if (v == null || typeof v !== 'object' || Array.isArray(v)) return v;
  const { meta: _m, ...rest } = v as Record<string, unknown>;
  return rest;
};
/** The claim's current value in a story (the same resolution the database uses). */
export function claimValue(st: CompanyStory, claim: ClaimKey): unknown {
  if (claim.startsWith('figure:')) return st.figures?.[claim.slice(7)];
  if (claim.startsWith('annual:')) return stripMeta(st.financials?.annual.find((a) => a.period === claim.slice(7)));
  if (claim.startsWith('market:')) return stripMeta(st.market?.estimates.find((e) => e.label === claim.slice(7)));
  if (claim === 'retention:gross') return st.customers?.grossRetentionPct;
  return st.capitalization?.holders;
}

const canon = (v: unknown): string => {
  if (v === null || v === undefined) return 'null';
  if (typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canon(o[k])}`).join(',')}}`;
};

export type VerificationState = 'valid' | 'stale' | 'expired' | 'revoked';
/** Whether a verification still counts for the story as it is now. */
export function verificationState(v: Verification, st: CompanyStory, now = new Date()): VerificationState {
  if (v.revokedAt) return 'revoked';
  if (v.expiresAt && new Date(v.expiresAt) <= now) return 'expired';
  if (v.staleAt || canon(claimValue(st, v.claim)) !== canon(v.value)) return 'stale';
  return 'valid';
}

/** Remove any "verified" the story itself claims: only verification records confer it. */
export function withoutSelfVerification(st: CompanyStory): CompanyStory {
  const fix = (m: FactMeta | undefined): FactMeta | undefined => {
    if (!m || m.provenance !== 'verified') return m;
    const { verification: _v, ...rest } = m;
    return { ...rest, provenance: m.sourceId ? 'source' : 'founder' };
  };
  const json = JSON.parse(JSON.stringify(st), (k, v) => (k === 'verification' ? undefined : v)) as CompanyStory;
  const walk = (o: unknown): unknown => {
    if (Array.isArray(o)) return o.map(walk);
    if (o && typeof o === 'object') {
      const r = o as Record<string, unknown>;
      if (typeof r.provenance === 'string') return fix(r as unknown as FactMeta);
      return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, walk(v)]));
    }
    return o;
  };
  return walk(json) as CompanyStory;
}

/** The story with each validly verified claim marked "verified" (with its record), and why others do not count. */
export function applyVerifications(raw: CompanyStory, records: readonly Verification[], now = new Date()): { story: CompanyStory; notCounted: Array<{ verification: Verification; state: VerificationState }> } {
  let st = withoutSelfVerification(raw);
  const notCounted: Array<{ verification: Verification; state: VerificationState }> = [];
  for (const v of records) {
    const state = verificationState(v, st, now);
    if (state !== 'valid') { notCounted.push({ verification: v, state }); continue; }
    const summary: VerificationSummary = { id: v.id, reviewer: v.reviewer, role: v.role, at: v.verifiedAt, scope: v.scope, evidence: v.evidence.map((e) => e.description),
      ...(v.expiresAt ? { expiresAt: v.expiresAt } : {}), ...(v.limitations ? { limitations: v.limitations } : {}) };
    const mark = (m: FactMeta | undefined): FactMeta => ({ ...(m ?? { provenance: 'founder' }), provenance: 'verified', verification: summary });
    const c = v.claim;
    if (c.startsWith('figure:')) st = { ...st, headline: { ...(st.headline ?? {}), [c.slice(7)]: mark(st.headline?.[c.slice(7)]) } };
    else if (c.startsWith('annual:') && st.financials) st = { ...st, financials: { ...st.financials, annual: st.financials.annual.map((a) => (a.period === c.slice(7) ? { ...a, meta: mark(a.meta) } : a)) } };
    else if (c.startsWith('market:') && st.market) st = { ...st, market: { ...st.market, estimates: st.market.estimates.map((e) => (e.label === c.slice(7) ? { ...e, meta: mark(e.meta) } : e)) } };
    else if (c === 'retention:gross' && st.customers) st = { ...st, customers: { ...st.customers, grossRetentionMeta: mark(st.customers.grossRetentionMeta) } };
    else if (c === 'cap' && st.capitalization) st = { ...st, capitalization: { ...st.capitalization, meta: mark(st.capitalization.meta) } };
  }
  return { story: st, notCounted };
}
