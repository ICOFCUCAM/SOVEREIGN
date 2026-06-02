import { useEffect, useState } from "react";
import {
  runValuation, strategicBuyerReport, assetReplacementReport,
  runReadiness, runBuyerDiscovery, runDueDiligence,
  TemplateMemorandumGenerator,
  type MemorandumDocument, type MemorandumKind, type MemorandumInputs,
} from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile.js";

// Pre-compute the deterministic results once per module load. The
// engines are pure and fast (<5ms each) — no need for a context or
// memoization layer beyond this.
export const VALUATION_STANDARD     = runValuation(SAMPLE_COMPANY, { reportType: "standard" });
export const VALUATION_STRATEGIC    = strategicBuyerReport(SAMPLE_COMPANY);
export const VALUATION_REPLACEMENT  = assetReplacementReport(SAMPLE_COMPANY);
export const READINESS              = runReadiness(SAMPLE_COMPANY);
export const BUYERS                 = runBuyerDiscovery(SAMPLE_COMPANY, { limit: 12 });
export const DILIGENCE              = runDueDiligence(SAMPLE_COMPANY);

export const HEADLINE = `${SAMPLE_COMPANY.name} · ${(SAMPLE_COMPANY.revenue.annualRecurringRevenueUsd / 1_000_000).toFixed(1)}M ARR · ${SAMPLE_COMPANY.sector.replace(/_/g, " ")}`;

// Memorandum generation is async (the template generator resolves
// immediately but the call surface is async). useMemorandum returns
// the generated document for one kind and refreshes when kind changes.
const memoGen = new TemplateMemorandumGenerator();

export function useMemorandum(kind: MemorandumKind, inputs?: Partial<MemorandumInputs>): MemorandumDocument | null {
  const [doc, setDoc] = useState<MemorandumDocument | null>(null);
  useEffect(() => {
    let alive = true;
    memoGen
      .generate(kind, {
        company:   SAMPLE_COMPANY,
        valuation: VALUATION_STRATEGIC,
        readiness: READINESS,
        buyers:    BUYERS,
        diligence: DILIGENCE,
        ...inputs,
      })
      .then((d) => { if (alive) setDoc(d); });
    return () => { alive = false; };
  }, [kind, inputs]);
  return doc;
}

// Money formatter shared with the rest of the SPA
export function fmt(n?: number, opts: { compact?: boolean; currency?: string } = {}): string {
  if (n == null) return "—";
  const { compact = true, currency = "USD" } = opts;
  if (compact) {
    if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(n) >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000)         return `$${(n / 1_000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}
