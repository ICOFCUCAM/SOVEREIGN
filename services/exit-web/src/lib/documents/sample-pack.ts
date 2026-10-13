import { TemplateMemorandumGenerator, DEFAULT_PROCESS_TIMELINE, runInstitutionalValuation, runBuyerDiscovery, runDueDiligence, runReadiness, type CompanyProfile, type MemorandumKind } from "@exit/engines";
import { buildProfile, SAMPLE_INTAKE, ASSUMED_PROFILE_FIELDS } from "../company-intake";
import { canonicalValuationFor } from "../canonical-valuation";
import { closingChecklistSections } from "../closing-checklist";
import { buildBoardMemo } from "../report-docs";
import { boardMemoToDdm } from "../dispatch-ddm";
import { generateVersion, type DocumentVersion } from "./service";
import type { Truth } from "./consistency";

// ── SAMPLE PACK ─────────────────────────────────────────────────────
// Every document the generation service produces, for one fictional company
// entered as a founder would enter it (no demo values) — what the quality
// review and a human reviewer read. Deterministic: a fixed date, fixed inputs.

export const SAMPLE_PACK_COMPANY: CompanyProfile = {
  ...buildProfile({
    ...SAMPLE_INTAKE, name: "Northwind Analytics", jurisdiction: "GB", sector: "vertical_saas", foundedYear: 2016,
    ttmRevenueUsd: 24_600_000, arrUsd: 21_800_000, growthPct: 0.36, grossMarginPct: 0.78, ebitdaMarginPct: 0.14,
    netRetentionPct: 1.17, customerConcentrationPct: 0.22, totalCustomers: 640,
  }),
  id: "co-sample-pack",
};
export const SAMPLE_PACK_CODE_NAME = "Project Meridian";

const MEMORANDA: ReadonlyArray<readonly [MemorandumKind, string]> = [
  ["cim", "exitos.cim"], ["executive_summary", "exitos.executive_summary"], ["investor_deck", "exitos.investor_deck"],
  ["buyer_teaser", "exitos.teaser"], ["dd_room_index", "exitos.data_room_index"],
];

export interface PackItem { readonly version: DocumentVersion; readonly anonymized: boolean; readonly slug: string }

export async function buildSamplePack(company: CompanyProfile = SAMPLE_PACK_COMPANY, codeName = SAMPLE_PACK_CODE_NAME): Promise<{ items: PackItem[]; truth: Truth }> {
  const inst = runInstitutionalValuation(company);
  const valuation = canonicalValuationFor(company, inst);
  const now = new Date("2026-10-13T12:00:00Z");
  const common = { company, companyId: company.id ?? null, unconfirmed: [] as never[], generatedBy: "sample-pack", valuationMidUsd: valuation.headline.mid, now };
  const inputs = { company, valuation, constitution: inst, readiness: runReadiness(company), buyers: runBuyerDiscovery(company, { limit: 12 }), diligence: runDueDiligence(company), codeName, timeline: DEFAULT_PROCESS_TIMELINE, assumed: ASSUMED_PROFILE_FIELDS };
  const gen = new TemplateMemorandumGenerator();
  const items: PackItem[] = [];
  for (const [kind, typeId] of MEMORANDA) {
    const d = await gen.generate(kind, inputs);
    const v = await generateVersion({ ...common, typeId, title: d.title, sections: d.sections, producedBy: d.producedBy, inputs: { kind }, ownerName: d.anonymized ? codeName : company.name });
    items.push({ version: v, anonymized: d.anonymized, slug: kind });
  }
  items.push({
    version: await generateVersion({ ...common, typeId: "exitos.closing_checklist", title: `Closing Checklist — ${company.name}`, subtitle: "Signature, escrow and filing items to the wire",
      sections: closingChecklistSections({}), producedBy: "lib/closing-checklist", inputs: { statuses: {} }, ownerName: company.name }),
    anonymized: false, slug: "closing_checklist",
  });
  const memo = buildBoardMemo(company);
  items.push({
    version: await generateVersion({ ...common, typeId: "exitos.board_memo_process", title: "Board Transaction Memorandum", sections: [],
      ddm: boardMemoToDdm(memo) as never, producedBy: "lib/report-docs:buildBoardMemo", inputs: { memo }, ownerName: company.name }),
    anonymized: false, slug: "board_memo",
  });
  const h = valuation.headline;
  return { items, truth: { company, codeName, valuation: { low: h.low, mid: h.mid, high: h.high }, timeline: DEFAULT_PROCESS_TIMELINE } };
}
