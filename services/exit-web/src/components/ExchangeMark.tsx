import React from "react";
import { TIERS, TILE, tierFor, ticks } from "../lib/insignia";

// ── EXCHANGE MARK ───────────────────────────────────────────────────
// The ExitOS insignia (HX2): every mark — header lockup, favicon, loader,
// document masthead — is cut from the one geometry in lib/insignia.ts: the
// market ring, four registration ticks crossing it, and the transaction node
// at the centre (ice-blue on the tile). The hero's dial is the same figure
// opened into a full instrument. Sizes ≤ 20 px use the micro tier (heavier
// strokes, a solid core) so the figure holds in a browser tab.
//
//   tile (default)  the near-black app-icon tile, cool white figure, ice core
//   tile={false}    the flat monochrome mark in currentColor, for documents,
//                   reports and light grounds
//
// /public/favicon.svg and /public/brand/*.svg are generated from the same
// module (scripts/brand-assets.ts); a test keeps them in step.

export const ExchangeMark: React.FC<{
  size?: number;
  tile?: boolean;          // near-black tile (default) vs flat monochrome mark
  detail?: boolean;        // adds a fine inner ring (sign-in, report covers)
  loading?: boolean;       // a point travels the ring (brand loader)
  className?: string;
  title?: string;
}> = ({ size = 28, tile = true, detail = false, loading = false, className, title }) => {
  const id = React.useId().replace(/:/g, "");
  const T = TIERS[tierFor(size)];
  const fg = tile ? TILE.fg : "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label={title ?? "ExitOS"} fill="none">
      {title ? <title>{title}</title> : null}
      {tile && (
        <>
          <defs>
            <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={TILE.from} /><stop offset="1" stopColor={TILE.to} /></linearGradient>
          </defs>
          <rect x="2" y="2" width="96" height="96" rx="22" fill={`url(#${id}t)`} />
        </>
      )}

      {/* market ring and the registration ticks crossing it */}
      <circle cx="50" cy="50" r={T.r} stroke={fg} strokeWidth={T.ring} />
      {detail && <circle cx="50" cy="50" r={T.r * 0.62} stroke={fg} strokeWidth="1.4" strokeOpacity=".4" />}
      <g stroke={fg} strokeWidth={T.tickW} strokeLinecap="round">
        {ticks(T.tick[0], T.tick[1]).map(([a, b, c, d]) => <line key={`${a}${b}`} x1={a} y1={b} x2={c} y2={d} />)}
      </g>

      {/* transaction node */}
      {tile
        ? (T.coreRing ? <><circle cx="50" cy="50" r={T.coreRing} fill={TILE.core} /><circle cx="50" cy="50" r={T.core} fill={TILE.coreDeep} /></> : <circle cx="50" cy="50" r={T.core} fill={TILE.core} />)
        : (T.coreRing ? <circle cx="50" cy="50" r={T.coreRing - T.coreRingW / 2} stroke={fg} strokeWidth={T.coreRingW} /> : <circle cx="50" cy="50" r={T.core} fill={fg} />)}

      {/* the loader: a point travels the ring (honest motion) */}
      {loading && (
        <g style={{ animation: "exMarkOrbit 2.6s linear infinite", transformBox: "view-box", transformOrigin: "50px 50px" }}>
          <circle cx="50" cy={50 - T.r} r={T.ring * 1.3} fill={tile ? TILE.core : "currentColor"} />
        </g>
      )}
    </svg>
  );
};

// Locked-up wordmark — the mark + "ExitOS" in the established proportions.
export const ExchangeLockup: React.FC<{
  size?: number;
  dark?: boolean;          // light wordmark for dark surfaces
  sub?: string;
  className?: string;
}> = ({ size = 30, dark = false, sub, className }) => (
  <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
    <ExchangeMark size={size} title="ExitOS" />
    <div className="leading-tight">
      <div className={`font-bold tracking-tight ${dark ? "text-white" : "text-ink-900"}`} style={{ fontSize: size * 0.6 }}>ExitOS</div>
      {sub && <div className={`text-[9px] uppercase tracking-[0.22em] ${dark ? "text-white/45" : "text-slate-400"}`}>{sub}</div>}
    </div>
  </div>
);

export default ExchangeMark;
