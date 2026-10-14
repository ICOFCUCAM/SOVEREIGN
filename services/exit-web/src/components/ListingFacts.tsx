import React, { useState } from "react";
import { XO_INPUT, XO_LABEL } from "./xo";
import {
  STAGES, STAGE_LABEL, FOR_SALE, FOR_SALE_LABEL, MODELS, MODEL_LABEL, ASKING_MODES, ASKING_LABEL, REGIONS,
  SUMMARY_MIN, SUMMARY_MAX, REASON_MAX, missingFacts, splitList, askingText, type ListingFacts, type ProfileSection,
} from "../lib/listing-facts";
import { parseNumber } from "../lib/intake-fields";
import { CountrySelect } from "./CountrySelect";
import { findCountry, countryByCode } from "../lib/countries";

// ── LISTING FACTS · the buyer's card and the founder's form ─────────
// One set of questions, answered once by the founder and read by every buyer: what the business
// is, its stage, what is for sale, how it makes money, what it is built with, where it is based
// and sells, and the asking price. The same view renders catalog entries and founder listings.

const Fact: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-xo-faint">{k}</dt><dd className="mt-0.5 text-[12.5px] leading-snug text-xo-text">{children}</dd></div>
);

/** The key facts in one line, for a folded card: stage, asking price, model and base. */
export const ListingFactsStrip: React.FC<{ facts: ListingFacts; className?: string }> = ({ facts: f, className = "" }) => {
  const items: Array<[string, string]> = [
    ...(f.stage ? [["Stage", STAGE_LABEL[f.stage]] as [string, string]] : []),
    ["Asking", askingText(f)],
    ...(f.models[0] ? [["Model", MODEL_LABEL[f.models[0]] + (f.models.length > 1 ? ` +${f.models.length - 1}` : "")] as [string, string]] : []),
    ["Based in", f.basedIn || (f.region === "Other" ? "Global" : f.region)],
  ];
  return (
    <dl className={`flex flex-wrap gap-x-5 gap-y-1 text-[12px] ${className}`}>
      {items.map(([k, v]) => (
        <div key={k} className="flex items-baseline gap-1.5">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-xo-faint">{k}</dt>
          <dd className={k === "Asking" ? "font-mono font-semibold text-xo-text" : "text-xo-text"}>{v}</dd>
        </div>
      ))}
    </dl>
  );
};

/** The facts a buyer reads on a listing card. */
export const ListingFactsView: React.FC<{ facts: ListingFacts; className?: string; showSummary?: boolean }> = ({ facts: f, className = "", showSummary = true }) => (
  <div className={className}>
    {showSummary && <p className="max-w-[80ch] text-[13px] leading-relaxed text-xo-muted">{f.summary}</p>}
    <dl className={`${showSummary ? "mt-2.5 " : ""}grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 xl:grid-cols-4`}>
      {f.stage && <Fact k="Stage">{STAGE_LABEL[f.stage]}</Fact>}
      {f.forSale.length > 0 && <Fact k="For sale">{f.forSale.map((x) => FOR_SALE_LABEL[x]).join(" · ")}</Fact>}
      {f.models.length > 0 && <Fact k="Business model">{f.models.map((x) => MODEL_LABEL[x]).join(" · ")}</Fact>}
      {f.builtWith.length > 0 && <Fact k="Built with">{f.builtWith.join(" · ")}</Fact>}
      <Fact k="Based in">{f.basedIn || (f.region === "Other" ? "Global" : f.region)}</Fact>
      {f.markets.length > 0 && <Fact k="Markets">{f.markets.join(" · ")}</Fact>}
      <Fact k="Asking"><span className="font-mono font-semibold">{askingText(f)}</span></Fact>
      {f.reasonForSale && <Fact k="Reason for sale">{f.reasonForSale}</Fact>}
    </dl>
  </div>
);

