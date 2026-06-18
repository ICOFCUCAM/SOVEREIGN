import React from "react";
import type { BuyerCandidate } from "@exit/engines";

// ── BANKER DIRECTIVE ENGINE ─────────────────────────────────────────
// A real intelligence layer for the Chief Investment Banker. Founder briefs
// ("prioritize strategic buyers", "avoid PE", "minimum valuation $100M",
// "hold outreach until Q4") are parsed into STRUCTURED mandate preferences and
// then deterministically re-weight buyer rankings, acquisition probability,
// outreach sequencing, recommended actions and the valuation guardrail.
//
// Nothing here is a placebo: a directive's effect on the system is exactly the
// structured `effects` it reports, applied by `applyToBuyers` /
// `valuationGuardrail` / `outreachPosture`. The parser sits behind a
// `DirectiveParser` interface so a Claude-API parser can replace the
// deterministic one later WITHOUT any UI change — see `setDirectiveParser`.

export interface MandatePreferences {
  /** Multiplier applied to a buyer's score by buyer type (1 = neutral). */
  buyerTypeWeights: Record<string, number>;
  /** Buyer types removed from the active set entirely. */
  excludedBuyerTypes: string[];
  /** Sector/thesis tokens to boost (e.g. "logistics", "consolidator"). */
  sectorFocusTokens: string[];
  /** Process valuation floor / ceiling in USD. */
  minValuationUsd: number | null;
  maxValuationUsd: number | null;
  /** When set, outreach is held; `label` is the founder's timeframe. */
  outreachHold: { label: string } | null;
}

/** One structured, displayable consequence of a directive — never vague. */
export interface DirectiveEffect { field: string; detail: string }

export interface ParsedDirective {
  preferences: Partial<MandatePreferences>;
  effects: DirectiveEffect[];
  understood: boolean;
}

export interface BankerDirective {
  id: string;
  raw: string;
  createdAt: string;       // ISO timestamp
  source: string;          // parser id — "deterministic" | "claude" | …
  effects: DirectiveEffect[];
  preferences: Partial<MandatePreferences>;
  understood: boolean;
}

/** The contract any parser (deterministic now, Claude later) must satisfy. */
export interface DirectiveParser {
  readonly id: string;
  parse(raw: string): ParsedDirective;
}

export const EMPTY_PREFERENCES: MandatePreferences = {
  buyerTypeWeights: {}, excludedBuyerTypes: [], sectorFocusTokens: [],
  minValuationUsd: null, maxValuationUsd: null, outreachHold: null,
};

// ── Deterministic parser ────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  strategic: "Strategic", pe: "Private equity", vc: "Venture", family_office: "Family office", sponsor: "Sponsor",
};
const TYPE_SYNONYMS: { type: string; words: string[] }[] = [
  { type: "strategic", words: ["strategic", "strategics", "trade buyer", "corporate acquirer", "consolidator"] },
  { type: "pe", words: ["private equity", "pe firm", "buyout", "financial buyer", "financial sponsor", "leveraged"] },
  { type: "vc", words: ["venture", "vc fund", "growth equity"] },
  { type: "family_office", words: ["family office", "family offices"] },
];
const POS = /\b(prioriti|priorit|favou?r|focus|target|prefer|emphasi|lean|go after|push|hunt)/i;
const NEG = /\b(avoid|exclude|no\b|not\b|skip|deprioriti|drop|ignore|without|stay away|steer clear|never)/i;
const EXCLUDE = /\b(exclude|no\b|never|drop|remove)\b/i;

const STOP = new Set(["the", "and", "for", "with", "buyers", "buyer", "acquirers", "acquirer", "firms", "firm", "only", "please", "prefer", "target", "focus", "prioritize", "prioritise", "on", "to", "of", "in", "a", "an", "that", "are", "who", "all", "any"]);

function parseUsd(text: string): number | null {
  const m = text.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*(b(?:n|illion)?|m(?:n|illion)?|k|thousand)?/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const u = (m[2] || "").toLowerCase();
  if (u.startsWith("b")) n *= 1e9; else if (u.startsWith("m")) n *= 1e6; else if (u.startsWith("k") || u === "thousand") n *= 1e3;
  return n;
}

