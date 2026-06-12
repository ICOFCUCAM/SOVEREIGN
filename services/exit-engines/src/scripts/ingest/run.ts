// ── INGESTION ORCHESTRATOR ──────────────────────────────────────────
// Builds the four registries the platform runs on:
//   data/buyer_registry.json        — corporates, PE, sovereign funds
//   data/acquisition_events.json    — row-level events with provenance
//   data/acquisition_registry.json  — per-buyer rollups
//   data/buyer_graph.json           — co-acquisition industry graph
//
// HARD RULES: no mock data, no generated buyers, no generated
// acquisitions. The preflight aborts the run if any source host is
// unreachable — an empty registry is acceptable; a fabricated one is not.
//
// Usage:  npm run ingest             (full run)
//         npm run ingest -- --pages 12 --no-sec   (limit for smoke tests)

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { preflight, REQUIRED_HOSTS } from './util.js';
import { meta, slug, type IngestedAcquisition, type IngestedBuyer, type GraphEdgeRecord } from './types.js';
import { PRIMARY_LIST_PAGES, CORPORATE_ACQUIRERS, PRIVATE_EQUITY_ACQUIRERS, SWF_LIST_PAGE } from './sources.js';
import { discoverListPages, ingestListPage, buyerFromTitle } from './wikipedia.js';
import { ingestUniverse } from './universe.js';
import { resolveQid, acquisitionsOf } from './wikidata.js';
import { resolveCik, itemTwoOhOneFilings, filingsToEvents, corroborate, type SecFiling } from './sec.js';
import { parse as parseHtml } from 'node-html-parser';
import { politeFetch, cleanCell, parseMoneyUsd } from './util.js';

const OUT_DIR = join(process.cwd(), 'data');
const argv = process.argv.slice(2);
const flag = (name: string): boolean => argv.includes(`--${name}`);
const opt = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

async function ingestSwf(): Promise<IngestedBuyer[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${SWF_LIST_PAGE}&prop=text&format=json&formatversion=2&redirects=1`;
  const res = await politeFetch(url);
  const json = (await res.json()) as { parse?: { text?: string } };
  if (!json.parse?.text) return [];
  const root = parseHtml(json.parse.text);
  const out: IngestedBuyer[] = [];
  const pageUrl = `https://en.wikipedia.org/wiki/${SWF_LIST_PAGE}`;
  for (const table of root.querySelectorAll('table.wikitable')) {
    const rows = table.querySelectorAll('tr');
    const headers = rows[0]?.querySelectorAll('th').map((th) => cleanCell(th.text).toLowerCase()) ?? [];
    const iName = headers.findIndex((h) => /fund|name/.test(h));
    const iCountry = headers.findIndex((h) => /country|region/.test(h));
    const iAum = headers.findIndex((h) => /assets|aum|billion/.test(h));
    if (iName < 0) continue;
    for (const row of rows.slice(1)) {
      const cells = row.querySelectorAll('td,th').map((c) => cleanCell(c.text));
      const name = cells[iName];
      if (!name || name.length < 3) continue;
      out.push({
        ...meta('wikipedia_swf', pageUrl, 'reported', 'unverified'),
        buyer_id: slug(name),
        name,
        buyer_type: 'sovereign_fund',
        ...(iCountry >= 0 && cells[iCountry] ? { country: cells[iCountry]!.slice(0, 60) } : {}),
        ...(iAum >= 0 && parseMoneyUsd(`$${cells[iAum]} billion`) ? { aum_usd: parseMoneyUsd(`$${cells[iAum]} billion`)! } : {}),
        list_page: SWF_LIST_PAGE,
      });
    }
  }
  return out;
}

