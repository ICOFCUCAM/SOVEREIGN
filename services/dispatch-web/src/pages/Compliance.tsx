import React from "react";
import { SectionHead, PublicHeader, PublicFooter, TrustStrip } from "../components/brand";

// Compliance — the governance-framework alignment relocated from the homepage.
const Compliance: React.FC = () => {
  return (
    <div className="min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <PublicHeader />
      <main>
        {/* ── Compliance & Security ──────────────────────────────────── */}
        <section id="compliance" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
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
      </main>
      <TrustStrip />
      <PublicFooter />
    </div>
  );
};

export default Compliance;
