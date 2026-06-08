import React from "react";
import { useNavigate } from "react-router-dom";

// Public marketing landing — the front door to ExitOS. A 10-section
// institutional sales page (light theme) with a fully-coded "Acquisition
// Command Center" board in the hero. Figures are illustrative. Company marks
// are brand-coloured monogram placeholders (swap for licensed logo assets).

const NAV = ["Platform", "Solutions", "Resources", "Company", "Pricing"];

// ---- company marks : brand-coloured monogram badges (logo placeholders) ----
const MARKS: Record<string, { bg: string; fg?: string; label: string }> = {
  Microsoft: { bg: "#0067B8", label: "MS" },
  Salesforce: { bg: "#00A1E0", label: "SF" },
  SAP: { bg: "#1170B6", label: "SAP" },
  Oracle: { bg: "#C74634", label: "O" },
  "Thoma Bravo": { bg: "#1A2B5E", label: "TB" },
  "Vista Equity Partners": { bg: "#2E3192", label: "V" },
  "Palo Alto Networks": { bg: "#FA582D", label: "PA" },
  Google: { bg: "#4285F4", label: "G" },
  "UnitedHealth Group": { bg: "#002677", label: "UH" },
  "Rockwell Automation": { bg: "#CC0000", label: "RA" },
};
const Mark: React.FC<{ name: string; size?: number }> = ({ name, size = 26 }) => {
  const m = MARKS[name] ?? { bg: "#475569", label: name.slice(0, 2).toUpperCase() };
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded font-bold"
      style={{ width: size, height: size, background: m.bg, color: m.fg ?? "#fff", fontSize: size * 0.4 }}
      aria-hidden
    >
      {m.label}
    </span>
  );
};

