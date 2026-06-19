import React from "react";
import { useNavigate } from "react-router-dom";

// Public marketing landing — the front door to Dispatch. A cinematic hero over
// the institutional product story, with a sticky top nav that scrolls to the
// six real sections (Overview, Capabilities, Workflow, Security, Integrations,
// Resources). "Launch Dispatch" / "Log in" route into the gated console.
const NAV = ["Overview", "Capabilities", "Workflow", "Security", "Integrations", "Resources"];

const Feature: React.FC<{ icon: React.ReactNode; title: string; sub: string }> = ({ icon, title, sub }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-gold-400">{icon}</div>
    <div>
      <div className="text-sm font-bold leading-tight text-white">{title}</div>
      <div className="text-xs leading-snug text-white/45">{sub}</div>
    </div>
  </div>
);

const SectionHead: React.FC<{ kicker: string; title: string; sub?: string }> = ({ kicker, title, sub }) => (
  <div className="mx-auto max-w-3xl text-center">
    <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">{kicker}</p>
    <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h2>
    {sub && <p className="mt-5 text-lg leading-relaxed text-white/55">{sub}</p>}
  </div>
);

const Card: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 transition hover:border-gold-500/30 hover:bg-white/[0.04]">
    <div className="text-base font-bold text-white">{title}</div>
    <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{body}</p>
  </div>
);

