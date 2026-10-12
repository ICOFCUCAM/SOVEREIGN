import React from "react";

// THE BOARDROOM WALL — the exchange screen mounted in a real room (owner:
// "the wall looks unreal … more natural like it is in a house for real").
// Realism comes from material and light, not ornament: vertical oak slats
// stained deep navy with a visible grain; recessed ceiling downlights whose
// beams wash the slats in soft scallops; a thin-bezel display hung flat on
// the wall with its own backlight and a real cast shadow; a low fluted
// credenza beneath; a dark stone floor catching the screen's light. The
// screen's content is passed in unchanged. Locked palette, interchanged.

const svg = (body: string, w = 400, h = 400): string =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`;

// wood grain: noise stretched along the slat (high x, low y frequency)
const GRAIN = svg("<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.75 0.009' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 0.62  0 0 0 0 0.72  0 0 0 0 0.9  0 0 0 0.9 -0.18'/></filter><rect width='100%' height='100%' filter='url(#g)'/>", 320, 640);
// stone: fine isotropic noise
const STONE = svg("<filter id='s'><feTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='4' seed='3'/><feColorMatrix values='0 0 0 0 0.7  0 0 0 0 0.78  0 0 0 0 0.9  0 0 0 0.5 -0.12'/></filter><rect width='100%' height='100%' filter='url(#s)'/>", 300, 300);

// slats 15px wide over a dark felt backing (5px reveal); each face lit a
// touch from the left, with a hairline edge where it turns into the reveal
const SLATS = "repeating-linear-gradient(90deg, #10243f 0px, #132a49 3px, #10253f 11px, #0c1d35 14px, #08142a 15px, #040a14 16px, #050b16 19px, #0b1b33 20px)";
// downlight scallops: a bright apex at the ceiling fading into a parabola
const scallop = (x: string): string =>
  `radial-gradient(ellipse 9% 46% at ${x} 0%, rgba(214,230,255,0.20), rgba(160,195,245,0.07) 45%, transparent 75%)`;
const LIGHTS = ["12%", "31%", "50%", "69%", "88%"];

const STYLE = `
  @keyframes brOn { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: no-preference) { .br-on { animation: brOn 1.6s ease-out .2s both; } }
`;

const BoardRoom: React.FC<{ children: React.ReactNode; head?: React.ReactNode }> = ({ children, head }) => (
  <div className="relative isolate overflow-hidden bg-[#071428]">
    <style>{STYLE}</style>

    {/* the slatted wall: slats, grain, the downlights' scallops, falloff toward the floor and the corners */}
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: SLATS }} />
    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.3] mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: "200px 520px" }} />
    <div aria-hidden className="br-on pointer-events-none absolute inset-x-0 top-0 h-[80%]" style={{ backgroundImage: LIGHTS.map(scallop).join(",") }} />
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(2,6,13,0.15) 0%, transparent 18%, transparent 55%, rgba(2,6,13,0.55) 100%), linear-gradient(90deg, rgba(2,6,13,0.6), transparent 14%, transparent 86%, rgba(2,6,13,0.6))" }} />

    {/* ceiling: a plaster soffit with a shadow gap and recessed downlights */}
    <div aria-hidden className="relative h-10 sm:h-14" style={{ background: "linear-gradient(180deg,#0b1626,#0e1b2e)", boxShadow: "0 1px 0 rgba(0,0,0,0.9), 0 6px 14px rgba(0,0,0,0.55)" }}>
      {LIGHTS.map((x) => (
        <span key={x} className="absolute bottom-1 h-1.5 w-8 -translate-x-1/2 rounded-[50%]" style={{ left: x, background: "radial-gradient(ellipse at center, #f5f9ff 0%, #cfe0ff 40%, rgba(150,190,255,0) 75%)", boxShadow: "0 2px 10px 2px rgba(190,215,255,0.45)" }} />
      ))}
    </div>

    {head}

    {/* the display, hung flat on the wall */}
    <div className="relative mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12">
      <div className="relative mx-auto max-w-[1200px]">
        {/* backlight bleeding onto the slats around the screen */}
        <div aria-hidden className="br-on pointer-events-none absolute -inset-x-[6%] -inset-y-[12%] rounded-[50%] opacity-70 blur-3xl" style={{ background: "radial-gradient(ellipse at center, rgba(70,140,255,0.45), rgba(40,90,200,0.15) 50%, transparent 72%)" }} />
        <div className="relative rounded-[8px] bg-[#020407] p-[7px]"
          style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.10) inset, 0 0 0 1px rgba(0,0,0,0.9), 0 18px 30px -10px rgba(0,0,0,0.7), 0 60px 90px -30px rgba(0,0,0,0.85)" }}>
          <div className="relative overflow-hidden rounded-[3px]">
            {children}
            {/* the glass: a faint reflection of the downlights across the top */}
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(172deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 18%, transparent 30%)" }} />
          </div>
        </div>
      </div>

      {/* the credenza: a low lacquered cabinet, four flush doors with finger-pull
          reveals, a honed stone top, set back on a recessed plinth */}
      <div aria-hidden className="relative mx-auto mt-16 hidden max-w-[880px] lg:block">
        <div className="h-[9px]" style={{ backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 30%), ${STONE}, linear-gradient(180deg,#8a9ab0,#5b6b82)`, backgroundSize: "auto, 300px 300px, auto", boxShadow: "0 2px 3px rgba(0,0,0,0.6)" }} />
        <div className="grid h-[88px] grid-cols-4" style={{ background: "#0b1a30", boxShadow: "0 34px 44px -22px rgba(0,0,0,0.9)" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="relative" style={{ background: "linear-gradient(180deg, rgba(160,195,245,0.09), rgba(160,195,245,0.02) 35%, rgba(0,0,0,0.12))", boxShadow: `inset ${i ? "1px" : "0"} 0 0 #030811, inset 0 1px 0 rgba(200,225,255,0.08)` }}>
              <span className="absolute inset-x-0 top-0 h-[6px]" style={{ background: "linear-gradient(180deg, #030811, rgba(3,8,17,0))" }} />
            </div>
          ))}
        </div>
        <div className="mx-[3%] h-2.5" style={{ background: "#03070d" }} />
      </div>
    </div>

    {/* the floor: dark stone, a shadow gap at the skirting, the screen's light caught in the polish */}
    <div aria-hidden className="relative mt-0 hidden h-28 lg:block" style={{ background: "linear-gradient(180deg,#0a1322 0%,#060d18 100%)" }}>
      <div className="absolute inset-x-0 top-0 h-px bg-black" />
      <div className="absolute inset-x-0 top-0 h-6" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.6), transparent)" }} />
      <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay" style={{ backgroundImage: STONE, backgroundSize: "300px 300px" }} />
      <div className="absolute left-1/2 top-0 h-full w-[60%] -translate-x-1/2 opacity-60 blur-2xl" style={{ background: "radial-gradient(ellipse at top, rgba(70,140,255,0.35), transparent 70%)" }} />
    </div>
    <div aria-hidden className="h-10 lg:hidden" />
  </div>
);

export default BoardRoom;
