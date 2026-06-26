import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionHead, Chevron, PublicHeader, PageBanner, PublicFooter, FilmGrain, useReveal } from "../components/brand";

// The Dispatch Standard — the most strategic asset in a category. When a category
// emerges, the standard matters more than the features. This defines the canonical
// institutional concepts Sovereign Dispatch establishes, so an institution adopts
// a STANDARD for official records, not merely software.
const DEFS: { term: string; one: string; def: string; props: string[] }[] = [
  { term: "Official Record", one: "A governed, versioned, classified institutional document of record.",
    def: "Not a file. An official act, created under an enforced governance policy, carried through an immutable lifecycle — Created → Governed → Approved → Published → Preserved — with a permanent, provable identity.",
    props: ["Stable record number", "Classification & clearance", "Immutable versions", "A single canonical form"] },
  { term: "Governance Policy", one: "The executable rule for how a class of records is governed.",
    def: "A named, versioned policy bound to a record type: an ordered chain of authorities, per-step quorum, the publication authority, retention and expiry. The policy does not describe the workflow — it controls it.",
    props: ["Ordered approval chain", "Per-step quorum", "Publication authority", "Versioned & enforced"] },
  { term: "Publication Authority", one: "The named authority empowered to release a record of record.",
    def: "Publication is not a button anyone may press. It is reserved to a specific governance role, validated at the moment of release — and an approver of a record may never be its publisher.",
    props: ["Role-bound", "Validated at publication", "Separation of duties"] },
  { term: "Governance Certificate", one: "Cryptographic proof that a publication satisfied its policy.",
    def: "Sealed at publication: the policy and its version, the required chain versus who actually satisfied it in order, delegations used, the publication authority, and an integrity proof — a COMPLIANT verdict that can be independently verified.",
    props: ["Required vs. actual chain", "Ordered approval sequence", "Integrity proof", "Compliance verdict"] },
  { term: "Preservation Certificate", one: "Tamper-evident proof that a record is permanently sealed.",
    def: "Issued when a record is archived: a preservation timestamp and a SHA-256 integrity proof over the canonical record. The archived state is terminal — no edit, withdrawal or republication is possible.",
    props: ["SHA-256 integrity proof", "Preservation timestamp", "Terminal & immutable"] },
  { term: "Evidence Chain", one: "The unbroken, append-only trail from creation to preservation.",
    def: "Every act — submission, each decision, the policy's satisfaction, publication and preservation — recorded in an immutable, hash-stamped trail. The institution can prove not just what a record says, but exactly how it came to be.",
    props: ["Append-only", "Hash-stamped", "Creation → preservation", "Independently auditable"] },
];

const Standard: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="default" alt="" />
      <main>
        <section className="border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">Category definition</div>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">The Sovereign Dispatch Standard</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">An institution does not adopt a publishing tool. It adopts a standard for how official records come to exist, are proven, and are preserved. These are the concepts that standard defines.</p>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-8 py-20 lg:px-12">
          <SectionHead index="①" kicker="The Standard" title="Six institutional concepts." sub="Each is a building block of the operating standard for institutional records — not a feature, a definition." />
          <div className="mx-auto mt-14 max-w-5xl space-y-5">
            {DEFS.map((d, i) => (
              <div key={d.term} className="reveal rounded-2xl border border-white/10 bg-white/[0.02] p-7 sm:p-8">
                <div className="flex items-baseline gap-3">
                  <span className="text-[12px] font-mono text-gold-400/70">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-xl font-semibold tracking-tight text-white">{d.term}</h3>
                </div>
                <div className="mt-1 pl-8 text-[13.5px] font-medium text-gold-300/80">{d.one}</div>
                <p className="mt-3 max-w-3xl pl-8 text-[14px] leading-relaxed text-white/60">{d.def}</p>
                <div className="mt-4 flex flex-wrap gap-2 pl-8">{d.props.map((p) => <span key={p} className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-[12px] text-white/65">{p}</span>)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-20 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">When a category emerges,<br /><span className="text-white/50">the standard matters more than the features.</span></h2>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/55">Sovereign Dispatch is not a better way to publish documents. It is the operating standard for institutional records — and an institution that adopts the standard adopts a way of governing that outlasts any one system.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav("/records")} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-black transition hover:bg-gold-300">See the artifacts <Chevron className="h-3.5 w-3.5" /></button>
              <button onClick={() => nav("/journey")} className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/70 transition hover:text-white">Find your path <Chevron className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Standard;
