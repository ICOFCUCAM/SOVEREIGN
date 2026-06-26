import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { WALKTHROUGH_ROUTE, VERIFY_ROUTE, COST_ROUTE, ROI_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

// Phase 2 of the Institutional Value & Procurement Experience — the interactive
// lifecycle. Eight governed stages; clicking one reveals exactly who participates,
// what governs the stage, what it produces and what evidence it leaves behind.
// This is the page that lets a procurement team understand precisely what they
// are buying — not a demo (that is /walkthrough), but a reference.

interface Stage {
  key: string;
  n: string;
  title: string;
  summary: string;
  participants: string[];
  governance: string[];
  outputs: string[];
  evidence: string[];
}

const STAGES: Stage[] = [
  {
    key: "create", n: "01", title: "Create",
    summary: "An author drafts the document inside the institution's governed workspace — it carries institutional context from the first keystroke.",
    participants: ["Author / document owner", "Contributing subject-matter units"],
    governance: ["Created inside the governed workspace, not a personal drive", "Document type and classification set the policy that will apply"],
    outputs: ["A draft with institutional identity — owner, type and classification attached"],
    evidence: ["The draft is captured with its author and a timestamp"],
  },
  {
    key: "review", n: "02", title: "Review",
    summary: "The document enters its resolved approval policy. The required offices review in order — legal, compliance and subject-matter — each recording their position.",
    participants: ["Legal office", "Compliance & risk", "Reviewing departments"],
    governance: ["The resolved approval policy requires these offices to review, in order", "Separation of duties — a submitter cannot later approve their own work"],
    outputs: ["A reviewed version — advanced, or returned for revision with comments"],
    evidence: ["Each review is recorded against the office that performed it, bound to the version reviewed"],
  },
  {
    key: "approve", n: "03", title: "Approve",
    summary: "The approving authority signs off. Approval is an explicit, attributable act — and the platform enforces that the approver is not the author.",
    participants: ["Approving authority for the document type", "Delegated (acting) approvers, where appointed"],
    governance: ["Approval is an explicit, attributable act by a named office", "Separation of duties is enforced and logged"],
    outputs: ["An approval bound to a named office and the exact version"],
    evidence: ["The approval, the office and the version are recorded together"],
  },
  {
    key: "authorize", n: "04", title: "Authorize",
    summary: "A senior authority authorizes the record for publication — the final institutional gate before anything becomes official.",
    participants: ["Permanent secretary / executive authority", "Publication authority"],
    governance: ["A final senior gate: the institution decides it will publish this as its official position", "When it takes effect is set here"],
    outputs: ["Authorization to publish, recorded as a distinct act"],
    evidence: ["The authorizing office and the effective decision are captured"],
  },
  {
    key: "publish", n: "05", title: "Publish",
    summary: "The record is published and allocated a permanent Record ID — never reused. From this point every copy points back to one authoritative record.",
    participants: ["Publication authority", "The platform's record service"],
    governance: ["Only an authorized record may publish", "A permanent identifier is allocated and never reused"],
    outputs: ["An Official Record with a permanent Record ID (SD-YYYY-NNNNNNNN) and a hash-stamped artefact"],
    evidence: ["The Record ID and the artefact hash are bound to the record"],
  },
  {
    key: "certify", n: "06", title: "Certify",
    summary: "Governance and Preservation certificates are sealed — the institutional proof of how the record came to be and that it is preserved intact.",
    participants: ["The platform's certification service"],
    governance: ["Certificates are sealed to the record at publication, not added later"],
    outputs: ["A Governance Certificate (the approval chain satisfied)", "A Preservation Certificate (retention horizon + integrity hash)"],
    evidence: ["Both certificates and their hashes are attached to the record"],
  },
  {
    key: "verify", n: "07", title: "Verify",
    summary: "Anyone holding a copy can independently confirm the record is genuine, unrevoked and untampered — by its Record ID, with no account.",
    participants: ["Any recipient — citizen, auditor, counterparty", "No login required"],
    governance: ["Verification is public and read-only", "Status is disclosed honestly — including revoked or evaluation records"],
    outputs: ["A verification result: institution, status, integrity hash", "A file-level match check against the issued artefact"],
    evidence: ["The institution's own certificates and hashes, checked live against the copy presented"],
  },
  {
    key: "preserve", n: "08", title: "Preserve",
    summary: "The record is sealed for its retention horizon with a tamper-evident hash, on infrastructure the institution controls — and remains verifiable for its full life.",
    participants: ["The institution's archive", "The platform's preservation service"],
    governance: ["Sealed for its retention horizon on infrastructure the institution controls", "Integrity is tamper-evident"],
    outputs: ["A preserved record that remains verifiable for its full retention life"],
    evidence: ["A tamper-evident integrity hash and the enforced retention horizon"],
  },
];

const Facet: React.FC<{ label: string; tone: "participants" | "governance" | "outputs" | "evidence"; items: string[] }> = ({ label, tone, items }) => {
  const ring = {
    participants: "border-white/10",
    governance: "border-gold-400/25",
    outputs: "border-sky-500/25",
    evidence: "border-emerald-500/25",
  }[tone];
  const dot = {
    participants: "bg-white/40",
    governance: "bg-gold-400/70",
    outputs: "bg-sky-400/70",
    evidence: "bg-emerald-400/70",
  }[tone];
  return (
    <div className={`rounded-xl border ${ring} bg-white/[0.02] p-5`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</div>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5 text-[13.5px] leading-snug text-white/70">
            <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />{it}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Lifecycle: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  const [i, setI] = useState(0);
  React.useEffect(() => track("page.lifecycle"), []);
  const s = STAGES[i];
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="officialrecord" alt="The governed lifecycle of an official record" />
      <main>
        <section className="border-t border-white/[0.06] px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">The governed lifecycle</p>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">
              Exactly what you are buying, stage by stage.
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/60">
              Every Dispatch publication follows the same eight governed stages. Select any stage to see the
              participants, what governs it, the outputs it produces, and the evidence it leaves behind.
            </p>

            {/* stage selector — horizontal rail */}
            <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {STAGES.map((st, idx) => (
                <button key={st.key} onClick={() => setI(idx)}
                  aria-current={idx === i}
                  className={`group rounded-xl border px-3 py-3 text-left transition ${idx === i ? "border-gold-400/45 bg-gold-400/[0.07]" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}>
                  <div className={`font-mono text-[11px] font-bold ${idx === i ? "text-gold-300" : "text-white/40"}`}>{st.n}</div>
                  <div className={`mt-1 text-[13px] font-semibold leading-tight ${idx === i ? "text-white" : "text-white/70"}`}>{st.title}</div>
                </button>
              ))}
            </div>

            {/* detail panel */}
            <div key={s.key} className="reveal in mt-10 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 sm:p-9">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-[13px] font-bold text-gold-400">{s.n}</span>
                <h2 className="font-serif text-[1.9rem] font-bold tracking-tight text-white">{s.title}</h2>
              </div>
              <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-white/65">{s.summary}</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Facet label="Participants" tone="participants" items={s.participants} />
                <Facet label="Governance" tone="governance" items={s.governance} />
                <Facet label="Outputs" tone="outputs" items={s.outputs} />
                <Facet label="Evidence" tone="evidence" items={s.evidence} />
              </div>
              <div className="mt-7 flex items-center gap-3">
                <button onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}
                  className="rounded border border-white/15 px-4 py-2 text-[12.5px] font-semibold uppercase tracking-wide text-white/80 transition enabled:hover:border-white/35 disabled:opacity-30">Back</button>
                <button onClick={() => setI((v) => Math.min(STAGES.length - 1, v + 1))} disabled={i === STAGES.length - 1}
                  className="group inline-flex items-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2 text-[12.5px] font-bold uppercase tracking-wide text-[#1c1407] transition active:translate-y-px enabled:hover:from-gold-200 enabled:hover:to-gold-500 disabled:opacity-40">
                  Next stage <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </button>
                <span className="ml-auto font-mono text-[12px] text-white/35">{i + 1}/{STAGES.length}</span>
              </div>
            </div>
          </div>
        </section>

        {/* close */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-[1.9rem] font-bold leading-tight text-white sm:text-[2.3rem]">From the cost today to the proof at the end.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
              See why the process is expensive today, watch one record move through it live, or verify a real record for yourself.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(COST_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">The cost of publication</button>
              <button onClick={() => nav(WALKTHROUGH_ROUTE)} className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">Watch a record become official <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
              <button onClick={() => nav(VERIFY_ROUTE)} className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-emerald-300 transition hover:bg-emerald-500/20">Verify a record</button>
              <button onClick={() => nav(ROI_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">ROI estimator</button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Lifecycle;
