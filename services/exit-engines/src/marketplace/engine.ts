import type { CompanyProfile, EngineMeta } from '../types.js';
import type { ValuationReport, ValuationReportType } from '../valuation/engine.js';
import type { BuyerDiscoveryReport } from '../buyers/engine.js';
import type { ReadinessReport } from '../readiness/engine.js';
import type { DueDiligenceReport } from '../diligence/engine.js';
import type { MemorandumDocument, MemorandumGenerator } from '../memorandum/types.js';
import { runValuation } from '../valuation/engine.js';
import { runBuyerDiscovery } from '../buyers/engine.js';
import { runReadiness } from '../readiness/engine.js';
import { runDueDiligence } from '../diligence/engine.js';
import { TemplateMemorandumGenerator } from '../memorandum/template.js';

// The Acquisition Marketplace Engine — the "AI investment bank" the
// user described. Composes the five sub-engines into a single run:
//
//   1. Value the company (multiple report types)
//   2. Score exit readiness
//   3. Discover and rank target buyers
//   4. Produce diligence-room specs
//   5. Generate the full memorandum suite (CIM, exec summary, deck, teaser, DD index)
//
// Returns a MarketplaceRun record — the complete artifact bundle a
// founder gets back when they upload a company to the marketplace.

export type RunStage =
  | 'valuation'
  | 'readiness'
  | 'buyers'
  | 'diligence'
  | 'memoranda'
  | 'done';

export interface MarketplaceRunOptions {
  readonly memorandumGenerator?: MemorandumGenerator;
  readonly valuationReports?: readonly ValuationReportType[];
  readonly buyerLimit?: number;
  readonly impliedPriceUsd?: number;
  readonly anonymizeTeaser?: boolean;
}

export interface MarketplaceRun {
  readonly meta: EngineMeta;
  readonly company: CompanyProfile;
  readonly valuation: {
    readonly standard: ValuationReport;
    readonly strategic: ValuationReport;
    readonly assetReplacement?: ValuationReport;
  };
  readonly readiness: ReadinessReport;
  readonly buyers: BuyerDiscoveryReport;
  readonly diligence: DueDiligenceReport;
  readonly memoranda: {
    readonly cim: MemorandumDocument;
    readonly executiveSummary: MemorandumDocument;
    readonly investorDeck: MemorandumDocument;
    readonly buyerTeaser: MemorandumDocument;
    readonly ddRoomIndex: MemorandumDocument;
  };
  readonly headlineProposition: string;
}

const ENGINE = 'marketplace';
const VERSION = '0.1.0';

function buildHeadlineProposition(
  company: CompanyProfile,
  readiness: ReadinessReport,
  buyers: BuyerDiscoveryReport,
  valuation: ValuationReport,
): string {
  const arr = company.revenue.annualRecurringRevenueUsd;
  const valLow  = (valuation.headline.low  / 1_000_000).toFixed(1);
  const valHigh = (valuation.headline.high / 1_000_000).toFixed(1);
  const top = buyers.candidates[0];
  return [
    `${company.name} — ${company.sector.replace(/_/g, ' ')} · ${(arr / 1_000_000).toFixed(1)}M ARR.`,
    `Headline range $${valLow}M – $${valHigh}M.`,
    `Readiness ${readiness.overallScore.toFixed(0)}/100 (${readiness.band.replace(/_/g, ' ')}).`,
    `${buyers.candidates.length} qualifying buyer${buyers.candidates.length === 1 ? '' : 's'}${top ? `; top candidate ${top.buyer.name} @ ${(top.probability * 100).toFixed(0)}%` : ''}.`,
  ].join(' ');
}

export async function runMarketplace(
  company: CompanyProfile,
  options: MarketplaceRunOptions = {},
): Promise<MarketplaceRun> {
  const generator = options.memorandumGenerator ?? new TemplateMemorandumGenerator();
  const reportTypes = options.valuationReports ?? ['standard', 'strategic', 'asset_replacement'];

  // Stage 1 — valuation
  const standard  = runValuation(company, { reportType: 'standard' });
  const strategic = runValuation(company, { reportType: 'strategic' });
  const assetReplacement = reportTypes.includes('asset_replacement')
    ? runValuation(company, { reportType: 'asset_replacement' })
    : undefined;

  // Stage 2 — readiness
  const readiness = runReadiness(company);

  // Stage 3 — buyer discovery (use strategic valuation as the implied price)
  const buyers = runBuyerDiscovery(company, {
    ...(options.impliedPriceUsd != null
        ? { impliedPriceUsd: options.impliedPriceUsd }
        : { impliedPriceUsd: strategic.headline.mid }),
    ...(options.buyerLimit != null ? { limit: options.buyerLimit } : {}),
  });

  // Stage 4 — diligence
  const diligence = runDueDiligence(company);

  // Stage 5 — memoranda
  const memInputs = { company, valuation: strategic, buyers, readiness, diligence };
  const [cim, executiveSummary, investorDeck, buyerTeaser, ddRoomIndex] = await Promise.all([
    generator.generate('cim',                memInputs),
    generator.generate('executive_summary',  memInputs),
    generator.generate('investor_deck',      memInputs),
    generator.generate('buyer_teaser',       { ...memInputs, anonymize: options.anonymizeTeaser ?? true }),
    generator.generate('dd_room_index',      memInputs),
  ]);

  return {
    meta: { engine: ENGINE, version: VERSION, runAt: new Date().toISOString() },
    company,
    valuation: { standard, strategic, ...(assetReplacement ? { assetReplacement } : {}) },
    readiness,
    buyers,
    diligence,
    memoranda: { cim, executiveSummary, investorDeck, buyerTeaser, ddRoomIndex },
    headlineProposition: buildHeadlineProposition(company, readiness, buyers, strategic),
  };
}
