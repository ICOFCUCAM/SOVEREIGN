import React, { useEffect, useRef, useState } from "react";

// THE SIGNATURE LINE — the route of a sale, run through the whole page. A fine
// line in the right-hand margin joins the chapters (ch-01 … ch-08) and draws
// itself as you read; each chapter is a node that fills once passed. Wide
// screens only; drawn complete when the reader prefers reduced motion.

const IDS = ["01", "02", "03", "04", "05", "06", "07", "08"];

const SignatureLine: React.FC = () => {
  const box = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<number[]>([]);
  const [height, setHeight] = useState(0);
  const [drawn, setDrawn] = useState(1);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const measure = (): void => {
      const top = el.getBoundingClientRect().top + scrollY;
      setHeight(el.offsetHeight);
      // each node sits level with its chapter's label, a little below the section top
      setNodes(IDS.map((n) => document.getElementById(`ch-${n}`)).filter(Boolean).map((s) => (s as HTMLElement).getBoundingClientRect().top + scrollY - top + 140));
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const read = (): void => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect(); setDrawn(Math.max(0, Math.min(1, (innerHeight * 0.6 - r.top) / r.height)));
    }); };
    if (!still) { read(); addEventListener("scroll", read, { passive: true }); }
    return () => { ro.disconnect(); cancelAnimationFrame(raf); removeEventListener("scroll", read); };
  }, []);
  const y = drawn * height;
  return (
    <div ref={box} aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-12 lg:block">
      {height > 0 && (
        <svg width="48" height={height} className="absolute inset-0 overflow-visible">
          <line x1="24" y1={nodes[0] ?? 0} x2="24" y2={nodes[nodes.length - 1] ?? height} stroke="rgba(96,165,250,0.18)" strokeWidth="1" />
          <line x1="24" y1={nodes[0] ?? 0} x2="24" y2={Math.max(nodes[0] ?? 0, Math.min(y, nodes[nodes.length - 1] ?? height))} stroke="#3b82f6" strokeWidth="1.5" />
          {nodes.map((ny, i) => {
            const on = y >= ny;
            return (
              <g key={i}>
                {on && <circle cx="24" cy={ny} r="9" fill="rgba(59,130,246,0.18)" />}
                <circle cx="24" cy={ny} r="4" fill={on ? "#3b82f6" : "#f6f8fb"} stroke="#3b82f6" strokeWidth="1.5" />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default SignatureLine;
