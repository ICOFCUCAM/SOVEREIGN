// ── INGESTION DATA CONTRACTS ────────────────────────────────────────
// Every record that enters the acquisition registries MUST carry full
// provenance. No mock data, no generated buyers, no generated
// acquisitions: a record without a real source_url cannot be constructed
// through these types' factory (see meta()).

export type IngestSource =
  | 'wikipedia'           // List_of_acquisitions_by_* pages
  | 'wikidata'            // SPARQL over wdt:P127 ownership statements
  | 'sec_edgar'           // 8-K item 2.01 filings via data.sec.gov
  | 'wikipedia_swf'       // List of sovereign wealth funds
  | 'wikipedia_universe'; // S&P 500 constituents · largest US by revenue · family offices

export type Confidence = 'verified' | 'reported' | 'estimated';
export type VerificationStatus = 'verified' | 'corroborated' | 'unverified';

export interface RecordMeta {
  readonly source: IngestSource;
  readonly source_url: string;
  readonly confidence: Confidence;
  readonly verification_status: VerificationStatus;
  readonly last_updated: string;           // ISO timestamp (compat alias of last_refreshed)
  readonly date_collected: string;         // first time this record entered the registry
  readonly last_refreshed: string;         // most recent re-verification against the source
}

export interface IngestedBuyer extends RecordMeta {
  readonly buyer_id: string;               // slug, stable across runs
  readonly name: string;
  readonly buyer_type: 'corporate' | 'private_equity' | 'sovereign_fund' | 'family_office';
  readonly qid?: string;                   // Wikidata entity
  readonly cik?: string;                   // SEC CIK (zero-padded 10)
  readonly country?: string;
  readonly aum_usd?: number;               // sovereign funds
  readonly list_page?: string;             // the Wikipedia list page ingested
  readonly industry_official?: string;     // GICS sector · sub-industry (or listed industry), verbatim
  readonly sector_exitos?: readonly string[]; // simplified ExitOS taxonomy (derived)
}

export interface IngestedAcquisition extends RecordMeta {
  readonly acquisition_id: string;         // hash(buyer|target|date)
  readonly buyer_id: string;
  readonly buyer_name: string;
  readonly target_name: string;
  readonly announced_date?: string;        // ISO date when known
  readonly value_usd?: number;             // disclosed value when known
  readonly industry?: string;              // the list page's business column
  readonly country?: string;
  readonly derived_from?: string;          // e.g. EDGAR accession corroborating
}

export interface GraphEdgeRecord extends RecordMeta {
  readonly a: string;                      // buyer_id
  readonly b: string;                      // buyer_id
  readonly shared_industries: readonly string[];
  readonly weight: number;
}

export interface IngestOutput {
  readonly generated_at: string;
  readonly counts: Record<string, number>;
  readonly hosts_used: readonly string[];
}

/** Factory enforcing provenance — throws rather than emit an unsourced record. */
export function meta(
  source: IngestSource,
  source_url: string,
  confidence: Confidence,
  verification_status: VerificationStatus,
): RecordMeta {
  if (!/^https?:\/\//.test(source_url)) {
    throw new Error(`refusing to create record without a real source_url (got: ${source_url})`);
  }
  const now = new Date().toISOString();
  return { source, source_url, confidence, verification_status, last_updated: now, date_collected: now, last_refreshed: now };
}

export const slug = (s: string): string =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 64);

export function acquisitionId(buyer: string, target: string, date?: string): string {
  return `${slug(buyer)}__${slug(target)}__${date ?? 'undated'}`;
}
