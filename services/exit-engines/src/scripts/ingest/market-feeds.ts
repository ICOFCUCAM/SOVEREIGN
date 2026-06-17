// ── MARKET FEED CONNECTOR (node-only) ───────────────────────────────
// Loads the external market feeds the in-engine Market Data engine cannot
// fetch (public comparables, the rate environment, retrade observations)
// from a real operator drop file, imports/market_feeds.json. Each feed is
// accepted ONLY if it carries a real https source_url — unsourced feeds are
// dropped, never defaulted. With no drop file the result is {}, and those
// variables render honestly absent. Run by the egress-enabled ingestion
// job; writes data/market_conditions.json for the surfaces to inject.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { MarketFeedInput } from '../../marketdata/types.js';

const hasUrl = (o: unknown): o is { source_url: string } =>
  !!o && typeof o === 'object' && /^https?:\/\//.test(String((o as Record<string, unknown>).source_url ?? ''));

export function loadMarketFeed(baseDir = process.cwd()): MarketFeedInput {
  const path = join(baseDir, 'imports', 'market_feeds.json');
  if (!existsSync(path)) return {};
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
  const feed: MarketFeedInput = {};
  // each block enters only with a real source URL — the provenance contract
  if (hasUrl(raw.public_companies)) (feed as { public_companies: unknown }).public_companies = raw.public_companies;
  if (hasUrl(raw.interest_rate)) (feed as { interest_rate: unknown }).interest_rate = raw.interest_rate;
  if (hasUrl(raw.retrade)) (feed as { retrade: unknown }).retrade = raw.retrade;
  return feed;
}

const isMain = process.argv[1]?.endsWith('market-feeds.js');
if (isMain) {
  const feed = loadMarketFeed();
  const dir = join(process.cwd(), 'data');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'market_conditions.json'), JSON.stringify({ generated_at: new Date().toISOString(), feed }, null, 1));
  const connected = Object.keys(feed);
  console.log(`market feeds: ${connected.length ? connected.join(', ') : 'none connected (variables render honestly absent)'}`);
}