// the form renders on the console's graphite field or on the listing desk's porcelain page
type Tone = "console" | "porcelain";
const TONES = {
  console: {
    input: XO_INPUT, label: XO_LABEL, faint: "text-xo-faint", warn: "text-xo-caution",
    chip: (on: boolean) => `rounded-sm border px-2 py-1 text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action ${on ? "border-xo-action bg-xo-action/10 text-xo-text" : "border-xo-line text-xo-muted hover:text-xo-text"}`,
    todo: "border-xo-caution/50 text-xo-muted", done: "border-xo-verified/50 text-xo-verified", todoHead: "text-xo-caution",
  },
  porcelain: {
    input: "w-full rounded-[11px] border border-[#E0D3BA] bg-white px-4 py-3.5 text-[14.5px] text-ex-graphite placeholder:text-[#A39C90] focus-visible:border-ex-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze/30",
    label: "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ex-slate-ink",
    faint: "text-[#8A8378]", warn: "text-ex-bronze-ink",
    chip: (on: boolean) => `rounded-full border px-3 py-1.5 text-[12.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze/40 ${on ? "border-ex-graphite bg-ex-graphite text-ex-ivory" : "border-[#D9D0C1] bg-white/60 text-ex-slate-ink hover:border-ex-bronze hover:text-ex-graphite"}`,
    todo: "border-[#D9D0C1] bg-white/50 text-ex-slate-ink", done: "border-ex-bronze/60 bg-ex-bronze/10 text-ex-bronze-ink", todoHead: "text-ex-bronze-ink",
  },
} as const;

type ToneSet = (typeof TONES)[Tone];

// small line icons for the porcelain cards, drawn in the desk's gold
export const ICON_PATHS = {
  shield: <><path d="M10 2 3.5 4.5v5C3.5 13.6 6.3 16.8 10 18c3.7-1.2 6.5-4.4 6.5-8.5v-5L10 2Z" /><path d="m7 10 2.1 2.1L13.2 8" /></>,
  chart: <><path d="M3 17h14" /><path d="M5 14V9m4 5V5m4 9v-6m4 6V3" /></>,
  seal: <><path d="M4 3h9l3 3v11H4V3Z" /><path d="M7 8h6M7 11h6M7 14h3" /></>,
  building: <><path d="M4 17V5l6-2v14M10 7h6v10" /><path d="M6.5 7.5h1m-1 3h1m-1 3h1m5-3h1m-1 3h1M2.5 17h15" /></>,
  market: <><path d="M3 8 4.5 3.5h11L17 8" /><path d="M3 8c0 1.4 1.1 2.2 2.3 2.2S7.7 9.4 7.7 8c0 1.4 1 2.2 2.3 2.2s2.3-.8 2.3-2.2c0 1.4 1.1 2.2 2.4 2.2S17 9.4 17 8" /><path d="M4.5 10.2V17h11v-6.8M8.5 17v-4h3v4" /></>,
  stack: <><path d="m10 3 7 3.5-7 3.5-7-3.5L10 3Z" /><path d="m3 10 7 3.5 7-3.5M3 13.5 10 17l7-3.5" /></>,
  note: <><path d="M4 3h12v11l-3 3H4V3Z" /><path d="M13 17v-3h3M7 7h6M7 10h4" /></>,
  flag: <><path d="M4.5 17.5V3" /><path d="M4.5 3.5h10l-2 3.5 2 3.5h-10" /></>,
  pin: <><path d="M10 17.5s5.5-5 5.5-9.5a5.5 5.5 0 0 0-11 0c0 4.5 5.5 9.5 5.5 9.5Z" /><circle cx="10" cy="8" r="2" /></>,
  steps: <><path d="M3 16h4v-4h4V8h4V4h2" /></>,
  tag: <><path d="M3 10.5V3.5h7l7 7-7 7-7-7Z" /><circle cx="7" cy="7" r="1.2" /></>,
  box: <><path d="M3 6.5 10 3l7 3.5v7L10 17l-7-3.5v-7Z" /><path d="M3 6.5 10 10l7-3.5M10 10v7" /></>,
  coins: <><ellipse cx="8" cy="6" rx="4.5" ry="2" /><path d="M3.5 6v3c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V6" /><path d="M7.5 12.8c.6 1 2.4 1.7 4.5 1.7 2.5 0 4.5-.9 4.5-2v-3c0-1-1.6-1.8-3.8-2" /></>,
  lock: <><rect x="4" y="9" width="12" height="8.5" rx="1.5" /><path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" /><path d="M10 12.5v2" /></>,
  globe: <><circle cx="10" cy="10" r="7" /><path d="M3 10h14M10 3c2 2.2 3 4.5 3 7s-1 4.8-3 7c-2-2.2-3-4.5-3-7s1-4.8 3-7Z" /></>,
} as const;
export const Icon: React.FC<{ name: keyof typeof ICON_PATHS; className?: string }> = ({ name, className = "" }) => (
  <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className={className}>{ICON_PATHS[name]}</svg>
);

