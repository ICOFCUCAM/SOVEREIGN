import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MarketingChrome, Mark, Arrow, Chapter, Editorial } from "../components/MarketingChrome";
import { MARKET_FMT, MANDATE_ACTIVITY, DISCLOSED_TRANSACTIONS, BOARD_BUYERS, SECTOR_DEMAND, HISTORY_FMT, LEDGER_ROWS, LEDGER_TIERS, LEDGER_PRICED, DEAL_INTEL_FMT, type BoardTx } from "../lib/market-stats";
import { useI18n } from "../lib/i18n";
import QuickValue from "../components/QuickValue";
import Instrument from "../components/Instrument";
import LedgerTable from "../components/LedgerTable";
import CountUp from "../components/CountUp";
import ChapterRail from "../components/ChapterRail";
import LifecycleBand from "../components/LifecycleBand";
import PhoneActionBar from "../components/PhoneActionBar";
import ProofSection from "../components/ProofSection";
import ModulePreview from "../components/ModulePreview";
import SignatureLine from "../components/SignatureLine";
import AmbientVideo from "../components/AmbientVideo";
import ExchangeMap from "../components/ExchangeMap";
import { Note, SourcesSection, type SourceId } from "../components/SourceNotes";
import { MARKET_INDEX_FMT } from "../lib/market-index";
import { MODULE_NUMS as N } from "../lib/module-stats";

// Chapter 06: four founder modules in the order a sale uses them. Their stats
// come from the engines and appear nowhere else on the page (AA5, AA6).
const HOME_MODULES: ReadonlyArray<[string, string, Record<string, number>]> = [
  ["Exit Readiness Score", "readiness", { a: N.readinessDimensions, b: N.fixesPriced }],
  ["Valuation Engine", "valuation", { a: N.methodologies, b: N.reportTypes }],
  ["Documents", "documents", { a: N.documentKinds }],
  ["Data Room", "dataRoom", { a: N.diligencePackages, b: N.artifactsIndexed }],
];

// Public marketing home — the front door to ExitOS, wrapped in the shared
// marketing chrome (header nav → Platform / Modules / Pricing + footer).
// Editorial layout from the index(9) skeleton: an editorial-serif headline
// beside the coded "Acquisition Command Center" board, a lifecycle band, then
// numbered chapters on hairline rules. Colours are the locked ExitOS palette.
// Company marks are brand-coloured monogram placeholders.

const WRAP = "mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12";
const H2 = "font-editorial text-[clamp(2.25rem,4.6vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em]";
const BTN = "inline-flex items-center gap-5 px-5 py-3.5 text-[12px] font-semibold transition";


/** Chapter arrivals: each chapter's headline rises into place the first time it
 *  enters the view. Chapters already in view on load are shown at once; nothing
 *  is hidden when the reader prefers reduced motion or the observer is missing. */
const useChapterReveal = (): void => {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const secs = [...document.querySelectorAll<HTMLElement>('[id^="ch-"]')];
    for (const el of secs) if (el.getBoundingClientRect().top < innerHeight) el.classList.add("rv-in");
    document.documentElement.classList.add("rv-on");
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add("rv-in"); io.unobserve(e.target); } }, { rootMargin: "0px 0px -15% 0px" });
    for (const el of secs) if (!el.classList.contains("rv-in")) io.observe(el);
    return () => { io.disconnect(); document.documentElement.classList.remove("rv-on"); };
  }, []);
};

