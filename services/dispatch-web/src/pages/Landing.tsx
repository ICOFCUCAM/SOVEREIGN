import React from "react";
import { useNavigate } from "react-router-dom";
import { DeploymentMatrix } from "../components/DeploymentMatrix";
import { LastPublishedCard, LifecycleTrail, PublicAuditTimeline, CapabilitiesDashboard } from "../components/operations";
import { HeroVisual } from "../components/HeroVisual";
import { HeroCanvas } from "../components/HeroCanvas";
import { PROCUREMENT_ROUTE, ARCHITECTURE_ROUTE } from "../lib/routes";

// Public marketing landing — the front door to Dispatch. A cinematic hero over
// the institutional product story, with a sticky top nav that scrolls to the
// six real sections (Overview, Capabilities, Workflow, Security, Integrations,
// Resources). "Launch Dispatch" / "Log in" route into the gated console.
const NAV = ["Overview", "Capabilities", "Workflow", "Security", "Deployment", "Compliance", "Institutions", "Procurement", "Integrations", "Resources"];

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

// Evidence step — a left rail (number + mental-model label + one line) beside the
// proof component, so the section reads as a narrative: how it works → how it is
// governed → what gets produced → how it is deployed.
const EvidenceStep: React.FC<{ n: string; label: string; lead: string; children: React.ReactNode }> = ({ n, label, lead, children }) => (
  <div className="grid gap-4 lg:grid-cols-[230px_1fr] lg:gap-8">
    <div className="lg:pt-1">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[13px] font-bold text-gold-400">{n}</span>
        <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/80">{label}</span>
      </div>
      <p className="mt-2 max-w-[230px] text-[13px] leading-relaxed text-white/45">{lead}</p>
    </div>
    <div className="min-w-0">{children}</div>
  </div>
);

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
            {NAV.map((n) => (
              <a key={n} href={`#${n.toLowerCase()}`} className="text-[12px] font-medium uppercase tracking-wide text-white/70 transition hover:text-white">{n}</a>
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
        {/* layered hero: canvas atmosphere (cords/map/bloom) + crisp SVG overlay */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[76%] xl:block" aria-hidden>
          <HeroCanvas className="absolute inset-0 h-full w-full" />
          <HeroVisual className="absolute inset-0 h-full w-full" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/80 to-transparent xl:from-[#070707] xl:via-[#070707]/12 xl:via-22% xl:to-transparent xl:to-44%" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
        <div className="relative z-10 mx-auto grid min-h-[920px] max-w-[1640px] grid-cols-1 items-center gap-10 px-8 py-20 lg:px-12 xl:min-h-[960px] xl:grid-cols-[27fr_73fr] xl:gap-6">
          <div className="max-w-lg xl:max-w-[26rem]">
            <p className="mb-8 text-[13px] font-semibold uppercase tracking-[0.28em] text-gold-400">Institutional Publication Infrastructure</p>
            <h1 className="font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl xl:text-[2.5rem] 2xl:text-[2.75rem]">
              From Information<br />to <span className="text-gold-400">Official Record.</span>
            </h1>
            <p className="mt-8 max-w-md text-[17px] leading-relaxed text-white/60">
              Sovereign Dispatch is the operating system for institutional publication — purpose-built to submit, govern,
              approve, render, publish and archive with sovereignty, auditability and trust.
            </p>
            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
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
            <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 text-[13px] font-medium text-white/55">
              <span className="inline-flex items-center gap-2"><ShieldCheck /> Sovereign by Design</span>
              <span className="text-gold-400/30">·</span>
              <span className="inline-flex items-center gap-2"><Lock /> Auditable by Default</span>
              <span className="text-gold-400/30">·</span>
              <span className="inline-flex items-center gap-2"><Bank /> Institution Ready</span>
            </div>
          </div>
          {/* right column is the layered visual, rendered absolutely above */}
          <div className="hidden xl:block" aria-hidden />
        </div>
      </div>

      {/* ── value strip — six capabilities, with substance ─────────── */}
      <div className="border-t border-white/5 px-8 py-12 lg:px-12">
        <div className="mx-auto grid max-w-[1500px] gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            [<ShieldCheck />, "Sovereign Control", "Your data, your rules — end-to-end sovereignty by design."],
            [<Lock />, "Auditable by Default", "Every action recorded, traceable and reviewable across the lifecycle."],
            [<Database />, "Data Residency", "Deploy where your data must live. You decide the boundaries."],
            [<Nodes />, "Deploy Your Way", "Cloud, Private, Sovereign, On-Premise or Air-Gapped — your choice."],
            [<Tower />, "Built to Endure", "Security, isolation and operational resilience at the core."],
            [<Headset />, "Institutional Support", "Engagement and implementation planning for mission-critical operations."],
          ].map(([icon, t, d]) => (
            <div key={t as string} className="border-l border-gold-500/25 pl-4">
              <div className="text-gold-400">{icon as React.ReactNode}</div>
              <div className="mt-3 text-[12.5px] font-bold uppercase tracking-wide text-white">{t as string}</div>
              <p className="mt-1.5 text-[12.5px] leading-snug text-white/50">{d as string}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── built for — institutional sectors, not logos ──────────── */}
      <div className="border-t border-white/5 bg-white/[0.015] px-8 py-14 lg:px-12">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-white/35">Built for institutions that cannot fail</p>
        <div className="mx-auto mt-9 grid max-w-5xl gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ["Government", ["National ministries", "Regulators", "Authorities"]],
            ["Education", ["Universities", "Schools", "Research institutes"]],
            ["Healthcare", ["Hospitals", "Health agencies"]],
            ["NGOs", ["International organizations", "Foundations"]],
            ["Enterprise", ["Regulated industries", "Critical infrastructure"]],
          ].map(([sector, items]) => (
            <div key={sector as string} className="text-center sm:text-left">
              <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-gold-400/90">{sector as string}</div>
              <ul className="mt-3 space-y-1.5 text-[12.5px] leading-snug text-white/50">
                {(items as string[]).map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          ))}
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

      {/* ── Evidence ───────────────────────────────────────────────── */}
      <section id="evidence" className="scroll-mt-24 border-t border-white/5 bg-white/[0.015] px-8 py-24 lg:px-12">
        <SectionHead kicker="Evidence" title="See the governance, not the promise."
          sub="Every official record carries its own provenance — from how it works, to how it is governed, to what gets produced and how it is deployed." />
        <div className="mx-auto mt-16 max-w-5xl space-y-12">
          <EvidenceStep n="01" label="How it works" lead="A submission becomes an official record through a single governed path.">
            <LifecycleTrail />
          </EvidenceStep>
          <EvidenceStep n="02" label="How it is governed" lead="Every action is recorded to an append-only, hash-verified audit trail.">
            <PublicAuditTimeline />
          </EvidenceStep>
          <EvidenceStep n="03" label="What gets produced" lead="A faithful, classified, hash-stamped record — PDF and DOCX.">
            <LastPublishedCard />
          </EvidenceStep>
          <EvidenceStep n="04" label="How it is deployed" lead="Into the sovereignty model your mandate requires.">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-7">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">Architecture Overview</span>
                  <div className="mt-2 font-serif text-xl font-bold text-white">System, governance, security &amp; deployment — one reference.</div>
                  <p className="mt-1.5 text-[13px] text-white/50">Cloud · Private · Sovereign · On-Premise · Air-Gapped. Print-ready for procurement.</p>
                </div>
                <button onClick={() => nav(ARCHITECTURE_ROUTE)}
                  className="group inline-flex shrink-0 items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-lg shadow-gold-700/20 transition hover:from-gold-200 hover:to-gold-500">
                  View Architecture <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </EvidenceStep>
        </div>
      </section>

      {/* ── Security ───────────────────────────────────────────────── */}
      <section id="security" className="scroll-mt-24 border-t border-white/5 px-8 py-24 lg:px-12">
        <SectionHead kicker="Security" title="Sovereign by design."
          sub="Built for classified and regulated material — isolation, clearance and an immutable record at the core, not bolted on." />
        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Tenant isolation (RLS)" body="Row-level security on every table; a missing tenant claim denies by default — never allow-all." />
          <Card title="Classification & clearance" body="Documents carry classification; reads and approvals are gated against principal clearance." />
          <Card title="Immutable audit" body="Append-only event trail — every submission, decision and publish, with hash chaining. Nothing can be quietly edited." />
          <Card title="Least-privilege roles" body="Author, reviewer, approver, publisher, auditor, tenant-admin — each scoped to exactly what it may do." />
          <Card title="Data residency" body="Runs against its own database in the residency you choose; independent of any other platform." />
          <Card title="Client-credentials auth" body="Machine consumers authenticate with a client_id + secret for short-lived, scoped JWTs." />
          <Card title="Operational continuity" body="Architected for backup, recovery, retention and continuity requirements — defined per deployment." />
        </div>
      </section>

      {/* ── Sovereignty dashboard ──────────────────────────────────── */}
      <section id="sovereignty" className="scroll-mt-24 border-t border-white/5 bg-white/[0.015] px-8 py-24 lg:px-12">
        <SectionHead kicker="Sovereignty" title="Capabilities, not badges."
          sub="What the platform actually does — across deployment, security and governance. Each capability is available by deployment model and verifiable during evaluation." />
        <div className="mx-auto mt-14 max-w-5xl">
          <CapabilitiesDashboard />
        </div>
      </section>

      {/* ── Deployment & Architecture ──────────────────────────────── */}
      <section id="deployment" className="scroll-mt-24 border-t border-white/5 px-8 py-24 lg:px-12">
        <SectionHead kicker="Deployment" title="Deploy where sovereignty requires."
          sub="Sovereign Dispatch is architected to support cloud, private-cloud, sovereign-hosted, and institutional deployment models." />
        <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Cloud", "Managed deployment for rapid adoption.", ""],
            ["Private Cloud", "Dedicated institutional environment.", ""],
            ["Sovereign Hosting", "Hosted within approved national or regional boundaries.", ""],
            ["On-Premise", "Available for institutions requiring local control.", ""],
            ["Air-Gapped", "Architecture designed to support isolated deployments.", "Availability subject to engagement scope."],
          ].map(([t, b, note]) => (
            <div key={t} className="flex flex-col rounded-lg border border-white/10 bg-white/[0.02] p-5">
              <div className="text-[15px] font-bold text-white">{t}</div>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-white/55">{b}</p>
              {note && <p className="mt-3 text-[11px] italic leading-snug text-white/35">{note}</p>}
            </div>
          ))}
        </div>

        {/* system flow */}
        <div className="mx-auto mt-16 max-w-sm">
          <p className="mb-6 text-center text-[12px] font-semibold uppercase tracking-[0.25em] text-white/35">System flow</p>
          <div className="flex flex-col items-stretch">
            {["Institution", "Submit", "Govern", "Approve", "Render", "Publish", "Archive"].map((n, i, a) => (
              <React.Fragment key={n}>
                <div className={`rounded-md border px-5 py-3 text-center text-sm font-semibold ${i === 0 ? "border-gold-500/30 bg-gold-500/[0.06] text-white" : "border-white/10 bg-white/[0.03] text-white/85"}`}>{n}</div>
                {i < a.length - 1 && <div className="flex justify-center py-1.5"><Chevron className="h-4 w-4 rotate-90 text-gold-400/60" /></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* capability-by-deployment matrix */}
        <div className="mx-auto mt-16 max-w-4xl">
          <p className="mb-5 text-center text-[12px] font-semibold uppercase tracking-[0.25em] text-white/35">Capability by deployment</p>
          <DeploymentMatrix />
        </div>
      </section>

      {/* ── Compliance & Security ──────────────────────────────────── */}
      <section id="compliance" className="scroll-mt-24 border-t border-white/5 bg-white/[0.015] px-8 py-24 lg:px-12">
        <SectionHead kicker="Compliance & Security" title="Built around modern governance frameworks."
          sub="Sovereign Dispatch is engineered around the control frameworks institutions are assessed against — described in honest terms, with evidence available during evaluation." />
        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["ISO 27001", "Architecture aligned with widely adopted information-security controls."],
            ["SOC 2", "Designed using audited operational-security principles."],
            ["NIS2", "Supports governance and risk-management workflows."],
            ["GDPR", "Supports data-management and residency practices."],
            ["Auditability", "Every publication event can be recorded, tracked, and reviewed."],
            ["Retention Policies", "Institution-defined retention controls."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <div className="text-base font-bold text-white">{t}</div>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">{b}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-[12px] leading-relaxed text-white/35">
          Framework names describe the controls the architecture is aligned to, not independent certifications.
          Certification scope, data residency and retention are defined per deployment.
        </p>
      </section>

      {/* ── Institutions ───────────────────────────────────────────── */}
      <section id="institutions" className="scroll-mt-24 border-t border-white/5 px-8 py-24 lg:px-12">
        <SectionHead kicker="Institutions" title="Built for institutions that cannot fail."
          sub="The same governed pipeline serves any institution that turns information into an official record — each isolated in its own tenancy." />
        <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Government", ["Ministries", "Departments", "Agencies", "Authorities"]],
            ["Education", ["Universities", "Schools", "Research bodies"]],
            ["Healthcare", ["Hospitals", "Health agencies"]],
            ["NGOs", ["International organizations", "Foundations", "Programs"]],
            ["Enterprise", ["Regulated industries", "Critical infrastructure"]],
          ].map(([cat, items]) => (
            <div key={cat as string} className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <div className="text-base font-bold text-white">{cat as string}</div>
              <ul className="mt-3 space-y-1.5">
                {(items as string[]).map((it) => (
                  <li key={it} className="flex items-center gap-2.5 text-[13.5px] text-white/65"><Dot /> {it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Procurement ────────────────────────────────────────────── */}
      <section id="procurement" className="scroll-mt-24 border-t border-white/5 bg-white/[0.015] px-8 py-24 lg:px-12">
        <SectionHead kicker="Procurement" title="Ready for institutional procurement."
          sub="The materials and engagement model an evaluation team needs — available the moment a qualified institution asks." />
        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Security Documentation", "Security control documentation provided to evaluation teams during assessment."],
            ["Architecture Review", "Technical architecture package available for evaluation teams."],
            ["Data Residency Discussion", "Deployment and residency options reviewed per institution."],
            ["Enterprise Agreements", "Custom institutional agreements supported per engagement."],
            ["Support Models", "Institutional support and escalation paths available by engagement."],
            ["Deployment Planning", "Implementation and rollout planning for qualified engagements."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <div className="text-base font-bold text-white">{t}</div>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">{b}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-4">
          <button onClick={() => nav(PROCUREMENT_ROUTE)}
            className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-xl shadow-gold-700/25 transition hover:from-gold-200 hover:to-gold-500">
            Request Procurement Package
            <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
          <a href={ARCHITECTURE_ROUTE}
            className="inline-flex items-center rounded border border-white/20 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/40 hover:bg-white/5">
            Architecture Overview
          </a>
        </div>
      </section>

      {/* ── Integrations ───────────────────────────────────────────── */}
      <section id="integrations" className="scroll-mt-24 border-t border-white/5 bg-white/[0.015] px-8 py-24 lg:px-12">
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
      <section id="resources" className="scroll-mt-24 border-t border-white/5 px-8 py-24 lg:px-12">
        <SectionHead kicker="Evaluation" title="Begin an institutional evaluation."
          sub="Review the governed platform in the console, or request the procurement package for your evaluation team." />
        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-4">
          <button onClick={() => nav(PROCUREMENT_ROUTE)}
            className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-xl shadow-gold-700/25 transition hover:from-gold-200 hover:to-gold-500">
            Request Procurement Package
            <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
          <button onClick={() => nav("/console")}
            className="inline-flex items-center rounded border border-white/20 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/40 hover:bg-white/5">
            Review the platform
          </button>
        </div>
      </section>

      {/* ── trust strip ────────────────────────────────────────────── */}
      <div className="border-t border-white/10 bg-white/[0.02] px-8 py-6 lg:px-12">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/45">
          <span>Sovereign by Design</span>
          <span className="hidden text-gold-400/40 sm:inline">·</span>
          <span>Auditable by Default</span>
          <span className="hidden text-gold-400/40 sm:inline">·</span>
          <span>Institution Ready</span>
        </div>
      </div>

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
const ShieldCheck = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="text-gold-400"><path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C8 19 5 15.6 5 11V5.5L12 3z" stroke="currentColor" strokeWidth="1.5" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const Lock = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="text-gold-400"><rect x="5" y="10" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" /></svg>);
const Bank = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="text-gold-400"><path d="M4 9l8-5 8 5M5 9v8m4-8v8m6-8v8m4-8v8M3 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>);
const Database = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gold-400"><ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.5" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" stroke="currentColor" strokeWidth="1.5" /></svg>);
const Nodes = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gold-400"><circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" /><circle cx="17" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" /><circle cx="17" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8.2 10.8l6.6-3.6M8.2 13.2l6.6 3.6" stroke="currentColor" strokeWidth="1.5" /></svg>);
const Tower = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gold-400"><path d="M7 21V8l5-3 5 3v13M5 21h14M10 21v-4h4v4M10 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>);
const Headset = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gold-400"><path d="M5 13v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="13" width="4" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M19 19v.5a3 3 0 01-3 3h-3" stroke="currentColor" strokeWidth="1.5" /></svg>);

export default Landing;