function buildGraph(events: IngestedAcquisition[]): GraphEdgeRecord[] {
  // co-acquisition graph: buyers connected through shared target industries
  const tok = (s: string): string[] => s.toLowerCase().split(/[,;/·&]| and /).map((x) => x.trim()).filter((x) => x.length > 3);
  const byBuyer = new Map<string, Map<string, number>>();
  for (const e of events) {
    if (!e.industry) continue;
    const m = byBuyer.get(e.buyer_id) ?? new Map<string, number>();
    for (const t of tok(e.industry)) m.set(t, (m.get(t) ?? 0) + 1);
    byBuyer.set(e.buyer_id, m);
  }
  const ids = [...byBuyer.keys()];
  const edges: GraphEdgeRecord[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = byBuyer.get(ids[i]!)!;
      const b = byBuyer.get(ids[j]!)!;
      const shared: string[] = [];
      let weight = 0;
      for (const [t, n] of a) { const m = b.get(t); if (m) { shared.push(t); weight += Math.min(n, m); } }
      if (shared.length >= 1 && weight >= 2) {
        edges.push({
          ...meta('wikipedia', 'https://en.wikipedia.org/wiki/Lists_of_corporate_mergers_and_acquisitions', 'estimated', 'unverified'),
          a: ids[i]!, b: ids[j]!, shared_industries: shared.slice(0, 8), weight,
        });
      }
    }
  }
  return edges.sort((x, y) => y.weight - x.weight);
}

