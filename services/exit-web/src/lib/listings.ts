import type { CompanyProfile } from "@exit/engines";
import { regionOf, type Region } from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile";
import { exitosSectorOf } from "./acquirer";
import { buildProfile } from "./company-intake";
import { SOVEREIGN_PRODUCTS, SOVEREIGN_OWNER_ACCOUNT } from "./sovereign-intel";
import { revenueBand, growthBand, type Band } from "./bands";
import { normalizeFacts, type ListingFacts } from "./listing-facts";

// ── LISTINGS REPOSITORY ─────────────────────────────────────────────
// Real listings — the supply side of the exchange. A founder lists their
// company (anonymized); buyers' mandates match against the POOL, not a demo.
// Persisted through a swappable adapter (localStorage now, the exit-api
// when it ships — the API and consumers never change).
//
// A listing is shared with every buyer, so it holds ONLY public fields: a code
// name, sector, region and revenue / growth brackets. The company's profile
// (name, exact figures) never enters it — the owner works from their own
// company record — and the id is not derived from the name.

/** Real product descriptor for catalog-style listings (e.g. Sovereign estate). */
export interface ListingProductMeta {
  readonly productLine: string;   // the real product name
  readonly category: string;      // the catalog section / family
  readonly descriptor?: string;   // the source's uppercase descriptor
  readonly capability: string;    // what it does (description)
  readonly valueLabel?: string;   // "Deployment value" | "Est. infrastructure value"
  readonly valueText?: string;    // verbatim published value, e.g. "From $8M", "$300M–$500M"
  readonly coverage?: readonly string[];
  readonly tags?: readonly string[];
  readonly acquisitionReadyText?: string; // featured acquisition-ready ask
}

export interface Listing {
  readonly id: string;
  readonly code: string;                 // anonymized handle, e.g. "Project Atlas"
  readonly listedAt: string;
  readonly ownerAccountId?: string;      // the founder who listed it — drives owner-scoped write RLS (never shown publicly)
  readonly productMeta?: ListingProductMeta; // present for named-product (catalog) listings
  readonly facts?: ListingFacts;         // what buyers read on the card: stage, what is for sale, model, stack, markets, asking price
  readonly verification?: ListingVerification; // stamped by the server from the owner's identity verification; never set by a client
  readonly publicView: ListingPublicView;
}

/** How the owner proved their identity, as the database stamps it on the listing. */
export interface ListingVerification { readonly provider: string; readonly verifiedAt: string }

export interface ListingPublicView {
  readonly sector: string;               // ExitOS sector
  readonly region: Region;
  readonly revenueBand?: Band;           // brackets, never exact figures (absent when withheld)
  readonly growthBand?: Band;
  readonly disclosed?: boolean;          // false ⇒ financials withheld pending NDA (never fabricated)
}

// a short, non-reversible id: djb2 over the seed, base 36
const shortHash = (seed: string): string => {
  let h = 5381;
  for (const c of seed) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return h.toString(36);
};

/** The listing id an earlier version derived from the company name; owners still look it up. */
export const legacyListingId = (profile: CompanyProfile): string => `lst-${profile.name.toLowerCase().replace(/[^\w]+/g, "-").slice(0, 24)}`;

/** A listing as stored by an earlier version (with the profile and exact figures) → public fields only. */
export function normalizeListing(raw: unknown): Listing {
  const r = raw as Record<string, unknown> & { publicView?: Record<string, unknown> };
  const pv = r.publicView ?? {};
  const disclosed = pv.disclosed === false ? false : true;
  const band = (b: unknown, exact: unknown, f: (n: number) => Band): Band | undefined =>
    !disclosed ? undefined : (b && typeof b === "object" ? (b as Band) : typeof exact === "number" ? f(exact) : undefined);
  const revenueBandV = band(pv.revenueBand, pv.revenueUsd, revenueBand);
  const growthBandV = band(pv.growthBand, pv.growthPct, growthBand);
  return {
    id: String(r.id), code: String(r.code), listedAt: String(r.listedAt),
    ...(r.ownerAccountId ? { ownerAccountId: String(r.ownerAccountId) } : {}),
    ...(r.productMeta ? { productMeta: r.productMeta as ListingProductMeta } : {}),
    ...((): { facts?: ListingFacts } => { const f = normalizeFacts(r.facts); return f ? { facts: f } : {}; })(),
    ...((): { verification?: ListingVerification } => {
      const v = r.verification as { provider?: unknown; verifiedAt?: unknown } | undefined;
      return v && typeof v.provider === "string" && typeof v.verifiedAt === "string" ? { verification: { provider: v.provider, verifiedAt: v.verifiedAt } } : {};
    })(),
    publicView: {
      sector: String(pv.sector ?? "Other"), region: pv.region as Region,
      ...(revenueBandV ? { revenueBand: revenueBandV } : {}),
      ...(growthBandV ? { growthBand: growthBandV } : {}),
      ...(disclosed ? {} : { disclosed: false }),
    },
  };
}

