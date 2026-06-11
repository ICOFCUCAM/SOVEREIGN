import type { EngineMeta } from '../types.js';
import type { CapTable, Stakeholder, ShareClass, VestingSchedule } from './types.js';

const ENGINE = 'captable';
const VERSION = '0.1.0';

// ── Vesting ─────────────────────────────────────────────────────────

export function vestedShares(
  totalShares: number,
  v: VestingSchedule | undefined,
  asOfIso: string,
  changeOfControl = false,
): number {
  if (!v) return totalShares;
  const start = new Date(v.startDate).getTime();
  const as    = new Date(asOfIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(as) || as < start) return 0;

  const monthsElapsed = Math.floor((as - start) / (1000 * 60 * 60 * 24 * 30.4375));
  if (monthsElapsed < v.cliffMonths) return 0;

  let frac = Math.min(1, monthsElapsed / v.totalMonths);

  if (changeOfControl && v.acceleration?.percentOnCoC) {
    frac = Math.min(1, frac + v.acceleration.percentOnCoC);
  } else if (changeOfControl && v.acceleration?.single) {
    frac = 1;
  }
  return Math.floor(totalShares * frac);
}

// ── Cap-table sanity ────────────────────────────────────────────────

export interface CapTableAnalysis {
  readonly meta: EngineMeta;
  readonly companyId: string;
  readonly fullyDilutedShares: number;
  readonly reconciledShares: number;
  readonly reconciliationDeltaPct: number;     // |fullyDiluted - reconciled| / fullyDiluted
  readonly ownershipByStakeholder: ReadonlyArray<{
    readonly stakeholderId: string;
    readonly name: string;
    readonly role: Stakeholder['role'];
    readonly fullyDilutedShares: number;
    readonly fullyDilutedPct: number;
  }>;
  readonly ownershipByRole: Readonly<Record<Stakeholder['role'], number>>;
  readonly esopUtilizationPct?: number;        // 1 - unissued/authorized
  readonly preferenceCoverageMultiple?: number; // preference / lastRoundValuation
  readonly warnings: readonly string[];
}

export function runCapTableAnalysis(cap: CapTable): CapTableAnalysis {
  const warnings: string[] = [];
  let reconciled = 0;

  const byStakeholder = cap.stakeholders.map((s) => {
    const shares = s.holdings.reduce((sum, h) => sum + h.shares, 0);
    reconciled += shares;
    return { stakeholderId: s.id, name: s.name, role: s.role, fullyDilutedShares: shares };
  }).map((row) => ({
    ...row,
    fullyDilutedPct: cap.fullyDilutedShares > 0 ? row.fullyDilutedShares / cap.fullyDilutedShares : 0,
  })).sort((a, b) => b.fullyDilutedPct - a.fullyDilutedPct);

  const delta = cap.fullyDilutedShares > 0
    ? Math.abs(cap.fullyDilutedShares - reconciled) / cap.fullyDilutedShares
    : 0;
  if (delta > 0.005) warnings.push(`Cap-table reconciliation drift ${(delta * 100).toFixed(2)}% — shares declared (${cap.fullyDilutedShares.toLocaleString()}) vs summed holdings (${reconciled.toLocaleString()}).`);

  const ownershipByRole: Record<Stakeholder['role'], number> = {
    founder: 0, executive: 0, board_director: 0, board_observer: 0,
    lead_investor: 0, investor: 0, advisor: 0, employee: 0, other: 0,
  };
  for (const row of byStakeholder) ownershipByRole[row.role] += row.fullyDilutedPct;

  const esopAuth   = cap.esopAuthorizedTotal ?? 0;
  const esopUnused = cap.esopUnissuedRemaining ?? 0;
  const esopUtil   = esopAuth > 0 ? (esopAuth - esopUnused) / esopAuth : undefined;

  const prefCover = cap.preferenceStackUsd && cap.priorRoundsValuationUsd
    ? cap.preferenceStackUsd / cap.priorRoundsValuationUsd
    : undefined;

  if (ownershipByRole.founder < 0.10) warnings.push(`Founder ownership ${(ownershipByRole.founder * 100).toFixed(1)}% — heavy dilution may dampen founder alignment in a sale.`);
  if (prefCover != null && prefCover > 0.5) warnings.push(`Preference stack covers ${(prefCover * 100).toFixed(0)}% of last-round valuation — common upside compressed in down-round scenarios.`);

  return {
    meta: { engine: ENGINE, version: VERSION, runAt: new Date().toISOString() },
    companyId: cap.companyId,
    fullyDilutedShares: cap.fullyDilutedShares,
    reconciledShares: reconciled,
    reconciliationDeltaPct: delta,
    ownershipByStakeholder: byStakeholder,
    ownershipByRole,
    ...(esopUtil != null ? { esopUtilizationPct: esopUtil } : {}),
    ...(prefCover != null ? { preferenceCoverageMultiple: prefCover } : {}),
    warnings,
  };
}

