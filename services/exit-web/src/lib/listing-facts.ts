import type { Region } from "@exit/engines";

// ── LISTING FACTS ───────────────────────────────────────────────────
// What a buyer needs to read on a listing card before asking for an NDA: what the business is,
// how far along it is, what exactly is for sale, how it makes money, what it is built with,
// where it is based and sells, and the asking price. A founder fills these in when listing;
// the product catalog carries the same fields, so every card answers the same questions.
// They are public (every buyer reads them), so they hold no company name or exact financials;
// revenue and growth stay as brackets on the listing itself.

export const STAGES = ["concept", "prototype", "beta", "live", "revenue", "profitable"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABEL: Record<Stage, string> = {
  concept: "Concept / blueprint", prototype: "Working prototype", beta: "Beta / pilot users",
  live: "Live in production", revenue: "Live with revenue", profitable: "Profitable",
};

export const FOR_SALE = ["company_shares", "source_code_ip", "brand_domain", "customers_contracts", "infrastructure", "data", "team"] as const;
export type ForSale = (typeof FOR_SALE)[number];
export const FOR_SALE_LABEL: Record<ForSale, string> = {
  company_shares: "The company (shares)", source_code_ip: "Source code & IP", brand_domain: "Brand & domain",
  customers_contracts: "Customers & contracts", infrastructure: "Infrastructure & deployment", data: "Data & content", team: "Team transition",
};

export const MODELS = ["subscription", "commission", "transaction_fees", "licence", "government_contract", "advertising", "services", "not_monetised"] as const;
export type Model = (typeof MODELS)[number];
export const MODEL_LABEL: Record<Model, string> = {
  subscription: "Subscriptions (SaaS)", commission: "Commission / marketplace take", transaction_fees: "Transaction fees",
  licence: "Licence / deployment fee", government_contract: "Government contracts", advertising: "Advertising",
  services: "Services", not_monetised: "Not monetised yet",
};

export const ASKING_MODES = ["price", "range", "offers", "on_request"] as const;
export type AskingMode = (typeof ASKING_MODES)[number];
export const ASKING_LABEL: Record<AskingMode, string> = { price: "Fixed price", range: "Price range", offers: "Open to offers", on_request: "Price on request" };

export const REGIONS: readonly Region[] = ["North America", "Europe", "Asia", "Middle East", "Oceania", "Latin America", "Africa", "Other"];

export interface ListingFacts {
  readonly summary: string;                 // what the business does, for a buyer (no company name)
  readonly stage?: Stage;                   // required from founders; a catalog entry omits it when unknown
  readonly forSale: readonly ForSale[];
  readonly models: readonly Model[];
  readonly builtWith: readonly string[];
  readonly basedIn: string;                 // country
  readonly region: Region;
  readonly markets: readonly string[];
  readonly askingMode: AskingMode;
  readonly askingLowUsd?: number;           // the price, or the bottom of the range
  readonly askingHighUsd?: number;          // the top of the range
  readonly reasonForSale?: string;
}

export const SUMMARY_MIN = 80;
export const SUMMARY_MAX = 900;
export const REASON_MAX = 300;
const LIST_MAX = 12;
const ITEM_MAX = 60;

/** The three pages of the founder's company profile, in order. */
export const PROFILE_SECTIONS = ["overview", "financial", "transaction"] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];
export const PROFILE_SECTION_LABEL: Record<ProfileSection, string> = { overview: "Business overview", financial: "Financial profile", transaction: "Transaction profile" };

