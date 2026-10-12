import React from "react";
import { useI18n } from "../lib/i18n";
import { LANDMASS } from "./ExchangeBlocks";

// THE EXCHANGE MAP — a full-width topology of the sale process (design
// exploration, HOMEPAGE.md Phase 8, after the owner's reference). Low-polygon
// continents (the same outlines as the coverage map) on a dashed survey grid;
// the eight lifecycle stages as ringed nodes joined by one route, with dotted
// cross-links. Illustrative, and labelled so; the stages and their typical
// weeks are the lifecycle the homepage already states. Locked palette: navy,
// blue light, the emerald signal.

const W = 1200, TOP = 30, H = 470;
const xy = (lon: number, lat: number): [number, number] => [((lon + 180) / 360) * W, ((90 - lat) / 180) * 600];

// stage, typical window, where the node sits (lon, lat), label side
const STAGES: ReadonlyArray<[string, string, number, number, "above" | "below"]> = [
  ["lc.signal", "d 0", -104, 46, "above"],
  ["lc.discovery", "wk 1", -62, -12, "below"],
  ["lc.nda", "wk 1–2", 6, 50, "above"],
  ["lc.cim", "wk 2", 20, 4, "below"],
  ["lc.meetings", "wk 2–3", 78, 56, "above"],
  ["lc.loi", "wk 4–6", 108, 30, "above"],
  ["lc.diligence", "wk 6–9", 76, 18, "below"],
  ["lc.closing", "wk 10+", 136, -26, "below"],
];
const P = STAGES.map(([, , lon, lat]) => xy(lon, lat));

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
const LINKS: ReadonlyArray<[number, number, number, "dot" | "dash"]> = [[0, 2, 70, "dot"], [1, 3, 30, "dash"], [2, 4, 60, "dot"], [3, 6, -40, "dash"], [4, 7, 40, "dot"], [1, 6, -80, "dot"]];

const STYLE = `
  @keyframes xmDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @keyframes xmPulse { 0%,100% { opacity: .35; } 50% { opacity: .9; } }
  @media (prefers-reduced-motion: no-preference) {
    .xm-route { stroke-dasharray: 1; animation: xmDraw 3.2s cubic-bezier(.4,0,.2,1) .2s both; }
    .xm-ring { animation: xmPulse 3.6s ease-in-out infinite; }
  }
`;

