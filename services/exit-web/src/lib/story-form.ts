import type { CompanyStory, SectionId } from "@exit/engines";

// ── COMPANY STORY FORM ──────────────────────────────────────────────
// The progressive intake's sections, declared as data: one generic editor
// renders them. A field of kind "meta" records where a figure came from —
// supplied by the founder, supported by an attached source document, or an
// estimate with its method. "Independently verified" is never offered here:
// no verification process exists yet, and the server refuses it from owners.

export type FieldKind = "text" | "textarea" | "number" | "year" | "usd" | "pct" | "checkbox" | "select" | "meta" | "list";
export interface Field {
  readonly key: string;
  readonly label: string;
  readonly kind: FieldKind;
  readonly hint?: string;
  readonly options?: ReadonlyArray<readonly [string, string]>;
  /** For kind "list": the fields of each row. */
  readonly row?: readonly Field[];
  readonly addLabel?: string;
}
export interface FormSection { readonly id: SectionId; readonly path: keyof CompanyStory; readonly why: string; readonly fields: readonly Field[] }

const meta = (label = "Basis"): Field => ({ key: "meta", label, kind: "meta" });

export const STORY_FORM: readonly FormSection[] = [
  { id: "history", path: "history", why: "Buyers read the history to understand how the business was built and who has owned it.", fields: [
    { key: "origin", label: "How the company started", kind: "textarea", hint: "Two or three sentences: who founded it, when, and why." },
    { key: "milestones", label: "Milestones", kind: "list", addLabel: "Add a milestone", row: [{ key: "year", label: "Year", kind: "year" }, { key: "event", label: "What happened", kind: "text" }] },
    { key: "ownershipChanges", label: "Ownership changes", kind: "list", addLabel: "Add a change", hint: "Investment rounds, secondary sales, changes of control.", row: [{ key: "date", label: "Date (YYYY-MM)", kind: "text" }, { key: "description", label: "Change", kind: "text" }] },
  ] },
  { id: "products", path: "products", why: "A buyer needs to understand each product it would acquire.", fields: [
    { key: "", label: "Products and services", kind: "list", addLabel: "Add a product", row: [
      { key: "name", label: "Name", kind: "text" }, { key: "description", label: "What it does", kind: "textarea" },
      { key: "useCases", label: "Used for", kind: "text" }, { key: "pricingModel", label: "Pricing model", kind: "text" },
      { key: "revenueSharePct", label: "Share of revenue", kind: "pct" }, { key: "revenueShareMeta", label: "Basis for the share", kind: "meta" },
      { key: "differentiators", label: "How it differs from alternatives", kind: "textarea" }, { key: "roadmap", label: "Roadmap", kind: "text" },
    ] },
  ] },
  { id: "businessModel", path: "businessModel", why: "The mix of recurring and one-off revenue shapes how a buyer values it.", fields: [
    { key: "revenueStreams", label: "Revenue streams", kind: "list", addLabel: "Add a stream", row: [{ key: "name", label: "Stream", kind: "text" }, { key: "sharePct", label: "Share of revenue", kind: "pct" }, { key: "recurring", label: "Recurring", kind: "checkbox" }, meta()] },
    { key: "pricingNotes", label: "Pricing notes", kind: "textarea" },
  ] },
  { id: "customers", path: "customers", why: "Buyers test how revenue moves within the base and how exposed it is to losing customers.", fields: [
    { key: "segments", label: "Customer segments", kind: "list", addLabel: "Add a segment", row: [{ key: "name", label: "Segment", kind: "text" }, { key: "sharePct", label: "Share of revenue", kind: "pct" }, { key: "description", label: "Description", kind: "text" }, meta()] },
    { key: "profiles", label: "Representative customers (anonymised)", kind: "list", addLabel: "Add a profile", row: [{ key: "label", label: "Description, e.g. \"a 22-site regional chain\"", kind: "text" }, { key: "segment", label: "Segment", kind: "text" }, { key: "description", label: "How they use the product", kind: "textarea" }, { key: "since", label: "Customer since", kind: "year" }] },
    { key: "contractTerms", label: "Typical contract terms", kind: "textarea", hint: "Length, billing, notice, renewal, price uplifts." },
    { key: "grossRetentionPct", label: "Gross revenue retention", kind: "pct" }, { key: "grossRetentionMeta", label: "Basis", kind: "meta" },
    { key: "logoChurnPct", label: "Annual customer churn", kind: "pct" }, { key: "logoChurnMeta", label: "Basis", kind: "meta" },
    { key: "caseStudies", label: "Case studies", kind: "list", addLabel: "Add a case study", row: [{ key: "title", label: "Title", kind: "text" }, { key: "summary", label: "Summary", kind: "textarea" }, { key: "outcome", label: "Outcome", kind: "text" }, { key: "approvedForUse", label: "The customer has approved its use", kind: "checkbox" }] },
  ] },
  { id: "salesMarketing", path: "salesMarketing", why: "A buyer assesses whether growth can continue under new ownership.", fields: [
    { key: "channels", label: "Channels to market", kind: "textarea" }, { key: "team", label: "Sales and marketing team", kind: "text" },
    { key: "salesCycle", label: "Typical sales cycle", kind: "text" }, { key: "partners", label: "Partners", kind: "text" },
  ] },
  { id: "market", path: "market", why: "A market figure is useful to a buyer only with its source, geography, period and method.", fields: [
    { key: "targetMarkets", label: "Target markets", kind: "textarea" },
    { key: "geographies", label: "Countries where you sell (comma-separated)", kind: "text" },
    { key: "estimates", label: "Market-size estimates", kind: "list", addLabel: "Add an estimate", hint: "Stated in documents only with a source document or a documented estimate, and its geography, period and method.", row: [
      { key: "label", label: "Market", kind: "text" }, { key: "valueUsd", label: "Size (USD)", kind: "usd" }, { key: "geography", label: "Geography", kind: "text" },
      { key: "period", label: "Period", kind: "text" }, { key: "growthPct", label: "Annual growth", kind: "pct" }, { key: "methodology", label: "Methodology", kind: "textarea" }, meta("Source"),
    ] },
    { key: "competitors", label: "Competitors", kind: "list", addLabel: "Add a competitor", row: [{ key: "name", label: "Name", kind: "text" }, { key: "description", label: "Positioning", kind: "text" }, { key: "differentiation", label: "How you differ", kind: "text" }] },
  ] },
  { id: "operations", path: "operations", why: "Technical and IP diligence is where integration cost and ownership risk are assessed.", fields: [
    { key: "technology", label: "Technology", kind: "textarea" }, { key: "intellectualProperty", label: "Intellectual property", kind: "textarea" }, { key: "operations", label: "Operations", kind: "textarea" },
  ] },
  { id: "team", path: "team", why: "Buyers assess who runs the business and how dependent it is on any one person.", fields: [
    { key: "leaders", label: "Leadership team", kind: "list", addLabel: "Add a leader", row: [{ key: "name", label: "Name", kind: "text" }, { key: "role", label: "Role", kind: "text" }, { key: "bio", label: "Background", kind: "textarea" }, { key: "responsibilities", label: "Responsibilities", kind: "text" }, { key: "since", label: "Since", kind: "year" }, { key: "founder", label: "Founder", kind: "checkbox" }] },
    { key: "headcount", label: "Headcount by function", kind: "list", addLabel: "Add a function", row: [{ key: "function", label: "Function", kind: "text" }, { key: "count", label: "People", kind: "number" }] },
    { key: "headcountAsOf", label: "Headcount as of", kind: "text" }, { key: "structure", label: "Organisation structure", kind: "textarea" },
  ] },
  { id: "capitalization", path: "capitalization", why: "Buyers need fully diluted ownership to know who must approve a sale and how proceeds are shared.", fields: [
    { key: "holders", label: "Shareholders", kind: "list", addLabel: "Add a shareholder", row: [{ key: "name", label: "Holder", kind: "text" }, { key: "kind", label: "Type", kind: "select", options: [["founder", "Founder"], ["investor", "Investor"], ["employee", "Employee"], ["other", "Other"]] }, { key: "shareClass", label: "Share class", kind: "text" }, { key: "shares", label: "Shares", kind: "number" }, { key: "pct", label: "Fully diluted %", kind: "pct" }] },
    { key: "optionPoolPct", label: "Option pool (fully diluted)", kind: "pct" }, { key: "fullyDilutedShares", label: "Fully diluted shares", kind: "number" },
    { key: "shareClasses", label: "Share-class rights and preferences", kind: "textarea" },
    { key: "instruments", label: "Convertible or other instruments", kind: "list", addLabel: "Add an instrument", row: [{ key: "instrument", label: "Instrument", kind: "text" }, { key: "amountUsd", label: "Amount (USD)", kind: "usd" }, { key: "terms", label: "Terms", kind: "text" }] },
    { key: "asOf", label: "As of", kind: "text" }, meta("Source of the cap table"),
  ] },
  { id: "financials", path: "financials", why: "Buyers need several years of reported figures to judge the trend; documents show no period you have not reported.", fields: [
    { key: "annual", label: "Reported annual financials", kind: "list", addLabel: "Add a year", row: [{ key: "period", label: "Period, e.g. FY2025", kind: "text" }, { key: "periodEnd", label: "Period end (YYYY-MM-DD)", kind: "text" }, { key: "revenueUsd", label: "Revenue (USD)", kind: "usd" }, { key: "arrUsd", label: "ARR (USD)", kind: "usd" }, { key: "grossMarginPct", label: "Gross margin", kind: "pct" }, { key: "ebitdaUsd", label: "EBITDA (USD)", kind: "usd" }, meta("Source")] },
    { key: "forecasts", label: "Forecasts", kind: "list", addLabel: "Add a forecast", hint: "Stated only with the basis you give for it.", row: [{ key: "period", label: "Period", kind: "text" }, { key: "revenueUsd", label: "Revenue (USD)", kind: "usd" }, { key: "ebitdaUsd", label: "EBITDA (USD)", kind: "usd" }, { key: "basis", label: "Basis", kind: "textarea" }] },
    { key: "definitions", label: "Definitions (revenue, ARR, EBITDA)", kind: "textarea" },
  ] },
  { id: "growth", path: "growth", why: "A buyer weighs what the business could become under its ownership.", fields: [
    { key: "opportunities", label: "Growth opportunities", kind: "list", addLabel: "Add an opportunity", row: [{ key: "title", label: "Opportunity", kind: "text" }, { key: "description", label: "What it would take", kind: "textarea" }] },
  ] },
  { id: "risks", path: "risks", why: "Risks stated early are priced fairly; risks found late are priced harshly.", fields: [
    { key: "", label: "Risks and dependencies", kind: "list", addLabel: "Add a risk", row: [{ key: "title", label: "Risk", kind: "text" }, { key: "description", label: "Description", kind: "textarea" }, { key: "mitigation", label: "Mitigation", kind: "textarea" }] },
  ] },
  { id: "sources", path: "sources", why: "Each figure can cite a document here; a cited document must be attached.", fields: [
    { key: "", label: "Source documents", kind: "list", addLabel: "Add a source document", row: [
      { key: "title", label: "Title", kind: "text" },
      { key: "kind", label: "Type", kind: "select", options: [["statutory_accounts", "Statutory accounts"], ["management_accounts", "Management accounts"], ["board_pack", "Board pack"], ["contract", "Contract"], ["market_report", "Market report"], ["cap_table", "Cap table"], ["other", "Other"]] },
      { key: "date", label: "Document date (YYYY-MM-DD)", kind: "text" }, { key: "period", label: "Period covered", kind: "text" }, { key: "publisher", label: "Publisher (market reports)", kind: "text" },
      { key: "dataRoomId", label: "Data-room file id (once uploaded)", kind: "text" },
    ] },
  ] },
];

/** The headline intake figures whose basis the founder records in the Sources section. */
export const HEADLINE_FIGURES: ReadonlyArray<readonly [string, string]> = [
  ["ttmRevenueUsd", "Revenue (TTM)"], ["arrUsd", "ARR"], ["growthPct", "ARR growth"], ["grossMarginPct", "Gross margin"],
  ["ebitdaMarginPct", "EBITDA margin"], ["netRetentionPct", "Net revenue retention"], ["customerConcentrationPct", "Top-ten customer share"], ["totalCustomers", "Customer count"],
];

/** A new source id, unique within the story. */
export const newSourceId = (): string => `src-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10)}`;
