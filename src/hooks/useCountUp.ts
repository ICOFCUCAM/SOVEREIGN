import { useEffect, useRef, useState } from 'react';

/**
 * Eases a number from 0 → target once the element scrolls into view.
 * Honors prefers-reduced-motion (snaps to target). Returns a ref to attach
 * and the current animated value.
 */
export function useCountUp(target: number, durationMs = 1600, decimals = 0) {
  const ref = useRef<HTMLElement | null>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const factor = Math.pow(10, decimals);
    const run = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(Math.round(target * eased * factor) / factor);
      if (t < 1) raf = requestAnimationFrame(run);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          raf = requestAnimationFrame(run);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, durationMs, decimals]);

  return { ref, value };
}
