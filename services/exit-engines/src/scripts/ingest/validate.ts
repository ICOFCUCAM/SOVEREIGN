// Validates generated registries: every record must carry the five
// provenance fields with a real source_url. Used by tests and CI — a
// dataset that fails validation must not ship.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED = ['source', 'source_url', 'confidence', 'verification_status', 'last_updated'] as const;

export interface ValidationResult {
  readonly present: boolean;
  readonly counts: Record<string, number>;
  readonly errors: string[];
}

export function validateRegistries(dataDir = join(process.cwd(), 'data')): ValidationResult {
  const files = ['buyer_registry.json', 'acquisition_events.json', 'acquisition_registry.json', 'buyer_graph.json'];
  if (!files.every((f) => existsSync(join(dataDir, f)))) {
    return { present: false, counts: {}, errors: ['datasets not generated yet — run `npm run ingest`'] };
  }
  const errors: string[] = [];
  const counts: Record<string, number> = {};
  for (const file of files) {
    const rows = JSON.parse(readFileSync(join(dataDir, file), 'utf8')) as Array<Record<string, unknown>>;
    counts[file] = rows.length;
    rows.forEach((row, i) => {
      for (const k of REQUIRED) {
        if (row[k] == null || row[k] === '') errors.push(`${file}[${i}] missing ${k}`);
      }
      const url = String(row['source_url'] ?? '');
      if (!/^https?:\/\/(en\.wikipedia\.org|www\.wikidata\.org|query\.wikidata\.org|www\.sec\.gov|data\.sec\.gov)\//.test(url)) {
        errors.push(`${file}[${i}] source_url not from an approved primary source: ${url.slice(0, 80)}`);
      }
    });
  }
  // dedupe check on events
  const events = JSON.parse(readFileSync(join(dataDir, 'acquisition_events.json'), 'utf8')) as Array<{ acquisition_id: string }>;
  const ids = new Set<string>();
  for (const e of events) {
    if (ids.has(e.acquisition_id)) errors.push(`duplicate acquisition_id ${e.acquisition_id}`);
    ids.add(e.acquisition_id);
  }
  return { present: true, counts, errors: errors.slice(0, 50) };
}

// CLI entry
const isMain = process.argv[1]?.endsWith('validate.js');
if (isMain) {
  const r = validateRegistries();
  console.log(JSON.stringify(r, null, 2));
  if (r.present && r.errors.length > 0) process.exit(1);
}