/** Every gap, with the profile page it is filled in on. */
export function missingTagged(f: Partial<ListingFacts>): Array<[ProfileSection, string]> {
  const out: Array<[ProfileSection, string]> = [];
  const summary = (f.summary ?? "").trim();
  if (summary.length < SUMMARY_MIN) out.push(["overview", `A description of at least ${SUMMARY_MIN} characters`]);
  if (summary.length > SUMMARY_MAX) out.push(["overview", `A description of at most ${SUMMARY_MAX} characters`]);
  if (!f.stage) out.push(["overview", "The stage"]);
  if (!f.forSale?.length) out.push(["transaction", "What is for sale"]);
  if (!f.models?.length) out.push(["transaction", "How it makes money"]);
  if (!f.builtWith?.length) out.push(["transaction", "What it is built with"]);
  if (!(f.basedIn ?? "").trim()) out.push(["transaction", "Where it is based"]);
  if (!f.region) out.push(["overview", "The region"]);
  if (!f.markets?.length) out.push(["transaction", "The markets it serves"]);
  if (!f.askingMode) out.push(["financial", "The asking price"]);
  else if (f.askingMode === "price" && !(f.askingLowUsd && f.askingLowUsd > 0)) out.push(["financial", "The price"]);
  else if (f.askingMode === "range" && !(f.askingLowUsd && f.askingHighUsd && f.askingLowUsd > 0 && f.askingHighUsd > f.askingLowUsd)) out.push(["financial", "A price range (low below high)"]);
  if ((f.reasonForSale ?? "").length > REASON_MAX) out.push(["transaction", `A reason for sale of at most ${REASON_MAX} characters`]);
  return out;
}

/** What still has to be filled in before the listing can go on the exchange (empty = ready). */
export const missingFacts = (f: Partial<ListingFacts>): string[] => missingTagged(f).map(([, m]) => m);

/** What is still missing on one page of the profile. */
export const missingIn = (section: ProfileSection, f: Partial<ListingFacts>): string[] => missingTagged(f).filter(([s]) => s === section).map(([, m]) => m);

/** Comma- or line-separated text → a short, de-duplicated list. */
export const splitList = (s: string): string[] =>
  Array.from(new Set(s.split(/[,\n]/).map((x) => x.trim().slice(0, ITEM_MAX)).filter(Boolean))).slice(0, LIST_MAX);

const pick = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined => (typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined);
const picks = <T extends string>(v: unknown, allowed: readonly T[]): T[] => (Array.isArray(v) ? Array.from(new Set(v.map((x) => pick(x, allowed)).filter((x): x is T => !!x))) : []);
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, ITEM_MAX)).filter(Boolean).slice(0, LIST_MAX) : []);
const usd = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined);

/** Facts as stored (by any client, any version) → well-formed facts, or undefined when unusable. */
export function normalizeFacts(raw: unknown): ListingFacts | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const stage = pick(r.stage, STAGES), askingMode = pick(r.askingMode, ASKING_MODES) ?? "on_request";
  const region = pick(r.region, REGIONS) ?? "Other";
  const summary = typeof r.summary === "string" ? r.summary.trim().slice(0, SUMMARY_MAX) : "";
  if (!summary) return undefined;
  const low = usd(r.askingLowUsd), high = usd(r.askingHighUsd);
  const reason = typeof r.reasonForSale === "string" ? r.reasonForSale.trim().slice(0, REASON_MAX) : "";
  return {
    summary, ...(stage ? { stage } : {}), forSale: picks(r.forSale, FOR_SALE), models: picks(r.models, MODELS), builtWith: strs(r.builtWith),
    basedIn: typeof r.basedIn === "string" ? r.basedIn.trim().slice(0, ITEM_MAX) : "", region, markets: strs(r.markets), askingMode,
    ...(low && (askingMode === "price" || askingMode === "range") ? { askingLowUsd: low } : {}),
    ...(high && askingMode === "range" ? { askingHighUsd: high } : {}),
    ...(reason ? { reasonForSale: reason } : {}),
  };
}

const money = (v: number): string => (v >= 1e9 ? `$${+(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${+(v / 1e6).toFixed(2)}M` : `$${Math.round(v / 1e3)}K`);

/** The asking price as a buyer reads it. */
export function askingText(f: Pick<ListingFacts, "askingMode" | "askingLowUsd" | "askingHighUsd">): string {
  if (f.askingMode === "price" && f.askingLowUsd) return money(f.askingLowUsd);
  if (f.askingMode === "range" && f.askingLowUsd && f.askingHighUsd) return `${money(f.askingLowUsd)}–${money(f.askingHighUsd)}`;
  return f.askingMode === "offers" ? "Open to offers" : "Price on request";
}
