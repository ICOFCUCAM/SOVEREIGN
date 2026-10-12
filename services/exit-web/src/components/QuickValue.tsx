import React, { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { SECTORS, type Sector } from "../lib/company-intake";
import { sectorLabel } from "../lib/market-stats";
import { parseNumber } from "../lib/intake-fields";
import { Chapter, Editorial } from "./MarketingChrome";
import { Note } from "./SourceNotes";

// "Value your company in 30 seconds" — the homepage's working product moment.
// The valuation module is loaded on first use; the result is the same
// institutional figure the console computes for these inputs (lib/quick-value).
// Nothing is stored: "Refine" hands the three figures to Value My Company in
// the URL, which pre-fills them without saving.

type QV = typeof import("../lib/quick-value");
const usd = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);
const FIELD = "w-full border border-ink-900 bg-white px-4 py-3.5 text-[16px] text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const LABEL = "mb-2 block text-[13px] font-medium text-slate-700";

/** The range as a gauge from $0: a gradient band from low to high, ticks on
 *  round values, and a pin at the midpoint. The band sweeps in once (not under
 *  reduced motion). Drawn for the navy result card. */
const RangeBar: React.FC<{ low: number; mid: number; high: number; muted?: boolean }> = ({ low, mid, high, muted }) => {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(false); const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id); }, [low, high]);
  const max = high * 1.2, pc = (v: number): string => `${(v / max) * 100}%`;
  const step = [1e6, 5e6, 10e6, 25e6, 50e6, 100e6, 250e6, 500e6, 1e9, 2.5e9, 5e9].find((x) => max / x <= 6) ?? 1e10;
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  return (
    <div aria-hidden className="mt-8">
      <div className="relative h-4 rounded-full bg-white/10 ring-1 ring-inset ring-white/10">
        {ticks.map((v) => <span key={v} className="absolute inset-y-0 w-px bg-white/15" style={{ left: pc(v) }} />)}
        <div className={`absolute inset-y-0 origin-left rounded-full motion-safe:transition-transform motion-safe:duration-[900ms] motion-safe:ease-out ${muted ? "opacity-60" : ""}`}
          style={{ left: pc(low), width: `calc(${pc(high)} - ${pc(low)})`, transform: on ? "scaleX(1)" : "scaleX(0)", background: "linear-gradient(90deg,#2563eb,#60a5fa 55%,#93c5fd)", boxShadow: muted ? "none" : "0 0 18px rgba(96,165,250,0.55)" }} />
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pc(mid) }}>
          <span className="block h-7 w-7 rounded-full border-[3px] border-white bg-blue-600 shadow-[0_0_0_6px_rgba(37,99,235,0.25)]" />
        </div>
      </div>
      <div className="relative mt-3 h-10 font-mono text-[11px] tabular-nums text-blue-100/70">
        {ticks.map((v) => <span key={v} className="absolute -translate-x-1/2" style={{ left: pc(v) }}>{v === 0 ? "$0" : usd(v)}</span>)}
        <span className="absolute top-5 -translate-x-1/2 whitespace-nowrap rounded-sm bg-white px-1.5 py-0.5 font-semibold text-ink-900" style={{ left: pc(mid) }}>{usd(mid)}</span>
      </div>
    </div>
  );
};

/** The navy card the range sits in: the page's one dark object in this chapter. */
const CARD = "relative overflow-hidden rounded-[6px] p-6 text-white shadow-[0_30px_60px_-30px_rgba(6,24,46,0.7)] sm:p-9";
const CARD_BG = { background: "radial-gradient(ellipse 80% 120% at 0% 0%, rgba(37,99,235,0.35), transparent 60%), linear-gradient(135deg, var(--ex-1) 0%, var(--ex-2) 100%)" };

