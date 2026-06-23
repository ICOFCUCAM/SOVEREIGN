import React from "react";

// Crisp overlay over the canvas network. Institution labels sit ON TOP of the
// incoming mesh; the pipeline uses phase-based spacing (Submit·Govern·Approve
// tight = governance, then wider = production/publication); gold intensity rises
// left→right; the Official Record is a dominant seal in concentric authority
// rings. viewBox is wide enough to fit-to-width, so Submit lands at the canvas
// nexus (x≈0.264 of the panel).

const GOLD = "#e9c878";
const BRIGHT = "#ffe7ad";
const WHITE_DIM = "rgba(255,255,255,0.55)";
const CY = 480;
const INST_CX = 40;                          // institutions moved further left — long mesh travel
const INST: { label: string; y: number }[] = [
  { label: "MINISTRIES", y: 264 }, { label: "UNIVERSITIES", y: 372 }, { label: "HOSPITALS", y: 480 },
  { label: "AGENCIES", y: 588 }, { label: "AUTHORITIES", y: 696 },
];
// pipeline shifted right to open a longer mesh-travel zone before Submit
const SX = [470, 572, 674, 792, 910, 1028];
const TILE = 78;
const SEAL = { x: 1200, y: CY, r: 72 };      // Official Record reduced ~22%
const STAGES = ["SUBMIT", "GOVERN", "APPROVE", "RENDER", "PUBLISH", "ARCHIVE"];
// 11 thin precise authority rings
const RINGS = [78, 86, 94, 102, 110, 118, 126, 134, 142, 150, 158];

