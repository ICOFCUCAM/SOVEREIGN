import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, FilmGrain, Chevron, useReveal, SURFACE } from "../components/brand";
import { VERIFY_ROUTE } from "../lib/routes";
import { useMarketing7Copy } from "../lib/messages";

// An interactive, clearly-illustrative walkthrough of a document becoming an
// Official Record — draft → governed approval chain → publication + permanent
// Record ID → Governance & Preservation certificates → evidence chain → public
// verification. Self-contained (no backend); the sample is fictional and labelled.

const RECORD = {
  recordId: "SD-2026-00004872",
  governanceHash: "9f2c4e1a…b71d0a37",
  preservationHash: "c08a55fe…2e9f41bb",
  retentionUntil: "2056",
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`${SURFACE} p-6 ${className}`}>{children}</div>
);

const Walkthrough: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  const c = useMarketing7Copy().walkthrough;
  const [step, setStep] = useState(0);
  const last = c.steps.length - 1;

  const body = (() => {
    switch (step) {
      case 0:
        return (
          <Card>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{c.draftLabel} · {c.sampleInstitution}</div>
            <div className="mt-2 font-serif text-[1.5rem] font-bold text-white">{c.sampleTitle}</div>
            <div className="mt-1 text-[13px] text-white/50">{c.sampleDocType}</div>
            <div className="mt-5 space-y-2">
              {c.draftSections.map((s) => (
                <div key={s} className="h-2 rounded bg-white/[0.06]" style={{ width: `${60 + (s.length % 4) * 10}%` }} aria-label={s} />
              ))}
            </div>
            <p className="mt-5 text-[13.5px] leading-relaxed text-white/55">{c.draftNote}</p>
          </Card>
        );
      case 1:
        return (
          <Card>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">{c.policyLabel}</div>
            <p className="mt-2 text-[14px] leading-relaxed text-white/65">{c.policyBody}</p>
            <div className="mt-5 space-y-2.5">
              {c.chain.map((ch, i) => (
                <div key={ch.office} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <span className="font-mono text-[12px] text-gold-400/70">{i + 1}</span>
                  <span className="text-[14px] font-semibold text-white">{ch.office}</span>
                  <span className="ml-auto text-[12px] uppercase tracking-wide text-white/40">{ch.act}</span>
                </div>
              ))}
            </div>
          </Card>
        );
      case 2:
        return (
          <Card>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">{c.approvedLabel}</div>
            <p className="mt-2 text-[14px] leading-relaxed text-white/65">{c.approvedBody}</p>
            <div className="mt-5 space-y-2.5">
              {c.chain.map((ch) => (
                <div key={ch.office} className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] text-emerald-300">✓</span>
                  <span className="text-[14px] font-semibold text-white">{ch.office}</span>
                  <span className="ml-auto text-[12px] uppercase tracking-wide text-emerald-300/80">{ch.act}</span>
                </div>
              ))}
            </div>
          </Card>
        );
      case 3:
        return (
          <Card className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">{c.publishedLabel}</div>
            <div className="mt-4 inline-block rounded-xl border border-gold-400/30 bg-gold-400/[0.06] px-6 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400/80">{c.recordIdLabel}</div>
              <div className="mt-1 font-mono text-[1.6rem] font-bold text-[#f4efe3]">{RECORD.recordId}</div>
            </div>
            <p className="mx-auto mt-5 max-w-md text-[13.5px] leading-relaxed text-white/55">{c.publishedBody}</p>
          </Card>
        );
      case 4:
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <div className="font-serif text-[1.2rem] font-bold text-white">{c.govCertTitle}</div>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">{c.govCertBody}</p>
              <div className="mt-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[11.5px] text-white/50">sha256 {RECORD.governanceHash}</div>
            </Card>
            <Card>
              <div className="font-serif text-[1.2rem] font-bold text-white">{c.presCertTitle}</div>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">{c.presCertBody.replace("{year}", RECORD.retentionUntil)}</p>
              <div className="mt-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[11.5px] text-white/50">sha256 {RECORD.preservationHash}</div>
            </Card>
          </div>
        );
      case 5:
        return (
          <Card>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">{c.evidenceLabel}</div>
            <ol className="mt-4 space-y-0">
              {c.evidence.map(({ t, d }, i) => (
                <li key={t} className="flex gap-3 border-l border-white/10 pl-4 pb-4 last:pb-0">
                  <span className="-ml-[21px] mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gold-400/70 ring-4 ring-[#070707]" />
                  <div>
                    <div className="text-[13.5px] font-semibold text-white">{String(i + 1).padStart(2, "0")} · {t}</div>
                    <div className="text-[12.5px] text-white/50">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[12.5px] text-white/40">{c.evidenceNote}</p>
          </Card>
        );
      default:
        return (
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.10] to-transparent p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">✓</span>
              <div>
                <div className="font-serif text-[1.25rem] font-bold text-white">{c.verifiedTitle}</div>
                <div className="text-[12.5px] text-white/50">{c.verifiedSub}</div>
              </div>
            </div>
            <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {[[c.fRecordId, RECORD.recordId], [c.fInstitution, c.sampleInstitution], [c.fStatus, "OFFICIAL"], [c.fIntegrityHash, `sha256 ${RECORD.preservationHash}`]].map(([k, v]) => (
                <div key={k} className="border-b border-white/[0.06] py-2">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">{k}</div>
                  <div className="mt-0.5 font-mono text-[13px] text-white/80">{v}</div>
                </div>
              ))}
            </div>
            <button onClick={() => nav(VERIFY_ROUTE)}
              className="group mt-6 inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              {c.ctaVerify} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        );
    }
  })();

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="officialrecord" alt="A sealed official record" />
      <main>
        <section className="border-t border-white/[0.06] px-8 py-16 lg:px-12">
          <div className="mx-auto max-w-[1000px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">{c.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">{c.title}</h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/60">{c.lead}</p>

            {/* step rail */}
            <div className="mt-10 flex flex-wrap gap-1.5">
              {c.steps.map((s, i) => (
                <button key={s.kicker} onClick={() => setStep(i)}
                  className={`h-1.5 flex-1 min-w-[28px] rounded-full transition ${i <= step ? "bg-gold-400/80" : "bg-white/10 hover:bg-white/20"}`}
                  aria-label={s.title} aria-current={i === step} />
              ))}
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.6fr]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-400">{c.steps[step].kicker}</div>
                <h2 className="mt-2 font-serif text-[1.7rem] font-bold leading-tight text-white">{c.steps[step].title}</h2>
                <div className="mt-6 flex items-center gap-3">
                  <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                    className="rounded border border-white/15 px-4 py-2 text-[12.5px] font-semibold uppercase tracking-wide text-white/80 transition enabled:hover:border-white/35 disabled:opacity-30">{c.back}</button>
                  {step < last ? (
                    <button onClick={() => setStep((s) => Math.min(last, s + 1))}
                      className="group inline-flex items-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2 text-[12.5px] font-bold uppercase tracking-wide text-[#1c1407] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                      {c.next} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </button>
                  ) : (
                    <button onClick={() => setStep(0)} className="rounded border border-white/15 px-4 py-2 text-[12.5px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/35">{c.replay}</button>
                  )}
                  <span className="ml-auto font-mono text-[12px] text-white/35">{step + 1}/{c.steps.length}</span>
                </div>
              </div>
              <div key={step} className="reveal in">{body}</div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Walkthrough;
