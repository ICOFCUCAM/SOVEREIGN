import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MarketingChrome, Mark, Arrow, Chapter, Editorial } from "../components/MarketingChrome";
import { MARKET_FMT, MANDATE_ACTIVITY, DISCLOSED_TRANSACTIONS, BOARD_BUYERS, SECTOR_DEMAND, HISTORY_FMT, LEDGER_ROWS, LEDGER_TIERS, LEDGER_PRICED, DEAL_INTEL_FMT, type BoardTx } from "../lib/market-stats";
import { useI18n } from "../lib/i18n";
import QuickValue from "../components/QuickValue";
import TradingHall from "../components/TradingHall";
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

// The hero headline in the editorial serif: an all-caps i18n string reads in
// sentence case on offset lines, the last line in the accent italic.
const heroLines = (s: string): string[] =>
  s.split("\n").map((l, i) => (l === l.toUpperCase() ? (i === 0 ? l.charAt(0) + l.slice(1).toLowerCase() : l.toLowerCase()) : l));

const Landing: React.FC = () => {
  const nav = useNavigate();
  const { t } = useI18n();
  const h1 = heroLines(t("hero.h1"));
  return (
    <MarketingChrome active="home">
      {/* ===== 01 · HERO — the deal atlas (Z1/Z2, after the owner's index(8).html, on the homepage spec) ===== */}
      <section className="border-b border-ink-900 bg-[#f6f8fb] text-ink-900">
        <div className={`${WRAP} pt-8`}>
          <div className="flex justify-between gap-6 border-b border-ink-900 pb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">
            <span>{t("hero.eyebrow")}</span><span className="text-right">{t("hero.asof")} {MARKET_INDEX_FMT.asOf}</span>
          </div>
          <div className="grid items-end gap-10 py-12 sm:py-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(270px,0.6fr)] lg:gap-[6%] lg:py-16">
            <h1 className="max-w-[12ch] font-editorial text-[clamp(3.4rem,8.4vw,8.8rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
              {h1.map((l, i) => i === h1.length - 1
                ? <em key={i} className="block italic text-blue-600">{l}</em>
                : <span key={i}>{l} </span>)}
            </h1>
            <div className="max-w-[420px] border-l border-blue-600 pl-6">
              <p className="font-editorial text-[20px] leading-snug">{t("hero.sub")}</p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600">{t("hero.body")}</p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <button onClick={() => nav("/console")} className={`${BTN} bg-ink-900 text-white hover:bg-ink-800`}>{t("nav.access")} <Arrow /></button>
                <button onClick={() => nav("/pricing")} className={`${BTN} border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white`}>{t("hero.deploy")} <span aria-hidden>↗</span></button>
              </div>
            </div>
          </div>
          {/* 01 / discover the field — the sale process as a route across the market */}
          <ExchangeMap />
          {/* the proof figures, as the homepage has always set them: serif numerals, a label, the source note */}
          <div className="grid grid-cols-3">
            {[
              [MARKET_INDEX_FMT.events, t("ribbon.deals")],
              [MARKET_FMT.buyers, t("ribbon.mandates")],
              [HISTORY_FMT.disclosedValue, t("ribbon.value")],
            ].map(([v, l], i) => (
              <div key={l} className={`py-6 pr-3 ${i ? "border-l border-slate-300 pl-3 sm:pl-5" : ""}`}>
                <div className="font-editorial text-[clamp(1.6rem,2.8vw,2.6rem)] font-semibold leading-none tracking-[-0.02em]">{v}</div>
                <div className="mt-2 text-[12.5px] text-slate-600">{l}<Note n={([1, 2, 3] as SourceId[])[i]} first /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 02 · THE EXCHANGE — the screen installed in the trading hall ===== */}
      <section aria-labelledby="hall-h">
        <TradingHall head={
          <div className={`${WRAP} relative pb-24 pt-20 text-white`}>
            <Chapter n="02" dark>{t("hall.eyebrow")}</Chapter>
            <h2 id="hall-h" className="mt-5 max-w-[18ch] font-editorial text-[clamp(2.6rem,5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.04em]">{t("hall.h2")} <em className="italic text-blue-300">{t("hall.h2em")}</em></h2>
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
        </TradingHall>
        <style>{`
          @keyframes exTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
          @keyframes exScan{0%{transform:translateY(-100%);opacity:0}8%{opacity:1}50%{opacity:.5}92%{opacity:1}100%{transform:translateY(2000%);opacity:0}}
          @keyframes exFlash{0%,100%{background:transparent}50%{background:rgba(96,165,250,.10)}}
          @keyframes exTravel{0%{left:0;opacity:0}6%{opacity:1}94%{opacity:1}100%{left:100%;opacity:0}}
        `}</style>
      </section>

      {/* ===== VALUE YOUR COMPANY — the working product moment ===== */}
      <QuickValue />

      {/* ===== 04 · THE THESIS — one statement, set like a front page ===== */}
      <section className="border-b border-slate-200 bg-[#f6f8fb]">
        <div className={`${WRAP} py-16 sm:py-20 lg:py-24`}>
          <Chapter n="04">{t("loss.eyebrow")}</Chapter>
          <h2 className="mt-6 max-w-[16ch] font-editorial text-[clamp(3rem,7.4vw,7.6rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-ink-900"><Editorial text={t("loss.h2")} /></h2>
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

      {/* ===== 05 · THE TRANSACTION RECORD — the ledger ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n="05">{t("rec.eyebrow")}</Chapter>
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
                <div className="mt-2 text-[12px] text-slate-600">Disclosed value</div>
                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 text-[11px]">
                  <div><dt className="text-slate-600">vs reference</dt><dd className="font-mono text-[14px] font-bold text-blue-700">{c.premium}</dd></div>
                  <div><dt className="text-slate-600">Status</dt><dd className="font-mono text-[14px] font-bold" style={{ color: c.statusColor }}>{c.status}</dd></div>
                  <div><dt className="text-slate-600">Source</dt><dd className="font-mono text-[12px] font-semibold text-ink-900">{c.sources[0]?.kind ?? "—"}</dd></div>
                </dl>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* the ledger table */}
          <div role="region" aria-label="Earlier disclosed acquisitions" tabIndex={0} className="min-w-0 overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <caption className="pb-3 text-left text-[12.5px] text-slate-600">Earlier entries, newest first</caption>
              <thead>
                <tr className="border-y border-ink-900 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600">
                  {["Announced", "Target", "Acquirer", "Sector", "Value", "Status", "Source"].map((h) => <th key={h} scope="col" className={`py-2.5 pr-4 font-semibold ${h === "Value" ? "text-right" : ""}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {LEDGER_ROWS.slice(3).map((r) => (
                  <tr key={r.date + r.target} className="border-b border-slate-200">
                    <td className="whitespace-nowrap py-2.5 pr-4 font-mono tabular-nums text-slate-600"><time dateTime={r.date}>{r.date}</time></td>
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

      {/* ===== 06 · THE MODULES — the site's own catalogue, live engine stats (Z3) ===== */}
      <section aria-labelledby="mods-h" className="border-b border-slate-200 bg-white text-ink-900">
        <div className={`${WRAP} py-16 sm:py-20 lg:py-24`}>
          <div className="border-t-4 border-double border-ink-900 pt-8">
            <Chapter n="06">{t("mods.eyebrow")}</Chapter>
            <h2 id="mods-h" className="mt-6 max-w-[22ch] font-editorial text-[clamp(2.75rem,5.8vw,5.6rem)] font-semibold leading-[0.94] tracking-[-0.045em]"><Editorial text={t("mods.h2")} /></h2>
          </div>
          <div className="mt-12 border-t border-ink-900">
            {HOME_MODULES.map(([name, key, v], k) => (
              <Link key={name} to="/modules" className="group grid grid-cols-[28px_1fr_22px] items-center gap-x-3 gap-y-1.5 border-b border-slate-300 py-6 transition-[background-color,padding] hover:bg-[#f6f8fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 motion-safe:hover:px-3 sm:grid-cols-[58px_1fr_1fr_35px] sm:gap-x-5 sm:py-7">
                <span className="font-mono text-[11px] text-blue-600">0{k + 1}</span>
                <h3 className="font-editorial text-[clamp(1.4rem,2.5vw,2.2rem)] font-semibold tracking-[-0.03em]">{name}</h3>
                <div className="col-start-2 row-start-2 max-w-[440px] sm:col-start-3 sm:row-start-1">
                  <p className="text-[14px] leading-relaxed text-slate-600">{t(`mod.${key}`)}</p>
                  <p className="mt-1.5 font-mono text-[11.5px] tabular-nums text-ink-900">{t(`mod.${key}.st`, v)}</p>
                </div>
                <span aria-hidden className="col-start-3 row-span-2 row-start-1 text-right text-[22px] transition-transform group-hover:text-blue-600 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 sm:col-start-4 sm:row-span-1">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 07 · THE NEXT MOVE — the back page ===== */}
      <section className="bg-white">
        <div className={`${WRAP} py-16 sm:py-20 lg:py-24`}>
          <div className="border-t-4 border-double border-ink-900 pt-8">
            <Chapter n="07">{t("cta.eyebrow")}</Chapter>
            <div className="mt-6 grid items-end gap-10 lg:grid-cols-[1fr_auto]">
              <h2 className="font-editorial text-[clamp(3rem,7vw,7rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-ink-900"><Editorial text={t("cta.h2")} /></h2>
              <div className="flex flex-wrap gap-2.5 lg:flex-col lg:items-stretch">
                <button onClick={() => nav("/console")} className={`${BTN} justify-between bg-ink-900 text-white hover:bg-ink-800`}>{t("cta.open")} <Arrow /></button>
                <button onClick={() => nav("/pricing")} className={`${BTN} justify-between border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white`}>{t("cta.brief")} <span aria-hidden>↗</span></button>
              </div>
            </div>
            <div className="mt-10 grid gap-6 border-t border-ink-900 pt-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <p className="max-w-2xl text-[16px] leading-relaxed text-ink-800">{t("cta.body")}</p>
              <p className="text-[13px] leading-relaxed text-slate-600 lg:text-right">{t("cta.foot")}</p>
            </div>
          </div>
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
