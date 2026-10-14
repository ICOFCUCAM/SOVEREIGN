import type { Role } from "./access";

// ── ONBOARDING ──────────────────────────────────────────────────────
// The "Start here" guide and the pages opened in this browser. Progress is
// only ever what really happened: a step is "Done" when its own signal says
// so (saved company figures) and "Opened" when the page has been opened here
// — never "completed" on a guess. Everything is stored in this browser only.

const KEY = "exitos.guide.v1";
const EVENT = "exitos:guide";

interface GuideState { visited: string[]; hidden: boolean; tipsHidden: boolean; welcomed: boolean; journeyHidden: boolean }

const EMPTY: GuideState = { visited: [], hidden: false, tipsHidden: false, welcomed: false, journeyHidden: false };

function read(): GuideState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const s = JSON.parse(raw) as Partial<GuideState>;
    return { visited: Array.isArray(s.visited) ? s.visited.filter((v) => typeof v === "string") : [], hidden: s.hidden === true, tipsHidden: s.tipsHidden === true, welcomed: s.welcomed === true, journeyHidden: s.journeyHidden === true };
  } catch { return EMPTY; }
}

function write(s: GuideState): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable: nothing remembered */ }
  try { window.dispatchEvent(new Event(EVENT)); } catch { /* no window (tests) */ }
}

export const guideState = (): GuideState => read();

/** Record that a console page was opened in this browser. */
export function markVisited(path: string): void {
  const s = read();
  if (s.visited.includes(path)) return;
  write({ ...s, visited: [...s.visited, path] });
}

export function setGuideHidden(hidden: boolean): void {
  write({ ...read(), hidden });
}

/** The first-visit welcome line has been dismissed. */
export function setWelcomed(): void {
  write({ ...read(), welcomed: true });
}

/** The guided journey's bar at the foot of each page is switched off (the journey page stays). */
export function setJourneyHidden(journeyHidden: boolean): void {
  write({ ...read(), journeyHidden });
}

export function setTipsHidden(tipsHidden: boolean): void {
  write({ ...read(), tipsHidden });
}

/** Re-render when the guide state changes (in this tab). */
export function onGuideChange(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

export interface GuideStep {
  to: string;
  title: string;
  why: string;
  /** "intake" — done when the founder's figures are saved; otherwise "opened". */
  signal: "intake" | "opened";
}

export const FOUNDER_STEPS: readonly GuideStep[] = [
  { to: "/console/intake", title: "Value my company", why: "Enter your figures once. Every other page then uses your company instead of the demo.", signal: "intake" },
  { to: "/console/readiness", title: "Check readiness", why: "See what a buyer would question first, and what to fix before a sale.", signal: "opened" },
  { to: "/console/valuation", title: "See your value", why: "Your valuation range and how it is built.", signal: "opened" },
  { to: "/console/buyers", title: "Find buyers", why: "The acquirers that fit your company, with their record.", signal: "opened" },
  { to: "/console/outreach-plan", title: "Plan outreach", why: "Who to approach first, and in what order. Nothing is sent from here.", signal: "opened" },
];

export const BUYER_STEPS: readonly GuideStep[] = [
  { to: "/console/marketplace", title: "Browse opportunities", why: "Anonymous companies listed for sale.", signal: "opened" },
  { to: "/console/acquisition-radar", title: "Request an NDA or make an offer", why: "Pick a company and ask for access.", signal: "opened" },
  { to: "/console/nda", title: "Follow your requests", why: "See which access requests were accepted.", signal: "opened" },
  { to: "/console/deal-room", title: "Work the deal", why: "The deal room for companies that gave you access.", signal: "opened" },
];

export const stepsFor = (role: Role): readonly GuideStep[] => (role === "buyer" ? BUYER_STEPS : FOUNDER_STEPS);

// ── Shorter founder menu ────────────────────────────────────────────
// Founders see these first; every other entry sits under "All tools",
// grouped as before. Labels, routes and locks are unchanged.
export const ESSENTIALS: readonly string[] = [
  "/console", "/console/journey", "/console/commander", "/console/autopilot", "/console/banker", "/console/intake", "/console/readiness", "/console/valuation",
  "/console/buyers", "/console/acquisition-radar", "/console/marketplace", "/console/inbox", "/console/wealth",
];

const NAV_KEY = "exitos.nav.v1";

export function loadAllToolsOpen(): boolean {
  try { return localStorage.getItem(NAV_KEY) === "open"; } catch { return false; }
}

export function saveAllToolsOpen(open: boolean): void {
  try { localStorage.setItem(NAV_KEY, open ? "open" : "closed"); } catch { /* storage unavailable: not remembered */ }
}
