import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { WALKTHROUGH_ROUTE, VERIFY_ROUTE, COST_ROUTE, ROI_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

// Phase 2 of the Institutional Value & Procurement Experience — the interactive
// lifecycle. Eight governed stages; clicking one reveals exactly who participates,
// what decisions are made, what evidence is generated and what risks are
// prevented. This is the page that lets a procurement team understand precisely
// what they are buying — not a demo (that is /walkthrough), but a reference.

interface Stage {
  key: string;
  n: string;
  title: string;
  summary: string;
  who: string[];
  decisions: string[];
  evidence: string[];
  risks: string[];
}

const STAGES: Stage[] = [
  {
    key: "create", n: "01", title: "Create",
    summary: "An author drafts the document inside the institution's governed workspace — it carries institutional context from the first keystroke.",
    who: ["Author / document owner", "Contributing subject-matter units"],
    decisions: ["What kind of record this is (document type)", "Its classification and intended audience"],
    evidence: ["The draft is captured with its author and timestamp", "Document type and classification are recorded"],
    risks: ["Work scattered across personal drives and inboxes", "A document with no institutional identity or owner"],
  },
  {
    key: "review", n: "02", title: "Review",
    summary: "The document enters its resolved approval policy. The required offices review in order — legal, compliance and subject-matter — each recording their position.",
    who: ["Legal office", "Compliance & risk", "Reviewing departments"],
    decisions: ["Whether the content is legally and procedurally sound", "Whether it meets the institution's frameworks", "Return for revision, or advance"],
    evidence: ["Each review is recorded against the office that performed it", "Comments and outcomes are retained with the version reviewed"],
    risks: ["Reviews that happen in email and leave no durable record", "Approving a version nobody can later identify"],
  },
  {
    key: "approve", n: "03", title: "Approve",
    summary: "The approving authority signs off. Approval is an explicit, attributable act — and the platform enforces that the approver is not the author.",
    who: ["Approving authority for the document type", "Delegated (acting) approvers, where appointed"],
    decisions: ["Whether to approve the reviewed version", "On the record, attributable to a named office"],
    evidence: ["The approval is bound to the office and the exact version", "Separation of duties is enforced and logged"],
    risks: ["Approvals that cannot be proven years later", "A submitter approving their own work"],
  },
  {
    key: "authorize", n: "04", title: "Authorize",
    summary: "A senior authority authorizes the record for publication — the final institutional gate before anything becomes official.",
    who: ["Permanent secretary / executive authority", "Publication authority"],
    decisions: ["Whether the institution will publish this as its official position", "When it takes effect"],
    evidence: ["The authorization to publish is recorded as a distinct act", "The authorizing office is captured"],
    risks: ["Publication without a clear, accountable authority", "Ambiguity over who committed the institution"],
  },
  {
    key: "publish", n: "05", title: "Publish",
    summary: "The record is published and allocated a permanent Record ID — never reused. From this point every copy points back to one authoritative record.",
    who: ["Publication authority", "The platform's record service"],
    decisions: ["Release the authorized record as the official version"],
    evidence: ["A permanent Record ID (SD-YYYY-NNNNNNNN) is allocated", "The published artefact is hash-stamped"],
    risks: ["Re-saved files that fork into many uncontrolled copies", "No durable identity for the official version"],
  },
  {
    key: "certificate", n: "06", title: "Certificate",
    summary: "Governance and Preservation certificates are sealed — the institutional proof of how the record came to be and that it is preserved intact.",
    who: ["The platform's certification service"],
    decisions: ["Seal the governance and preservation proofs to the record"],
    evidence: ["Governance Certificate — the approval chain that was satisfied", "Preservation Certificate — the retention horizon and integrity hash"],
    risks: ["A publication with no provable provenance", "Authenticity that rests on reputation, not proof"],
  },
  {
    key: "verify", n: "07", title: "Verify",
    summary: "Anyone holding a copy can independently confirm the record is genuine, unrevoked and untampered — by its Record ID, with no account.",
    who: ["Any recipient — citizen, auditor, counterparty", "No login required"],
    decisions: ["Is this copy the authentic, current official record?"],
    evidence: ["A verification result: institution, status, integrity hash", "Confirmation the file matches the issued artefact"],
    risks: ["Forged or altered copies passing as genuine", "Superseded versions circulating as current"],
  },
  {
    key: "preserve", n: "08", title: "Preserve",
    summary: "The record is sealed for its retention horizon with a tamper-evident hash, on infrastructure the institution controls — and remains verifiable for its full life.",
    who: ["The institution's archive", "The platform's preservation service"],
    decisions: ["Retain the sealed record for its retention period"],
    evidence: ["Tamper-evident integrity hash over the sealed record", "Retention horizon recorded and enforced"],
    risks: ["Archived copies altered or lost without detection", "Records that cannot be proven decades later"],
  },
];

const Facet: React.FC<{ label: string; tone: "who" | "decision" | "evidence" | "risk"; items: string[] }> = ({ label, tone, items }) => {
  const ring = {
    who: "border-white/10",
    decision: "border-white/10",
    evidence: "border-emerald-500/25",
    risk: "border-amber-500/20",
  }[tone];
  const dot = {
    who: "bg-white/40",
    decision: "bg-gold-400/70",
    evidence: "bg-emerald-400/70",
    risk: "bg-amber-400/70",
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
              Every Dispatch publication follows the same eight governed stages. Select any stage to see who
              participates, the decisions made, the evidence generated, and the institutional risks it prevents.
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
                <Facet label="Who participates" tone="who" items={s.who} />
                <Facet label="Decisions made" tone="decision" items={s.decisions} />
                <Facet label="Evidence generated" tone="evidence" items={s.evidence} />
                <Facet label="Risks prevented" tone="risk" items={s.risks} />
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
