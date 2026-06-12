// ── ACQUISITION DNA BUILDER ─────────────────────────────────────────
// Distills the ingested registries (data/acquisition_events.json +
// data/buyer_registry.json) into per-buyer Acquisition DNA profiles —
// the compact intelligence layer the founder surfaces render instead of
// raw lists. Pure derivation from ingested records: no mock data, no
// network. Output: data/buyer_dna.json (+ sector token index).
//
// Usage: npm run dna   (requires the ingest to have run first)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface Ev {
  buyer_id: string; buyer_name: string; target_name: string;
  announced_date?: string; value_usd?: number; industry?: string; country?: string;
  source: string; source_url: string; verification_status: string;
}
interface Buyer {
  buyer_id: string; name: string; buyer_type: string; country?: string;
  qid?: string; cik?: string; aum_usd?: number; source_url: string;
}

export interface BuyerDna {
  buyer_id: string;
  name: string;
  buyer_type: string;
  country?: string;
  events_indexed: number;
  disclosed_events: number;                    // events with a USD value
  last_acquisition?: { date: string; target: string };
  max_deal?: { usd: number; target: string };
  avg_deal_usd?: number;                       // mean of disclosed values
  deals_12m: number;
  deals_3y: number;
  appetite: 'high' | 'medium' | 'low' | 'no_events';
  sector_tokens: Array<{ token: string; count: number }>;
  verified_events: number;                     // sec_edgar-verified or corroborated
  // provenance
  derived_from: 'acquisition_events.json';
  source_url: string;                          // the buyer's registry source
  generated_at: string;
}

const DATA = join(process.cwd(), 'data');
const tokenize = (s: string): string[] =>
  s.toLowerCase().split(/[,;/·&()]| and /).map((x) => x.trim()).filter((x) => x.length > 3 && !/^\d+$/.test(x));

export function buildDna(): { dna: BuyerDna[]; asOf: string } {
  if (!existsSync(join(DATA, 'acquisition_events.json'))) {
    throw new Error('ingested registries not found — run `npm run ingest` first (no DNA is generated from nothing)');
  }
  const events = JSON.parse(readFileSync(join(DATA, 'acquisition_events.json'), 'utf8')) as Ev[];
  const buyers = JSON.parse(readFileSync(join(DATA, 'buyer_registry.json'), 'utf8')) as Buyer[];
  const manifest = JSON.parse(readFileSync(join(DATA, 'ingest_manifest.json'), 'utf8')) as { generated_at: string };
  const asOf = manifest.generated_at;
  const asOfMs = new Date(asOf).getTime();
  const YEAR = 365 * 86_400_000;

  // ── entity resolution: merge alias identities ─────────────────────
  // Master-index crawling yields alias pages ("Cisco" vs "Cisco Systems",
  // "Google" vs "Alphabet" stay separate — only suffix aliases merge).
  // Events are deduped per merged buyer by target+date.
  const normalize = (s: string): string =>
    s.toLowerCase().replace(/[.,]/g, '').replace(/\b(systems|inc|incorporated|corp|corporation|company|co|plc|technologies|platforms)\b/g, '').replace(/\s+/g, ' ').trim();
  const canonicalByNorm = new Map<string, string>();   // normalized name → canonical buyer_id
  const aliasToCanonical = new Map<string, string>();  // buyer_id → canonical buyer_id
  const nameOf = new Map<string, string>();
  for (const e of events) if (!nameOf.has(e.buyer_id)) nameOf.set(e.buyer_id, e.buyer_name);
  for (const b of buyers) nameOf.set(b.buyer_id, b.name);
  for (const [id, name] of nameOf) {
    const norm = normalize(name);
    const canonical = canonicalByNorm.get(norm);
    if (canonical) aliasToCanonical.set(id, canonical);
    else { canonicalByNorm.set(norm, id); aliasToCanonical.set(id, id); }
  }

  const byBuyer = new Map<string, Ev[]>();
  const seenEvent = new Map<string, Set<string>>();    // canonical → target|date keys
  for (const e of events) {
    const cid = aliasToCanonical.get(e.buyer_id) ?? e.buyer_id;
    const key = `${e.target_name.toLowerCase()}|${e.announced_date ?? ''}`;
    const seen = seenEvent.get(cid) ?? new Set<string>();
    if (seen.has(key)) continue;                       // alias-duplicate event
    seen.add(key);
    seenEvent.set(cid, seen);
    const arr = byBuyer.get(cid) ?? [];
    arr.push(e);
    byBuyer.set(cid, arr);
  }
  // events may name buyers absent from the seed registry (master-index pages)
  const knownIds = new Set(buyers.map((b) => b.buyer_id));
  const extra = [...byBuyer.keys()].filter((id) => !knownIds.has(id));

  const profiles: BuyerDna[] = [];
  const generated_at = new Date().toISOString();

  const profile = (b: Buyer): BuyerDna => {
    const evs = (byBuyer.get(b.buyer_id) ?? []).filter((e) => !e.target_name.startsWith('[8-K'));
    const dated = evs.filter((e) => e.announced_date && /^\d{4}-\d{2}/.test(e.announced_date)).sort((x, y) => x.announced_date!.localeCompare(y.announced_date!));
    const valued = evs.filter((e) => typeof e.value_usd === 'number' && e.value_usd! > 0);
    const last = dated.at(-1);
    const max = valued.length ? valued.reduce((m, e) => (e.value_usd! > m.value_usd! ? e : m)) : undefined;
    const deals12 = dated.filter((e) => asOfMs - new Date(e.announced_date!).getTime() <= YEAR).length;
    const deals36 = dated.filter((e) => asOfMs - new Date(e.announced_date!).getTime() <= 3 * YEAR).length;

    const tokens = new Map<string, number>();
    for (const e of evs) if (e.industry) for (const t of tokenize(e.industry)) tokens.set(t, (tokens.get(t) ?? 0) + 1);

    return {
      buyer_id: b.buyer_id,
      name: b.name,
      buyer_type: b.buyer_type,
      ...(b.country ? { country: b.country } : {}),
      events_indexed: evs.length,
      disclosed_events: valued.length,
      ...(last ? { last_acquisition: { date: last.announced_date!, target: last.target_name } } : {}),
      ...(max ? { max_deal: { usd: max.value_usd!, target: max.target_name } } : {}),
      ...(valued.length ? { avg_deal_usd: Math.round(valued.reduce((s, e) => s + e.value_usd!, 0) / valued.length) } : {}),
      deals_12m: deals12,
      deals_3y: deals36,
      appetite: evs.length === 0 ? 'no_events' : deals12 >= 2 ? 'high' : deals36 >= 1 ? 'medium' : 'low',
      sector_tokens: [...tokens.entries()].sort((a, z) => z[1] - a[1]).slice(0, 6).map(([token, count]) => ({ token, count })),
      verified_events: evs.filter((e) => e.verification_status !== 'unverified').length,
      derived_from: 'acquisition_events.json',
      source_url: b.source_url,
      generated_at,
    };
  };

  const emitted = new Set<string>();
  for (const b of buyers) {
    const cid = aliasToCanonical.get(b.buyer_id) ?? b.buyer_id;
    if (emitted.has(cid)) continue;                    // alias of an already-emitted buyer
    emitted.add(cid);
    profiles.push(profile({ ...b, buyer_id: cid }));
  }
  for (const id of extra) {
    const cid = aliasToCanonical.get(id) ?? id;
    if (emitted.has(cid) || !byBuyer.has(cid)) continue;
    emitted.add(cid);
    const first = byBuyer.get(cid)![0]!;
    profiles.push(profile({ buyer_id: cid, name: first.buyer_name, buyer_type: 'corporate', source_url: first.source_url }));
  }

  profiles.sort((a, b) => b.events_indexed - a.events_indexed);
  return { dna: profiles, asOf };
}

