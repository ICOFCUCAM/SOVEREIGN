import type { CompanyStory } from "@exit/engines";

// A complete company story for the sample pack's first company. Everything here
// is fictional — the company, its people, competitors, investors and the
// market-research publisher — and internally consistent with its headline
// figures (ARR $21.8M, TTM revenue $24.6M, 640 customers, 22% top-ten share).

export const NORTHWIND_STORY: CompanyStory = {
  version: 1,
  updatedAt: "2026-10-12T09:00:00.000Z",
  sources: [
    { id: "s-fy24", title: "FY2024 statutory accounts", kind: "statutory_accounts", date: "2025-04-28", period: "FY2024 (year to 31 Dec 2024)" },
    { id: "s-fy25", title: "FY2025 statutory accounts", kind: "statutory_accounts", date: "2026-04-21", period: "FY2025 (year to 31 Dec 2025)" },
    { id: "s-ma", title: "Management accounts, September 2026", kind: "management_accounts", date: "2026-10-05", period: "TTM to 30 Sep 2026" },
    { id: "s-mkt", title: "Community Pharmacy Technology Survey 2025 (Halden Retail Health Research, fictional)", kind: "market_report", date: "2026-01-15", period: "2025", publisher: "Halden Retail Health Research" },
    { id: "s-cap", title: "Capitalisation table, 30 September 2026", kind: "cap_table", date: "2026-09-30" },
  ],
  headline: {
    ttmRevenueUsd: { provenance: "source", sourceId: "s-ma", period: "TTM to 30 Sep 2026" },
    arrUsd: { provenance: "source", sourceId: "s-ma", asOf: "2026-09-30" },
    growthPct: { provenance: "source", sourceId: "s-ma", period: "30 Sep 2025 to 30 Sep 2026" },
    grossMarginPct: { provenance: "source", sourceId: "s-ma", period: "TTM to 30 Sep 2026" },
    ebitdaMarginPct: { provenance: "source", sourceId: "s-ma", period: "TTM to 30 Sep 2026" },
    netRetentionPct: { provenance: "founder", period: "12 months to 30 Sep 2026" },
    customerConcentrationPct: { provenance: "founder", period: "TTM to 30 Sep 2026" },
    totalCustomers: { provenance: "founder", asOf: "2026-09-30" },
  },
  history: {
    origin: "Northwind Analytics was founded in 2016 by Ada Park, a community pharmacist, and Tom Reyes, a software engineer, after they saw independent pharmacies managing stock and prescriptions across spreadsheets and paper",
    milestones: [
      { year: 2016, event: "Company founded in Manchester; first version of the dispensing product built with three pilot pharmacies" },
      { year: 2018, event: "100 paying pharmacies; first integration with a national wholesaler" },
      { year: 2019, event: "Northwind Insights analytics product launched" },
      { year: 2021, event: "Series A investment led by Fernhill Growth Partners (fictional)" },
      { year: 2023, event: "Entered the Irish market with a Dublin customer-success team" },
      { year: 2025, event: "600th pharmacy customer; first regional chain of more than 40 sites" },
    ],
    ownershipChanges: [
      { date: "2021-04", description: "Series A preferred shares issued to Fernhill Growth Partners II (fictional)" },
      { date: "2024-02", description: "Two early angel investors sold part of their holdings to Fernhill Growth Partners II" },
    ],
  },
  products: [
    { name: "Northwind Dispense", description: "Dispensing, stock and electronic-prescription workflow for community pharmacies", useCases: "Dispensing, stock ordering, controlled-drug registers", pricingModel: "Per-site subscription, billed annually in advance", revenueSharePct: 0.64, revenueShareMeta: { provenance: "source", sourceId: "s-ma" }, differentiators: "Built for independents and small chains rather than adapted from hospital systems; set up in a day per site", roadmap: "Prescription-collection reminders for patients (2027)" },
    { name: "Northwind Insights", description: "Analytics on dispensing volumes, margin and stock turns, across one or many sites", useCases: "Margin management, buying decisions, multi-site reporting", pricingModel: "Add-on subscription per site", revenueSharePct: 0.22, revenueShareMeta: { provenance: "source", sourceId: "s-ma" }, differentiators: "Benchmarks a pharmacy against anonymised peers in the Northwind network" },
    { name: "Implementation and training", description: "Data migration, set-up and staff training", pricingModel: "Fixed fee per site", revenueSharePct: 0.14, revenueShareMeta: { provenance: "source", sourceId: "s-ma" } },
  ],
  businessModel: {
    revenueStreams: [
      { name: "Subscriptions", sharePct: 0.86, recurring: true, meta: { provenance: "source", sourceId: "s-ma" } },
      { name: "Implementation and training services", sharePct: 0.14, recurring: false, meta: { provenance: "source", sourceId: "s-ma" } },
    ],
    pricingNotes: "Subscriptions carry an annual uplift linked to the consumer price index",
  },
  customers: {
    segments: [
      { name: "Independent pharmacies (1–5 sites)", sharePct: 0.58, meta: { provenance: "founder" } },
      { name: "Regional chains (6–50 sites)", sharePct: 0.34, meta: { provenance: "founder" } },
      { name: "Wholesaler data partnerships", sharePct: 0.08, meta: { provenance: "founder" } },
    ],
    profiles: [
      { label: "A 22-site regional chain in the North West", segment: "Regional chains", description: "Runs Dispense and Insights across every site; Insights replaced a monthly spreadsheet consolidation", since: 2020 },
      { label: "A single independent pharmacy in Cork", segment: "Independent pharmacies", description: "One of the first Irish customers; uses Dispense only", since: 2023 },
    ],
    contractTerms: "Most subscriptions run for 36 months with annual billing in advance and a 90-day notice period",
    grossRetentionPct: 0.93, grossRetentionMeta: { provenance: "founder", period: "12 months to 30 Sep 2026" },
    logoChurnPct: 0.06, logoChurnMeta: { provenance: "founder", period: "12 months to 30 Sep 2026" },
    caseStudies: [
      { title: "Cutting stock write-offs across a 22-site chain", summary: "The chain moved stock ordering onto Dispense and used Insights to set reorder levels by site", outcome: "Stock write-offs fell by 18% in the first year, as measured by the customer", approvedForUse: true },
      { title: "Pilot with a national wholesaler", summary: "Not yet approved for external use", approvedForUse: false },
    ],
  },
  salesMarketing: {
    channels: "An inside team for independent pharmacies, a field team for regional chains, and referrals from two wholesaler partners",
    team: "14 people: six account executives, four business-development representatives and four in marketing",
    salesCycle: "Four to six weeks for an independent pharmacy; four to seven months for a chain",
    partners: "Two wholesalers refer customers in return for access to anonymised demand data",
  },
  market: {
    targetMarkets: "community pharmacies in the United Kingdom and Ireland, from single-site independents to chains of about fifty sites",
    geographies: ["the United Kingdom", "Ireland"],
    estimates: [
      { label: "UK and Ireland community-pharmacy software", valueUsd: 640_000_000, geography: "United Kingdom and Ireland", period: "2025", growthPct: 0.07,
        methodology: "11,900 community pharmacies multiplied by average annual software spend from the publisher's survey of 1,140 pharmacies", meta: { provenance: "source", sourceId: "s-mkt", period: "2025" } },
      { label: "European pharmacy software", valueUsd: 4_800_000_000, geography: "Europe", period: "2025", methodology: "", meta: { provenance: "founder" } },
    ],
    competitors: [
      { name: "Cairn Pharmacy Systems (fictional)", description: "Long-established dispensing-system vendor serving large chains", differentiation: "Northwind is configured for small multi-site operators and is set up in a day" },
      { name: "MedStock Cloud (fictional)", description: "Stock-management tool without dispensing", differentiation: "Northwind combines dispensing, stock and analytics in one product" },
    ],
  },
  operations: {
    technology: "A multi-tenant cloud application hosted on AWS in London, with integrations to the national electronic-prescription service and to two wholesalers; the Company reports 99.95% availability over the last twelve months",
    intellectualProperty: "The Company owns its software, written by its own staff and contractors under assignment agreements; it holds two UK trade marks and no patents",
    operations: "Customer support runs from Manchester and Dublin during pharmacy opening hours",
  },
  team: {
    leaders: [
      { name: "Ada Park", role: "Chief Executive", bio: "Community pharmacist for nine years before co-founding the Company", responsibilities: "Strategy, customers, investor relations", since: 2016, founder: true },
      { name: "Tom Reyes", role: "Chief Technology Officer", bio: "Previously a lead engineer at a payments company", responsibilities: "Product, engineering, security", since: 2016, founder: true },
      { name: "Priya Nair", role: "Chief Financial Officer", bio: "Chartered accountant; previously finance director of a software business", responsibilities: "Finance, legal, HR", since: 2021 },
      { name: "Ellen Shaw", role: "Chief Operating Officer", bio: "Ran customer operations at a healthcare-software company", responsibilities: "Customer success, implementation, support", since: 2022 },
    ],
    headcount: [
      { function: "Engineering and product", count: 38 }, { function: "Customer success and support", count: 17 },
      { function: "Sales and marketing", count: 14 }, { function: "Finance, people and operations", count: 9 },
    ],
    headcountAsOf: "30 September 2026",
    structure: "The four executives report to the board; engineering is organised in five product teams",
  },
  capitalization: {
    holders: [
      { name: "Ada Park", kind: "founder", shareClass: "Ordinary", pct: 0.24 },
      { name: "Tom Reyes", kind: "founder", shareClass: "Ordinary", pct: 0.22 },
      { name: "Fernhill Growth Partners II (fictional)", kind: "investor", shareClass: "Series A Preferred", pct: 0.36 },
      { name: "Angel investors (four)", kind: "other", shareClass: "Ordinary", pct: 0.06 },
    ],
    optionPoolPct: 0.12,
    shareClasses: "Series A Preferred shares carry a 1× non-participating liquidation preference",
    instruments: [],
    fullyDilutedShares: 12_500_000,
    asOf: "30 September 2026",
    meta: { provenance: "source", sourceId: "s-cap" },
  },
  financials: {
    annual: [
      { period: "FY2024", periodEnd: "2024-12-31", revenueUsd: 15_200_000, arrUsd: 12_400_000, grossMarginPct: 0.76, ebitdaUsd: 1_100_000, meta: { provenance: "source", sourceId: "s-fy24" } },
      { period: "FY2025", periodEnd: "2025-12-31", revenueUsd: 20_900_000, arrUsd: 17_900_000, grossMarginPct: 0.77, ebitdaUsd: 2_400_000, meta: { provenance: "source", sourceId: "s-fy25" } },
    ],
    forecasts: [
      { period: "FY2026", revenueUsd: 27_500_000, ebitdaUsd: 3_900_000, basis: "Contracted ARR at 30 September 2026 plus pipeline weighted by stage; the board-approved budget" },
    ],
    definitions: "revenue is as recognised in the statutory accounts; ARR is contracted subscription value at period end; EBITDA is before share-based payments",
  },
  growth: {
    opportunities: [
      { title: "Ireland beyond Dublin", description: "Fewer than a tenth of Irish community pharmacies are customers; the Dublin team can cover the rest of the country" },
      { title: "Analytics for wholesalers", description: "Anonymised demand data is already shared with two wholesalers; a paid product for others is in design" },
      { title: "Pharmacy-services booking", description: "A booking module for vaccinations and consultations would sell into the existing base" },
    ],
  },
  risks: [
    { title: "Reimbursement changes", description: "Changes to how the NHS pays pharmacies affect customers' margins and their willingness to spend", mitigation: "Contracts run for 36 months; Insights helps customers manage margin" },
    { title: "Wholesaler integrations", description: "Two wholesaler integrations support ordering for most customers", mitigation: "Both are covered by multi-year agreements" },
    { title: "Key people", description: "The founders hold much of the product and customer knowledge", mitigation: "A second engineering lead was appointed in 2025; both founders intend to stay through a transition" },
  ],
};