const ICON: Record<string, React.ReactNode> = {
  MINISTRIES: <path d="M4 9l8-5 8 5M5 9v8m4-8v8m6-8v8m4-8v8M3 20h18" />,
  UNIVERSITIES: (<><path d="M2 8l10-4 10 4-10 4L2 8z" /><path d="M6 10v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" /></>),
  HOSPITALS: (<><rect x="5" y="4" width="14" height="16" rx="1.5" /><path d="M12 8v6m-3-3h6" /></>),
  AGENCIES: <path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C8 19 5 15.6 5 11V5.5L12 3z" />,
  AUTHORITIES: (<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14 0 17M12 3.5c-2.5 2.5-2.5 14 0 17" /></>),
  SUBMIT: (<><path d="M7 3h7l4 4v14H7V3z" /><path d="M14 3v4h4" /></>),
  GOVERN: (<><circle cx="9" cy="9" r="3" /><path d="M3.5 19a5.5 5.5 0 0111 0M16 7a3 3 0 010 6m4.5 6a5.5 5.5 0 00-4-5.3" /></>),
  APPROVE: (<><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>),
  RENDER: (<><path d="M8 4H5v3m11-3h3v3M8 20H5v-3m11 3h3v-3" /><rect x="9" y="9" width="6" height="6" rx="1" /></>),
  PUBLISH: (<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14 0 17M12 3.5c-2.5 2.5-2.5 14 0 17" /></>),
  ARCHIVE: (<><rect x="4" y="6" width="16" height="4" rx="1" /><path d="M5 10v9h14v-9M10 14h4" /></>),
  SEAL: (<><path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C8 19 5 15.6 5 11V5.5L12 3z" /><path d="M9 12l2 2 4-4" /></>),
};
const Glyph: React.FC<{ name: string; x: number; y: number; s?: number; color?: string; sw?: number }> = ({ name, x, y, s = 1, color = GOLD, sw = 1.6 }) => (
  <g transform={`translate(${x - 12 * s} ${y - 12 * s}) scale(${s})`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{ICON[name]}</g>
);

export const HeroVisual: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 1440 960" preserveAspectRatio="xMidYMid meet" aria-hidden className={className}>
    <defs>
      <filter id="hv-bloom" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="11" /></filter>
      <radialGradient id="hv-seal" cx="0.5" cy="0.4" r="0.62">
        <stop offset="0" stopColor={BRIGHT} stopOpacity="0.95" />
        <stop offset="0.7" stopColor={GOLD} stopOpacity="0.85" />
        <stop offset="1" stopColor="#b6873a" stopOpacity="0.8" />
      </radialGradient>
    </defs>

    {/* institutions — WHITE icons in gold rings, with a long lane line toward the workflow */}
    {INST.map((it) => (
      <g key={it.label}>
        {/* institution lane: the true source path — runs well into the travel zone */}
        <line x1={INST_CX + 30} y1={it.y} x2={INST_CX + 150} y2={it.y} stroke="rgba(233,200,120,0.22)" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx={INST_CX} cy={it.y} r="29" fill="#0c0c0c" fillOpacity="0.55" stroke="rgba(233,200,120,0.5)" strokeWidth="1.2" />
        <Glyph name={it.label} x={INST_CX} y={it.y} s={1.2} color={BRIGHT} />
        <text x={INST_CX + 46} y={it.y + 5} fontSize="15" fontWeight="600" letterSpacing="1.5" fill="rgba(255,255,255,0.9)" style={{ fontFamily: "inherit" }}>{it.label}</text>
      </g>
    ))}

    {/* continuous governance energy chain (●──●──●), not isolated boxes */}
    <line x1={SX[0]} y1={CY} x2={SEAL.x - SEAL.r} y2={CY} stroke={GOLD} strokeWidth="2" opacity="0.16" filter="url(#hv-bloom)" />
    {SX.slice(0, -1).map((x, i) => (
      <line key={`beam${i}`} x1={x + TILE / 2} y1={CY} x2={SX[i + 1] - TILE / 2} y2={CY} stroke={GOLD} strokeWidth="3" strokeLinecap="round" opacity={0.16 + i * 0.05} filter="url(#hv-bloom)" />
    ))}
    <line x1={SX[5] + TILE / 2} y1={CY} x2={SEAL.x - SEAL.r} y2={CY} stroke={BRIGHT} strokeWidth="3.4" strokeLinecap="round" opacity="0.5" filter="url(#hv-bloom)" />

    {/* governed pipeline — Submit is the focal governance node (brightest card) */}
    {SX.map((x, i) => {
      const submit = i === 0;
      // Submit is THE GATE the mesh terminates into — larger than the other nodes
      const T = submit ? 96 : TILE;
      return (
        <g key={i}>
          {submit && <rect x={x - T / 2 - 8} y={CY - T / 2 - 8} width={T + 16} height={T + 16} rx="22" fill={BRIGHT} opacity="0.32" filter="url(#hv-bloom)" />}
          <rect x={x - T / 2} y={CY - T / 2} width={T} height={T} rx={submit ? 18 : 16} fill={GOLD} opacity={submit ? 0.18 : 0.04 + i * 0.015} filter="url(#hv-bloom)" />
          <rect x={x - T / 2} y={CY - T / 2} width={T} height={T} rx={submit ? 18 : 16} fill="#0c0c0c" fillOpacity={submit ? 0.66 : 0.82} stroke={submit ? BRIGHT : `rgba(233,200,120,${0.32 + i * 0.1})`} strokeWidth={submit ? 2 : 1.2} />
          <Glyph name={STAGES[i]} x={x} y={CY - 3} s={submit ? 2.1 : 1.7} color={submit ? "#ffffff" : `rgba(255,255,255,${(0.7 + i * 0.045).toFixed(2)})`} sw={1.5} />
          <text x={x} y={CY + T / 2 + 24} textAnchor="middle" fontSize={submit ? 13.5 : 12.5} fontWeight="700" letterSpacing="1.2" fill={submit ? BRIGHT : WHITE_DIM} style={{ fontFamily: "inherit" }}>{STAGES[i]}</text>
          {submit && (
            <rect x={x - T / 2 - 3} y={CY - T / 2 - 3} width={T + 6} height={T + 6} rx="20" fill="none" stroke={BRIGHT} strokeWidth="1" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.16;0.5" dur="3.5s" repeatCount="indefinite" />
            </rect>
          )}
        </g>
      );
    })}

    {/* Official Record — seal in 8 concentric authority rings (≈1.7× a pipeline node) */}
    <g>
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r + 6} fill={BRIGHT} opacity="0.22" filter="url(#hv-bloom)" />
      {RINGS.map((r, i) => (
        <circle key={r} cx={SEAL.x} cy={SEAL.y} r={r} fill="none" stroke={GOLD} strokeWidth="0.8" opacity={Math.max(0.04, 0.38 - i * 0.034)}>
          {i === 0 && <><animate attributeName="r" values={`${r};${r + 6};${r}`} dur="5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.38;0.54;0.38" dur="5s" repeatCount="indefinite" /></>}
        </circle>
      ))}
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r} fill="url(#hv-seal)" stroke={BRIGHT} strokeWidth="2" />
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r - 13} fill="none" stroke="#171008" strokeWidth="1.2" opacity="0.5" />
      <Glyph name="SEAL" x={SEAL.x} y={SEAL.y} s={3.6} color="#171008" sw={1.6} />
      <text x={SEAL.x} y={SEAL.y + SEAL.r + 36} textAnchor="middle" fontSize="17" fontWeight="700" letterSpacing="2.5" fill={BRIGHT} style={{ fontFamily: "inherit" }}>OFFICIAL</text>
      <text x={SEAL.x} y={SEAL.y + SEAL.r + 59} textAnchor="middle" fontSize="17" fontWeight="700" letterSpacing="2.5" fill={BRIGHT} style={{ fontFamily: "inherit" }}>RECORD</text>
    </g>
  </svg>
);
