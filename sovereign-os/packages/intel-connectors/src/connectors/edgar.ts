import type { Connector, ConnectorContext, ConnectorPullResult, NormalizedSignal } from '@sovereign/intel-core';
import { makeProvenance, signalContentHash, sha256Hex } from '@sovereign/intel-core';

const CONNECTOR = 'edgar';
const VERSION = '0.1.0';
const ENDPOINT = 'https://data.sec.gov/submissions/CIK';
const FILING_BASE = 'https://www.sec.gov/Archives/edgar/data';

// SEC EDGAR per-CIK filings connector. Free; the SEC requires an
// identifying User-Agent including operator contact. Pass via
// config.contact_email or the SEC_EDGAR_CONTACT env.
//
// Each entry in the recent.filings array becomes a regulatory_filing
// signal. Form types can be filtered via config.formTypes.

export interface EdgarConfig {
  readonly cik: string | number;
  readonly formTypes?: readonly string[];
  readonly limit?: number;
  readonly contactEmail?: string;
}

export function isEdgarConfig(v: unknown): v is EdgarConfig {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return (typeof c.cik === 'string' || typeof c.cik === 'number');
}

function padCik(cik: string | number): string {
  return String(cik).replace(/\D/g, '').padStart(10, '0');
}

function userAgent(contact: string): string {
  return `Sovereign Intel Connector (${contact})`;
}

interface EdgarSubmissionResponse {
  readonly name?: string;
  readonly cik?: string;
  readonly tickers?: readonly string[];
  readonly filings?: {
    readonly recent?: {
      readonly accessionNumber?: readonly string[];
      readonly form?:            readonly string[];
      readonly filingDate?:      readonly string[];
      readonly reportDate?:      readonly string[];
      readonly primaryDocument?: readonly string[];
      readonly primaryDocDescription?: readonly string[];
      readonly items?: readonly string[];
    };
  };
}

export const edgarConnector: Connector = {
  name: CONNECTOR,
  family: 'regulatory',
  version: VERSION,

  async pull(ctx: ConnectorContext, config?: unknown): Promise<ConnectorPullResult> {
    if (!isEdgarConfig(config)) throw new Error('edgar: missing or invalid config.cik');
    const contact = config.contactEmail
      ?? process.env.SEC_EDGAR_CONTACT
      ?? 'institutional@sovereigndo.com';
    const cik = padCik(config.cik);
    const limit = Math.max(1, Math.min(config.limit ?? 40, 200));

    const url = `${ENDPOINT}${cik}.json`;
    ctx.logger.info('edgar: fetching submissions', { cik });
    const res = await ctx.fetch(url, {
      headers: { 'user-agent': userAgent(contact), 'accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`edgar: ${res.status} for CIK ${cik}`);
    const body = (await res.json()) as EdgarSubmissionResponse;
    const recent = body.filings?.recent;
    if (!recent?.accessionNumber || !recent.form || !recent.filingDate) {
      return { raws: [], signals: [], metadata: { provider: 'edgar', costEstimateUsd: 0 } };
    }

    const formFilter = config.formTypes ? new Set(config.formTypes) : undefined;
    const raws: Array<ConnectorPullResult['raws'][number]> = [];
    const signals: NormalizedSignal[] = [];
    const count = Math.min(limit, recent.accessionNumber.length);

    for (let i = 0; i < count; i++) {
      const accession = recent.accessionNumber[i];
      const form      = recent.form[i];
      const filed     = recent.filingDate[i];
      if (!accession || !form || !filed) continue;
      if (formFilter && !formFilter.has(form)) continue;

      const accessionNoDash = accession.replace(/-/g, '');
      const primaryDoc = recent.primaryDocument?.[i];
      const filingUrl = primaryDoc
        ? `${FILING_BASE}/${parseInt(cik, 10)}/${accessionNoDash}/${primaryDoc}`
        : `${FILING_BASE}/${parseInt(cik, 10)}/${accessionNoDash}/`;
      const description = recent.primaryDocDescription?.[i] ?? `${form} filing`;
      const items = recent.items?.[i];

      const provenance = makeProvenance(CONNECTOR, VERSION, {
        additional: {
          accession,
          cik,
          form,
          filer_name: body.name,
          tickers: body.tickers,
          items: items ?? undefined,
        },
      });

      const rawIndex = JSON.stringify({ accession, form, filingDate: filed, primaryDocument: primaryDoc });
      raws.push({
        contentHash: sha256Hex(rawIndex),
        canonicalUrl: filingUrl,
        mime: 'application/json',
        bytes: rawIndex.length,
        payloadExcerpt: rawIndex,
        provenance,
      });

      const filerName = body.name ?? `CIK ${cik}`;
      const title = `${filerName} files ${form}${items ? ` (Items ${items})` : ''}`;
      const bodyExcerpt = `${description}. Filed ${filed}. Accession ${accession}.`;
      signals.push({
        contentHash: signalContentHash({ canonicalUrl: filingUrl, title, bodyExcerpt }),
        canonicalUrl: filingUrl,
        signalClass: 'regulatory_filing',
        publishedAt: `${filed}T12:00:00Z`,
        language: 'en',
        title,
        bodyExcerpt,
        geoFocus: { countries: ['US'] },
        attestations: { primarySourceUrl: filingUrl },
        provenance,
      });
    }

    return {
      raws,
      signals,
      metadata: { provider: 'edgar', costEstimateUsd: 0, cik, filer: body.name },
    };
  },
};
