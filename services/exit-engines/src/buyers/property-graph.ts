import type { SectorTag } from '../types.js';
import { BUYER_REGISTRY, type BuyerEntry } from './registry.js';
import { ACQUISITION_HISTORY } from './history.js';
import { rollupBuyerHistory } from './history-rollup.js';
import { rollupBuyerOutcomes } from './outcomes.js';

// ── PHASE 1 · THE BUYER GRAPH ───────────────────────────────────────
// Buyers are not records; they are entities in a property graph. Every
// acquisition is a typed relationship:
//
//   buyer —acquired→  target        (closed | announced)
//   buyer —attempted→ target        (terminated | lost_bid)
//   buyer —competes_with→ buyer     (lost a bid to them, or co-sector)
//   buyer —owns→      target        (closed acquisition ⇒ ownership)
//
// Entity properties follow the full Phase-1 schema. Fields with no data
// source on record are EXPLICIT nulls — the graph is honest about what
// it knows, and each null names the feed that would fill it.

export type RelKind = 'acquired' | 'attempted' | 'competes_with' | 'owns';

export interface GraphEntityProps {
  buyer_type: string | null;
  headquarters: string | null;            // first preferred geography
  countries: readonly string[];
  sectors: readonly SectorTag[];
  sub_sectors: readonly string[];         // business-model tags
  acquisition_count: number;
  check_size_low_usd: number | null;
  check_size_high_usd: number | null;
  acquisition_frequency_per_year: number | null;
  appetite_score: number | null;          // 0..100
  historical_premium_pct: number | null;
  historical_close_days: number | null;
  historical_close_rate: number | null;
  // declared-but-unfed fields (the feed that would fill each one):
  public_market_cap_usd: null;            // feed: market-data API
  cash_position_usd: null;                // feed: 10-K/10-Q parsing
  pe_fund_size_usd: null;                 // feed: Form ADV / press
  fund_vintage: null;                     // feed: Form ADV / press
  acquisition_team: null;                 // feed: LinkedIn connector
  corp_dev_contacts: null;                // feed: LinkedIn connector
  portfolio_companies: readonly string[]; // derived from owns-relations
  expansion_targets: readonly string[];   // derived from recent event geographies
  strategic_priorities: readonly string[];// derived from recent sector activity
}

export interface GraphEntity {
  readonly id: string;
  readonly kind: 'buyer' | 'company';
  readonly name: string;
  readonly props: GraphEntityProps | null;   // null for plain target companies
}

export interface GraphRelation {
  readonly from: string;                  // entity id
  readonly to: string;
  readonly kind: RelKind;
  readonly props: {
    readonly date?: string;
    readonly price_usd?: number;
    readonly status?: string;
    readonly basis?: string;              // for competes_with: 'lost_bid' | 'co_sector'
    readonly sectors?: readonly SectorTag[];
  };
  readonly provenance: { readonly source: string; readonly ref: string };
}

export interface BuyerGraph {
  readonly entities: readonly GraphEntity[];
  readonly relations: readonly GraphRelation[];
  // graph queries — relationships, not table scans
  neighbors(id: string, kind?: RelKind): GraphRelation[];
  portfolioOf(buyerName: string): string[];
  competitorsOf(buyerName: string): Array<{ name: string; basis: string }>;
  attemptsOf(buyerName: string): GraphRelation[];
}

const eid = (kind: 'buyer' | 'company', name: string): string =>
  `${kind}:${name.toLowerCase().replace(/[^\w]+/g, '-')}`;

function buyerProps(b: BuyerEntry): GraphEntityProps {
  const hist = rollupBuyerHistory(b.name);
  const out = rollupBuyerOutcomes(b.name);
  const dates = ACQUISITION_HISTORY
    .filter((e) => e.buyerName === b.name && e.announcedDate)
    .map((e) => new Date(e.announcedDate).getTime());
  const spanYears = dates.length >= 2 ? (Math.max(...dates) - Math.min(...dates)) / (365 * 86_400_000) : 0;
  const freq = spanYears > 0.5 ? +(hist.totalDeals / spanYears).toFixed(1) : null;

  const recent = ACQUISITION_HISTORY.filter(
    (e) => e.buyerName === b.name && e.announcedDate && Date.now() - new Date(e.announcedDate).getTime() < 3 * 365 * 86_400_000,
  );
  const owns = ACQUISITION_HISTORY.filter((e) => e.buyerName === b.name && e.status === 'closed');

  return {
    buyer_type: b.buyerType,
    headquarters: b.geographyPreferred[0] ?? null,
    countries: b.geographyPreferred,
    sectors: b.sectorsActive,
    sub_sectors: b.modelsActive,
    acquisition_count: hist.totalDeals,
    check_size_low_usd: b.checkSizeLowUsd,
    check_size_high_usd: b.checkSizeHighUsd,
    acquisition_frequency_per_year: freq,
    appetite_score: Math.round(b.recentActivityScore * 100),
    historical_premium_pct: out.avgPremiumPct ?? null,
    historical_close_days: out.medianCloseDays ?? null,
    historical_close_rate: out.closeRatePct ?? null,
    public_market_cap_usd: null,
    cash_position_usd: null,
    pe_fund_size_usd: null,
    fund_vintage: null,
    acquisition_team: null,
    corp_dev_contacts: null,
    portfolio_companies: owns.map((e) => e.targetName),
    expansion_targets: [...new Set(recent.map((e) => e.targetGeography).filter((g): g is string => !!g))],
    strategic_priorities: [...new Set(recent.map((e) => e.sector).filter((s): s is SectorTag => !!s))],
  };
}

