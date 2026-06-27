import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chevron } from "./brand";
import { LIFECYCLE_ROUTE } from "../lib/routes";

// THE SIGNATURE MOMENT. Not a diagram — a document you watch become official.
// A plain draft accrues review ticks and a signature, sheds its DRAFT watermark,
// is stamped with a permanent Record ID, sealed with a wax certificate, verified,
// and finally archived — all in one self-running, scrubbable, reduced-motion-safe
// experience. This is what an executive remembers after they leave the site.

const DOC = {
  institution: "Ministry of Health",
  docType: "Executive Policy Briefing",
  title: "National Childhood Immunisation Policy",
  recordId: "SD-2026-00004872",
  retention: "2056",
};

const STAGES: { k: string; cap: string }[] = [
  { k: "Draft", cap: "An ordinary document. At this point it carries no authority." },
  { k: "Governance", cap: "Its approval policy resolves — the offices that must act, in order." },
  { k: "Approval", cap: "Each office signs, in sequence. Every approval is attributable." },
  { k: "Authorization", cap: "A senior authority authorizes the record for publication." },
  { k: "Publication", cap: "Published. A permanent Record ID is allocated — never reused." },
  { k: "Certification", cap: "Governance and Preservation certificates are sealed to the record." },
  { k: "Verification", cap: "Anyone can confirm it is genuine, unrevoked and untampered." },
  { k: "Preservation", cap: "Sealed for its retention horizon. Provable for decades." },
];
const LAST = STAGES.length - 1;
const OFFICES = ["Legal Counsel", "Compliance", "Director of Public Health"];

// One body line of the "document" — a skeleton bar.
const Bar: React.FC<{ w: string; dim?: boolean }> = ({ w, dim }) => (
  <div className={`h-1.5 rounded-full ${dim ? "bg-[#1c1a14]/10" : "bg-[#1c1a14]/20"}`} style={{ width: w }} />
);