const Group: React.FC<{ letter: string; title: string; note: string; icon: keyof typeof ICON_PATHS; porcelain: boolean; T: ToneSet; children: React.ReactNode }> = ({ letter, title, note, icon, porcelain, T, children }) => porcelain ? (
  <section aria-labelledby={`grp-${letter}`} className="rounded-[20px] border border-[#ECE2D0] bg-white p-6 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_30px_60px_-40px_rgba(90,65,25,0.45)] sm:p-8 lg:p-9">
    <header className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#E6D3AD] bg-[radial-gradient(circle_at_30%_25%,#FFFDF8,#F7EEDB)] text-[#A8834A]"><Icon name={icon} /></span>
      <div className="min-w-0">
        <h3 id={`grp-${letter}`} className="font-display text-[28px] font-medium leading-tight text-ex-graphite">{title}</h3>
        <p className="mt-1 max-w-[62ch] text-[13.5px] leading-relaxed text-[#6E685E]">{note}</p>
      </div>
    </header>
    <div className="mt-7 min-w-0 space-y-7">{children}</div>
  </section>
) : (
  <section aria-labelledby={`grp-${letter}`} className="space-y-4 border-t border-xo-line pt-4">
    <header>
      <div aria-hidden className="text-[11px] text-xo-faint">{letter}</div>
      <h3 id={`grp-${letter}`} className="text-[13px] font-semibold">{title}</h3>
      <p className={`mt-1.5 text-[12.5px] leading-relaxed ${T.faint}`}>{note}</p>
    </header>
    <div className="min-w-0 space-y-6">{children}</div>
  </section>
);
const Fixed: React.FC<{ k: string; v: string; hint?: string; porcelain: boolean; T: ToneSet; icon?: keyof typeof ICON_PATHS }> = ({ k, v, hint, porcelain, T, icon }) => (
  <div>
    <div className={T.label}>{k}</div>
    {porcelain ? (
      <div className="flex items-center gap-3 rounded-[11px] border border-[#EAE0CE] bg-[#FBF8F2] px-4 py-3.5 text-[14.5px] text-ex-graphite">
        {icon && <Icon name={icon} className="shrink-0 text-[#A8834A]" />}<span className="min-w-0 flex-1 truncate">{v}</span>
        <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#A39C90]">Fixed</span>
      </div>
    ) : <div className="font-mono text-[13px]">{v}</div>}
    {hint && <span className={`mt-1 block text-[11px] ${T.faint}`}>{hint}</span>}
  </div>
);

// pills: gold-tinted for single choices, dark bronze for the transaction checklists
const goldPill = (on: boolean): string => `rounded-full border px-4 py-2 text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A262]/50 ${on
  ? "border-[#C9A262] bg-[linear-gradient(180deg,#FDF6E7,#F6E8C9)] font-semibold text-[#5A4318] shadow-[0_6px_16px_-10px_rgba(160,115,40,0.7)]"
  : "border-[#E4DACA] bg-white text-[#4F4A42] hover:border-[#C9A262] hover:text-ex-graphite"}`;
const darkPill = (on: boolean): string => `rounded-full border px-4 py-2 text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A262]/50 ${on
  ? "border-[#2B1F0E] bg-[linear-gradient(180deg,#5A4220,#2E2210)] text-[#F7ECD4] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_18px_-10px_rgba(60,40,10,0.9)]"
  : "border-[#E4DACA] bg-white text-[#3F3A33] shadow-[0_2px_6px_-4px_rgba(60,45,20,0.3)] hover:border-[#C9A262]"}`;