async function main(): Promise<void> {
  console.log('── ExitOS acquisition-registry ingestion ──');
  console.log(`required hosts: ${REQUIRED_HOSTS.join(', ')}`);
  await preflight();
  console.log('✓ egress preflight passed');

  // ── L1: enumerate list pages ────────────────────────────────────
  const discovered = await discoverListPages();
  const pageLimit = opt('pages') ? parseInt(opt('pages')!, 10) : Infinity;
  const pages = [...new Set([...PRIMARY_LIST_PAGES, ...discovered])].slice(0, Math.max(PRIMARY_LIST_PAGES.length, pageLimit));
  console.log(`list pages: ${pages.length} (${discovered.length} discovered from master index)`);

  // ── L2: parse every list page ───────────────────────────────────
  const events: IngestedAcquisition[] = [];
  for (const page of pages) {
    try {
      const recs = await ingestListPage(page);
      console.log(`  ${page}: ${recs.length} records`);
      events.push(...recs);
    } catch (err) {
      console.warn(`  ! ${page}: ${(err as Error).message.slice(0, 120)}`);
    }
  }

  // ── L3: buyers — corporates + PE (resolved), SWFs (list page) ──
  const buyers: IngestedBuyer[] = [];
  const seedBuyers: Array<[string, IngestedBuyer['buyer_type']]> = [
    ...CORPORATE_ACQUIRERS.map((n) => [n, 'corporate'] as [string, IngestedBuyer['buyer_type']]),
    ...PRIVATE_EQUITY_ACQUIRERS.map((n) => [n, 'private_equity'] as [string, IngestedBuyer['buyer_type']]),
  ];
  // every buyer that owns a list page is a buyer too
  for (const page of pages) {
    const name = buyerFromTitle(page);
    if (!seedBuyers.some(([n]) => n.toLowerCase() === name.toLowerCase())) seedBuyers.push([name, 'corporate']);
  }
  for (const [name, type] of seedBuyers) {
    try {
      const qid = await resolveQid(name);
      const cik = type !== 'sovereign_fund' && !flag('no-sec') ? await resolveCik(name) : undefined;
      buyers.push({
        ...meta(qid ? 'wikidata' : 'wikipedia',
          qid ? `https://www.wikidata.org/wiki/${qid}` : `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`,
          'reported', cik ? 'corroborated' : 'unverified'),
        buyer_id: slug(name), name, buyer_type: type,
        ...(qid ? { qid } : {}), ...(cik ? { cik } : {}),
      });
      console.log(`  buyer ${name}: qid=${qid ?? '—'} cik=${cik ?? '—'}`);
    } catch (err) {
      console.warn(`  ! buyer ${name}: ${(err as Error).message.slice(0, 100)}`);
    }
  }
  if (!flag('no-swf')) {
    const swfs = await ingestSwf();
    console.log(`  sovereign funds: ${swfs.length}`);
    buyers.push(...swfs);
  }
  // ── L3b: buyer universe — S&P 500 (GICS taxonomy), largest US, family offices
  if (!flag('no-universe')) {
    try {
      const uni = await ingestUniverse();
      const known = new Set(buyers.map((b) => b.buyer_id));
      const fresh = uni.buyers.filter((b) => !known.has(b.buyer_id));
      buyers.push(...fresh);
      console.log(`  buyer universe: +${fresh.length} (S&P ${uni.counts.sp500} · largest US ${uni.counts.largest_us} · family offices ${uni.counts.family_offices})`);
    } catch (err) {
      console.warn(`  ! buyer universe: ${(err as Error).message.slice(0, 100)}`);
    }
  }

  // ── L4: Wikidata acquisitions for buyers with QIDs ──────────────
  if (!flag('no-wikidata')) {
    for (const b of buyers.filter((x) => x.qid && x.buyer_type !== 'sovereign_fund')) {
      try {
        const recs = await acquisitionsOf(b.name, b.qid!);
        const known = new Set(events.map((e) => e.acquisition_id));
        const fresh = recs.filter((r) => !known.has(r.acquisition_id));
        if (fresh.length) console.log(`  wikidata ${b.name}: +${fresh.length}`);
        events.push(...fresh);
      } catch (err) {
        console.warn(`  ! wikidata ${b.name}: ${(err as Error).message.slice(0, 100)}`);
      }
    }
  }

  // ── L5: SEC verification layer ──────────────────────────────────
  let verified: IngestedAcquisition[] = events;
  if (!flag('no-sec')) {
    const filingsByBuyer = new Map<string, SecFiling[]>();
    for (const b of buyers.filter((x) => x.cik)) {
      try {
        const filings = await itemTwoOhOneFilings(b.cik!);
        filingsByBuyer.set(b.buyer_id, filings);
        events.push(...filingsToEvents(b.name, filings));
        if (filings.length) console.log(`  sec ${b.name}: ${filings.length} 8-K item 2.01 filings`);
      } catch (err) {
        console.warn(`  ! sec ${b.name}: ${(err as Error).message.slice(0, 100)}`);
      }
    }
    verified = corroborate(events, filingsByBuyer);
  }

  // ── dedupe + emit ───────────────────────────────────────────────
  const seen = new Set<string>();
  const finalEvents = verified.filter((e) => (seen.has(e.acquisition_id) ? false : (seen.add(e.acquisition_id), true)));

  const rollup = [...new Set(finalEvents.map((e) => e.buyer_id))].map((id) => {
    const evs = finalEvents.filter((e) => e.buyer_id === id);
    return {
      ...meta('wikipedia', evs[0]!.source_url, 'reported', 'unverified'),
      buyer_id: id,
      buyer_name: evs[0]!.buyer_name,
      total_acquisitions: evs.length,
      disclosed_value_usd: evs.reduce((s, e) => s + (e.value_usd ?? 0), 0),
      first_date: evs.map((e) => e.announced_date).filter(Boolean).sort()[0] ?? null,
      last_date: evs.map((e) => e.announced_date).filter(Boolean).sort().at(-1) ?? null,
    };
  });

  const graph = buildGraph(finalEvents);

  mkdirSync(OUT_DIR, { recursive: true });
  const write = (name: string, data: unknown): void => {
    writeFileSync(join(OUT_DIR, name), JSON.stringify(data, null, 1));
    console.log(`  wrote data/${name}`);
  };
  write('buyer_registry.json', buyers);
  write('acquisition_events.json', finalEvents);
  write('acquisition_registry.json', rollup);
  write('buyer_graph.json', graph);
  write('ingest_manifest.json', {
    generated_at: new Date().toISOString(),
    hosts_used: REQUIRED_HOSTS,
    counts: { buyers: buyers.length, acquisition_events: finalEvents.length, rollups: rollup.length, graph_edges: graph.length },
    targets: { buyers: 1000, acquisition_events: 5000 },
  });

  console.log('──────────────────────────────────────');
  console.log(`buyers: ${buyers.length} (target 1000)`);
  console.log(`acquisition events: ${finalEvents.length} (target 5000)`);
  console.log(`graph edges: ${graph.length}`);
}

main().catch((err) => { console.error(String(err?.message ?? err)); process.exit(1); });
