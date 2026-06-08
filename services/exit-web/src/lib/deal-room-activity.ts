import { BUYERS } from "./engines";

// Live Deal Room activity. In demo mode there is no real session telemetry,
// so engagement is modelled deterministically from each buyer's acquisition
// probability — higher-intent buyers spend more time, open more of the
// package, download more and dwell on the sensitive documents. The shape
// mirrors what the production deal room emits (per-buyer view/download/dwell
// events) so the UI is identical when live data is wired in.

export interface DocView {
  key: string;
  label: string;
  concern: boolean;     // a sensitive document (a buyer dwelling here is a risk signal)
  downloaded: boolean;
  dwellMin: number;     // minutes on this document
}

export interface BuyerActivity {
  buyerName: string;
  buyerType: string;
  timeMinutes: number;
  viewed: DocView[];
  downloads: number;
  concerns: DocView[];  // sensitive docs they spent real time on
  interestScore: number; // 0..100
  status: string;
  lastActive: string;
}

const DOCS: { key: string; label: string; concern: boolean }[] = [
  { key: "financial",     label: "Financial package",      concern: false },
  { key: "contracts",     label: "Customer contracts",     concern: false },
  { key: "churn",         label: "Churn analysis",         concern: true },
  { key: "concentration", label: "Customer concentration", concern: true },
  { key: "cap",           label: "Cap table",              concern: false },
  { key: "tech",          label: "Tech architecture",      concern: false },
  { key: "legal",         label: "Legal & IP",             concern: true },
  { key: "cohorts",       label: "Cohort retention",       concern: false },
];

const LAST_ACTIVE = ["12m ago", "1h ago", "3h ago", "yesterday", "2d ago", "4d ago"];
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

function activityFor(buyerName: string, buyerType: string, probability: number, idx: number): BuyerActivity {
  const timeMinutes = Math.round(35 + probability * 230);
  const viewedCount = clamp(Math.round(2 + probability * 6), 1, DOCS.length);
  // rotate the catalog per buyer so they don't all open the same set
  const rotated = [...DOCS.slice(idx % DOCS.length), ...DOCS.slice(0, idx % DOCS.length)];
  const picked = rotated.slice(0, viewedCount);
  const dlCount = clamp(Math.round(viewedCount * (0.35 + probability * 0.4)), 0, viewedCount);

  const viewed: DocView[] = picked.map((d, i) => ({
    ...d,
    downloaded: i < dlCount,
    // sensitive docs that draw extra dwell from a serious buyer
    dwellMin: Math.max(2, Math.round((timeMinutes / viewedCount) * (d.concern ? 1.6 : 0.8))),
  }));
  const concerns = viewed.filter((d) => d.concern && d.dwellMin >= 8);

  const dlRatio = viewedCount > 0 ? dlCount / viewedCount : 0;
  const interestScore = clamp(Math.round(44 + probability * 52 + dlRatio * 8), 5, 96);
  const status = interestScore >= 85 ? "Likely moving to LOI"
    : interestScore >= 68 ? "Actively evaluating"
    : interestScore >= 50 ? "Working the package"
    : interestScore >= 35 ? "Early review" : "Cooling";

  return {
    buyerName, buyerType, timeMinutes, viewed,
    downloads: dlCount, concerns, interestScore, status,
    lastActive: LAST_ACTIVE[idx % LAST_ACTIVE.length],
  };
}

export function dealRoomActivity(limit = 6): BuyerActivity[] {
  return BUYERS.candidates.slice(0, limit)
    .map((c, i) => activityFor(c.buyer.name, c.buyer.buyerType, c.probability, i))
    .sort((a, b) => b.interestScore - a.interestScore);
}

// Aggregate document attention across all buyers in the room.
export interface DocAttention { label: string; concern: boolean; views: number; downloads: number; concernViews: number; }
export function documentAttention(activity: BuyerActivity[]): DocAttention[] {
  const map = new Map<string, DocAttention>();
  for (const a of activity) {
    for (const d of a.viewed) {
      const cur = map.get(d.label) ?? { label: d.label, concern: d.concern, views: 0, downloads: 0, concernViews: 0 };
      cur.views += 1;
      if (d.downloaded) cur.downloads += 1;
      if (d.concern && d.dwellMin >= 8) cur.concernViews += 1;
      map.set(d.label, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.views - a.views);
}

export const fmtDuration = (min: number): string => `${Math.floor(min / 60)}h ${min % 60}m`;
