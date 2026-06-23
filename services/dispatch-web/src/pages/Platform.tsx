import React from "react";
import { SectionHead, Card, Dot, PublicHeader, PublicFooter, TrustStrip, FilmGrain, useReveal, SURFACE } from "../components/brand";

// Platform — the product story relocated from the homepage: what Dispatch is
// (Overview), what it does (Capabilities), the lifecycle (Workflow), and how
// other systems build on it (Integrations).
const Platform: React.FC = () => {
  useReveal();
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <main>
        {/* ── Overview ───────────────────────────────────────────────── */}
        <section id="overview" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead kicker="Overview" title="Information becomes the official record."
            sub="Dispatch is the institutional layer between a draft and a published document. Every artefact — briefing, board pack, regulatory filing — is submitted as structured data, governed through approval, rendered to a faithful PDF/DOCX, and published with a permanent, auditable provenance trail." />
          <div className="mx-auto mt-14 grid stagger max-w-5xl gap-5 sm:grid-cols-3">
            <Card title="Not a word processor" body="Documents are structured data (DDM), validated and scaffolded by type — not freeform files. The format is the contract." />
            <Card title="Governed, not just generated" body="Submit → Approve → Render → Publish. Nothing reaches the record without clearing its approval policy." />
            <Card title="Sovereign by construction" body="Tenant-isolated, residency-aware, append-only audit. Built for institutions that cannot fail." />
          </div>
        </section>

        {/* ── Capabilities ───────────────────────────────────────────── */}
        <section id="capabilities" className="scroll-mt-24 border-t border-white/[0.06] bg-white/[0.015] px-8 py-24 lg:px-12">
          <SectionHead kicker="Capabilities" title="One pipeline, every official document."
            sub="Templates and validation per document type; deterministic, classification-banded rendering to print-grade output." />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Document types" body="Executive briefings, board reports, policy papers, regulatory submissions, operational packages and official records — each with its own required scaffold." />
            <Card title="Multi-format render" body="Faithful PDF (headless engine), DOCX and Markdown from a single validated source — banners, page numbers, appendices, signatures." />
            <Card title="Schema-validated" body="Every submission is checked against the DDM schema and the doc-type policy before it can render — no malformed records." />
            <Card title="Templates & scaffolds" body="Type-aware section roles and block policies enforce completeness so the output is consistent across the institution." />
            <Card title="Versioned & immutable" body="Each version is preserved; published artefacts are hash-stamped and never silently altered." />
            <Card title="Asynchronous at scale" body="A queue-backed render lane absorbs bursts and large packages without blocking submitters." />
          </div>
        </section>

        {/* ── Workflow ───────────────────────────────────────────────── */}
        <section id="workflow" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead kicker="Workflow" title="Submit → Govern → Approve → Render → Publish → Retrieve."
            sub="The full lifecycle of an official document, enforced by the platform." />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["01", "Submit", "Structured DDM payload, validated on entry."],
              ["02", "Govern", "Classification + approval policy resolved."],
              ["03", "Approve", "N-eyes sign-off; service lanes auto-approve."],
              ["04", "Render", "Faithful PDF/DOCX produced in the queue."],
              ["05", "Publish", "Released to the record; provenance sealed."],
              ["06", "Retrieve", "Signed, access-controlled artefact download."],
            ].map(([n, t, b]) => (
              <div key={n} className={`${SURFACE} p-5`}>
                <div className="font-mono text-[12px] font-bold text-gold-400">{n}</div>
                <div className="mt-2 text-sm font-bold text-[#f4efe3]">{t}</div>
                <div className="mt-1 text-[12px] leading-snug text-white/55">{b}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Integrations ───────────────────────────────────────────── */}
        <section id="integrations" className="scroll-mt-24 border-t border-white/[0.06] bg-white/[0.015] px-8 py-24 lg:px-12">
          <SectionHead kicker="Integrations" title="An API others build on."
            sub="Dispatch provisions scoped API access per consumer and accepts documents over a stable REST surface." />
          <div className="mx-auto mt-14 grid stagger max-w-5xl gap-5 lg:grid-cols-2">
            <div className={`${SURFACE} p-7`}>
              <div className="text-base font-bold text-[#f4efe3]">API provisioning</div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">Each system gets its own service client — a <span className="text-white/80">client_id + secret</span> with explicit scopes (<span className="font-mono text-gold-400/90">validate · render · read</span>). Issue, scope and revoke per consumer.</p>
              <div className="mt-5 rounded-md border border-white/10 bg-black/40 p-4 font-mono text-[12px] leading-relaxed text-white/70">
                POST /v1/token        → client-credentials → JWT<br />
                POST /v1/documents    → submit (Idempotency-Key)<br />
                POST /v1/.../approve  → governance decision<br />
                GET&nbsp;&nbsp;/v1/artifacts/:id → signed download
              </div>
            </div>
            <div className={`${SURFACE} p-7`}>
              <div className="text-base font-bold text-[#f4efe3]">Built for the estate</div>
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
      </main>
      <TrustStrip />
      <PublicFooter />
    </div>
  );
};

export default Platform;
