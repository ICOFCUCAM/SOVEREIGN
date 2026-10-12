import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { Note } from "./SourceNotes";

// THE EXCHANGE MAP — the acquisition lifecycle as a route (HOMEPAGE.md Phase 8,
// AA1, AA2): it is the homepage's one statement of the eight stages.
// After the owner's reference: a survey grid, ringed stage nodes on one route,
// dotted cross-links. The horizontal position is time: each of the eight
// lifecycle stages sits at its typical week, on a square-root scale so the
// crowded first weeks stay legible, with the week axis drawn along the foot.
// The vertical lanes only keep labels apart. No geography is implied.

const W = 1200, TOP = 30, H = 470;
const X0 = 80, X1 = 1110, WK_MAX = 10;
const wx = (wk: number): number => X0 + (Math.sqrt(wk) / Math.sqrt(WK_MAX)) * (X1 - X0);
const AXIS_Y = 478;
const TICKS = [0, 1, 2, 4, 6, 8, 10];

// colours: on paper (AA8, a printed chart) or on navy (the dark hero). The
// palette is the locked one, interchanged.
const PAPER = {
  ground: "#ffffff",
  grid: "rgba(10,16,24,0.06)", axis: "rgba(10,16,24,0.28)",
  link: "#2563eb", node: "#2563eb", end: "#059669", nodeEdge: "#ffffff",
  ring: "#2563eb", text: "#0a1018", sub: "#1d4ed8", halo: "#ffffff",
  routeA: "#1d4ed8", routeB: "#2563eb",
};
const NAVY = {
  ground: "linear-gradient(180deg,#05101f,#071a31 60%,#05101f)",
  grid: "rgba(160,190,230,0.08)", axis: "rgba(160,190,230,0.26)",
  link: "#93c5fd", node: "#60a5fa", end: "#45E38A", nodeEdge: "#e8f1ff",
  ring: "#93c5fd", text: "#e8edf5", sub: "#93c5fd", halo: "#05101f",
  routeA: "#93c5fd", routeB: "#60a5fa",
};
// class sets for the HTML parts of the figure
const K = {
  paper: { fig: "border border-ink-900", rule: "border-slate-300", li: "text-ink-900", n: "text-blue-700", end: "text-emerald-700", wk: "text-slate-600", tag: "border-ink-900 bg-white text-ink-900", cap: "text-slate-600" },
  navy: { fig: "border border-white/15", rule: "border-white/10", li: "text-white/85", n: "text-blue-300", end: "text-emerald-300", wk: "text-blue-200/80", tag: "border-white/30 text-white/80", cap: "text-blue-100/75" },
};

// stage, typical window (as shown), the week it is placed at, lane (y), label side
const STAGES: ReadonlyArray<[string, string, number, number, "above" | "below"]> = [
  ["lc.signal", "d 0", 0, 270, "above"],
  ["lc.discovery", "wk 1", 1, 410, "below"],
  ["lc.nda", "wk 1–2", 1.5, 150, "above"],
  ["lc.cim", "wk 2", 2, 310, "below"],
  ["lc.meetings", "wk 2–3", 2.5, 205, "below"],
  ["lc.loi", "wk 4–6", 5, 140, "above"],
  ["lc.diligence", "wk 6–9", 7.5, 360, "below"],
  ["lc.closing", "wk 10+", 10, 250, "below"],
];
// what ExitOS does at each stage, and the module that does it (interactive mode)
const STAGE_MODULE: Readonly<Record<string, string>> = {
  "lc.signal": "Acquisition Radar", "lc.discovery": "Buyer Intelligence", "lc.nda": "Access Requests", "lc.cim": "Documents",
  "lc.meetings": "Outreach", "lc.loi": "Negotiator", "lc.diligence": "Data Room", "lc.closing": "Closing Center",
};
const P = STAGES.map(([, , wk, y]) => [wx(wk), y] as [number, number]);