// The living document. Everything it gains is cumulative and keyed to `a` (the
// active stage) so crossing each threshold animates that element into place.
const LiveDocument: React.FC<{ a: number }> = ({ a }) => {
  const inGov = a >= 1, approved = a >= 2, authorized = a >= 3, published = a >= 4,
    certified = a >= 5, verified = a >= 6, preserved = a >= 7;
  return (
    <div className="relative mx-auto w-full max-w-[330px] [perspective:1400px]">
      {/* verified badge — floats above the page */}
      <div className={`absolute -top-3 left-1/2 z-30 -translate-x-1/2 transition-all duration-500 ${verified ? "sd-pop" : "pointer-events-none opacity-0"}`}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-[#0c1a12] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.8)]">
          <span className="text-[12px]">✓</span> Verified · Official
        </span>
      </div>

      {/* the page */}
      <div
        className={`relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-b from-[#f8f4ec] to-[#eae2d0] p-5 ring-1 transition-[box-shadow,transform] duration-700 ${published ? "ring-gold-500/50" : "ring-black/10"} ${published ? "sd-breathe" : "shadow-[0_28px_70px_-34px_rgba(0,0,0,0.8)]"}`}
        style={{ transform: published ? "rotateZ(0deg)" : "rotateZ(-1.4deg)" }}
      >
        {/* status corner */}
        <div className={`absolute right-0 top-0 z-10 px-3 py-1 text-[8.5px] font-bold uppercase tracking-[0.16em] transition-colors duration-500 ${published ? "bg-gold-400/90 text-[#1c1407]" : inGov ? "bg-[#1c1a14]/8 text-[#6b6450]" : "bg-transparent text-transparent"}`}>
          {published ? "Official Record" : inGov ? "In Governance" : ""}
        </div>

        {/* header */}
        <div className="text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#9a824a]">{DOC.institution}</div>
        <div className="mt-1 max-w-[88%] font-serif text-[13.5px] font-bold leading-tight text-[#1c1a14]">{DOC.title}</div>
        <div className="mt-0.5 text-[8.5px] uppercase tracking-wide text-[#6b6450]">{DOC.docType}</div>

        {/* body */}
        <div className="mt-3.5 space-y-1.5">
          <Bar w="100%" /><Bar w="92%" /><Bar w="97%" dim /><Bar w="60%" dim />
        </div>

        {/* office review row — appears in governance, ticks fill through approval */}
        <div className={`mt-3.5 space-y-1 transition-opacity duration-500 ${inGov ? "opacity-100" : "opacity-0"}`}>
          {OFFICES.map((o, i) => {
            const done = approved && (a >= 2 + Math.max(0, i - 1)); // fill in sequence
            return (
              <div key={o} className="flex items-center gap-1.5">
                <span className={`flex h-3 w-3 items-center justify-center rounded-full text-[7px] transition-all duration-300 ${done ? "bg-emerald-500/85 text-white" : "border border-[#1c1a14]/25 text-transparent"}`}>✓</span>
                <span className="text-[8.5px] font-medium text-[#5c5640]">{o}</span>
              </div>
            );
          })}
        </div>

        {/* signature — draws itself in at approval */}
        <div className={`absolute bottom-12 left-5 transition-opacity duration-500 ${approved ? "opacity-100" : "opacity-0"}`}>
          <svg viewBox="0 0 120 36" className="h-9 w-28 text-[#23314e]" fill="none">
            <path className={approved ? "sd-ink" : ""} style={{ ["--sd-len" as string]: "200" }}
              d="M4 26c8-2 10-18 14-18s2 22 8 22 8-26 14-26 2 20 8 20 10-12 16-12 8 6 14 4 12-8 16-8"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="-mt-1 h-px w-28 bg-[#1c1a14]/30" />
          <div className="mt-1 text-[7.5px] uppercase tracking-wide text-[#6b6450]">Approving authority</div>
        </div>

        {/* executive authorization seal (monogram) */}
        <div className={`absolute bottom-12 right-5 transition-all duration-500 ${authorized ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#23314e]/60 text-[#23314e]">
            <span className="font-serif text-[10px] font-bold leading-none">SD<br />◆</span>
          </div>
          <div className="mt-1 text-center text-[7px] uppercase tracking-wide text-[#6b6450]">Authorized</div>
        </div>

        {/* Record ID — stamped on at publication */}
        <div className={`absolute bottom-4 left-5 right-5 ${published ? "sd-stamp" : "opacity-0"}`} style={{ ["--sd-rot" as string]: "-1.5deg" }}>
          <div className="flex items-center justify-between rounded border border-gold-600/60 bg-gold-400/15 px-2.5 py-1.5">
            <span className="text-[7.5px] font-bold uppercase tracking-[0.12em] text-[#8a6a1e]">Permanent Record ID</span>
            <span className="font-mono text-[11px] font-bold tracking-wide text-[#1c1407]">{DOC.recordId}</span>
          </div>
        </div>

        {/* DRAFT watermark — fades away the moment it is published */}
        <div className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-700 ${published ? "opacity-0" : "opacity-100"}`}>
          <span className="-rotate-[24deg] font-serif text-[3.4rem] font-black uppercase tracking-tight text-[#1c1a14]/[0.07]">Draft</span>
        </div>

        {/* certification — wax seal pressed at the corner */}
        <div className={`absolute -bottom-3 -right-3 z-20 ${certified ? "sd-stamp" : "opacity-0"}`} style={{ ["--sd-rot" as string]: "-6deg" }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[radial-gradient(circle_at_38%_32%,#e7c876,#b8862f_60%,#8a5e1d)] shadow-[0_8px_18px_-6px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,255,255,0.45)]">
            <svg viewBox="0 0 32 32" className="h-7 w-7 text-[#5a3d12]" fill="none"><path d="M16 3l11 4v8c0 7-4.7 12-11 14-6.3-2-11-7-11-14V7z" stroke="currentColor" strokeWidth="1.6" /><path d="M11 16l4 4 7-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>

        {/* preservation seal — the record is locked into the archive */}
        <div className={`absolute inset-0 z-10 rounded-lg ring-1 ring-inset transition-all duration-700 ${preserved ? "ring-gold-500/40" : "ring-transparent"}`} aria-hidden />
      </div>

      {/* certificate chips + preservation footer, beneath the page */}
      <div className="mt-3 flex min-h-[1.75rem] flex-wrap items-center justify-center gap-2">
        {certified && ["Governance", "Preservation"].map((c) => (
          <span key={c} className="sd-pop inline-flex items-center gap-1 rounded-full border border-gold-400/30 bg-gold-400/[0.08] px-2.5 py-0.5 text-[10px] font-semibold text-gold-200">
            <span className="text-emerald-300">✓</span>{c} Certificate
          </span>
        ))}
        {preserved && (
          <span className="sd-pop inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-white/65">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-gold-300" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            Preserved until {DOC.retention}
          </span>
        )}
      </div>
    </div>
  );
};

export const GovernedJourney: React.FC = () => {
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setActive(LAST); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting && !seen) { setSeen(true); setAuto(true); } });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  useEffect(() => {
    if (!auto) return;
    const atEnd = active >= LAST;
    const t = setTimeout(() => setActive((x) => (x >= LAST ? 0 : x + 1)), atEnd ? 3000 : 1900);
    return () => clearTimeout(t);
  }, [auto, active]);

  const pct = (active / LAST) * 100;
  const stage = STAGES[active];

  return (
    <section ref={ref} className="relative overflow-hidden border-y border-white/[0.06] bg-[#070707] px-6 py-20 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_30%,rgba(233,200,120,0.08),transparent_72%)]" aria-hidden />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400">The governed journey</div>
          <h2 className="mx-auto mt-4 max-w-3xl font-serif text-[2.3rem] font-bold leading-[1.06] tracking-tight text-[#f4efe3] sm:text-[3.1rem]">
            Watch a draft become<br className="hidden sm:block" /> institutional authority.
          </h2>
        </div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1fr_minmax(300px,360px)] lg:gap-16">
          {/* narrative + controls */}
          <div className="order-2 lg:order-1">
            <div className="font-mono text-[12px] tracking-[0.3em] text-gold-400/70">{String(active + 1).padStart(2, "0")} / 08</div>
            <h3 key={active} className="reveal in mt-3 font-serif text-[2rem] font-bold leading-tight text-white sm:text-[2.5rem]">{stage.k}</h3>
            <p key={`c${active}`} className="reveal in mt-4 min-h-[3.5rem] max-w-md text-[15.5px] leading-relaxed text-white/60">{stage.cap}</p>

            <div className="mt-7 flex items-center gap-3">
              <button onClick={() => { setAuto(false); setActive((x) => Math.max(0, x - 1)); }} disabled={active === 0}
                className="rounded border border-white/15 px-4 py-2 text-[12.5px] font-semibold uppercase tracking-wide text-white/80 transition enabled:hover:border-white/35 disabled:opacity-30">Back</button>
              <button onClick={() => { setAuto(false); setActive((x) => Math.min(LAST, x + 1)); }} disabled={active === LAST}
                className="group inline-flex items-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2 text-[12.5px] font-bold uppercase tracking-wide text-[#1c1407] transition active:translate-y-px enabled:hover:from-gold-200 enabled:hover:to-gold-500 disabled:opacity-40">
                Next <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => setAuto((v) => !v)} className="ml-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45 transition hover:text-white/75">{auto ? "Pause" : "Play"}</button>
            </div>

            {/* the rail */}
            <div className="relative mt-9 h-px w-full max-w-md bg-white/12">
              <div className="absolute left-0 top-0 h-px bg-gradient-to-r from-gold-500/40 via-gold-400 to-gold-300 transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
              {STAGES.map((s, i) => (
                <button key={s.k} onClick={() => { setAuto(false); setActive(i); }} aria-label={s.k} aria-current={i === active}
                  className="group absolute top-0 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(i / LAST) * 100}%` }}>
                  <span className={`block rounded-full transition-all duration-500 ${i <= active ? "h-2.5 w-2.5 bg-gold-300" : "h-2 w-2 bg-white/25 group-hover:bg-white/50"}`} />
                </button>
              ))}
            </div>
            <div className="mt-4 flex max-w-md flex-wrap gap-x-3 gap-y-1">
              {STAGES.map((s, i) => (
                <button key={s.k} onClick={() => { setAuto(false); setActive(i); }}
                  className={`text-[10px] font-semibold uppercase tracking-wide transition ${i === active ? "text-gold-300" : "text-white/30 hover:text-white/55"}`}>{s.k}</button>
              ))}
            </div>

            <button onClick={() => nav(LIFECYCLE_ROUTE)}
              className="group mt-9 inline-flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-wide text-gold-400 transition hover:text-gold-300">
              Walk every stage in detail <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* the living document — the star */}
          <div className="order-1 lg:order-2">
            <LiveDocument a={active} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default GovernedJourney;
