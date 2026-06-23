import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionHead, Chevron, PublicHeader, PublicFooter, TrustStrip } from "../components/brand";
import { LastPublishedCard, LifecycleTrail, PublicAuditTimeline } from "../components/operations";
import { ARCHITECTURE_ROUTE } from "../lib/routes";

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

// Evidence — the proof narrative relocated from the homepage: how it works, how
// it is governed, what gets produced, and how it is deployed.
const Evidence: React.FC = () => {
  const nav = useNavigate();
  return (
    <div className="min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <PublicHeader />
      <main>
        {/* ── Evidence ───────────────────────────────────────────────── */}
        <section id="evidence" className="scroll-mt-24 border-t border-white/5 px-8 py-24 lg:px-12">
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
      </main>
      <TrustStrip />
      <PublicFooter />
    </div>
  );
};

export default Evidence;
