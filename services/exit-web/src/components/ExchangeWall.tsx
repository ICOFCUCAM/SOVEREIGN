import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mark } from "./MarketingChrome";
import {
  MARKET_FMT, DEAL_INTEL_FMT, BOARD_BUYERS, DISCLOSED_TRANSACTIONS, SECTOR_DEMAND, MANDATE_ACTIVITY, LEDGER_ROWS,
  type BoardTx,
} from "../lib/market-stats";

// THE EXCHANGE WALL — a redesigned big screen (design exploration, HOMEPAGE.md
// Phase 6). Same data and the same interactions as the homepage board
// (`CommandBoard`): sector drill-down across buyers and deals, the deal
// detail, the activity ticker, the session clock and the slow heartbeat. What
// changes is the screen's architecture: a capacity index, a departures-style
// deal board, rising demand columns and ranked buyers, in the locked palette.

const MONO = "font-mono tabular-nums";
const heat = (bars: number): string =>
  bars >= 9 ? "linear-gradient(180deg,#FF5A5A,#FF3434)"
  : bars >= 8 ? "linear-gradient(180deg,#FF9A3D,#FF7030)"
  : bars >= 6 ? "linear-gradient(180deg,#FFD36B,#FFB84A)"
  : "linear-gradient(180deg,#78B7FF,#4A8CFF)";

const Clock: React.FC = () => {
  const [c, setC] = useState(() => new Date().toLocaleTimeString("en-US", { hour12: false }));
  useEffect(() => { const t = setInterval(() => setC(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000); return () => clearInterval(t); }, []);
  return <span className={`${MONO} text-[13px] text-emerald-300`}>{c}</span>;
};

const Panel: React.FC<{ title: string; right?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, right, className = "", children }) => (
  <section className={`flex min-w-0 flex-col bg-[#071a31] ${className}`}>
    <header className="flex items-center justify-between border-b border-white/10 px-5 py-2.5">
      <h3 className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/85">{title}</h3>
      {right}
    </header>
    <div className="min-w-0 flex-1">{children}</div>
  </section>
);

