import React, { useEffect, useRef, useState } from "react";

// A figure that counts up to its value the first time it scrolls into view — the
// small data-visualisation flourish premium enterprise sites use for headline
// metrics. Non-numeric values (e.g. "∞", "120+") render verbatim; reduced-motion
// shows the final value immediately.

export const CountUp: React.FC<{ value: string; className?: string; durationMs?: number }> = ({ value, className, durationMs = 1100 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const m = value.match(/^(\d[\d,]*)(.*)$/); // leading integer + optional suffix (e.g. "120+")
  const target = m ? parseInt(m[1].replace(/,/g, ""), 10) : null;
  const suffix = m ? m[2] : "";
  const [display, setDisplay] = useState(target === null ? value : "0" + suffix);

  useEffect(() => {
    const el = ref.current;
    if (!el || target === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDisplay(value); return; }
    let raf = 0, start = 0, done = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || done) return;
        done = true; io.disconnect();
        const tick = (t: number) => {
          if (!start) start = t;
          const p = Math.min(1, (t - start) / durationMs);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(Math.round(eased * target).toLocaleString("en-US") + suffix);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, suffix, value, durationMs]);

  return <span ref={ref} className={className}>{display}</span>;
};

export default CountUp;
