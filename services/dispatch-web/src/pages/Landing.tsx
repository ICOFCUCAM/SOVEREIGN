import React from "react";
import { useNavigate } from "react-router-dom";
import { RecordArtifact } from "../components/RecordArtifact";
import { SectionHead, DispatchMark, Chevron, PublicFooter, TrustStrip } from "../components/brand";
import {
  PROCUREMENT_ROUTE, ARCHITECTURE_ROUTE,
  PLATFORM_ROUTE, SECURITY_ROUTE, COMPLIANCE_ROUTE,
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
  return (
    <div className="bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>

      {/* ── sticky top nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070707]/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1640px] items-center justify-between px-8 py-3 lg:px-12">
          <a href="#top" className="flex items-center gap-2.5">
            <DispatchMark className="h-7 w-7 text-gold-400" />
            <span className="text-base font-bold tracking-tight">SOVEREIGN <span className="text-gold-400">DISPATCH</span></span>
          </a>
          <nav className="hidden items-center gap-x-4 xl:flex">
            {NAV.map(({ label, href }) => (
              <a key={label} href={href} className="text-[12px] font-medium uppercase tracking-wide text-white/70 transition hover:text-white">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={() => nav("/console")} className="text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:text-white">Log in</button>
            <button onClick={() => nav("/console")}
              className="group inline-flex items-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-lg shadow-gold-700/20 transition hover:from-gold-200 hover:to-gold-500">
              Launch Dispatch
              <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── hero — THE RECORD: a sealed official instrument beside a formal charter ── */}
      <div id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
        <div className="relative z-10 mx-auto grid min-h-[780px] max-w-[1500px] grid-cols-1 items-center gap-14 px-8 py-20 lg:px-12 xl:min-h-[900px] xl:grid-cols-[45fr_55fr] xl:gap-10">
          {/* narrative + charter */}
          <div className="max-w-xl">
            <p className="mb-8 text-[12.5px] font-semibold uppercase tracking-[0.34em] text-gold-400">Institutional Publication Infrastructure</p>
            <h1 className="font-serif text-4xl font-bold leading-[1.06] tracking-[-0.01em] sm:text-[3.25rem] 2xl:text-[3.6rem]">
              From Information<br />to <span className="text-gold-400">Official Record.</span>
            </h1>
            <p className="mt-7 max-w-md text-[17px] leading-relaxed text-white/60">
              Sovereign Dispatch is the operating system for institutional publication — the authority that turns
              information into a sealed, governed and permanent record.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button onClick={() => nav("/console")}
                className="group inline-flex items-center justify-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-xl shadow-gold-700/25 transition hover:from-gold-200 hover:to-gold-500">
                Launch Dispatch
                <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <a href={ARCHITECTURE_ROUTE}
                className="inline-flex items-center justify-center rounded border border-white/20 px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/40 hover:bg-white/5">
                View Architecture
              </a>
            </div>
            {/* the charter — the governed lifecycle as numbered articles */}
            <div className="mt-12 border-t border-white/10 pt-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/35">The Governed Lifecycle</p>
              <dl className="mt-5 grid max-w-lg grid-cols-2 gap-x-10 gap-y-0.5">
                {ARTICLES.map(([num, label]) => (
                  <div key={num} className="flex items-baseline gap-3 border-b border-white/[0.07] py-2.5">
                    <dt className="w-7 font-serif text-[13px] text-gold-400/80">{num}</dt>
                    <dd className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/75">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          {/* the instrument */}
          <div className="relative flex justify-center xl:justify-end">
            <RecordArtifact className="w-full max-w-[380px] xl:max-w-[620px]" />
          </div>
        </div>
      </div>

      {/* ── Why Dispatch Exists — strategic context + outcomes ─────── */}
      <section id="why" className="scroll-mt-24 border-t border-white/5 px-8 py-24 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">Why Dispatch Exists</p>
          <h2 className="mt-4 font-serif text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Most systems manage documents.<br />Dispatch governs the path to official record.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/55">
            Institutions produce decisions every day — briefings, policies, board resolutions, regulatory submissions,
            official notices. Most tools store and share those files. None of them govern the moment information becomes
            the official record.
          </p>
        </div>
        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Enforce governance before publication", "Nothing is published until it clears its approval policy."],
            ["Eliminate unofficial records", "One governed path — no shadow copies or unverified files."],
            ["Maintain evidentiary chains", "Every action hash-stamped to an append-only audit trail."],
            ["Preserve institutional memory", "Every version retained and retrievable, by policy."],
            ["Reduce publication risk", "Classification, clearance and review enforced by the system."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
              <div className="text-[14px] font-bold leading-snug text-white">{t}</div>
              <p className="mt-2 text-[12.5px] leading-snug text-white/50">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Three Pillars ──────────────────────────────────────────── */}
      <section id="pillars" className="scroll-mt-24 border-t border-white/5 px-8 py-24 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] sm:grid-cols-3">
          {[
            ["Authority", "Information becomes an official record only after it clears its governance — sealed, attributed and final."],
            ["Auditability", "Every action is written to an append-only, hash-verified trail. The record proves itself."],
            ["Sovereignty", "Runs where your mandate requires — cloud, sovereign, on-premise or air-gapped. Your data, your boundaries."],
          ].map(([t, b], i) => (
            <div key={t} className="bg-[#070707] p-9">
              <div className="font-mono text-[12px] text-gold-400/80">{`0${i + 1}`}</div>
              <h3 className="mt-4 font-serif text-2xl font-bold text-white">{t}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-white/55">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Record Lifecycle — one visual ──────────────────────────── */}
      <section id="lifecycle" className="scroll-mt-24 border-t border-white/5 bg-white/[0.015] px-8 py-24 lg:px-12">
        <SectionHead kicker="The Record Lifecycle" title="One governed path from information to record."
          sub="Six stages, enforced by the platform — every official document travels the same controlled route." />
        <div className="mx-auto mt-14 flex max-w-5xl flex-wrap items-center justify-center gap-y-5">
          {["Submit", "Govern", "Approve", "Render", "Publish", "Preserve"].map((n, i, a) => (
            <React.Fragment key={n}>
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/30 bg-white/[0.03] font-mono text-[12px] text-gold-400">{`0${i + 1}`}</div>
                <div className="mt-3 text-[12.5px] font-bold uppercase tracking-wide text-white/80">{n}</div>
              </div>
              {i < a.length - 1 && <div className="mx-2 h-px w-8 bg-gradient-to-r from-gold-500/40 to-gold-500/10 sm:w-12" />}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-12 text-center">
          <a href={ARCHITECTURE_ROUTE} className="text-[13px] font-semibold uppercase tracking-wide text-gold-400 transition hover:text-gold-300">See how the lifecycle is governed →</a>
        </div>
      </section>

      {/* ── Institutional Proof ────────────────────────────────────── */}
      <section id="institutions" className="scroll-mt-24 border-t border-white/5 px-8 py-24 lg:px-12">
        <SectionHead kicker="Built for institutions that cannot fail" title="The system of record for every governed institution." />
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Government", "Ministries · Regulators · Authorities"],
            ["Healthcare", "Hospitals · Health agencies"],
            ["Education", "Universities · Research bodies"],
            ["Enterprise", "Regulated industries · Critical infrastructure"],
          ].map(([t, b]) => (
            <div key={t} className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-gold-400/90">{t}</div>
              <p className="mt-3 text-[13px] leading-relaxed text-white/55">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Procurement CTA ────────────────────────────────────────── */}
      <section id="procurement" className="scroll-mt-24 border-t border-white/5 bg-white/[0.015] px-8 py-24 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">Procurement</p>
          <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">Ready for institutional evaluation.</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/55">The architecture, security and procurement materials your evaluation team needs — self-serve, before any human contact.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => nav(PROCUREMENT_ROUTE)}
              className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-xl shadow-gold-700/25 transition hover:from-gold-200 hover:to-gold-500">
              Request Procurement Package
              <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <a href={ARCHITECTURE_ROUTE}
              className="inline-flex items-center rounded border border-white/20 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/40 hover:bg-white/5">
              View Architecture
            </a>
          </div>
        </div>
      </section>

      {/* ── trust strip + footer ───────────────────────────────────── */}
      <TrustStrip />
      <PublicFooter />
    </div>
  );
};

export default Landing;