// ── Signatory roster ────────────────────────────────────────────────

export interface SignatoryRoster {
  readonly required: readonly Stakeholder[];
  readonly recommended: readonly Stakeholder[];
  readonly coverageOfShares: number;            // 0..1 — share fraction signing
  readonly meetsThreshold: boolean;             // ≥ 0.95
}

export function signatoryRoster(cap: CapTable, requiredThreshold = 0.95): SignatoryRoster {
  const required: Stakeholder[] = [];
  const recommended: Stakeholder[] = [];

  for (const s of cap.stakeholders) {
    if (s.signatoryRequired || s.seatOnBoard) required.push(s);
    else recommended.push(s);
  }
  const requiredShares = required.reduce((sum, s) => sum + s.holdings.reduce((a, h) => a + h.shares, 0), 0);
  const coverage = cap.fullyDilutedShares > 0 ? requiredShares / cap.fullyDilutedShares : 0;
  return { required, recommended, coverageOfShares: coverage, meetsThreshold: coverage >= requiredThreshold };
}

// ── Liquidation waterfall ───────────────────────────────────────────

export interface WaterfallInputs {
  readonly headlinePriceUsd: number;
  readonly cashPct: number;
  readonly stockPct: number;
  readonly earnoutPct: number;
  readonly stockIlliquidityDiscountPct?: number;  // default 0.15
  readonly earnoutProbabilityHaircutPct?: number; // default 0.45
  readonly changeOfControl?: boolean;             // triggers acceleration
}

export interface StakeholderDistribution {
  readonly stakeholderId: string;
  readonly name: string;
  readonly role: Stakeholder['role'];
  readonly preferenceUsd: number;               // returned from preference stack
  readonly commonProceedsUsd: number;           // share of remaining pool
  readonly grossProceedsUsd: number;            // preference + common
  readonly cashUsd: number;
  readonly stockValueUsd: number;
  readonly earnoutValueUsd: number;
  readonly netPresentValueUsd: number;          // cash + discounted stock + discounted earnout
}

export interface Waterfall {
  readonly meta: EngineMeta;
  readonly inputs: WaterfallInputs;
  readonly distributions: readonly StakeholderDistribution[];
  readonly preferenceTotalUsd: number;
  readonly commonPoolUsd: number;
  readonly netToFoundersUsd: number;             // sum of NPV across founders
  readonly netToFoundersCashUsd: number;
  readonly notes: readonly string[];
}

