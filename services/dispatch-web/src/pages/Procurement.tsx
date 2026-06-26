import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, Chevron, Dot, FilmGrain, useReveal, SURFACE } from "../components/brand";
import { DeploymentMatrix } from "../components/DeploymentMatrix";
import {
  ARCHITECTURE_ROUTE, SECURITY_ROUTE, COMPLIANCE_ROUTE, PRICING_ROUTE,
  DEVELOPERS_ROUTE, EVIDENCE_ROUTE, TRUST_ROUTE, VERIFY_ROUTE,
  COST_ROUTE, LIFECYCLE_ROUTE, ROI_ROUTE,
} from "../lib/routes";
import { track } from "../lib/analytics";

// Procurement Package — a self-serve dossier so technical and procurement
// reviewers can assess Sovereign Dispatch before any human contact. Every claim
// uses verifiable language; no certifications, SLAs or guarantees are asserted.
// No email is exposed: the closing action routes into the console / evaluation.

const CONTENTS = [
  ["architecture", "Architecture Overview"],
  ["deployment", "Deployment Models"],
  ["governance", "Governance Model"],
  ["security", "Security Overview"],
  ["residency", "Data Residency Options"],
  ["readiness", "Procurement Readiness"],
  ["evaluation", "Evaluation Process"],
  ["support", "Support Models"],
  ["faq", "Procurement FAQ"],
  ["roi", "ROI & Operational Model"],
  ["downloads", "Downloadable Documents"],
];

// Downloadable procurement documents — real, self-contained PDFs (generated from
// the same source as this dossier), served from /public. No gate, no NDA.
const DOCS: { file: string; title: string; blurb: string; pages: string }[] = [
  { file: "sovereign-dispatch-procurement-overview.pdf", title: "Procurement Overview", blurb: "What it is, deployment models, security, pricing and the full procurement FAQ — in one pack.", pages: "PDF" },
  { file: "sovereign-dispatch-evaluation-guide.pdf", title: "Evaluation Guide", blurb: "The evaluation path, what to test in a pilot, and a procurement checklist.", pages: "PDF" },
  { file: "sovereign-dispatch-security-architecture-summary.pdf", title: "Security & Architecture Summary", blurb: "The governed pipeline, security controls, deployment topology and residency posture.", pages: "PDF" },
];

// The evaluator's index — one destination from which a procurement team reaches
// every assessment surface. `to` is a route (new tab) or an in-page #anchor.
const INDEX: { to: string; label: string; blurb: string; ext?: boolean }[] = [
  { to: COST_ROUTE, label: "Cost of Publication", blurb: "Why Dispatch exists — the institutional process it governs.", ext: true },
  { to: LIFECYCLE_ROUTE, label: "The Governed Lifecycle", blurb: "Stage by stage: who acts, what is decided, what is proven.", ext: true },
  { to: "#roi", label: "ROI & Operational Model", blurb: "Model the scale of governed publication from your own figures." },
  { to: "#downloads", label: "Downloadable Documents", blurb: "Ready-made procurement PDFs — overview, evaluation, security." },
  { to: ARCHITECTURE_ROUTE, label: "Architecture", blurb: "System context, pipeline, security and deployment topology.", ext: true },
  { to: SECURITY_ROUTE, label: "Security", blurb: "Isolation, encryption, least privilege and immutable audit.", ext: true },
  { to: COMPLIANCE_ROUTE, label: "Compliance", blurb: "The governance frameworks the platform is built around.", ext: true },
  { to: "#deployment", label: "Deployment", blurb: "Cloud, private, sovereign, on-premise and air-gapped." },
  { to: "#security", label: "Identity & SSO", blurb: "OAuth2 tokens; identity integration during deployment." },
  { to: DEVELOPERS_ROUTE, label: "API", blurb: "REST API, webhooks and SDKs — governance as a service.", ext: true },
  { to: PRICING_ROUTE, label: "Pricing", blurb: "Priced by institution and capability, never per seat.", ext: true },
  { to: EVIDENCE_ROUTE, label: "Evidence", blurb: "The certificates and evidence chain every record carries.", ext: true },
  { to: VERIFY_ROUTE, label: "Verify a Record", blurb: "Independently confirm any published record is genuine.", ext: true },
  { to: TRUST_ROUTE, label: "Trust", blurb: "Your records, your jurisdiction, your exit — data control.", ext: true },
];

