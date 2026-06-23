import React, { useEffect, useState } from "react";
import { Dot } from "./brand";

// Public operational-presence + evidence components. The discipline (per the
// build brief): NO decorative metrics. Everything here is either a capability
// statement, a workflow/architecture visualization, or a clearly-labelled
// sample record — never a fabricated production count.

// ── inline icons ───────────────────────────────────────────────────────────
const I = {
  ministry: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><path d="M4 9l8-5 8 5M5 9v8m4-8v8m6-8v8m4-8v8M3 20h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>),
  cap: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><path d="M2 8l10-4 10 4-10 4L2 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M6 10v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" stroke="currentColor" strokeWidth="1.4" /></svg>),
  hospital: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><rect x="5" y="4" width="14" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M12 8v6m-3-3h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>),
  shield: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C8 19 5 15.6 5 11V5.5L12 3z" stroke="currentColor" strokeWidth="1.4" /></svg>),
  globe: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.4" /><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14 0 17M12 3.5c-2.5 2.5-2.5 14 0 17" stroke="currentColor" strokeWidth="1.2" /></svg>),
  doc: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><path d="M7 3h7l4 4v14H7V3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.4" /></svg>),
  users: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.4" /><path d="M3.5 19a5.5 5.5 0 0111 0M16 7a3 3 0 010 6m4.5 6a5.5 5.5 0 00-4-5.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>),
  check: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.4" /><path d="M8.5 12l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  render: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><path d="M8 4H5v3m11-3h3v3M8 20H5v-3m11 3h3v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" /></svg>),
  publish: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.4" /><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14 0 17M12 3.5c-2.5 2.5-2.5 14 0 17" stroke="currentColor" strokeWidth="1.2" /></svg>),
  archive: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><rect x="4" y="6" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" /><path d="M5 10v9h14v-9M10 14h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>),
  seal: (c: string) => (<svg viewBox="0 0 24 24" className={c} fill="none"><path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C8 19 5 15.6 5 11V5.5L12 3z" stroke="currentColor" strokeWidth="1.5" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>),
};

const INSTITUTIONS: [string, (c: string) => React.ReactNode][] = [
  ["Ministries", I.ministry], ["Universities", I.cap], ["Hospitals", I.hospital], ["Agencies", I.shield], ["Authorities", I.globe],
];
const STAGES: [string, (c: string) => React.ReactNode][] = [
  ["Submit", I.doc], ["Govern", I.users], ["Approve", I.check], ["Render", I.render], ["Publish", I.publish], ["Archive", I.archive],
];

