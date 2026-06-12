// ── PHASE 2 · IMPORT-READY CONNECTOR LAYER ──────────────────────────
// Contracts for the sources that have no open API from this environment:
// Crunchbase, PitchBook, LinkedIn, patent databases, job-posting signals,
// company acquisition/corp-dev pages and press releases.
//
// Each connector accepts a REAL export file (CSV/JSON drop from the
// licensed product) and normalizes it into the registry contract. There
// is no synthesis path: a connector with no file yields zero records and
// says so. Provenance is stamped per record like every other pipeline.

import { existsSync, readFileSync } from 'node:fs';
import { meta, acquisitionId, slug, type IngestedAcquisition } from './types.js';

export interface ConnectorResult {
  readonly connector: string;
  readonly status: 'loaded' | 'no_file' | 'rejected';
  readonly records: readonly IngestedAcquisition[];
  readonly note: string;
}

interface ConnectorSpec {
  readonly name: string;
  readonly dropPath: string;               // where the operator places the export
  readonly requiredColumns: readonly string[];
  readonly sourceUrlColumn: string;        // every row must carry its own source URL
}

// The drop-in contracts. Column names follow each product's standard export.
export const CONNECTORS: readonly ConnectorSpec[] = [
  { name: 'crunchbase',     dropPath: 'imports/crunchbase_acquisitions.json', requiredColumns: ['acquirer_name', 'acquiree_name', 'announced_on', 'cb_url'],   sourceUrlColumn: 'cb_url' },
  { name: 'pitchbook',      dropPath: 'imports/pitchbook_deals.json',          requiredColumns: ['investor', 'company', 'deal_date', 'pb_url'],                 sourceUrlColumn: 'pb_url' },
  { name: 'linkedin',       dropPath: 'imports/linkedin_corpdev.json',         requiredColumns: ['company', 'signal', 'observed_at', 'profile_url'],            sourceUrlColumn: 'profile_url' },
  { name: 'patents',        dropPath: 'imports/patent_assignments.json',       requiredColumns: ['assignee', 'assignor', 'recorded_at', 'uspto_url'],           sourceUrlColumn: 'uspto_url' },
  { name: 'job_postings',   dropPath: 'imports/jobs_signals.json',             requiredColumns: ['company', 'role', 'posted_at', 'posting_url'],                sourceUrlColumn: 'posting_url' },
  { name: 'press_releases', dropPath: 'imports/press_acquisitions.json',       requiredColumns: ['buyer', 'target', 'date', 'release_url'],                     sourceUrlColumn: 'release_url' },
] as const;

/** Load one connector's drop file, if present and well-formed. */
export function loadConnector(spec: ConnectorSpec, baseDir = process.cwd()): ConnectorResult {
  const path = `${baseDir}/${spec.dropPath}`;
  if (!existsSync(path)) {
    return { connector: spec.name, status: 'no_file', records: [], note: `no export at ${spec.dropPath} — drop a real ${spec.name} export to ingest it` };
  }
  let rows: Array<Record<string, unknown>>;
  try {
    rows = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { connector: spec.name, status: 'rejected', records: [], note: 'file is not valid JSON' };
  }
  const missing = spec.requiredColumns.filter((c) => rows.length > 0 && !(c in rows[0]!));
  if (missing.length > 0) {
    return { connector: spec.name, status: 'rejected', records: [], note: `missing required columns: ${missing.join(', ')}` };
  }

  const records: IngestedAcquisition[] = [];
  for (const row of rows) {
    const url = String(row[spec.sourceUrlColumn] ?? '');
    if (!/^https?:\/\//.test(url)) continue;            // unsourced rows never enter
    const buyer = String(row['acquirer_name'] ?? row['investor'] ?? row['buyer'] ?? row['assignee'] ?? row['company'] ?? '');
    const target = String(row['acquiree_name'] ?? row['company'] ?? row['target'] ?? row['assignor'] ?? row['signal'] ?? '');
    const date = String(row['announced_on'] ?? row['deal_date'] ?? row['date'] ?? row['recorded_at'] ?? row['observed_at'] ?? '').slice(0, 10) || undefined;
    if (!buyer || !target) continue;
    records.push({
      // connector imports are third-party-reported until corroborated
      ...meta('wikipedia', url, 'reported', 'unverified'),
      source: spec.name as never,                        // the connector IS the source
      acquisition_id: acquisitionId(buyer, target, date),
      buyer_id: slug(buyer),
      buyer_name: buyer,
      target_name: target,
      ...(date ? { announced_date: date } : {}),
    });
  }
  return { connector: spec.name, status: 'loaded', records, note: `${records.length} sourced records from the drop file` };
}

export function loadAllConnectors(baseDir = process.cwd()): ConnectorResult[] {
  return CONNECTORS.map((c) => loadConnector(c, baseDir));
}
