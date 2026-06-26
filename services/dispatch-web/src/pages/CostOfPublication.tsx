import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, FilmGrain, Chevron, useReveal, SURFACE } from "../components/brand";
import { LIFECYCLE_ROUTE, ROI_ROUTE, WALKTHROUGH_ROUTE, PROCUREMENT_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

// Phase 1 of the Institutional Value & Procurement Experience — the page that
// explains the PROBLEM before any value is calculated. Why does Dispatch exist?
// Because an official publication is not a document — it is the output of a long,
// fragmented, expensive institutional process that today no system governs end to
// end. We show that process honestly, then contrast it with the unified model.

// The institutional process behind a single official publication today — each
// hand-off is a separate team, a separate tool, and a separate point of failure.
const PROCESS: { stage: string; who: string; cost: string }[] = [
  { stage: "Draft", who: "Author / policy owner", cost: "Work begins in a document with no institutional identity." },
  { stage: "Policy Team", who: "Subject-matter unit", cost: "Versions multiply across inboxes and shared drives." },
  { stage: "Legal Review", who: "Legal office", cost: "Reviewed in isolation; the comments live in email." },
  { stage: "Compliance", who: "Risk & compliance", cost: "Checked against frameworks, but the check leaves no record." },
  { stage: "Executive Approval", who: "Approving authority", cost: "Signed off — yet the approval is not provably attributable." },
  { stage: "Publication Authority", who: "Publishing office", cost: "Re-formatted and released, often as a fresh file." },
  { stage: "Records Management", who: "Records unit", cost: "Filed manually; provenance is reconstructed after the fact." },
  { stage: "Archive", who: "Institutional archive", cost: "Preserved as a copy, with no tamper-evidence." },
  { stage: "Verification", who: "Anyone, later", cost: "No way to confirm a circulating copy is the real one." },
  { stage: "Public Trust", who: "Citizens & counterparties", cost: "Authenticity rests on reputation, not on proof." },
];

// The same outcome, delivered as five unified institutional services.
const UNIFIED: { title: string; body: string }[] = [
  { title: "One governed workflow", body: "Draft, review, approval and authorization happen in a single policy-enforced pipeline — nothing skips a step." },
  { title: "One evidence chain", body: "Every action is captured once, append-only and timestamped, as the record is made — not reconstructed afterward." },
  { title: "One publication authority", body: "Publication is an institutional act with a named authority and a permanent Record ID, not a re-saved file." },
  { title: "One verification service", body: "Anyone holding a copy can confirm it is genuine, unrevoked and untampered — with no account." },
  { title: "One preservation platform", body: "The record is sealed for its retention horizon with a tamper-evident hash, on infrastructure the institution controls." },
];

// The costs that the fragmented process imposes, made explicit.
const HIDDEN: { label: string; body: string }[] = [
  { label: "Duplicated effort", body: "The same document is re-handled, re-formatted and re-filed by every office it passes through." },
  { label: "Unattributable authority", body: "When a decision is questioned years later, who approved it — and on what version — is hard to prove." },
  { label: "Fragmented provenance", body: "The story of how a publication came to be is scattered across email, drives and filing systems." },
  { label: "Unverifiable copies", body: "A circulating PDF cannot be distinguished from a forgery, a draft, or a superseded version." },
  { label: "Compliance without evidence", body: "Reviews happen, but leave no durable, inspectable proof that they happened." },
  { label: "Preservation without integrity", body: "Archived copies can be altered or lost with nothing to detect it." },
];

const CostOfPublication: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  React.useEffect(() => track("page.cost-of-publication"), []);
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="procurement" alt="Institutional review in session" />
      <main>
        {/* hero — the question */}
        <section className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1000px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">Why Dispatch exists</p>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.5rem] font-bold leading-[1.06] tracking-tight text-[#f4efe3] sm:text-[3.2rem]">
              The cost of an official publication.
            </h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/60">
              An institution does not pay to create a document. It pays for everything that makes a document
              <span className="text-white/85"> official</span> — the people, the reviews, the approvals, the authority,
              the preservation and the proof. Today that work is spread across a dozen disconnected systems. Every
              hand-off costs time, and every gap costs trust.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button onClick={() => nav(LIFECYCLE_ROUTE)}
                className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-8px_rgba(0,0,0,0.55)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                See what Dispatch governs <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => nav(ROI_ROUTE)}
                className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                Model the operational case
              </button>
            </div>
          </div>
        </section>

        {/* the fragmented process — ten stages, ten hand-offs */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1000px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">The process today</div>
            <h2 className="mt-3 max-w-3xl font-serif text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.5rem]">
              Ten hand-offs. Ten systems. No single record of any of it.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">
              Follow one publication through the institution. Each stage is real work done by real people — but it
              happens in a different place, and the trail between them is reconstructed, not recorded.
            </p>
            <ol className="mt-12 space-y-0">
              {PROCESS.map((p, i) => (
                <li key={p.stage} className="relative flex gap-5 border-l border-white/10 pb-7 pl-7 last:pb-0">
                  <span className="absolute -left-[11px] top-0 flex h-[22px] w-[22px] items-center justify-center rounded-full border border-white/15 bg-[#0c0c0c] font-mono text-[10px] font-bold text-gold-400/80">{i + 1}</span>
                  <div className="grid w-full gap-1 sm:grid-cols-[200px_1fr] sm:gap-6">
                    <div>
                      <div className="text-[15px] font-bold text-white">{p.stage}</div>
                      <div className="text-[12px] uppercase tracking-wide text-white/40">{p.who}</div>
                    </div>
                    <p className="text-[14px] leading-relaxed text-white/55">{p.cost}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-10 max-w-2xl border-l-2 border-gold-400/40 pl-5 font-serif text-[1.35rem] leading-snug text-white/80">
              By the end, the institution has produced a publication it cannot fully account for —
              <span className="text-gold-300"> and cannot independently prove.</span>
            </p>
          </div>
        </section>

        {/* the hidden costs */}
        <section className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">What it actually costs</div>
            <h2 className="mt-3 max-w-3xl font-serif text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.5rem]">
              The cost is not the document. It is everything around it.
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HIDDEN.map((h) => (
                <div key={h.label} className={`${SURFACE} p-6`}>
                  <div className="text-[15px] font-bold text-white">{h.label}</div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{h.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* the contrast — Dispatch collapses the chain into five services */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">With Dispatch</div>
              <h2 className="mx-auto mt-3 max-w-3xl font-serif text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.5rem]">
                One governed process. One provable record.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">
                Dispatch does not replace the people or the judgement. It replaces the gaps between them — collapsing ten
                disconnected hand-offs into five institutional services that produce one accountable, verifiable record.
              </p>
            </div>

            {/* before → after */}
            <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Today</div>
                <div className="mt-4 space-y-1.5">
                  {PROCESS.map((p) => (
                    <div key={p.stage} className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-[13px] text-white/55">{p.stage}</div>
                  ))}
                </div>
                <div className="mt-4 text-[12px] text-white/35">Ten stages · many systems · no single source of truth</div>
              </div>

              <div className="hidden lg:flex lg:flex-col lg:items-center lg:px-2">
                <Chevron className="h-7 w-7 text-gold-400/60" />
              </div>

              <div className="rounded-2xl border border-gold-400/25 bg-gradient-to-b from-gold-400/[0.05] to-transparent p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400/80">With Dispatch</div>
                <div className="mt-4 space-y-3">
                  {UNIFIED.map((u, i) => (
                    <div key={u.title} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] text-gold-400/70">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-[14.5px] font-bold text-white">{u.title}</span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{u.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-[12px] text-gold-300/70">Five services · one platform · one provable record</div>
              </div>
            </div>
          </div>
        </section>

        {/* close — onward to the lifecycle / ROI / procurement */}
        <section className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-[2rem] font-bold leading-tight text-white sm:text-[2.4rem]">Now see exactly what you would be buying.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
              Walk the governed lifecycle stage by stage, model the operational case for your own institution, or open
              the full procurement materials.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(LIFECYCLE_ROUTE)} className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                The governed lifecycle <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => nav(ROI_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                ROI estimator
              </button>
              <button onClick={() => nav(WALKTHROUGH_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                Watch a record become official
              </button>
              <button onClick={() => nav(PROCUREMENT_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                Procurement center
              </button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default CostOfPublication;