// Procurement FAQ — the questions evaluation teams actually ask, answered with
// the same verifiable language as the rest of the dossier (no SLAs/guarantees).
const FAQ: { q: string; a: React.ReactNode }[] = [
  { q: "Do we need a sales call to evaluate?", a: <>No. This dossier is fully self-serve and you can start a free evaluation in your own environment without contacting anyone.</> },
  { q: "Can we evaluate in our own environment?", a: <>Yes. Dispatch supports managed cloud, private cloud, sovereign hosting, on-premise and air-gapped deployments — see <a href="#deployment" className="text-gold-300 hover:underline">Deployment Models</a>.</> },
  { q: "How is it priced?", a: <>By institution and capability, never per seat. Concrete figures for the self-serve tiers are public on the <a href={PRICING_ROUTE} className="text-gold-300 hover:underline">pricing page</a>.</> },
  { q: "Where does our data live?", a: <>Residency is a deployment decision, agreed per institution — see <a href="#residency" className="text-gold-300 hover:underline">Data Residency Options</a>. Dispatch runs against its own dedicated database.</> },
  { q: "How do users authenticate?", a: <>Authentication uses OAuth2 client-credentials issuing short-lived, scoped tokens. Identity and SSO integration is arranged during deployment planning.</> },
  { q: "Can it integrate with our existing systems?", a: <>Yes — ERP, case-management and document systems integrate through the Dispatch API. See the <a href={DEVELOPERS_ROUTE} className="text-gold-300 hover:underline">developer platform</a>.</> },
  { q: "What can we verify independently?", a: <>Any published record can be confirmed genuine, unrevoked and untampered through the public <a href={VERIFY_ROUTE} className="text-gold-300 hover:underline">verification portal</a> — no account required.</> },
  { q: "Can we keep these materials as a PDF?", a: <>Yes. Download the ready-made procurement documents from the <a href="#downloads" className="text-gold-300 hover:underline">Downloadable Documents</a> section below, or use <em>Print → Save as PDF</em> for this page. No gated downloads.</> },
];

