import React from "react";
import { usePowerOn } from "../lib/use-power-on";

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
const scallop = ([x, a]: [string, number]): string =>
  `radial-gradient(ellipse 9% 46% at ${x} 0%, rgba(214,230,255,${a}), rgba(160,195,245,${(a / 3).toFixed(3)}) 45%, transparent 75%)`;
// five fittings; real lamps never match exactly, so each throws a little differently
const LIGHTS: ReadonlyArray<[string, number]> = [["11%", 0.17], ["30.5%", 0.21], ["50%", 0.15], ["69.5%", 0.22], ["89%", 0.18]];
// board-to-board tone variation in the timber, on a period that never lines up with the slats
const VARIANCE = "repeating-linear-gradient(90deg, rgba(160,195,245,0.035) 0 60px, transparent 60px 100px, rgba(0,0,0,0.07) 100px 180px, transparent 180px 260px, rgba(160,195,245,0.02) 260px 300px, transparent 300px 340px)";

const STYLE = `
  @keyframes brOn { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: no-preference) { .br-on { animation: brOn 1.6s ease-out .2s both; } }
`;

const BoardRoom: React.FC<{ children: React.ReactNode; head?: React.ReactNode }> = ({ children, head }) => {
  const [screen, off] = usePowerOn();
  return (
  <div className="relative isolate overflow-hidden bg-[#071428]">
    <style>{STYLE}</style>

    {/* the slatted wall: slats, grain, the downlights' scallops, falloff toward the floor and the corners */}
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: `${VARIANCE}, ${SLATS}` }} />
    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.3] mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: "200px 520px" }} />
    <div aria-hidden className="br-on pointer-events-none absolute inset-x-0 top-0 h-[80%]" style={{ backgroundImage: LIGHTS.map(scallop).join(",") }} />
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(2,6,13,0.15) 0%, transparent 18%, transparent 55%, rgba(2,6,13,0.55) 100%), linear-gradient(90deg, rgba(2,6,13,0.6), transparent 14%, transparent 86%, rgba(2,6,13,0.6))" }} />

    {/* ceiling: a plaster soffit with a shadow gap and recessed downlights */}
    <div aria-hidden className="relative h-10 sm:h-14" style={{ background: "linear-gradient(180deg,#0b1626,#0e1b2e)", boxShadow: "0 1px 0 rgba(0,0,0,0.9), 0 6px 14px rgba(0,0,0,0.55)" }}>
      {LIGHTS.map(([x]) => (
        // a recessed fitting seen from below: dark trim ring, bright lens, a little glare
        <span key={x} className="absolute bottom-0 flex h-[7px] w-9 -translate-x-1/2 items-center justify-center rounded-[50%] bg-[#03070e]" style={{ left: x, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.12), 0 4px 14px 2px rgba(190,215,255,0.22)" }}>
          <span className="h-[3px] w-5 rounded-[50%]" style={{ background: "radial-gradient(ellipse at center, #ffffff 0%, #dbe8ff 55%, #9dbcf0 100%)" }} />
        </span>
      ))}
    </div>

    {head}

    {/* the display, hung flat on the wall */}
    <div className="relative mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12">
      <div className="relative mx-auto max-w-[1060px]">
        {/* backlight bleeding onto the slats around the screen */}
        <div aria-hidden className="br-on pointer-events-none absolute -inset-x-[6%] -inset-y-[12%] rounded-[50%] opacity-70 blur-3xl" style={{ background: "radial-gradient(ellipse at center, rgba(70,140,255,0.45), rgba(40,90,200,0.15) 50%, transparent 72%)" }} />
        <div className="relative rounded-[8px] bg-[#020407] p-[7px]"
          style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.10) inset, 0 0 0 1px rgba(0,0,0,0.9), 0 18px 30px -10px rgba(0,0,0,0.7), 0 60px 90px -30px rgba(0,0,0,0.85)" }}>
          <div ref={screen} className="relative overflow-hidden rounded-[3px]">
            {children}
            {/* power-on: the panel's black fades off the glass */}
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#020407] transition-opacity duration-[1400ms] ease-out" style={{ opacity: off ? 1 : 0 }} />
            {/* the glass: a faint reflection of the downlights across the top */}
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(172deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 18%, transparent 30%)" }} />
          </div>
        </div>
      </div>

      {/* the credenza: a low lacquered cabinet, four flush doors with finger-pull
          reveals, a honed stone top, set back on a recessed plinth */}
      <div aria-hidden className="relative mx-auto mt-24 hidden max-w-[880px] lg:block">
        {/* styled on top: a stack of books with a stone sphere, and a tall matte vase */}
        <div className="absolute bottom-full left-[9%] flex flex-col items-center">
          <span className="mb-[-1px] h-11 w-11 rounded-full" style={{ background: "radial-gradient(circle at 34% 30%, #e2e8f0 0%, #94a3b8 32%, #475569 64%, #1e293b 92%)", boxShadow: "0 3px 4px rgba(0,0,0,0.5)" }} />
          {/* spines toward the room: cloth covers, a soft top highlight, a tooled band */}
          {[[146, 12, "#d6dde8", -4], [134, 9, "#1e3a8a", 7], [152, 14, "#3b4a60", -8], [140, 10, "#0f1b2e", 3]].map(([w, h, c, dx], i) => (
            <span key={i} className="relative block rounded-[1.5px]" style={{ width: Number(w), height: Number(h), marginLeft: Number(dx), background: `linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 45%, rgba(0,0,0,0.25)), ${c}`, boxShadow: "0 1px 1px rgba(0,0,0,0.45)" }}>
              <span className="absolute inset-y-[28%] left-[14%] w-[2px] bg-white/25" /><span className="absolute inset-y-[28%] right-[14%] w-[2px] bg-white/25" />
            </span>
          ))}
        </div>
        <div className="absolute bottom-full right-[11%] flex items-end gap-3">
          <span className="h-[96px] w-[34px] rounded-t-[17px] rounded-b-[6px]" style={{ background: "linear-gradient(90deg, #0b1626 0%, #1d3354 38%, #2a446b 52%, #13233d 80%, #08111f 100%)", boxShadow: "0 4px 6px rgba(0,0,0,0.55)" }} />
          <span className="h-[58px] w-[26px] rounded-t-[13px] rounded-b-[5px]" style={{ background: "linear-gradient(90deg, #64748b 0%, #cbd5e1 40%, #e2e8f0 52%, #94a3b8 80%, #475569 100%)", boxShadow: "0 4px 6px rgba(0,0,0,0.55)" }} />
        </div>
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
};

export default BoardRoom;
