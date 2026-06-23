import React from "react";
import { useNavigate } from "react-router-dom";
import { RecordArtifact } from "../components/RecordArtifact";
import { DispatchMark, Chevron, PublicFooter, TrustStrip } from "../components/brand";
import {
  PROCUREMENT_ROUTE, ARCHITECTURE_ROUTE,
  PLATFORM_ROUTE, SECURITY_ROUTE, COMPLIANCE_ROUTE, EVIDENCE_ROUTE,
} from "../lib/routes";

// The governed lifecycle, presented as a formal charter of articles (Concept B).
const ARTICLES: [string, string][] = [
  ["I", "Submission"], ["II", "Governance"], ["III", "Authorization"],
  ["IV", "Rendering"], ["V", "Publication"], ["VI", "Preservation"],
];

// Public marketing landing — the front door to Dispatch. A cinematic hero over a
// lean positioning story; the technical depth lives on dedicated pages. The sticky
// top nav mixes in-page anchors (Why, Pillars, Lifecycle, Institutions) with the
// relocated section pages (Platform, Security, Compliance, Procurement).
const NAV: { label: string; href: string }[] = [
  { label: "Why", href: "#why" },
  { label: "Pillars", href: "#pillars" },
  { label: "Lifecycle", href: "#lifecycle" },
  { label: "Institutions", href: "#institutions" },
  { label: "Platform", href: PLATFORM_ROUTE },
  { label: "Security", href: SECURITY_ROUTE },
  { label: "Compliance", href: COMPLIANCE_ROUTE },
  { label: "Procurement", href: PROCUREMENT_ROUTE },
];

