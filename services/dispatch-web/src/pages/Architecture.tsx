import React from "react";
import { PublicHeader, Chevron } from "../components/brand";

// Architecture Overview — the authoritative technical reference, rendered as a
// clean light document so browser Print → Save as PDF produces a faithful,
// procurement-grade artefact. The page IS the source of truth; a committed PDF
// can later be generated from this same content through the render pipeline.
// Screen chrome (.no-print) is excluded from the printed output.

const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  html, body, #root { background: #fff !important; }
  .arch-doc { box-shadow: none !important; }
  @page { margin: 16mm; }
}
.arch-doc { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

const FlowRow: React.FC<{ nodes: string[]; accentFirst?: boolean }> = ({ nodes, accentFirst }) => (
  <div className="my-5 flex flex-wrap items-center gap-2">
    {nodes.map((n, i, a) => (
      <React.Fragment key={n}>
        <span className={`rounded-md border px-3.5 py-2 text-[13px] font-semibold ${accentFirst && i === 0 ? "border-gold-600/50 bg-gold-50 text-zinc-900" : "border-zinc-300 bg-zinc-50 text-zinc-700"}`}>{n}</span>
        {i < a.length - 1 && <Chevron className="h-3.5 w-3.5 text-gold-600/60" />}
      </React.Fragment>
    ))}
  </div>
);

const Architecture: React.FC = () => {
  return (
    <div className="min-h-full bg-[#ececec]">
      <style>{PRINT_CSS}</style>
      <div className="no-print"><PublicHeader actions={
        <button onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded border border-white/25 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/45 hover:bg-white/5">
          Download (PDF)
        </button>
      } /></div>

      {/* the document */}
      <div className="arch-doc mx-auto my-0 max-w-[860px] bg-white px-10 py-12 text-zinc-800 shadow-2xl sm:my-8 sm:px-14 print:my-0">
        {/* cover header */}
        <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700">Sovereign Dispatch</div>
            <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-zinc-900">Architecture Overview</h1>
            <p className="mt-2 text-[13px] text-zinc-500">Institutional publication infrastructure · Technical reference</p>
          </div>
          <div className="hidden text-right text-[11px] leading-relaxed text-zinc-500 sm:block">
            <div>Version 1.0 · 2026</div>
            <div>Classification: <span className="font-semibold text-zinc-700">UNCLASSIFIED</span></div>
            <div>Distribution: Public</div>
          </div>
        </div>

        <button onClick={() => window.print()}
          className="no-print mt-6 inline-flex items-center gap-2 rounded bg-zinc-900 px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-zinc-700">
          Download Architecture Overview <Chevron className="h-3.5 w-3.5" />
        </button>

        <Doc />
      </div>

      <div className="no-print py-10 text-center text-[12px] text-zinc-500">
        Use your browser's Print → Save as PDF to export this document.
      </div>
    </div>
  );
};

const S: React.FC<{ n: string; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="mt-9 break-inside-avoid">
    <h2 className="border-b border-zinc-200 pb-2 font-serif text-[22px] font-bold text-zinc-900">
      <span className="mr-3 font-mono text-[15px] font-bold text-gold-700">{n}</span>{title}
    </h2>
    <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-zinc-700">{children}</div>
  </section>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-1.5">
    {items.map((t) => (
      <li key={t} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-600" /><span>{t}</span></li>
    ))}
  </ul>
);

const Doc: React.FC = () => (
  <>
    <S n="1" title="Executive Summary">
      <p>
        Sovereign Dispatch is the institutional layer between a draft and a published official record. Every artefact —
        briefing, board report, regulatory filing, operational package — is submitted as structured data, governed through
        an approval policy, rendered to faithful PDF/DOCX, and published with a permanent, auditable provenance trail.
      </p>
      <p>
        The platform is built for institutions that cannot fail: tenant-isolated, classification-forward, residency-aware,
        and append-only auditable by construction. This document describes the system architecture, governance pipeline,
        security model, deployment options, data-residency model, audit and traceability design, integration surface, and
        operational model.
      </p>
    </S>

    <S n="2" title="System Architecture">
      <p>A submission travels a single, governed path from the institution to the published record:</p>
      <FlowRow accentFirst nodes={["Institution", "Dispatch API", "Governance Engine", "Render Lane", "Immutable Record Store", "Publication Archive"]} />
      <Bullets items={[
        "Dispatch API — a stable, versioned REST surface authenticated with OAuth2 client-credentials.",
        "Governance Engine — resolves classification and the approval policy for each document type; enforces separation of duties.",
        "Render Lane — a queue-backed, deterministic rendering service producing print-grade PDF/DOCX from validated source.",
        "Immutable Record Store — versioned documents and hash-stamped artefacts in a dedicated, tenant-isolated database.",
        "Publication Archive — released records with signed, access-controlled retrieval and defined retention.",
      ]} />
    </S>

    <S n="3" title="Governance Pipeline">
      <p>Nothing reaches the official record without clearing its approval policy.</p>
      <FlowRow nodes={["Submit", "Govern", "Approve", "Render", "Publish", "Archive"]} />
      <Bullets items={[
        "Submit — a structured DDM payload validated against schema and doc-type policy on entry.",
        "Govern — classification and the N-eyes approval policy are resolved per type and tenant.",
        "Approve — reviewers approve, return or reject; a submitter cannot approve their own document.",
        "Render — the approved record is rendered deterministically in the queue.",
        "Publish — the artefact is released to the record and its provenance is sealed.",
        "Archive — retained under the institution's retention policy with auditable retrieval.",
      ]} />
    </S>

    <S n="4" title="Security Architecture">
      <Bullets items={[
        "Tenant isolation — row-level security on every table; a missing tenant claim denies by default, never allow-all.",
        "Encryption — AES-256 at rest and TLS 1.2+ in transit.",
        "Authentication — OAuth2 client-credentials issuing short-lived, scoped JWTs held in memory only.",
        "Authorization — least-privilege scopes (validate, render, approve, publish, read, audit) enforced server-side on every call.",
        "Classification & clearance — documents carry visible classification; reads and approvals can be gated against principal clearance per deployment.",
        "Immutability — published artefacts are hash-stamped; the audit trail is append-only and read-only.",
      ]} />
    </S>

    <S n="5" title="Deployment Models">
      <p>The same governed pipeline is delivered into the operating model the institution's mandate requires:</p>
      <Bullets items={[
        "Cloud — managed deployment for rapid adoption.",
        "Private Cloud — a dedicated institutional environment.",
        "Sovereign Hosting — hosted within approved national or regional boundaries.",
        "On-Premise — operated inside the institution's own data centre for local control.",
        "Air-Gapped — architecture designed to support isolated deployments; availability subject to engagement scope.",
      ]} />
    </S>

    <S n="6" title="Data Residency Model">
      <p>
        Dispatch runs against its own dedicated database, independent of any other platform. Residency follows the
        deployment model — a shared region for managed cloud, a dedicated region for private cloud, national or regional
        boundaries for sovereign hosting, and local control on-premise. Specific regions, data handling and retention terms
        are agreed per institution. No cross-tenant data movement occurs; isolation is enforced at the database layer.
      </p>
    </S>

    <S n="7" title="Audit & Traceability">
      <p>Every governance-relevant action is recorded to an append-only trail that cannot be quietly edited.</p>
      <Bullets items={[
        "Each event captures actor, action, target, timestamp and a SHA-256 content hash.",
        "Submission, decision, render and publish events form a complete chain of custody per document.",
        "The trail is tenant-scoped and read-only; the API blocks any mutation.",
        "Events are exportable for assessors and can be filtered by action or target during review.",
      ]} />
    </S>

    <S n="8" title="API & Integrations">
      <p>Institutional systems integrate over a stable REST surface; each consumer authenticates with its own scoped service client.</p>
      <div className="my-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 font-mono text-[12px] leading-relaxed text-zinc-700">
        POST /v1/token&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ client-credentials → scoped JWT<br />
        POST /v1/documents&nbsp;&nbsp;&nbsp;&nbsp;→ submit (Idempotency-Key honoured)<br />
        POST /v1/.../decision&nbsp;→ governance decision (approve / return / reject)<br />
        POST /v1/.../publish&nbsp;&nbsp;→ release a rendered record<br />
        GET&nbsp;&nbsp;/v1/audit&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ append-only, tenant-scoped events<br />
        POST /v1/artifacts/:id/grant → signed, expiring download URL
      </div>
      <p>Service clients are issued, scoped and revoked per consumer. Webhook callbacks notify on render and publish.</p>
    </S>

    <S n="9" title="Operational Model">
      <Bullets items={[
        "Asynchronous render lane absorbs bursts and large packages without blocking submitters.",
        "Each version is preserved; artefacts are content-addressed and never silently altered.",
        "Roles map to least-privilege scopes; provisioning and revocation are per consumer.",
        "Support tiers, response targets and retention horizons are defined per institutional agreement.",
        "Evaluation follows a predictable path: procurement package → technical review → pilot → security review → production rollout.",
      ]} />
    </S>

    <p className="mt-10 border-t border-zinc-200 pt-5 text-[11px] leading-relaxed text-zinc-400">
      This document describes the architecture Sovereign Dispatch is engineered around. Framework alignment (e.g. ISO 27001,
      SOC 2, NIS2, GDPR) denotes control-aligned design, not independent certification; certification scope, residency and
      retention are defined per deployment. © Sovereign Dispatch.
    </p>
  </>
);

export default Architecture;
