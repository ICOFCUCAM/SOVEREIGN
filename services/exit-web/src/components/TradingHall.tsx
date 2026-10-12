import React from "react";

// THE TRADING HALL — the architectural installation for the exchange screen
// (HOMEPAGE.md Phase 6, W1/W2). A coffered ceiling with downlights runs back in
// perspective; two fluted, full-height pilasters carry a lit architrave; the
// screen sits in a recessed, stepped portal (pilasters slimmed and set close
// to the portal in matte stone, owner review) under volumetric light, on a
// plinth, above a polished stone floor that reflects the live screen (CSS
// box-reflect; browsers without it show the floor glow only). The screen's
// own content is passed in unchanged. Locked palette: the navy gradients,
// blue light, white.

const STYLE = `
  @keyframes thRise { from { opacity: 0; transform: translateY(28px) scale(0.985); } to { opacity: 1; transform: none; } }
  @keyframes thGlow { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: no-preference) {
    .th-rise { animation: thRise 1.2s cubic-bezier(.2,.7,.2,1) .15s both; }
    .th-glow { animation: thGlow 1.8s ease-out .1s both; }
  }
`;

/** A slim pilaster in dark matte stone: faint fluting, lit only along the
 *  edge that faces the screen, a thin capital and a stepped base. */
const Pilaster: React.FC<{ side: "l" | "r" }> = ({ side }) => (
  <div aria-hidden className="relative -mt-14 hidden flex-col lg:flex">
    <div className="-mx-2 h-2" style={{ background: "linear-gradient(180deg,#1d3557,#10223d)", boxShadow: "inset 0 1px 0 rgba(200,225,255,0.22)" }} />
    <div className="-mx-1 h-2.5" style={{ background: "#0d1f38" }} />
    <div className="flex-1" style={{
      background: `repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 7px, rgba(160,195,240,0.05) 7px 8px, rgba(0,0,0,0.22) 8px 9px, rgba(255,255,255,0) 9px 15px), linear-gradient(${side === "l" ? "90deg" : "270deg"},#07111f 0%,#0c1c33 70%,#16304f 100%)`,
      boxShadow: `inset ${side === "l" ? "-1px" : "1px"} 0 0 rgba(170,205,250,0.28), inset 0 -60px 50px -30px rgba(0,0,0,0.5)`,
    }} />
    <div className="-mx-1 h-2" style={{ background: "#0d1f38" }} />
    <div className="-mx-2.5 h-4" style={{ background: "linear-gradient(180deg,#12253f,#081322)", boxShadow: "0 12px 20px -10px rgba(0,0,0,0.8)" }} />
  </div>
);

