import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chevron, PublicHeader, PageBanner, PublicFooter, FilmGrain, useReveal } from "../components/brand";
import { TRUST_ROUTE, PROCUREMENT_ROUTE } from "../lib/routes";

// Institution Readiness Journey — an adoption accelerator. An evaluator names
// their institution and immediately receives a tailored starting point:
// deployment, governance, and policy recommendations, and where to go next.
// Editorial guidance grounded in the platform's real capabilities — a sales
// engineer's first conversation, on demand.
type Profile = { key: string; name: string; lede: string; deployment: string; governance: string; policy: string; records: string[] };
const PROFILES: Profile[] = [
  { key: "gov", name: "Government / Ministry", lede: "Cabinet-grade records under data-localisation mandates.",
    deployment: "Sovereign hosting or on-premise, in-jurisdiction", governance: "Multi-step ministerial chain — Director → Secretary General → Chief Secretary, with a communications publication authority",
    policy: "Distinct policies per record type with long retention and classification gating", records: ["Cabinet Memorandum", "Ministerial Report", "Policy Paper", "Regulatory Response"] },
  { key: "uni", name: "University", lede: "Senate decisions and academic records of permanent value.",
    deployment: "Private cloud in your tenancy", governance: "Senate governance with a Registrar publication authority",
    policy: "Resolution and report policies with permanent preservation", records: ["Academic Senate Resolution", "Board Report", "Research Dossier", "White Paper"] },
  { key: "hosp", name: "Hospital", lede: "Clinical directives that must be governed and auditable.",
    deployment: "Private cloud or on-premise, clinically isolated", governance: "Clinical governance with Medical Director approval",
    policy: "Directive policies with full audit retention", records: ["Clinical Directive", "Situation Report", "Risk Report", "Board Report"] },
  { key: "reg", name: "Regulator", lede: "Notices that are themselves legal evidence.",
    deployment: "Sovereign or managed, evidence-grade", governance: "Legal review chain with Commissioner authority",
    policy: "Notice policies with statutory retention schedules", records: ["Regulatory Notice", "Regulatory Response", "Policy Paper", "Audit Report"] },
  { key: "ent", name: "Enterprise", lede: "Board and executive records that demand provable governance.",
    deployment: "Managed or private cloud", governance: "Board / executive chain with a defined publishing authority",
    policy: "Board-resolution and compliance policies with audit retention", records: ["Board Report", "Strategic Memorandum", "Due Diligence Report", "Investor Update"] },
];

const ReadinessJourney: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  const [sel, setSel] = useState<Profile | null>(null);

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="default" alt="" />
      <main>
        <section className="border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">Readiness Journey</span></div>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.05] tracking-tight text-[#f4efe3] sm:text-5xl">Where does your institution begin?</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">Name your institution and receive a tailored starting point — deployment, governance and policy — in seconds.</p>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-8 py-16 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {PROFILES.map((p) => (
                <button key={p.key} onClick={() => setSel(p)}
                  className={`rounded-xl border p-5 text-left transition ${sel?.key === p.key ? "border-gold-400/60 bg-gold-400/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/30"}`}>
                  <div className="text-[14px] font-bold text-white">{p.name}</div>
                  <div className="mt-1 text-[11.5px] leading-snug text-white/45">{p.lede}</div>
                </button>
              ))}
            </div>

            {sel && (
              <div className="mt-8 rounded-2xl border border-gold-400/20 bg-gradient-to-b from-white/[0.03] to-transparent p-7 sm:p-9">
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-400">Recommended starting point · {sel.name}</div>
                <div className="mt-5 grid gap-6 sm:grid-cols-3">
                  {[["Deployment", sel.deployment], ["Governance", sel.governance], ["Policy", sel.policy]].map(([k, v]) => (
                    <div key={k}><div className="text-[11px] uppercase tracking-wide text-white/40">{k}</div><div className="mt-1 text-[14px] leading-relaxed text-white/80">{v}</div></div>
                  ))}
                </div>
                <div className="mt-6">
                  <div className="text-[11px] uppercase tracking-wide text-white/40">Record types to govern first</div>
                  <div className="mt-2 flex flex-wrap gap-2">{sel.records.map((r) => <span key={r} className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-[12.5px] text-white/70">{r}</span>)}</div>
                </div>
                <div className="mt-7 flex flex-wrap gap-3 border-t border-white/10 pt-6">
                  <button onClick={() => nav(PROCUREMENT_ROUTE)} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-black transition hover:bg-gold-300">Build the evaluation package <Chevron className="h-3.5 w-3.5" /></button>
                  <button onClick={() => nav(TRUST_ROUTE)} className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/70 transition hover:text-white">Why it's safe to adopt <Chevron className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )}
            {!sel && <p className="mt-8 text-center text-[13px] text-white/35">Select an institution type above to see its recommended starting point.</p>}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default ReadinessJourney;