const Procurement: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  React.useEffect(() => track("page.procurement"), []);
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader actions={
        <button onClick={() => window.print()}
          className="no-print hidden items-center gap-2 rounded border border-white/15 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-wide text-white/75 transition hover:border-white/35 hover:text-white sm:inline-flex">
          Print / PDF
        </button>
      } />
      <PageBanner slug="procurement" alt="An evaluation meeting" />

      {/* hero */}
      <section className="border-b border-white/5 px-8 py-20 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">Evaluation Package</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl font-bold leading-[1.05] tracking-tight text-[#f4efe3] sm:text-6xl">Everything your evaluation team needs.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            A complete self-serve evaluation dossier — architecture, governance, security, residency and the evaluation
            path — so technical reviewers and procurement officers can assess Sovereign Dispatch before any call.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button onClick={() => nav("/signup")}
              className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-8px_rgba(0,0,0,0.55)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              Start a free evaluation <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
            <a href={ARCHITECTURE_ROUTE} target="_blank" rel="noopener"
              className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
              View the Architecture Overview
            </a>
            <span className="text-[12px] text-white/40">Instant · no email required</span>
          </div>
          {/* package contents — every section is instantly readable below, no gate */}
          <div className="mt-12 border-t border-white/5 pt-6">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">In this package</div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {CONTENTS.map(([id, label]) => (
                <a key={id} href={`#${id}`} className="text-[12px] font-medium uppercase tracking-wide text-white/55 transition hover:text-gold-400">{label}</a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Evaluator's index — the single destination linking every assessment surface */}
      <section className="border-b border-white/5 px-8 py-16 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">The evaluator's index</div>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">Everything an evaluation needs, in one place.</h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-white/55">Each surface is reachable directly — the value case, the technical dossier, pricing and independent verification. Nothing is gated.</p>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INDEX.map((it) => (
              <a key={it.label} href={it.to} {...(it.ext ? { target: "_blank", rel: "noopener" } : {})}
                className={`${SURFACE} group flex items-start justify-between gap-3 p-5`}>
                <span>
                  <span className="text-[14.5px] font-bold text-white">{it.label}</span>
                  <span className="mt-1 block text-[12.5px] leading-snug text-white/50">{it.blurb}</span>
                </span>
                <Chevron className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-400/50 transition group-hover:translate-x-0.5 group-hover:text-gold-400" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-8 lg:px-12">
        {/* Architecture Overview */}
        <Block id="architecture" n="01" title="Architecture Overview"
          lead="A faithful map of how a submission becomes an official record — across the API surface, governance engine, render lane and immutable record store.">
          <p className="text-[14px] leading-relaxed text-white/60">
            The Architecture Overview documents the system context, governance pipeline, security architecture, deployment
            topology and data-residency model in a single print-ready reference. It is the authoritative technical artefact
            for architecture review.
          </p>
          <a href={ARCHITECTURE_ROUTE} className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-gold-400 hover:underline">
            Open the Architecture Overview <Chevron className="h-3.5 w-3.5" />
          </a>
        </Block>

        {/* Deployment Models */}
        <Block id="deployment" n="02" title="Deployment Models"
          lead="The same governed pipeline, delivered into the operating model your mandate requires.">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Cloud", "Managed deployment for rapid adoption."],
              ["Private Cloud", "Dedicated institutional environment."],
              ["Sovereign Hosting", "Hosted within approved national or regional boundaries."],
              ["On-Premise", "Available for institutions requiring local control."],
              ["Air-Gapped", "Architecture designed to support isolated deployments. Availability subject to engagement scope."],
            ].map(([t, b]) => (
              <div key={t} className={`${SURFACE} p-5`}>
                <div className="text-[15px] font-bold text-white">{t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{b}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/40">Capability by deployment</p>
            <DeploymentMatrix />
          </div>
        </Block>

        {/* Governance Model */}
        <Block id="governance" n="03" title="Governance Model"
          lead="Nothing reaches the official record without clearing its approval policy.">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {["Submit", "Govern", "Approve", "Render", "Publish", "Archive"].map((s, i, a) => (
              <React.Fragment key={s}>
                <span className="rounded-md border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12.5px] font-semibold text-white/80">{s}</span>
                {i < a.length - 1 && <Chevron className="h-3 w-3 text-gold-400/50" />}
              </React.Fragment>
            ))}
          </div>
          <ul className="space-y-2.5 text-[14px] text-white/65">
            <li className="flex gap-2.5"><Dot /> N-eyes approval policy resolved per document type and classification.</li>
            <li className="flex gap-2.5"><Dot /> Separation of duties enforced — a submitter cannot approve their own document.</li>
            <li className="flex gap-2.5"><Dot /> Classification and clearance gating on read and approval, where enabled per deployment.</li>
            <li className="flex gap-2.5"><Dot /> Every version preserved; published artefacts are hash-stamped and immutable.</li>
          </ul>
        </Block>

        {/* Security Overview */}
        <Block id="security" n="04" title="Security Overview"
          lead="Isolation, cryptography and an immutable record at the core — not bolted on.">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Tenant isolation", "Row-level security on every table; a missing tenant claim denies by default."],
              ["Encryption", "AES-256 at rest; TLS 1.2+ in transit."],
              ["Authentication", "OAuth2 client-credentials issuing short-lived, scoped tokens."],
              ["Least privilege", "Author, reviewer, approver, publisher, auditor — each scoped to exactly its actions."],
              ["Immutable audit", "Append-only, SHA-256-hashed trail of every submission, decision and publish."],
              ["Classification-forward", "Documents carry visible classification; reads are gated against clearance."],
            ].map(([t, b]) => (
              <div key={t} className={`${SURFACE} p-5`}>
                <div className="text-[14.5px] font-bold text-white">{t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{b}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* Data Residency Options */}
        <Block id="residency" n="05" title="Data Residency Options"
          lead="Where the record lives is a deployment decision, reviewed per institution.">
          <p className="text-[14px] leading-relaxed text-white/60">
            Sovereign Dispatch runs against its own dedicated database, independent of any other platform. Residency is
            determined by deployment model — a shared region for managed cloud, a dedicated region for private cloud,
            national or regional boundaries for sovereign hosting, and local control on-premise. Specific regions, data
            handling and retention terms are agreed per institution during evaluation.
          </p>
        </Block>

        {/* Procurement Readiness */}
        <Block id="readiness" n="06" title="Procurement Readiness"
          lead="The materials and engagement model an evaluation team needs — available the moment a qualified institution asks.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Security Documentation", "Available during evaluation."],
              ["Architecture Review", "Technical review materials available."],
              ["Data Residency Discussion", "Deployment options reviewed per institution."],
              ["Enterprise Agreements", "Custom institutional contracts supported."],
              ["Support Models", "Commercial support options available."],
              ["Deployment Planning", "Implementation planning available for qualified engagements."],
            ].map(([t, b]) => (
              <div key={t} className={`${SURFACE} p-5`}>
                <div className="text-[14.5px] font-bold text-white">{t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{b}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* Evaluation Process */}
        <Block id="evaluation" n="07" title="Evaluation Process"
          lead="A predictable path from first review to production — designed to reduce procurement uncertainty.">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Procurement Package", "Self-serve dossier and architecture review."],
              ["Technical Review", "Architecture, security and integration assessment."],
              ["Pilot Deployment", "A scoped environment against real documents."],
              ["Security Review", "Controls, residency and audit evidence reviewed."],
              ["Production Rollout", "Phased deployment into operations."],
            ].map(([t, b], i) => (
              <li key={t} className={`${SURFACE} p-5`}>
                <div className="font-mono text-[12px] font-bold text-gold-400">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-[14px] font-bold text-white">{t}</div>
                <p className="mt-1 text-[12.5px] leading-snug text-white/50">{b}</p>
              </li>
            ))}
          </ol>
        </Block>

        {/* Support Models */}
        <Block id="support" n="08" title="Support Models"
          lead="Commercial support scoped to the institution and the deployment model.">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Standard", "Business-hours support for managed cloud adopters."],
              ["Priority", "Faster response targets for production institutional deployments."],
              ["Dedicated", "Named support and implementation planning for sovereign and on-premise estates."],
            ].map(([t, b]) => (
              <div key={t} className={`${SURFACE} p-5`}>
                <div className="text-[14.5px] font-bold text-white">{t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{b}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-white/35">Support tiers and response targets are defined per agreement; no uptime or response figures are asserted here.</p>
        </Block>

        {/* Procurement FAQ */}
        <Block id="faq" n="09" title="Procurement FAQ"
          lead="The questions evaluation teams ask most — answered with the same verifiable language as the rest of this dossier.">
          <div className="grid gap-4 sm:grid-cols-2">
            {FAQ.map((f) => (
              <div key={f.q} className={`${SURFACE} p-5`}>
                <div className="text-[14.5px] font-bold text-white">{f.q}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-white/60">{f.a}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* ROI & Operational Model — part of the Procurement Center */}
        <Block id="roi" n="10" title="ROI & Operational Model"
          lead="Model the scale of governed publication from your institution's own figures — an illustrative operational model, never a promise of savings.">
          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="text-[14px] leading-relaxed text-white/60">
                The operational-model estimator takes your own inputs — publications per year, reviewing offices,
                departments involved, audit frequency and your cost assumptions — and reflects the scale of activity they
                imply. It separates the judgement an official publication will always require from the coordination and
                reconstruction effort a governed platform targets.
              </p>
              <ul className="mt-4 space-y-2 text-[13.5px] text-white/65">
                <li className="flex gap-2.5"><Dot /> Driven entirely by institution-supplied assumptions.</li>
                <li className="flex gap-2.5"><Dot /> Illustrative estimates only — no guaranteed savings, ROI or payback is asserted.</li>
                <li className="flex gap-2.5"><Dot /> Results depend on your own processes, volumes and rates.</li>
              </ul>
              <a href={ROI_ROUTE} target="_blank" rel="noopener"
                className="mt-6 inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                Open the estimator <Chevron className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className={`${SURFACE} p-6`}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">What it reflects</div>
              <div className="mt-4 space-y-3">
                {[["Records / year", "Each with a permanent ID and integrity hash"], ["Review touches / year", "Office-level reviews governed in order"], ["Evidence chains / year", "Generated automatically, not by hand"], ["Effort it targets", "Coordination & reconstruction, not judgement"]].map(([t, b]) => (
                  <div key={t} className="border-b border-white/[0.06] pb-2.5 last:border-0">
                    <div className="text-[13.5px] font-semibold text-white">{t}</div>
                    <div className="text-[12px] text-white/45">{b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Block>

        {/* Downloadable procurement documents — real PDFs from /public */}
        <Block id="downloads" n="11" title="Downloadable Documents"
          lead="Ready-made procurement documents you can take into your own process. Real PDFs, no gate, no NDA.">
          <div className="grid gap-4 sm:grid-cols-3">
            {DOCS.map((d) => (
              <a key={d.file} href={`/procurement/${d.file}`} download
                className={`${SURFACE} group flex flex-col p-6`}>
                <div className="flex items-center justify-between">
                  <span className="rounded border border-white/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-gold-400/80">{d.pages}</span>
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold-400/60 transition group-hover:text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
                  </svg>
                </div>
                <div className="mt-4 font-serif text-[1.15rem] font-bold leading-tight text-white">{d.title}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">{d.blurb}</p>
                <span className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-gold-400/80 group-hover:text-gold-300">Download</span>
              </a>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-white/35">Documents use verifiable language; they assert no certifications, SLAs or guarantees. Security and architecture-review materials are available to qualified institutions during evaluation.</p>
        </Block>
      </div>

      {/* closing CTA — no email; routes into the console / evaluation */}
      <section className="border-t border-white/5 bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-20 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Begin your evaluation.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
            Review the architecture, then open the console to assess the governed pipeline directly. A role-based
            procurement contact will be published as a secondary channel.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href={ARCHITECTURE_ROUTE}
              className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
              Architecture Overview
            </a>
            <button onClick={() => nav("/console")}
              className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              Begin Evaluation <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-8 py-10 lg:px-12">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-3 text-[12px] text-white/40 sm:flex-row">
          <div className="flex items-center gap-2"><DispatchMarkInline /> Sovereign Dispatch · Procurement</div>
          <div>Sovereign by design · Auditable always</div>
        </div>
      </footer>
    </div>
  );
};

const Block: React.FC<{ id: string; n: string; title: string; lead: string; children: React.ReactNode }> = ({ id, n, title, lead, children }) => (
  <section id={id} className="scroll-mt-24 border-b border-white/5 py-14">
    <div className="mb-6 flex items-baseline gap-4">
      <span className="font-mono text-[13px] font-bold text-gold-400">{n}</span>
      <div>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-white">{title}</h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/55">{lead}</p>
      </div>
    </div>
    {children}
  </section>
);

const DispatchMarkInline: React.FC = () => (
  <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5 text-gold-400"><path d="M16 2l11 4v9c0 7-4.7 12.4-11 15-6.3-2.6-11-8-11-15V6l11-4z" stroke="currentColor" strokeWidth="1.6" /></svg>
);

export default Procurement;