const TradingHall: React.FC<{ children: React.ReactNode; head?: React.ReactNode; foot?: React.ReactNode }> = ({ children, head, foot }) => (
  <div className="relative isolate overflow-hidden" style={{ background: "linear-gradient(180deg,#030a15 0%,#06182E 42%,#0A1F3A 68%,#040d1a 100%)" }}>
    <style>{STYLE}</style>

    {/* back wall: large stone panels */}
    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(160,190,230,0.9) 0 1px, transparent 1px 180px), repeating-linear-gradient(0deg, rgba(160,190,230,0.6) 0 1px, transparent 1px 240px)" }} />

    {/* coffered ceiling with a downlight in every coffer, receding in perspective */}
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 hidden h-[30%] lg:block" style={{ perspective: "800px" }}>
      <div className="absolute inset-x-[-25%] bottom-0 h-[300%] origin-bottom"
        style={{
          transform: "rotateX(-74deg)",
          backgroundImage: "radial-gradient(circle at 70px 70px, rgba(225,238,255,0.35) 0 2px, rgba(120,170,255,0.10) 3px 12px, transparent 20px), linear-gradient(90deg, rgba(150,190,255,0.08) 0 2px, transparent 2px), linear-gradient(0deg, rgba(150,190,255,0.06) 0 2px, transparent 2px)",
          backgroundSize: "140px 140px",
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 55%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 55%)",
        }} />
    </div>

    {/* polished stone floor: tile seams, the screen's light, edge vignette */}
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[34%] lg:block" style={{ perspective: "900px" }}>
      <div className="absolute inset-x-[-30%] top-0 h-[300%] origin-top"
        style={{ transform: "rotateX(76deg)", backgroundImage: "repeating-linear-gradient(90deg, rgba(140,185,255,0.20) 0 1px, transparent 1px 160px), repeating-linear-gradient(0deg, rgba(140,185,255,0.12) 0 1px, transparent 1px 160px)", maskImage: "linear-gradient(to bottom, #000, transparent 70%)", WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 70%)" }} />
      <div className="absolute left-1/2 top-0 h-full w-[70%] -translate-x-1/2 rounded-[50%] opacity-60 blur-3xl" style={{ background: "radial-gradient(ellipse at top, rgba(56,130,246,0.35), transparent 70%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 100% at 50% 0%, transparent 40%, rgba(3,10,21,0.85) 100%)" }} />
    </div>

    {/* light spill behind the portal */}
    <div aria-hidden className="th-glow pointer-events-none absolute left-1/2 top-[40%] h-[62%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-50 blur-[120px]" style={{ background: "radial-gradient(ellipse at center, rgba(56,130,246,0.5), transparent 70%)" }} />

    {head}
    <div className="relative mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12">
      <div className="relative mx-auto grid max-w-[1340px] lg:grid-cols-[40px_minmax(0,1fr)_40px] lg:gap-5">
        <Pilaster side="l" />
        <div className="relative min-w-0">
          {/* the architrave between the capitals, with a lit underside */}
          <div aria-hidden className="absolute -left-[73px] -right-[73px] -top-[68px] hidden h-4 lg:block"
            style={{ background: "linear-gradient(180deg,#183052,#0b1a30)", boxShadow: "0 10px 24px -8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(200,225,255,0.18), inset 0 -1px 0 rgba(200,225,255,0.35)" }} />
          {/* volumetric light from the cove onto the screen */}
          <div aria-hidden className="th-glow pointer-events-none absolute inset-x-[6%] -top-8 hidden h-[70%] lg:block"
            style={{ background: "linear-gradient(180deg, rgba(200,225,255,0.10), transparent 75%)", clipPath: "polygon(8% 0, 92% 0, 100% 100%, 0 100%)", mixBlendMode: "screen" }} />
          {/* light cove */}
          <div aria-hidden className="mx-auto mb-5 hidden h-[3px] w-[86%] rounded-full lg:block" style={{ background: "linear-gradient(90deg, transparent, rgba(225,238,255,1), transparent)", boxShadow: "0 0 28px 7px rgba(120,170,255,0.5)" }} />

          {/* the recessed, stepped portal holding the screen */}
          <div className="th-rise relative rounded-[14px] p-2.5"
            style={{ background: "linear-gradient(180deg,#1a3358,#0b1a30)", boxShadow: "0 60px 90px -45px rgba(0,0,0,0.9), 0 0 0 1px rgba(160,195,240,0.14), inset 0 1px 0 rgba(220,235,255,0.25)", WebkitBoxReflect: "below 34px linear-gradient(transparent 64%, rgba(255,255,255,0.15))" } as React.CSSProperties}>
            <div className="relative rounded-[10px] p-3 sm:p-3.5"
              style={{ background: "linear-gradient(180deg,#0b1626,#050c18)", boxShadow: "inset 0 10px 24px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
              {children}
              {/* glass sheen over the screen (decorative; the content beneath is unchanged) */}
              <div aria-hidden className="pointer-events-none absolute inset-3 rounded-[6px] sm:inset-3.5"
                style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 22%, transparent 38%)" }} />
            </div>
          </div>
          {/* the plinth */}
          <div aria-hidden className="mx-auto hidden h-3.5 w-[94%] rounded-b-md lg:block" style={{ background: "linear-gradient(180deg,#22416c,#0a1a30)", boxShadow: "0 14px 32px -8px rgba(0,0,0,0.75)" }} />
        </div>
        <Pilaster side="r" />
      </div>
      {/* floor space for the reflection */}
      <div aria-hidden className="hidden h-[230px] lg:block" />
    </div>
    {foot}
  </div>
);

export default TradingHall;