/** A smooth curve through the points (Catmull-Rom → cubic Bézier). */
const route = (pts: ReadonlyArray<[number, number]>): string => {
  let d = `M${pts[0]![0]},${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!, p1 = pts[i]!, p2 = pts[i + 1]!, p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 5, p1[1] + (p2[1] - p0[1]) / 5], c2 = [p2[0] - (p3[0] - p1[0]) / 5, p2[1] - (p3[1] - p1[1]) / 5];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
};
const arc = (a: [number, number], b: [number, number], lift: number): string =>
  `M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${Math.min(a[1], b[1]) - lift} ${b[0]},${b[1]}`;
const LINKS: ReadonlyArray<[number, number, number, "dot" | "dash"]> = [[0, 2, 60, "dot"], [1, 3, 30, "dash"], [2, 5, 40, "dot"], [3, 6, -30, "dash"], [4, 7, 30, "dot"]];

const STYLE = `
  @keyframes xmDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @keyframes xmPulse { 0%,100% { opacity: .35; } 50% { opacity: .9; } }
  @media (prefers-reduced-motion: no-preference) {
    .xm-route { stroke-dasharray: 1; animation: xmDraw 3.2s cubic-bezier(.4,0,.2,1) .2s both; }
    .xm-ring { animation: xmPulse 3.6s ease-in-out infinite; }
  }
  .xm-stage:focus-visible circle:nth-of-type(1) { stroke: #2563eb; stroke-width: 3; }
`;
const MONO = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" };

const ExchangeMap: React.FC<{ dark?: boolean; interactive?: boolean }> = ({ dark, interactive }) => {
  const { t } = useI18n();
  const [sel, setSel] = useState(0);
  const pick = (i: number) => (e: React.KeyboardEvent | React.MouseEvent): void => {
    if ("key" in e && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault(); setSel(i);
  };
  const C = dark ? NAVY : PAPER, k = dark ? K.navy : K.paper;
  // "d 0" → "day 0", "wk 1–2" → "wk 1–2" in the reader's language
  const fmtWk = (w: string): string => w.startsWith("d ") ? `${t("xm.day")} ${w.slice(2)}` : `${t("xm.wk")} ${w.slice(3)}`;
  return (
    <figure className={`relative m-0 overflow-hidden ${k.fig}`} style={{ background: C.ground }}>
      <style>{STYLE}</style>
      <svg viewBox={`0 ${TOP} ${W} ${H + 30}`} className="block w-full" role={interactive ? "group" : "img"} aria-label={t("lifecycle.title")}>
        <defs>
          <linearGradient id="xm-route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={C.routeA} /><stop offset="0.6" stopColor={C.routeB} /><stop offset="1" stopColor={C.end} />
          </linearGradient>
        </defs>
        {/* survey grid */}
        <g stroke={C.grid} strokeWidth="1">
          {Array.from({ length: 25 }, (_, i) => <line key={`v${i}`} x1={i * 50} y1={TOP} x2={i * 50} y2={AXIS_Y} />)}
          {Array.from({ length: 10 }, (_, i) => <line key={`h${i}`} x1={0} y1={TOP + i * 50} x2={W} y2={TOP + i * 50} />)}
        </g>
        {/* the week axis: dashed verticals at the ticks, labels along the foot */}
        <g stroke={C.axis} strokeWidth="1" strokeDasharray="4 6">
          {TICKS.map((wk) => <line key={wk} x1={wx(wk)} y1={TOP} x2={wx(wk)} y2={AXIS_Y} />)}
        </g>
        <line x1={0} y1={AXIS_Y} x2={W} y2={AXIS_Y} stroke={C.axis} strokeWidth="1" />
        <g fill={C.sub} fontSize="11" letterSpacing="1.5" style={MONO}>
          {TICKS.map((wk) => <text key={wk} x={wx(wk)} y={AXIS_Y + 18} textAnchor="middle">{wk === 0 ? `${t("xm.wk")} 0` : wk}</text>)}
        </g>
        {/* cross-links */}
        <g fill="none" stroke={C.link} strokeWidth="1.4" opacity="0.45">
          {LINKS.map(([a, b, lift, kind], i) => <path key={i} d={arc(P[a]!, P[b]!, lift)} strokeDasharray={kind === "dot" ? "1.5 5" : "6 6"} strokeLinecap="round" />)}
        </g>
        {/* the route, in stage order */}
        <path className="xm-route" d={route(P)} pathLength={1} fill="none" stroke="url(#xm-route)" strokeWidth="2.2" strokeLinecap="round" />
        {/* stages */}
        {STAGES.map(([key, wk, , , side], i) => {
          const [x, y] = P[i]!;
          const last = i === STAGES.length - 1;
          return (
            <g key={key} {...(interactive ? { role: "button", tabIndex: 0, "aria-pressed": sel === i, "aria-label": `${t(key)}, ${fmtWk(wk)}`, onClick: pick(i), onKeyDown: pick(i), className: "xm-stage cursor-pointer outline-none" } : {})}>
              {interactive && <circle cx={x} cy={y} r="30" fill="transparent" />}
              {interactive && sel === i && <circle cx={x} cy={y} r="24" fill="none" stroke={last ? C.end : C.ring} strokeWidth="2" />}
              <circle className="xm-ring" cx={x} cy={y} r="17" fill="none" stroke={last ? C.end : C.ring} strokeWidth="1" />
              <circle cx={x} cy={y} r="7.5" fill={last ? C.end : C.node} stroke={C.nodeEdge} strokeWidth="1.5" />
              <text x={x} y={side === "above" ? y - 42 : y + 40} textAnchor="middle" fill={C.text} fontSize="12.5" letterSpacing="2.6" stroke={C.halo} strokeWidth="5" paintOrder="stroke" strokeLinejoin="round" style={{ ...MONO, textTransform: "uppercase" }}>
                {String(i + 1).padStart(2, "0")} · {t(key)}
              </text>
              <text x={x} y={side === "above" ? y - 26 : y + 56} textAnchor="middle" fill={C.sub} fontSize="11" letterSpacing="1.5" stroke={C.halo} strokeWidth="4" paintOrder="stroke" style={MONO}>{fmtWk(wk)}</text>
            </g>
          );
        })}
      </svg>
      {/* on a phone the map labels are too small to read: the stages as a list */}
      <ol className={`grid grid-cols-2 gap-x-4 gap-y-2 border-t ${k.rule} px-4 py-4 font-mono text-[10px] uppercase tracking-[0.14em] sm:hidden`}>
        {STAGES.map(([key, wk], i) => {
          const body = <><span className={i === STAGES.length - 1 ? k.end : k.n}>{String(i + 1).padStart(2, "0")}</span> {t(key)} <span className={`block normal-case tracking-normal ${k.wk}`}>{fmtWk(wk)}</span></>;
          return (
            <li key={key} className={k.li}>
              {interactive
                ? <button type="button" aria-pressed={sel === i} onClick={() => setSel(i)} className={`w-full text-left uppercase ${sel === i ? "underline decoration-2 underline-offset-4" : ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}>{body}</button>
                : body}
            </li>
          );
        })}
      </ol>
      {/* the selected stage: what happens, and the module that runs it */}
      {interactive && (() => {
        const [key, wk] = STAGES[sel]!;
        return (
          <div aria-live="polite" className={`grid gap-3 border-t ${k.rule} px-4 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:px-6`}>
            <div className={`font-mono text-[11px] uppercase tracking-[0.18em] ${k.n}`}>{String(sel + 1).padStart(2, "0")} · {t(key)} <span className={k.wk}>· {fmtWk(wk)}</span></div>
            <p className={`text-[15px] leading-relaxed ${dark ? "text-blue-50/90" : "text-ink-800"}`}>{t(key.replace("lc.", "lcd."))}</p>
            <Link to="/modules" className={`inline-flex items-center gap-3 whitespace-nowrap border px-4 py-2.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${dark ? "border-white/50 text-white hover:bg-white hover:text-ink-900" : "border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white"}`}>
              {STAGE_MODULE[key]} <span aria-hidden>→</span>
            </Link>
          </div>
        );
      })()}

      {/* corner tag */}
      <div aria-hidden className="absolute right-6 top-6 hidden items-center sm:flex">
        <span className={`border ${k.tag} px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em]`}>{t("xm.tag")}</span>
        <span className="h-[34px] w-[10px] bg-blue-600" />
      </div>
      {/* footer row */}
      <figcaption className={`relative flex items-center gap-3 border-t ${k.rule} ${k.cap} px-4 py-4 font-mono text-[10px] uppercase tracking-[0.2em] sm:px-6`}>
        <span aria-hidden className="h-4 w-4 shrink-0 bg-blue-600" /><span>{t("lifecycle.title")} · {t("lifecycle.live")}<Note n={6} first dark={dark} /></span>
      </figcaption>
      <div aria-hidden className="h-1 bg-blue-600" />
    </figure>
  );
};

export default ExchangeMap;
