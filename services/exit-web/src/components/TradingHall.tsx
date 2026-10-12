import React from "react";

// THE TRADING HALL — a coded architectural installation for the big screen
// (design exploration, HOMEPAGE.md Phase 6). The screen is set into a wall
// between two pilasters, under a light cove, with a ceiling light grid
// running back in perspective and a polished floor that reflects the live
// screen (CSS box-reflect; browsers without it show the floor glow only).
// Locked palette only: the navy gradients, blue light, white.

/** A fluted stone pilaster with a lit capital and a base. */
const Pilaster: React.FC = () => (
  <div aria-hidden className="relative hidden flex-col lg:flex">
    <div className="-mx-2 h-4 rounded-sm" style={{ background: "linear-gradient(180deg,#2a4a78,#12294a)", boxShadow: "0 0 18px 2px rgba(120,170,255,0.35)" }} />
    <div className="flex-1" style={{ background: "repeating-linear-gradient(90deg, #0d223f 0 7px, #183457 7px 9px, #0d223f 9px 16px), linear-gradient(90deg,#0b1d36,#1a3358 50%,#0b1d36)", backgroundBlendMode: "overlay", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 -60px 60px -30px rgba(56,130,246,0.25)" }} />
    <div className="-mx-3 h-6 rounded-sm" style={{ background: "linear-gradient(180deg,#1a3358,#0a1a30)" }} />
  </div>
);

const TradingHall: React.FC<{ children: React.ReactNode; head?: React.ReactNode; foot?: React.ReactNode }> = ({ children, head, foot }) => (
  <div className="relative isolate overflow-hidden" style={{ background: "linear-gradient(180deg,#040c18 0%,#06182E 45%,#0A1F3A 70%,#050f1d 100%)" }}>
    {/* back wall: stone panel seams */}
    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(160,190,230,0.9) 0 1px, transparent 1px 160px), repeating-linear-gradient(0deg, rgba(160,190,230,0.6) 0 1px, transparent 1px 220px)" }} />

    {/* ceiling: light strips receding in perspective */}
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 hidden h-[30%] lg:block" style={{ perspective: "900px" }}>
      <div className="absolute inset-x-[-20%] bottom-0 h-[260%] origin-bottom"
        style={{ transform: "rotateX(-72deg)", backgroundImage: "repeating-linear-gradient(90deg, rgba(200,225,255,0.22) 0 2px, transparent 2px 120px), repeating-linear-gradient(0deg, rgba(200,225,255,0.08) 0 1px, transparent 1px 90px)", maskImage: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%)", WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%)" }} />
    </div>

    {/* floor: polished stone with a perspective grid and the screen's light */}
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[34%] lg:block" style={{ perspective: "900px" }}>
      <div className="absolute inset-x-[-30%] top-0 h-[300%] origin-top"
        style={{ transform: "rotateX(76deg)", backgroundImage: "repeating-linear-gradient(90deg, rgba(120,170,255,0.22) 0 1px, transparent 1px 110px), repeating-linear-gradient(0deg, rgba(120,170,255,0.14) 0 1px, transparent 1px 110px)", maskImage: "linear-gradient(to bottom, #000, transparent 70%)", WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 70%)" }} />
      <div className="absolute left-1/2 top-0 h-full w-[70%] -translate-x-1/2 rounded-[50%] opacity-60 blur-3xl" style={{ background: "radial-gradient(ellipse at top, rgba(56,130,246,0.35), transparent 70%)" }} />
    </div>

    {/* light spill behind the screen */}
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-[38%] h-[60%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-50 blur-[110px]" style={{ background: "radial-gradient(ellipse at center, rgba(56,130,246,0.45), transparent 70%)" }} />

    {head}
    <div className="relative mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12">
      <div className="relative mx-auto grid max-w-[1320px] lg:grid-cols-[64px_minmax(0,1fr)_64px] lg:gap-8">
        {/* pilasters */}
        <Pilaster />
        <div className="min-w-0">
          {/* light cove */}
          <div aria-hidden className="mx-auto mb-5 hidden h-[3px] w-[86%] rounded-full lg:block" style={{ background: "linear-gradient(90deg, transparent, rgba(220,235,255,0.95), transparent)", boxShadow: "0 0 24px 6px rgba(120,170,255,0.45)" }} />
          {/* the screen, set into the wall */}
          <div className="relative rounded-[10px] p-3 sm:p-4"
            style={{ background: "linear-gradient(180deg,#0e1a2c,#070f1c)", boxShadow: "0 50px 80px -40px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.08)", WebkitBoxReflect: "below 30px linear-gradient(transparent 62%, rgba(255,255,255,0.16))" } as React.CSSProperties}>
            {children}
          </div>
          {/* the plinth the screen stands on */}
          <div aria-hidden className="mx-auto hidden h-3 w-[92%] rounded-b-md lg:block" style={{ background: "linear-gradient(180deg,#1a3358,#0a1a30)", boxShadow: "0 12px 30px -8px rgba(0,0,0,0.7)" }} />
        </div>
        <Pilaster />
      </div>
      {/* floor space for the reflection */}
      <div aria-hidden className="hidden h-[220px] lg:block" />
    </div>
    {foot}
  </div>
);

export default TradingHall;