export function buildBuyerGraph(): BuyerGraph {
  const entities = new Map<string, GraphEntity>();
  const relations: GraphRelation[] = [];

  for (const b of BUYER_REGISTRY) {
    entities.set(eid('buyer', b.name), { id: eid('buyer', b.name), kind: 'buyer', name: b.name, props: buyerProps(b) });
  }

  for (const e of ACQUISITION_HISTORY) {
    const from = eid('buyer', e.buyerName);
    const to = eid('company', e.targetName);
    if (!entities.has(from)) entities.set(from, { id: from, kind: 'buyer', name: e.buyerName, props: null });
    if (!entities.has(to)) entities.set(to, { id: to, kind: 'company', name: e.targetName, props: null });
    const provenance = { source: e.sourceRefs[0]?.kind ?? 'manual', ref: e.sourceRefs[0]?.ref ?? '' };
    const base = {
      ...(e.announcedDate ? { date: e.announcedDate } : {}),
      ...(e.headlinePriceUsd ? { price_usd: e.headlinePriceUsd } : {}),
      status: e.status,
    };

    if (e.status === 'closed' || e.status === 'announced' || e.status === 'pending') {
      relations.push({ from, to, kind: 'acquired', props: base, provenance });
      if (e.status === 'closed') relations.push({ from, to, kind: 'owns', props: base, provenance });
    } else {
      relations.push({ from, to, kind: 'attempted', props: base, provenance });
    }
    // a lost bid is direct, evidenced competition with the winner
    if (e.status === 'lost_bid' && e.winningBuyerName) {
      const rival = eid('buyer', e.winningBuyerName);
      if (!entities.has(rival)) entities.set(rival, { id: rival, kind: 'buyer', name: e.winningBuyerName, props: null });
      relations.push({ from, to: rival, kind: 'competes_with', props: { ...base, basis: 'lost_bid' }, provenance });
    }
  }

  // co-sector competition: buyers with overlapping closed-deal sectors
  const sectorsOf = new Map<string, Set<SectorTag>>();
  for (const e of ACQUISITION_HISTORY) {
    if (!e.sector || e.status !== 'closed') continue;
    const s = sectorsOf.get(e.buyerName) ?? new Set<SectorTag>();
    s.add(e.sector);
    sectorsOf.set(e.buyerName, s);
  }
  const names = [...sectorsOf.keys()];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const shared = [...sectorsOf.get(names[i]!)!].filter((s) => sectorsOf.get(names[j]!)!.has(s));
      if (shared.length >= 2) {
        relations.push({
          from: eid('buyer', names[i]!), to: eid('buyer', names[j]!), kind: 'competes_with',
          props: { basis: 'co_sector', sectors: shared },
          provenance: { source: 'derived', ref: 'co-sector closed acquisitions' },
        });
      }
    }
  }

  const entityList = [...entities.values()];
  return {
    entities: entityList,
    relations,
    neighbors(id, kind) {
      return relations.filter((r) => (r.from === id || r.to === id) && (!kind || r.kind === kind));
    },
    portfolioOf(buyerName) {
      const id = eid('buyer', buyerName);
      return relations.filter((r) => r.from === id && r.kind === 'owns').map((r) => entities.get(r.to)?.name ?? r.to);
    },
    competitorsOf(buyerName) {
      const id = eid('buyer', buyerName);
      return relations
        .filter((r) => r.kind === 'competes_with' && (r.from === id || r.to === id))
        .map((r) => ({ name: entities.get(r.from === id ? r.to : r.from)?.name ?? '', basis: r.props.basis ?? '' }));
    },
    attemptsOf(buyerName) {
      const id = eid('buyer', buyerName);
      return relations.filter((r) => r.from === id && r.kind === 'attempted');
    },
  };
}
