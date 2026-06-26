import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { COST_ROUTE, LIFECYCLE_ROUTE, PROCUREMENT_ROUTE, PRICING_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

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
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">Operational model</p>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">
              Model the scale of governed publication.
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/60">
              Enter your institution's own figures. This estimator reflects the scale of activity those figures imply —
              it does <span className="text-white/85">not</span> promise savings. Dispatch does not reduce the judgement
              an official publication requires; it governs that work and removes the coordination and reconstruction
              effort around it. What you see below depends entirely on your own processes.
            </p>

            <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              {/* inputs */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-6 sm:p-7">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Your institution</div>
                <div className="mt-5 space-y-6">
                  <Field label="Official publications / year" value={v.publications} min={10} max={5000} step={10} onChange={set("publications")} />
                  <Field label="Reviewing offices / publication" hint="Legal, compliance, subject-matter offices that review before approval." value={v.reviewers} min={1} max={12} onChange={set("reviewers")} />
                  <Field label="Departments involved / publication" hint="Distinct departments a publication is handed between." value={v.departments} min={1} max={12} onChange={set("departments")} />
                  <Field label="Audits / evidence requests / year" value={v.audits} min={0} max={24} onChange={set("audits")} />
                  <div className="border-t border-white/[0.06] pt-6">
                    <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Your assumptions</div>
                    <div className="space-y-6">
                      <Field label="Hours per review touch" value={v.hoursPerReview} min={0.5} max={8} step={0.5} onChange={set("hoursPerReview")} suffix="h" />
                      <Field label="Coordination hours per hand-off" hint="Chasing, re-sending, reconciling versions between departments." value={v.coordPerHandoff} min={0} max={4} step={0.25} onChange={set("coordPerHandoff")} suffix="h" />
                      <Field label="Audit-assembly hours per publication" hint="Reconstructing the evidence trail for one publication, per audit." value={v.auditHoursPerPub} min={0} max={4} step={0.1} onChange={set("auditHoursPerPub")} suffix="h" />
                      <Field label="Blended staff cost / hour" value={v.hourlyCost} min={20} max={300} step={5} onChange={set("hourlyCost")} suffix={` ${v.currency}/h`} />
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <span className="text-[12px] text-white/45">Currency</span>
                      {["$", "€", "£"].map((c) => (
                        <button key={c} onClick={() => setV((s) => ({ ...s, currency: c }))}
                          className={`h-8 w-9 rounded border text-[14px] font-semibold transition ${v.currency === c ? "border-gold-400/50 bg-gold-400/10 text-gold-200" : "border-white/15 text-white/60 hover:border-white/30"}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => setV(DEFAULTS)} className="mt-6 text-[12px] font-semibold uppercase tracking-wide text-white/45 transition hover:text-white/70">Reset to example figures</button>
              </div>

              {/* outputs */}
              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Stat label="Permanent records / year" value={fmt(m.records)} sub="Each receives a permanent Record ID and integrity hash." />
                  <Stat label="Review touches / year" value={fmt(m.reviewTouches)} sub="Office-level reviews governed in policy order." />
                  <Stat label="Evidence chains / year" value={fmt(m.evidenceChains)} sub="Generated automatically — not assembled by hand." />
                  <Stat label="Governed effort / year" value={`${fmt(m.totalHours)} h`} sub={`≈ ${m.totalCost} at your blended rate.`} />
                </div>

                {/* the model split — judgement vs targeted waste */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Where the effort goes</div>
                  <div className="mt-4 space-y-3">
                    {[
                      ["Review & approval (judgement)", m.reviewHours, m.reviewCost, "Irreducible — Dispatch governs it, it does not remove it.", "bg-white/30"],
                      ["Coordination between departments", m.coordinationHours, `${v.currency}${fmt(m.coordinationHours * v.hourlyCost)}`, "Hand-off waste a governed workflow targets.", "bg-gold-400/70"],
                      ["Audit & evidence assembly", m.auditHours, `${v.currency}${fmt(m.auditHours * v.hourlyCost)}`, "Reconstruction a standing evidence chain targets.", "bg-gold-400/70"],
                    ].map(([label, hours, cost, note, bar]) => {
                      const pct = m.totalHours > 0 ? ((hours as number) / m.totalHours) * 100 : 0;
                      return (
                        <div key={label as string}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[13.5px] font-semibold text-white/85">{label as string}</span>
                            <span className="font-mono text-[12.5px] text-white/55">{fmt(hours as number)} h · {cost as string}</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                            <div className={`h-full rounded-full ${bar as string}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-1 text-[11.5px] text-white/40">{note as string}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 rounded-xl border border-gold-400/25 bg-gold-400/[0.05] p-4">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-300/80">Effort Dispatch targets</div>
                    <div className="mt-1 font-serif text-[1.6rem] font-bold text-gold-200">{fmt(m.targetedHours)} h <span className="text-[1rem] font-semibold text-white/55">/ year · ≈ {m.targetedCost}</span></div>
                    <div className="mt-1.5 text-[12.5px] leading-snug text-white/55">
                      About {m.targetedPct}% of governed effort in this model is coordination and reconstruction — the part a
                      single governed platform is designed to reduce. This is an illustrative reflection of your inputs, not a
                      committed saving.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* honest disclaimer */}
            <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.015] p-5 text-[12.5px] leading-relaxed text-white/45">
              <span className="font-semibold text-white/65">This is an illustrative operational model, not a quotation or a guarantee.</span>{" "}
              Every figure is derived only from the inputs and assumptions you provide, and real outcomes depend entirely on
              your institution's own processes, volumes and rates. Dispatch does not reduce the review or approval an official
              publication requires. No savings, ROI, payback or financial outcome is promised. Pricing is published separately
              on the <button onClick={() => nav(PRICING_ROUTE)} className="font-semibold text-gold-300 hover:underline">pricing page</button>.
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={() => nav(COST_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">The cost of publication</button>
              <button onClick={() => nav(LIFECYCLE_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">The governed lifecycle</button>
              <button onClick={() => nav(PROCUREMENT_ROUTE)} className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">Procurement center <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Roi;
