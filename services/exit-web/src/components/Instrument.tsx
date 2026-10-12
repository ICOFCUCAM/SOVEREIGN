import React from "react";
import { usePowerOn } from "../lib/use-power-on";

// THE INSTRUMENT — the exchange board presented as the product itself, not as
// a television in a drawn room (owner review of design 12). Large and flat on
// the deep navy ground, framed only by a fine bezel and its own light; the one
// moment is the screen switching on as it comes into view. The screen's
// content is passed in unchanged. Locked palette.

const Instrument: React.FC<{ children: React.ReactNode; head?: React.ReactNode }> = ({ children, head }) => {
  const [screen, off] = usePowerOn();
  return (
    <div className="relative isolate overflow-hidden" style={{ background: "linear-gradient(180deg,#05101f 0%,#071a31 45%,#06152a 75%,#040c18 100%)" }}>
      {/* the exchange grid, barely there, gathered around the screen */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "repeating-linear-gradient(90deg, #a0bee6 0 1px, transparent 1px 120px), repeating-linear-gradient(0deg, #a0bee6 0 1px, transparent 1px 120px)", maskImage: "radial-gradient(ellipse 70% 60% at 50% 62%, #000, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 62%, #000, transparent 75%)" }} />

      {head}

      <div className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12 lg:pb-32">
        <div className="relative mx-auto max-w-[1380px]">
          {/* the screen's own light on the ground around it */}
          <div aria-hidden className="pointer-events-none absolute -inset-x-[8%] -inset-y-[14%] rounded-[50%] blur-3xl transition-opacity duration-[1400ms]"
            style={{ background: "radial-gradient(ellipse at center, rgba(56,130,246,0.42), rgba(37,99,235,0.12) 55%, transparent 74%)", opacity: off ? 0.15 : 0.6 }} />
          {/* fine bezel: a hairline of light along the top edge, a deep shadow below */}
          <div className="relative rounded-[12px] bg-[#02050a] p-[6px]"
            style={{ boxShadow: "inset 0 1px 0 rgba(200,225,255,0.16), 0 0 0 1px rgba(160,195,240,0.12), 0 30px 60px -24px rgba(0,0,0,0.8), 0 80px 140px -50px rgba(0,0,0,0.9)" }}>
            <div ref={screen} className="relative overflow-hidden rounded-[7px]">
              {children}
              {/* power-on: the panel's black fades off the glass */}
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#02050a] transition-opacity duration-[1400ms] ease-out" style={{ opacity: off ? 1 : 0 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instrument;
