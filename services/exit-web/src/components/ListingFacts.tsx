import React, { useState } from "react";
import { XO_INPUT, XO_LABEL } from "./xo";
import {
  STAGES, STAGE_LABEL, FOR_SALE, FOR_SALE_LABEL, MODELS, MODEL_LABEL, ASKING_MODES, ASKING_LABEL, REGIONS,
  SUMMARY_MIN, SUMMARY_MAX, REASON_MAX, missingFacts, splitList, askingText, type ListingFacts,
} from "../lib/listing-facts";
import { parseNumber } from "../lib/intake-fields";

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
    input: "w-full rounded-ex-xs border border-[#D9D0C1] bg-white/70 px-3 py-2.5 text-[14px] text-ex-graphite placeholder:text-[#A39C90] focus-visible:border-ex-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze/30",
    label: "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ex-slate-ink",
    faint: "text-[#8A8378]", warn: "text-ex-bronze-ink",
    chip: (on: boolean) => `rounded-full border px-3 py-1.5 text-[12.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze/40 ${on ? "border-ex-graphite bg-ex-graphite text-ex-ivory" : "border-[#D9D0C1] bg-white/60 text-ex-slate-ink hover:border-ex-bronze hover:text-ex-graphite"}`,
    todo: "border-[#D9D0C1] bg-white/50 text-ex-slate-ink", done: "border-ex-bronze/60 bg-ex-bronze/10 text-ex-bronze-ink", todoHead: "text-ex-bronze-ink",
  },
} as const;

type ToneSet = (typeof TONES)[Tone];
const Group: React.FC<{ letter: string; title: string; note: string; porcelain: boolean; T: ToneSet; children: React.ReactNode }> = ({ letter, title, note, porcelain, T, children }) => (
  <section aria-labelledby={`grp-${letter}`} className={porcelain ? "grid gap-6 border-t border-[#D9D0C1] pt-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10" : "space-y-4 border-t border-xo-line pt-4"}>
    <header>
      <div aria-hidden className={porcelain ? "font-editorial text-[15px] italic text-ex-bronze-ink" : "text-[11px] text-xo-faint"}>{letter}</div>
      <h3 id={`grp-${letter}`} className={porcelain ? "mt-1 font-editorial text-[22px] leading-tight text-ex-graphite" : "text-[13px] font-semibold"}>{title}</h3>
      <p className={`mt-1.5 text-[12.5px] leading-relaxed ${T.faint}`}>{note}</p>
    </header>
    <div className="min-w-0 space-y-6">{children}</div>
  </section>
);
const Fixed: React.FC<{ k: string; v: string; hint?: string; porcelain: boolean; T: ToneSet }> = ({ k, v, hint, porcelain, T }) => (
  <div>
    <div className={T.label}>{k}</div>
    <div className={porcelain ? "border-b border-[#D9D0C1] pb-2 font-editorial text-[18px] text-ex-graphite" : "font-mono text-[13px]"}>{v}</div>
    {hint && <span className={`mt-1 block text-[11px] ${T.faint}`}>{hint}</span>}
  </div>
);

/** Figures that come from the founder's saved intake (read-only here; edited on Value my company). */
export interface IntakeContext { readonly sector: string; readonly revenue: string; readonly growth: string; readonly unconfirmed?: boolean }

/** The founder's form, in three groups. Edits a draft; the parent decides when the listing is (re)published. */
export const ListingFactsForm: React.FC<{ value: Partial<ListingFacts>; onChange: (v: Partial<ListingFacts>) => void; tone?: Tone; context?: IntakeContext; showStatus?: boolean }> = ({ value: v, onChange, tone = "console", context, showStatus = true }) => {
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

  return (
    <div className={porcelain ? "space-y-10" : "space-y-4"}>
      <Group letter="A" porcelain={porcelain} T={T} title="Business overview" note="What a buyer reads first: the sector and region, what the business does, and how far along it is.">
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

      <Group letter="B" porcelain={porcelain} T={T} title="Financial profile" note="Revenue and growth are shown to buyers as ranges, never exact figures. The asking price is yours to state.">
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

      <Group letter="C" porcelain={porcelain} T={T} title="Transaction profile" note="What transfers to the buyer, how the business earns, where it sells and what it is built on.">
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
          <div>
            <label htmlFor="lf-based" className={T.label}>Country of operation</label>
            <input id="lf-based" className={T.input} maxLength={60} value={v.basedIn ?? ""} onChange={(e) => set("basedIn", e.target.value)} placeholder="Norway" />
          </div>
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