const ExchangeMap: React.FC = () => {
  const { t } = useI18n();
  // "d 0" → "day 0", "wk 1–2" → "wk 1–2" in the reader's language
  const fmtWk = (w: string): string => w.startsWith("d ") ? `${t("xm.day")} ${w.slice(2)}` : `${t("xm.wk")} ${w.slice(3)}`;
  return (
    <figure className="relative m-0 overflow-hidden border-y border-white/10" style={{ background: "linear-gradient(180deg,#05101f,#071a31 60%,#05101f)" }}>
      <style>{STYLE}</style>
      <svg viewBox={`0 ${TOP} ${W} ${H}`} className="block w-full" role="img" aria-label={t("lifecycle.title")}>
        <defs>
          <linearGradient id="xm-land" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#1f3a62" /><stop offset="1" stopColor="#0d213d" />
          </linearGradient>
          <linearGradient id="xm-route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#93c5fd" /><stop offset="0.6" stopColor="#60a5fa" /><stop offset="1" stopColor="#45E38A" />
          </linearGradient>
        </defs>
        {/* survey grid */}
        <g stroke="rgba(160,190,230,0.10)" strokeWidth="1">
          {Array.from({ length: 25 }, (_, i) => <line key={`v${i}`} x1={i * 50} y1={TOP} x2={i * 50} y2={TOP + H} />)}
          {Array.from({ length: 11 }, (_, i) => <line key={`h${i}`} x1={0} y1={TOP + i * 50} x2={W} y2={TOP + i * 50} />)}
        </g>
        <g stroke="rgba(160,190,230,0.22)" strokeWidth="1" strokeDasharray="4 6">
          {[300, 600, 900].map((x) => <line key={x} x1={x} y1={TOP} x2={x} y2={TOP + H} />)}
          {[170, 290, 400].map((y) => <line key={y} x1={0} y1={y} x2={W} y2={y} />)}
        </g>
        {/* low-polygon continents */}
        <g>
          {LANDMASS.map((poly, i) => (
            <polygon key={i} points={poly.map(([lon, lat]) => xy(lon, lat).join(",")).join(" ")} fill="url(#xm-land)" stroke="rgba(160,195,240,0.22)" strokeWidth="1" strokeLinejoin="round" />
          ))}
        </g>
        {/* cross-links */}
        <g fill="none" stroke="#93c5fd" strokeWidth="1.4" opacity="0.55">
          {LINKS.map(([a, b, lift, kind], i) => <path key={i} d={arc(P[a]!, P[b]!, lift)} strokeDasharray={kind === "dot" ? "1.5 5" : "6 6"} strokeLinecap="round" />)}
        </g>
        {/* the route, in stage order */}
        <path className="xm-route" d={route(P)} pathLength={1} fill="none" stroke="url(#xm-route)" strokeWidth="2.2" strokeLinecap="round" />
        {/* stages */}
        {STAGES.map(([key, wk, , , side], i) => {
          const [x, y] = P[i]!;
          const last = i === STAGES.length - 1;
          return (
            <g key={key}>
              <circle className="xm-ring" cx={x} cy={y} r="17" fill="none" stroke={last ? "#45E38A" : "#93c5fd"} strokeWidth="1" />
              <circle cx={x} cy={y} r="7.5" fill={last ? "#45E38A" : "#60a5fa"} stroke="#e8f1ff" strokeWidth="1.5" />
              <text x={x} y={side === "above" ? y - 42 : y + 40} textAnchor="middle" fill="#e8edf5" fontSize="12.5" letterSpacing="2.6" stroke="#05101f" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", textTransform: "uppercase" }}>
                {String(i + 1).padStart(2, "0")} · {t(key)}
              </text>
              <text x={x} y={side === "above" ? y - 26 : y + 56} textAnchor="middle" fill="#93c5fd" fontSize="11" letterSpacing="1.5" stroke="#05101f" strokeWidth="4" paintOrder="stroke" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{fmtWk(wk)}</text>
            </g>
          );
        })}
      </svg>
      {/* on a phone the map labels are too small to read: the stages as a list */}
      <ol className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/10 px-4 py-4 font-mono text-[10px] uppercase tracking-[0.14em] sm:hidden">
        {STAGES.map(([key, wk], i) => (
          <li key={key} className="text-white/85"><span className={i === STAGES.length - 1 ? "text-emerald-300" : "text-blue-300"}>{String(i + 1).padStart(2, "0")}</span> {t(key)} <span className="block normal-case tracking-normal text-blue-200/80">{fmtWk(wk)}</span></li>
        ))}
      </ol>

      {/* corner tag */}
      <div aria-hidden className="absolute right-6 top-6 hidden items-center sm:flex">
        <span className="border border-white/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/80">{t("xm.tag")}</span>
        <span className="h-[34px] w-[10px] bg-blue-600" />
      </div>
      {/* footer row */}
      <figcaption className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-4 font-mono text-[10px] uppercase tracking-[0.2em] sm:px-6">
        <span className="flex items-center gap-3 text-white/70"><span aria-hidden className="h-4 w-4 bg-blue-600" /><span className="text-blue-300">01</span> / {t("xm.discover")}</span>
        <span className="text-blue-200">{t("xm.note")}</span>
        <span className="text-white/70"><span className="text-blue-300">02</span> / {t("xm.trace")} <span aria-hidden>↓</span></span>
      </figcaption>
      <div aria-hidden className="h-1 bg-blue-600" />
    </figure>
  );
};

export default ExchangeMap;
