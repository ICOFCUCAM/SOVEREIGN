import React from "react";
import type { GovernancePolicy } from "../lib/api";
import { ClassBadge } from "../lib/ui";

// THE GOVERNANCE INSTRUMENT — the front door to a governed publication system.
// It makes the platform's invisible sophistication visible: for the record being
// authored it shows, derived from the REAL resolved policy, the five things an
// institutional evaluator must understand at a glance —
//   1. Governance  — what policy governs this record
//   2. Authority   — who must approve it, in what order, at what quorum
//   3. Publication — who, and only who, may release it
//   4. Certificate — the cryptographic proof publication will produce
//   5. Evidence    — how every act is sealed into an unbroken chain
// Nothing here is fabricated: every authority, quorum and name comes from the
// governance policy bound to this record's type and classification. When no named
// policy exists the instrument states the honest platform-default path.

// — small institutional glyphs (no icon dependency; engraved, not glossy) ——————
const Glyph: React.FC<{ d: string; className?: string }> = ({ d, className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ICONS = {
  policy: "M6 3h9l3 3v15H6zM15 3v3h3M9 11h6M9 15h6",
  authority: "M12 3l8 3v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6zM9 12l2 2 4-4",
  publication: "M5 21V5a2 2 0 012-2h7l5 5v13zM14 3v5h5M8 13h8M8 17h5",
  certificate: "M12 3l2.2 1.6 2.7-.2 1 2.5 2.3 1.4-.7 2.6.7 2.6-2.3 1.4-1 2.5-2.7-.2L12 21l-2.2-1.6-2.7.2-1-2.5L3.8 16l.7-2.6L3.8 11l2.3-1.4 1-2.5 2.7.2zM9.5 12.5l1.8 1.8 3.4-3.6",
  evidence: "M8 7a3 3 0 100 6h3a3 3 0 100-6M13 7h3a3 3 0 110 6M8 10h8",
} as const;

const Authority: React.FC<{ label: string; quorum?: number }> = ({ label, quorum }) => (
  <span className="inline-flex items-center gap-1 rounded-md border border-seal-light/30 bg-seal/15 px-2 py-1 text-[12px] font-medium text-white/90">
    {label}{quorum && quorum > 1 ? <span className="font-mono text-[10px] text-seal-light">×{quorum}</span> : null}
  </span>
);

// One stage of the instrument: an engraved plate with a number, glyph, title and
// the specific, policy-derived detail.
const Stage: React.FC<{ n: string; icon: string; title: string; lede: string; children: React.ReactNode }> = ({ n, icon, title, lede, children }) => (
  <div className="relative flex-1 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-seal/25 text-seal-light ring-1 ring-seal-light/30">
        <Glyph d={icon} className="h-4 w-4" />
      </span>
      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-white/30">{n}</div>
        <div className="text-[13px] font-bold tracking-tight text-white">{title}</div>
      </div>
    </div>
    <div className="mt-1.5 text-[11px] uppercase tracking-wide text-seal-light/70">{lede}</div>
    <div className="mt-2.5">{children}</div>
  </div>
);

const Connector: React.FC = () => (
  <div className="hidden items-center self-center text-white/15 lg:flex" aria-hidden>
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </div>
);

export const GovernanceInstrument: React.FC<{
  docTypeLabel: string;
  classification: string;
  policy: GovernancePolicy | null;
}> = ({ docTypeLabel, classification, policy }) => {
  const chain = policy?.reviewChain ?? [];
  const governed = chain.length > 0 || !!policy;
  const sequential = policy?.sequential !== false; // default sequential
  const publisher = policy?.publicationAuthority;
  const approval = policy?.approvalAuthority;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60">
      {/* instrument header — gravity, not chrome */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.07] bg-gradient-to-r from-seal/15 to-transparent px-5 py-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-seal-light/80">The governed lifecycle</div>
          <h2 className="mt-1 font-serif text-xl font-bold tracking-tight text-white">How this becomes an Official Record</h2>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div>
            <div className="text-[11px] text-white/40">{docTypeLabel}</div>
            <div className="text-[10px] uppercase tracking-wide text-white/30">Record type</div>
          </div>
          <ClassBadge level={classification} />
        </div>
      </div>

      {/* the five-stage instrument */}
      <div className="flex flex-col gap-2 p-5 lg:flex-row lg:items-stretch">
        <Stage n="01" icon={ICONS.policy} title="Governing policy" lede="What governs it">
          {governed ? (
            <>
              <div className="text-[13px] font-semibold leading-snug text-white">{policy?.name ?? "Institutional policy"}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/45">
                {policy?.policyVersion ? <span className="font-mono text-seal-light/80">v{policy.policyVersion}</span> : null}
                <span>· bound to {docTypeLabel}{policy?.classificationLevel ? ` · ${policy.classificationLevel}` : ""}</span>
              </div>
            </>
          ) : (
            <div className="text-[12px] leading-snug text-white/55">Platform default — a single approval. Define a policy for this type in Administration to set an enforced chain.</div>
          )}
        </Stage>

        <Connector />

        <Stage n="02" icon={ICONS.authority} title="Approval authority" lede="Who must approve">
          {chain.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                {chain.map((s, i) => (
                  <React.Fragment key={i}>
                    <Authority label={s.label} quorum={s.quorum} />
                    {i < chain.length - 1 && <span className="text-white/25" aria-hidden>{sequential ? "→" : "+"}</span>}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-white/40">{sequential ? "Satisfied in order" : "Satisfied in parallel"}{approval ? ` · ${approval}` : ""}</div>
            </>
          ) : (
            <div className="text-[12px] leading-snug text-white/55">{governed ? "A single approval releases this record." : "One reviewer approves before anything is produced."}</div>
          )}
        </Stage>

        <Connector />

        <Stage n="03" icon={ICONS.publication} title="Publication authority" lede="Who may publish">
          {publisher ? (
            <>
              <Authority label={publisher} />
              <div className="mt-2 text-[11px] leading-snug text-white/40">Reserved at release. An approver may never be the publisher.</div>
            </>
          ) : (
            <div className="text-[12px] leading-snug text-white/55">A defined publishing authority releases the record — separate from its approvers.</div>
          )}
        </Stage>

        <Connector />

        <Stage n="04" icon={ICONS.certificate} title="Certificate produced" lede="The proof">
          <div className="text-[12px] font-semibold text-white">Governance Certificate</div>
          <div className="mt-1 text-[11px] leading-snug text-white/45">Sealed at publication: required vs. actual chain, an integrity proof, and a verifiable <span className="text-emerald-300/80">COMPLIANT</span> verdict. A Preservation Certificate is issued on archive.</div>
        </Stage>

        <Connector />

        <Stage n="05" icon={ICONS.evidence} title="Evidence chain" lede="How it's proven">
          <div className="text-[12px] leading-snug text-white/55">Every act — submission, each decision, publication, preservation — sealed into an append-only, hash-stamped trail, independently auditable.</div>
        </Stage>
      </div>
    </section>
  );
};

export default GovernanceInstrument;
