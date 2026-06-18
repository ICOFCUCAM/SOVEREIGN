import type { CompanyProfile } from "@exit/engines";
import { regionOf, type Region } from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile";
import { exitosSectorOf } from "./acquirer";

// ── LISTINGS REPOSITORY ─────────────────────────────────────────────
// Real listings — the supply side of the exchange. A founder lists their
// company (anonymized); buyers' mandates match against the POOL, not a demo.
// Persisted through a swappable adapter (localStorage now, the exit-api
// when it ships — the API and consumers never change). The public view is
// always anonymized: sector, region, revenue band, growth — never the name.

export interface Listing {
  readonly id: string;
  readonly code: string;                 // anonymized handle, e.g. "Project Atlas"
  readonly listedAt: string;
  readonly profile: CompanyProfile;      // internal — used for matching, never shown raw
  readonly publicView: {
    readonly sector: string;             // ExitOS sector
    readonly region: Region;
    readonly revenueUsd: number;
    readonly growthPct: number;
    readonly ebitdaMarginPct: number;
  };
}

const KEY = "exitos.listings.v1";
const CODES = ["Atlas", "Cipher", "Meridian", "Halcyon", "Orion", "Vantage", "Beacon", "Summit"];
const codeFor = (id: string): string => `Project ${CODES[Math.abs([...id].reduce((a, c) => a + c.charCodeAt(0), 0)) % CODES.length]}`;

export function listingFromCompany(profile: CompanyProfile, id?: string): Listing {
  const lid = id ?? `lst-${profile.name.toLowerCase().replace(/[^\w]+/g, "-").slice(0, 24)}`;
  return {
    id: lid,
    code: codeFor(lid),
    listedAt: new Date().toISOString(),
    profile,
    publicView: {
      sector: exitosSectorOf(profile),
      region: regionOf(profile.jurisdiction),
      revenueUsd: profile.revenue.trailingTwelveMonthsRevenueUsd,
      growthPct: profile.growth.arrGrowthYoyPct,
      ebitdaMarginPct: profile.revenue.ebitdaMarginPct,
    },
  };
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

// the demo company is one real baseline listing so the pool is never empty
const SEED = listingFromCompany(SAMPLE_COMPANY, "lst-demo-helios");

function load(): Listing[] {
  if (cache == null) {
    const stored = adapter.read();
    cache = stored.some((l) => l.id === SEED.id) ? stored : [SEED, ...stored];
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
