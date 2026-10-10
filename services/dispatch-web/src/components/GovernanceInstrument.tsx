import React from "react";
import type { GovernancePolicy } from "../lib/api";
import { ClassificationMark, Skeleton } from "./console/ds";
import { Icon } from "./console/icons";

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
  <span className="inline-flex items-center gap-1.5 rounded-md border border-sd-accent/40 bg-sd-accent/[0.08] px-2 py-1 text-[12.5px] font-semibold text-sd-text">
    <Icon.user className="h-3.5 w-3.5 text-sd-accent" />{label}{quorum && quorum > 1 ? <span className="font-mono text-[10.5px] font-bold text-sd-accent">quorum {quorum}</span> : null}
  </span>
);

// An artifact the institution will hold — a concrete output, not an abstract concept.
const Artifact: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center gap-1.5 rounded-md border border-sd-gold/45 bg-sd-gold/[0.08] px-2 py-1 text-[11.5px] font-semibold text-sd-gold">
    <Icon.seal className="h-3.5 w-3.5" />
    {label}
  </span>
);

// One step in the procedure: a numbered node on the spine, the act, WHO performs
// it, and WHAT it produces. `done`-style accenting is not used — this is
// prospective (what WILL happen), so every step reads as committed, not pending.
const Step: React.FC<{ n: number; act: string; children: React.ReactNode; last?: boolean }> = ({ n, act, children, last }) => (
  <li className="relative flex gap-3.5 pb-5 last:pb-0">
    {!last && <span className="absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px bg-sd-line" aria-hidden />}
    <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-sd-accent/45 bg-sd-sunken font-mono text-[12px] font-bold text-sd-accent">{n}</span>
    <div className="min-w-0 flex-1 pt-0.5">
      <div className="text-[13.5px] font-semibold text-sd-text">{act}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  </li>
);

export const GovernanceInstrument: React.FC<{
  docTypeLabel: string;
  classification: string;
  policy: GovernancePolicy | null;
  outputs?: string[];
  loading?: boolean;
}> = ({ docTypeLabel, classification, policy, outputs = ["pdf"], loading }) => {
  const chain = policy?.reviewChain ?? [];
  const sequential = policy?.sequential !== false; // default sequential
  const publisher = policy?.publicationAuthority;
  const formats = outputs.length ? outputs.map((o) => o.toUpperCase()).join(" · ") : "select a format below";

  return (
    <section aria-label="The governed publication procedure" className="overflow-hidden rounded-xl border border-sd-line bg-sd-panel">
      {/* framing — establishes the mental model, and answers Q1 (what governs it) up front */}
      <div className="border-b border-sd-soft px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-sd-gold">Official institutional publication</div>
            <h3 className="mt-1 font-serif text-[18px] font-semibold text-sd-text">The procedure this record will undergo</h3>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div>
              <div className="text-[12px] font-semibold text-sd-text2">{docTypeLabel}</div>
              <div className="text-[10.5px] uppercase tracking-[0.08em] text-sd-text3">Record type</div>
            </div>
            <ClassificationMark level={classification} />
          </div>
        </div>
        {/* Q1 — what governs this record — stated plainly, not buried */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-sd-line bg-sd-sunken px-3 py-2">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-sd-text3">Governed by</span>
          {loading ? <Skeleton className="h-4 w-48" /> : policy ? (
            <>
              <span className="text-[13.5px] font-semibold text-sd-text">{policy.name}</span>
              {policy.policyVersion ? <span className="font-mono text-[11.5px] text-sd-accent">v{policy.policyVersion}</span> : null}
              <span className="text-[11.5px] text-sd-text3">· enforced, not advisory</span>
            </>
          ) : (
            <span className="text-[12.5px] text-sd-text2">Platform default — a single approval. Define a policy in Administration to enforce a chain.</span>
          )}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.55fr_1fr]">
        {/* the lifecycle spine — Q3 (what happens after submit) and Q2 (who approves) */}
        <div className="border-b border-sd-soft p-5 lg:border-b-0 lg:border-r">
          <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-sd-text3">After you submit</div>
          <ol>
            <Step n={1} act="Submitted for governance">
              <span className="text-[12.5px] text-sd-text2">You author and submit it. Nothing is produced or visible as a record yet.</span>
            </Step>
            <Step n={2} act="Reviewed & approved">
              {chain.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {chain.map((s, i) => (
                      <React.Fragment key={i}>
                        <Authority label={s.label} quorum={s.quorum} />
                        {i < chain.length - 1 && <span className="text-sd-text3" aria-hidden>{sequential ? "→" : "+"}</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="mt-1.5 text-[11.5px] text-sd-text3">{sequential ? "Must approve in this order" : "Must all approve"} · you cannot approve a record you submitted</div>
                </>
              ) : (
                <span className="text-[12.5px] text-sd-text2">A single approver must approve before anything is produced.</span>
              )}
            </Step>
            <Step n={3} act="Rendered to the official form">
              <span className="text-[12.5px] text-sd-text2">A faithful, classified record is produced — <span className="font-mono text-[11.5px] text-sd-text">{formats}</span>.</span>
            </Step>
            <Step n={4} act="Published">
              <div className="flex flex-wrap items-center gap-2">
                {publisher ? <Authority label={publisher} /> : <span className="text-[12.5px] text-sd-text2">A defined publishing authority releases it</span>}
                <Artifact label="Governance Certificate" />
              </div>
              <div className="mt-1.5 text-[11.5px] text-sd-text3">Released only by the publication authority — never an approver. The certificate proves the chain was satisfied: <span className="font-semibold text-sd-ok">COMPLIANT</span>.</div>
            </Step>
            <Step n={5} act="Preserved" last>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] text-sd-text2">Sealed, terminal — no edit or withdrawal</span>
                <Artifact label="Preservation Certificate" />
              </div>
            </Step>
          </ol>
        </div>

        {/* what you will hold — Q4 (artifacts), concrete; and the evidence guarantee */}
        <div className="flex flex-col gap-4 p-5">
          <div>
            <div className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-sd-text3">What the institution will hold</div>
            <ul className="space-y-2">
              {[
                ["Official Record", "A governed, versioned, classified instrument — not a file."],
                ["Governance Certificate", "Records that the policy chain was satisfied in order, with a SHA-256 integrity proof."],
                ["Preservation Certificate", "Tamper-evident SHA-256 seal; the record is permanent."],
                ["Evidence Chain", "Every act, hash-stamped to an append-only trail."],
              ].map(([t, d]) => (
                <li key={t} className="rounded-lg border border-sd-soft bg-sd-sunken px-3 py-2">
                  <div className="text-[12.5px] font-semibold text-sd-text">{t}</div>
                  <div className="mt-0.5 text-[11.5px] leading-snug text-sd-text3">{d}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-auto rounded-lg border border-sd-line bg-sd-sunken px-3 py-2.5 text-[11.5px] leading-snug text-sd-text3">
            From submission to preservation, every step is recorded to an append-only <span className="font-semibold text-sd-text2">evidence chain</span>; preservation and certificate events carry their SHA-256 proofs.
          </div>
        </div>
      </div>
    </section>
  );
};

export default GovernanceInstrument;
