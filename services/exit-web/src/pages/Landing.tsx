import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MarketingChrome, Glyph, Mark, Arrow, Chapter, Editorial } from "../components/MarketingChrome";
import { MARKET_FMT, MANDATE_ACTIVITY, DISCLOSED_TRANSACTIONS, BOARD_BUYERS, SECTOR_DEMAND, HISTORY_FMT, LEDGER_ROWS, LEDGER_TIERS, LEDGER_PRICED, DEAL_INTEL_FMT, REGISTRY_CARDS, TOP_JURISDICTIONS, type BoardTx } from "../lib/market-stats";
import { useI18n } from "../lib/i18n";
import QuickValue from "../components/QuickValue";
import { Note, SourcesSection, type SourceId } from "../components/SourceNotes";
import { MARKET_INDEX_FMT } from "../lib/market-index";

// Public marketing home — the front door to ExitOS, wrapped in the shared
// marketing chrome (header nav → Platform / Modules / Pricing + footer).
// Editorial layout from the index(9) skeleton: an editorial-serif headline
// beside the coded "Acquisition Command Center" board, a lifecycle band, then
// numbered chapters on hairline rules. Colours are the locked ExitOS palette.
// Company marks are brand-coloured monogram placeholders.

const WRAP = "mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12";
const NAVY = "linear-gradient(135deg,#06182E 0%,#0A1F3A 60%,#0B2547 100%)";
const H2 = "font-editorial text-[clamp(2.25rem,4.6vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em]";
const BTN = "inline-flex items-center gap-5 px-5 py-3.5 text-[12px] font-semibold transition";

// The hero headline in the editorial serif: an all-caps i18n string reads in
// sentence case on offset lines, the last line in the accent italic.
const heroLines = (s: string): string[] =>
  s.split("\n").map((l, i) => (l === l.toUpperCase() ? (i === 0 ? l.charAt(0) + l.slice(1).toLowerCase() : l.toLowerCase()) : l));