const Landing: React.FC = () => {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-ink-900">
      {/* ===== TOP NAV ===== */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-900 text-xs font-black text-white">EX</div>
            <span className="text-lg font-bold tracking-tight text-ink-900">ExitOS</span>
          </div>
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => (
              n === "Pricing"
                ? <button key={n} onClick={() => nav("/pricing")} className="text-[13px] font-medium text-slate-600 transition hover:text-ink-900">{n}</button>
                : <a key={n} href={`#${n.toLowerCase()}`} className="flex items-center gap-1 text-[13px] font-medium text-slate-600 transition hover:text-ink-900">{n} <Caret /></a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => nav("/console")} className="rounded-md border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50">Log in</button>
            <button onClick={() => nav("/console")} className="rounded-md bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-ink-800">Launch ExitOS</button>
          </div>
        </div>
      </header>

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
        <div className="pointer-events-none absolute bottom-[6%] right-[6%] h-72 w-[60%] rounded-[50%] opacity-70 blur-3xl" style={{ background: "radial-gradient(ellipse at center, rgba(70,150,220,0.40), rgba(70,150,220,0) 70%)" }} aria-hidden />

        <div className="relative mx-auto grid max-w-[1440px] items-center gap-6 px-6 py-16 lg:grid-cols-[0.62fr_1.5fr] lg:px-10 lg:py-24">
          <div className="lg:pr-2">
            <h1 className="font-serif text-4xl font-bold leading-[1.06] tracking-tight text-ink-900 sm:text-5xl">
              THE OPERATING SYSTEM<br />FOR COMPANY SALES
            </h1>
            <p className="mt-6 max-w-md font-serif text-xl font-semibold leading-snug text-ink-900">
              Source buyers. Run diligence. Negotiate offers. Close transactions.
            </p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">
              One acquisition infrastructure. One audit trail. One source of truth.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-800">Launch ExitOS <Arrow /></button>
              <button onClick={() => nav("/pricing")} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-ink-900 backdrop-blur transition hover:border-slate-400 hover:bg-white">Request a Demo</button>
            </div>
            {/* trust strip — what ExitOS stands on */}
            <div className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-4">
              {HERO_TRUST.map((t) => (
                <div key={t.title} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/70 text-ink-700 ring-1 ring-slate-200 backdrop-blur"><Glyph name={t.icon} small /></span>
                  <div>
                    <div className="text-[13px] font-bold leading-tight text-ink-900">{t.title}</div>
                    <div className="text-[11px] leading-snug text-slate-500">{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- MOUNTED ACQUISITION-EXCHANGE DISPLAY ---- */}
          <div className="min-w-0" style={{ perspective: "2000px" }}>
            <div className="relative">
              {/* structural mount / bezel behind the screen */}
              <div
                className="relative rounded-[20px] p-2.5"
                style={{
                  transform: "rotateY(-7deg) rotateX(2.5deg)",
                  transformOrigin: "center right",
                  background: "linear-gradient(145deg,#1c2c44,#0a1626)",
                  boxShadow: "0 60px 90px -30px rgba(8,20,40,0.55), 0 20px 40px -20px rgba(8,20,40,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
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
                    <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 md:inline">13,240 active mandates</span>
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
                {/* bottom mount bracket */}
                <div className="mx-auto mt-1.5 h-1 w-1/3 rounded-full bg-white/10" />
              </div>

              {/* polished-floor reflection of the screen */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-full h-40 overflow-hidden"
                style={{
                  transform: "rotateY(-7deg) rotateX(2.5deg) scaleY(-1)",
                  transformOrigin: "center right",
                  opacity: 0.16,
                  filter: "blur(3px)",
                  WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)",
                  maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)",
                  background: "linear-gradient(180deg,#0a1626,#08203B)",
                }}
              />
            </div>
          </div>
        </div>
        <style>{`@keyframes exTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
      </section>

      {/* ===== 1B · ACQUISITION ECOSYSTEM ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1320px] px-6 py-12 lg:px-10">
          <div className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">The acquisition ecosystem</div>
          <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {ECOSYSTEM.map((e) => (
              <div key={e.label} className="flex flex-col items-center text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Glyph name={e.icon} small /></span>
                <div className="mt-2.5 text-[12px] font-semibold text-ink-800">{e.label}</div>
              </div>
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
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
              {MARKET_STATS.map((s) => (
                <div key={s.label} className="flex items-start gap-2.5">
                  <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600"><Glyph name={s.icon} small /></span>
                  <div>
                    <div className="font-serif text-2xl font-bold text-blue-600">{s.value}</div>
                    <div className="mt-0.5 text-[11px] leading-snug text-slate-500">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 03 · HOW EXITOS WORKS ===== */}
      <section id="platform" className="border-b border-slate-200">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <div className="flex-1">
            <h2 className="font-serif text-[2rem] font-bold tracking-tight text-ink-900">Run your entire company sale from discovery to closing.</h2>
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
              {STEPS.map((st, i) => (
                <div key={st.title} className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-white"><Glyph name={st.icon} /></div>
                  <div className="mt-4 text-sm font-bold text-ink-900">{st.title}</div>
                  <div className="mt-1.5 text-[12px] leading-snug text-slate-500">{st.body}</div>
                  {i < STEPS.length - 1 && <div className="absolute right-[-10px] top-7 hidden text-slate-300 lg:block">&rarr;</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 03B · EXCHANGE / WORKFLOW VISUALIZATION ===== */}
      <section className="border-b border-slate-200 bg-ink-900 text-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-300">The exchange</div>
            <h2 className="mt-3 font-serif text-[2rem] font-bold tracking-tight">One pipeline, from founder to exit.</h2>
          </div>
          <div className="mt-12 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
            {EXCHANGE_FLOW.map((s, i) => (
              <React.Fragment key={s.title}>
                <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-center">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-300"><Glyph name={s.icon} /></span>
                  <div className="mt-3 text-sm font-bold text-white">{s.title}</div>
                  <div className="mt-1 text-[11px] leading-snug text-white/50">{s.sub}</div>
                </div>
                {i < EXCHANGE_FLOW.length - 1 && (
                  <div className="flex shrink-0 items-center justify-center text-blue-300/60">
                    <span className="hidden lg:block">&rarr;</span>
                    <span className="lg:hidden">&darr;</span>
                  </div>
                )}
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
                <div key={b.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <Mark name={b.name} />
                    <div>
                      <div className="text-sm font-bold leading-tight text-ink-900">{b.name}</div>
                      <div className="text-[10px] text-slate-400">{b.kind}</div>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-2 text-[11px]">
                    {b.rows.map((r) => (
                      <div key={r[0]} className="flex items-baseline justify-between gap-2 border-t border-slate-100 pt-2 first:border-0 first:pt-0">
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
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="min-w-0 scale-90 lg:scale-100"><CommandBoard compact /></div>
            <div>
              <h2 className="font-serif text-[2rem] font-bold tracking-tight text-ink-900">Your Acquisition Command Center.</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Real-time intelligence, buyer activity, transaction tracking, valuation insights, and market demand &mdash; all in one institutional platform.
              </p>
              <a href="#" className="mt-4 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">Explore the Platform &rarr;</a>
              <ul className="mt-7 space-y-5">
                {COMMAND_FEATURES.map((f) => (
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

      {/* ===== 06 · DATA ROOM INFRASTRUCTURE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-serif text-[2rem] font-bold leading-tight tracking-tight text-ink-900">Institutional-grade<br />data rooms.</h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">Secure, permissioned, and built for high-stakes transactions.</p>
              <a href="#" className="mt-4 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">Learn more &rarr;</a>
              <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-6">
                {DATA_ROOMS.map((d) => (
                  <div key={d.title} className="text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-700 shadow-sm"><Glyph name={d.icon} /></span>
                    <div className="mt-2.5 text-[11px] font-semibold leading-snug text-ink-800">{d.title}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B2947] to-[#06182E] p-12"><Vault /></div>
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
            <h2 className="font-serif text-[2rem] font-bold leading-tight tracking-tight text-ink-900">Live opportunities.<br />Private and confidential.</h2>
            <a href="#" className="mt-4 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">View all opportunities &rarr;</a>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {OPPORTUNITIES.map((o) => (
                <div key={o.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                  <div className="inline-block rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">{o.sector}</div>
                  <div className="mt-3 text-sm font-bold text-ink-900">{o.name}</div>
                  <div className="mt-4 flex justify-between text-[11px]">
                    <div><div className="text-slate-400">Revenue</div><div className="font-semibold text-ink-800">{o.rev}</div></div>
                    <div><div className="text-slate-400">EBITDA</div><div className="font-semibold text-ink-800">{o.ebitda}</div></div>
                    <div className="text-right"><div className="text-slate-400">Asking Price</div><div className="font-serif text-base font-bold text-ink-900">{o.price}</div></div>
                  </div>
                  <a href="#" className="mt-4 inline-block text-[12px] font-semibold text-blue-600 hover:text-blue-700">View Details &rarr;</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 09 · GLOBAL ACQUISITION NETWORK ===== */}
      <section className="border-b border-slate-200 bg-ink-900 text-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-300">Global Acquisition Network</div>
            <h2 className="mx-auto mt-3 max-w-2xl font-serif text-[2rem] font-bold leading-tight tracking-tight">Acquisition flows across every major market.</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">Buyers, capital and mandates moving between North America, Europe, Asia and the Middle East — indexed in real time.</p>
          </div>
          <div className="mt-10"><WorldDots /></div>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            {REGIONS.map((r) => (
              <div key={r.name} className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center">
                <div className="text-sm font-bold text-white">{r.name}</div>
                <div className="mt-1 font-serif text-xl font-bold text-blue-300">{r.value}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/45">{r.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-4">
            {GLOBAL_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-serif text-2xl font-bold text-blue-300">{s.value}</div>
                <div className="mt-1 text-[12px] text-white/55">{s.label}</div>
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
            ExitOS brings acquisition intelligence, buyer discovery, diligence, negotiation and closing into a single institutional operating system.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Launch ExitOS <Arrow /></button>
            <button onClick={() => nav("/pricing")} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-ink-900 transition hover:border-slate-400 hover:bg-slate-50">Request Private Demo</button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-200 bg-[#f6f8fb]">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-6 py-8 text-[12px] text-slate-400 lg:px-10">
          <div>© {new Date().getFullYear()} ExitOS — A Sovereign Infrastructure</div>
          <div className="font-mono uppercase tracking-[0.22em]">exit.sovereigndo.com</div>
        </div>
      </footer>
    </div>
  );
};

// ===========================================================================
// COMMAND BOARD — the hero "Acquisition Command Center" (coded to spec)
// 3 columns: Strategic Buyers (25%) · Live Transactions (45%) · Demand (30%)
// Navy palette, glass cards, status-coloured rows.
// ===========================================================================
const STRATEGIC_BUYERS: [string, string, number, string][] = [
  ["Microsoft", "Enterprise Software", 94, "Very High"],
  ["Salesforce", "CRM / AI / Data", 91, "Very High"],
  ["SAP", "Enterprise Software", 89, "High"],
  ["Oracle", "Cloud / Infrastructure", 88, "High"],
  ["Thoma Bravo", "Private Equity", 86, "High"],
  ["Vista Equity Partners", "Private Equity", 84, "High"],
];
type Tx = { company: string; industry: string; buyer: string; match: string; offer: string; premium: string; status: string; color: string; age: string };
const TRANSACTIONS: Tx[] = [
  { company: "Helios Freight", industry: "Logistics / Transportation", buyer: "Microsoft", match: "94% Match", offer: "$261,000,000", premium: "+31% Premium", status: "LOI Received", color: "#45E38A", age: "2h ago" },
  { company: "SecureLayer", industry: "Cybersecurity", buyer: "Palo Alto Networks", match: "92% Match", offer: "$198,000,000", premium: "+28% Premium", status: "Due Diligence", color: "#FFB14A", age: "1d ago" },
  { company: "DataMind AI", industry: "AI / Machine Learning", buyer: "Google", match: "90% Match", offer: "$315,000,000", premium: "+34% Premium", status: "Negotiation", color: "#FF8A3D", age: "2d ago" },
  { company: "CareSphere", industry: "HealthTech", buyer: "UnitedHealth Group", match: "89% Match", offer: "$175,000,000", premium: "+26% Premium", status: "Data Room", color: "#58C6FF", age: "3d ago" },
  { company: "NextGen Robotics", industry: "Industrial Automation", buyer: "Rockwell Automation", match: "87% Match", offer: "$142,000,000", premium: "+22% Premium", status: "Initial Review", color: "rgba(255,255,255,.55)", age: "4d ago" },
];
const DEMAND: [string, string, number][] = [
  ["AI Infrastructure", "Extreme", 9],
  ["Cybersecurity", "Very High", 8],
  ["SaaS / Enterprise", "Very High", 8],
  ["Data & Analytics", "High", 7],
  ["Healthcare SaaS", "High", 6],
  ["Industrial Tech", "Medium", 5],
  ["Fintech", "Medium", 4],
];
// summary stat bar along the board's bottom edge (benchmark)
const BOARD_STATS = [
  { label: "Active Buyers", value: "58,341+" },
  { label: "Active Acquirers", value: "18,340" },
  { label: "Active Deals", value: "12,400" },
  { label: "Transactions in Motion", value: "1,249" },
  { label: "Total Acquisition Value", value: "$4.2B+" },
];
const HERO_TRUST = [
  { icon: "globe", title: "Global Buyer Network", sub: "58,000+ verified acquirers" },
  { icon: "lock", title: "Institutional Security", sub: "SOC 2 · data residency" },
  { icon: "users", title: "Founder First", sub: "you own every decision" },
  { icon: "check", title: "Auditable Process", sub: "every action, every artifact" },
];
// live activity ticker (very bottom of the board)
const ACTIVITY = [
  { text: "Microsoft acquired an AI-infrastructure company — LOI received", meta: "2m ago", color: "#45E38A" },
  { text: "Vista reviewing a logistics platform", meta: "$132M indication", color: "#58C6FF" },
  { text: "New strategic buyer added to the network", meta: "just now", color: "#A8FFFF" },
  { text: "DataMind AI entered negotiation with Google", meta: "$315M · 12m ago", color: "#FF8A3D" },
  { text: "SecureLayer opened its data room", meta: "Palo Alto Networks", color: "#FFB14A" },
  { text: "Verdant Bio closed", meta: "$540M · 1h ago", color: "#45E38A" },
];
// acquisition ecosystem (below hero)
const ECOSYSTEM = [
  { icon: "shield", label: "Strategic Acquirers" },
  { icon: "spark", label: "Private Equity" },
  { icon: "users", label: "Family Offices" },
  { icon: "chart", label: "Investment Banks" },
  { icon: "doc", label: "Corporate Development" },
];
const ECO_STATS = [
  { value: "18,340", label: "Acquirers" },
  { value: "58,341", label: "Buyers" },
  { value: "4,800", label: "Strategic Buyers" },
  { value: "$4.2T", label: "Acquisition Appetite" },
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
// global acquisition network regions
const REGIONS = [
  { name: "North America", value: "24,100", label: "Active Buyers" },
  { name: "Europe", value: "16,540", label: "Active Buyers" },
  { name: "Asia", value: "12,880", label: "Active Buyers" },
  { name: "Middle East", value: "4,820", label: "Active Buyers" },
];
const LEAN_STATS = [
  { label: "Buyers", value: "58,341" },
  { label: "Appetite", value: "$4.2T" },
  { label: "Mandates", value: "13,240" },
  { label: "Acquirers", value: "4,800" },
];
const heatGradient = (bars: number) =>
  bars >= 9 ? "linear-gradient(90deg,#FF5A5A,#FF3434)"
  : bars >= 8 ? "linear-gradient(90deg,#FF9A3D,#FF7030)"
  : bars >= 6 ? "linear-gradient(90deg,#FFD36B,#FFB84A)"
  : "linear-gradient(90deg,#78B7FF,#4A8CFF)";

// `lean` = focused hero board: only Strategic Buyers + Acquisition Demand
// (no Live Transactions column — that detail lives below the fold), trimmed to
// the few rows that matter, plus a 4-stat market-activity bar.
const CommandBoard: React.FC<{ compact?: boolean; lean?: boolean }> = ({ compact, lean }) => (
  <div
    className="min-w-0 overflow-hidden rounded-3xl text-white"
    style={{
      background: "linear-gradient(180deg,#08203B 0%,#06182E 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    }}
  >
    <div className={"grid grid-cols-1 " + (lean ? "lg:grid-cols-[44%_56%]" : "lg:grid-cols-[25%_45%_30%]")}>
      {/* ---- COL 1 · STRATEGIC BUYERS ---- */}
      <div className="border-b border-white/5 p-5 lg:border-b-0 lg:border-r">
        <BoardHeader title="Strategic Buyers" right="Match Score" />
        <div className="mt-1">
          {(lean ? STRATEGIC_BUYERS.filter((b) => ["Microsoft", "Salesforce", "Oracle", "Thoma Bravo"].includes(b[0])) : STRATEGIC_BUYERS).map(([name, sector, match, status]) => (
            <div key={name} className="group flex items-center justify-between gap-2 border-b border-white/5 py-2.5 transition last:border-0 hover:translate-x-1" style={{ transitionDuration: ".25s" }}>
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
        <button className="mt-2 text-[11px] font-medium text-blue-300 hover:text-blue-200">View all buyers &rarr;</button>
      </div>

      {/* ---- COL 2 · LIVE TRANSACTIONS (full board only) ---- */}
      {!lean && (
      <div className="border-b border-white/5 p-5 lg:border-b-0 lg:border-r">
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
          {TRANSACTIONS.map((t) => (
            <div key={t.company} className="grid grid-cols-[1.4fr_1fr_0.9fr] items-center gap-2 border-b border-white/5 py-2.5 last:border-0">
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
        <button className="mt-2 text-[11px] font-medium text-blue-300 hover:text-blue-200">View all transactions &rarr;</button>
      </div>
      )}

      {/* ---- COL 3 · ACQUISITION DEMAND ---- */}
      <div className="p-5">
        <BoardHeader title="Acquisition Demand" right="Market Heat" />
        <div className="mt-3 space-y-2.5">
          {(lean ? DEMAND.slice(0, 4) : DEMAND).map(([label, heat, bars]) => (
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
        {/* Market intelligence box (full board only — lean shows the stat bar) */}
        {!lean && (
        <div className="mt-4 rounded-2xl p-3" style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.04)" }}>
          <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">Market Intelligence</div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-3">
            {[["$4.2T+", "Acquisition Appetite Indexed"], ["13,240", "Active Mandates Tracked"], ["4,800+", "Strategic Acquirers Indexed"], ["212", "Sectors Monitored"]].map((m) => (
              <div key={m[1]}>
                <div className="font-bold leading-none text-white" style={{ fontSize: compact ? 18 : 22 }}>{m[0]}</div>
                <div className="mt-1 text-[9px] leading-snug text-white/45">{m[1]}</div>
              </div>
            ))}
          </div>
        </div>
        )}
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
  { icon: "users", value: "58,341+", label: "Active Buyers" },
  { icon: "spark", value: "$4.2T+", label: "Acquisition Appetite Indexed" },
  { icon: "chart", value: "13,240", label: "Active Mandates Tracked" },
  { icon: "shield", value: "4,800+", label: "Strategic Acquirers Indexed" },
  { icon: "doc", value: "212", label: "Sectors Monitored" },
  { icon: "globe", value: "125+", label: "Countries with Buyer Activity" },
];
const STEPS = [
  { icon: "chart", title: "Company Analysis", body: "AI-powered valuation, market positioning, and readiness scoring." },
  { icon: "users", title: "Buyer Discovery", body: "Access 58,000+ qualified strategic and financial buyers." },
  { icon: "doc", title: "Data Room", body: "Secure diligence infrastructure built for M&A." },
  { icon: "spark", title: "Negotiation Engine", body: "AI-assisted negotiation with offer optimization and scenario modeling." },
  { icon: "check", title: "LOI Received", body: "Manage terms, track milestones, and reduce deal risk." },
  { icon: "lock", title: "Closing & Payout", body: "Streamline closing, documents, and funds transfer." },
];
const BUYERS = [
  { name: "Microsoft", kind: "Enterprise Software", rows: [["Acquisition Appetite", "Very High"], ["Check Size", "$100M – $2B+"], ["Activity Score", "95/100"], ["Focus Areas", "AI, Cloud, DevTools"]] },
  { name: "Salesforce", kind: "CRM / AI / Data", rows: [["Acquisition Appetite", "Very High"], ["Check Size", "$50M – $1.5B+"], ["Activity Score", "92/100"], ["Focus Areas", "AI, Data, Automation"]] },
  { name: "SAP", kind: "Enterprise Software", rows: [["Acquisition Appetite", "High"], ["Check Size", "$80M – $1.5B+"], ["Activity Score", "90/100"], ["Focus Areas", "Enterprise, Cloud, Data"]] },
  { name: "Oracle", kind: "Cloud / Infrastructure", rows: [["Acquisition Appetite", "High"], ["Check Size", "$100M – $2B+"], ["Activity Score", "88/100"], ["Focus Areas", "Cloud, Infrastructure, AI"]] },
  { name: "Thoma Bravo", kind: "Private Equity", rows: [["Acquisition Appetite", "Very High"], ["Check Size", "$250M – $5B+"], ["Activity Score", "88/100"], ["Focus Areas", "Software, Tech, Services"]] },
];
const COMMAND_FEATURES = [
  { icon: "chart", title: "Live deal tracking", body: "from LOI to closing." },
  { icon: "spark", title: "AI-driven valuation", body: "and offer forecasting." },
  { icon: "users", title: "Buyer signals", body: "and intent monitoring." },
  { icon: "fire", title: "Market heat", body: "and liquidity scores." },
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
  { sector: "Logistics", name: "Logistics Platform", rev: "$68M", ebitda: "$18M", price: "$108M" },
  { sector: "Healthcare", name: "Healthcare SaaS", rev: "$132M", ebitda: "$34M", price: "$220M" },
  { sector: "Cybersecurity", name: "Cybersecurity Platform", rev: "$101M", ebitda: "$31M", price: "$340M" },
  { sector: "AI / SaaS", name: "AI Automation Platform", rev: "$87M", ebitda: "$27M", price: "$195M" },
];
const GLOBAL_STATS = [
  { value: "125+", label: "Countries" },
  { value: "58K+", label: "Active Buyers" },
  { value: "$4.2T+", label: "Buyer Appetite" },
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
  <svg viewBox="0 0 140 120" className="h-40 w-44">
    <rect x="34" y="22" width="72" height="76" rx="8" fill="#13355f" stroke="#58C6FF" strokeOpacity="0.5" />
    <rect x="42" y="30" width="56" height="60" rx="5" fill="#0c244a" />
    <circle cx="70" cy="60" r="16" fill="none" stroke="#58C6FF" strokeWidth="2.5" />
    <path d="M63 60l5 5 10-10" fill="none" stroke="#5AD1FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <g stroke="#58C6FF" strokeOpacity="0.6" strokeWidth="2"><line x1="70" y1="40" x2="70" y2="46" /><line x1="70" y1="74" x2="70" y2="80" /><line x1="50" y1="60" x2="56" y2="60" /><line x1="84" y1="60" x2="90" y2="60" /></g>
  </svg>
);

// Global acquisition network — dot map with named regional hubs and animated
// acquisition-flow arcs connecting the regions.
const HUBS: Record<string, [number, number]> = {
  na: [210, 95], eu: [470, 90], me: [560, 130], asia: [720, 120], sa: [270, 195], au: [780, 205],
};
const FLOWS: [keyof typeof HUBS, keyof typeof HUBS][] = [
  ["na", "eu"], ["eu", "me"], ["me", "asia"], ["na", "asia"], ["eu", "asia"], ["sa", "na"], ["asia", "au"], ["eu", "na"],
];
const WorldDots: React.FC = () => {
  const dots = React.useMemo(() => {
    const out: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * 900 + 10, y = Math.random() * 300 + 10;
      const band = Math.abs(((y - 40) % 100) - 50) / 50;
      if (Math.random() > 0.4 + band * 0.4) out.push({ x, y, r: Math.random() < 0.1 ? 1.6 : 0.9 });
    }
    return out;
  }, []);
  return (
    <svg viewBox="0 0 920 320" className="w-full">
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#5AD1FF" opacity={d.r > 1.2 ? 0.8 : 0.28} />)}
      {/* acquisition-flow arcs with travelling pulses */}
      {FLOWS.map(([a, b], i) => {
        const [x1, y1] = HUBS[a], [x2, y2] = HUBS[b];
        const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.18 - 20;
        const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="#2E8BD6" strokeWidth="1" opacity="0.45" />
            <circle r="2.6" fill="#A8FFFF">
              <animateMotion dur={`${4 + (i % 4)}s`} repeatCount="indefinite" path={d} />
            </circle>
          </g>
        );
      })}
      {/* region hubs */}
      {Object.values(HUBS).map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="9" fill="#2E8BD6" opacity="0.25" />
          <circle cx={x} cy={y} r="3.2" fill="#A8FFFF" />
        </g>
      ))}
    </svg>
  );
};

const Arrow = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Caret = () => <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;

const Glyph: React.FC<{ name: string; small?: boolean }> = ({ name, small }) => {
  const s = small ? 15 : 20;
  const p: Record<string, React.ReactNode> = {
    chart: <><path d="M4 19V5M4 19h16M8 16v-4M12 16V9M16 16v-7" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M17 11a2.5 2.5 0 100-5M21 20c0-2.2-1.5-3.8-3.5-4.4" /></>,
    doc: <><path d="M7 3h7l4 4v14H7zM14 3v4h4M9 13h6M9 16h6" /></>,
    spark: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" /></>,
    check: <><circle cx="12" cy="12" r="8" /><path d="M9 12l2 2 4-4" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
    fire: <><path d="M12 3c1 3-2 4-2 7a4 4 0 008 0c0-4-3-5-3-8M12 21a5 5 0 01-3-9c0 4 3 4 3 7" /></>,
    shield: <><path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C9 19 5 15.6 5 11V5.5z" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {p[name] ?? p.doc}
    </svg>
  );
};

export default Landing;
