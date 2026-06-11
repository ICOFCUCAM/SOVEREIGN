import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { MarketingChrome, Glyph, Mark, Arrow } from "../components/MarketingChrome";
import { MARKET_FMT, MANDATE_ACTIVITY, DISCLOSED_TRANSACTIONS, STRATEGIC_BOARD, SECTOR_DEMAND, HISTORY_FMT, DEAL_INTEL_FMT, REGISTRY_CARDS } from "../lib/market-stats";

// Public marketing home — the front door to ExitOS, wrapped in the shared
// marketing chrome (header nav → Platform / Modules / Pricing + footer). The
// hero carries the coded "Acquisition Command Center" board. Figures are
// illustrative. Company marks are brand-coloured monogram placeholders.

const Landing: React.FC = () => {
  const nav = useNavigate();
  return (
    <MarketingChrome active="home">
      {/* ===== 01 · HERO ===== */}
      {/* The board is NOT a floating UI card — it is a massive acquisition-
          exchange display physically mounted inside the trading hall: large,
          in perspective, with a structural mount, a big soft shadow, a polished
          floor reflection and ambient light spilling onto the floor. */}
      <section className="relative overflow-hidden border-b border-slate-200">
        {/* trading-hall photograph as the hero environment */}
        <div className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/command-center.png)" }} aria-hidden />
        {/* architectural framing: ceiling light grid + glass-wall mullions +
            floor sheen, to read as an exchange hall rather than a stock office */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-40" aria-hidden
          style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 2px, transparent 2px 96px)", maskImage: "linear-gradient(to bottom, #000, transparent)", WebkitMaskImage: "linear-gradient(to bottom, #000, transparent)" }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-[0.12]" aria-hidden
          style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(40,70,110,0.6) 0 1px, transparent 1px 140px), repeating-linear-gradient(0deg, rgba(40,70,110,0.4) 0 1px, transparent 1px 180px)" }} />
        {/* wash: strong on the left for the headline, light on the right so the
            hall (desks, analysts, windows) stays visible around the board. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/92 from-5% via-white/45 via-40% to-white/5" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#eef2f7] via-[#eef2f7]/70 to-transparent" aria-hidden />
        {/* floor sheen + ambient light the board emits onto the floor */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-50" aria-hidden style={{ background: "linear-gradient(to top, rgba(255,255,255,0.5), transparent)" }} />
        <div className="pointer-events-none absolute bottom-[8%] right-[6%] h-56 w-[52%] rounded-[50%] opacity-40 blur-3xl" style={{ background: "radial-gradient(ellipse at center, rgba(70,150,220,0.30), rgba(70,150,220,0) 70%)" }} aria-hidden />

        {/* proof ribbon — institutional authority above the fold (real figures) */}
        <div className="relative border-b border-slate-200/70 bg-white/70 backdrop-blur">
          <div className="mx-auto grid max-w-[1480px] grid-cols-2 divide-x divide-slate-200/70 px-6 lg:grid-cols-4 lg:px-10">
            {[
              [HISTORY_FMT.events, "Disclosed acquisitions indexed"],
              [MARKET_FMT.buyers, "Verified acquirer mandates"],
              [HISTORY_FMT.disclosedValue, "Transaction value tracked"],
              [MARKET_FMT.activeMandates, "Mandates actively deploying"],
            ].map(([v, l], i) => (
              <div key={l} className="flex items-baseline gap-2.5 px-4 py-2.5">
                {i === 3 && <span className="relative inline-flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>}
                <span className="font-mono text-[15px] font-bold tabular-nums text-ink-900">{v}</span>
                <span className="text-[11px] leading-tight text-slate-500">{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto grid max-w-[1480px] items-center gap-8 px-6 py-16 lg:grid-cols-[0.9fr_1.3fr] lg:px-10 lg:py-20">
          <div className="lg:pr-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> The Global Acquisition Exchange
            </div>
            <h1 className="font-serif text-4xl font-bold leading-[1.04] tracking-tight text-ink-900 sm:text-5xl">
              INSTITUTIONAL<br />ACQUISITION<br />INFRASTRUCTURE
            </h1>
            <p className="mt-6 max-w-md font-serif text-xl font-semibold leading-snug text-ink-900">
              Source acquirers. Coordinate diligence. Manage negotiations. Execute transactions.
            </p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">
              One system connecting founders, buyers, advisors and transaction data — from signal generation to closing.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-800">Access the Exchange <Arrow /></button>
              <button onClick={() => nav("/pricing")} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-ink-900 backdrop-blur transition hover:border-slate-400 hover:bg-white">Deploy a Mandate</button>
            </div>
          </div>

          {/* ---- MOUNTED ACQUISITION-EXCHANGE DISPLAY ---- */}
          {/* pushed right + up, clear of the headline, with a light floor shadow */}
          <div className="min-w-0 lg:translate-x-16 lg:-translate-y-6" style={{ perspective: "2000px" }}>
            <div className="relative">
              {/* structural mount / bezel behind the screen */}
              <div
                className="relative rounded-[20px] p-2.5"
                style={{
                  transform: "rotateY(-11deg) rotateX(2.5deg)",
                  transformOrigin: "center right",
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
                    <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 md:inline">{MARKET_FMT.activeMandates} mandates deploying · {MARKET_FMT.appetite} capacity</span>
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

              {/* polished-floor reflection of the screen */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-full h-28 overflow-hidden"
                style={{
                  transform: "rotateY(-11deg) rotateX(2.5deg) scaleY(-1)",
                  transformOrigin: "center right",
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

        {/* trust strip — 4 institutional metric cards, one full-width row */}
        <div className="relative border-t border-slate-200/70 bg-white/55 backdrop-blur">
          <div className="mx-auto grid max-w-[1480px] grid-cols-2 gap-px overflow-hidden px-6 lg:grid-cols-4 lg:px-10">
            {HERO_TRUST.map((t) => (
              <div key={t.title} className="group flex items-center gap-3.5 px-5 py-5 transition hover:bg-white">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition group-hover:bg-blue-100"><Glyph name={t.icon} /></span>
                <div className="min-w-0">
                  <div className="font-serif text-xl font-bold leading-none text-ink-900">{t.metric}</div>
                  <div className="mt-1 text-[12.5px] font-semibold leading-tight text-ink-800">{t.title}</div>
                  <div className="text-[11px] leading-snug text-slate-500">{t.sub}</div>
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

      {/* ===== 1A · ACQUISITION LIFECYCLE RAIL ===== */}
      <section className="border-b border-white/10" style={{ background: "linear-gradient(135deg,#06182E 0%,#0A1F3A 60%,#0B2547 100%)" }}>
        <div className="mx-auto max-w-[1480px] px-6 py-9 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-300">The acquisition lifecycle · signal → closing</div>
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="relative inline-flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" /></span>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300">Live process</span>
            </div>
          </div>
          {/* one animated rail: a traveling pulse runs the full lifecycle */}
          <div className="relative mt-7">
            <div className="pointer-events-none absolute left-0 right-0 top-[11px] hidden h-px lg:block" style={{ background: "linear-gradient(90deg, transparent, rgba(96,165,250,.45) 6%, rgba(96,165,250,.45) 94%, transparent)" }} />
            <div className="pointer-events-none absolute top-[7px] hidden h-2 w-2 rounded-full lg:block" style={{ background: "#7CFF9F", boxShadow: "0 0 8px 2px rgba(124,255,159,.8)", animation: "exTravel 7s linear infinite" }} />
            <ol className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 lg:grid-cols-8">
              {LIFECYCLE.map((s, i) => (
                <li key={s} className="relative flex flex-col items-center text-center">
                  <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#0A1F3A] font-mono text-[10px] font-bold text-blue-200 ring-1 ring-blue-400/40">{i + 1}</span>
                  <span className="mt-2.5 px-1 text-[11px] font-semibold leading-tight text-white/85">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ===== 1B · ACQUISITION ECOSYSTEM ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1320px] px-6 py-12 lg:px-10">
          <div className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">The acquisition ecosystem</div>
          {/* horizontal institutional network — nodes joined by connecting lines */}
          <div className="mt-8 flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
            {ECOSYSTEM.map((e, i) => (
              <React.Fragment key={e.label}>
                <div className="group flex flex-1 flex-col items-center rounded-xl border border-slate-200 bg-white px-3 py-4 text-center transition hover:border-blue-300 hover:shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100"><Glyph name={e.icon} small /></span>
                  <div className="mt-2.5 text-[12px] font-semibold text-ink-800">{e.label}</div>
                </div>
                {i < ECOSYSTEM.length - 1 && (
                  <div className="flex shrink-0 items-center justify-center text-blue-300">
                    <span className="hidden h-px w-6 bg-blue-200 lg:block" /><span className="px-1 lg:px-0">&rarr;</span><span className="hidden h-px w-6 bg-blue-200 lg:block" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-200 sm:grid-cols-4">
            {ECO_STATS.map((s) => (
              <div key={s.label} className="bg-white px-5 py-5 text-center">
                <div className="font-serif text-2xl font-bold text-blue-600">{s.value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 02 · ACQUISITION MARKET ===== */}
      <section id="solutions" className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <div className="flex-1">
            <h2 className="font-serif text-[2rem] font-bold tracking-tight text-ink-900">The world&rsquo;s acquisition marketplace.</h2>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {MARKET_STATS.map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600"><Glyph name={s.icon} small /></span>
                    <span className={`text-[10px] font-semibold ${s.up ? "text-emerald-600" : "text-slate-400"}`}>{s.trend}</span>
                  </div>
                  <div className="mt-3 font-serif text-2xl font-bold text-ink-900">{s.value}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== ROW 5 · PIPELINE / WORKFLOW — futuristic horizontal stepper ===== */}
      <section id="platform" className="relative overflow-hidden border-b border-white/10" style={{ background: "linear-gradient(135deg,#06182E 0%,#0A1F3A 55%,#0B2547 100%)" }}>
        {/* ambient grid + glow */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden
          style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(120,170,255,0.5) 0 1px, transparent 1px 120px), repeating-linear-gradient(0deg, rgba(120,170,255,0.35) 0 1px, transparent 1px 120px)", maskImage: "radial-gradient(ellipse at 50% 0%, #000, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, #000, transparent 75%)" }} />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[80%] -translate-x-1/2 rounded-[50%] opacity-50 blur-[120px]" aria-hidden style={{ background: "radial-gradient(ellipse at center, rgba(56,130,246,0.45), transparent 70%)" }} />

        <div className="relative mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-300">The exchange · founder → exit</div>
            <h2 className="mt-3 font-serif text-[2rem] font-bold leading-tight tracking-tight text-white sm:text-[2.4rem]">Run your entire company sale from discovery to closing.</h2>
          </div>

          {/* 6 steps — one horizontal row, connected by a glowing rail */}
          <div className="relative mt-14">
            <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px lg:block" aria-hidden style={{ background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.55) 12%, rgba(96,165,250,0.55) 88%, transparent)" }} />
            <ol className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
              {STEPS.map((st, i) => (
                <li key={st.title} className="relative flex flex-col items-center text-center">
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
                    style={{ background: "linear-gradient(145deg,#1b3a66,#0c244a)", boxShadow: "0 0 0 1px rgba(120,170,255,0.25), 0 8px 24px -10px rgba(56,130,246,0.7), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
                    <Glyph name={st.icon} />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 font-mono text-[9px] font-bold text-white ring-2 ring-[#0A1F3A]">{i + 1}</span>
                  </span>
                  <div className="mt-4 text-[13.5px] font-bold text-white">{st.title}</div>
                  <div className="mt-1.5 text-[11.5px] leading-snug text-blue-100/55">{st.body}</div>
                </li>
              ))}
            </ol>
          </div>

          {/* Founder → Exit — compact horizontal flow */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur">
            {EXCHANGE_FLOW.map((s, i) => (
              <React.Fragment key={s.title}>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30"><Glyph name={s.icon} small /></span>
                  <span className="text-[12px] font-semibold text-white/85">{s.title}</span>
                </div>
                {i < EXCHANGE_FLOW.length - 1 && <span className="px-1 text-blue-300/50" aria-hidden>→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 04 · BUYER INTELLIGENCE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <div className="flex-1">
            <h2 className="font-serif text-[2rem] font-bold leading-tight tracking-tight text-ink-900">Real buyers.<br />Real appetite.<br />Real opportunities.</h2>
            <a href="#" className="mt-4 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">View all buyers &rarr;</a>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {BUYERS.map((b) => (
                <div key={b.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                  <div className="flex items-center gap-2.5">
                    <Mark name={b.name} />
                    <div>
                      <div className="text-sm font-bold leading-tight text-ink-900">{b.name}</div>
                      <div className="text-[10px] text-slate-400">{b.kind}</div>
                    </div>
                  </div>
                  {/* appetite meter */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Acquisition Appetite</span>
                      <span className="font-semibold text-blue-600">{b.appetite >= 90 ? "Very High" : "High"}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: `${b.appetite}%` }} />
                    </div>
                  </div>
                  <dl className="mt-3 space-y-2 text-[11px]">
                    {b.rows.map((r) => (
                      <div key={r[0]} className="flex items-baseline justify-between gap-2 border-t border-slate-100 pt-2">
                        <dt className="text-slate-400">{r[0]}</dt>
                        <dd className="text-right font-semibold text-ink-800">{r[1]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 05 · COMMAND CENTER PREVIEW ===== */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="min-w-0 scale-90 lg:scale-100"><CommandBoard /></div>
            <div>
              <h2 className="font-serif text-[2rem] font-bold tracking-tight text-ink-900">Your Acquisition Command Center.</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Real-time intelligence, buyer activity, transaction tracking, valuation insights, and market demand &mdash; on one acquisition infrastructure.
              </p>
              <a href="#" className="mt-4 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">Explore the Platform &rarr;</a>
            </div>
          </div>
          {/* dense signal grid — one full-width row of live readouts */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {COMMAND_FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600"><Glyph name={f.icon} small /></span>
                  <span className="font-mono text-[14px] font-bold text-ink-900">{f.value}</span>
                </div>
                <div className="mt-2.5 text-[12px] font-bold leading-tight text-ink-900">{f.title}</div>
                <div className="text-[10.5px] leading-snug text-slate-500">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 06 · DATA ROOM INFRASTRUCTURE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          {/* heading + a short, half-height vault panel on the right */}
          <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-serif text-[2rem] font-bold leading-tight tracking-tight text-ink-900">Institutional-grade<br />data rooms.</h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">Secure, permissioned, and built for high-stakes transactions.</p>
              <a href="#" className="mt-4 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">Learn more &rarr;</a>
              {/* security posture row */}
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-slate-500">
                {[["lock", "Permission controls"], ["check", "Full audit trails"], ["shield", "Access logs"]].map(([ic, t]) => (
                  <span key={t} className="flex items-center gap-1.5"><span className="text-blue-600"><Glyph name={ic} small /></span>{t}</span>
                ))}
              </div>
            </div>
            <div className="flex h-32 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B2947] to-[#06182E]"><Vault /></div>
          </div>

          {/* 6 document categories — one full-width row */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {DATA_ROOMS.map((d) => (
              <div key={d.title} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-ink-700"><Glyph name={d.icon} small /></span>
                <div className="mt-2.5 text-[12px] font-semibold leading-tight text-ink-800">{d.title}</div>
                <div className="mt-2 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wide text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-600"><span className="h-1 w-1 rounded-full bg-emerald-500" /> Secured</span>
                  <span className="text-slate-300">·</span><span>Audit trail</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 07 · NEGOTIATION ENGINE ===== */}
      <section className="border-b border-slate-200">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <div className="grid flex-1 items-start gap-10 lg:grid-cols-[1.25fr_1fr]">
            <OfferTable />
            <div>
              <h2 className="font-serif text-[2rem] font-bold leading-tight tracking-tight text-ink-900">Negotiate with clarity.<br />Close with confidence.</h2>
              <p className="mt-3 text-base leading-relaxed text-slate-600">AI-powered negotiation support to maximise your outcome and minimise your risk.</p>
              <a href="#" className="mt-3 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">See Negotiation Engine &rarr;</a>
              <ul className="mt-7 space-y-5">
                {NEGOTIATION_FEATURES.map((f) => (
                  <li key={f.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600"><Glyph name={f.icon} small /></span>
                    <div>
                      <div className="text-sm font-bold text-ink-900">{f.title}</div>
                      <div className="text-[12px] text-slate-500">{f.body}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 08 · EXIT MARKETPLACE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <div className="flex-1">
            <h2 className="font-serif text-[2rem] font-bold leading-tight tracking-tight text-ink-900">The marketplace.<br />Private and confidential.</h2>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-slate-500">Representative listing profiles — live mandates stay anonymous until NDA. Publish yours to enter the exchange.</p>
            <a href="/marketplace" className="mt-4 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">How the marketplace works &rarr;</a>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {OPPORTUNITIES.map((o) => (
                <div key={o.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="inline-block rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">{o.sector}</div>
                    <span className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wide text-emerald-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />{o.status}</span>
                  </div>
                  <div className="mt-3 text-sm font-bold text-ink-900">{o.name}</div>
                  <div className="mt-1 text-[10px] text-slate-400">Active mandate &middot; {o.region}</div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-[11px]">
                    <div><div className="text-slate-400">Revenue</div><div className="font-semibold text-ink-800">{o.rev}</div></div>
                    <div><div className="text-slate-400">EBITDA</div><div className="font-semibold text-ink-800">{o.ebitda}</div></div>
                    <div className="text-right"><div className="text-slate-400">Asking</div><div className="font-serif text-base font-bold text-ink-900">{o.price}</div></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-500">{o.interest} engaged</span>
                    <a href="#" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">View Details &rarr;</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 09 · GLOBAL REACH ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1320px] items-center gap-0 lg:grid-cols-[1.05fr_1.35fr]">
          {/* blue acquisition-network world map panel */}
          <div className="relative overflow-hidden lg:rounded-r-2xl" style={{ background: "linear-gradient(135deg,#0a2a52 0%,#05182f 60%,#081f3a 100%)" }}>
            <div className="px-6 py-12 lg:px-10 lg:py-16">
              <WorldDots />
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent lg:block" aria-hidden />
          </div>
          {/* headline + inline stats */}
          <div className="px-6 py-14 lg:px-12 lg:py-20">
            <h2 className="font-serif text-[2rem] font-bold leading-tight tracking-tight text-ink-900">Global reach.<br />Institutional network.</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
              ExitOS connects founders with acquirer mandates across <span className="font-semibold text-ink-800">{MARKET_FMT.geographies} jurisdictions</span> and every major industry.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
              {GLOBAL_STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-serif text-3xl font-bold text-ink-900">{s.value}</div>
                  <div className="mt-1 text-[12px] text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 9B · WHY FOUNDERS LOSE MILLIONS ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1100px] px-6 py-16 lg:px-10">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">The cost of running blind</div>
            <h2 className="mt-3 font-serif text-[2rem] font-bold leading-tight tracking-tight text-ink-900">Why founders lose millions on exit.</h2>
          </div>
          {/* comparison matrix: Traditional vs ExitOS */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-[1.1fr_1fr_1fr]">
              <div className="bg-slate-50 px-5 py-4" />
              <div className="bg-slate-100 px-5 py-4 text-center text-[12px] font-bold uppercase tracking-wide text-slate-500">Traditional Sale</div>
              <div className="bg-ink-900 px-5 py-4 text-center text-[12px] font-bold uppercase tracking-wide text-white">With ExitOS</div>
            </div>
            {LOSSES.map((l, i) => (
              <div key={l.problem} className={"grid grid-cols-[1.1fr_1fr_1fr] " + (i % 2 ? "bg-white" : "bg-slate-50/40")}>
                <div className="flex items-center px-5 py-4 text-[13px] font-semibold text-ink-800">{l.dimension}</div>
                <div className="flex items-center gap-2 border-l border-slate-100 px-5 py-4 text-[12.5px] text-slate-500">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500"><Glyph name="x" small /></span>{l.problem}
                </div>
                <div className="flex items-center gap-2 border-l border-slate-100 bg-blue-50/30 px-5 py-4 text-[12.5px] font-medium text-ink-800">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Glyph name="check" small /></span>{l.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 9C · PROOF · CASE STUDIES ===== */}
      <section className="border-b border-slate-200 bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">Proof</div>
              <h2 className="mt-3 font-serif text-[2rem] font-bold tracking-tight text-ink-900">Companies sold on the exchange.</h2>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-slate-500">Representative transactions run end-to-end on ExitOS — sourcing through closing wire.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {CASE_STUDIES.map((c) => (
              <div key={c.name} className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{c.sector}</div>
                <div className="mt-4 text-[11px] font-medium uppercase tracking-wide text-slate-500">{c.name} &mdash; acquired by</div>
                <div className="mt-1 text-base font-bold text-ink-900">{c.buyer}</div>
                <div className="mx-auto my-5 h-px w-12 bg-slate-200" />
                <div className="font-serif text-4xl font-bold text-ink-900">{c.value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">Transaction Value</div>
                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 text-[11px]">
                  <div><div className="font-serif text-lg font-bold text-blue-600">{c.premium}</div><div className="mt-0.5 text-slate-400">Premium</div></div>
                  <div><div className="font-serif text-lg font-bold text-ink-900">{c.buyers}</div><div className="mt-0.5 text-slate-400">Buyers</div></div>
                  <div><div className="font-serif text-lg font-bold text-ink-900">{c.time}</div><div className="mt-0.5 text-slate-400">To close</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 10 · FINAL CTA ===== */}
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-24 opacity-[0.05]" aria-hidden>
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 w-16 rounded-t bg-ink-900" />)}
        </div>
        <div className="relative mx-auto max-w-[1320px] px-6 py-24 text-center lg:px-10">
          <h2 className="font-serif text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">Ready to run your company sale?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
            ExitOS is the acquisition infrastructure for company sales &mdash; sourcing, diligence, negotiation and closing on one exchange.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Launch ExitOS <Arrow /></button>
            <button onClick={() => nav("/pricing")} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-ink-900 transition hover:border-slate-400 hover:bg-slate-50">Request Private Demo</button>
          </div>
        </div>
      </section>

    </MarketingChrome>
  );
};

// ===========================================================================
// COMMAND BOARD — the hero "Acquisition Command Center" (coded to spec)
// 3 columns: Strategic Buyers (25%) · Live Transactions (45%) · Demand (30%)
// Navy palette, glass cards, status-coloured rows.
// ===========================================================================
// Strategic Buyers column — the registry's most active mandates.
const STRATEGIC_BUYERS: readonly [string, string, number, string][] = STRATEGIC_BOARD;
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
const HERO_TRUST = [
  { icon: "globe", metric: `${MARKET_FMT.buyers} Mandates`, title: "Curated Acquirer Network", sub: `${MARKET_FMT.geographies} jurisdictions · ${MARKET_FMT.sectors} sectors` },
  { icon: "lock", metric: "SOC 2", title: "Compliant Infrastructure", sub: "security + data residency" },
  { icon: "users", metric: "100%", title: "Founder Controlled", sub: "you own every decision" },
  { icon: "check", metric: "Every Action", title: "Auditable", sub: "every action, every artifact" },
];
// live mandate ticker (very bottom of the board) — real registry entries,
// not fabricated transactions; computed from @exit/engines BUYER_REGISTRY.
const ACTIVITY = MANDATE_ACTIVITY;
// acquisition ecosystem (below hero)
const ECOSYSTEM = [
  { icon: "shield", label: "Strategic Acquirers" },
  { icon: "spark", label: "Private Equity" },
  { icon: "users", label: "Family Offices" },
  { icon: "chart", label: "Investment Banks" },
  { icon: "doc", label: "Corporate Development" },
];
const ECO_STATS = [
  { value: MARKET_FMT.buyers, label: "Acquirer Mandates" },
  { value: MARKET_FMT.strategic, label: "Strategic Buyers" },
  { value: MARKET_FMT.privateEquity, label: "PE & Growth" },
  { value: MARKET_FMT.appetite, label: "Check Capacity" },
];
// founder → exit workflow chain
const EXCHANGE_FLOW = [
  { icon: "users", title: "Founder", sub: "lists the company" },
  { icon: "chart", title: "Acquisition Intelligence", sub: "valuation & positioning" },
  { icon: "globe", title: "Buyer Network", sub: "matched acquirers" },
  { icon: "spark", title: "Negotiation", sub: "AI-assisted terms" },
  { icon: "lock", title: "Closing", sub: "signature & escrow" },
  { icon: "check", title: "Exit", sub: "funds transferred" },
];
// why founders lose millions (problem → fix)
const LOSSES = [
  { dimension: "Buyer reach", problem: "A handful of known contacts", fix: `A run across ${MARKET_FMT.buyers} curated acquirer mandates in ${MARKET_FMT.geographies} jurisdictions` },
  { dimension: "Preparation", problem: "Negotiate unprepared", fix: "AI valuation, comps and reservation lines up front" },
  { dimension: "Leverage", problem: "Leverage erodes mid-process", fix: "Live signals + parallel offers hold tension" },
  { dimension: "Final price", problem: "Accept discounted offers", fix: "Offer optimisation captures the premium" },
];
// proof — representative transactions
const CASE_STUDIES = [
  { sector: "Logistics", name: "Logistics Platform", value: "$132M", buyers: "14", premium: "+24%", time: "11 wks", buyer: "Strategic" },
  { sector: "AI Infrastructure", name: "AI Infrastructure Co.", value: "$261M", buyers: "21", premium: "+31%", time: "9 wks", buyer: "Microsoft*" },
  { sector: "Healthcare SaaS", name: "Healthcare SaaS", value: "$175M", buyers: "12", premium: "+26%", time: "13 wks", buyer: "UnitedHealth*" },
];
const LEAN_STATS = [
  { label: "Mandates", value: MARKET_FMT.buyers },
  { label: "Capacity", value: MARKET_FMT.appetite },
  { label: "Deploying", value: MARKET_FMT.activeMandates },
  { label: "Sectors", value: MARKET_FMT.sectors },
];
const heatGradient = (bars: number) =>
  bars >= 9 ? "linear-gradient(90deg,#FF5A5A,#FF3434)"
  : bars >= 8 ? "linear-gradient(90deg,#FF9A3D,#FF7030)"
  : bars >= 6 ? "linear-gradient(90deg,#FFD36B,#FFB84A)"
  : "linear-gradient(90deg,#78B7FF,#4A8CFF)";

// `lean` = focused hero board: only Strategic Buyers + Acquisition Demand
// (no Live Transactions column — that detail lives below the fold), trimmed to
// the few rows that matter, plus a 4-stat market-activity bar.
const CommandBoard: React.FC<{ lean?: boolean }> = ({ lean }) => (
  <div
    className="relative min-w-0 overflow-hidden rounded-3xl text-white"
    style={{
      background: "linear-gradient(180deg,#08203B 0%,#06182E 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    }}
  >
    {/* live operational layer — a faint signal sweep travels down the board */}
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16" aria-hidden
      style={{ background: "linear-gradient(180deg, rgba(96,165,250,0.18), transparent)", animation: "exScan 6s linear infinite" }} />
    <div className={"grid grid-cols-1 " + (lean ? "lg:grid-cols-[44%_56%]" : "lg:grid-cols-[25%_45%_30%]")}>
      {/* ---- COL 1 · STRATEGIC BUYERS ---- */}
      <div className="border-b border-white/5 px-5 py-3 lg:border-b-0 lg:border-r">
        <BoardHeader title="Strategic Buyers" right="Match Score" />
        <div className="mt-1">
          {(lean ? STRATEGIC_BUYERS.filter((b) => ["Microsoft", "Salesforce", "Oracle", "Thoma Bravo"].includes(b[0])) : STRATEGIC_BUYERS.slice(0, 4)).map(([name, sector, match, status]) => (
            <div key={name} className="group flex items-center justify-between gap-2 border-b border-white/5 py-1.5 transition last:border-0 hover:translate-x-1" style={{ transitionDuration: ".25s" }}>
              <div className="flex items-center gap-2">
                <Mark name={name} size={22} />
                <div>
                  <div className="text-[12.5px] font-medium text-white/90">{name}</div>
                  <div className="text-[10px] text-white/45">{sector}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold leading-none" style={{ color: "#7CFF9F", fontSize: 17 }}>{match}%</div>
                <div className="mt-0.5 text-[9px] text-white/45">{status}</div>
              </div>
            </div>
          ))}
        </div>
        <Link to="/console" className="mt-2 inline-block text-[11px] font-medium text-blue-300 hover:text-blue-200">View all buyers &rarr;</Link>
      </div>

      {/* ---- COL 2 · LIVE TRANSACTIONS (full board only) ---- */}
      {!lean && (
      <div className="border-b border-white/5 px-5 py-3 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: "#45E38A" }} />
            <BoardHeader title="Live Transactions" />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-[1.4fr_1fr_0.9fr] gap-2 text-[9px] uppercase tracking-wide text-white/40">
          <span>Target Company</span><span>Best Match</span><span className="text-right">Expected / Status</span>
        </div>
        <div className="mt-1">
          {TRANSACTIONS.slice(0, 4).map((t, i) => (
            <div key={t.company} className="grid grid-cols-[1.4fr_1fr_0.9fr] items-center gap-2 rounded border-b border-white/5 py-1.5 last:border-0"
              style={i === 0 ? { animation: "exFlash 4s ease-in-out infinite" } : undefined}>
              <div>
                <div className="text-[12.5px] font-medium text-white/90">{t.company}</div>
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
            </div>
          ))}
        </div>
        <Link to="/console" className="mt-2 inline-block text-[11px] font-medium text-blue-300 hover:text-blue-200">View all transactions &rarr;</Link>
      </div>
      )}

      {/* ---- COL 3 · ACQUISITION DEMAND ---- */}
      <div className="px-5 py-3">
        <BoardHeader title="Acquisition Demand" right="Market Heat" />
        <div className="mt-3 space-y-2">
          {(lean ? DEMAND.slice(0, 4) : DEMAND.slice(0, 5)).map(([label, heat, bars]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-white/80">{label}</span>
                <span className="text-white/45">{heat}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${bars * 10}%`, background: heatGradient(bars) }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ---- BOTTOM · market-activity stat bar ---- */}
    <div className={"grid grid-cols-2 gap-px border-t border-white/10 " + (lean ? "sm:grid-cols-4" : "sm:grid-cols-5")} style={{ background: "rgba(255,255,255,.06)" }}>
      {(lean ? LEAN_STATS : BOARD_STATS).map((s) => (
        <div key={s.label} className="px-4 py-3.5" style={{ background: "#06182E" }}>
          <div className="font-bold leading-none text-white" style={{ fontSize: 18 }}>{s.value}</div>
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
const MARKET_STATS = [
  { icon: "users", value: MARKET_FMT.buyers, label: "Acquirer Mandates", trend: "Curated registry", up: true },
  { icon: "spark", value: MARKET_FMT.appetite, label: "Check Capacity Indexed", trend: "↑ Rising", up: true },
  { icon: "chart", value: MARKET_FMT.activeMandates, label: "Mandates Actively Deploying", trend: "Live appetite", up: true },
  { icon: "shield", value: MARKET_FMT.strategic, label: "Strategic Acquirers Indexed", trend: "Engine-matched", up: true },
  { icon: "doc", value: MARKET_FMT.sectors, label: "Sectors Monitored", trend: "Stable", up: false },
  { icon: "globe", value: MARKET_FMT.geographies, label: "Jurisdictions with Buyer Activity", trend: "↑ Expanding", up: true },
];
const LIFECYCLE = ["Signal", "Buyer Discovery", "NDA", "CIM", "Management Meetings", "LOI", "Diligence", "Closing"];
const STEPS = [
  { icon: "chart", title: "Company Analysis", body: "AI-powered valuation, market positioning, and readiness scoring." },
  { icon: "users", title: "Buyer Discovery", body: `Engine-ranked matching across ${MARKET_FMT.buyers} curated strategic and financial mandates.` },
  { icon: "doc", title: "Data Room", body: "Secure diligence infrastructure built for M&A." },
  { icon: "spark", title: "Negotiation Engine", body: "AI-assisted negotiation with offer optimization and scenario modeling." },
  { icon: "check", title: "LOI Received", body: "Manage terms, track milestones, and reduce deal risk." },
  { icon: "lock", title: "Closing & Payout", body: "Streamline closing, documents, and funds transfer." },
];
const BUYERS = REGISTRY_CARDS;
const COMMAND_FEATURES = [
  { icon: "chart", value: HISTORY_FMT.events, title: "Disclosed Deals Indexed", body: "EDGAR + Wikidata sourced" },
  { icon: "users", value: MARKET_FMT.buyers, title: "Buyer Mandates", body: "intent monitoring" },
  { icon: "spark", value: MARKET_FMT.activeMandates, title: "Actively Deploying", body: "live appetite" },
  { icon: "fire", value: "High", title: "Market Heat", body: "liquidity scores" },
  { icon: "globe", value: MARKET_FMT.appetite, title: "Acquisition Demand", body: "check capacity indexed" },
  { icon: "doc", value: MARKET_FMT.sectors, title: "Sectors Covered", body: "across the registry" },
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
const OPPORTUNITIES = [
  { sector: "Logistics", name: "Logistics Platform", rev: "$68M", ebitda: "$18M", price: "$108M", interest: "14 buyers", status: "Open", region: "North America" },
  { sector: "Healthcare", name: "Healthcare SaaS", rev: "$132M", ebitda: "$34M", price: "$220M", interest: "21 buyers", status: "In Diligence", region: "Europe" },
  { sector: "Cybersecurity", name: "Cybersecurity Platform", rev: "$101M", ebitda: "$31M", price: "$340M", interest: "18 buyers", status: "Open", region: "Global" },
  { sector: "AI / SaaS", name: "AI Automation Platform", rev: "$87M", ebitda: "$27M", price: "$195M", interest: "26 buyers", status: "LOI Stage", region: "Asia-Pacific" },
];
const GLOBAL_STATS = [
  { value: MARKET_FMT.geographies, label: "Jurisdictions" },
  { value: MARKET_FMT.buyers, label: "Acquirer Mandates" },
  { value: MARKET_FMT.appetite, label: "Check Capacity" },
  { value: "24/7", label: "Market Activity" },
];

// ===========================================================================
// SMALL VISUAL HELPERS
// ===========================================================================
const OfferTable: React.FC = () => (
  <div className="overflow-hidden rounded-2xl p-4 text-white" style={{ background: "linear-gradient(180deg,#08203B,#06182E)" }}>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Offer Comparison</div>
    <table className="mt-3 w-full text-left text-[12px]">
      <thead className="text-white/45">
        <tr>{["", "Buyer A", "Buyer B", "Buyer C"].map((h) => <th key={h} className="pb-2 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>
        {[["Upfront Cash", "$110M", "$190M", "$140M"], ["Earnout", "$22M", "$25M", "$31M"], ["Total", "$312M", "$285M", "$271M"], ["Structure", "Cash", "Cash + Roll", "Cash"]].map((r) => (
          <tr key={r[0]} className={"border-t border-white/5 " + (r[0] === "Total" ? "font-bold" : "")}>
            <td className="py-2 text-white/50">{r[0]}</td>
            <td className="py-2" style={r[0] === "Total" ? { color: "#7CFF9F" } : undefined}>{r[1]}</td>
            <td className="py-2" style={r[0] === "Total" ? { color: "#7CFF9F" } : undefined}>{r[2]}</td>
            <td className="py-2" style={r[0] === "Total" ? { color: "#7CFF9F" } : undefined}>{r[3]}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
const WorldDots: React.FC = () => {
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
            <circle r="2.8" fill="#A8FFFF"><animateMotion dur={`${4 + (i % 4)}s`} repeatCount="indefinite" path={d} /></circle>
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