const Landing: React.FC = () => {
  const nav = useNavigate();
  const { t } = useI18n();
  const heroTrust = [
    { icon: "globe", metric: t("trust.network.m", { n: MARKET_FMT.buyers }), title: t("trust.network.t"), sub: t("trust.network.s", { g: MARKET_FMT.geographies, s: MARKET_FMT.sectors }) },
    { icon: "lock", metric: "NDA", title: t("trust.soc.t"), sub: t("trust.soc.s") },
    { icon: "users", metric: "100%", title: t("trust.control.t"), sub: t("trust.control.s") },
    { icon: "check", metric: t("trust.audit.m"), title: t("trust.audit.t"), sub: t("trust.audit.s") },
  ];
  const h1 = heroLines(t("hero.h1"));
  return (
    <MarketingChrome active="home">
      {/* ===== 01 · HERO — editorial headline + the command board ===== */}
      <section className="relative overflow-hidden border-b border-slate-200">
        {/* trading-hall photograph as the hero environment */}
        <div className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/command-center.png)" }} aria-hidden />
        {/* architectural framing: ceiling light grid + glass-wall mullions +
            floor sheen, to read as an exchange hall rather than a stock office */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-40" aria-hidden
          style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 2px, transparent 2px 96px)", maskImage: "linear-gradient(to bottom, #000, transparent)", WebkitMaskImage: "linear-gradient(to bottom, #000, transparent)" }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-[0.12]" aria-hidden
          style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(40,70,110,0.6) 0 1px, transparent 1px 140px), repeating-linear-gradient(0deg, rgba(40,70,110,0.4) 0 1px, transparent 1px 180px)" }} />
        {/* sovereign data layer — a near-invisible transaction heat field rising
            from the floor of the hall; reads as depth, not decoration */}
        <div className="pointer-events-none absolute bottom-0 right-0 h-2/3 w-3/5 opacity-[0.07]" aria-hidden
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, rgba(56,130,246,0.9) 0 10px, transparent 10px 34px)",
            maskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent 80%)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent 80%)",
          }} />
        {/* wash: strong on the left for the headline, light on the right so the
            hall (desks, analysts, windows) stays visible around the board. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/92 from-5% via-white/45 via-40% to-white/5" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#eef2f7] via-[#eef2f7]/70 to-transparent" aria-hidden />
        {/* floor sheen + ambient light the board emits onto the floor */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-50" aria-hidden style={{ background: "linear-gradient(to top, rgba(255,255,255,0.5), transparent)" }} />
        <div className="pointer-events-none absolute bottom-[8%] right-[6%] h-48 w-[48%] rounded-[50%] opacity-25 blur-3xl" style={{ background: "radial-gradient(ellipse at center, rgba(70,150,220,0.22), rgba(70,150,220,0) 70%)" }} aria-hidden />

        <div className={`${WRAP} relative pb-12 pt-10 lg:pb-14 lg:pt-14`}>
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">
            <span>{t("hero.eyebrow")}</span>
            <span className="text-blue-600">Registry snapshot · as of {MARKET_INDEX_FMT.asOf}</span>
          </div>
          <div className="mt-9 grid items-center gap-8 lg:grid-cols-[0.9fr_1.3fr]">
            <div className="min-w-0">
              <h1 className="font-editorial text-[clamp(3rem,5vw,5.1rem)] font-semibold leading-[0.9] tracking-[-0.045em] text-ink-900">
                {h1.map((l, i) => (
                  <span key={i} className={`block ${i === 1 ? "pl-[8%]" : ""} ${i === h1.length - 1 ? "italic text-blue-600" : ""}`}>{l}</span>
                ))}
              </h1>
              <div className="mt-8 grid grid-cols-[44px_minmax(0,1fr)] gap-4 sm:grid-cols-[64px_minmax(0,440px)]">
                <span className="pt-1 font-mono text-[11px] text-blue-600">01—</span>
                <div>
                  <p className="font-serif text-[18px] font-semibold leading-snug text-ink-900">{t("hero.sub")}</p>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-ink-800">{t("hero.body")}</p>
                </div>
              </div>
              <div className="mt-7 flex flex-wrap gap-2.5 sm:ml-[80px]">
                <button onClick={() => nav("/console")} className={`${BTN} bg-ink-900 text-white hover:bg-ink-800`}>{t("nav.access")} <Arrow /></button>
                <button onClick={() => nav("/pricing")} className={`${BTN} border border-ink-900 bg-white/70 text-ink-900 hover:bg-ink-900 hover:text-white`}>{t("hero.deploy")} <span aria-hidden>↗</span></button>
              </div>
            </div>

          {/* ---- MOUNTED ACQUISITION-EXCHANGE DISPLAY ---- */}
          {/* pushed right + up, clear of the headline, with a light floor shadow */}
          <div className="min-w-0 lg:translate-x-16 lg:-translate-y-6" style={{ perspective: "2000px" }}>
            <div className="relative">
              {/* structural mount / bezel behind the screen — the 3D mount
                  rotation applies only at lg+; phones get the flat board */}
              <div
                className="ex-bezel relative rounded-[20px] p-2.5"
                style={{
                  background: "linear-gradient(145deg,#1c2c44,#0a1626)",
                  boxShadow: "0 28px 48px -30px rgba(8,20,40,0.32), 0 10px 22px -18px rgba(8,20,40,0.26), inset 0 1px 0 rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {/* Bloomberg-style exchange ribbon */}
                <div className="mb-1.5 flex items-center justify-between gap-3 rounded-md bg-black/25 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">ExitOS Acquisition Exchange</span>
                    <span className="hidden items-center gap-1 rounded-sm bg-emerald-400/15 px-1.5 py-0.5 sm:inline-flex">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                      <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-emerald-300">Live Market</span>
                    </span>
                    <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 md:inline">{MARKET_FMT.activeMandates} mandates deploying · {MARKET_FMT.appetite} capacity · data as of {DATA_AS_OF}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/40">System Status</span>
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-emerald-300">Live</span>
                  </div>
                </div>
                {/* live deal-activity ticker (motion layer) */}
                <CommandBoard />
              </div>

              {/* polished-floor reflection of the screen (lg+ only) */}
              <div
                aria-hidden
                className="ex-reflection pointer-events-none absolute inset-x-0 top-full hidden h-28 overflow-hidden lg:block"
                style={{
                  opacity: 0.07,
                  filter: "blur(4px)",
                  WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)",
                  maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)",
                  background: "linear-gradient(180deg,#0a1626,#08203B)",
                }}
              />
            </div>
          </div>
          </div>

          {/* hero index rule — the proof ribbon (real figures) */}
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-300/80 pt-5">
            <span aria-hidden className="hidden h-px w-10 bg-blue-600 sm:block" />
            {[
              [MARKET_INDEX_FMT.events, t("ribbon.deals")],
              [MARKET_FMT.buyers, t("ribbon.mandates")],
              [HISTORY_FMT.disclosedValue, t("ribbon.value")],
              [MARKET_FMT.activeMandates, t("ribbon.deploying")],
            ].map(([v, l], i) => (
              <div key={l} className="flex items-baseline gap-2">
                {i === 3 && <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                <span className="font-mono text-[15px] font-bold tabular-nums text-ink-900">{v}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600">{l}<Note n={([1, 2, 3, 2] as SourceId[])[i]} first={i < 3} /></span>
              </div>
            ))}
          </div>
        </div>

        {/* trust strip — four hairline-divided cells */}
        <div className="relative border-t border-slate-200 bg-white/80 backdrop-blur">
          <div className={`${WRAP} grid grid-cols-2 lg:grid-cols-4`}>
            {heroTrust.map((c, i) => (
              <div key={c.title} className={`flex items-center gap-3.5 py-5 ${i > 0 ? "lg:border-l lg:border-slate-200 lg:pl-6" : ""} ${i % 2 ? "border-l border-slate-200 pl-5 lg:pl-6" : ""}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center text-blue-600 ring-1 ring-slate-200"><Glyph name={c.icon} /></span>
                <div className="min-w-0">
                  <div className="font-editorial text-[22px] font-semibold leading-none text-ink-900">{c.metric}{c.icon === "globe" && <Note n={2} />}</div>
                  <div className="mt-1 text-[12.5px] font-semibold leading-tight text-ink-800">{c.title}</div>
                  <div className="text-[11px] leading-snug text-slate-600">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes exTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
          @keyframes exScan{0%{transform:translateY(-100%);opacity:0}8%{opacity:1}50%{opacity:.5}92%{opacity:1}100%{transform:translateY(2000%);opacity:0}}
          @keyframes exFlash{0%,100%{background:transparent}50%{background:rgba(96,165,250,.10)}}
          @keyframes exTravel{0%{left:0;opacity:0}6%{opacity:1}94%{opacity:1}100%{left:100%;opacity:0}}
        `}</style>
      </section>

      {/* ===== VALUE YOUR COMPANY — the working product moment ===== */}
      <QuickValue />

      {/* ===== BAND · THE ACQUISITION LIFECYCLE ===== */}
      <section aria-label={t("lifecycle.title")} className="text-white" style={{ background: NAVY }}>
        <div className={`${WRAP} py-6`}>
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300">{t("lifecycle.title")}<Note n={6} first dark /></div>
            <div className="hidden font-mono text-[9.5px] uppercase tracking-[0.16em] text-blue-200 sm:block">{t("lifecycle.live")}</div>
          </div>
          <div className="relative mt-5">
            <ol className="grid grid-cols-2 gap-y-4 border-t border-white/15 pt-4 sm:grid-cols-4 lg:grid-cols-8">
              {LIFECYCLE.map(([s, w], i) => (
                <li key={s} className="flex items-baseline gap-2 pr-3">
                  <span className="font-mono text-[10px] text-blue-300">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white/90">{t(s)}</span>
                    <span className="block font-mono text-[9.5px] uppercase tracking-wide text-blue-300/70">{w}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ===== 02 · THE THESIS — why founders lose millions ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n="02">{t("loss.eyebrow")}</Chapter>
            <div>
              <h2 className={`${H2} max-w-[18ch] text-ink-900`}><Editorial text={t("loss.h2")} /></h2>
              <p className="mt-6 max-w-xl text-[14px] leading-relaxed text-slate-600">{t("loss.body", { p: DEAL_INTEL_FMT.medianPremium, d: DEAL_INTEL_FMT.medianClose })}<Note n={4} first /></p>
            </div>
          </div>
          {/* comparison matrix: Traditional vs ExitOS */}
          <div role="region" aria-label="Traditional sale compared with ExitOS" tabIndex={0} className="mt-12 overflow-x-auto border-y border-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:ml-[calc(27.5%+3vw)]">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-slate-200">
                <div className="px-4 py-3" />
                <div className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-600">Traditional Sale</div>
                <div className="bg-ink-900 px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white">With ExitOS</div>
              </div>
              {LOSSES.map((l) => (
                <div key={l.problem} className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-slate-200 last:border-0">
                  <div className="flex items-center px-4 py-4 font-editorial text-[17px] font-semibold text-ink-900">{l.dimension}</div>
                  <div className="flex items-center gap-2 px-4 py-4 text-[12.5px] text-slate-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-red-500"><Glyph name="x" small /></span>{l.problem}
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50/40 px-4 py-4 text-[12.5px] font-medium text-ink-800">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-blue-600"><Glyph name="check" small /></span>{l.fix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 03 · THE SYSTEM — founder → exit workflow ===== */}
      <section id="platform" className="border-b border-slate-200">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <Chapter n="03">{t("wf.eyebrow")}</Chapter>
              <h2 className={`${H2} mt-4 text-ink-900`}><Editorial text={t("wf.h2")} /></h2>
            </div>
          </div>
          <ol className="mt-12 grid gap-px border-y border-ink-900 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((st, i) => (
              <li key={st.title} className="bg-[#f6f8fb] py-6 sm:px-6">
                <span className="font-mono text-[10.5px] text-blue-600">{String(i + 1).padStart(2, "0")} /</span>
                <div className="mt-5 text-blue-600"><Glyph name={st.icon} size={34} /></div>
                <h3 className="mt-4 font-editorial text-[24px] font-semibold leading-tight text-ink-900">{st.title}</h3>
                <p className="mt-2 max-w-xs text-[12.5px] leading-relaxed text-slate-600">{st.body}</p>
              </li>
            ))}
          </ol>
          {/* Founder → Exit — the flow in one mono line */}
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3">
            {EXCHANGE_FLOW.map((s, i) => (
              <React.Fragment key={s.title}>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600"><Glyph name={s.icon} small /></span>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-800">{s.title}</span>
                </div>
                {i < EXCHANGE_FLOW.length - 1 && <span className="text-blue-600" aria-hidden>→</span>}
              </React.Fragment>
            ))}
          </div>
          {/* market structure — the counterparties on the exchange */}
          <div id="solutions" className="mt-16">
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-600">{t("ms.eyebrow")}<Note n={2} /></div>
            <div className="mt-4 grid grid-cols-2 border-t border-slate-300 sm:grid-cols-3 lg:grid-cols-5">
              {ECOSYSTEM.map((e, i) => (
                <div key={e.label} className={`py-5 pr-4 ${i > 0 ? "lg:border-l lg:border-slate-200 lg:pl-5" : ""}`}>
                  <span className="text-blue-600"><Glyph name={e.icon} /></span>
                  <div className="mt-3 text-[13px] font-semibold text-ink-900">{t(e.label)}</div>
                  <div className="mt-0.5 font-mono text-[10.5px] text-slate-600">{t(e.meta, { n: e.n })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 04 · BUYER INTELLIGENCE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n="04">{t("bi.eyebrow")}<Note n={2} /></Chapter>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className={`${H2} text-ink-900`}><Editorial text={t("bi.h2")} /></h2>
              <Link to="/console" className="border-b border-blue-600 pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-900">{t("bi.link")} ↗</Link>
            </div>
          </div>
          <div className="mt-12 grid border-y border-ink-900 sm:grid-cols-2 lg:grid-cols-5">
            {BUYERS.map((b, i) => (
              <div key={b.name} className={`py-6 pr-5 ${i > 0 ? "lg:border-l lg:border-slate-200 lg:pl-5" : ""} border-b border-slate-200 last:border-b-0 lg:border-b-0`}>
                <div className="flex items-center gap-2.5">
                  <Mark name={b.name} />
                  <div>
                    <div className="text-sm font-bold leading-tight text-ink-900">{b.name}</div>
                    <div className="text-[10.5px] text-slate-600">{b.kind}</div>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-600">Acquisition Appetite</span>
                    <span className="font-semibold text-blue-600">{b.appetite >= 90 ? "Very High" : "High"}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden bg-slate-100">
                    <div className="h-full bg-blue-600" style={{ width: `${b.appetite}%` }} />
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-[11px]">
                  {b.rows.map((r) => (
                    <div key={r[0]} className="flex items-baseline justify-between gap-2 border-t border-slate-100 pt-2">
                      <dt className="text-slate-600">{r[0]}</dt>
                      <dd className="text-right font-semibold text-ink-800">{r[1]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 05 · DATA PROVENANCE ===== */}
      <section className="border-b border-slate-200">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-[6vw]">
            <div>
              <Chapter n="05">{t("prov.eyebrow")}</Chapter>
              <h2 className={`${H2} mt-4 text-ink-900`}><Editorial text={t("prov.h2")} /></h2>
              <p className="mt-6 max-w-md text-[14px] leading-relaxed text-slate-600">{t("prov.body")}</p>
              <ol className="mt-8 border-t border-slate-300">
                {PROVENANCE_PIPELINE.map((p, i) => (
                  <li key={p.stage} className="flex items-baseline gap-4 border-b border-slate-200 py-3">
                    <span className="font-mono text-[10.5px] text-blue-600">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[13px] font-semibold text-ink-900">{p.stage}</span>
                    <span className="ml-auto text-right text-[11.5px] text-slate-600">{p.detail}</span>
                  </li>
                ))}
              </ol>
            </div>
            {/* confidence-tier register */}
            <div className="border-y border-ink-900">
              <div className="flex items-center justify-between border-b border-slate-200 py-3">
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-900">Confidence register</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-slate-600">applied to every estimate</span>
              </div>
              {CONFIDENCE_TIERS.map((ct) => (
                <div key={ct.tier} className="grid grid-cols-[110px_1fr] gap-4 border-b border-slate-200 py-4 last:border-0">
                  <div>
                    <span className="inline-block px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ring-1" style={{ color: ct.color, background: `${ct.color}14`, borderColor: `${ct.color}40` }}>{ct.tier}</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-ink-900">{ct.basis}</div>
                    <div className="mt-0.5 text-[12px] leading-snug text-slate-600">{ct.detail}</div>
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-200 py-3 text-[11px] text-slate-600">
                {HISTORY_FMT.events} disclosed events on record · sources: SEC EDGAR 8-K filings, Wikidata, press disclosures · refreshed with the registry<Note n={3} />
              </div>
            </div>
          </div>
          {/* signal tiles — one hairline row */}
          <div className="mt-14 grid grid-cols-2 border-y border-slate-300 sm:grid-cols-3 lg:grid-cols-6">
            {COMMAND_FEATURES.map((f, i) => (
              <div key={f.title} className={`py-5 pr-4 ${i > 0 ? "lg:border-l lg:border-slate-200 lg:pl-4" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600"><Glyph name={f.icon} small /></span>
                  <span className="font-mono text-[15px] font-bold text-ink-900">{f.value}<Note n={f.src} /></span>
                </div>
                <div className="mt-3 text-[12px] font-bold leading-tight text-ink-900">{f.title}</div>
                <div className="text-[10.5px] leading-snug text-slate-600">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 06 · THE TRANSACTION RECORD — the ledger ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n="06">{t("rec.eyebrow")}</Chapter>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className={`${H2} max-w-[20ch] text-ink-900`}><Editorial text={t("rec.h2")} /></h2>
              <p className="max-w-xs text-[13px] leading-relaxed text-slate-600">{t("rec.body")}</p>
            </div>
          </div>

          {/* masthead */}
          <div className="mt-12 border-t-4 border-double border-ink-900 pt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink-900 pb-3">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-600">Disclosed acquisitions</span>
              <span className="font-editorial text-[clamp(1.6rem,3vw,2.4rem)] font-semibold uppercase tracking-[0.06em] text-ink-900">The ExitOS Ledger</span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-600">Index as of {MARKET_INDEX_FMT.asOf} · {HISTORY_FMT.events} recorded deals, {LEDGER_PRICED} priced<Note n={3} /></span>
            </div>
          </div>

          {/* front page — the three latest deals */}
          <div className="grid border-b border-ink-900 sm:grid-cols-3">
            {LEDGER_ROWS.slice(0, 3).map((c, i) => (
              <article key={c.target} className={`py-7 pr-6 ${i > 0 ? "sm:border-l sm:border-slate-300 sm:pl-6" : ""} border-b border-slate-200 last:border-b-0 sm:border-b-0`}>
                <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">
                  <span>{c.sector}</span><time dateTime={c.date}>{c.date}</time>
                </div>
                <h3 className="mt-4 font-editorial text-[clamp(1.4rem,2.2vw,1.9rem)] font-semibold leading-[1.1] text-ink-900">
                  {c.buyer} <span className="italic text-blue-700">{c.status === "Closed" ? "acquired" : c.status === "Terminated" ? "ended its deal for" : "agreed to acquire"}</span> {c.target}
                </h3>
                <div className="mt-5 font-editorial text-[clamp(2.4rem,4vw,3.4rem)] font-semibold leading-none tabular-nums text-ink-900">{c.value}</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">Disclosed Value</div>
                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 text-[11px]">
                  <div><dt className="text-slate-600">vs reference</dt><dd className="font-mono text-[14px] font-bold text-blue-700">{c.premium}</dd></div>
                  <div><dt className="text-slate-600">Status</dt><dd className="font-mono text-[14px] font-bold" style={{ color: c.statusColor }}>{c.status}</dd></div>
                  <div><dt className="text-slate-600">Source</dt><dd className="font-mono text-[12px] font-semibold text-ink-900">{c.sources[0]?.kind ?? "—"}</dd></div>
                </dl>
              </article>
            ))}
          </div>

          {/* the ledger table */}
          <div role="region" aria-label="Earlier disclosed acquisitions" tabIndex={0} className="mt-8 overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <caption className="pb-3 text-left font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-600">Earlier entries · newest first</caption>
              <thead>
                <tr className="border-y border-ink-900 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600">
                  {["Announced", "Target", "Acquirer", "Sector", "Value", "Status", "Source"].map((h) => <th key={h} scope="col" className={`py-2.5 pr-4 font-semibold ${h === "Value" ? "text-right" : ""}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {LEDGER_ROWS.slice(3).map((r) => (
                  <tr key={r.date + r.target} className="border-b border-slate-200">
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-slate-600"><time dateTime={r.date}>{r.date}</time></td>
                    <th scope="row" className="py-2.5 pr-4 font-editorial text-[15px] font-semibold text-ink-900">{r.target}</th>
                    <td className="py-2.5 pr-4 text-ink-800">{r.buyer}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{r.sector}</td>
                    <td className="py-2.5 pr-4 text-right font-mono font-semibold tabular-nums text-ink-900">{r.value}</td>
                    <td className="py-2.5 pr-4 font-mono text-[12px] font-semibold" style={{ color: r.statusColor }}>{r.status}</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-600">{r.sources.map((x) => `${x.kind} ${x.ref}`).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-slate-600">
            Every entry is curated from the source shown. Record tier: {Object.entries(LEDGER_TIERS).map(([k, n]) => `${n} ${k}`).join(", ")} — not re-checked against the primary filing in this build.
          </p>
          <div className="mt-5 text-[11px] text-slate-600">Market index: {MARKET_INDEX_FMT.events} acquisition events from {MARKET_INDEX_FMT.buyers} buyers (Wikipedia · Wikidata · SEC EDGAR, as of {MARKET_INDEX_FMT.asOf}) · benchmark set: {HISTORY_FMT.events} recorded deals ({LEDGER_PRICED} priced) · {HISTORY_FMT.disclosedValue} disclosed value<Note n={1} /><Note n={3} /></div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-slate-300 px-5 py-4">
            <span className="text-[13.5px] text-slate-700">{t("rec.bridge")}</span>
            <button onClick={() => nav("/console")} className={`${BTN} bg-ink-900 text-white hover:bg-ink-800`}>{t("rec.run")} <Arrow /></button>
          </div>
        </div>
      </section>

      {/* ===== 07–08 · THE WORKING ENVIRONMENT (dark) — negotiation desk + data rooms ===== */}
      <section className="text-white" style={{ background: NAVY }}>
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-[6vw]">
            <div>
              <Chapter n="07" dark>{t("neg.eyebrow")}</Chapter>
              <h2 className={`${H2} mt-4 text-white`}><Editorial text={t("neg.h2")} dark /></h2>
              <p className="mt-6 max-w-md text-[14px] leading-relaxed text-blue-100/70">{t("neg.body")}</p>
              <Link to="/modules" className="mt-6 inline-block border-b border-blue-300 pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white">{t("neg.link")} ↗</Link>
              <ul className="mt-8 border-t border-white/15">
                {NEGOTIATION_FEATURES.map((f) => (
                  <li key={f.title} className="flex gap-3 border-b border-white/10 py-4">
                    <span className="mt-0.5 text-blue-300"><Glyph name={f.icon} small /></span>
                    <div>
                      <div className="text-sm font-bold text-white">{f.title}</div>
                      <div className="text-[12px] text-blue-100/60">{f.body}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* the desk — a framed instrument */}
            <div className="border border-white/15 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-blue-100/60">
                <span>ExitOS / Negotiation desk</span><span className="text-loi-300">Illustrative figures</span>
              </div>
              <div className="mt-4"><OfferTable /></div>
            </div>
          </div>

          {/* data rooms */}
          <div className="mt-14 grid items-center gap-10 border-t border-white/15 pt-12 lg:mt-20 lg:pt-14 lg:grid-cols-[1.4fr_1fr] lg:gap-[6vw]">
            <div>
              <Chapter n="08" dark>{t("dr.eyebrow")}</Chapter>
              <h2 className={`${H2} mt-4 text-white`}><Editorial text={t("dr.h2")} dark /></h2>
              <p className="mt-6 max-w-lg text-[14px] leading-relaxed text-blue-100/70">{t("dr.body")}</p>
              <Link to="/platform" className="mt-6 inline-block border-b border-blue-300 pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white">{t("dr.link")} ↗</Link>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[11.5px] text-blue-100/70">
                {[["doc", "Document checklist by package"], ["check", "Completeness per package"], ["shield", "Who can see uploads, stated"]].map(([ic, l]) => (
                  <span key={l} className="flex items-center gap-1.5"><span className="text-blue-300"><Glyph name={ic} small /></span>{l}</span>
                ))}
              </div>
            </div>
            <div className="flex h-40 items-center justify-center border border-white/15"><Vault /></div>
          </div>
          <div className="mt-10 grid grid-cols-2 border-y border-white/15 sm:grid-cols-3 lg:grid-cols-6">
            {DATA_ROOMS.map((d, i) => (
              <div key={d.title} className={`py-5 pr-4 ${i > 0 ? "lg:border-l lg:border-white/10 lg:pl-4" : ""}`}>
                <span className="text-blue-300"><Glyph name={d.icon} small /></span>
                <div className="mt-3 text-[12.5px] font-semibold leading-tight text-white">{d.title}</div>
                <div className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wide text-blue-100/50">
                  <span>Required for diligence</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 09 · THE MARKETPLACE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n="09">{t("mp.eyebrow")}</Chapter>
            <div>
              <h2 className={`${H2} text-ink-900`}><Editorial text={t("mp.h2")} /></h2>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
                <p className="max-w-md text-[14px] leading-relaxed text-slate-600">{t("mp.body")}</p>
                <Link to="/console/marketplace" className="border-b border-blue-600 pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-900">{t("mp.link")} ↗</Link>
              </div>
            </div>
          </div>
          <p className="mt-12 font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-600">Example listings — illustrative, not companies on the market</p>
          <div className="mt-3 grid border-y border-ink-900 sm:grid-cols-2 lg:grid-cols-4">
            {OPPORTUNITIES.map((o, i) => (
              <div key={o.name} className={`py-6 pr-5 ${i > 0 ? "lg:border-l lg:border-slate-200 lg:pl-5" : ""} border-b border-slate-200 last:border-b-0 lg:border-b-0`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-blue-600">{o.sector}</span>
                  <span className="font-mono text-[9.5px] uppercase tracking-wide text-slate-600">{o.stage}</span>
                </div>
                <div className="mt-4 font-editorial text-[22px] font-semibold text-ink-900">{o.name}</div>
                <div className="mt-1 text-[10.5px] text-slate-600">Example listing &middot; {o.region}</div>
                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 text-[11px]">
                  <div><div className="text-slate-600">Revenue band</div><div className="font-mono font-semibold text-ink-800">{o.rev}</div></div>
                  <div className="text-right"><div className="text-slate-600">EBITDA band</div><div className="font-mono font-semibold text-ink-800">{o.ebitda}</div></div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-600"><Glyph name="lock" small /> Identity &amp; ask under NDA</span>
                  <a href="/console" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">Request NDA &rarr;</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 10 · COVERAGE — global reach ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="grid items-stretch lg:grid-cols-[1.05fr_1.35fr]">
          <div className="relative flex items-center overflow-hidden px-5 py-12 sm:px-8 lg:px-12 lg:py-16" style={{ background: "linear-gradient(135deg,#0a2a52 0%,#05182f 60%,#081f3a 100%)" }}>
            <div aria-hidden className="w-full"><WorldDots /></div>
          </div>
          <div className="px-5 py-16 sm:px-8 lg:px-14 lg:py-20">
            <Chapter n="10">{t("cov.eyebrow")}</Chapter>
            <h2 className={`${H2} mt-4 text-ink-900`}><Editorial text={t("cov.h2")} /></h2>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-slate-600">{t("cov.body", { g: MARKET_FMT.geographies })}<Note n={2} /></p>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {TOP_JURISDICTIONS.map(([code, n]) => (
                <span key={code} className="inline-flex items-baseline gap-1.5 border border-slate-200 px-2.5 py-1 font-mono text-[11px] font-bold text-ink-800">
                  {code} <span className="text-[9.5px] font-medium text-slate-600">{n} mandates</span>
                </span>
              ))}
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-slate-300 pt-8 sm:grid-cols-4">
              {GLOBAL_STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-editorial text-[2.2rem] font-semibold leading-none tabular-nums text-ink-900">{s.value}</div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 11 · GOVERNANCE & CONTROLS ===== */}
      <section className="text-white" style={{ background: NAVY }}>
        <div className={`${WRAP} py-16`}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <Chapter n="11" dark>{t("gov.eyebrow")}</Chapter>
            <div className="text-[11.5px] text-blue-100/60">{t("gov.note")}</div>
          </div>
          <div className="mt-8 grid grid-cols-1 border-y border-white/15 sm:grid-cols-2 lg:grid-cols-5">
            {GOVERNANCE.map((g, i) => (
              <div key={g.title} className={`py-6 pr-5 ${i > 0 ? "lg:border-l lg:border-white/10 lg:pl-5" : ""}`}>
                <span className="text-blue-300"><Glyph name={g.icon} /></span>
                <h3 className="mt-4 font-editorial text-[19px] font-semibold text-white">{t(g.title)}</h3>
                <p className="mt-1.5 text-[11.5px] leading-snug text-blue-100/60">{t(g.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 12 · THE NEXT MOVE — final CTA ===== */}
      <section className="bg-[#f6f8fb]">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <Chapter n="12">{t("cta.eyebrow")}</Chapter>
              <h2 className="mt-5 font-editorial text-[clamp(2.6rem,6vw,5.4rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink-900"><Editorial text={t("cta.h2")} /></h2>
              <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-slate-600">{t("cta.body")}</p>
            </div>
            <div className="flex flex-wrap gap-2.5 lg:flex-col lg:items-stretch">
              <button onClick={() => nav("/console")} className={`${BTN} justify-between bg-ink-900 text-white hover:bg-ink-800`}>{t("cta.open")} <Arrow /></button>
              <button onClick={() => nav("/pricing")} className={`${BTN} justify-between border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white`}>{t("cta.brief")} <span aria-hidden>↗</span></button>
            </div>
          </div>
          <p className="mt-10 border-t border-slate-300 pt-5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-slate-600">{t("cta.foot")}</p>
        </div>
      </section>
      <SourcesSection />
    </MarketingChrome>
  );
};

// ===========================================================================
// COMMAND BOARD — the hero "Acquisition Command Center" (coded to spec)
// 3 columns: Strategic Buyers (25%) · Live Transactions (45%) · Demand (30%)
// Navy palette, glass cards, status-coloured rows.
// ===========================================================================
// Disclosed Transactions column — source-referenced public M&A events from
// the buyer-history snapshot (the same data that drives engine matching).
const TRANSACTIONS = DISCLOSED_TRANSACTIONS;
// Demand column — sector heat computed from mandate coverage.
const DEMAND = SECTOR_DEMAND;
// summary stat bar along the board's bottom edge — registry + history facts
// Bottom stat bar — operational depth that complements (does not repeat) the
// proof ribbon: aggregate capacity, closing velocity and registry coverage.
const BOARD_STATS = [
  { label: "Aggregate Capacity", value: MARKET_FMT.appetite },
  { label: "Median Close Period", value: DEAL_INTEL_FMT.medianClose },
  { label: "Strategic Acquirers", value: MARKET_FMT.strategic },
  { label: "Sectors Monitored", value: MARKET_FMT.sectors },
  { label: "Jurisdictions", value: MARKET_FMT.geographies },
];
// live mandate ticker (very bottom of the board) — real registry entries,
// not fabricated transactions; computed from @exit/engines BUYER_REGISTRY.
const ACTIVITY = MANDATE_ACTIVITY;
// acquisition ecosystem (below hero)
// Market structure — the counterparties on the exchange, with the real
// registry count where one exists (strategic / PE are measured; the rest
// describe the role they play in a process).
const ECOSYSTEM = [
  { icon: "shield", label: "ms.strategic", meta: "ms.strategic.meta", n: MARKET_FMT.strategic },
  { icon: "spark", label: "ms.pe", meta: "ms.pe.meta", n: MARKET_FMT.privateEquity },
  { icon: "users", label: "ms.fo", meta: "ms.fo.meta", n: "" },
  { icon: "chart", label: "ms.advisors", meta: "ms.advisors.meta", n: "" },
  { icon: "doc", label: "ms.corpdev", meta: "ms.corpdev.meta", n: "" },
];
// founder → exit workflow chain
const EXCHANGE_FLOW = [
  { icon: "users", title: "Founder", sub: "lists the company" },
  { icon: "chart", title: "Acquisition Intelligence", sub: "valuation & positioning" },
  { icon: "globe", title: "Buyer Network", sub: "matched acquirers" },
  { icon: "spark", title: "Negotiation", sub: "scored terms" },
  { icon: "lock", title: "Closing", sub: "signature & escrow" },
  { icon: "check", title: "Exit", sub: "funds transferred" },
];
// why founders lose millions (problem → fix)
const LOSSES = [
  { dimension: "Buyer reach", problem: "A handful of known contacts", fix: `A run across ${MARKET_FMT.buyers} curated acquirer mandates in ${MARKET_FMT.geographies} jurisdictions` },
  { dimension: "Preparation", problem: "Negotiate unprepared", fix: "Deterministic valuation, comps and reservation lines up front" },
  { dimension: "Leverage", problem: "Leverage erodes mid-process", fix: "Registry signals + parallel offers hold tension" },
  { dimension: "Final price", problem: "Accept discounted offers", fix: "Offers compared on structure and certainty, not headline alone" },
];
// proof — representative transactions
const heatGradient = (bars: number) =>
  bars >= 9 ? "linear-gradient(90deg,#FF5A5A,#FF3434)"
  : bars >= 8 ? "linear-gradient(90deg,#FF9A3D,#FF7030)"
  : bars >= 6 ? "linear-gradient(90deg,#FFD36B,#FFB84A)"
  : "linear-gradient(90deg,#78B7FF,#4A8CFF)";

// `lean` = focused hero board: only Strategic Buyers + Acquisition Demand
// (no Live Transactions column — that detail lives below the fold), trimmed to
// the few rows that matter, plus a 4-stat market-activity bar.
// Interactive acquisition exchange. Click a demand sector (or a buyer's
// sector) to drill the buyers and transactions into that industry; click a
// transaction to open the deal detail. All three columns join on the same
// sectorLabel, so the board behaves like the product, not an illustration.
const CommandBoard: React.FC = () => {
  const [sector, setSector] = useState<string | null>(null);
  const [drill, setDrill] = useState<BoardTx | null>(null);

  // ── live feed ──────────────────────────────────────────────────
  // A slow market heartbeat (drives the match-score and demand-heat
  // micro-motion) and a spotlight that rotates the deal tape. The session
  // clock lives in its own component so its 1s tick doesn't re-render the
  // whole board.
  const [beat, setBeat] = useState(0);
  const [spot, setSpot] = useState(0);
  useEffect(() => {
    const b = setInterval(() => setBeat((x) => x + 1), 2400);
    const s = setInterval(() => setSpot((x) => x + 1), 3800);
    return () => { clearInterval(b); clearInterval(s); };
  }, []);
  // smooth ±1 oscillation around a base value — a live instrument, bounded
  const liveScore = (base: number, phase: number): number =>
    Math.max(1, Math.min(99, base + Math.round(Math.sin(beat * 0.7 + phase))));

  const buyers = sector ? BOARD_BUYERS.filter((b) => b.sectors.includes(sector)) : BOARD_BUYERS.slice(0, 4);
  const txns   = sector ? TRANSACTIONS.filter((t) => t.industry === sector) : TRANSACTIONS.slice(0, 4);
  const liveRow = txns.length ? spot % txns.length : -1;
  const toggle = (s: string): void => setSector((cur) => (cur === s ? null : s));

  // Only surface demand sectors that actually drill into something, so every
  // click yields buyers and/or deals — never a dead end.
  const covered = DEMAND.filter(([label]) =>
    BOARD_BUYERS.some((b) => b.sectors.includes(label)) || TRANSACTIONS.some((t) => t.industry === label),
  ).slice(0, 5);

  return (
  <div
    className="relative min-w-0 overflow-hidden rounded-xl text-white"
    style={{
      background: "linear-gradient(180deg,#08203B 0%,#06182E 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    }}
  >
    {/* live operational layer — a faint signal sweep travels down the board */}
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16" aria-hidden
      style={{ background: "linear-gradient(180deg, rgba(96,165,250,0.18), transparent)", animation: "exScan 6s linear infinite" }} />

    {/* filter status bar — appears when the board is drilled into a sector */}
    {sector && (
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-blue-500/10 px-5 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200">Filtered · {sector} — {buyers.length} buyer{buyers.length === 1 ? "" : "s"}, {txns.length} deal{txns.length === 1 ? "" : "s"}</span>
        <button onClick={() => setSector(null)} className="rounded px-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/60 hover:text-white">Clear ✕</button>
      </div>
    )}

    <div className="grid grid-cols-1 lg:grid-cols-[25%_45%_30%]">
      {/* ---- COL 1 · STRATEGIC BUYERS ---- */}
      <div className="border-b border-white/5 px-5 py-3 lg:border-b-0 lg:border-r">
        <BoardHeader title="Strategic Buyers" right="Match Score" />
        <div className="mt-1">
          {buyers.map((b, i) => (
            <button key={b.name} onClick={() => toggle(b.sector)} title={`Filter to ${b.sector}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 group flex w-full items-center justify-between gap-2 rounded border-b border-white/5 py-1.5 text-left transition last:border-0 hover:translate-x-1" style={{ transitionDuration: ".25s" }}>
              <div className="flex items-center gap-2">
                <Mark name={b.name} size={22} />
                <div>
                  <div className="text-[12.5px] font-medium text-white/90">{b.name}</div>
                  <div className="text-[10px] text-white/45 group-hover:text-blue-300">{b.sector}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold leading-none tabular-nums transition-all duration-700" style={{ color: "#7CFF9F", fontSize: 17 }}>{liveScore(b.match, i * 1.3)}%</div>
                <div className="mt-0.5 text-[9px] text-white/45">{b.status}</div>
              </div>
            </button>
          ))}
          {buyers.length === 0 && <div className="py-3 text-[11px] text-white/40">No indexed buyer in {sector} on this board.</div>}
        </div>
        <Link to="/console" className="mt-2 inline-block text-[11px] font-medium text-blue-300 hover:text-blue-200">View all buyers &rarr;</Link>
      </div>

      {/* ---- COL 2 · LIVE TRANSACTIONS ---- */}
      <div className="border-b border-white/5 px-5 py-3 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: "#45E38A" }} />
            <BoardHeader title="Live Transactions" />
          </div>
          <SessionClock />
        </div>
        <div className="mt-2 grid grid-cols-[1.4fr_1fr_0.9fr] gap-2 text-[9px] uppercase tracking-wide text-white/40">
          <span>Target Company</span><span>Best Match</span><span className="text-right">Expected / Status</span>
        </div>
        <div className="mt-1">
          {txns.map((t, i) => (
            <button key={t.company} onClick={() => setDrill(t)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 grid w-full grid-cols-[1.4fr_1fr_0.9fr] items-center gap-2 rounded border-b border-white/5 py-1.5 text-left transition-colors duration-500 last:border-0 hover:bg-white/[0.04]"
              style={i === liveRow ? { background: "rgba(96,165,250,0.10)" } : undefined}>
              <div>
                <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/90">
                  {i === liveRow && <span className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full" style={{ background: "#7CFF9F", boxShadow: "0 0 6px 1px rgba(124,255,159,.8)" }} />}
                  {t.company}
                </div>
                <div className="text-[10px] text-white/45">{t.industry}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <Mark name={t.buyer} size={18} />
                <div>
                  <div className="text-[11px] text-white/80">{t.buyer}</div>
                  <div className="text-[9px] text-white/40">{t.match}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold leading-none text-white" style={{ fontSize: 13 }}>{t.offer}</div>
                <div className="text-[10px] font-semibold" style={{ color: "#45E38A" }}>{t.premium}</div>
                <div className="mt-0.5 text-[9px] font-medium" style={{ color: t.color }}>{t.status} · <span className="text-white/35">{t.age}</span></div>
              </div>
            </button>
          ))}
          {txns.length === 0 && <div className="py-3 text-[11px] text-white/40">No disclosed deal in {sector} on this board.</div>}
        </div>
        <Link to="/console" className="mt-2 inline-block text-[11px] font-medium text-blue-300 hover:text-blue-200">View all transactions &rarr;</Link>
      </div>

      {/* ---- COL 3 · ACQUISITION DEMAND (the industry switcher) ---- */}
      <div className="px-5 py-3">
        <BoardHeader title="Acquisition Demand" right="Market Heat" />
        <div className="mt-3 space-y-2">
          {covered.map(([label, heat, bars], i) => {
            const active = sector === label;
            const liveBars = Math.max(2, Math.min(10, bars + Math.sin(beat * 0.6 + i * 1.7) * 0.4));
            return (
              <button key={label} onClick={() => toggle(label)}
                className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 block w-full rounded-md px-2 py-1 text-left transition ${active ? "bg-blue-500/15 ring-1 ring-blue-400/40" : "hover:bg-white/5"}`}>
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className={active ? "font-semibold text-blue-200" : "text-white/80"}>{label}</span>
                  <span className="text-white/45">{heat}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${liveBars * 10}%`, background: heatGradient(bars) }} />
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-[9px] uppercase tracking-wide text-white/30">Click a sector to drill the board</div>
      </div>
    </div>

    {/* ---- BOTTOM · market-activity stat bar ---- */}
    <div className="grid grid-cols-2 gap-px border-t border-white/10 sm:grid-cols-5" style={{ background: "rgba(255,255,255,.06)" }}>
      {BOARD_STATS.map((s) => (
        <div key={s.label} className="px-4 py-3.5" style={{ background: "#06182E" }}>
          <div className="font-bold leading-none tabular-nums text-white" style={{ fontSize: 18 }}>{s.value}</div>
          <div className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-white/45">{s.label}</div>
        </div>
      ))}
    </div>

    {/* ---- VERY BOTTOM · live activity ticker ---- */}
    <div className="overflow-hidden border-t border-white/10" style={{ background: "#040f1f" }}>
      <div className="flex w-max items-center gap-10 whitespace-nowrap px-4 py-2" style={{ animation: "exTicker 36s linear infinite" }}>
        {[...ACTIVITY, ...ACTIVITY].map((a, i) => (
          <span key={i} className="flex items-center gap-2 text-[10.5px]">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: a.color, boxShadow: `0 0 5px 1px ${a.color}` }} />
            <span className="text-white/75">{a.text}</span>
            <span className="font-mono text-white/40">{a.meta}</span>
          </span>
        ))}
      </div>
    </div>

    {/* ---- transaction drilldown ---- */}
    {drill && (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setDrill(null)}>
        <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0A1F3A] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-300">Disclosed transaction</div>
              <div className="mt-1 font-serif text-lg font-bold text-white">{drill.company}</div>
              <div className="text-[11px] text-white/50">{drill.industry}</div>
            </div>
            <button onClick={() => setDrill(null)} className="rounded p-1 text-white/50 hover:text-white">✕</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-[12px]">
            <Drill k="Acquirer" v={drill.buyer} />
            <Drill k="Best-match sector" v={drill.match} />
            <Drill k="Headline" v={drill.offer} accent="#7CFF9F" />
            <Drill k="Premium" v={drill.premium} accent="#45E38A" />
            <Drill k="Status" v={drill.status} />
            <Drill k="Period" v={drill.age} />
          </div>
          <button onClick={() => { setDrill(null); toggle(drill.industry); }} className="mt-4 w-full rounded-md bg-blue-600 py-2 text-[12px] font-semibold text-white transition hover:bg-blue-500">
            Filter the board to {drill.industry} →
          </button>
        </div>
      </div>
    )}
  </div>
  );
};

// Isolated 1-second clock — keeps the per-second tick out of the board tree.
const SessionClock: React.FC = () => {
  const [clock, setClock] = useState<string>(() => new Date().toLocaleTimeString("en-US", { hour12: false }));
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono text-[9px] tabular-nums text-emerald-300/80">● {clock}</span>;
};

const Drill: React.FC<{ k: string; v: string; accent?: string }> = ({ k, v, accent }) => (
  <div>
    <div className="text-[9px] uppercase tracking-wide text-white/40">{k}</div>
    <div className="mt-0.5 font-medium" style={{ color: accent ?? "rgba(255,255,255,0.9)" }}>{v}</div>
  </div>
);
const BoardHeader: React.FC<{ title: string; right?: string }> = ({ title, right }) => (
  <div className="flex items-center justify-between">
    <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-white/90">{title}</div>
    {right && <div className="text-[10px] text-white/40">{right}</div>}
  </div>
);

// ===========================================================================
// SECTION DATA
// ===========================================================================
// The lifecycle rail — stage plus the typical window in a run process.
const DATA_AS_OF = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const LIFECYCLE: ReadonlyArray<[string, string]> = [
  ["lc.signal", "day 0"], ["lc.discovery", "wk 1"], ["lc.nda", "wk 1–2"], ["lc.cim", "wk 2"],
  ["lc.meetings", "wk 2–3"], ["lc.loi", "wk 4–6"], ["lc.diligence", "wk 6–9"], ["lc.closing", "wk 10+"],
];
// Data provenance — the pipeline every figure passes through, and the
// confidence register applied to estimates (mirrors the engines' tiers).
const PROVENANCE_PIPELINE = [
  { stage: "Public record", detail: "SEC EDGAR 8-K · Wikidata · press disclosures" },
  { stage: "Curated registry", detail: `${MARKET_FMT.buyers} curated acquirer mandates` },
  { stage: "Deterministic pricing", detail: "same inputs, same answer — reproducible" },
  { stage: "The exchange", detail: "every figure on this page traces to the record" },
];
// Governance band — the controls a counterparty must clear and the controls
// that protect the founder. Stated as conditions, not features.
const GOVERNANCE = [
  { icon: "lock", title: "gov.nda.t", body: "gov.nda.b" },
  { icon: "shield", title: "gov.verify.t", body: "gov.verify.b" },
  { icon: "check", title: "gov.audit.t", body: "gov.audit.b" },
  { icon: "users", title: "gov.control.t", body: "gov.control.b" },
  { icon: "doc", title: "gov.soc.t", body: "gov.soc.b" },
];
const CONFIDENCE_TIERS = [
  { tier: "Verified", color: "#047857", basis: "Disclosed in a public filing", detail: "Headline value, dates and parties confirmed against the primary source." },
  { tier: "Reported", color: "#1d4ed8", basis: "Multiple independent reports", detail: "Cross-referenced press and database coverage; primary filing not located." },
  { tier: "Estimated", color: "#92400e", basis: "Modeled from the record", detail: "Benchmarked against the acquirer's completed-transaction history, with sample size shown." },
];
const STEPS = [
  { icon: "chart", title: "Company Analysis", body: "Valuation across weighted methodologies, market positioning, and a priced readiness score." },
  { icon: "users", title: "Buyer Discovery", body: `Engine-ranked matching across ${MARKET_FMT.buyers} curated strategic and financial mandates.` },
  { icon: "doc", title: "Data Room", body: "The diligence document checklist, with completeness by package." },
  { icon: "spark", title: "Negotiation Engine", body: "Offer scoring, counters and scenario modeling against your reservation lines." },
  { icon: "check", title: "LOI Received", body: "Manage terms, track milestones, and reduce deal risk." },
  { icon: "lock", title: "Closing & Payout", body: "Streamline closing, documents, and funds transfer." },
];
const BUYERS = REGISTRY_CARDS;
const COMMAND_FEATURES = [
  { icon: "chart", src: 3 as SourceId, value: HISTORY_FMT.events, title: "Disclosed Deals Indexed", body: "EDGAR + Wikidata sourced" },
  { icon: "users", src: 2 as SourceId, value: MARKET_FMT.buyers, title: "Buyer Mandates", body: "intent monitoring" },
  { icon: "spark", src: 2 as SourceId, value: MARKET_FMT.activeMandates, title: "Actively Deploying", body: "appetite flagged in the registry" },
  { icon: "fire", src: 2 as SourceId, value: SECTOR_DEMAND[0]?.[1] ?? "—", title: "Market Heat", body: `top sector: ${SECTOR_DEMAND[0]?.[0] ?? "—"}` },
  { icon: "globe", src: 2 as SourceId, value: MARKET_FMT.appetite, title: "Acquisition Demand", body: "check capacity indexed" },
  { icon: "doc", src: 2 as SourceId, value: MARKET_FMT.sectors, title: "Sectors Covered", body: "across the registry" },
];
const DATA_ROOMS = [
  { icon: "chart", title: "Financial Statements" },
  { icon: "doc", title: "Legal Documents" },
  { icon: "shield", title: "Contracts & IP" },
  { icon: "users", title: "Customer Data" },
  { icon: "spark", title: "Technical Due Diligence" },
  { icon: "lock", title: "Compliance & Risk" },
];
const NEGOTIATION_FEATURES = [
  { icon: "spark", title: "Offer optimization", body: "Maximise value and certainty." },
  { icon: "shield", title: "Risk analysis", body: "Understand downside scenarios." },
  { icon: "doc", title: "Term sheet generation", body: "Create investor-grade documents." },
];
// Anonymized listing-protocol cards. Codenames and banded figures only —
// identity, exact financials and the asking range unlock on a signed NDA.
// Sector/region framing mirrors the registry's real coverage.
const OPPORTUNITIES = [
  { sector: "Logistics / Freight", name: "Project Meridian", rev: "$50–75M", ebitda: "$15–20M", stage: "Teaser issued", region: "North America" },
  { sector: "Vertical SaaS", name: "Project Basalt", rev: "$100–150M", ebitda: "$30–40M", stage: "In diligence", region: "Europe" },
  { sector: "Cybersecurity", name: "Project Aurelia", rev: "$75–125M", ebitda: "$25–35M", stage: "NDA stage", region: "Global" },
  { sector: "AI Infrastructure", name: "Project Caldera", rev: "$75–100M", ebitda: "$20–30M", stage: "Management meetings", region: "Asia-Pacific" },
];
const GLOBAL_STATS = [
  { value: MARKET_FMT.geographies, label: "Jurisdictions" },
  { value: MARKET_FMT.buyers, label: "Acquirer Mandates" },
  { value: MARKET_FMT.appetite, label: "Check Capacity" },
  { value: MARKET_FMT.sectors, label: "Sectors Covered" },
];

// ===========================================================================
// SMALL VISUAL HELPERS
// ===========================================================================
// Cross-bid comparison instrument. Figures are an internally-consistent
// illustration of the desk's scoring; on a live process the same table runs
// against the founder's actual offers and reservation lines.
const OfferTable: React.FC = () => (
  <div className="overflow-hidden rounded-lg p-4 text-white" style={{ background: "linear-gradient(180deg,#08203B,#06182E)" }}>
    <div className="flex items-center justify-between">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Cross-Bid Comparison</div>
      <div className="text-[9px] uppercase tracking-wide text-white/35">scored vs reservation lines</div>
    </div>
    <table className="mt-3 w-full text-left text-[12px]">
      <thead className="text-white/45">
        <tr>{["Measure", "Buyer A", "Buyer B", "Buyer C"].map((h, i) => <th key={h} scope="col" className={`pb-2 font-semibold ${i === 0 ? "sr-only" : ""}`}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {[
          ["Upfront Cash", "$172M", "$190M", "$140M"],
          ["Earnout", "$22M", "—", "$31M"],
          ["Rollover", "$18M", "$25M", "—"],
          ["Total", "$212M", "$215M", "$171M"],
          ["Certainty-weighted", "$198M", "$209M", "$152M"],
          ["Desk score", "84 / 100", "91 / 100", "66 / 100"],
        ].map((r) => (
          <tr key={r[0]} className={"border-t border-white/5 " + (r[0] === "Total" || r[0] === "Desk score" ? "font-bold" : "")}>
            <td className="py-2 text-white/50">{r[0]}</td>
            <td className="py-2" style={r[0] === "Total" ? { color: "#7CFF9F" } : undefined}>{r[1]}</td>
            <td className="py-2" style={r[0] === "Total" || r[0] === "Desk score" ? { color: "#7CFF9F" } : undefined}>{r[2]}</td>
            <td className="py-2" style={r[0] === "Total" ? { color: "#7CFF9F" } : undefined}>{r[3]}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="mt-3 border-t border-white/10 pt-2 text-[10px] text-white/40">
      Headline ≠ outcome. Every bid is weighted by structure, certainty and counterparty record — B leads on certainty despite A&rsquo;s earnout package.
    </div>
  </div>
);

const Vault: React.FC = () => (
  <svg viewBox="0 0 140 120" className="h-24 w-28">
    <rect x="34" y="22" width="72" height="76" rx="8" fill="#13355f" stroke="#58C6FF" strokeOpacity="0.5" />
    <rect x="42" y="30" width="56" height="60" rx="5" fill="#0c244a" />
    <circle cx="70" cy="60" r="16" fill="none" stroke="#58C6FF" strokeWidth="2.5" />
    <path d="M63 60l5 5 10-10" fill="none" stroke="#5AD1FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <g stroke="#58C6FF" strokeOpacity="0.6" strokeWidth="2"><line x1="70" y1="40" x2="70" y2="46" /><line x1="70" y1="74" x2="70" y2="80" /><line x1="50" y1="60" x2="56" y2="60" /><line x1="84" y1="60" x2="90" y2="60" /></g>
  </svg>
);

// Global acquisition network — dot map with named regional hubs and animated
// acquisition-flow arcs connecting the regions.
// Equirectangular geomap: a dot grid masked to coarse continent polygons so all
// continents read (like a network world-map). [lon,lat] → SVG via project().
const MAP_W = 960, MAP_H = 480;
const project = (lon: number, lat: number): [number, number] => [((lon + 180) / 360) * MAP_W, ((90 - lat) / 180) * MAP_H];
const LANDMASS: [number, number][][] = [
  // North America
  [[-168,66],[-150,70],[-120,70],[-95,69],[-80,73],[-60,83],[-55,60],[-66,49],[-72,46],[-76,38],[-81,31],[-81,25],[-90,29],[-97,26],[-105,22],[-114,30],[-124,40],[-124,48],[-130,55],[-140,60],[-155,58],[-166,55]],
  // Greenland
  [[-46,60],[-22,70],[-30,82],[-50,82],[-58,76],[-54,68]],
  // South America
  [[-78,8],[-66,11],[-55,5],[-50,0],[-44,-3],[-40,-12],[-38,-23],[-48,-27],[-58,-35],[-66,-46],[-73,-53],[-75,-46],[-71,-33],[-76,-14],[-81,-5],[-80,2]],
  // Africa
  [[-16,15],[-6,24],[10,31],[20,33],[32,31],[44,11],[51,12],[43,-2],[40,-12],[33,-26],[25,-34],[18,-35],[12,-17],[9,4],[-8,5],[-16,15]],
  // Europe
  [[-10,43],[-5,38],[5,38],[12,38],[18,40],[26,40],[28,45],[42,46],[40,55],[30,60],[24,66],[12,64],[6,58],[2,51],[-5,49]],
  // Asia
  [[26,40],[30,46],[42,48],[48,52],[60,66],[80,73],[105,76],[140,73],[170,68],[180,64],[165,60],[155,52],[140,48],[130,42],[122,38],[120,30],[110,21],[105,9],[95,6],[88,21],[78,8],[72,18],[60,25],[50,30],[44,38],[36,36],[28,37]],
  // Australia
  [[114,-22],[124,-17],[133,-12],[142,-11],[146,-18],[150,-25],[153,-31],[148,-38],[138,-37],[129,-32],[118,-35],[114,-30]],
  // misc
  [[130,31],[140,38],[142,44],[138,40],[133,34]], // Japan
  [[166,-46],[174,-41],[178,-38],[172,-45]],        // NZ
  [[43,-25],[50,-15],[50,-22],[46,-26]],            // Madagascar
  [[95,2],[110,0],[120,-2],[120,-8],[105,-8],[98,-3]], // Indonesia
];
const inPoly = (x: number, y: number, poly: [number, number][]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const isLandLL = (lon: number, lat: number) => LANDMASS.some((p) => inPoly(lon, lat, p));
// regional hubs at real coordinates
const HUBS: { name: string; lon: number; lat: number }[] = [
  { name: "na", lon: -98, lat: 39 }, { name: "eu", lon: 9, lat: 50 }, { name: "me", lon: 45, lat: 26 },
  { name: "asia", lon: 110, lat: 30 }, { name: "sa", lon: -58, lat: -15 }, { name: "au", lon: 134, lat: -25 },
];
const FLOWS: [string, string][] = [
  ["na", "eu"], ["eu", "me"], ["me", "asia"], ["na", "asia"], ["eu", "asia"], ["sa", "na"], ["asia", "au"], ["na", "sa"],
];
// True when the visitor asked for reduced motion (OS setting); updates live.
const useReducedMotion = (): boolean => {
  const q = "(prefers-reduced-motion: reduce)";
  const [reduce, setReduce] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(q).matches);
  useEffect(() => {
    const m = window.matchMedia?.(q);
    if (!m) return;
    const on = (): void => setReduce(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduce;
};

const WorldDots: React.FC = () => {
  const reduce = useReducedMotion();
  const dots = React.useMemo(() => {
    const out: [number, number][] = [];
    for (let lat = 78; lat >= -56; lat -= 2.6) {
      for (let lon = -178; lon <= 180; lon += 2.6) {
        if (isLandLL(lon, lat)) { const [x, y] = project(lon, lat); out.push([x, y]); }
      }
    }
    return out;
  }, []);
  const hub = (n: string) => { const h = HUBS.find((x) => x.name === n)!; return project(h.lon, h.lat); };
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full">
      {dots.map(([x, y], i) => <rect key={i} x={x - 0.9} y={y - 0.9} width={1.8} height={1.8} fill="#5AD1FF" opacity={0.5} />)}
      {/* acquisition-flow arcs with travelling pulses */}
      {FLOWS.map(([a, b], i) => {
        const [x1, y1] = hub(a), [x2, y2] = hub(b);
        const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.16 - 24;
        const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="#2E8BD6" strokeWidth="1.1" opacity="0.5" />
            {!reduce && <circle r="2.8" fill="#A8FFFF"><animateMotion dur={`${4 + (i % 4)}s`} repeatCount="indefinite" path={d} /></circle>}
          </g>
        );
      })}
      {HUBS.map((h, i) => { const [x, y] = project(h.lon, h.lat); return (
        <g key={i}><circle cx={x} cy={y} r="10" fill="#2E8BD6" opacity="0.22" /><circle cx={x} cy={y} r="3.4" fill="#A8FFFF" /></g>
      ); })}
    </svg>
  );
};

export default Landing;