// ── Hero flow: institutions → governed pipeline → official record ───────────
// A workflow/architecture visualization (not metrics). A highlight advances
// through the pipeline to signal a system that runs, end to end.
export const HeroFlow: React.FC = () => {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % (STAGES.length + 1)), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative select-none py-4">
      <div className="flex items-center justify-center gap-3 2xl:gap-6">
        {/* institution feeders — shown where the column is wide enough (xl+) */}
        <div className="hidden flex-col gap-4 2xl:flex">
          {INSTITUTIONS.map(([label, icon]) => (
            <div key={label} className="flex items-center justify-end gap-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-gold-400/80">{icon("h-4 w-4")}</span>
            </div>
          ))}
        </div>
        <Converge />
        <Arrow lit />
        {/* governed pipeline */}
        <div className="flex items-center gap-2 2xl:gap-2.5">
          {STAGES.map(([label, icon], i) => {
            const active = i === stage;
            const done = stage > i || stage === STAGES.length;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg border bg-gradient-to-b transition-all duration-500 2xl:h-16 2xl:w-16 ${active ? "border-gold-400/70 from-gold-500/[0.16] to-gold-500/[0.04] text-gold-300 shadow-lg shadow-gold-700/30" : done ? "border-emerald-400/30 from-white/[0.05] to-transparent text-white/70" : "border-white/12 from-white/[0.04] to-transparent text-white/45"}`}>{icon("h-5 w-5 2xl:h-6 2xl:w-6")}</div>
                  <span className={`text-[9.5px] font-bold uppercase tracking-wide 2xl:text-[10.5px] ${active ? "text-gold-300" : "text-white/45"}`}>{label}</span>
                </div>
                {i < STAGES.length - 1 && <Arrow lit={done} />}
              </React.Fragment>
            );
          })}
        </div>
        <Arrow lit={stage === STAGES.length} />
        {/* official record */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative flex h-16 w-16 items-center justify-center 2xl:h-20 2xl:w-20">
            <span className={`absolute inset-0 rounded-full border transition-all duration-700 ${stage === STAGES.length ? "border-gold-400/50 scale-110" : "border-white/10"}`} />
            <span className={`absolute -inset-2 rounded-full border transition-all duration-700 ${stage === STAGES.length ? "border-gold-400/20" : "border-transparent"}`} />
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-gold-400/20 to-gold-700/10 text-gold-300 2xl:h-14 2xl:w-14">{I.seal("h-6 w-6 2xl:h-7 2xl:w-7")}</span>
          </div>
          <span className="max-w-[80px] text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-gold-300">Official Record</span>
        </div>
      </div>
      <p className="mt-7 text-center text-[10px] uppercase tracking-[0.25em] text-white/30">Submit · Govern · Approve · Render · Publish · Archive</p>
    </div>
  );
};

const Arrow: React.FC<{ lit?: boolean }> = ({ lit }) => (
  <span className={`mb-5 flex items-center transition-colors duration-500 ${lit ? "text-gold-400/70" : "text-white/15"}`}>
    <span className={`h-px w-3 2xl:w-5 ${lit ? "bg-gold-400/50" : "bg-white/12"}`} />
    <svg viewBox="0 0 8 12" className="h-2.5 w-2" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
);

const Converge: React.FC = () => (
  <svg viewBox="0 0 40 200" className="hidden h-40 w-9 text-gold-400/30 2xl:block" fill="none" preserveAspectRatio="none">
    {[16, 58, 100, 142, 184].map((y) => (
      <path key={y} d={`M0 ${y} C 22 ${y}, 18 100, 40 100`} stroke="currentColor" strokeWidth="1" />
    ))}
  </svg>
);

// ── Evidence: a published official record (sample) ──────────────────────────
export const LastPublishedCard: React.FC = () => (
  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-7">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">Last Published</span>
      <span className="rounded border border-amber-400/30 bg-amber-400/[0.07] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300/90">Restricted</span>
    </div>
    <div className="mt-3 font-serif text-2xl font-bold text-white">Regional Stability Brief</div>
    <p className="mt-1 text-[12.5px] text-white/45">Executive briefing · 2-eyes approval policy</p>
    <dl className="mt-6 space-y-3 text-[13px]">
      {[["Approved", "2026-05-31 14:32 UTC"], ["Published", "2026-05-31 14:36 UTC"], ["Artifacts", "PDF · DOCX"], ["Audit ID", "DSP-2026-48391"], ["Content hash", "sha256:9f2c…a17e"]].map(([k, v]) => (
        <div key={k} className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <dt className="text-white/45">{k}</dt><dd className="font-mono text-[12.5px] text-white/85">{v}</dd>
        </div>
      ))}
    </dl>

    <div className="mt-6 border-t border-white/8 pt-4">
      <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Other recent records</div>
      <ul className="space-y-2.5">
        {[
          ["Budget Authorization Package", "Operational package", "DSP-2026-48402"],
          ["Regulatory Impact Assessment", "Regulatory submission", "DSP-2026-48417"],
        ].map(([title, type, id]) => (
          <li key={id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-white/85">{title}</div>
              <div className="text-[11px] text-white/40">{type}</div>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-white/45">{id}</span>
          </li>
        ))}
      </ul>
    </div>
    <p className="mt-5 text-[11px] italic text-white/30">Sample records — illustrating the provenance every publication carries.</p>
  </div>
);

// ── Evidence: full document lifecycle with timestamps (sample) ──────────────
const LIFECYCLE: [string, string, string?][] = [
  ["Document created", "14:21 UTC", "svc-author"],
  ["Submitted", "14:23 UTC", "schema validated"],
  ["Approved · 2 of 2", "14:32 UTC", "svc-approver"],
  ["Rendered", "14:34 UTC", "PDF · DOCX"],
  ["Published", "14:36 UTC", "provenance sealed"],
  ["Archived", "14:36 UTC", "retention applied"],
];
export const LifecycleTrail: React.FC = () => (
  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-7">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">Document Lifecycle</span>
      <span className="font-mono text-[11px] text-white/35">DSP-2026-48391</span>
    </div>
    <ol className="mt-6">
      {LIFECYCLE.map(([label, time, meta], i, a) => (
        <li key={label} className="relative flex gap-4 pb-6 last:pb-0">
          {i < a.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-white/10" aria-hidden />}
          <span className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${i === a.length - 1 ? "border-gold-400 bg-gold-400/30" : "border-emerald-400/70 bg-emerald-400/20"}`} />
          <div className="flex flex-1 items-baseline justify-between">
            <div><div className="text-[13.5px] font-semibold text-white">{label}</div>{meta && <div className="text-[11.5px] text-white/40">{meta}</div>}</div>
            <div className="font-mono text-[12px] text-white/55">{time}</div>
          </div>
        </li>
      ))}
    </ol>
    <p className="mt-1 text-[11px] italic text-white/30">Sample lifecycle — every action is recorded to the append-only audit trail.</p>
  </div>
);

