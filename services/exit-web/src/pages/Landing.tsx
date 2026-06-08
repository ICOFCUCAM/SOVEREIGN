import React from "react";
import { useNavigate } from "react-router-dom";
import ReactorHero from "../components/ReactorHero";

// Public marketing landing — the front door to ExitOS. Mirrors the Dispatch
// landing rhythm (full-bleed hero, top nav, modular grid below the fold) but
// with founder/acquisition vocabulary: sourcing → diligence → LOI → signed
// → closed. The ten modules are the product surface; presenting them as a
// grid is the proposition.

const NAV = ["Platform", "Modules", "Workflow", "Security", "Pricing"];

const MODULES: Array<{ n: string; title: string; tag: string; body: string }> = [
  { n: "01", tag: "Sourcing",  title: "Acquisition Intelligence Engine", body: "Identify and rank strategic buyers across markets — signals, posture, deal history and corporate appetite at founder-readable resolution." },
  { n: "02", tag: "Workspace", title: "Virtual Data Room",                body: "Watermarked rooms with deal-stage access policies, audit trail per artifact, and one-click reversion when a buyer drops out." },
  { n: "03", tag: "Sourcing",  title: "Buyer Marketplace",                body: "Curated directory of strategic and financial buyers with active mandates. Reverse signal: which buyers are looking for what." },
  { n: "04", tag: "Workspace", title: "Investor CRM",                     body: "Cap-table-aware relationship graph — board members, lead investors, board observers and signatories all in one stack." },
  { n: "05", tag: "Operator",  title: "AI Deal Negotiator",               body: "Term-sheet and SPA drafting with negotiation playbooks. Counters generated against your reservation lines; every change auditable." },
  { n: "06", tag: "Workspace", title: "Document Generator",               body: "Term sheets, LOIs, SPAs, disclosure schedules and side letters from doctrine templates. Versioned, citation-tracked, signature-ready." },
  { n: "07", tag: "Workspace", title: "NDA Automation",                   body: "Bilateral and mutual NDAs issued at first contact. Tracked per buyer with revocation, breach-notice and audit." },
  { n: "08", tag: "Sourcing",  title: "Acquisition Pipeline",             body: "Stage-gated pipeline from sourcing → engaged → diligence → LOI → signed → closed. Forecast, throughput and conversion in one view." },
  { n: "09", tag: "Overview",  title: "Founder Dashboard",                body: "One screen the founder opens at 8am. Live deal stage, this-week milestones, blockers and the next decision the founder owns." },
  { n: "10", tag: "Operator",  title: "Deal Closing Center",              body: "Signature orchestration, escrow choreography, regulatory filings, share-transfer mechanics — the closing checklist that doesn't drop." },
];

const TAG_STYLE: Record<string, string> = {
  Sourcing:  "text-loi-400",
  Workspace: "text-deal-400",
  Operator:  "text-loi-300",
  Overview:  "text-white/70",
};