const KEY = "exitos.listings.v1";
const CODES = ["Atlas", "Cipher", "Meridian", "Halcyon", "Orion", "Vantage", "Beacon", "Summit"];
const codeFor = (id: string): string => `Project ${CODES[Math.abs([...id].reduce((a, c) => a + c.charCodeAt(0), 0)) % CODES.length]}`;

// the signed-in founder's account id, stamped onto listings they create so the
// backend can enforce "only the owner writes this listing". Set on connect.
let currentOwner: string | undefined;
export function setListingOwner(id?: string): void { currentOwner = id; }

export function listingFromCompany(profile: CompanyProfile, id?: string, facts?: ListingFacts): Listing {
  // one listing per owner account (or per company in a browser-only session)
  const lid = id ?? `lst-${shortHash(currentOwner ?? `local:${profile.name}`)}`;
  return {
    id: lid,
    code: codeFor(lid),
    listedAt: new Date().toISOString(),
    ...(currentOwner ? { ownerAccountId: currentOwner } : {}),
    ...(facts ? { facts } : {}),
    publicView: {
      sector: exitosSectorOf(profile),
      // the founder's stated region wins over the one derived from the jurisdiction code
      region: facts?.region ?? regionOf(profile.jurisdiction),
      revenueBand: revenueBand(profile.revenue.trailingTwelveMonthsRevenueUsd),
      growthBand: growthBand(profile.growth.arrGrowthYoyPct),
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
  return SOVEREIGN_PRODUCTS.map((p) => {
    const profile = sovereignProfile(p.name, p.sector);
    return {
      id: `lst-sov-${p.id}`,
      code: p.name,                         // catalog listing — the product name is the handle
      listedAt: "2026-01-01T00:00:00.000Z",
      ownerAccountId: SOVEREIGN_OWNER_ACCOUNT,
      productMeta: {
        productLine: p.name, category: p.category, descriptor: p.label, capability: p.description,
        valueLabel: p.valueLabel, valueText: p.valueText, coverage: p.coverage, tags: p.tags,
        acquisitionReadyText: p.acquisitionReadyText,
      },
      ...(p.facts ? { facts: p.facts } : {}),
      publicView: {
        sector: exitosSectorOf(profile), region: p.facts?.region ?? regionOf(profile.jurisdiction),
        // revenue/EBITDA not published; the real published figure is the
        // deployment/infrastructure VALUE, surfaced via productMeta.valueText.
        disclosed: false,
      },
    };
  });
}

export interface ListingsAdapter { read(): Listing[]; write(l: Listing[]): void }
const localAdapter: ListingsAdapter = {
  read() { try { return (JSON.parse(globalThis.localStorage?.getItem(KEY) ?? "[]") as unknown[]).map(normalizeListing); } catch { return []; } },
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
export function listCompany(profile: CompanyProfile, facts?: ListingFacts): Listing {
  const l = listingFromCompany(profile, undefined, facts);
  // replaces this company's listing, including one stored under the old name-derived id
  const legacy = legacyListingId(profile);
  const rest = load().filter((x) => x.id !== l.id && x.id !== legacy);
  cache = [l, ...rest];
  adapter.write(cache);
  emit();
  return l;
}

/** Withdraw a listing (the founder's way back after listing). */
export function unlistCompany(id: string): void {
  cache = load().filter((x) => x.id !== id);
  adapter.write(cache);
  emit();
}

export const isListed = (id: string): boolean => load().some((x) => x.id === id);

/** The owner's own listing of this company, under its current or its old name-derived id. */
export const findOwnListing = (profile: CompanyProfile): Listing | undefined => {
  const ids = [listingFromCompany(profile).id, legacyListingId(profile)];
  return load().find((x) => ids.includes(x.id));
};

/** Where a listing came from: a founder's own listing, the bundled demo
 *  company, or the Sovereign product catalog (both seeded, not founders). */
export type ListingOrigin = "founder" | "demo" | "catalog";
export const listingOrigin = (l: Pick<Listing, "id">): ListingOrigin =>
  l.id === "lst-demo-helios" ? "demo" : l.id.startsWith("lst-sov-") ? "catalog" : "founder";

/** The code name documents use for a company before an NDA: its own listing's
 *  (the seeded demo listing's for the demo company). */
export const codeNameFor = (profile: CompanyProfile, demo: boolean): string =>
  demo ? listingFromCompany(profile, "lst-demo-helios").code : (findOwnListing(profile) ?? listingFromCompany(profile)).code;
