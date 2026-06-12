import React from "react";

// ── EXCHANGE MARK ───────────────────────────────────────────────────
// The single geometric primitive of the ExitOS identity system. Every
// brand asset — favicon, header lockup, loader, document masthead —
// derives from this one figure: a transaction ring (the exchange), four
// crosshair registry ticks (the cardinal axes of the market), and a live
// core node (the asset at the centre of the process). Monochrome by
// construction; the core carries the single emerald "live market" accent.
//
// The same geometry is mirrored byte-for-byte in /public/favicon.svg so a
// 16px browser tab and a full-screen splash read as the same brand.

const NAVY = "#0A1F3A";   // the dark instrument tile
const LIVE = "#34d399";   // emerald — live-market core

export const ExchangeMark: React.FC<{
  size?: number;
  tile?: boolean;          // navy rounded-square app-icon (default) vs bare mark
  detail?: boolean;        // adds the diagonal registry ticks + inner ring
  loading?: boolean;       // a node sweeps the orbit (brand loader)
  className?: string;
  title?: string;
}> = ({ size = 28, tile = true, detail = false, loading = false, className, title }) => {
  const stroke = tile ? "#FFFFFF" : "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label={title ?? "ExitOS"} fill="none">
      {title ? <title>{title}</title> : null}
      {tile && <rect x="2" y="2" width="96" height="96" rx="22" fill={NAVY} />}

      {/* transaction ring */}
      <circle cx="50" cy="50" r="33" stroke={stroke} strokeWidth="5" opacity={tile ? 0.95 : 1} />
      {detail && <circle cx="50" cy="50" r="22" stroke={stroke} strokeWidth="2" opacity="0.35" />}

      {/* cardinal registry ticks (read at 16px) */}
      <g stroke={stroke} strokeWidth="5" strokeLinecap="round">
        <line x1="50" y1="11" x2="50" y2="21" />
        <line x1="50" y1="79" x2="50" y2="89" />
        <line x1="11" y1="50" x2="21" y2="50" />
        <line x1="79" y1="50" x2="89" y2="50" />
      </g>
      {/* diagonal registry ticks (detail) */}
      {detail && (
        <g stroke={stroke} strokeWidth="3" strokeLinecap="round" opacity="0.7">
          <line x1="24.5" y1="24.5" x2="30.5" y2="30.5" />
          <line x1="75.5" y1="24.5" x2="69.5" y2="30.5" />
          <line x1="24.5" y1="75.5" x2="30.5" y2="69.5" />
          <line x1="75.5" y1="75.5" x2="69.5" y2="69.5" />
        </g>
      )}

      {/* live core */}
      <circle cx="50" cy="50" r="10.5" fill={LIVE} />

      {/* orbital sweep — only when loading (honest motion) */}
      {loading && (
        <g style={{ animation: "exMarkOrbit 2.6s linear infinite", transformBox: "fill-box", transformOrigin: "center" }}>
          <circle cx="50" cy="17" r="4.5" fill={LIVE} />
        </g>
      )}
    </svg>
  );
};

// Locked-up wordmark — the mark + "ExitOS" in the established proportions.
export const ExchangeLockup: React.FC<{
  size?: number;
  dark?: boolean;          // white wordmark for dark surfaces
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