export function computeWaterfall(cap: CapTable, inputs: WaterfallInputs): Waterfall {
  const stockDisc   = 1 - (inputs.stockIlliquidityDiscountPct ?? 0.15);
  const earnoutDisc = 1 - (inputs.earnoutProbabilityHaircutPct ?? 0.45);
  const coc = inputs.changeOfControl ?? true;
  const notes: string[] = [];

  // 1 · Liquidation preference distributed first
  const prefByStakeholder = new Map<string, number>();
  let preferenceTotal = 0;
  for (const s of cap.stakeholders) {
    let sPref = 0;
    for (const h of s.holdings) {
      const sc = cap.shareClasses.find((c) => c.id === h.shareClassId);
      if (!sc || sc.kind !== 'preferred') continue;
      if (sc.originalIssuePriceUsd == null) continue;
      const mult = sc.liquidationPreferenceMultiple ?? 1;
      sPref += sc.originalIssuePriceUsd * mult * h.shares;
    }
    prefByStakeholder.set(s.id, sPref);
    preferenceTotal += sPref;
  }
  if (preferenceTotal > inputs.headlinePriceUsd) {
    notes.push(`Preference stack ($${(preferenceTotal/1_000_000).toFixed(1)}M) exceeds headline price ($${(inputs.headlinePriceUsd/1_000_000).toFixed(1)}M). Common shareholders receive zero; preferred holders are prorated.`);
    // Pro-rate preference down
    const ratio = inputs.headlinePriceUsd / preferenceTotal;
    for (const [k, v] of prefByStakeholder) prefByStakeholder.set(k, v * ratio);
    preferenceTotal = inputs.headlinePriceUsd;
  }

  // 2 · Remaining pool distributed to common-equivalent (including vested options)
  const commonPool = inputs.headlinePriceUsd - preferenceTotal;
  // Compute each stakeholder's "common-equivalent" share fraction:
  // common shares + vested options/RSAs.
  let totalCommonEq = 0;
  const commonEqByStakeholder = new Map<string, number>();
  for (const s of cap.stakeholders) {
    let eq = 0;
    for (const h of s.holdings) {
      const sc = cap.shareClasses.find((c) => c.id === h.shareClassId);
      if (!sc) continue;
      if (sc.kind === 'preferred') continue;     // preference is its own pool
      if (sc.kind === 'options' || sc.kind === 'sars') {
        // vested options only; ignore underwater options
        const vested = vestedShares(h.shares, h.vesting, inputs.headlinePriceUsd > 0 ? new Date().toISOString() : new Date().toISOString(), coc);
        const ipo = inputs.headlinePriceUsd / Math.max(1, cap.fullyDilutedShares);
        if ((h.exercisePriceUsd ?? 0) < ipo) eq += vested;
      } else {
        eq += vestedShares(h.shares, h.vesting, new Date().toISOString(), coc);
      }
    }
    commonEqByStakeholder.set(s.id, eq);
    totalCommonEq += eq;
  }

  const distributions: StakeholderDistribution[] = cap.stakeholders.map((s) => {
    const pref = prefByStakeholder.get(s.id) ?? 0;
    const commonEq = commonEqByStakeholder.get(s.id) ?? 0;
    const commonProceeds = totalCommonEq > 0 ? commonPool * (commonEq / totalCommonEq) : 0;
    const gross = pref + commonProceeds;
    const cash    = gross * inputs.cashPct;
    const stock   = gross * inputs.stockPct;
    const earnout = gross * inputs.earnoutPct;
    const npv     = cash + (stock * stockDisc) + (earnout * earnoutDisc);
    return {
      stakeholderId: s.id, name: s.name, role: s.role,
      preferenceUsd: pref, commonProceedsUsd: commonProceeds, grossProceedsUsd: gross,
      cashUsd: cash, stockValueUsd: stock, earnoutValueUsd: earnout,
      netPresentValueUsd: npv,
    };
  }).sort((a, b) => b.netPresentValueUsd - a.netPresentValueUsd);

  const founderDistributions = distributions.filter((d) => d.role === 'founder');
  const netToFounders     = founderDistributions.reduce((s, d) => s + d.netPresentValueUsd, 0);
  const netToFoundersCash = founderDistributions.reduce((s, d) => s + d.cashUsd, 0);

  return {
    meta: { engine: ENGINE, version: VERSION, runAt: new Date().toISOString() },
    inputs,
    distributions,
    preferenceTotalUsd: preferenceTotal,
    commonPoolUsd: commonPool,
    netToFoundersUsd: netToFounders,
    netToFoundersCashUsd: netToFoundersCash,
    notes,
  };
}

// ── Drag-along ──────────────────────────────────────────────────────

export interface DragAlongCheck {
  readonly threshold: number;                    // typical 0.5 or 0.667
  readonly committedShares: number;              // sum of signatory shares
  readonly committedPct: number;
  readonly meets: boolean;
  readonly holdouts: readonly Stakeholder[];
}

export function dragAlongCheck(cap: CapTable, threshold = 0.5): DragAlongCheck {
  const committed = cap.stakeholders.filter((s) => s.signatoryRequired);
  const committedShares = committed.reduce((sum, s) => sum + s.holdings.reduce((a, h) => a + h.shares, 0), 0);
  const committedPct = cap.fullyDilutedShares > 0 ? committedShares / cap.fullyDilutedShares : 0;
  const holdouts = cap.stakeholders.filter((s) => !s.signatoryRequired && !s.seatOnBoard);
  return { threshold, committedShares, committedPct, meets: committedPct >= threshold, holdouts };
}

// ── Helper used by the negotiation engine — replaces the rough
//    founder-share × discount approximation with a real waterfall.
export function foundersNetFromOffer(
  cap: CapTable,
  offer: { headlinePriceUsd: number; cashPct: number; stockPct: number; earnoutPct: number },
): { readonly npvUsd: number; readonly cashUsd: number } {
  const w = computeWaterfall(cap, offer);
  return { npvUsd: w.netToFoundersUsd, cashUsd: w.netToFoundersCashUsd };
}
