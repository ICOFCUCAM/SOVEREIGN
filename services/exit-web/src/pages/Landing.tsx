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

// ---- shared bits -----------------------------------------------------------
const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">{children}</div>
);
const SectionTag: React.FC<{ n: string; label: string }> = ({ n, label }) => (
  <div className="hidden w-28 shrink-0 lg:block">
    <div className="font-mono text-[13px] font-bold text-ink-800">{n}</div>
    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-slate-400">{label}</div>
  </div>
);

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
      <section className="relative overflow-hidden border-b border-slate-200">
        {/* previously-uploaded command-center image as a faint backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.06]" style={{ backgroundImage: "url(/command-center.png)" }} aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/70 to-[#f6f8fb]" aria-hidden />
        <div className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-6 py-14 lg:grid-cols-[0.82fr_1.18fr] lg:px-10 lg:py-20">
          <div className="flex items-start gap-6">
            <SectionTag n="01" label="Hero" />
            <div>
              <Eyebrow>The operating system for company sales</Eyebrow>
              <h1 className="mt-5 font-serif text-5xl font-bold leading-[1.04] tracking-tight text-ink-900 sm:text-[3.4rem]">
                Built for founders.
                <br />Trusted by acquirers.
                <br /><span className="text-blue-600">Designed to close.</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-slate-600">
                ExitOS is the acquisition operating system that connects founders with the right buyers, runs the entire sale process, and closes more deals.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Launch ExitOS <Arrow /></button>
                <button onClick={() => nav("/pricing")} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition hover:border-slate-400 hover:bg-slate-50">Request a Demo</button>
              </div>
              <div className="mt-9">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Trusted by founders. Backed by top acquirers.</div>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {["Microsoft", "Salesforce", "Google", "SAP", "Oracle", "Thoma Bravo"].map((l) => (
                    <span key={l} className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400"><Mark name={l} size={16} /> {l}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* live command-center board (coded) */}
          <CommandBoard />
        </div>
      </section>

      {/* ===== 02 · ACQUISITION MARKET ===== */}
      <section id="solutions" className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <SectionTag n="02" label="Acquisition Market" />
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
          <SectionTag n="03" label="How ExitOS Works" />
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

      {/* ===== 04 · BUYER INTELLIGENCE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <SectionTag n="04" label="Buyer Intelligence" />
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
          <SectionTag n="05" label="Command Center Preview" />
          <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="scale-90 lg:scale-100"><CommandBoard compact /></div>
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
          <SectionTag n="06" label="Data Room Infrastructure" />
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
          <SectionTag n="07" label="Negotiation Engine" />
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
          <SectionTag n="08" label="Exit Marketplace" />
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

      {/* ===== 09 · GLOBAL INFRASTRUCTURE ===== */}
      <section className="border-b border-slate-200 bg-ink-900 text-white">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <SectionTag n="09" label="Global Infrastructure" />
          <div className="grid flex-1 items-center gap-10 lg:grid-cols-2">
            <div className="flex items-center justify-center"><WorldDots /></div>
            <div>
              <h2 className="font-serif text-[2rem] font-bold leading-tight tracking-tight">Global reach.<br />Institutional network.</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/65">ExitOS connects founders with buyers across 125+ countries and every major industry.</p>
              <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
                {GLOBAL_STATS.map((s) => (
                  <div key={s.label}>
                    <div className="font-serif text-2xl font-bold text-blue-300">{s.value}</div>
                    <div className="mt-1 text-[12px] text-white/55">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 10 · FINAL CTA ===== */}
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-24 opacity-[0.05]" aria-hidden>
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 w-16 rounded-t bg-ink-900" />)}
        </div>
        <div className="relative mx-auto max-w-[1320px] px-6 py-24 text-center lg:px-10">
          <span className="font-mono text-[11px] font-bold tracking-[0.22em] text-slate-300">10 — FINAL CTA</span>
          <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">Ready to run your company sale?</h2>
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
// command-center indices (top strip) + live deal-feed (bottom ticker)
const INDICES = [
  { label: "LOIs (30d)", value: "47", color: "#45E38A" },
  { label: "Buyer Appetite", value: "8.6", color: "#5AD1FF" },
  { label: "Sector Liquidity", value: "High", color: "#5AD1FF" },
  { label: "Median Multiple", value: "6.8x", color: "#FFFFFF" },
  { label: "Cross-Border", value: "72", color: "#FF9F43" },
  { label: "Founder Readiness", value: "91%", color: "#7CFF9F" },
];
const DEAL_FEED = [
  { company: "Helios Freight", event: "LOI received from Microsoft", value: "$261M", color: "#45E38A" },
  { company: "DataMind AI", event: "entered negotiation with Google", value: "$315M", color: "#FF8A3D" },
  { company: "SecureLayer", event: "diligence opened · Palo Alto Networks", value: "$198M", color: "#FFB14A" },
  { company: "CareSphere", event: "data room access · UnitedHealth", value: "$175M", color: "#58C6FF" },
  { company: "Atlas Fintech", event: "new mandate indexed", value: "$420M", color: "#5AD1FF" },
  { company: "NextGen Robotics", event: "initial review · Rockwell", value: "$142M", color: "rgba(255,255,255,.6)" },
  { company: "Verdant Bio", event: "closed · strategic acquirer", value: "$540M", color: "#45E38A" },
];
const heatGradient = (bars: number) =>
  bars >= 9 ? "linear-gradient(90deg,#FF5A5A,#FF3434)"
  : bars >= 8 ? "linear-gradient(90deg,#FF9A3D,#FF7030)"
  : bars >= 6 ? "linear-gradient(90deg,#FFD36B,#FFB84A)"
  : "linear-gradient(90deg,#78B7FF,#4A8CFF)";

const CommandBoard: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div
    className="overflow-hidden rounded-3xl text-white"
    style={{
      background: "linear-gradient(180deg,#08203B 0%,#06182E 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    }}
  >
    {/* ---- TOP STATUS STRIP · live indices + LOI counter ---- */}
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/5 px-5 py-2.5" style={{ background: "rgba(255,255,255,.02)" }}>
      <div className="flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#45E38A" }} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">Acquisition Command Center</span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {INDICES.map((ix) => (
          <div key={ix.label} className="flex items-baseline gap-1.5">
            <span className="font-bold leading-none" style={{ color: ix.color, fontSize: 12 }}>{ix.value}</span>
            <span className="text-[9px] uppercase tracking-wide text-white/40">{ix.label}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-[25%_45%_30%]">
      {/* ---- COL 1 · STRATEGIC BUYERS ---- */}
      <div className="border-b border-white/5 p-5 lg:border-b-0 lg:border-r">
        <BoardHeader title="Strategic Buyers" right="Match Score" />
        <div className="mt-1">
          {STRATEGIC_BUYERS.map(([name, sector, match, status]) => (
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

      {/* ---- COL 2 · LIVE TRANSACTIONS ---- */}
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

      {/* ---- COL 3 · ACQUISITION DEMAND ---- */}
      <div className="p-5">
        <BoardHeader title="Acquisition Demand" right="Market Heat" />
        <div className="mt-3 space-y-2.5">
          {DEMAND.map(([label, heat, bars]) => (
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
        {/* Market intelligence box */}
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
      </div>
    </div>

    {/* ---- BOTTOM · live deal-feed ticker ---- */}
    <div className="overflow-hidden border-t border-white/5" style={{ background: "rgba(255,255,255,.02)" }}>
      <div className="flex items-center gap-6 whitespace-nowrap px-5 py-2" style={{ animation: "boardTicker 38s linear infinite", width: "max-content" }}>
        {[...DEAL_FEED, ...DEAL_FEED].map((d, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[10px]">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
            <span className="font-semibold text-white/80">{d.company}</span>
            <span className="text-white/40">{d.event}</span>
            <span className="font-mono text-white/60">{d.value}</span>
          </span>
        ))}
      </div>
    </div>
    <style>{`@keyframes boardTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
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

const WorldDots: React.FC = () => {
  const dots = React.useMemo(() => {
    const out: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < 560; i++) {
      const x = Math.random() * 460 + 10, y = Math.random() * 240 + 10;
      const band = Math.abs(((y - 40) % 90) - 45) / 45;
      if (Math.random() > 0.34 + band * 0.42) out.push({ x, y, r: Math.random() < 0.12 ? 1.8 : 1 });
    }
    return out;
  }, []);
  return (
    <svg viewBox="0 0 480 260" className="w-full max-w-md">
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#5AD1FF" opacity={d.r > 1.2 ? 0.95 : 0.4} />)}
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