const deterministicParser: DirectiveParser = {
  id: "deterministic",
  parse(raw: string): ParsedDirective {
    const text = raw.toLowerCase();
    const prefs: Partial<MandatePreferences> = {};
    const effects: DirectiveEffect[] = [];
    const weights: Record<string, number> = {};
    const excluded: string[] = [];

    // 1) Buyer-type intent — polarity per type mentioned.
    for (const { type, words } of TYPE_SYNONYMS) {
      if (!words.some((w) => text.includes(w))) continue;
      // If both signals exist, the one nearer the type word wins.
      const near = (re: RegExp): number => {
        const wi = Math.min(...words.map((w) => { const i = text.indexOf(w); return i < 0 ? 1e9 : i; }));
        const mm = text.match(re); if (!mm || mm.index == null) return 1e9;
        return Math.abs(mm.index - wi);
      };
      const isNeg = NEG.test(text) && (!POS.test(text) || near(NEG) <= near(POS));
      if (isNeg) {
        if (EXCLUDE.test(text)) { excluded.push(type); effects.push({ field: "Buyer universe", detail: `${TYPE_LABEL[type]} buyers excluded from the active set` }); }
        else { weights[type] = 0.25; effects.push({ field: "Buyer ranking", detail: `${TYPE_LABEL[type]} buyers down-weighted to 25%` }); }
      } else {
        weights[type] = 1.5; effects.push({ field: "Buyer ranking", detail: `${TYPE_LABEL[type]} buyers boosted +50%` });
      }
    }

    // 2) Valuation floor / ceiling.
    if (/\b(min(imum)?|floor|at least|no less than|above|over)\b/.test(text) && /[\d$]/.test(text)) {
      const v = parseUsd(text);
      if (v != null) { prefs.minValuationUsd = v; effects.push({ field: "Valuation guardrail", detail: `Process floor set at ${usdShort(v)} — buyers below are deprioritized` }); }
    }
    if (/\b(max(imum)?|cap|no more than|up to|below|under)\b/.test(text) && /[\d$]/.test(text)) {
      const v = parseUsd(text);
      if (v != null) { prefs.maxValuationUsd = v; effects.push({ field: "Valuation guardrail", detail: `Process ceiling noted at ${usdShort(v)}` }); }
    }

    // 3) Outreach sequencing hold.
    if (/(hold|delay|pause|wait|avoid|no|don't|do not).{0,24}(outreach|approach|contact|process|launch)/.test(text)
        || /(outreach|approach|contact).{0,12}(hold|delay|pause|wait)/.test(text)) {
      const tf = text.match(/\b(before|after|until|till|past)\s+([a-z0-9][a-z0-9\s/'-]{0,28}?)(?:[.,;]|$)/);
      const label = tf ? `${tf[1]} ${tf[2].trim()}` : "until further notice";
      prefs.outreachHold = { label };
      effects.push({ field: "Outreach sequencing", detail: `Outreach held ${label}` });
    }

    // 4) Sector / thesis focus — tokens after a focus verb, minus type words.
    const focusMatch = text.match(/\b(target|focus on|focus|prioriti[sz]e|prefer|in)\s+(.+)$/);
    if (focusMatch) {
      const typeWords = TYPE_SYNONYMS.flatMap((t) => t.words);
      const tokens = focusMatch[2]
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 3 && !STOP.has(w) && !typeWords.some((tw) => tw.includes(w)));
      // Only treat as a sector focus if there is a substantive noun left.
      if (tokens.length && !effects.some((e) => e.field === "Buyer ranking")) {
        prefs.sectorFocusTokens = tokens.slice(0, 4);
        effects.push({ field: "Sector focus", detail: `Boosting buyers active in: ${tokens.slice(0, 4).join(", ")}` });
      } else if (tokens.length) {
        prefs.sectorFocusTokens = tokens.slice(0, 4);
      }
    }

    if (Object.keys(weights).length) prefs.buyerTypeWeights = weights;
    if (excluded.length) prefs.excludedBuyerTypes = excluded;
    return { preferences: prefs, effects, understood: effects.length > 0 };
  },
};

// ── Parser registry (future-proofing) ───────────────────────────────
let activeParser: DirectiveParser = deterministicParser;
export const getDirectiveParser = (): DirectiveParser => activeParser;
/** Swap in a different parser (e.g. a Claude-API parser) without UI changes. */
export const setDirectiveParser = (p: DirectiveParser): void => { activeParser = p; };
export const parseDirective = (raw: string): ParsedDirective => activeParser.parse(raw);

// ── Preference folding ──────────────────────────────────────────────

export function mergePreferences(directives: BankerDirective[]): MandatePreferences {
  const out: MandatePreferences = { buyerTypeWeights: {}, excludedBuyerTypes: [], sectorFocusTokens: [], minValuationUsd: null, maxValuationUsd: null, outreachHold: null };
  for (const d of directives) {
    const p = d.preferences;
    if (p.buyerTypeWeights) for (const [k, v] of Object.entries(p.buyerTypeWeights)) out.buyerTypeWeights[k] = (out.buyerTypeWeights[k] ?? 1) * v;
    if (p.excludedBuyerTypes) for (const t of p.excludedBuyerTypes) if (!out.excludedBuyerTypes.includes(t)) out.excludedBuyerTypes.push(t);
    if (p.sectorFocusTokens) for (const t of p.sectorFocusTokens) if (!out.sectorFocusTokens.includes(t)) out.sectorFocusTokens.push(t);
    if (p.minValuationUsd != null) out.minValuationUsd = Math.max(out.minValuationUsd ?? 0, p.minValuationUsd);
    if (p.maxValuationUsd != null) out.maxValuationUsd = out.maxValuationUsd == null ? p.maxValuationUsd : Math.min(out.maxValuationUsd, p.maxValuationUsd);
    if (p.outreachHold) out.outreachHold = p.outreachHold;
  }
  return out;
}

// ── Application to real engine output ───────────────────────────────

export interface AdjustedBuyer {
  candidate: BuyerCandidate;
  baseProbability: number;
  adjustedProbability: number;
  multiplier: number;
  reasons: string[];
  excluded: boolean;
}

/** Re-weight discovered buyers by the mandate preferences. Transparent: the
 *  base probability is the engine's; the multiplier and reasons are the
 *  directive's contribution, shown alongside so nothing is hidden. */
export function applyToBuyers(candidates: readonly BuyerCandidate[], prefs: MandatePreferences): {
  included: AdjustedBuyer[]; excluded: AdjustedBuyer[];
} {
  const rows: AdjustedBuyer[] = candidates.map((c) => {
    const type = c.buyer.buyerType;
    let mult = 1; const reasons: string[] = [];
    let excluded = prefs.excludedBuyerTypes.includes(type);
    if (excluded) reasons.push(`${TYPE_LABEL[type] ?? type} excluded by directive`);

    const tw = prefs.buyerTypeWeights[type];
    if (tw != null && tw !== 1) { mult *= tw; reasons.push(tw > 1 ? `${TYPE_LABEL[type] ?? type} prioritized (×${tw.toFixed(2)})` : `${TYPE_LABEL[type] ?? type} down-weighted (×${tw.toFixed(2)})`); }

    if (prefs.sectorFocusTokens.length) {
      const hay = `${(c.buyer.sectorsActive ?? []).join(" ")} ${c.buyer.thesis ?? ""} ${c.buyer.name}`.toLowerCase();
      const hit = prefs.sectorFocusTokens.filter((t) => hay.includes(t));
      if (hit.length) { mult *= 1.4; reasons.push(`Sector-focus match: ${hit.join(", ")}`); }
    }

    if (prefs.minValuationUsd != null && c.estimatedCheck.high < prefs.minValuationUsd) {
      mult *= 0.3; reasons.push(`Below ${usdShort(prefs.minValuationUsd)} floor`);
    }

    const adjustedProbability = Math.max(0, Math.min(1, c.probability * mult));
    return { candidate: c, baseProbability: c.probability, adjustedProbability, multiplier: mult, reasons, excluded };
  });
  const included = rows.filter((r) => !r.excluded).sort((a, b) => b.adjustedProbability - a.adjustedProbability);
  const excluded = rows.filter((r) => r.excluded);
  return { included, excluded };
}

export interface OutreachPosture { held: boolean; label: string | null; note: string }
export function outreachPosture(prefs: MandatePreferences): OutreachPosture {
  if (prefs.outreachHold) return { held: true, label: prefs.outreachHold.label, note: `Outreach is held ${prefs.outreachHold.label} per banker directive.` };
  return { held: false, label: null, note: "Outreach is live — no hold directive in force." };
}

export interface ValuationGuardrail { floor: number | null; ceiling: number | null; note: string | null }
export function valuationGuardrail(prefs: MandatePreferences): ValuationGuardrail {
  const parts: string[] = [];
  if (prefs.minValuationUsd != null) parts.push(`floor ${usdShort(prefs.minValuationUsd)}`);
  if (prefs.maxValuationUsd != null) parts.push(`ceiling ${usdShort(prefs.maxValuationUsd)}`);
  return { floor: prefs.minValuationUsd, ceiling: prefs.maxValuationUsd, note: parts.length ? `Process band: ${parts.join(" · ")}.` : null };
}

/** Founder-facing recommended actions implied by the active directives. */
export function recommendedActions(prefs: MandatePreferences): string[] {
  const out: string[] = [];
  if (prefs.outreachHold) out.push(`Hold buyer outreach ${prefs.outreachHold.label}; continue diligence prep in the meantime.`);
  const boosted = Object.entries(prefs.buyerTypeWeights).filter(([, v]) => v > 1).map(([k]) => TYPE_LABEL[k] ?? k);
  if (boosted.length) out.push(`Lead the process with ${boosted.join(" and ")} acquirers — they are ranked first.`);
  if (prefs.excludedBuyerTypes.length) out.push(`${prefs.excludedBuyerTypes.map((t) => TYPE_LABEL[t] ?? t).join(", ")} removed from the target list per directive.`);
  if (prefs.minValuationUsd != null) out.push(`Anchor every conversation above the ${usdShort(prefs.minValuationUsd)} floor; deprioritize sub-floor bids.`);
  if (prefs.sectorFocusTokens.length) out.push(`Concentrate outreach on ${prefs.sectorFocusTokens.join(", ")} acquirers.`);
  return out;
}

function usdShort(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1)}B`;
  if (n >= 1e6) return `$${Math.round(n / 1e6)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

// ── Persistent mandate storage ──────────────────────────────────────
// Directives are stored permanently against the mandate (localStorage) and
// broadcast so every surface recomputes when they change.

const KEY = "exitos.mandate.directives.v1";
const EVT = "exitos:directives";

export function loadDirectives(): BankerDirective[] {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as BankerDirective[]; } catch { /* ignore */ }
  return [];
}
function persist(list: BankerDirective[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT));
}
export function addDirective(raw: string): BankerDirective | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = parseDirective(trimmed);
  const d: BankerDirective = {
    id: `dir_${Date.now().toString(36)}`, raw: trimmed, createdAt: new Date().toISOString(),
    source: getDirectiveParser().id, effects: parsed.effects, preferences: parsed.preferences, understood: parsed.understood,
  };
  persist([d, ...loadDirectives()]);
  return d;
}
export function removeDirective(id: string): void { persist(loadDirectives().filter((d) => d.id !== id)); }
export function clearDirectives(): void { persist([]); }

/** React hook: live directives + effective preferences, synced across surfaces. */
export function useDirectives(): {
  directives: BankerDirective[]; preferences: MandatePreferences;
  add: (raw: string) => BankerDirective | null; remove: (id: string) => void; clear: () => void;
} {
  const [directives, setDirectives] = React.useState<BankerDirective[]>(() => loadDirectives());
  React.useEffect(() => {
    const sync = (): void => setDirectives(loadDirectives());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const preferences = React.useMemo(() => mergePreferences(directives), [directives]);
  return {
    directives, preferences,
    add: (raw) => addDirective(raw), remove: (id) => removeDirective(id), clear: () => clearDirectives(),
  };
}