// ── Evidence: public audit timeline (sample events) ─────────────────────────
const AUDIT_ROWS: { actor: string; action: string; outcome: string; doc: string; time: string; id: string }[] = [
  { actor: "svc-author", action: "document.submitted", outcome: "Accepted", doc: "Regional Stability Brief", time: "14:23:07 UTC", id: "DSP-2026-48391" },
  { actor: "svc-reviewer", action: "document.approved", outcome: "1 of 2", doc: "Regional Stability Brief", time: "14:29:51 UTC", id: "DSP-2026-48391" },
  { actor: "svc-approver", action: "document.approved", outcome: "2 of 2 · cleared", doc: "Regional Stability Brief", time: "14:32:18 UTC", id: "DSP-2026-48391" },
  { actor: "render-engine", action: "artifact.rendered", outcome: "PDF · DOCX", doc: "Regional Stability Brief", time: "14:34:02 UTC", id: "DSP-2026-48391" },
  { actor: "svc-publisher", action: "document.published", outcome: "Sealed", doc: "Regional Stability Brief", time: "14:36:40 UTC", id: "DSP-2026-48391" },
];
export const PublicAuditTimeline: React.FC = () => (
  <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
    <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">Audit Trail</span>
      <span className="inline-flex items-center gap-1.5 text-[11px] text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" /> append-only · SHA-256</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-white/8 text-left text-[10px] uppercase tracking-wide text-white/35">
            {["Actor", "Action", "Outcome", "Document", "Time", "Audit ID"].map((h) => <th key={h} className="px-5 py-2.5 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {AUDIT_ROWS.map((r, i) => (
            <tr key={i} className="hover:bg-white/[0.02]">
              <td className="px-5 py-2.5 text-[12.5px] text-white/70">{r.actor}</td>
              <td className="px-5 py-2.5"><span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-white/80">{r.action}</span></td>
              <td className="px-5 py-2.5 text-[12px] text-emerald-300/80">{r.outcome}</td>
              <td className="px-5 py-2.5 text-[12.5px] text-white/60">{r.doc}</td>
              <td className="px-5 py-2.5 font-mono text-[11px] text-white/45">{r.time}</td>
              <td className="px-5 py-2.5 font-mono text-[11px] text-white/45">{r.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="border-t border-white/5 px-6 py-3 text-[11px] italic text-white/30">Sample trail — the console renders the live, tenant-scoped audit for your institution.</p>
  </div>
);

// ── Sovereignty dashboard: capabilities, not badges ─────────────────────────
const GROUPS: [string, string[]][] = [
  ["Deployment Models", ["Cloud", "Private Cloud", "Sovereign Hosting", "On-Premise", "Air-Gapped"]],
  ["Security", ["Encryption at Rest", "Encryption in Transit", "Append-Only Audit Trail", "Tenant Isolation"]],
  ["Governance", ["Approval Workflows", "Separation of Duties", "Retention Policies", "Record Versioning"]],
];
const CheckMark: React.FC = () => (<svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-emerald-400" fill="none"><path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
export const CapabilitiesDashboard: React.FC = () => (
  <div className="grid gap-5 lg:grid-cols-3">
    {GROUPS.map(([title, items]) => (
      <div key={title} className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-2 border-b border-white/8 pb-3"><Dot /><span className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/80">{title}</span></div>
        <ul className="mt-4 space-y-3">{items.map((it) => <li key={it} className="flex items-center gap-3 text-[14px] text-white/75"><CheckMark /> {it}</li>)}</ul>
      </div>
    ))}
  </div>
);