const ExchangeWall: React.FC = () => {
  const [sector, setSector] = useState<string | null>(null);
  const [drill, setDrill] = useState<(BoardTx & { date: string }) | null>(null);
  const [beat, setBeat] = useState(0);
  const [spot, setSpot] = useState(0);
  useEffect(() => {
    const b = setInterval(() => setBeat((x) => x + 1), 2400);
    const s = setInterval(() => setSpot((x) => x + 1), 3800);
    return () => { clearInterval(b); clearInterval(s); };
  }, []);
  const live = (base: number, phase: number): number => Math.max(1, Math.min(99, base + Math.round(Math.sin(beat * 0.7 + phase))));

  const deals = DISCLOSED_TRANSACTIONS.map((t, i) => ({ ...t, date: LEDGER_ROWS[i]?.date ?? t.age }));
  const buyers = sector ? BOARD_BUYERS.filter((b) => b.sectors.includes(sector)) : BOARD_BUYERS.slice(0, 5);
  const txns = sector ? deals.filter((t) => t.industry === sector) : deals.slice(0, 6);
  const liveRow = txns.length ? spot % txns.length : -1;
  const covered = SECTOR_DEMAND.filter(([l]) => BOARD_BUYERS.some((b) => b.sectors.includes(l)) || deals.some((t) => t.industry === l)).slice(0, 6);
  const toggle = (s: string): void => setSector((c) => (c === s ? null : s));

  return (
    <div className="relative overflow-hidden rounded-[6px] text-white" style={{ background: "#040f1f" }}>
      {/* ── header strip ── */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-white/10 px-5 py-2.5" style={{ background: "#06182E" }}>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.26em]">ExitOS · Acquisition Exchange</span>
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live Market
          </span>
        </div>
        <div className="hidden items-center gap-5 text-[10px] uppercase tracking-[0.16em] text-white/55 md:flex">
          <span><b className={`${MONO} text-white`}>{MARKET_FMT.activeMandates}</b> mandates deploying</span>
          <span><b className={`${MONO} text-white`}>{MARKET_FMT.buyers}</b> acquirers</span>
          <span><b className={`${MONO} text-white`}>{MARKET_FMT.geographies}</b> jurisdictions</span>
        </div>
        <div className="flex items-center gap-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">
          System status <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)]" /> <Clock />
        </div>
      </div>

      {sector && (
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-blue-500/15 px-5 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200">Filtered · {sector} — {buyers.length} buyer{buyers.length === 1 ? "" : "s"}, {txns.length} deal{txns.length === 1 ? "" : "s"}</span>
          <button onClick={() => setSector(null)} className="rounded px-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Clear ✕</button>
        </div>
      )}

      <div className="grid gap-px bg-white/10 lg:grid-cols-[1fr_2.1fr_1fr]">
        {/* ── capacity index + buyers ── */}
        <div className="grid min-w-0 gap-px bg-white/10">
          <section className="bg-[#071a31] px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Aggregate capacity</div>
            <div className={`${MONO} mt-1 text-[clamp(2rem,3.2vw,3.4rem)] font-bold leading-none tracking-tight`} style={{ color: "#7CFF9F" }}>{MARKET_FMT.appetite}</div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 pt-3">
              {([["Median close", DEAL_INTEL_FMT.medianClose], ["Strategic acquirers", MARKET_FMT.strategic], ["Sectors monitored", MARKET_FMT.sectors], ["Jurisdictions", MARKET_FMT.geographies]] as const).map(([k, v]) => (
                <div key={k}><dt className="text-[9px] uppercase tracking-[0.14em] text-white/55">{k}</dt><dd className={`${MONO} text-[18px] font-bold`}>{v}</dd></div>
              ))}
            </dl>
          </section>
          <Panel title="Strategic buyers" right={<span className="text-[9px] uppercase tracking-[0.14em] text-white/50">Match</span>}>
            <ol>
              {buyers.map((b, i) => (
                <li key={b.name}>
                  <button onClick={() => toggle(b.sector)} title={`Filter to ${b.sector}`}
                    className="flex w-full items-center gap-3 border-b border-white/5 px-5 py-2 text-left transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400">
                    <span className={`${MONO} w-5 text-[12px] text-white/45`}>{String(i + 1).padStart(2, "0")}</span>
                    <Mark name={b.name} size={22} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium">{b.name}</span>
                      <span className="block truncate text-[10px] text-white/50">{b.sector}</span>
                    </span>
                    <span className={`${MONO} text-[16px] font-bold`} style={{ color: "#7CFF9F" }}>{live(b.match, i * 1.3)}%</span>
                  </button>
                </li>
              ))}
              {buyers.length === 0 && <li className="px-5 py-3 text-[11px] text-white/50">No indexed buyer in {sector}.</li>}
            </ol>
            <Link to="/console" className="block px-5 py-2 text-[11px] font-medium text-blue-300 hover:text-blue-200">View all buyers →</Link>
          </Panel>
        </div>

        {/* ── departures board: disclosed transactions ── */}
        <Panel title="Live transactions" right={<span className="flex items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-white/50"><span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#45E38A" }} /> Disclosed · newest first</span>}>
          <div className="hidden grid-cols-[86px_1.5fr_1.1fr_0.8fr_0.9fr] gap-3 border-b border-white/10 px-5 py-2 text-[9px] uppercase tracking-[0.16em] text-white/45 sm:grid">
            <span>Announced</span><span>Target</span><span>Acquirer</span><span className="text-right">Value</span><span className="text-right">Status</span>
          </div>
          {txns.map((t, i) => (
            <button key={t.company} onClick={() => setDrill(t)}
              className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 border-b border-white/5 px-5 py-3 text-left transition-colors duration-500 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 sm:grid-cols-[86px_1.5fr_1.1fr_0.8fr_0.9fr]"
              style={i === liveRow ? { background: "rgba(96,165,250,0.12)" } : undefined}>
              <span className={`${MONO} hidden text-[11px] text-white/55 sm:block`}>{t.date}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 truncate text-[14px] font-semibold">
                  {i === liveRow && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full" style={{ background: "#7CFF9F", boxShadow: "0 0 6px 1px rgba(124,255,159,.8)" }} />}
                  {t.company}
                </span>
                <span className="block truncate text-[10px] text-white/50">{t.industry}</span>
              </span>
              <span className="hidden min-w-0 items-center gap-2 sm:flex"><Mark name={t.buyer} size={18} /><span className="truncate text-[12px] text-white/80">{t.buyer}</span></span>
              <span className={`${MONO} text-right text-[19px] font-bold leading-none`}>{t.offer}</span>
              <span className="col-span-2 flex items-center justify-end gap-1.5 text-[11px] font-semibold sm:col-span-1" style={{ color: t.color }}>
                <span className="h-2 w-2 rounded-full" style={{ background: t.color, boxShadow: `0 0 6px 1px ${t.color}` }} />{t.status}
              </span>
            </button>
          ))}
          {txns.length === 0 && <div className="px-5 py-3 text-[11px] text-white/50">No disclosed deal in {sector}.</div>}
          <Link to="/console" className="block px-5 py-2 text-[11px] font-medium text-blue-300 hover:text-blue-200">View all transactions →</Link>
        </Panel>

        {/* ── demand columns ── */}
        <Panel title="Acquisition demand" right={<span className="text-[9px] uppercase tracking-[0.14em] text-white/50">Market heat</span>}>
          <div className="flex h-[250px] items-end gap-2 px-5 pb-2 pt-5">
            {covered.map(([label, heatLabel, bars], i) => {
              const active = sector === label;
              const h = Math.max(2, Math.min(10, bars + Math.sin(beat * 0.6 + i * 1.7) * 0.4));
              return (
                <button key={label} onClick={() => toggle(label)} title={`${label} · ${heatLabel}`} aria-pressed={active}
                  className={`group flex h-full flex-1 flex-col justify-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${active ? "" : "opacity-90 hover:opacity-100"}`}>
                  <span className={`${MONO} mb-1 block text-center text-[10px] text-white/70`}>{heatLabel.split(" ").map((w) => w[0]).join("")}</span>
                  <span className={`block w-full rounded-t-sm transition-all duration-1000 ${active ? "ring-2 ring-blue-300" : ""}`} style={{ height: `${h * 10}%`, background: heat(bars) }} />
                </button>
              );
            })}
          </div>
          <ul className="border-t border-white/10 px-5 py-2">
            {covered.map(([label, heatLabel]) => (
              <li key={label} className="flex justify-between gap-2 py-0.5 text-[10.5px]">
                <span className={sector === label ? "font-semibold text-blue-200" : "text-white/75"}>{label}</span><span className="text-white/50">{heatLabel}</span>
              </li>
            ))}
          </ul>
          <div className="px-5 pb-3 text-[9px] uppercase tracking-[0.14em] text-white/40">Tap a column to drill the wall</div>
        </Panel>
      </div>

      {/* ── ticker ── */}
      <div className="overflow-hidden border-t border-white/10" style={{ background: "#020a16" }}>
        <div className="flex w-max items-center gap-10 whitespace-nowrap px-4 py-2.5 motion-safe:[animation:exTicker_40s_linear_infinite]">
          {[...MANDATE_ACTIVITY, ...MANDATE_ACTIVITY].map((a, i) => (
            <span key={i} className="flex items-center gap-2 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.color, boxShadow: `0 0 5px 1px ${a.color}` }} />
              <span className="text-white/80">{a.text}</span><span className={`${MONO} text-white/45`}>{a.meta}</span>
            </span>
          ))}
        </div>
      </div>

      {drill && (
        <div role="dialog" aria-modal="true" aria-label={`Disclosed transaction: ${drill.company}`} className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={() => setDrill(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setDrill(null); }}>
          <div className="w-full max-w-md rounded-md border border-white/10 bg-[#0A1F3A] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-300">Disclosed transaction · {drill.date}</div>
                <div className="mt-1 text-[20px] font-bold">{drill.company}</div>
                <div className="text-[11px] text-white/55">{drill.industry}</div>
              </div>
              <button autoFocus onClick={() => setDrill(null)} aria-label="Close" className="rounded p-1 text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">✕</button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-[12px]">
              {([["Acquirer", drill.buyer], ["Best-match sector", drill.match], ["Headline", drill.offer], ["Premium", drill.premium], ["Status", drill.status], ["Period", drill.age]] as const).map(([k, v]) => (
                <div key={k}><dt className="text-[9px] uppercase tracking-wide text-white/45">{k}</dt><dd className="mt-0.5 font-medium text-white/90">{v}</dd></div>
              ))}
            </dl>
            <button onClick={() => { setDrill(null); toggle(drill.industry); }} className="mt-4 w-full rounded-sm bg-blue-600 py-2 text-[12px] font-semibold text-white hover:bg-blue-500">Filter the wall to {drill.industry} →</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeWall;
