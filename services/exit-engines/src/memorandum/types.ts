import type { CompanyProfile } from '../types.js';
import type { ValuationReport } from '../valuation/engine.js';
import type { ValuationConstitution } from '../valuation/institutional.js';
import type { BuyerDiscoveryReport } from '../buyers/engine.js';
import type { ReadinessReport } from '../readiness/engine.js';
import type { DueDiligenceReport } from '../diligence/engine.js';

export type MemorandumKind =
  | 'cim'                  // confidential information memorandum, long form
  | 'executive_summary'    // one-page exec summary
  | 'investor_deck'        // slide-by-slide deck outline
  | 'buyer_teaser'         // 1-2 page anonymized teaser
  | 'dd_room_index';       // virtual data room index document

export interface MemorandumInputs {
  readonly company: CompanyProfile;
  readonly valuation: ValuationReport;
  // The canonical Valuation Constitution. When supplied, every valuation
  // figure in the document is rendered from it — the document inherits the
  // framework rather than describing the base report. Optional only for
  // backward compatibility; production callers always pass it.
  readonly constitution?: ValuationConstitution;
  readonly buyers?: BuyerDiscoveryReport;
  readonly readiness?: ReadinessReport;
  readonly diligence?: DueDiligenceReport;
  readonly anonymize?: boolean;            // for buyer_teaser
}

export interface MemorandumDocument {
  readonly kind: MemorandumKind;
  readonly title: string;
  readonly sections: readonly MemorandumSection[];
  readonly anonymized: boolean;
  readonly wordCount: number;
  readonly producedBy: string;             // implementation @ version
}

export interface MemorandumSection {
  readonly heading: string;
  readonly body: string;                   // markdown
  readonly bullets?: readonly string[];
  readonly tables?: readonly MemorandumTable[];
}

export interface MemorandumTable {
  readonly headers: readonly string[];
  readonly rows: ReadonlyArray<readonly string[]>;
  readonly caption?: string;
}

export interface MemorandumGenerator {
  readonly implementation: string;
  readonly version: string;
  generate(kind: MemorandumKind, inputs: MemorandumInputs): Promise<MemorandumDocument>;
}
