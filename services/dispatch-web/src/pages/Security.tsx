import React from "react";
import { SectionHead, Card, Chevron, PublicHeader, PublicFooter, TrustStrip, FilmGrain, useReveal, SURFACE } from "../components/brand";
import { CapabilitiesDashboard } from "../components/operations";
import { DeploymentMatrix } from "../components/DeploymentMatrix";

// Security — the trust story relocated from the homepage: the security posture,
// the sovereignty capability dashboard, and the deployment & architecture model.
const Security: React.FC = () => {
  useReveal();
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <main>
        {/* ── Security ───────────────────────────────────────────────── */}
        <section id="security" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="01" kicker="Security" title="Sovereign by design."
            sub="Built for classified and regulated material — isolation, clearance and an immutable record at the core, not bolted on." />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        <section id="sovereignty" className="scroll-mt-24 border-t border-white/[0.06] bg-white/[0.015] px-8 py-24 lg:px-12">
          <SectionHead index="02" kicker="Sovereignty" title="Capabilities, not badges."
            sub="What the platform actually does — across deployment, security and governance. Each capability is available by deployment model and verifiable during evaluation." />
          <div className="mx-auto mt-14 max-w-5xl">
            <CapabilitiesDashboard />
          </div>
        </section>

        {/* ── Deployment & Architecture ──────────────────────────────── */}
        <section id="deployment" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="03" kicker="Deployment" title="Deploy where sovereignty requires."
            sub="Sovereign Dispatch is architected to support cloud, private-cloud, sovereign-hosted, and institutional deployment models." />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Cloud", "Managed deployment for rapid adoption.", ""],
              ["Private Cloud", "Dedicated institutional environment.", ""],
              ["Sovereign Hosting", "Hosted within approved national or regional boundaries.", ""],
              ["On-Premise", "Available for institutions requiring local control.", ""],
              ["Air-Gapped", "Architecture designed to support isolated deployments.", "Availability subject to engagement scope."],
            ].map(([t, b, note]) => (
              <div key={t} className={`flex flex-col ${SURFACE} p-5`}>
                <div className="text-[15px] font-bold text-[#f4efe3]">{t}</div>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-white/55">{b}</p>
                {note && <p className="mt-3 text-[11px] italic leading-snug text-white/45">{note}</p>}
              </div>
            ))}
          </div>

          {/* system flow */}
          <div className="mx-auto mt-16 max-w-sm">
            <p className="mb-6 text-center text-[12px] font-semibold uppercase tracking-[0.25em] text-white/50">System flow</p>
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
            <p className="mb-5 text-center text-[12px] font-semibold uppercase tracking-[0.25em] text-white/50">Capability by deployment</p>
            <DeploymentMatrix />
          </div>
        </section>
      </main>
      <TrustStrip />
      <PublicFooter />
    </div>
  );
};

export default Security;
