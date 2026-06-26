import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionHead, Card, Chevron, PublicHeader, PageBanner, PublicFooter, TrustStrip, FilmGrain, useReveal } from "../components/brand";
import { PROCUREMENT_ROUTE, EVIDENCE_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

// Trust — the public adoption-confidence page. The console's Trust Center, made
// reachable to the people who actually decide whether to adopt: procurement,
// CIOs and risk officers, without an account. It answers the fears that stop
// institutions committing — ownership, exit, accountability — in verifiable
// language. No certifications, SLAs or guarantees are asserted.
const Trust: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  React.useEffect(() => track("page.trust"), []);
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="trust" alt="An institutional seal press" />
      <main>
        {/* hero */}
        <section className="border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">Adopt with confidence</div>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">Your records. Your jurisdiction.<br /><span className="text-white/50">Your exit, guaranteed.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">Committing to a publication platform is a sovereignty decision. Sovereign Dispatch is built so the institution stays in control — of the data, the deployment, and the ability to walk away with everything intact.</p>
          </div>
        </section>

        {/* ownership */}
        <section className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="01" kicker="Ownership" title="You own your records — we are the custodian."
            sub="The platform stores and governs your records. It never owns them, never repurposes them, and never trains anything on them." />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Your data is yours" body="Every document, version, artifact and certificate belongs to your institution — not the platform." />
            <Card title="Tenant isolation" body="Row-level security with deny-by-default. A missing tenant claim denies; your data is never co-mingled." />
            <Card title="No secondary use" body="No mining, no profiling, no model training, no data-sharing business model. Ever." />
            <Card title="Every access audited" body="Submissions, decisions, publications and retrievals are recorded in an append-only, hash-stamped trail." />
          </div>
        </section>

        {/* continuity & exit */}
        <section className="scroll-mt-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-24 lg:px-12">
          <SectionHead index="02" kicker="Continuity & Exit" title="You can leave at any time — with everything."
            sub="The strongest trust signal a platform can offer is a clean exit. There is no lock-in to engineer your way out of." />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="No proprietary formats" body="Structured records, standard PDF / DOCX / Markdown artifacts, and a standard PostgreSQL store. Nothing is trapped." />
            <Card title="Full export on demand" body="Export records, versions, artifacts and the governance + preservation certificates whenever you choose." />
            <Card title="Relocatable deployment" body="The same platform runs managed, in your cloud, on-premise or air-gapped — move your estate without re-platforming." />
            <Card title="If the provider disappeared" body="You retain every record, artifact and certificate in open formats and can run or migrate the platform yourself. Continuity does not depend on us." />
          </div>
        </section>

        {/* shared responsibility */}
        <section className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="03" kicker="Accountability" title="A clear line of responsibility."
            sub="Procurement and risk teams need to know exactly who is accountable for what. There is no ambiguity." />
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-400">The platform secures</div>
              <ul className="mt-4 space-y-2.5 text-[14px] text-white/70">
                {["Tenant isolation and access control", "Encryption at rest and in transit", "Append-only audit integrity", "Preservation integrity (SHA-256 proofs)", "Governance enforcement — the engine cannot be bypassed", "Availability and recovery of the service"].map((x) => <li key={x} className="flex gap-2.5"><Chevron className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-400" />{x}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/50">Your institution controls</div>
              <ul className="mt-4 space-y-2.5 text-[14px] text-white/70">
                {["Who holds each governance authority", "Approval chains, quorums and policies", "Classification and clearance of records", "Retention horizons", "Who holds credentials and their scopes", "Deployment model and data residency"].map((x) => <li key={x} className="flex gap-2.5"><Chevron className="mt-1 h-3.5 w-3.5 shrink-0 text-white/40" />{x}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* provable, not promised */}
        <section className="scroll-mt-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-24 lg:px-12">
          <SectionHead index="04" kicker="Evidence" title="Provable, not promised."
            sub="Adoption confidence should rest on what can be verified during evaluation — not on marketing claims." />
          <div className="mx-auto mt-14 max-w-5xl"><TrustStrip /></div>
          <div className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center gap-4">
            <button onClick={() => nav(PROCUREMENT_ROUTE)} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-black transition hover:bg-gold-300">Procurement dossier <Chevron className="h-3.5 w-3.5" /></button>
            <button onClick={() => nav(EVIDENCE_ROUTE)} className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/70 transition hover:text-white">Evidence &amp; capabilities <Chevron className="h-3.5 w-3.5" /></button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Trust;