const Letter: React.FC<{ children: string }> = ({ children }) => (
  <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-[7px] bg-[#FBF1DC] font-display text-[22px] font-semibold leading-none text-[#B48737]">{children}</span>
);
const Chevron: React.FC = () => (
  <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ex-slate-ink"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
);
const CARD_INPUT = "mt-1 w-full rounded-[8px] border border-transparent bg-transparent px-0 py-1 text-[15px] text-ex-graphite placeholder:text-[#A39C90] hover:border-b-[#E4DACA] focus:border-b-[#C9A262] focus:outline-none";
const AnswerCard: React.FC<{ id: string; icon: keyof typeof ICON_PATHS; label: string; hint: string; optional?: boolean; children: React.ReactNode }> = ({ id, icon, label, hint, optional, children }) => (
  <div className="flex items-start gap-4 rounded-[16px] border border-[#EFE6D6] bg-white/85 px-5 py-5 shadow-[0_20px_40px_-34px_rgba(90,65,25,0.45)]">
    <Icon name={icon} className="mt-0.5 h-8 w-8 shrink-0 text-[#2B2620]" />
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="block text-[15px] font-semibold text-ex-graphite">{label}{optional && <span className="ml-1.5 text-[12px] font-normal text-[#8A8378]">optional</span>}</label>
      {children}
      <span id={`${id}-hint`} className="mt-1 block text-[11.5px] text-[#8A8378]">{hint}</span>
    </div>
  </div>
);

/** Figures that come from the founder's saved intake (read-only here; edited on Value my company). */
export interface IntakeContext { readonly sector: string; readonly revenue: string; readonly growth: string; readonly unconfirmed?: boolean }

/** The founder's form, in three groups. Edits a draft; the parent decides when the listing is (re)published. */
export const ListingFactsForm: React.FC<{ value: Partial<ListingFacts>; onChange: (v: Partial<ListingFacts>) => void; tone?: Tone; context?: IntakeContext; showStatus?: boolean; section?: ProfileSection }> = ({ value: v, onChange, tone = "console", context, showStatus = true, section = "overview" }) => {
  const T = TONES[tone];
  const set = <K extends keyof ListingFacts>(k: K, x: ListingFacts[K] | undefined): void => onChange({ ...v, [k]: x });
  const toggle = <T extends string>(list: readonly T[] | undefined, x: T): T[] => (list ?? []).includes(x) ? (list ?? []).filter((y) => y !== x) : [...(list ?? []), x];
  // list fields keep exactly what was typed; the parsed list is stored
  const [texts, setTexts] = useState({ builtWith: (v.builtWith ?? []).join(", "), markets: (v.markets ?? []).join(", ") });
  const [ask, setAsk] = useState({ low: v.askingLowUsd ? String(v.askingLowUsd / 1e6) : "", high: v.askingHighUsd ? String(v.askingHighUsd / 1e6) : "" });
  const typeAsk = (w: "low" | "high", t: string): void => {
    setAsk((a) => ({ ...a, [w]: t }));
    const r = parseNumber(t, { min: 0.01, max: 1_000_000, scale: 1e6 });
    set(w === "low" ? "askingLowUsd" : "askingHighUsd", r.ok ? r.value : undefined);
  };
  const summaryLen = (v.summary ?? "").trim().length;
  const missing = missingFacts(v);
  const askLow = parseNumber(ask.low, { min: 0.01, max: 1_000_000, scale: 1e6 });
  const askHigh = parseNumber(ask.high, { min: 0.01, max: 1_000_000, scale: 1e6 });
  const porcelain = tone === "porcelain";

  const fromIntake = context?.unconfirmed ? "Still holding example values — confirm them on Value my company." : "From your saved figures on Value my company.";

  // the listing desk shows one page of the profile at a time, each set as its own sheet
  if (porcelain) {
    const regionSelect = (
      <div>
        <label htmlFor="lf-region" className={T.label}>Region</label>
        <div className="relative">
          <Icon name="globe" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A8834A]" />
          <select id="lf-region" className={`${T.input} appearance-none pl-12 pr-10`} value={v.region ?? ""} onChange={(e) => set("region", (e.target.value || undefined) as ListingFacts["region"] | undefined)} aria-describedby="lf-region-hint">
            <option value="">Choose a region</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r === "Other" ? "Global / other" : r}</option>)}
          </select>
          <Chevron />
        </div>
        <span id="lf-region-hint" className={`mt-1.5 block text-[11.5px] ${T.faint}`}>Where the business is based, as buyers filter by it.</span>
      </div>
    );

    if (section === "overview") return (
      <Group letter="A" icon="shield" porcelain T={T} title="Business overview" note="What a buyer reads first — the sector, region, what the business does, and how far along it is.">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div className="flex flex-col">
            <label htmlFor="lf-summary" className={T.label}>What the business does</label>
            <div className="relative flex-1">
              <textarea id="lf-summary" className={`${T.input} h-full min-h-[214px] resize-y pb-8 leading-relaxed`} maxLength={SUMMARY_MAX} value={v.summary ?? ""} onChange={(e) => set("summary", e.target.value)} aria-describedby="lf-summary-hint"
                placeholder="Describe your business — the problem it solves, who uses it, what makes it different, and what a buyer takes over. Leave out the company name: buyers learn it after the NDA." />
              <span aria-hidden className="pointer-events-none absolute bottom-3 right-4 font-mono text-[11px] text-[#A39C90]">{summaryLen}/{SUMMARY_MAX}</span>
            </div>
            <span id="lf-summary-hint" className={`mt-1.5 block text-[11.5px] ${summaryLen && summaryLen < SUMMARY_MIN ? T.warn : T.faint}`}>{summaryLen} of {SUMMARY_MAX} characters · at least {SUMMARY_MIN}</span>
          </div>
          <div className="space-y-6">
            {context && <Fixed porcelain T={T} icon="building" k="Sector" v={context.sector} hint="From your saved figures on Value my company." />}
            {regionSelect}
          </div>
        </div>
        <fieldset>
          <legend className={T.label}>Company stage</legend>
          <div className="flex flex-wrap gap-2.5">{STAGES.map((s) => <button key={s} type="button" aria-pressed={v.stage === s} onClick={() => set("stage", s)} className={goldPill(v.stage === s)}>{STAGE_LABEL[s]}</button>)}</div>
        </fieldset>
      </Group>
    );

    if (section === "financial") return (
      <Group letter="B" icon="chart" porcelain T={T} title="Performance and asking price" note="Revenue and growth are shown to buyers as ranges, never exact figures. The asking price is yours to state.">
        {context && <div className="grid gap-6 sm:grid-cols-2">
          <Fixed porcelain T={T} icon="chart" k="TTM revenue" v={context.unconfirmed ? "Not confirmed" : context.revenue} hint={fromIntake} />
          <Fixed porcelain T={T} icon="chart" k="Growth" v={context.unconfirmed ? "Not confirmed" : context.growth} hint={fromIntake} />
        </div>}
        <fieldset>
          <legend className={T.label}>Asking price structure</legend>
          <div className="flex flex-wrap gap-2.5">{ASKING_MODES.map((s) => <button key={s} type="button" aria-pressed={v.askingMode === s} onClick={() => set("askingMode", s)} className={goldPill(v.askingMode === s)}>{ASKING_LABEL[s]}</button>)}</div>
          {(v.askingMode === "price" || v.askingMode === "range") && (
            <div className="mt-5 grid max-w-md grid-cols-2 gap-4">
              <div>
                <label htmlFor="lf-ask-low" className={T.label}>{v.askingMode === "range" ? "From ($M)" : "Price ($M)"}</label>
                <input id="lf-ask-low" inputMode="decimal" className={`${T.input} font-mono`} value={ask.low} onChange={(e) => typeAsk("low", e.target.value)} aria-invalid={ask.low !== "" && !askLow.ok} aria-describedby="lf-ask-low-msg" />
                {ask.low !== "" && !askLow.ok && <span id="lf-ask-low-msg" className={`mt-1 block text-[11px] ${T.warn}`}>{askLow.error}</span>}
              </div>
              {v.askingMode === "range" && (
                <div>
                  <label htmlFor="lf-ask-high" className={T.label}>To ($M)</label>
                  <input id="lf-ask-high" inputMode="decimal" className={`${T.input} font-mono`} value={ask.high} onChange={(e) => typeAsk("high", e.target.value)} aria-invalid={ask.high !== "" && !askHigh.ok} aria-describedby="lf-ask-high-msg" />
                  {ask.high !== "" && !askHigh.ok && <span id="lf-ask-high-msg" className={`mt-1 block text-[11px] ${T.warn}`}>{askHigh.error}</span>}
                </div>
              )}
            </div>
          )}
        </fieldset>
      </Group>
    );

    // transaction: two questions answered with pills, then the four short answers as cards
    return (
      <div className="space-y-5">
        <fieldset className="px-1">
          <legend className="flex items-center gap-3"><Letter>A</Letter><span className="text-[16.5px] font-semibold text-ex-graphite">What is for sale?</span></legend>
          <p className={`ml-11 mt-0.5 text-[12px] ${T.faint}`}>Choose all that apply.</p>
          <div className="ml-11 mt-4 flex flex-wrap gap-2.5">{FOR_SALE.map((s) => { const on = (v.forSale ?? []).includes(s); return <button key={s} type="button" aria-pressed={on} onClick={() => set("forSale", toggle(v.forSale, s))} className={darkPill(on)}>{FOR_SALE_LABEL[s]}</button>; })}</div>
        </fieldset>
        <fieldset className="rounded-[18px] border border-[#EFE6D6] bg-white/75 px-5 py-6 shadow-[0_24px_48px_-36px_rgba(90,65,25,0.45)] sm:px-6">
          <legend className="sr-only">How the business makes money?</legend>
          <div aria-hidden className="flex items-center gap-3"><Letter>B</Letter><span className="text-[16.5px] font-semibold text-ex-graphite">How the business makes money?</span></div>
          <p className={`ml-11 mt-0.5 text-[12px] ${T.faint}`}>Choose all that apply.</p>
          <div className="ml-11 mt-4 flex flex-wrap gap-2.5">{MODELS.map((s) => { const on = (v.models ?? []).includes(s); return <button key={s} type="button" aria-pressed={on} onClick={() => set("models", toggle(v.models, s))} className={darkPill(on)}>{MODEL_LABEL[s]}</button>; })}</div>
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <AnswerCard id="lf-markets" icon="market" label="Markets served" hint="Countries or customer groups, separated with commas.">
            <input id="lf-markets" className={CARD_INPUT} value={texts.markets} placeholder="United States, Canada, Retail" aria-describedby="lf-markets-hint"
              onChange={(e) => { setTexts((t) => ({ ...t, markets: e.target.value })); set("markets", splitList(e.target.value)); }} />
          </AnswerCard>
          <AnswerCard id="lf-built" icon="stack" label="Technology stack" hint="Separate with commas.">
            <input id="lf-built" className={CARD_INPUT} value={texts.builtWith} placeholder="React, Python, PostgreSQL" aria-describedby="lf-built-hint"
              onChange={(e) => { setTexts((t) => ({ ...t, builtWith: e.target.value })); set("builtWith", splitList(e.target.value)); }} />
          </AnswerCard>
          <div className="flex items-start gap-4 rounded-[16px] border border-[#EFE6D6] bg-white/85 px-5 py-5 shadow-[0_20px_40px_-34px_rgba(90,65,25,0.45)]">
            <Icon name="flag" className="mt-0.5 h-8 w-8 shrink-0 text-[#2B2620]" />
            <div className="min-w-0 flex-1">
              {/* stored as the country's English name, as listings always have */}
              <CountrySelect id="lf-based" label="Country of operation" labelClassName="mb-2 block text-[15px] font-semibold text-ex-graphite" value={findCountry(v.basedIn)?.code}
                onChange={(code) => set("basedIn", countryByCode(code)?.name ?? code)} hint="Where the company operates or is incorporated. Shown to buyers." />
            </div>
          </div>
          <AnswerCard id="lf-reason" icon="note" label="Reason for sale" optional hint="A sentence buyers will read; leave it empty if you prefer.">
            <input id="lf-reason" className={CARD_INPUT} maxLength={REASON_MAX} value={v.reasonForSale ?? ""} onChange={(e) => set("reasonForSale", e.target.value)} placeholder="e.g. focusing on another venture" aria-describedby="lf-reason-hint" />
          </AnswerCard>
        </div>
      </div>
    );
  }

  return (
    <div className={porcelain ? "space-y-10" : "space-y-4"}>
      <Group letter="A" icon="shield" porcelain={porcelain} T={T} title="Business overview" note="What a buyer reads first: the sector and region, what the business does, and how far along it is.">
        {context && <div className="grid gap-6 sm:grid-cols-2"><Fixed porcelain={porcelain} T={T} k="Sector" v={context.sector} hint="From your saved figures on Value my company." />
          <div>
            <label htmlFor="lf-region" className={T.label}>Region</label>
            <select id="lf-region" className={T.input} value={v.region ?? ""} onChange={(e) => set("region", (e.target.value || undefined) as ListingFacts["region"] | undefined)} aria-describedby="lf-region-hint">
              <option value="">Choose…</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r === "Other" ? "Global / other" : r}</option>)}
            </select>
            <span id="lf-region-hint" className={`mt-1 block text-[11px] ${T.faint}`}>Where the business is based, as buyers filter by it.</span>
          </div></div>}
        <div>
          <label htmlFor="lf-summary" className={T.label}>What the business does</label>
          <textarea id="lf-summary" className={`${T.input} min-h-[120px] resize-y leading-relaxed`} maxLength={SUMMARY_MAX} value={v.summary ?? ""} onChange={(e) => set("summary", e.target.value)} aria-describedby="lf-summary-hint"
            placeholder="The problem it solves, who uses it, what makes it different, and what a buyer takes over. Leave out the company name: buyers learn it after the NDA." />
          <span id="lf-summary-hint" className={`mt-1 block text-[11px] ${summaryLen && summaryLen < SUMMARY_MIN ? T.warn : T.faint}`}>{summaryLen}/{SUMMARY_MAX} · at least {SUMMARY_MIN} characters</span>
        </div>
        <fieldset>
          <legend className={T.label}>Company stage</legend>
          <div className="flex flex-wrap gap-2">{STAGES.map((s) => <button key={s} type="button" aria-pressed={v.stage === s} onClick={() => set("stage", s)} className={T.chip(v.stage === s)}>{STAGE_LABEL[s]}</button>)}</div>
        </fieldset>
      </Group>

      <Group letter="B" icon="chart" porcelain={porcelain} T={T} title="Financial profile" note="Revenue and growth are shown to buyers as ranges, never exact figures. The asking price is yours to state.">
        {context && <div className="grid gap-6 sm:grid-cols-2">
          <Fixed porcelain={porcelain} T={T} k="TTM revenue" v={context.unconfirmed ? "Not confirmed" : context.revenue} hint={fromIntake} />
          <Fixed porcelain={porcelain} T={T} k="Growth" v={context.unconfirmed ? "Not confirmed" : context.growth} hint={fromIntake} />
        </div>}
        <fieldset>
          <legend className={T.label}>Asking price structure</legend>
          <div className="flex flex-wrap gap-2">{ASKING_MODES.map((s) => <button key={s} type="button" aria-pressed={v.askingMode === s} onClick={() => set("askingMode", s)} className={T.chip(v.askingMode === s)}>{ASKING_LABEL[s]}</button>)}</div>
          {(v.askingMode === "price" || v.askingMode === "range") && (
            <div className="mt-4 grid max-w-md grid-cols-2 gap-4">
              <div>
                <label htmlFor="lf-ask-low" className={T.label}>{v.askingMode === "range" ? "From ($M)" : "Price ($M)"}</label>
                <input id="lf-ask-low" inputMode="decimal" className={`${T.input} font-mono`} value={ask.low} onChange={(e) => typeAsk("low", e.target.value)} aria-invalid={ask.low !== "" && !askLow.ok} aria-describedby="lf-ask-low-msg" />
                {ask.low !== "" && !askLow.ok && <span id="lf-ask-low-msg" className={`mt-1 block text-[11px] ${T.warn}`}>{askLow.error}</span>}
              </div>
              {v.askingMode === "range" && (
                <div>
                  <label htmlFor="lf-ask-high" className={T.label}>To ($M)</label>
                  <input id="lf-ask-high" inputMode="decimal" className={`${T.input} font-mono`} value={ask.high} onChange={(e) => typeAsk("high", e.target.value)} aria-invalid={ask.high !== "" && !askHigh.ok} aria-describedby="lf-ask-high-msg" />
                  {ask.high !== "" && !askHigh.ok && <span id="lf-ask-high-msg" className={`mt-1 block text-[11px] ${T.warn}`}>{askHigh.error}</span>}
                </div>
              )}
            </div>
          )}
        </fieldset>
      </Group>

      <Group letter="C" icon="seal" porcelain={porcelain} T={T} title="Transaction profile" note="What transfers to the buyer, how the business earns, where it sells and what it is built on.">
        <fieldset>
          <legend className={T.label}>What is for sale <span className={`font-normal normal-case tracking-normal ${T.faint}`}>· choose all that apply</span></legend>
          <div className="flex flex-wrap gap-2">{FOR_SALE.map((s) => { const on = (v.forSale ?? []).includes(s); return <button key={s} type="button" aria-pressed={on} onClick={() => set("forSale", toggle(v.forSale, s))} className={T.chip(on)}>{FOR_SALE_LABEL[s]}</button>; })}</div>
        </fieldset>
        <fieldset>
          <legend className={T.label}>How the business makes money <span className={`font-normal normal-case tracking-normal ${T.faint}`}>· choose all that apply</span></legend>
          <div className="flex flex-wrap gap-2">{MODELS.map((s) => { const on = (v.models ?? []).includes(s); return <button key={s} type="button" aria-pressed={on} onClick={() => set("models", toggle(v.models, s))} className={T.chip(on)}>{MODEL_LABEL[s]}</button>; })}</div>
        </fieldset>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="lf-markets" className={T.label}>Markets served</label>
            <input id="lf-markets" className={T.input} value={texts.markets} placeholder="Norway, Sweden, SMBs…" aria-describedby="lf-markets-hint"
              onChange={(e) => { setTexts((t) => ({ ...t, markets: e.target.value })); set("markets", splitList(e.target.value)); }} />
            <span id="lf-markets-hint" className={`mt-1 block text-[11px] ${T.faint}`}>Countries or customer groups, separated with commas.</span>
          </div>
          <div>
            <label htmlFor="lf-built" className={T.label}>Technology stack</label>
            <input id="lf-built" className={T.input} value={texts.builtWith} placeholder="React, Node.js, PostgreSQL…" aria-describedby="lf-built-hint"
              onChange={(e) => { setTexts((t) => ({ ...t, builtWith: e.target.value })); set("builtWith", splitList(e.target.value)); }} />
            <span id="lf-built-hint" className={`mt-1 block text-[11px] ${T.faint}`}>Separate with commas.</span>
          </div>
          {porcelain ? (
            // stored as the country's English name, as listings always have
            <CountrySelect id="lf-based" label="Country of operation" value={findCountry(v.basedIn)?.code}
              onChange={(code) => set("basedIn", countryByCode(code)?.name ?? code)} hint="Where the company operates or is incorporated. Shown to buyers." />
          ) : (
            <div>
              <label htmlFor="lf-based" className={T.label}>Country of operation</label>
              <input id="lf-based" className={T.input} maxLength={60} value={v.basedIn ?? ""} onChange={(e) => set("basedIn", e.target.value)} placeholder="Norway" />
            </div>
          )}
          {!context && (
            <div>
              <label htmlFor="lf-region" className={T.label}>Region</label>
              <select id="lf-region" className={T.input} value={v.region ?? ""} onChange={(e) => set("region", (e.target.value || undefined) as ListingFacts["region"] | undefined)}>
                <option value="">Choose…</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r === "Other" ? "Global / other" : r}</option>)}
              </select>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="lf-reason" className={T.label}>Reason for sale <span className={`font-normal normal-case tracking-normal ${T.faint}`}>· optional</span></label>
          <input id="lf-reason" className={T.input} maxLength={REASON_MAX} value={v.reasonForSale ?? ""} onChange={(e) => set("reasonForSale", e.target.value)} placeholder="e.g. focusing on another venture" />
        </div>
      </Group>

      {showStatus && (
        <p role="status" className={`border px-3 py-2 text-[12px] ${missing.length ? T.todo : T.done}`}>
          {missing.length ? <><span className={`font-semibold ${T.todoHead}`}>Still needed to list:</span> {missing.join(" · ")}.</> : "Complete: buyers will see every fact they need."}
        </p>
      )}
    </div>
  );
};
