import type React from "react";
import { useEffect, useRef, useState } from "react";

/** The display wakes when it comes into view, as a real one does: a dark panel
 *  fades off the glass. Skipped entirely when the reader prefers reduced motion
 *  or the observer is unavailable, so the board is never hidden. */
export const usePowerOn = (): [React.RefObject<HTMLDivElement>, boolean] => {
  const ref = useRef<HTMLDivElement>(null);
  const [off, setOff] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    if (r.top < innerHeight * 0.75) return; // already in view on load: stay on
    setOff(true);
    const io = new IntersectionObserver(([e]) => { if (e && e.intersectionRatio > 0.35) { setOff(false); io.disconnect(); } }, { threshold: [0.35] });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, off];
};