const Landing: React.FC = () => {
  const nav = useNavigate();
  // Restrained reveal — content sections rise gently into view once, then settle.
  React.useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
    els.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div className="bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>

      {/* ── sticky top nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070707]/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1640px] items-center justify-between px-8 py-3.5 lg:px-12">
          <a href="#top" className="flex items-center gap-2.5">
            <DispatchMark className="h-7 w-7 text-gold-400" />
            <span className="text-base font-bold tracking-tight">SOVEREIGN <span className="text-gold-400">DISPATCH</span></span>
          </a>
          <nav className="hidden items-center gap-x-6 xl:flex">
            {NAV.map(({ label, href }) => (
              <a key={label} href={href} className="relative text-[12px] font-medium uppercase tracking-wide text-white/70 transition after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold-400/70 after:transition-all after:duration-300 hover:text-white hover:after:w-full">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={() => nav("/console")} className="text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:text-white">Log in</button>
            <button onClick={() => nav("/console")}
              className="group inline-flex items-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-8px_rgba(0,0,0,0.55)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              Launch Dispatch
              <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── hero — THE RECORD: a sealed official instrument beside a formal charter ── */}
      <div id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
        <div className="relative z-10 mx-auto grid min-h-[820px] max-w-[1540px] grid-cols-1 items-center gap-14 px-8 py-20 lg:px-12 xl:min-h-[980px] xl:grid-cols-[38fr_62fr] xl:gap-12">
          {/* narrative + charter */}
          <div className="max-w-xl">
            <p className="mb-8 text-[12.5px] font-semibold uppercase tracking-[0.34em] text-gold-400">Institutional Publication Infrastructure</p>
            <h1 className="font-serif text-[2.65rem] font-bold leading-[1.03] tracking-[-0.022em] sm:text-[3.25rem] 2xl:text-[3.6rem]">
              From Information<br />to <span className="text-gold-400">Official Record.</span>
            </h1>
            <p className="mt-7 max-w-[27rem] text-[17px] leading-[1.7] text-white/60">
              The operating system for institutional publication — where information becomes a
              sealed, governed, permanent record.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button onClick={() => nav("/console")}
                className="group inline-flex items-center justify-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                Launch Dispatch
                <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <a href={ARCHITECTURE_ROUTE}
                className="inline-flex items-center justify-center rounded border border-white/20 px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-white/85 transition active:translate-y-px hover:border-white/40 hover:bg-white/5">
                View Architecture
              </a>
            </div>
            {/* the charter — quieted so the instrument dominates */}
            <div className="mt-11 border-t border-white/10 pt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/30">The Governed Lifecycle</p>
              <dl className="mt-4 grid max-w-md grid-cols-2 gap-x-8 gap-y-0">
                {ARTICLES.map(([num, label]) => (
                  <div key={num} className="flex items-baseline gap-2.5 border-b border-white/[0.06] py-2">
                    <dt className="w-6 font-serif text-[12px] text-gold-400/70">{num}</dt>
                    <dd className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/65">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          {/* the instrument — the dominant visual object */}
          <div className="relative flex justify-center xl:justify-end">
            <RecordArtifact className="w-full max-w-[420px] xl:max-w-[700px]" />
          </div>
        </div>
      </div>

      {/* ── Why Dispatch Exists — strategic context + outcomes ─────── */}
      <section id="why" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-28 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-10 bg-gold-500/45" aria-hidden />
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">Why Dispatch Exists</p>
          <h2 className="mt-5 font-serif text-4xl font-bold leading-[1.08] text-white sm:text-5xl">
            Most systems manage documents.<br />Dispatch governs the path to official record.
          </h2>
          <p className="mx-auto mt-7 max-w-[42rem] text-lg leading-[1.7] text-white/55">
            Institutions produce decisions every day — briefings, policies, resolutions, regulatory filings. Most tools
            store and share those files. None govern the moment one becomes the official record.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Enforce governance before publication", "Nothing is published until it clears its approval policy."],
            ["Eliminate unofficial records", "One governed path — no shadow copies or unverified files."],
            ["Maintain evidentiary chains", "Every action hash-stamped to an append-only audit trail."],
            ["Preserve institutional memory", "Every version retained and retrievable, by policy."],
            ["Reduce publication risk", "Classification, clearance and review enforced by the system."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.012] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-gold-500/25 p-6">
              <div className="text-[14px] font-bold leading-snug text-white">{t}</div>
              <p className="mt-2 text-[12.5px] leading-snug text-white/50">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category-owning Pillars ────────────────────────────────── */}
      <section id="pillars" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-28 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.07] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:grid-cols-3">
          {[
            ["01", "The System of Record", "Not document management. The authority that decides when information becomes official — and seals it."],
            ["02", "The Governance Layer", "The institutional layer between a decision and its published record. Nothing reaches the record ungoverned."],
            ["03", "The Sovereign Standard", "Infrastructure that runs under your jurisdiction — never a vendor's cloud. The standard institutions adopt for decades."],
          ].map(([n, t, b]) => (
            <div key={t} className="group/p relative bg-[#070707] p-9 transition duration-300 hover:bg-[#0b0a07]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent transition duration-300 group-hover/p:via-gold-500/45" aria-hidden />
              <div className="font-mono text-[12px] text-gold-400/70">{n}</div>
              <h3 className="mt-5 font-serif text-[1.7rem] font-bold leading-[1.12] tracking-[-0.01em] text-white">{t}</h3>
              <p className="mt-4 text-[14px] leading-relaxed text-white/55">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Record Lifecycle — quieted to a compact inline strip (−30%) ── */}
      <section id="lifecycle" className="scroll-mt-24 border-t border-white/[0.06] bg-white/[0.015] px-8 py-16 lg:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">The Record Lifecycle</p>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-white/45">One governed path — every official document travels the same controlled route.</p>
        </div>
        <div className="mx-auto mt-9 flex max-w-3xl flex-wrap items-center justify-center gap-y-4">
          {["Submit", "Govern", "Approve", "Render", "Publish", "Preserve"].map((n, i, a) => (
            <React.Fragment key={n}>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-gold-400/70">{`0${i + 1}`}</span>
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-white/65">{n}</span>
              </div>
              {i < a.length - 1 && <div className="mx-3 h-px w-6 bg-gradient-to-r from-gold-500/35 to-gold-500/10 sm:w-9" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── A Record That Proves Itself — provenance positioning ─────── */}
      <section id="proof" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-28 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-10 bg-gold-500/45" aria-hidden />
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">Provenance</p>
          <h2 className="mt-4 font-serif text-4xl font-bold leading-[1.08] text-white sm:text-5xl">A Record That Proves Itself.</h2>
          <p className="mx-auto mt-6 max-w-[44rem] text-lg leading-[1.7] text-white/55">
            Every Dispatch record carries its own evidence — sealed, attributed and verifiable long after the people who
            created it have moved on. The institution doesn't ask you to trust the record.{" "}
            <span className="font-medium text-white/90">The record proves itself.</span>
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {[
            ["Sealed provenance", "Who issued it, under what authority, and when — bound into the record itself."],
            ["Append-only history", "Every action preserved in order. Nothing is quietly edited or removed."],
            ["Verifiable integrity", "A cryptographic seal anyone authorized can check, for the life of the record."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.012] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-gold-500/25 p-6 text-center">
              <div className="text-[14px] font-bold text-white">{t}</div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/50">{b}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <a href={EVIDENCE_ROUTE} className="text-[13px] font-semibold uppercase tracking-wide text-gold-400 transition hover:text-gold-300">See the evidence →</a>
        </div>
      </section>

      {/* ── Procurement CTA (above institutions) ───────────────────── */}
      <section id="procurement" className="scroll-mt-24 border-t border-white/[0.06] bg-white/[0.015] px-8 py-28 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-10 bg-gold-500/45" aria-hidden />
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">Procurement</p>
          <h2 className="mt-4 font-serif text-4xl font-bold leading-[1.08] text-white sm:text-5xl">Ready for institutional evaluation.</h2>
          <p className="mx-auto mt-5 max-w-[40rem] text-lg leading-[1.7] text-white/55">Architecture, security and procurement materials — self-serve, before any human contact.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => nav(PROCUREMENT_ROUTE)}
              className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-8 py-4 text-sm font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              Request Procurement Package
              <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <a href={ARCHITECTURE_ROUTE}
              className="inline-flex items-center rounded border border-white/20 px-8 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-white/85 transition active:translate-y-px hover:border-white/40 hover:bg-white/5">
              View Architecture
            </a>
          </div>
        </div>
      </section>

      {/* ── Institutions — outcome-driven narratives ───────────────── */}
      <section id="institutions" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-28 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 h-px w-10 bg-gold-500/45" aria-hidden />
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">Built for institutions that cannot fail</p>
          <h2 className="mt-5 max-w-[20ch] font-serif text-4xl font-bold leading-[1.08] text-white sm:text-5xl">What each institution turns into a record.</h2>
        </div>
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
          {[
            ["Government", "Ministries · Regulators · Authorities", "Publish policy, legislation and official notices as sealed records — full provenance, no shadow copies."],
            ["Healthcare", "Hospitals · Health authorities", "Issue clinical, safety and regulatory records that withstand audit and time — every version preserved, every release attributable."],
            ["Education", "Universities · Research bodies", "Confer and preserve official records — credentials, resolutions and research outputs — under the institution's own seal."],
            ["Enterprise", "Regulated industries · Critical infrastructure", "Turn board and compliance decisions into permanent, defensible records a regulator can trust."],
          ].map(([cat, who, story]) => (
            <div key={cat} className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.012] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-gold-500/25 p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-gold-400/90">{cat}</div>
                <div className="text-[11px] uppercase tracking-[0.1em] text-white/35">{who}</div>
              </div>
              <p className="mt-4 text-[14px] leading-relaxed text-white/60">{story}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── trust strip + footer ───────────────────────────────────── */}
      <TrustStrip />
      <PublicFooter />
    </div>
  );
};

export default Landing;