/** Sector extract — real events whose industry matches the given tokens
 *  (small enough to bundle for the Similar Transactions surface). */
export function buildSectorExtract(tokens: string[]): unknown[] {
  const events = JSON.parse(readFileSync(join(DATA, 'acquisition_events.json'), 'utf8')) as Ev[];
  const seen = new Set<string>();
  return events
    .filter((e) => e.industry && tokens.some((t) => e.industry!.toLowerCase().includes(t)))
    .filter((e) => {
      const k = `${e.target_name.toLowerCase()}|${e.announced_date ?? ''}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => (b.announced_date ?? '').localeCompare(a.announced_date ?? ''))
    .map((e) => ({
      buyer: e.buyer_name, target: e.target_name, date: e.announced_date ?? null,
      value_usd: e.value_usd ?? null, industry: e.industry, source: e.source,
      source_url: e.source_url, verification_status: e.verification_status,
    }));
}

const SECTOR_TOKENS = ['logistic', 'freight', 'transport', 'supply chain', 'fleet', 'shipping', 'delivery', 'trucking'];

const isMain = process.argv[1]?.endsWith('build.js');
if (isMain) {
  const { dna, asOf } = buildDna();
  writeFileSync(join(DATA, 'buyer_dna.json'), JSON.stringify({ as_of: asOf, profiles: dna }, null, 1));
  const extract = buildSectorExtract(SECTOR_TOKENS);
  writeFileSync(join(DATA, 'sector_transactions.json'), JSON.stringify({ as_of: asOf, tokens: SECTOR_TOKENS, transactions: extract }, null, 1));
  console.log(`sector_transactions.json: ${extract.length} logistics-relevant events`);
  const withEvents = dna.filter((d) => d.events_indexed > 0);
  console.log(`buyer_dna.json: ${dna.length} profiles (${withEvents.length} with indexed events)`);
  console.log(`top: ${withEvents.slice(0, 5).map((d) => `${d.name}=${d.events_indexed}`).join(', ')}`);
}