const Landing: React.FC = () => {
  const nav = useNavigate();
  return (
    <div className="bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>

      {/* ── sticky top nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070707]/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-8 py-4 lg:px-12">
          <a href="#top" className="flex items-center gap-3">
            <DispatchMark className="h-8 w-8 text-gold-400" />
            <span className="text-lg font-bold tracking-tight">SOVEREIGN <span className="text-gold-400">DISPATCH</span></span>
          </a>
          <nav className="hidden items-center gap-9 lg:flex">
            {NAV.map((n) => (
              <a key={n} href={`#${n.toLowerCase()}`} className="text-[13px] font-medium uppercase tracking-wide text-white/70 transition hover:text-white">{n}</a>
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

      {/* ── hero ───────────────────────────────────────────────────── */}
      <div id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-cover bg-right bg-no-repeat" style={{ backgroundImage: "url(/Dispatchhero.png)" }} aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/85 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-[1500px] items-center px-8 lg:px-12">
          <div className="max-w-2xl py-16">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.25em] text-gold-400">Institutional Publication Infrastructure</p>
            <h1 className="font-serif text-6xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
              From Information<br />to <span className="text-gold-400">Official Record.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/60">
              Generate briefings, board reports, policy papers, regulatory submissions, operational packages and official records at sovereign scale.
            </p>
            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              <Feature icon={<ShieldCheck />} title="Trusted" sub="by Institutions That Cannot Fail" />
              <Feature icon={<Lock />} title="Sovereign by Design" sub="Data. Residency. Operations." />
              <Feature icon={<DocFlow />} title="Governed End to End" sub="From Draft to Publication." />
              <Feature icon={<Seal />} title="Auditable Always" sub="Every Action. Every Version." />
            </div>
            <div className="mt-11 flex flex-wrap items-center gap-4">
              <button onClick={() => nav("/console")}
                className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-xl shadow-gold-700/25 transition hover:from-gold-200 hover:to-gold-500">
                Launch Dispatch
                <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <a href="#capabilities"
                className="inline-flex items-center rounded border border-white/20 px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/40 hover:bg-white/5">
                View Publication Infrastructure
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Overview ───────────────────────────────────────────────── */}
      <section id="overview" className="scroll-mt-24 border-t border-white/5 px-8 py-24 lg:px-12">
        <SectionHead kicker="Overview" title="Information becomes the official record."
          sub="Dispatch is the institutional layer between a draft and a published document. Every artefact — briefing, board pack, regulatory filing — is submitted as structured data, governed through approval, rendered to a faithful PDF/DOCX, and published with a permanent, auditable provenance trail." />
        <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-3">
          <Card title="Not a word processor" body="Documents are structured data (DDM), validated and scaffolded by type — not freeform files. The format is the contract." />
          <Card title="Governed, not just generated" body="Submit → Approve → Render → Publish. Nothing reaches the record without clearing its approval policy." />
          <Card title="Sovereign by construction" body="Tenant-isolated, residency-aware, append-only audit. Built for institutions that cannot fail." />
        </div>
      </section>

      {/* ── Capabilities ───────────────────────────────────────────── */}
      <section id="capabilities" className="scroll-mt-24 border-t border-white/5 bg-white/[0.015] px-8 py-24 lg:px-12">
        <SectionHead kicker="Capabilities" title="One pipeline, every official document."
          sub="Templates and validation per document type; deterministic, classification-banded rendering to print-grade output." />
        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Document types" body="Executive briefings, board reports, policy papers, regulatory submissions, operational packages and official records — each with its own required scaffold." />
          <Card title="Multi-format render" body="Faithful PDF (headless engine), DOCX and Markdown from a single validated source — banners, page numbers, appendices, signatures." />
          <Card title="Schema-validated" body="Every submission is checked against the DDM schema and the doc-type policy before it can render — no malformed records." />
          <Card title="Templates & scaffolds" body="Type-aware section roles and block policies enforce completeness so the output is consistent across the institution." />
          <Card title="Versioned & immutable" body="Each version is preserved; published artefacts are hash-stamped and never silently altered." />
          <Card title="Asynchronous at scale" body="A queue-backed render lane absorbs bursts and large packages without blocking submitters." />
        </div>
      </section>

      {/* ── Workflow ───────────────────────────────────────────────── */}
      <section id="workflow" className="scroll-mt-24 border-t border-white/5 px-8 py-24 lg:px-12">
        <SectionHead kicker="Workflow" title="Submit → Govern → Approve → Render → Publish → Retrieve."
          sub="The full lifecycle of an official document, enforced by the platform." />
        <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["01", "Submit", "Structured DDM payload, validated on entry."],
            ["02", "Govern", "Classification + approval policy resolved."],
            ["03", "Approve", "N-eyes sign-off; service lanes auto-approve."],
            ["04", "Render", "Faithful PDF/DOCX produced in the queue."],
            ["05", "Publish", "Released to the record; provenance sealed."],
            ["06", "Retrieve", "Signed, access-controlled artefact download."],
          ].map(([n, t, b]) => (
            <div key={n} className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
              <div className="font-mono text-[12px] font-bold text-gold-400">{n}</div>
              <div className="mt-2 text-sm font-bold text-white">{t}</div>
              <div className="mt-1 text-[12px] leading-snug text-white/50">{b}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Security ───────────────────────────────────────────────── */}
      <section id="security" className="scroll-mt-24 border-t border-white/5 bg-white/[0.015] px-8 py-24 lg:px-12">
        <SectionHead kicker="Security" title="Sovereign by design."
          sub="Built for classified and regulated material — isolation, clearance and an immutable record at the core, not bolted on." />
        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Tenant isolation (RLS)" body="Row-level security on every table; a missing tenant claim denies by default — never allow-all." />
          <Card title="Classification & clearance" body="Documents carry classification; reads and approvals are gated against principal clearance." />
          <Card title="Immutable audit" body="Append-only event trail — every submission, decision and publish, with hash chaining. Nothing can be quietly edited." />
          <Card title="Least-privilege roles" body="Author, reviewer, approver, publisher, auditor, tenant-admin — each scoped to exactly what it may do." />
          <Card title="Data residency" body="Runs against its own database in the residency you choose; independent of any other platform." />
          <Card title="Client-credentials auth" body="Machine consumers authenticate with a client_id + secret for short-lived, scoped JWTs." />
        </div>
      </section>

      {/* ── Integrations ───────────────────────────────────────────── */}
      <section id="integrations" className="scroll-mt-24 border-t border-white/5 px-8 py-24 lg:px-12">
        <SectionHead kicker="Integrations" title="An API others build on."
          sub="Dispatch provisions scoped API access per consumer and accepts documents over a stable REST surface." />
        <div className="mx-auto mt-14 grid max-w-5xl gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-7">
            <div className="text-base font-bold text-white">API provisioning</div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">Each system gets its own service client — a <span className="text-white/80">client_id + secret</span> with explicit scopes (<span className="font-mono text-gold-400/90">validate · render · read</span>). Issue, scope and revoke per consumer.</p>
            <div className="mt-5 rounded-md border border-white/10 bg-black/40 p-4 font-mono text-[12px] leading-relaxed text-white/70">
              POST /v1/token        → client-credentials → JWT<br />
              POST /v1/documents    → submit (Idempotency-Key)<br />
              POST /v1/.../approve  → governance decision<br />
              GET&nbsp;&nbsp;/v1/artifacts/:id → signed download
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-7">
            <div className="text-base font-bold text-white">Built for the estate</div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">Consumers submit their data and Dispatch returns the official record — with webhook callbacks on render and publish.</p>
            <ul className="mt-5 space-y-2.5 text-[13.5px] text-white/70">
              <li className="flex items-center gap-2"><Dot /> Emergency AI — intelligence briefings &amp; reports</li>
              <li className="flex items-center gap-2"><Dot /> Veritas — operational &amp; financial packages</li>
              <li className="flex items-center gap-2"><Dot /> ExitOS — board memoranda &amp; transaction documents</li>
              <li className="flex items-center gap-2"><Dot /> Your institution — over the same REST surface</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Resources / CTA ────────────────────────────────────────── */}
      <section id="resources" className="scroll-mt-24 border-t border-white/5 bg-white/[0.015] px-8 py-24 lg:px-12">
        <SectionHead kicker="Resources" title="Open the console." sub="Sign in with your service credentials to submit, govern and retrieve official records." />
        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-4">
          <button onClick={() => nav("/console")}
            className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-xl shadow-gold-700/25 transition hover:from-gold-200 hover:to-gold-500">
            Launch Dispatch
            <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
          <button onClick={() => nav("/console")}
            className="inline-flex items-center rounded border border-white/20 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/40 hover:bg-white/5">
            Log in to the console
          </button>
        </div>
      </section>

      <footer className="border-t border-white/5 px-8 py-10 lg:px-12">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-4 text-[12px] text-white/40 sm:flex-row">
          <div className="flex items-center gap-2"><DispatchMark className="h-5 w-5 text-gold-400" /> Sovereign Dispatch · Institutional Publication Infrastructure</div>
          <div>Sovereign by design · Auditable always</div>
        </div>
      </footer>
    </div>
  );
};

// ---- inline icons (no dependency) ----
const Dot: React.FC = () => <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />;
const DispatchMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    <path d="M16 2l11 4v9c0 7-4.7 12.4-11 15-6.3-2.6-11-8-11-15V6l11-4z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 9v9m-4-5l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Chevron: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className}><path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const ShieldCheck = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C8 19 5 15.6 5 11V5.5L12 3z" stroke="currentColor" strokeWidth="1.5" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const Lock = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" /></svg>);
const DocFlow = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 3h7l4 4v14H7V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M14 3v4h4M9 13h6M9 16h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>);
const Seal = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M9 14l-1.5 7 4.5-2.5L16.5 21 15 14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>);

export default Landing;
