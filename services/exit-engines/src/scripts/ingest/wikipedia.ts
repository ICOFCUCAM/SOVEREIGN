// ── PIPELINE · WIKIPEDIA ACQUISITION LISTS ──────────────────────────
// Parses "List of acquisitions by X" pages into acquisition_events.
// Strategy: fetch rendered HTML via the MediaWiki parse API, walk every
// wikitable, map columns by header names (the lists vary in layout), and
// emit one record per row with full provenance back to the page URL.

import { parse as parseHtml, type HTMLElement } from 'node-html-parser';
import { politeFetch, parseMoneyUsd, parseDateIso, cleanCell } from './util.js';
import { meta, acquisitionId, slug, type IngestedAcquisition } from './types.js';
import { MASTER_INDEX_PAGE } from './sources.js';

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const pageUrl = (title: string): string => `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;

async function fetchParsedHtml(title: string): Promise<HTMLElement | null> {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&formatversion=2&redirects=1`;
  const res = await politeFetch(url);
  const json = (await res.json()) as { parse?: { text?: string } ; error?: unknown };
  if (!json.parse?.text) return null;
  return parseHtml(json.parse.text);
}

/** From the master index, enumerate every per-company acquisition list page. */
export async function discoverListPages(): Promise<string[]> {
  const root = await fetchParsedHtml(MASTER_INDEX_PAGE);
  if (!root) return [];
  const titles = new Set<string>();
  for (const a of root.querySelectorAll('a')) {
    const href = a.getAttribute('href') ?? '';
    const m = href.match(/^\/wiki\/(List_of_(?:mergers_and_)?acquisitions_by_[^#?]+)/);
    if (m) titles.add(decodeURIComponent(m[1]!));
  }
  return [...titles].sort();
}

interface ColumnMap { date?: number; target?: number; industry?: number; country?: number; value?: number; valueIsUsd?: boolean }

function mapColumns(headerCells: string[]): ColumnMap | null {
  const map: ColumnMap = {};
  headerCells.forEach((h, i) => {
    const t = h.toLowerCase();
    if (map.date === undefined && /date|announced|acquired on/.test(t)) map.date = i;
    if (map.target === undefined && /company|target|acquisition\b|acquired company/.test(t)) map.target = i;
    if (map.industry === undefined && /business|industry|category|used as|products|description/.test(t)) map.industry = i;
    if (map.country === undefined && /country|nation|headquarters|location/.test(t)) map.country = i;
    if (map.value === undefined && /value|price|cost|amount/.test(t)) { map.value = i; map.valueIsUsd = /usd|us\$|\$/.test(t); }
  });
  return map.target !== undefined ? map : null;       // a list without a target column is not an acquisition table
}

const buyerFromTitle = (title: string): string =>
  title.replace(/^List_of_(mergers_and_)?acquisitions_by_/, '').replace(/_/g, ' ');

/** Pure parser — rendered page HTML → records (unit-testable offline). */
export function parseAcquisitionTables(html: string, title: string): IngestedAcquisition[] {
  const root = parseHtml(html);
  const buyerName = buyerFromTitle(title);
  const url = pageUrl(title);
  const out: IngestedAcquisition[] = [];

  for (const table of root.querySelectorAll('table.wikitable')) {
    const rows = table.querySelectorAll('tr');
    if (rows.length < 2) continue;
    const headers = rows[0]!.querySelectorAll('th').map((th) => cleanCell(th.text));
    const cols = mapColumns(headers);
    if (!cols) continue;

    for (const row of rows.slice(1)) {
      const cells = row.querySelectorAll('td,th').map((c) => cleanCell(c.text));
      const target = cols.target !== undefined ? cells[cols.target] : undefined;
      if (!target || target.length < 2) continue;
      const dateRaw = cols.date !== undefined ? cells[cols.date] : undefined;
      const date = parseDateIso(dateRaw);
      out.push({
        ...meta('wikipedia', url, 'reported', 'unverified'),
        acquisition_id: acquisitionId(buyerName, target, date),
        buyer_id: slug(buyerName),
        buyer_name: buyerName,
        target_name: target,
        ...(date ? { announced_date: date } : {}),
        ...(cols.value !== undefined && parseMoneyUsd(cells[cols.value], cols.valueIsUsd) ? { value_usd: parseMoneyUsd(cells[cols.value], cols.valueIsUsd)! } : {}),
        ...(cols.industry !== undefined && cells[cols.industry] ? { industry: cells[cols.industry]!.slice(0, 120) } : {}),
        ...(cols.country !== undefined && cells[cols.country] ? { country: cells[cols.country]!.slice(0, 60) } : {}),
      });
    }
  }
  return out;
}

/** Parse one acquisition-list page → records. */
export async function ingestListPage(title: string): Promise<IngestedAcquisition[]> {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&formatversion=2&redirects=1`;
  const res = await politeFetch(url);
  const json = (await res.json()) as { parse?: { text?: string } };
  if (!json.parse?.text) return [];
  return parseAcquisitionTables(json.parse.text, title);
}

export { buyerFromTitle, mapColumns };
