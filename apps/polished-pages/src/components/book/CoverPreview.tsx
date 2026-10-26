import { useEffect, useRef, useState } from "react";
import { drawCover, loadCoverFonts, loadCoverImages, partSize, type CoverImages, type CoverPart } from "@/lib/cover-render";
import type { CoverDesign } from "@/lib/cover-design";

// Live canvas preview of a cover part, redrawn as the design changes. Drawn at
// the element's real pixel size (times the screen's density), so it's crisp.
export default function CoverPreview({ design, part, guides, className, onOverflow, label }: {
  design: CoverDesign; part: CoverPart; guides?: boolean; className?: string; onOverflow?: (v: boolean) => void; label?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [imgs, setImgs] = useState<CoverImages>({ front: null, back: null, photo: null });
  const [fontsReady, setFontsReady] = useState(0);
  const [width, setWidth] = useState(0);

  useEffect(() => { let on = true; loadCoverImages(design).then((x) => on && setImgs(x)); return () => { on = false; }; }, [design.frontArt, design.backArt, design.authorPhoto]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { let on = true; loadCoverFonts(design).then(() => on && setFontsReady((n) => n + 1)); return () => { on = false; }; }, [design.template, design.titleFont]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const size = partSize(design, part);
  useEffect(() => {
    const c = canvas.current;
    if (!c || !width) return;
    const id = requestAnimationFrame(() => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const k = (width * dpr) / size.w;
      c.width = Math.round(size.w * k); c.height = Math.round(size.h * k);
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      const r = drawCover(ctx, design, imgs, part, k, { guides });
      onOverflow?.(r.overflow);
    });
    return () => cancelAnimationFrame(id);
  }, [design, imgs, part, guides, width, size.w, size.h, fontsReady, onOverflow]);

  return (
    <div ref={box} className={className}>
      <canvas ref={canvas} role="img" aria-label={label ?? `${part} cover preview`} data-testid={`cover-preview-${part}`}
        className="block w-full rounded-[3px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)]" style={{ aspectRatio: `${size.w} / ${size.h}` }} />
    </div>
  );
}
