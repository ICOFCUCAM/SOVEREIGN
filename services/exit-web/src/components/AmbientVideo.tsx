import React, { useEffect, useRef, useState } from "react";

// A muted, looping background film for a chapter. Decorative: hidden from
// assistive technology, never focusable. It plays only while on screen, and
// not at all (the still poster shows instead) when the reader prefers reduced
// motion. Nothing downloads until the chapter is near. PLACEHOLDER FOOTAGE — see HOMEPAGE.md, pre-launch gate G1.

const AmbientVideo: React.FC<{ src: string; webm?: string; poster: string; className?: string }> = ({ src, webm, poster, className }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setMotion(true);
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) void v.play().catch(() => undefined); else v.pause(); }, { rootMargin: "300px 0px" });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video ref={ref} aria-hidden tabIndex={-1} muted loop playsInline preload="none" data-motion={motion ? "on" : "off"} poster={poster} className={className}>
      {webm && <source src={webm} type="video/webm" />}
      <source src={src} type="video/mp4" />
    </video>
  );
};

export default AmbientVideo;