const QuickValue: React.FC<{ n?: string }> = ({ n = "03" }) => {
  const { t } = useI18n();
  const id = useId();
  const [sector, setSector] = useState<Sector>("vertical_saas");
  const [revenue, setRevenue] = useState("");
  const [growth, setGrowth] = useState("");
  const [errs, setErrs] = useState<{ revenue?: string; growth?: string }>({});
  const [mod, setMod] = useState<QV | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ low: number; mid: number; high: number; query: string } | null>(null);

  // A worked example, computed by the same engine once the page is idle, so the
  // chapter never opens on an empty form. Clearly labelled; replaced by the
  // reader's own result.
  const EX = { sector: "vertical_saas" as Sector, revenueUsd: 40e6, growthPct: 0.45 };
  const [example, setExample] = useState<{ low: number; mid: number; high: number } | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => { void import("../lib/quick-value").then((m) => { setMod((x) => x ?? m); setExample(m.quickValue(EX)); }); }, 1200);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (): Promise<QV> => mod ?? import("../lib/quick-value").then((m) => { setMod(m); return m; });

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const r = parseNumber(revenue, { min: 0.1, max: 5_000, scale: 1e6 });
    const g = parseNumber(growth, { min: -50, max: 300, scale: 0.01 });
    setErrs({ revenue: r.ok ? undefined : r.error, growth: g.ok ? undefined : g.error });
    if (!r.ok || !g.ok) { setResult(null); return; }
    setBusy(true);
    const m = await load();
    const q = { sector, revenueUsd: r.value, growthPct: g.value };
    setResult({ ...m.quickValue(q), query: m.quickQuery(q) });
    setBusy(false);
  };

  return (
    <section id={`ch-${n}`} aria-labelledby={`${id}-h`} className="ex-light bg-white">
      <div className="mx-auto w-full max-w-[1480px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="border-t-4 border-double border-ink-900 pt-8">
          <Chapter n={n}>{t("qv.eyebrow")}</Chapter>
          <div className="mt-6 grid items-end gap-6 lg:grid-cols-[1fr_0.6fr] lg:gap-[6vw]">
            <h2 id={`${id}-h`} className="rv-h max-w-[16ch] font-editorial text-[clamp(2.75rem,5.8vw,5.6rem)] font-semibold leading-[0.94] tracking-[-0.045em] text-ink-900"><Editorial text={t("qv.h2")} /></h2>
            <p className="max-w-sm text-[15px] leading-relaxed text-slate-600">{t("qv.body")}<Note n={5} first /></p>
          </div>
        </div>
        <div className="mt-12">
          <div>
            <form onSubmit={submit} onFocus={() => { void load(); }} noValidate className="grid items-start gap-4 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
              <div>
                <label htmlFor={`${id}-s`} className={LABEL}>{t("qv.sector")}</label>
                <select id={`${id}-s`} value={sector} onChange={(e) => setSector(e.target.value as Sector)} className={FIELD}>
                  {SECTORS.map((s) => <option key={s} value={s}>{sectorLabel(s)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={`${id}-r`} className={LABEL}>{t("qv.revenue")}</label>
                <input id={`${id}-r`} inputMode="decimal" value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="40"
                  aria-invalid={!!errs.revenue} aria-describedby={errs.revenue ? `${id}-re` : undefined} className={FIELD} />
                {errs.revenue && <p id={`${id}-re`} className="mt-1 text-[12px] text-red-700">{errs.revenue}</p>}
              </div>
              <div>
                <label htmlFor={`${id}-g`} className={LABEL}>{t("qv.growth")}</label>
                <input id={`${id}-g`} inputMode="decimal" value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="45"
                  aria-invalid={!!errs.growth} aria-describedby={errs.growth ? `${id}-ge` : undefined} className={FIELD} />
                {errs.growth && <p id={`${id}-ge`} className="mt-1 text-[12px] text-red-700">{errs.growth}</p>}
              </div>
              <div className="sm:pt-[29px]">
                <button type="submit" disabled={busy} className="group inline-flex w-full items-center justify-between gap-6 bg-ink-900 px-6 py-[17px] text-[13px] font-semibold text-white transition duration-300 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-70 motion-reduce:transition-none">
                  {busy ? t("qv.working") : t("qv.go")} <span aria-hidden>→</span>
                </button>
              </div>
            </form>

            <div aria-live="polite" className="mt-10 border-t border-ink-900 pt-8">
              {result && mod ? (
                <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_1fr]">
                  <div className={CARD} style={CARD_BG}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[12.5px] text-blue-100/80">{t("qv.range")}</span>
                      <span className="rounded-sm bg-blue-600 px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white">{t("qv.model")}</span>
                    </div>
                    <div className="mt-4 font-editorial text-[clamp(2.6rem,5.6vw,5.4rem)] font-semibold leading-none tabular-nums tracking-[-0.03em]">
                      {usd(result.low)} <span aria-hidden className="text-blue-300/60">–</span> {usd(result.high)}
                    </div>
                    <div className="mt-2 text-[13px] text-blue-100/80"><span className="font-semibold text-blue-300">{usd(result.mid)}</span> {t("qv.mid")}</div>
                    <RangeBar low={result.low} mid={result.mid} high={result.high} />
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <Link to={`/console/intake${result.query}`} className="inline-flex items-center gap-5 bg-white px-5 py-3 text-[12px] font-semibold text-ink-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">{t("qv.refine")} <span aria-hidden>→</span></Link>
                    </div>
                  </div>
                  <div>
                    <div className="text-[12.5px] text-slate-600">{t("qv.assume")}</div>
                    <dl className="mt-2 border-t border-slate-200 text-[12.5px]">
                      {mod.QUICK_ASSUMPTIONS.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3 border-b border-slate-200 py-1.5">
                          <dt className="text-slate-600">{k}</dt><dd className="font-mono font-semibold text-ink-800">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              ) : example ? (
                <div className={`${CARD} max-w-[860px]`} style={CARD_BG}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[12.5px] text-blue-100/80">{t("qv.range")}</span>
                    <span className="rounded-sm border border-white/40 px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white/85">{t("qv.exampleTag")}</span>
                  </div>
                  <div className="mt-4 font-editorial text-[clamp(2.6rem,5.6vw,5.4rem)] font-semibold leading-none tabular-nums tracking-[-0.03em] text-white/75">
                    {usd(example.low)} <span aria-hidden className="text-blue-300/50">–</span> {usd(example.high)}
                  </div>
                  <RangeBar low={example.low} mid={example.mid} high={example.high} muted />
                  <p className="mt-2 text-[14px] text-blue-100/80">{t("qv.example", { s: sectorLabel(EX.sector), r: EX.revenueUsd / 1e6, g: Math.round(EX.growthPct * 100) })}</p>
                </div>
              ) : (
                <p className="text-[14px] text-slate-600">{t("qv.empty")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickValue;
