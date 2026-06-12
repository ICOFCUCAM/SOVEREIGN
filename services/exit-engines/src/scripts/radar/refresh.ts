// ── PHASE 6 · ACQUISITION RADAR — refresh + delta detection ─────────
// Compares the freshly-built DNA against the previous snapshot and emits
// data/radar_deltas.json: appetite changes, new acquisitions detected,
// cadence shifts — the daily heartbeat of the buyer graph. Run by the
// scheduled workflow after `ingest` + `dna`; locally via `npm run radar`.

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

interface Dna {
  buyer_id: string; name: string; appetite: string;
  events_indexed: number; deals_12m: number;
  last_acquisition?: { date: string; target: string };
}

export interface RadarDelta {
  readonly buyer_id: string;
  readonly name: string;
  readonly kind: 'appetite_change' | 'new_acquisition' | 'cadence_shift' | 'new_buyer';
  readonly before: string;
  readonly after: string;
  readonly detail: string;
  readonly detected_at: string;
}

const DATA = join(process.cwd(), 'data');
const CURRENT = join(DATA, 'buyer_dna.json');
const PREVIOUS = join(DATA, 'buyer_dna.previous.json');

export function detectDeltas(): RadarDelta[] {
  if (!existsSync(CURRENT)) throw new Error('no DNA snapshot — run `npm run dna` first');
  const now = (JSON.parse(readFileSync(CURRENT, 'utf8')) as { profiles: Dna[] }).profiles;
  if (!existsSync(PREVIOUS)) return [];                    // first run: nothing to diff yet

  const prev = (JSON.parse(readFileSync(PREVIOUS, 'utf8')) as { profiles: Dna[] }).profiles;
  const prevById = new Map(prev.map((p) => [p.buyer_id, p]));
  const detected_at = new Date().toISOString();
  const deltas: RadarDelta[] = [];

  for (const cur of now) {
    const old = prevById.get(cur.buyer_id);
    if (!old) {
      deltas.push({ buyer_id: cur.buyer_id, name: cur.name, kind: 'new_buyer', before: '—', after: `${cur.events_indexed} events`, detail: 'buyer entered the index', detected_at });
      continue;
    }
    if (old.appetite !== cur.appetite) {
      deltas.push({ buyer_id: cur.buyer_id, name: cur.name, kind: 'appetite_change', before: old.appetite, after: cur.appetite, detail: `appetite ${old.appetite} → ${cur.appetite}`, detected_at });
    }
    if (cur.events_indexed > old.events_indexed) {
      deltas.push({
        buyer_id: cur.buyer_id, name: cur.name, kind: 'new_acquisition',
        before: String(old.events_indexed), after: String(cur.events_indexed),
        detail: `+${cur.events_indexed - old.events_indexed} indexed event(s)${cur.last_acquisition ? ` · latest: ${cur.last_acquisition.target}` : ''}`,
        detected_at,
      });
    }
    if (cur.deals_12m !== old.deals_12m) {
      deltas.push({ buyer_id: cur.buyer_id, name: cur.name, kind: 'cadence_shift', before: `${old.deals_12m}/12m`, after: `${cur.deals_12m}/12m`, detail: 'trailing-12-month cadence moved', detected_at });
    }
  }
  return deltas;
}

const isMain = process.argv[1]?.endsWith('refresh.js');
if (isMain) {
  const deltas = detectDeltas();
  writeFileSync(join(DATA, 'radar_deltas.json'), JSON.stringify({ detected_at: new Date().toISOString(), count: deltas.length, deltas }, null, 1));
  // current becomes the next run's baseline
  copyFileSync(CURRENT, PREVIOUS);
  console.log(`radar: ${deltas.length} delta(s) detected; baseline rotated`);
  for (const d of deltas.slice(0, 10)) console.log(`  ${d.kind} · ${d.name}: ${d.detail}`);
}
