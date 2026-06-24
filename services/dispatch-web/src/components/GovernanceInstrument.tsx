import React from "react";
import type { GovernancePolicy } from "../lib/api";
import { ClassBadge } from "../lib/ui";

// THE GOVERNED PUBLICATION PROCEDURE — not a governance sidebar, the procedure
// itself. When a Secretary General sits in front of this, the intended thought is
// not "I am filling a form" but "I am initiating an official institutional
// publication process." So this renders the actual LIFECYCLE the record will
// undergo after submission, with the responsible authority placed ON each step
// and the artifact each step produces shown as a concrete output. It answers, in
// under three seconds and without anything hidden or collapsed:
//   • What governs this record?        → the policy line, foregrounded
//   • Who must approve it?             → the authorities, on the Approve step
//   • What happens after I submit?     → the timeline IS the answer
//   • What will be produced?           → the artifacts, on the steps that seal them
// Every value is read from the REAL resolved policy; nothing is fabricated.

const Authority: React.FC<{ label: string; quorum?: number }> = ({ label, quorum }) => (
  <span className="inline-flex items-center gap-1 rounded-md border border-seal-light/40 bg-seal/20 px-2 py-1 text-[12.5px] font-semibold text-white">
    {label}{quorum && quorum > 1 ? <span className="font-mono text-[10px] font-bold text-seal-light">×{quorum}</span> : null}
  </span>
);

// An artifact the institution will hold — a concrete output, not an abstract concept.
const Artifact: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11.5px] font-semibold text-emerald-200">
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden><path d="M8 2l1.5 1.1 1.8-.1.6 1.7 1.6 1-.5 1.8.5 1.8-1.6 1-.6 1.7-1.8-.1L8 14l-1.5-1.1-1.8.1-.6-1.7-1.6-1 .5-1.8L2.5 6.7l1.6-1 .6-1.7 1.8.1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M6.2 8.2l1.2 1.2 2.4-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
    {label}
  </span>
);

// One step in the procedure: a numbered node on the spine, the act, WHO performs
// it, and WHAT it produces. `done`-style accenting is not used — this is
// prospective (what WILL happen), so every step reads as committed, not pending.
const Step: React.FC<{ n: number; act: string; children: React.ReactNode; last?: boolean }> = ({ n, act, children, last }) => (
  <li className="relative flex gap-3.5 pb-5 last:pb-0">
    {!last && <span className="absolute left-[14px] top-7 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-seal-light/40 to-white/5" aria-hidden />}
    <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-seal/30 font-mono text-[12px] font-bold text-seal-light ring-1 ring-seal-light/40">{n}</span>
    <div className="min-w-0 flex-1 pt-0.5">
      <div className="text-[13.5px] font-bold tracking-tight text-white">{act}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  </li>
);

export const GovernanceInstrument: React.FC<{
  docTypeLabel: string;
  classification: string;
  policy: GovernancePolicy | null;
  outputs?: string[];
}> = ({ docTypeLabel, classification, policy, outputs = ["pdf"] }) => {
  const chain = policy?.reviewChain ?? [];
  const sequential = policy?.sequential !== false; // default sequential
  const publisher = policy?.publicationAuthority;
  const formats = outputs.length ? outputs.map((o) => o.toUpperCase()).join(" · ") : "PDF";

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* framing — establishes the mental model, and answers Q1 (what governs it) up front */}
      <div className="border-b border-white/[0.07] bg-gradient-to-r from-seal/20 to-transparent px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-seal-light/80">Official institutional publication</div>
            <h2 className="mt-1 font-serif text-xl font-bold tracking-tight text-white">The procedure this record will undergo</h2>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div>
              <div className="text-[11px] text-white/45">{docTypeLabel}</div>
              <div className="text-[10px] uppercase tracking-wide text-white/30">Record type</div>
            </div>
            <ClassBadge level={classification} />
          </div>
        </div>
        {/* Q1 — what governs this record — stated plainly, not buried */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2">
          <span className="text-[11px] uppercase tracking-wide text-white/40">Governed by</span>
          {policy ? (
            <>
              <span className="text-[13.5px] font-bold text-white">{policy.name}</span>
              {policy.policyVersion ? <span className="font-mono text-[11px] text-seal-light/80">v{policy.policyVersion}</span> : null}
              <span className="text-[11px] text-white/35">· enforced, not advisory</span>
            </>
          ) : (
            <span className="text-[12.5px] text-white/60">Platform default — a single approval. Define a policy in Administration to enforce a chain.</span>
          )}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.55fr_1fr]">
        {/* the lifecycle spine — Q3 (what happens after submit) and Q2 (who approves) */}
        <div className="border-b border-white/[0.06] p-5 lg:border-b-0 lg:border-r">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">After you submit</div>
          <ol>
            <Step n={1} act="Submitted for governance">
              <span className="text-[12px] text-white/55">You author and submit it. Nothing is produced or visible as a record yet.</span>
            </Step>
            <Step n={2} act="Reviewed &amp; approved">
              {chain.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {chain.map((s, i) => (
                      <React.Fragment key={i}>
                        <Authority label={s.label} quorum={s.quorum} />
                        {i < chain.length - 1 && <span className="text-white/30" aria-hidden>{sequential ? "→" : "+"}</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="mt-1.5 text-[11px] text-white/40">{sequential ? "Must approve in this order" : "Must all approve"} · you cannot approve a record you submitted</div>
                </>
              ) : (
                <span className="text-[12px] text-white/55">A single approver must approve before anything is produced.</span>
              )}
            </Step>
            <Step n={3} act="Rendered to the official form">
              <span className="text-[12px] text-white/55">A faithful, classified record is produced — <span className="font-mono text-[11px] text-white/70">{formats}</span>.</span>
            </Step>
            <Step n={4} act="Published">
              <div className="flex flex-wrap items-center gap-2">
                {publisher ? <Authority label={publisher} /> : <span className="text-[12px] text-white/55">A defined publishing authority releases it</span>}
                <Artifact label="Governance Certificate" />
              </div>
              <div className="mt-1.5 text-[11px] text-white/40">Released only by the publication authority — never an approver. The certificate proves the chain was satisfied: <span className="text-emerald-300/80">COMPLIANT</span>.</div>
            </Step>
            <Step n={5} act="Preserved" last>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-white/55">Sealed, terminal — no edit or withdrawal</span>
                <Artifact label="Preservation Certificate" />
              </div>
            </Step>
          </ol>
        </div>

        {/* what you will hold — Q4 (artifacts), concrete; and the evidence guarantee */}
        <div className="flex flex-col gap-4 p-5">
          <div>
            <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">What the institution will hold</div>
            <ul className="space-y-2">
              {[
                ["Official Record", "A governed, versioned, classified instrument — not a file."],
                ["Governance Certificate", "Cryptographic proof the policy chain was satisfied in order."],
                ["Preservation Certificate", "Tamper-evident SHA-256 seal; the record is permanent."],
                ["Evidence Chain", "Every act, hash-stamped to an append-only trail."],
              ].map(([t, d]) => (
                <li key={t} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                  <div className="text-[12.5px] font-bold text-white">{t}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-white/45">{d}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-auto rounded-lg border border-seal-light/20 bg-seal/10 px-3 py-2.5 text-[11px] leading-snug text-white/55">
            From submission to preservation, every step is recorded to an append-only, hash-stamped <span className="font-semibold text-white/80">evidence chain</span> — independently auditable.
          </div>
        </div>
      </div>
    </section>
  );
};

export default GovernanceInstrument;
