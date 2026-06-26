import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chevron } from "./brand";
import { LIFECYCLE_ROUTE } from "../lib/routes";

// THE SIGNATURE MOMENT. A self-running, interactive visualisation of one document
// travelling the governed path from an ordinary draft to a permanent, verifiable
// Official Record. It starts itself when scrolled into view, advances on its own,
// and can be driven by hand. This is the section the homepage is remembered for —
// it shows, rather than explains, what Sovereign Dispatch does.

interface Node {
  label: string;
  caption: string;     // the line shown while this stage is active
  kind?: "id" | "seal" | "verify"; // a special reveal at this stage
}

const NODES: Node[] = [
  { label: "Draft", caption: "An ordinary document. At this point it carries no authority." },
  { label: "Legal Review", caption: "The legal office records its review — in order, on the record." },
  { label: "Committee", caption: "Reviewing offices sign, each act attributable to a named authority." },
  { label: "Executive Approval", caption: "The institution decides: this becomes its official position." },
  { label: "Publication", caption: "A permanent Record ID is allocated — never reused.", kind: "id" },
  { label: "Certification", caption: "Governance and Preservation certificates are sealed to the record.", kind: "seal" },
  { label: "Verification", caption: "Anyone, anywhere, can confirm it is genuine — with no account.", kind: "verify" },
  { label: "Permanent Archive", caption: "Sealed for its retention horizon. Provable for decades." },
];

const LAST = NODES.length - 1;
const RECORD_ID = "SD-2026-00004872";

export const GovernedJourney: React.FC = () => {
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(false);   // running on its own
  const [seen, setSeen] = useState(false);   // entered view at least once

  // Start the journey the first time it scrolls into view; honour reduced motion.
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

  // Auto-advance while running; loops back to the start and pauses a beat at the end.
  useEffect(() => {
    if (!auto) return;
    const atEnd = active >= LAST;
    const t = setTimeout(() => setActive((a) => (a >= LAST ? 0 : a + 1)), atEnd ? 2600 : 1500);
    return () => clearTimeout(t);
  }, [auto, active]);

  const pct = (active / LAST) * 100;
  const node = NODES[active];

  return (
    <section ref={ref} className="relative overflow-hidden border-y border-white/[0.06] bg-[#070707] px-6 py-24 lg:px-12">
      {/* a soft gold horizon, brighter as the record nears the end */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_18%,rgba(233,200,120,0.07),transparent_70%)]" aria-hidden />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400">The governed journey</div>
          <h2 className="mx-auto mt-4 max-w-3xl font-serif text-[2.3rem] font-bold leading-[1.06] tracking-tight text-[#f4efe3] sm:text-[3.1rem]">
            Watch a document<br className="hidden sm:block" /> become an institution's word.
          </h2>
        </div>

        {/* the live stage — a large, changing statement */}
        <div className="mx-auto mt-14 max-w-2xl text-center">
          <div className="font-mono text-[12px] tracking-[0.3em] text-gold-400/70">{String(active + 1).padStart(2, "0")} / 08</div>
          <div key={active} className="reveal in mt-3">
            <div className="font-serif text-[1.9rem] font-bold leading-tight text-white sm:text-[2.3rem]">{node.label}</div>
            <p className="mx-auto mt-3 min-h-[3rem] max-w-xl text-[15.5px] leading-relaxed text-white/60">{node.caption}</p>
            {/* a stage-specific reveal */}
            <div className="mt-4 flex h-9 items-center justify-center">
              {node.kind === "id" && (
                <span className="rounded-md border border-gold-400/40 bg-gold-400/[0.07] px-4 py-1.5 font-mono text-[15px] font-bold tracking-wide text-[#f4efe3]">{RECORD_ID}</span>
              )}
              {node.kind === "seal" && (
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-gold-300">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-400/40 text-[12px]">✸</span>
                  Governance · Preservation
                </span>
              )}
              {node.kind === "verify" && (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-[13px] font-semibold text-emerald-300">
                  <span className="text-[14px]">✓</span> Verified — Official Record
                </span>
              )}
            </div>
          </div>
        </div>

        {/* the rail — a filling line with a travelling record token */}
        <div className="relative mx-auto mt-12 max-w-[1000px] px-2">
          <div className="relative h-px w-full bg-white/12">
            <div className="absolute left-0 top-0 h-px bg-gradient-to-r from-gold-500/40 via-gold-400 to-gold-300 transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
            {/* travelling token */}
            <div className="absolute top-0 z-10 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700 ease-out" style={{ left: `${pct}%` }}>
              <span className="block h-3.5 w-3.5 rounded-full bg-gold-300 shadow-[0_0_0_4px_rgba(233,200,120,0.18),0_0_22px_4px_rgba(233,200,120,0.45)]" />
            </div>
            {/* nodes */}
            {NODES.map((n, i) => (
              <button key={n.label} onClick={() => { setAuto(false); setActive(i); }}
                aria-label={n.label} aria-current={i === active}
                className="group absolute top-0 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(i / LAST) * 100}%` }}>
                <span className={`block rounded-full transition-all duration-500 ${i <= active ? "h-2.5 w-2.5 bg-gold-300" : "h-2 w-2 bg-white/25 group-hover:bg-white/50"}`} />
              </button>
            ))}
          </div>
          {/* labels — full set on desktop, restrained on mobile */}
          <div className="mt-6 hidden justify-between sm:flex">
            {NODES.map((n, i) => (
              <button key={n.label} onClick={() => { setAuto(false); setActive(i); }}
                className={`w-[12%] text-center text-[10.5px] font-semibold uppercase leading-tight tracking-wide transition ${i === active ? "text-gold-300" : "text-white/35 hover:text-white/60"}`}>
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
          <button onClick={() => nav(LIFECYCLE_ROUTE)}
            className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
            Walk every stage <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
          <button onClick={() => { setAuto((v) => !v); }}
            className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-white/45 transition hover:text-white/75">
            {auto ? "Pause" : "Play"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default GovernedJourney;
