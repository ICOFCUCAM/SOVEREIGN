import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { COST_ROUTE, LIFECYCLE_ROUTE, PROCUREMENT_ROUTE, PRICING_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";
import { useMarketing6Copy } from "../lib/messages";

// Phase 4 of the Institutional Value & Procurement Experience — the operational
// model estimator. It NEVER promises savings. It takes the institution's own
// inputs and reflects the scale of governed-publication activity those inputs
// imply, separating the irreducible judgement (review, approval) from the
// coordination and reconstruction effort that a governed platform targets. Every
// figure is explicitly illustrative and dependent on the institution's processes.

interface Inputs {
  publications: number;   // official publications per year
  reviewers: number;      // reviewing offices per publication
  departments: number;    // departments involved per publication
  audits: number;         // audits / evidence requests per year
  hoursPerReview: number; // assumed hours per review touch
  coordPerHandoff: number;// assumed coordination hours per departmental hand-off
  auditHoursPerPub: number;// assumed hours to assemble evidence per publication, per audit
  hourlyCost: number;     // blended staff cost per hour
  currency: string;
}

const DEFAULTS: Inputs = {
  publications: 250,
  reviewers: 4,
  departments: 3,
  audits: 2,
  hoursPerReview: 2,
  coordPerHandoff: 0.5,
  auditHoursPerPub: 0.4,
  hourlyCost: 60,
  currency: "$",
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const Field: React.FC<{
  label: string; hint?: string; value: number; min: number; max: number; step?: number;
  onChange: (n: number) => void; suffix?: string;
}> = ({ label, hint, value, min, max, step = 1, onChange, suffix }) => (
  <label className="block">
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[13px] font-semibold text-white/80">{label}</span>
      <span className="font-mono text-[13px] text-gold-300">{value.toLocaleString("en-US")}{suffix}</span>
    </div>
    {hint && <div className="mt-0.5 text-[11.5px] leading-snug text-white/40">{hint}</div>}
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="mt-2.5 w-full accent-gold-400"
      aria-label={label}
    />
  </label>
);

const Stat: React.FC<{ label: string; value: string; sub?: string; accent?: boolean }> = ({ label, value, sub, accent }) => (
  <div className={`rounded-xl border p-5 ${accent ? "border-gold-400/30 bg-gold-400/[0.05]" : "border-white/10 bg-white/[0.02]"}`}>
    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{label}</div>
    <div className={`mt-1.5 font-serif text-[1.9rem] font-bold leading-none ${accent ? "text-gold-200" : "text-white"}`}>{value}</div>
    {sub && <div className="mt-1.5 text-[12px] leading-snug text-white/45">{sub}</div>}
  </div>
);

const Roi: React.FC = () => {
  const nav = useNavigate();
  const c = useMarketing6Copy().roi;
  useReveal();
  const [v, setV] = useState<Inputs>(DEFAULTS);
  React.useEffect(() => track("page.roi"), []);
  const set = (k: keyof Inputs) => (n: number) => setV((s) => ({ ...s, [k]: n }));

  const m = useMemo(() => {
    const reviewTouches = v.publications * v.reviewers;
    const reviewHours = reviewTouches * v.hoursPerReview;                       // judgement — irreducible
    const coordinationHours = v.publications * v.departments * v.coordPerHandoff; // hand-off waste — targeted
    const auditHours = v.audits * v.publications * v.auditHoursPerPub;          // reconstruction — targeted
    const totalHours = reviewHours + coordinationHours + auditHours;
    const targetedHours = coordinationHours + auditHours;
    const cur = v.currency;
    const cost = (h: number) => `${cur}${fmt(h * v.hourlyCost)}`;
    return {
      reviewTouches, reviewHours, coordinationHours, auditHours, totalHours, targetedHours,
      totalCost: cost(totalHours), targetedCost: cost(targetedHours), reviewCost: cost(reviewHours),
      records: v.publications, evidenceChains: v.publications,
      targetedPct: totalHours > 0 ? Math.round((targetedHours / totalHours) * 100) : 0,
    };
  }, [v]);

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="outcomes" alt="Modelling the institutional operating case" />
      <main>
        <section className="border-t border-white/[0.06] px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <button onClick={() => nav(PROCUREMENT_ROUTE)} className="group inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400 transition hover:text-gold-300">
              <Chevron className="h-3 w-3 rotate-180" /> {c.backLink}
            </button>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">
              {c.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/60">
              {c.lead.split("{em}")[0]}<span className="text-white/85">{c.leadEm}</span>{c.lead.split("{em}")[1]}
            </p>

            <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              {/* inputs */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-6 sm:p-7">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{c.yourInstitution}</div>
                <div className="mt-5 space-y-6">
                  <Field label={c.fPublications} value={v.publications} min={10} max={5000} step={10} onChange={set("publications")} />
                  <Field label={c.fReviewers} hint={c.fReviewersHint} value={v.reviewers} min={1} max={12} onChange={set("reviewers")} />
                  <Field label={c.fDepartments} hint={c.fDepartmentsHint} value={v.departments} min={1} max={12} onChange={set("departments")} />
                  <Field label={c.fAudits} value={v.audits} min={0} max={24} onChange={set("audits")} />
                  <div className="border-t border-white/[0.06] pt-6">
                    <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{c.yourAssumptions}</div>
                    <div className="space-y-6">
                      <Field label={c.fHoursPerReview} value={v.hoursPerReview} min={0.5} max={8} step={0.5} onChange={set("hoursPerReview")} suffix="h" />
                      <Field label={c.fCoordPerHandoff} hint={c.fCoordPerHandoffHint} value={v.coordPerHandoff} min={0} max={4} step={0.25} onChange={set("coordPerHandoff")} suffix="h" />
                      <Field label={c.fAuditHoursPerPub} hint={c.fAuditHoursPerPubHint} value={v.auditHoursPerPub} min={0} max={4} step={0.1} onChange={set("auditHoursPerPub")} suffix="h" />
                      <Field label={c.fHourlyCost} value={v.hourlyCost} min={20} max={300} step={5} onChange={set("hourlyCost")} suffix={` ${v.currency}/h`} />
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <span className="text-[12px] text-white/45">{c.currencyLabel}</span>
                      {["$", "€", "£"].map((c) => (
                        <button key={c} onClick={() => setV((s) => ({ ...s, currency: c }))}
                          className={`h-8 w-9 rounded border text-[14px] font-semibold transition ${v.currency === c ? "border-gold-400/50 bg-gold-400/10 text-gold-200" : "border-white/15 text-white/60 hover:border-white/30"}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => setV(DEFAULTS)} className="mt-6 text-[12px] font-semibold uppercase tracking-wide text-white/45 transition hover:text-white/70">{c.resetBtn}</button>
              </div>

              {/* outputs */}
              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Stat label={c.statRecords} value={fmt(m.records)} sub={c.statRecordsSub} />
                  <Stat label={c.statReviewTouches} value={fmt(m.reviewTouches)} sub={c.statReviewTouchesSub} />
                  <Stat label={c.statEvidenceChains} value={fmt(m.evidenceChains)} sub={c.statEvidenceChainsSub} />
                  <Stat label={c.statGovernedEffort} value={`${fmt(m.totalHours)} h`} sub={c.statGovernedEffortSub.replace("{cost}", m.totalCost)} />
                </div>

                {/* the model split — judgement vs targeted waste */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{c.whereEffortGoes}</div>
                  <div className="mt-4 space-y-3">
                    {[
                      { hours: m.reviewHours, cost: m.reviewCost, bar: "bg-white/30" },
                      { hours: m.coordinationHours, cost: `${v.currency}${fmt(m.coordinationHours * v.hourlyCost)}`, bar: "bg-gold-400/70" },
                      { hours: m.auditHours, cost: `${v.currency}${fmt(m.auditHours * v.hourlyCost)}`, bar: "bg-gold-400/70" },
                    ].map((row, idx) => {
                      const r = c.effortRows[idx];
                      const pct = m.totalHours > 0 ? (row.hours / m.totalHours) * 100 : 0;
                      return (
                        <div key={r.label}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[13.5px] font-semibold text-white/85">{r.label}</span>
                            <span className="font-mono text-[12.5px] text-white/55">{fmt(row.hours)} h · {row.cost}</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                            <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-1 text-[11.5px] text-white/40">{r.note}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 rounded-xl border border-gold-400/25 bg-gold-400/[0.05] p-4">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-300/80">{c.targetedLabel}</div>
                    <div className="mt-1 font-serif text-[1.6rem] font-bold text-gold-200">{fmt(m.targetedHours)} h <span className="text-[1rem] font-semibold text-white/55">{c.perYear} {m.targetedCost}</span></div>
                    <div className="mt-1.5 text-[12.5px] leading-snug text-white/55">
                      {c.targetedNote.replace("{pct}", String(m.targetedPct))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* honest disclaimer */}
            <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.015] p-5 text-[12.5px] leading-relaxed text-white/45">
              <span className="font-semibold text-white/65">{c.disclaimerBold}</span>{" "}
              {c.disclaimerBody.split("{link}")[0]}<button onClick={() => nav(PRICING_ROUTE)} className="font-semibold text-gold-300 hover:underline">{c.disclaimerLink}</button>{c.disclaimerBody.split("{link}")[1]}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={() => nav(COST_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">{c.ctaCost}</button>
              <button onClick={() => nav(LIFECYCLE_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">{c.ctaLifecycle}</button>
              <button onClick={() => nav(PROCUREMENT_ROUTE)} className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">{c.ctaProcurement} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Roi;