const Landing: React.FC = () => {
  const nav = useNavigate();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04070c] text-white">
      {/* atmospheric haze */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-[10%] h-[520px] w-[520px] rounded-full opacity-25 blur-[140px]" style={{ background: "rgba(16,185,129,0.30)" }} />
        <div className="absolute -right-32 bottom-[8%] h-[520px] w-[520px] rounded-full opacity-20 blur-[140px]" style={{ background: "rgba(16,185,129,0.22)" }} />
      </div>

      {/* hero artwork — the live acquisition-intelligence reactor (WebGL /
          R3F): a particle globe computed above a 12-subsystem holographic
          reactor. Full-bleed across the hero viewport; module grid stays clean. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-screen" aria-hidden>
        <ReactorHero className="h-full w-full" />
      </div>
      {/* legibility: darken the left column for the headline while the command
          core stays bright on the right; gentle darkening at the bottom. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-screen bg-gradient-to-r from-[#04070c] from-10% via-[#04070c]/55 via-34% to-transparent to-56%" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-[calc(100vh-7rem)] h-28 bg-gradient-to-b from-transparent to-[#04070c]" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] flex-col px-6 lg:px-12">
        {/* top nav */}
        <header className="flex items-center justify-between py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-gradient-to-br from-deal-400 to-deal-700 text-sm font-black text-white shadow-lg shadow-deal-700/30">EX</div>
            <span className="text-xl font-bold tracking-tight">
              EXIT<span className="text-deal-400">OS</span>
            </span>
            <span className="ml-3 hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40 sm:inline">A Sovereign Infrastructure</span>
          </div>
          <nav className="hidden items-center gap-9 lg:flex">
            {NAV.map((n) => (
              n === "Pricing"
                ? <button key={n} onClick={() => nav("/pricing")} className="text-[13px] font-medium uppercase tracking-wide text-white/70 transition hover:text-white">{n}</button>
                : <a key={n} href={`#${n.toLowerCase()}`} className="text-[13px] font-medium uppercase tracking-wide text-white/70 transition hover:text-white">{n}</a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={() => nav("/console")} className="text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:text-white">Log in</button>
            <button
              onClick={() => nav("/console")}
              className="inline-flex items-center gap-2 rounded bg-gradient-to-b from-deal-300 to-deal-700 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-[#04140c] shadow-lg shadow-deal-700/30 transition hover:from-deal-200 hover:to-deal-600"
            >
              Launch ExitOS
            </button>
          </div>
        </header>

        {/* hero */}
        <section className="flex flex-1 items-center py-12">
          <div className="max-w-xl">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.28em] text-deal-400">The operating system for company exits</p>
            <h1 className="font-serif text-6xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
              From founder to <span className="text-deal-400">closed deal</span>,
              <br />on one console.
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-white/65">
              The substrate founders run an exit on — acquisition intelligence, data room, buyer marketplace, AI negotiator and the closing center. One console, one audit trail, one source of truth.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={() => nav("/console")}
                className="inline-flex items-center gap-3 rounded bg-gradient-to-b from-deal-300 to-deal-700 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#04140c] shadow-xl shadow-deal-700/40 transition hover:from-deal-200 hover:to-deal-600"
              >
                Launch ExitOS
              </button>
              <a href="#modules" className="inline-flex items-center rounded border border-white/20 px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/40 hover:bg-white/5">
                See the ten modules
              </a>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              <Trust label="Sovereign-grade" sub="data residency · audit posture" />
              <Trust label="Founder-first"   sub="speed of an exit. not theatre." />
              <Trust label="Auditable"       sub="every action. every artifact." />
              <Trust label="Composable"      sub="ten modules. one substrate." />
            </div>
          </div>
        </section>

        {/* module grid */}
        <section id="modules" className="border-t border-white/10 py-20">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-deal-400">The ten modules</div>
              <h2 className="mt-3 font-serif text-4xl font-bold leading-tight">The full exit substrate.</h2>
            </div>
            <p className="hidden max-w-md text-sm leading-relaxed text-white/55 lg:block">
              Each module stands on its own surface inside the console and composes with the others through one founder identity, one cap-table-aware data layer and one audit trail.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <div key={m.n} className="bg-ink-800/95 p-7 transition hover:bg-ink-700/95">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[11px] tracking-[0.22em] text-white/30">M{m.n}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${TAG_STYLE[m.tag] ?? "text-white/45"}`}>{m.tag}</span>
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold leading-tight text-white">{m.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/55">{m.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* workflow strip */}
        <section id="workflow" className="border-t border-white/10 py-20">
          <div className="mb-10 max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-deal-400">Workflow</div>
            <h2 className="mt-3 font-serif text-4xl font-bold leading-tight">Sourcing &rarr; engaged &rarr; diligence &rarr; LOI &rarr; signed &rarr; closed.</h2>
            <p className="mt-4 text-base leading-relaxed text-white/55">
              The pipeline is the institution. ExitOS makes every stage visible, every artefact addressable and every decision auditable — from first-touch outreach to closing wire confirmation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[12px] uppercase tracking-[0.18em] text-white/50">
            {["Sourcing", "Engaged", "Diligence", "LOI", "Signed", "Closed"].map((s, i, arr) => (
              <React.Fragment key={s}>
                <span className="rounded-full bg-ink-700 px-3 py-1.5 text-white/85 ring-1 ring-white/15">{s}</span>
                {i < arr.length - 1 && <span className="text-white/25">&rarr;</span>}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* closing CTA */}
        <section className="py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-deal-400">A sovereign infrastructure</div>
            <h2 className="mt-4 font-serif text-5xl font-bold leading-[1.05] tracking-tight">
              Run your exit on a console <span className="text-deal-400">institutions trust</span>.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-white/55">
              ExitOS deploys as a single-tenant institutional system or runs in the Sovereign managed environment. Either way: sovereign-grade audit, founder-first UX, one substrate from sourcing to closing.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => nav("/console")}
                className="inline-flex items-center gap-3 rounded bg-gradient-to-b from-deal-300 to-deal-700 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#04140c] shadow-xl shadow-deal-700/40 transition hover:from-deal-200 hover:to-deal-600"
              >
                Launch ExitOS
              </button>
              <a href="https://sovereigndo.com/infrastructure" className="inline-flex items-center rounded border border-white/20 px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/40 hover:bg-white/5">
                Sovereign infrastructures
              </a>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-8 text-[12px] text-white/40">
          <div>© {new Date().getFullYear()} ExitOS — A Sovereign Infrastructure</div>
          <div className="font-mono uppercase tracking-[0.22em]">exit.sovereigndo.com</div>
        </footer>
      </div>
    </div>
  );
};

const Trust: React.FC<{ label: string; sub: string }> = ({ label, sub }) => (
  <div>
    <div className="text-sm font-bold leading-tight text-white">{label}</div>
    <div className="text-xs leading-snug text-white/45">{sub}</div>
  </div>
);

export default Landing;
