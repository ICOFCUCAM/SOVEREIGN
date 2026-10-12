import React, { useEffect, useState } from "react";

// A figure that counts up once when the page loads ("6,311", "$379.1B").
// Screen readers always get the final value; without motion (reduced motion,
// a server render, no matchMedia) the final value is all that renders.

const PARTS = /^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/;
const moves = (): boolean => typeof matchMedia === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches;

const format = (value: string, n: number): string => {
  const [, pre, num, post] = PARTS.exec(value)!;
  const dec = (num!.split(".")[1] ?? "").length;
  const body = num!.includes(",") ? n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : n.toFixed(dec);
  return `${pre}${body}${post}`;
};

const CountUp: React.FC<{ value: string; ms?: number }> = ({ value, ms = 1400 }) => {
  const animate = PARTS.test(value) && moves();
  const [shown, setShown] = useState(() => (animate ? format(value, 0) : value));
  useEffect(() => {
    if (!animate) { setShown(value); return; }
    const target = Number(PARTS.exec(value)![2]!.replace(/,/g, ""));
    let raf = 0; const t0 = performance.now();
    const tick = (now: number): void => {
      const p = Math.min(1, (now - t0) / ms);
      setShown(p < 1 ? format(value, target * (1 - Math.pow(1 - p, 3))) : value);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, animate]);
  return <><span aria-hidden className="tabular-nums">{shown}</span><span className="sr-only">{value}</span></>;
};

export default CountUp;
