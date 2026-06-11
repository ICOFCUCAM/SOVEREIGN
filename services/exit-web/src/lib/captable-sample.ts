import type { CapTable } from "@exit/engines";

// Sample cap-table the ExitOS console reads in demo mode. Mirrors the
// fixture used by the engine tests so that the Investors page renders
// against the same numbers the analytics are computed from.

export const SAMPLE_CAPTABLE: CapTable = {
  companyId: "demo-helios",
  asOfDate: "2026-06-01T00:00:00Z",
  fullyDilutedShares: 18_000_000,
  preferenceStackUsd: 32_000_000,
  priorRoundsValuationUsd: 110_000_000,
  esopAuthorizedTotal: 3_000_000,
  esopUnissuedRemaining: 850_000,
  shareClasses: [
    { id: "sc-common",   name: "Common Stock",                kind: "common",    authorized: 12_000_000, outstanding: 8_750_000, votingRights: "standard" },
    { id: "sc-seed",     name: "Series Seed Preferred",       kind: "preferred", seriesLabel: "Seed",     authorized: 1_800_000, outstanding: 1_800_000, originalIssuePriceUsd: 1.0, liquidationPreferenceMultiple: 1, participating: false, conversionRatio: 1, votingRights: "standard" },
    { id: "sc-seriesA",  name: "Series A Preferred",          kind: "preferred", seriesLabel: "Series A", authorized: 2_400_000, outstanding: 2_400_000, originalIssuePriceUsd: 4.5, liquidationPreferenceMultiple: 1, participating: false, conversionRatio: 1, votingRights: "standard" },
    { id: "sc-seriesB",  name: "Series B Preferred",          kind: "preferred", seriesLabel: "Series B", authorized: 2_600_000, outstanding: 2_600_000, originalIssuePriceUsd: 8.0, liquidationPreferenceMultiple: 1, participating: false, conversionRatio: 1, votingRights: "standard" },
    { id: "sc-options",  name: "Employee Stock Options",      kind: "options",   authorized: 3_000_000, outstanding: 2_150_000 },
    { id: "sc-warrants", name: "Founder warrants (Series A)", kind: "warrants",  authorized: 300_000,   outstanding: 300_000 },
  ],
  stakeholders: [
    { id: "stk-ana",     name: "Anne Kovac",      role: "founder", signatoryRequired: true, seatOnBoard: true,
      holdings: [{ shareClassId: "sc-common", shares: 3_400_000, vesting: { totalMonths: 48, cliffMonths: 12, startDate: "2017-06-01", acceleration: { double: true, percentOnCoC: 0.5 } } }] },
    { id: "stk-rafael",  name: "Rafael Mendes",   role: "founder", signatoryRequired: true, seatOnBoard: true,
      holdings: [{ shareClassId: "sc-common", shares: 2_300_000, vesting: { totalMonths: 48, cliffMonths: 12, startDate: "2017-06-01", acceleration: { double: true, percentOnCoC: 0.5 } } }] },
    { id: "stk-cof3",    name: "Marisol Costa",   role: "founder", signatoryRequired: true,
      holdings: [{ shareClassId: "sc-common", shares: 1_050_000, vesting: { totalMonths: 48, cliffMonths: 12, startDate: "2018-01-01" } }] },
    { id: "stk-seq",     name: "Sequoia Capital", role: "lead_investor", signatoryRequired: true, seatOnBoard: true,
      holdings: [
        { shareClassId: "sc-seriesA", shares: 1_800_000 },
        { shareClassId: "sc-seriesB", shares: 900_000 },
      ] },
    { id: "stk-index",   name: "Index Ventures",  role: "investor", signatoryRequired: true, seatOnBoard: true,
      holdings: [
        { shareClassId: "sc-seriesA", shares: 600_000 },
        { shareClassId: "sc-seriesB", shares: 1_100_000 },
      ] },
    { id: "stk-khosla",  name: "Khosla Ventures", role: "investor", signatoryRequired: true,
      holdings: [{ shareClassId: "sc-seriesB", shares: 600_000 }] },
    { id: "stk-yc",      name: "Y Combinator",    role: "investor", signatoryRequired: false,
      holdings: [{ shareClassId: "sc-seed", shares: 1_800_000 }] },
    { id: "stk-exec1",   name: "Tom Kallman (CFO)", role: "executive", signatoryRequired: false,
      holdings: [{ shareClassId: "sc-options", shares: 380_000, exercisePriceUsd: 2.5, vesting: { totalMonths: 48, cliffMonths: 12, startDate: "2022-03-01" } }] },
    { id: "stk-exec2",   name: "Lin Pereira (CRO)", role: "executive", signatoryRequired: false,
      holdings: [{ shareClassId: "sc-options", shares: 320_000, exercisePriceUsd: 3.0, vesting: { totalMonths: 48, cliffMonths: 12, startDate: "2023-01-15" } }] },
    { id: "stk-eng-pool", name: "Engineering option pool", role: "employee", signatoryRequired: false,
      holdings: [{ shareClassId: "sc-options", shares: 1_450_000, exercisePriceUsd: 3.5, vesting: { totalMonths: 48, cliffMonths: 12, startDate: "2023-06-01" } }] },
    { id: "stk-warr",    name: "Founder warrants", role: "founder", signatoryRequired: false,
      holdings: [{ shareClassId: "sc-warrants", shares: 300_000, exercisePriceUsd: 4.5 }] },
  ],
};
