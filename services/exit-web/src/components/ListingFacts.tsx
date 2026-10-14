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

/** The facts a buyer reads on a listing card. */
export const ListingFactsView: React.FC<{ facts: ListingFacts; className?: string }> = ({ facts: f, className = "" }) => (
  <div className={className}>
    <p className="max-w-[80ch] text-[13px] leading-relaxed text-xo-muted">{f.summary}</p>
    <dl className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 xl:grid-cols-4">
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

const chip = (on: boolean): string =>
  `rounded-sm border px-2 py-1 text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action ${on ? "border-xo-action bg-xo-action/10 text-xo-text" : "border-xo-line text-xo-muted hover:text-xo-text"}`;

/** The founder's form. Edits a draft; the parent decides when the listing is (re)published. */
export const ListingFactsForm: React.FC<{ value: Partial<ListingFacts>; onChange: (v: Partial<ListingFacts>) => void }> = ({ value: v, onChange }) => {
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

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="lf-summary" className={XO_LABEL}>What the business does</label>
        <textarea id="lf-summary" className={`${XO_INPUT} min-h-[96px] resize-y`} maxLength={SUMMARY_MAX} value={v.summary ?? ""} onChange={(e) => set("summary", e.target.value)}
          placeholder="The problem it solves, who uses it, what makes it different, and what a buyer takes over. Leave out the company name: buyers learn it after the NDA." />
        <span className={`mt-1 block text-[11px] ${summaryLen && summaryLen < SUMMARY_MIN ? "text-xo-caution" : "text-xo-faint"}`}>{summaryLen}/{SUMMARY_MAX} · at least {SUMMARY_MIN} characters</span>
      </div>

      <fieldset>
        <legend className={XO_LABEL}>Stage</legend>
        <div className="flex flex-wrap gap-1.5">{STAGES.map((s) => <button key={s} type="button" aria-pressed={v.stage === s} onClick={() => set("stage", s)} className={chip(v.stage === s)}>{STAGE_LABEL[s]}</button>)}</div>
      </fieldset>

      <fieldset>
        <legend className={XO_LABEL}>What is for sale <span className="font-normal text-xo-faint">· choose all that apply</span></legend>
        <div className="flex flex-wrap gap-1.5">{FOR_SALE.map((s) => { const on = (v.forSale ?? []).includes(s); return <button key={s} type="button" aria-pressed={on} onClick={() => set("forSale", toggle(v.forSale, s))} className={chip(on)}>{FOR_SALE_LABEL[s]}</button>; })}</div>
      </fieldset>

      <fieldset>
        <legend className={XO_LABEL}>How it makes money <span className="font-normal text-xo-faint">· choose all that apply</span></legend>
        <div className="flex flex-wrap gap-1.5">{MODELS.map((s) => { const on = (v.models ?? []).includes(s); return <button key={s} type="button" aria-pressed={on} onClick={() => set("models", toggle(v.models, s))} className={chip(on)}>{MODEL_LABEL[s]}</button>; })}</div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="lf-built" className={XO_LABEL}>Built with</label>
          <input id="lf-built" className={XO_INPUT} value={texts.builtWith} placeholder="React, Node.js, PostgreSQL…"
            onChange={(e) => { setTexts((t) => ({ ...t, builtWith: e.target.value })); set("builtWith", splitList(e.target.value)); }} />
          <span className="mt-1 block text-[11px] text-xo-faint">Separate with commas.</span>
        </div>
        <div>
          <label htmlFor="lf-markets" className={XO_LABEL}>Markets it serves</label>
          <input id="lf-markets" className={XO_INPUT} value={texts.markets} placeholder="Norway, Sweden, SMBs…"
            onChange={(e) => { setTexts((t) => ({ ...t, markets: e.target.value })); set("markets", splitList(e.target.value)); }} />
          <span className="mt-1 block text-[11px] text-xo-faint">Countries or customer groups, separated with commas.</span>
        </div>
        <div>
          <label htmlFor="lf-based" className={XO_LABEL}>Based in (country)</label>
          <input id="lf-based" className={XO_INPUT} maxLength={60} value={v.basedIn ?? ""} onChange={(e) => set("basedIn", e.target.value)} placeholder="Norway" />
        </div>
        <div>
          <label htmlFor="lf-region" className={XO_LABEL}>Region</label>
          <select id="lf-region" className={XO_INPUT} value={v.region ?? ""} onChange={(e) => set("region", (e.target.value || undefined) as ListingFacts["region"] | undefined)}>
            <option value="">Choose…</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r === "Other" ? "Global / other" : r}</option>)}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={XO_LABEL}>Asking price</legend>
        <div className="flex flex-wrap gap-1.5">{ASKING_MODES.map((s) => <button key={s} type="button" aria-pressed={v.askingMode === s} onClick={() => set("askingMode", s)} className={chip(v.askingMode === s)}>{ASKING_LABEL[s]}</button>)}</div>
        {(v.askingMode === "price" || v.askingMode === "range") && (
          <div className="mt-2 grid max-w-md grid-cols-2 gap-3">
            <div>
              <label htmlFor="lf-ask-low" className={XO_LABEL}>{v.askingMode === "range" ? "From ($M)" : "Price ($M)"}</label>
              <input id="lf-ask-low" inputMode="decimal" className={`${XO_INPUT} font-mono`} value={ask.low} onChange={(e) => typeAsk("low", e.target.value)} />
            </div>
            {v.askingMode === "range" && (
              <div>
                <label htmlFor="lf-ask-high" className={XO_LABEL}>To ($M)</label>
                <input id="lf-ask-high" inputMode="decimal" className={`${XO_INPUT} font-mono`} value={ask.high} onChange={(e) => typeAsk("high", e.target.value)} />
              </div>
            )}
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor="lf-reason" className={XO_LABEL}>Reason for sale <span className="font-normal text-xo-faint">· optional</span></label>
        <input id="lf-reason" className={XO_INPUT} maxLength={REASON_MAX} value={v.reasonForSale ?? ""} onChange={(e) => set("reasonForSale", e.target.value)} placeholder="e.g. focusing on another venture" />
      </div>

      <p role="status" className={`border px-3 py-2 text-[12px] ${missing.length ? "border-xo-caution/50 text-xo-muted" : "border-xo-verified/50 text-xo-verified"}`}>
        {missing.length ? <><span className="font-semibold text-xo-caution">Still needed to list:</span> {missing.join(" · ")}.</> : "Complete: buyers will see every fact they need."}
      </p>
    </div>
  );
};
