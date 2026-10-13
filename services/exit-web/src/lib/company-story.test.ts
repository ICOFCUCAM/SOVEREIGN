import { describe, it, expect, beforeEach, vi } from "vitest";
import { EMPTY_STORY, type CompanyStory } from "@exit/engines";
import { buildProfile, SAMPLE_INTAKE, ASSUMED_PROFILE_FIELDS } from "./company-intake";
import { loadStory, saveStory, fetchStory, profileWithStory } from "./company-story";

const base = { ...buildProfile({ ...SAMPLE_INTAKE, name: "Northwind Analytics" }), id: "co-test" };
const src = { id: "s1", title: "Market report", kind: "market_report" as const, date: "2026-01-10", publisher: "Example Research" };

// in-memory localStorage shim (the test env is node, not jsdom)
beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k), clear: () => store.clear(),
  };
});

describe("company story store", () => {
  it("saves partial work and loads it back; an unknown company has an empty story", async () => {
    expect(loadStory("co-x")).toEqual(EMPTY_STORY);
    await saveStory("co-x", { ...EMPTY_STORY, history: { origin: "Two analysts", milestones: [], ownershipChanges: [] } });
    expect(loadStory("co-x").history?.origin).toBe("Two analysts");
  });
  it("upserts the signed-in owner's row and reads it back", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify([{ data: { version: "1", sources: [], growth: { opportunities: [] } } }]), { status: 200 }));
    const remote = { url: "https://x.supabase.co", anonKey: "anon", accessToken: "tok", fetchImpl: f as unknown as typeof fetch };
    await saveStory("co-x", EMPTY_STORY, remote);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("exitos_company_stories?on_conflict=owner_account_id,company_id");
    expect(JSON.parse(String(init.body))).toMatchObject({ company_id: "co-x", data: { version: "1" } });
    expect((await fetchStory("co-x", remote))?.version).toBe(1);
  });
});

describe("profileWithStory: a field stops being assumed only when the story states it", () => {
  it("an empty story leaves every neutral value assumed", () => {
    expect(profileWithStory(base, EMPTY_STORY).assumed.sort()).toEqual([...ASSUMED_PROFILE_FIELDS].sort());
  });
  it("headcount, founders, cap table, sourced market size and gross retention come from the story", () => {
    const story: CompanyStory = {
      ...EMPTY_STORY, sources: [src],
      team: { leaders: [{ name: "Ada Park", role: "CEO", bio: "Co-founder", founder: true }], headcount: [{ function: "Engineering", count: 31 }, { function: "Sales", count: 12 }] },
      capitalization: { holders: [{ name: "Founders", kind: "founder", shareClass: "Ordinary", pct: 0.52 }, { name: "Fund I", kind: "investor", shareClass: "Preferred A", pct: 0.38 }], optionPoolPct: 0.1, instruments: [] },
      market: { geographies: ["UK"], competitors: [], estimates: [{ label: "UK analytics", valueUsd: 3.1e9, geography: "United Kingdom", period: "2025", methodology: "vendor revenue survey", growthPct: 0.09, meta: { provenance: "source", sourceId: "s1" } }] },
      customers: { segments: [], profiles: [], caseStudies: [], grossRetentionPct: 0.93 },
    };
    const { profile, assumed } = profileWithStory(base, story);
    expect(profile.team.headcount).toBe(43);
    expect(profile.cap).toMatchObject({ foundersOwnershipPct: 0.52, investorOwnershipPct: 0.38, esopOwnershipPct: 0.1 });
    expect(profile.market.addressableMarketUsd).toBe(3.1e9);
    expect(profile.revenue.grossRetentionPct).toBe(0.93);
    for (const k of ["team.headcount", "team.foundersStillActive", "cap", "market.addressableMarketUsd", "market.marketGrowthPct", "revenue.grossRetentionPct"]) expect(assumed).not.toContain(k);
    expect(assumed).toContain("product.differentiation");
  });
  it("an unsourced market size is not used", () => {
    const story: CompanyStory = { ...EMPTY_STORY, market: { geographies: [], competitors: [], estimates: [{ label: "x", valueUsd: 9e9, geography: "World", period: "2025", methodology: "guess", meta: { provenance: "founder" } }] } };
    const { profile, assumed } = profileWithStory(base, story);
    expect(profile.market.addressableMarketUsd).toBe(base.market.addressableMarketUsd);
    expect(assumed).toContain("market.addressableMarketUsd");
  });
});
