import { useEffect, useRef, useState } from "react";

// Counts a real number up from zero when it scrolls into view, so scale lands
// the moment a stat is seen. Respects reduced-motion. Numbers are real — the
// animation conveys scale, it never invents it.
const CountUp = ({ value, suffix = "", duration = 1100, className = "" }: { value: number; suffix?: string; duration?: number; className?: string }) => {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || done.current) return;
      done.current = true;
      const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce || value <= 0) { setN(value); return; }
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);

  return <span ref={ref} className={className}>{n}{suffix}</span>;
};

// Render a stat string that may be numeric ("8", "40+", "70%") with a count-up,
// falling back to plain text for non-numeric values ("Any", "1-click").
export const StatValue = ({ text }: { text: string }) => {
  const m = /^(\d+)(\D*)$/.exec(text.trim());
  if (m) return <CountUp value={Number(m[1])} suffix={m[2]} />;
  return <>{text}</>;
};

export default CountUp;
