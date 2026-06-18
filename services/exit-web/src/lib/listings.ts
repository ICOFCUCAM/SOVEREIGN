import type { CompanyProfile } from "@exit/engines";
import { regionOf, type Region } from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile";
import { exitosSectorOf } from "./acquirer";
import { buildProfile } from "./company-intake";
import { SOVEREIGN_INTEL_PRODUCTS, SOVEREIGN_OWNER_ACCOUNT, SOVEREIGN_PRICING_NOTE } from "./sovereign-intel";

// ── LISTINGS REPOSITORY ─────────────────────────────────────────────
// Real listings — the supply side of the exchange. A founder lists their
// company (anonymized); buyers' mandates match against the POOL, not a demo.
// Persisted through a swappable adapter (localStorage now, the exit-api
// when it ships — the API and consumers never change). The public view is
// always anonymized: sector, region, revenue band, growth — never the name.

/** Real product descriptor for catalog-style listings (e.g. Sovereign Intelligence). */
export interface ListingProductMeta {
  readonly productLine: string;   // the real product / engine name
  readonly category: string;      // the product family / layer
  readonly posture?: string;      // operating posture, where defined
  readonly capability: string;    // what it does
  readonly answers?: string;      // the question it answers
  readonly pricingNote?: string;  // published list/subscription pricing context, where real
}

export interface Listing {
  readonly id: string;
  readonly code: string;                 // anonymized handle, e.g. "Project Atlas"
  readonly listedAt: string;
  readonly ownerAccountId?: string;      // the founder who listed it — drives owner-scoped write RLS (never shown publicly)
  readonly profile: CompanyProfile;      // internal — used for matching, never shown raw
  readonly productMeta?: ListingProductMeta; // present for named-product (catalog) listings
  readonly publicView: {
    readonly sector: string;             // ExitOS sector
    readonly region: Region;
    readonly revenueUsd: number;
    readonly growthPct: number;
    readonly ebitdaMarginPct: number;
    readonly disclosed?: boolean;        // false ⇒ financials withheld pending NDA (never fabricated); undefined ⇒ disclosed
  };
}

const KEY = "exitos.listings.v1";
const CODES = ["Atlas", "Cipher", "Meridian", "Halcyon", "Orion", "Vantage", "Beacon", "Summit"];
const codeFor = (id: string): string => `Project ${CODES[Math.abs([...id].reduce((a, c) => a + c.charCodeAt(0), 0)) % CODES.length]}`;

// the signed-in founder's account id, stamped onto listings they create so the
// backend can enforce "only the owner writes this listing". Set on connect.
let currentOwner: string | undefined;
export function setListingOwner(id?: string): void { currentOwner = id; }

export function listingFromCompany(profile: CompanyProfile, id?: string): Listing {
  const lid = id ?? `lst-${profile.name.toLowerCase().replace(/[^\w]+/g, "-").slice(0, 24)}`;
  return {
    id: lid,
    code: codeFor(lid),
    listedAt: new Date().toISOString(),
    ownerAccountId: currentOwner,
    profile,
    publicView: {
      sector: exitosSectorOf(profile),
      region: regionOf(profile.jurisdiction),
      revenueUsd: profile.revenue.trailingTwelveMonthsRevenueUsd,
      growthPct: profile.growth.arrGrowthYoyPct,
      ebitdaMarginPct: profile.revenue.ebitdaMarginPct,
      disclosed: true,
    },
  };
}

// ── Sovereign Intelligence catalog listings ─────────────────────────
// Each real product line is listed as an acquisition opportunity owned by the
// admin account. No financials are invented: the public view is marked
// undisclosed ("under NDA"), and the product's real capability is surfaced.
const sovereignProfile = (name: string, sector: string): CompanyProfile =>
  buildProfile({
    name, jurisdiction: "US", sector: sector as Parameters<typeof buildProfile>[0]["sector"],
    foundedYear: 2023, ttmRevenueUsd: 0, arrUsd: 0, growthPct: 0, grossMarginPct: 0, ebitdaMarginPct: 0,
    netRetentionPct: 1, customerConcentrationPct: 0, totalCustomers: 0, hasNetworkEffects: true, hasDataMoat: true,
  });

function buildSovereignListings(): Listing[] {
  return SOVEREIGN_INTEL_PRODUCTS.map((p) => {
    const profile = sovereignProfile(p.name, p.sector);
    return {
      id: `lst-sov-${p.id}`,
      code: p.name,                         // catalog listing — the product line is the handle
      listedAt: "2026-01-01T00:00:00.000Z",
      ownerAccountId: SOVEREIGN_OWNER_ACCOUNT,
      profile,
      productMeta: { productLine: p.name, category: p.layer, posture: p.posture, capability: p.capability, answers: p.answers, pricingNote: SOVEREIGN_PRICING_NOTE },
      publicView: {
        sector: exitosSectorOf(profile), region: regionOf(profile.jurisdiction),
        revenueUsd: 0, growthPct: 0, ebitdaMarginPct: 0, disclosed: false,
      },
    };
  });
}

export interface ListingsAdapter { read(): Listing[]; write(l: Listing[]): void }
const localAdapter: ListingsAdapter = {
  read() { try { return JSON.parse(globalThis.localStorage?.getItem(KEY) ?? "[]") as Listing[]; } catch { return []; } },
  write(l) { try { globalThis.localStorage?.setItem(KEY, JSON.stringify(l)); } catch { /* in-memory */ } },
};
let adapter: ListingsAdapter = localAdapter;
export function setListingsAdapter(a: ListingsAdapter): void { adapter = a; cache = null; emit(); }

let cache: Listing[] | null = null;
const listeners = new Set<() => void>();
const emit = (): void => listeners.forEach((l) => l());

// the demo company plus the Sovereign Intelligence catalog are the baseline
// supply, so the exchange is never empty and buyers see real products at once.
const SEED = listingFromCompany(SAMPLE_COMPANY, "lst-demo-helios");
const SOVEREIGN_SEED = buildSovereignListings();
const SEEDS = [SEED, ...SOVEREIGN_SEED];

function load(): Listing[] {
  if (cache == null) {
    const stored = adapter.read();
    const have = new Set(stored.map((l) => l.id));
    const missing = SEEDS.filter((s) => !have.has(s.id));
    cache = missing.length ? [...missing, ...stored] : stored;
  }
  return cache;
}

export function allListings(): readonly Listing[] { return load(); }
export function subscribeListings(l: () => void): () => void { listeners.add(l); return () => void listeners.delete(l); }

/** List (or update) a company — the supply side of the network. */
export function listCompany(profile: CompanyProfile): Listing {
  const l = listingFromCompany(profile);
  const rest = load().filter((x) => x.id !== l.id);
  cache = [l, ...rest];
  adapter.write(cache);
  emit();
  return l;
}
