import { EMPTY_STORY, cleanStory, usableMarketEstimate, withoutSelfVerification, type CompanyProfile, type CompanyStory } from "@exit/engines";
import { ASSUMED_PROFILE_FIELDS } from "./company-intake";
import type { Remote } from "./documents/store";

// ── COMPANY STORY STORE ─────────────────────────────────────────────
// The progressive intake's second part: the company's history, products,
// customers, market, people, ownership, financial history and sources. Saved
// whenever the founder stops — partial is normal. A signed-in account keeps it
// in exitos_company_stories (owner-only; the database refuses self-marked
// "verified" figures); without a session it stays in this browser.

const key = (companyId: string): string => `exitos.story.v1.${companyId}`;

export function loadStory(companyId: string | null): CompanyStory {
  if (!companyId) return EMPTY_STORY;
  try {
    const raw = localStorage.getItem(key(companyId));
    // a story never verifies itself: only server verification records confer "verified"
    return raw ? withoutSelfVerification({ ...EMPTY_STORY, ...(JSON.parse(raw) as CompanyStory) }) : EMPTY_STORY;
  } catch { return EMPTY_STORY; }
}

/** Save the story as it stands (never blocked by missing information). */
export async function saveStory(companyId: string, story: CompanyStory, remote?: Remote, figures?: CompanyStory["figures"]): Promise<CompanyStory> {
  // the headline figures travel with the story, so a reviewer verifies the value the documents use
  const saved: CompanyStory = withoutSelfVerification({ ...story, ...(figures ? { figures } : {}), version: 1, updatedAt: new Date().toISOString() });
  try { localStorage.setItem(key(companyId), JSON.stringify(saved)); } catch { /* storage unavailable */ }
  if (remote) {
    const res = await (remote.fetchImpl ?? fetch)(`${remote.url}/rest/v1/exitos_company_stories?on_conflict=owner_account_id,company_id`, {
      method: "POST",
      headers: { apikey: remote.anonKey, Authorization: `Bearer ${remote.accessToken}`, "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ company_id: companyId, data: { ...saved, version: "1" } }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null) as { message?: string } | null;
      throw new Error(`Saving the company story: ${body?.message ?? res.status}`);
    }
  }
  return saved;
}

/** The signed-in owner's saved story from the server, or null. */
export async function fetchStory(companyId: string, remote: Remote): Promise<CompanyStory | null> {
  const res = await (remote.fetchImpl ?? fetch)(`${remote.url}/rest/v1/exitos_company_stories?company_id=eq.${encodeURIComponent(companyId)}&select=data`, {
    headers: { apikey: remote.anonKey, Authorization: `Bearer ${remote.accessToken}` },
  });
  if (!res.ok) return null;
  const rows = await res.json() as Array<{ data: CompanyStory & { version: unknown } }>;
  return rows[0] ? withoutSelfVerification({ ...EMPTY_STORY, ...rows[0].data, version: 1 }) : null;
}

/** The engine profile with what the story supplies, and the profile fields that are still assumed.
 *  A field leaves the assumed list only when the story states it; nothing is inferred. */
export function profileWithStory(profile: CompanyProfile, raw: CompanyStory): { profile: CompanyProfile; assumed: string[] } {
  const story = cleanStory(raw);   // only complete entries count
  const assumed = new Set(ASSUMED_PROFILE_FIELDS);
  let p = profile;
  const head = story.team?.headcount ?? [];
  if (head.length) {
    p = { ...p, team: { ...p.team, headcount: head.reduce((n, h) => n + Math.max(0, h.count), 0) } };
    assumed.delete("team.headcount");
  }
  const leaders = story.team?.leaders ?? [];
  if (leaders.some((l) => l.founder)) { p = { ...p, team: { ...p.team, foundersStillActive: true } }; assumed.delete("team.foundersStillActive"); }
  const holders = story.capitalization?.holders ?? [];
  if (holders.length) {
    const sum = (k: string): number => holders.filter((h) => h.kind === k).reduce((n, h) => n + h.pct, 0);
    p = { ...p, cap: { ...p.cap,
      foundersOwnershipPct: sum("founder"), investorOwnershipPct: sum("investor"),
      esopOwnershipPct: story.capitalization?.optionPoolPct ?? sum("employee"),
      ...(story.capitalization?.fullyDilutedShares ? { fullyDilutedShares: story.capitalization.fullyDilutedShares } : {}) } };
    assumed.delete("cap");
    if (story.capitalization?.fullyDilutedShares) assumed.delete("cap.fullyDilutedShares");
  }
  const est = (story.market?.estimates ?? []).filter((e) => usableMarketEstimate(e, story).ok).sort((a, b) => b.valueUsd - a.valueUsd)[0];
  if (est) {
    p = { ...p, market: { ...p.market, addressableMarketUsd: est.valueUsd, ...(est.growthPct != null ? { marketGrowthPct: est.growthPct } : {}) } };
    assumed.delete("market.addressableMarketUsd");
    if (est.growthPct != null) assumed.delete("market.marketGrowthPct");
  }
  if (story.customers?.grossRetentionPct != null) {
    p = { ...p, revenue: { ...p.revenue, grossRetentionPct: story.customers.grossRetentionPct } };
    assumed.delete("revenue.grossRetentionPct");
  }
  return { profile: { ...p, assumed: [...assumed] }, assumed: [...assumed] };
}

/** The headline intake figures a story carries (what reviewers verify and documents state). */
export const figuresOf = (inputs: Record<string, unknown>): Record<string, number | string | boolean> =>
  Object.fromEntries(["ttmRevenueUsd", "arrUsd", "growthPct", "grossMarginPct", "ebitdaMarginPct", "netRetentionPct", "customerConcentrationPct", "totalCustomers"]
    .filter((k) => typeof inputs[k] === "number").map((k) => [k, inputs[k] as number]));
