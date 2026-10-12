import React, { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { SECTORS, type Sector } from "../lib/company-intake";
import { sectorLabel } from "../lib/market-stats";
import { parseNumber } from "../lib/intake-fields";
import { Editorial } from "./MarketingChrome";
import { Note } from "./SourceNotes";

// "Value your company in 30 seconds" — the homepage's working product moment.
// The valuation module is loaded on first use; the result is the same
// institutional figure the console computes for these inputs (lib/quick-value).
// Nothing is stored: "Refine" hands the three figures to Value My Company in
// the URL, which pre-fills them without saving.

type QV = typeof import("../lib/quick-value");
const usd = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);
const FIELD = "w-full border border-slate-300 bg-white px-3 py-2.5 text-[14px] text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const LABEL = "mb-1.5 block text-[12.5px] font-medium text-slate-700";

const QuickValue: React.FC = () => {
  const { t } = useI18n();
  const id = useId();
  const [sector, setSector] = useState<Sector>("vertical_saas");
  const [revenue, setRevenue] = useState("");
  const [growth, setGrowth] = useState("");
  const [errs, setErrs] = useState<{ revenue?: string; growth?: string }>({});
  const [mod, setMod] = useState<QV | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ low: number; mid: number; high: number; query: string } | null>(null);

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
    <section aria-labelledby={`${id}-h`} className="border-b border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-[1480px] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
          <div>
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-blue-600">{t("qv.eyebrow")}</div>
            <h2 id={`${id}-h`} className="mt-4 font-editorial text-[clamp(2rem,3.4vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink-900"><Editorial text={t("qv.h2")} /></h2>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-slate-600">{t("qv.body")}<Note n={5} first /></p>
          </div>
          <div>
            <form onSubmit={submit} onFocus={() => { void load(); }} noValidate className="grid items-start gap-3 sm:grid-cols-[1.3fr_1fr_1fr_auto]">
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
              <div className="sm:pt-[25px]">
                <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-between gap-5 bg-ink-900 px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-ink-800 disabled:opacity-70">
                  {busy ? t("qv.working") : t("qv.go")} <span aria-hidden>→</span>
                </button>
              </div>
            </form>

            <div aria-live="polite" className="mt-8 border-t border-ink-900 pt-6">
              {result && mod ? (
                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[12.5px] text-slate-600">{t("qv.range")}</span>
                      <span className="border border-blue-600/50 px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-blue-700">{t("qv.model")}</span>
                    </div>
                    <div className="mt-3 font-editorial text-[clamp(2.4rem,4.6vw,4rem)] font-semibold leading-none tabular-nums tracking-[-0.03em] text-ink-900">
                      {usd(result.low)} <span className="text-slate-400">–</span> {usd(result.high)}
                    </div>
                    <div className="mt-2 text-[13px] text-slate-600"><span className="font-semibold text-blue-700">{usd(result.mid)}</span> {t("qv.mid")}</div>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <Link to={`/console/intake${result.query}`} className="inline-flex items-center gap-5 bg-ink-900 px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-ink-800">{t("qv.refine")} <span aria-hidden>→</span></Link>
                      <Link to="/console" className="inline-flex items-center gap-5 border border-ink-900 px-5 py-3 text-[12px] font-semibold text-ink-900 transition hover:bg-ink-900 hover:text-white">{t("nav.access")} <span aria-hidden>↗</span></Link>
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
              ) : (
                <p className="text-[13px] text-slate-600">{t("qv.empty")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickValue;
