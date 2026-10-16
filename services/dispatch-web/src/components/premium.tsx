import React, { useId } from "react";
import { FilmGrain } from "./brand";

// THE PREMIUM KIT — one source for Sovereign Dispatch's institutional finish, in two registers:
//   • materials, used everywhere: gold hairlines, panel depth, the gold primary button, the gold-focus
//     field, gilt emphasis in headings, the diamond rule;
//   • ceremony, kept for the moments that matter (signing in, setting an institution up, a record sealed,
//     a record verified, a certificate): the engraved seal and the slow guilloche rosette.
// Console primitives (lib/ui, components/console/ds) take their finish from here.

/** The gold primary action. */
export const GOLD = "bg-[linear-gradient(180deg,#ecd7a6,#c9ad75_55%,#b8975c)] text-[#1d160a] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_12px_32px_-12px_rgba(201,173,117,.75)] hover:brightness-[1.06] active:translate-y-px";
/** The shape of a large action button (combine with GOLD for the primary one). */
export const ACTION = "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-[14px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";
/** A form field with a gold focus ring (taller, for forms that stand alone). */
export const FIELD = "h-11 w-full rounded-[10px] border border-sd-line bg-[#0b131d] px-3.5 text-[14px] text-sd-text placeholder:text-sd-faint outline-none transition focus:border-sd-gold/60 focus:ring-[3px] focus:ring-sd-gold/15";
/** The gold focus treatment, for the console's own controls. */
export const GOLD_FOCUS = "outline-none focus:border-sd-gold/60 focus:ring-[3px] focus:ring-sd-gold/15";
/** A panel's material: a deep gradient, an inner highlight and a soft drop. */
export const PANEL = "bg-[linear-gradient(180deg,rgba(20,30,44,0.96),rgba(13,20,30,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_22px_50px_-38px_rgba(0,0,0,0.9)]";

/** A gold hairline across the top edge of a panel (its parent must be `relative`). */
export const Hairline: React.FC<{ tone?: "gold" | "ok" | "faint"; className?: string }> = ({ tone = "faint", className = "" }) => (
  <span aria-hidden className={`pointer-events-none absolute inset-x-8 top-0 h-px ${tone === "gold" ? "bg-[linear-gradient(90deg,transparent,#e4cc95,transparent)]" : tone === "ok" ? "bg-[linear-gradient(90deg,transparent,rgba(117,201,161,0.6),transparent)]" : "bg-[linear-gradient(90deg,transparent,rgba(201,173,117,0.3),transparent)]"} ${className}`} />
);

const SMALL_WORDS = /^(of|and|the|for|de|la|le|du|des)$/i;
/** "Ministry of Records" → "MoR". */
export const initialsOf = (name: string): string => name.split(/\s+/).filter(Boolean).map((w) => (SMALL_WORDS.test(w) ? w[0].toLowerCase() : w[0].toUpperCase())).join("").slice(0, 4) || "SD";

