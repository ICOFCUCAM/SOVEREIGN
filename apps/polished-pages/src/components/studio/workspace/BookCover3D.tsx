import { useReducedMotion } from "framer-motion";

// The saved front cover as a physical book (design spec §9: "dimensional view
// optional and secondary"). The spine is as thick as the real book: page count
// and paper give its width, scaled to the cover's height. No page flips.
export default function BookCover3D({ src, alt, height = 300, spineMm, trimHmm, trimWmm }: {
  src: string; alt: string; height?: number; spineMm: number; trimHmm: number; trimWmm: number;
}) {
  const reduce = useReducedMotion();
  const scale = height / trimHmm;
  const w = Math.round(trimWmm * scale);
  const d = Math.max(6, Math.round(spineMm * scale));
  return (
    <div className="group px-4 [perspective:1600px]" style={{ width: w + d + 32 }}>
      <div role="img" aria-label={alt}
        className={`relative mx-auto [transform-style:preserve-3d] [transform:rotateY(-28deg)] ${reduce ? "" : "transition-transform duration-500 ease-out group-hover:[transform:rotateY(-14deg)]"}`}
        style={{ width: w, height }}>
        {/* front */}
        <img src={src} alt="" className="absolute inset-0 h-full w-full rounded-r-[3px] object-cover" style={{ transform: `translateZ(${d / 2}px)` }} />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-3 rounded-l-[1px] bg-gradient-to-r from-black/30 to-transparent" style={{ transform: `translateZ(${d / 2 + 0.5}px)` }} />
        {/* back */}
        <div className="absolute inset-0 rounded-l-[3px] bg-[#1F2937]" style={{ transform: `translateZ(${-d / 2}px) rotateY(180deg)` }} />
        {/* spine: the cover's left edge, shaded */}
        <div className="absolute top-0 h-full overflow-hidden" style={{ left: 0, width: d, transform: `translateX(${-d / 2}px) rotateY(-90deg)` }}>
          <img src={src} alt="" className="h-full max-w-none object-cover object-left brightness-[.68]" style={{ width: w }} />
        </div>
        {/* page block */}
        <div className="absolute" style={{ top: 3, height: height - 6, left: w - d, width: d, transform: `translateX(${d / 2 - 2}px) rotateY(90deg)`,
          background: "repeating-linear-gradient(90deg,#FBF8F1 0,#FBF8F1 1px,#E7E1D3 1px,#E7E1D3 2px)" }} />
      </div>
      <div aria-hidden className="mx-auto mt-2 h-3 w-[80%] rounded-[50%] bg-black/20 blur-md dark:bg-black/60" />
    </div>
  );
}