const Landing: React.FC = () => {
  useChapterReveal();
  const nav = useNavigate();
  const { t } = useI18n();
  return (
    <MarketingChrome active="home">
      <ChapterRail />
      <PhoneActionBar />
      <div className="relative">
        <SignatureLine />
      {/* ===== 01 · HERO — after the owner's index(2).html (DD2), in the locked palette ===== */}
      <section id="ch-01" className="relative isolate flex min-h-[min(880px,calc(100vh-72px))] flex-col overflow-hidden">
        {/* the field: ivory on the left, the exchange ink on the right (owner, DD5 → EE2), stacked on phones; the seam eased (DD7) */}
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 70% at 79% 40%, var(--ex-glow), transparent 70%), linear-gradient(180deg, var(--ex-1) 0%, #061629 60%, var(--ex-0) 100%)" }} />
        {/* a fine grain on the black, and the floor darkening toward the strip; the ivory is laid over both */}
        <div aria-hidden className="absolute inset-0 opacity-[0.07] mix-blend-screen" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(4,12,24,0.55), transparent 22%)" }} />
        <div aria-hidden className="absolute inset-0 hidden md:block" style={{ background: "linear-gradient(90deg, #f6f8fb 0%, #f6f8fb 30%, rgba(246,248,251,0.97) 35%, rgba(246,248,251,0.9) 40%, rgba(246,248,251,0.78) 44%, rgba(246,248,251,0.6) 48%, rgba(246,248,251,0.4) 52%, rgba(246,248,251,0.22) 56%, rgba(246,248,251,0.1) 60%, rgba(246,248,251,0.03) 64%, transparent 68%)" }} />
        <div aria-hidden className="absolute inset-0 md:hidden" style={{ background: "linear-gradient(180deg, rgba(246,248,251,0.99) 0%, rgba(246,248,251,0.96) 70%, rgba(246,248,251,0) 100%)" }} />

        <div className={`${WRAP} relative flex flex-1 items-center py-16 lg:py-20`}>
          <div className="max-w-[640px] text-ink-900">
            <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em]"><span aria-hidden className="h-px w-7 bg-blue-600" />{t("hx.eyebrow")}</div>
            <h1 className="mt-7 -ml-[0.045em] font-editorial text-[clamp(3.1rem,5.6vw,5.5rem)] font-semibold leading-[0.97] tracking-[-0.045em] [font-kerning:normal] [font-optical-sizing:auto] [font-feature-settings:'kern','liga','calt']">
              {t("hx.h1")} <em className="-ml-[0.02em] italic tracking-[-0.035em] text-blue-600">{t("hx.h1em")}</em>
            </h1>
            <p className="mt-6 max-w-[440px] text-[15px] leading-[1.85] text-slate-700">{t("hx.body")}</p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <button onClick={() => nav("/platform")} className={`${BTN} bg-ink-900 text-white hover:bg-blue-700`}>{t("hx.explore")} <Arrow /></button>
              <a href="#ch-04" className={`${BTN} border border-ink-900/70 text-ink-900 hover:bg-ink-900 hover:text-white md:border-ink-900/40 md:bg-white/30 md:backdrop-blur-sm`}>{t("bar.value")} <span aria-hidden>↓</span></a>
            </div>
          </div>
        </div>
        {/* the watermark on the black side: the ExitOS mark and signature, faint (owner, DD4; refined DD7) */}
        <div aria-hidden className="hx-mark pointer-events-none absolute right-[11%] top-1/2 hidden -translate-y-[56%] select-none flex-col items-center md:flex">
          <svg viewBox="0 0 100 100" className="h-[min(28vw,420px)] w-[min(28vw,420px)]" fill="none">
            <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.05)" strokeWidth="0.35" />
            <circle cx="50" cy="50" r="33" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="22" stroke="rgba(255,255,255,0.05)" strokeWidth="0.35" strokeDasharray="0.6 2.2" />
            <g stroke="rgba(255,255,255,0.08)" strokeWidth="0.3">
              {Array.from({ length: 72 }, (_, k) => { const a = (k * 5 * Math.PI) / 180, r1 = k % 6 ? 42 : 40; return <line key={k} x1={50 + r1 * Math.cos(a)} y1={50 + r1 * Math.sin(a)} x2={50 + 44 * Math.cos(a)} y2={50 + 44 * Math.sin(a)} />; })}
            </g>
            <g stroke="rgba(255,255,255,0.16)" strokeWidth="0.5" strokeLinecap="round">
              <line x1="50" y1="13" x2="50" y2="24" /><line x1="50" y1="76" x2="50" y2="87" />
              <line x1="13" y1="50" x2="24" y2="50" /><line x1="76" y1="50" x2="87" y2="50" />
            </g>
            <circle cx="50" cy="50" r="1.6" fill="rgba(52,211,153,0.55)" />
            <circle cx="50" cy="50" r="5" stroke="rgba(52,211,153,0.2)" strokeWidth="0.4" />
          </svg>
          <div className="-mt-[1.6vw] font-editorial font-semibold leading-none tracking-[-0.05em] text-transparent"
            style={{ fontSize: "min(7vw, 104px)", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
            Exit<span className="italic">OS</span>
          </div>
          <div className="mt-4 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.42em] text-white/20"><span className="h-px w-8 bg-white/15" />The acquisition exchange<span className="h-px w-8 bg-white/15" /></div>
        </div>
        {/* the vertical note on the black side */}
        <div aria-hidden className="absolute bottom-40 right-[88px] hidden flex-col items-center gap-4 lg:flex">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-white/55" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{t("hx.note")}</span>
          <span className="h-11 w-px bg-white/25" />
        </div>

        {/* the capability strip: a lit seam on top; each capability lights its own edge on hover (EE7) */}
        <ul aria-label={t("hx.strip")} className="ex-seam relative grid bg-ex-0/95 text-white sm:grid-cols-2 lg:grid-cols-5">
          {([["◎", 1], ["♧", 2], ["↗", 3], ["▤", 4], ["⌁", 5]] as const).map(([icon, k], i) => (
            <li key={k} className={`group relative flex gap-3.5 px-5 py-6 transition-colors duration-300 hover:bg-white/[0.03] sm:px-8 lg:px-5 ${i ? "border-t border-white/10 sm:border-t-0 lg:border-l" : ""} ${i % 2 ? "sm:border-l" : ""} sm:border-white/10 lg:first:pl-[max(1.5rem,calc((100vw-1480px)/2+3rem))]`}>
              <span aria-hidden className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-blue-400 transition-transform duration-500 group-hover:scale-x-100 motion-reduce:transition-none" />
              <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-editorial text-[17px] leading-none text-blue-300 ring-1 ring-white/10 transition duration-300 group-hover:ring-blue-400/60">{icon}</span>
              <span>
                <span className="block pt-0.5 font-editorial text-[17px] font-semibold">{t(`hx.s${k}`)}</span>
                <span className="mt-1.5 block max-w-[200px] text-[12px] leading-relaxed text-blue-100/75">{t(`hx.s${k}d`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== 02 · INTELLIGENCE MEETS OPPORTUNITY — index(2) section 2, with our lifecycle graph in its box (DD2) ===== */}
      <section id="ch-02" aria-labelledby="s2-h" className="border-b border-slate-200 bg-ex-paper text-ink-900">
        <div className={`${WRAP} grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-[clamp(40px,5vw,84px)] lg:py-28`}>
          <div>
            <Chapter n="02">{t("s2.kicker")}</Chapter>
            <h2 id="s2-h" className="rv-h mt-6 font-editorial text-[clamp(2.6rem,4.2vw,4rem)] font-semibold leading-[1.04] tracking-[-0.035em]">{t("s2.h2")} <em className="italic text-blue-600">{t("s2.h2em")}</em></h2>
            <p className="mt-6 max-w-[460px] text-[15px] leading-[1.85] text-slate-600">{t("s2.body")}</p>
            {/* the proof figures, with their notes */}
            <div className="mt-9 grid grid-cols-3 border-t border-ink-900">
              {[
                [MARKET_INDEX_FMT.events, t("ribbon.deals")],
                [MARKET_FMT.buyers, t("ribbon.mandates")],
                [HISTORY_FMT.disclosedValue, t("ribbon.value")],
              ].map(([v, l], i) => (
                <div key={l} className={`relative pr-3 pt-5 ${i ? "border-l border-slate-300 pl-3 sm:pl-5" : ""}`}>
                  <span aria-hidden className={`hero-rule absolute -top-px h-[2px] bg-blue-600 ${i ? "left-3 right-3 sm:left-5" : "left-0 right-3"}`} style={{ animationDelay: `${0.2 + i * 0.15}s` }} />
                  <div className="font-editorial text-[clamp(1.7rem,2.6vw,2.5rem)] font-semibold leading-none tracking-[-0.03em]"><CountUp value={v} /></div>
                  <div className="mt-2 text-[12.5px] text-slate-600">{l}<Note n={([1, 2, 3] as SourceId[])[i]} first /></div>
                </div>
              ))}
            </div>
            <p data-edition className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600"><span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-ex-done-ink" />{t("hero.fresh", { d: MARKET_INDEX_FMT.asOf })}</p>
            <Link to="/platform" className="mt-8 inline-flex items-center gap-3 border-b border-blue-600 pb-2.5 text-[13px] font-semibold text-ink-900 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{t("s2.link")} <span aria-hidden>→</span></Link>
          </div>
          {/* the right-hand box: the lifecycle graph alone (DD3), its caption beneath */}
          <figure className="m-0 min-w-0">
            {/* an object on the paper, not a fourth dark band: a fine ink bezel with a lit top edge and corner registers (EE10) */}
            <div className="relative rounded-[10px] bg-ex-0 p-[5px] shadow-[inset_0_1px_0_rgba(200,225,255,0.16),0_0_0_1px_rgba(10,33,66,0.12),0_40px_80px_-40px_rgba(7,26,49,0.6),0_18px_36px_-24px_rgba(7,26,49,0.35)]">
              <div className="relative overflow-hidden rounded-[6px]">
                <ExchangeMap dark compact bare />
              </div>
              {(["left-2 top-2 border-l border-t", "right-2 top-2 border-r border-t", "left-2 bottom-2 border-l border-b", "right-2 bottom-2 border-r border-b"] as const).map((c) => (
                <span key={c} aria-hidden className={`pointer-events-none absolute h-3 w-3 border-blue-300/40 ${c}`} />
              ))}
            </div>
            <figcaption className="mt-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">
              <span aria-hidden className="h-3 w-3 shrink-0 bg-blue-600" /><span>{t("lifecycle.title")} · {t("lifecycle.live")}<Note n={6} first /></span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ===== 03 · THE EXCHANGE — the board as the instrument ===== */}
      <section id="ch-03" aria-labelledby="hall-h">
        <Instrument head={
          <div className={`${WRAP} relative pb-16 pt-20 text-white`}>
            <Chapter n="03" dark>{t("hall.eyebrow")}</Chapter>
            <h2 id="hall-h" className="rv-h mt-5 max-w-[18ch] font-editorial text-[clamp(2.6rem,5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.04em]">{t("hall.h2")} <em className="italic text-blue-300">{t("hall.h2em")}</em></h2>
          </div>
        }>
          {/* the screen: exchange ribbon + board, content unchanged */}
          <div data-hall-screen className="rounded-[6px] bg-[#0a1626] p-1.5">
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
        </Instrument>
        <style>{`
          @keyframes exTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
          @keyframes heroRule{from{transform:scaleX(0)}to{transform:scaleX(1)}}
          .rv-on .rv-h{transition:opacity 1s cubic-bezier(.2,.7,.2,1),transform 1s cubic-bezier(.2,.7,.2,1)}
          .rv-on [id^="ch-"]:not(.rv-in) .rv-h{opacity:0;transform:translateY(30px)}
          main h1,main h2,main h3{text-wrap:balance}
          main p{text-wrap:pretty;hanging-punctuation:first last}
          main p.font-editorial{font-variant-numeric:oldstyle-nums proportional-nums}
          @media (prefers-reduced-motion: no-preference){.hx-mark{animation:hxMark 2.4s cubic-bezier(.2,.7,.2,1) .3s both}.hx-mark svg{animation:hxDial 3.2s cubic-bezier(.2,.7,.2,1) .3s both}}
          @keyframes hxMark{from{opacity:0;filter:blur(6px)}to{opacity:1;filter:none}}
          @keyframes hxDial{from{transform:rotate(-24deg) scale(.96)}to{transform:none}}
          @media (prefers-reduced-motion: no-preference){.hero-rule{transform-origin:left;animation:heroRule .9s cubic-bezier(.2,.7,.2,1) both}}
          @keyframes exScan{0%{transform:translateY(-100%);opacity:0}8%{opacity:1}50%{opacity:.5}92%{opacity:1}100%{transform:translateY(2000%);opacity:0}}
          @keyframes exFlash{0%,100%{background:transparent}50%{background:rgba(96,165,250,.10)}}
          @keyframes exTravel{0%{left:0;opacity:0}6%{opacity:1}94%{opacity:1}100%{left:100%;opacity:0}}
        `}</style>
      </section>

      {/* the acquisition lifecycle — the original rail, set as an interlude after the board (owner, DD6/DD7) */}
      <LifecycleBand />

      {/* ===== 04 · VALUE YOUR COMPANY — the working product moment ===== */}
      <QuickValue n="04" />

      {/* ===== 05 · THE THESIS — one statement, set like a front page ===== */}
      <section id="ch-05" className="border-b border-slate-200 bg-ex-paper">
        <div className={`${WRAP} py-16 sm:py-20 lg:py-24`}>
          <Chapter n="05">{t("loss.eyebrow")}</Chapter>
          <h2 className="rv-h mt-6 max-w-[16ch] font-editorial text-[clamp(3rem,7.4vw,7.6rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-ink-900"><Editorial text={t("loss.h2")} /></h2>
          <div className="mt-12 grid gap-10 border-t-4 border-double border-ink-900 pt-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:gap-[5vw]">
            <p className="max-w-md text-[16px] leading-relaxed text-ink-800 first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-editorial first-letter:text-[4.2rem] first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-blue-700">{t("loss.body", { p: DEAL_INTEL_FMT.medianPremium, d: DEAL_INTEL_FMT.medianClose })}<Note n={4} first /></p>
            {/* comparison matrix, set as a broadsheet table */}
            <div role="region" aria-label="Traditional sale compared with ExitOS" tabIndex={0} className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-ink-900 font-mono text-[10.5px] uppercase tracking-[0.14em]">
                    <th scope="col" className="py-3 pr-4 font-semibold text-slate-600"><span className="sr-only">Dimension</span></th>
                    <th scope="col" className="border-l border-slate-300 px-4 py-3 font-semibold text-slate-600">Traditional Sale</th>
                    <th scope="col" className="border-l border-slate-300 px-4 py-3 font-semibold text-ink-900">With ExitOS</th>
                  </tr>
                </thead>
                <tbody>
                  {LOSSES.map((l) => (
                    <tr key={l.problem} className="border-b border-slate-300 last:border-0">
                      <th scope="row" className="py-4 pr-4 align-top font-editorial text-[19px] font-semibold text-ink-900">{l.dimension}</th>
                      <td className="border-l border-slate-300 px-4 py-4 align-top text-[13px] text-slate-600"><span className="mr-1.5 text-red-600" aria-hidden>✕</span>{l.problem}</td>
                      <td className="border-l border-slate-300 px-4 py-4 align-top text-[13px] font-medium text-ink-900"><span className="mr-1.5 text-blue-700" aria-hidden>✓</span>{l.fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 06 · THE TRANSACTION RECORD — the ledger ===== */}
      <section id="ch-06" className="border-b border-slate-200 bg-white">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div>
            <Chapter n="06">{t("rec.eyebrow")}</Chapter>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <h2 className={`rv-h ${H2} max-w-[20ch] text-ink-900`}><Editorial text={t("rec.h2")} /></h2>
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

          {/* front page — the three latest deals, printed on ink: the page's dark pause between the light chapters (EE12) */}
          <div className="ex-seam relative grid overflow-hidden text-white sm:grid-cols-3" style={{ background: "radial-gradient(ellipse 60% 90% at 50% 0%, var(--ex-glow), transparent 70%), linear-gradient(180deg, var(--ex-1), var(--ex-0))" }}>
            {LEDGER_ROWS.slice(0, 3).map((c, i) => (
              <article key={c.target} className={`px-6 py-8 sm:px-7 ${i > 0 ? "sm:border-l sm:border-white/10" : ""} border-b border-white/10 last:border-b-0 sm:border-b-0`}>
                <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-blue-200/75">
                  <span>{c.sector}</span><time dateTime={c.date}>{c.date}</time>
                </div>
                <h3 className="mt-4 font-editorial text-[clamp(1.4rem,2.2vw,1.9rem)] font-semibold leading-[1.1] text-white">
                  {c.buyer} <span className="italic text-blue-300">{c.status === "Closed" ? "acquired" : c.status === "Terminated" ? "ended its deal for" : "agreed to acquire"}</span> {c.target}
                </h3>
                <div className="mt-5 font-editorial text-[clamp(2.4rem,4vw,3.4rem)] font-semibold leading-none tabular-nums text-white">{c.value}</div>
                <div className="mt-2 text-[12px] text-blue-100/70">Disclosed value</div>
                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-[11px]">
                  <div><dt className="text-blue-100/70">vs reference</dt><dd className="font-mono text-[14px] font-bold text-blue-300">{c.premium}</dd></div>
                  <div><dt className="text-blue-100/70">Status</dt><dd className={`font-mono text-[14px] font-bold ${c.status === "Closed" ? "text-ex-done" : c.status === "Terminated" ? "text-slate-300" : "text-amber-300"}`}>{c.status}</dd></div>
                  <div><dt className="text-blue-100/70">Source</dt><dd className="font-mono text-[12px] font-semibold text-white">{c.sources[0]?.kind ?? "—"}</dd></div>
                </dl>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* the ledger table: searchable, filterable, sortable */}
          <LedgerTable />
          <aside aria-labelledby="ledger-read" className="self-start border-t-4 border-double border-ink-900 pt-3 lg:sticky lg:top-24">
            <h3 id="ledger-read" className="font-editorial text-[18px] font-semibold text-ink-900">{t("ledger.read")}</h3>
          {/* confidence-tier register */}
            <div className="border-y border-ink-900">
              <div className="flex items-center justify-between border-b border-slate-200 py-3">
                <span className="text-[13px] font-semibold text-ink-900">Confidence register</span>
                <span className="text-[12px] text-slate-600">applied to every estimate</span>
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
                Sources: SEC EDGAR 8-K filings, Wikidata, press disclosures · refreshed with the registry<Note n={3} />
              </div>
            </div>
          </aside>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-slate-600">
            Every entry is curated from the source shown. Record tier: {Object.entries(LEDGER_TIERS).map(([k, n]) => `${n} ${k}`).join(", ")} — not re-checked against the primary filing in this build.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-slate-300 px-5 py-4">
            <span className="text-[13.5px] text-slate-700">{t("rec.bridge")}</span>
            <button onClick={() => nav("/console")} className={`${BTN} bg-ink-900 text-white hover:bg-ink-800`}>{t("rec.run")} <Arrow /></button>
          </div>
        </div>
      </section>

      {/* ===== 07 · THE MODULES — the site's own catalogue, live engine stats (Z3) ===== */}
      <section id="ch-07" aria-labelledby="mods-h" className="border-b border-slate-200 bg-white text-ink-900">
        <div className={`${WRAP} py-16 sm:py-20 lg:py-24`}>
          <div className="border-t-4 border-double border-ink-900 pt-8">
            <Chapter n="07">{t("mods.eyebrow")}</Chapter>
            <h2 id="mods-h" className="rv-h mt-6 max-w-[22ch] font-editorial text-[clamp(2.75rem,5.8vw,5.6rem)] font-semibold leading-[0.94] tracking-[-0.045em]"><Editorial text={t("mods.h2")} /></h2>
          </div>
          <div className="mt-12 border-t border-ink-900">
            {HOME_MODULES.map(([name, key, v], k) => (
              <details key={name} open={k === 0} className="group border-b border-slate-300">
                <summary className="grid cursor-pointer list-none grid-cols-[28px_1fr_36px] items-center gap-x-3 gap-y-1.5 py-6 transition-colors hover:bg-[#f6f8fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:grid-cols-[58px_1fr_1fr_44px] sm:gap-x-5 sm:py-7 [&::-webkit-details-marker]:hidden">
                  <span className="font-mono text-[11px] text-blue-600">0{k + 1}</span>
                  <h3 className="font-editorial text-[clamp(1.4rem,2.5vw,2.2rem)] font-semibold tracking-[-0.03em]">{name}</h3>
                  <div className="col-start-2 row-start-2 max-w-[440px] sm:col-start-3 sm:row-start-1">
                    <p className="text-[14px] leading-relaxed text-slate-600">{t(`mod.${key}`)}</p>
                    <p className="mt-1.5 font-mono text-[11.5px] tabular-nums text-ink-900">{t(`mod.${key}.st`, v)}</p>
                  </div>
                  <span aria-hidden className="col-start-3 row-span-2 row-start-1 grid h-9 w-9 place-items-center justify-self-end rounded-full border border-slate-300 text-[18px] text-blue-600 transition group-open:rotate-45 group-open:border-blue-600 group-open:bg-blue-600 group-open:text-white sm:col-start-4 sm:row-span-1">+</span>
                </summary>
                <div className="mb-7 rounded-[4px] border border-slate-200 bg-[#f6f8fb] p-5 sm:ml-[78px] sm:p-7">
                  <ModulePreview id={key} />
                  <Link to="/modules" className="mt-6 inline-flex items-center gap-3 border border-ink-900 px-4 py-2.5 text-[12px] font-semibold text-ink-900 transition hover:bg-ink-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{t("mods.open")} <span aria-hidden>→</span></Link>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* real client proof — renders nothing until lib/proof.ts holds entries (CC4, gate G2) */}
      <ProofSection />

      {/* ===== 08 · QUESTIONS — what founders ask first, answered from the Pricing and Platform pages ===== */}
      <section id="ch-08" aria-labelledby="faq-h" className="border-b border-slate-200 bg-ex-paper text-ink-900">
        <div className={`${WRAP} py-16 sm:py-20 lg:py-24`}>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-[6vw]">
            <div className="border-t-4 border-double border-ink-900 pt-8">
              <Chapter n="08">{t("faq.eyebrow")}</Chapter>
              <h2 id="faq-h" className="rv-h mt-6 font-editorial text-[clamp(2.75rem,5.2vw,5rem)] font-semibold leading-[0.94] tracking-[-0.045em]"><Editorial text={t("faq.h2")} /></h2>
              <div className="mt-10 rounded-[4px] p-6 text-white" style={{ background: "linear-gradient(135deg, var(--ex-1) 0%, var(--ex-2) 100%)" }}>
                <p className="font-editorial text-[1.35rem] font-semibold leading-snug">{t("faq.more")}</p>
                <button onClick={() => nav("/pricing")} className={`${BTN} mt-5 bg-white text-ink-900 hover:bg-blue-50`}>{t("cta.brief")} <span aria-hidden>↗</span></button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <details key={k} className="group rounded-[4px] border border-slate-300 bg-white shadow-[0_1px_0_rgba(10,16,24,0.04)] transition-shadow open:border-blue-600 open:shadow-[0_18px_40px_-20px_rgba(6,24,46,0.45)]">
                  <summary className="flex cursor-pointer list-none items-center gap-5 rounded-[4px] px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:px-6 [&::-webkit-details-marker]:hidden">
                    <span className="font-mono text-[12px] font-semibold tabular-nums text-blue-600">0{k}</span>
                    <span className="flex-1 font-editorial text-[clamp(1.15rem,1.7vw,1.45rem)] font-semibold">{t(`faq.q${k}`)}</span>
                    <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-300 text-[18px] leading-none text-blue-600 transition group-open:rotate-45 group-open:border-blue-600 group-open:bg-blue-600 group-open:text-white">+</span>
                  </summary>
                  <p className="max-w-[62ch] border-t border-slate-200 px-5 pb-6 pt-4 text-[15.5px] leading-relaxed text-slate-700 sm:ml-[52px] sm:border-t-0 sm:px-6 sm:pt-0">{t(`faq.a${k}`)}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 09 · THE NEXT MOVE — the back page ===== */}
      <section id="ch-09" className="relative overflow-hidden text-white" style={{ background: "var(--ex-field)" }}>
        {/* a quiet film of a meeting under an ink veil (placeholder footage, pre-launch gate G1) */}
        <AmbientVideo src="/media/boardroom-loop.mp4" webm="/media/boardroom-loop.webm" poster="/media/boardroom-poster.jpg" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.38] mix-blend-luminosity" />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, var(--ex-1) 0%, rgba(7,26,49,0.62) 28%, rgba(7,26,49,0.72) 62%, var(--ex-0) 100%), linear-gradient(90deg, rgba(4,12,24,0.85) 0%, rgba(4,12,24,0.35) 55%, rgba(4,12,24,0.6) 100%)" }} />
        {/* the bookend: the hero's ink and light return at the close */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[70%] w-[80%] -translate-x-1/2 rounded-[50%] opacity-40 blur-[110px]" style={{ background: "radial-gradient(ellipse at center, rgba(56,130,246,0.55), transparent 70%)" }} />
        <div className={`${WRAP} relative py-20 sm:py-24 lg:py-32`}>
          <div className="border-t-4 border-double border-white/50 pt-8">
            <Chapter n="09" dark>{t("cta.eyebrow")}</Chapter>
            <div className="mt-6 grid items-end gap-10 lg:grid-cols-[1fr_auto]">
              <h2 className="rv-h font-editorial text-[clamp(3rem,7vw,7rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-white"><Editorial text={t("cta.h2")} dark /></h2>
              <div className="flex flex-wrap gap-2.5 lg:flex-col lg:items-stretch">
                <button onClick={() => nav("/console")} className={`${BTN} justify-between bg-white text-ink-900 hover:bg-blue-50`}>{t("cta.open")} <Arrow /></button>
                <button onClick={() => nav("/pricing")} className={`${BTN} justify-between border border-white/60 text-white hover:bg-white hover:text-ink-900`}>{t("cta.brief")} <span aria-hidden>↗</span></button>
              </div>
            </div>
            <div className="mt-10 grid gap-6 border-t border-white/20 pt-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <p className="max-w-2xl text-[16px] leading-relaxed text-blue-50/90">{t("cta.body")}</p>
              <p className="text-[13px] leading-relaxed text-blue-100/75 lg:text-right">{t("cta.foot")}</p>
            </div>
          </div>
        </div>
        {/* the sign-off: the wordmark, set at the width of the page */}
        <div aria-hidden className={`${WRAP} relative select-none overflow-hidden pb-6`}>
          <div className="font-editorial font-semibold leading-[0.8] tracking-[-0.06em] text-transparent" style={{ fontSize: "clamp(6rem, 24vw, 22rem)", backgroundImage: "linear-gradient(180deg, rgba(147,197,253,0.55) 0%, rgba(147,197,253,0.10) 85%)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
            Exit<span className="italic">OS</span>
          </div>
        </div>
      </section>
      </div>
      <SourcesSection collapsed />
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
// why founders lose millions (problem → fix)
const LOSSES = [
  { dimension: "Buyer reach", problem: "A handful of known contacts", fix: "A run across every curated acquirer mandate in the registry" },
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
export const CommandBoard: React.FC = () => {
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
// Data provenance — the pipeline every figure passes through, and the
// confidence register applied to estimates (mirrors the engines' tiers).
const CONFIDENCE_TIERS = [
  { tier: "Verified", color: "#047857", basis: "Disclosed in a public filing", detail: "Headline value, dates and parties confirmed against the primary source." },
  { tier: "Reported", color: "#1d4ed8", basis: "Multiple independent reports", detail: "Cross-referenced press and database coverage; primary filing not located." },
  { tier: "Estimated", color: "#92400e", basis: "Modeled from the record", detail: "Benchmarked against the acquirer's completed-transaction history, with sample size shown." },
];
// ===========================================================================
// SMALL VISUAL HELPERS
// ===========================================================================
export default Landing;