// The institution's seal, engraved: a ring of ticks, the legend on a circle, the initials at the centre.
export const EngravedSeal: React.FC<{ initials: string; size: number; className?: string }> = ({ initials, size, className = "" }) => {
  const id = useId().replace(/:/g, "");
  const ticks = Array.from({ length: 60 }, (_, i) => i * 6);
  return (
    <svg aria-hidden viewBox="0 0 120 120" width={size} height={size} className={`shrink-0 drop-shadow-[0_0_28px_rgba(201,173,117,0.35)] ${className}`}>
      <defs>
        <radialGradient id={`${id}f`} cx="38%" cy="30%" r="75%"><stop offset="0" stopColor="#c9ad75" stopOpacity=".28" /><stop offset=".7" stopColor="#0f1722" stopOpacity=".2" /><stop offset="1" stopColor="#0b1018" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f0dcab" /><stop offset=".5" stopColor="#c9ad75" /><stop offset="1" stopColor="#8f7445" /></linearGradient>
        <path id={`${id}p`} d="M60 60 m-45.5 0 a45.5 45.5 0 1 1 91 0 a45.5 45.5 0 1 1 -91 0" />
      </defs>
      <circle cx="60" cy="60" r="58" fill={`url(#${id}f)`} stroke={`url(#${id}g)`} strokeWidth="1" />
      <circle cx="60" cy="60" r="53.5" fill="none" stroke="#c9ad75" strokeOpacity=".45" strokeWidth=".5" />
      {ticks.map((a) => <line key={a} x1="60" y1="3.6" x2="60" y2={a % 30 === 0 ? 8 : 6.2} stroke="#c9ad75" strokeOpacity=".55" strokeWidth=".5" transform={`rotate(${a} 60 60)`} />)}
      <text fill="#c9ad75" fillOpacity=".85" fontFamily="ui-monospace, Menlo, monospace" fontSize="6.4" letterSpacing="2.1">
        <textPath href={`#${id}p`}>SOVEREIGN DISPATCH · OFFICIAL RECORD · INSTITUTION ·</textPath>
      </text>
      <circle cx="60" cy="60" r="37" fill="#0d1520" stroke={`url(#${id}g)`} strokeWidth=".8" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="#c9ad75" strokeOpacity=".3" strokeWidth=".4" />
      <text x="60" y={60 + 6.5} textAnchor="middle" fill="#f3ead6" fontFamily="Fraunces, Georgia, serif" fontWeight="600" fontSize={initials.length > 3 ? 15 : 19}>{initials}</text>
    </svg>
  );
};

// Fine-line guilloche, as on a banknote or a charter: a slow rosette behind the seal.
export const Rosette: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg aria-hidden viewBox="-100 -100 200 200" fill="none" stroke="#c9ad75" className={`pointer-events-none ${className}`}>
    <g className="su-turn">{Array.from({ length: 36 }, (_, i) => <ellipse key={i} rx="92" ry="31" strokeWidth=".16" transform={`rotate(${i * 5})`} />)}</g>
    <circle r="97" strokeWidth=".35" /><circle r="99.2" strokeWidth=".18" />
    {Array.from({ length: 120 }, (_, i) => <line key={i} x1="0" y1="-94.5" x2="0" y2={i % 10 === 0 ? -90.5 : -92.8} strokeWidth=".22" transform={`rotate(${i * 3})`} />)}
  </svg>
);

// Gold, engraved-looking emphasis inside a heading.
export const Gilt: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="-mr-[0.06em] bg-[linear-gradient(180deg,#f3e2b6,#c9ad75_60%,#a8884f)] bg-clip-text pr-[0.12em] italic text-transparent">{children}</span>
);

// A short gold rule with a diamond, under eyebrows and between sections.
export const Ornament: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span aria-hidden className={`flex items-center justify-center gap-2.5 ${className}`}>
    <span className="h-px w-12 bg-[linear-gradient(90deg,transparent,#c9ad75)]" /><span className="h-1.5 w-1.5 rotate-45 border border-sd-gold/80" /><span className="h-px w-12 bg-[linear-gradient(90deg,#c9ad75,transparent)]" />
  </span>
);

// The ceremony ground: deep gradients, film grain and the rosette, for a full-screen moment.
export const CeremonyGround: React.FC<{ children: React.ReactNode; className?: string; rosette?: boolean }> = ({ children, className = "", rosette = true }) => (
  <div className={`relative min-h-screen overflow-hidden bg-sd-bg text-sd-text ${className}`}
    style={{ backgroundImage: "radial-gradient(60% 52% at 50% 0%, rgba(201,173,117,0.16), transparent 70%), radial-gradient(45% 40% at 100% 100%, rgba(141,187,255,0.07), transparent 70%), radial-gradient(35% 35% at 0% 80%, rgba(201,173,117,0.05), transparent 70%)" }}>
    <FilmGrain />
    {rosette && <Rosette className="absolute left-1/2 top-[-178px] h-[520px] w-[520px] -translate-x-1/2 opacity-[0.2]" />}
    {children}
  </div>
);
