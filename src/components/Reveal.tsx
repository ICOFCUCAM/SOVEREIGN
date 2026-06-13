import React, { useEffect, useRef, useState } from 'react';

interface Props {
  children: React.ReactNode;
  /** Stagger delay in ms. */
  delay?: number;
  className?: string;
  /** Vertical travel distance in px. */
  y?: number;
}

/**
 * Cinematic scroll reveal — fades + lifts content into view once, on first
 * intersection. Honors prefers-reduced-motion (renders immediately, no motion).
 */
const Reveal: React.FC<Props> = ({ children, delay = 0, className = '', y = 28 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    // Safety net 1 — if the element is already in the viewport on mount,
    // show immediately. Covers the case where Reveal wraps async content
    // (EcosystemAtlas, ranked-buyer lists, etc.) that starts at near-zero
    // height: a freshly-attached IntersectionObserver samples once, sees
    // an empty box, and never fires again because IO doesn't re-sample on
    // child-driven height growth in most browsers.
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh && rect.bottom > 0) {
      setShown(true);
      return;
    }

    // Safety net 2 — hard timeout. If the observer hasn't fired within
    // 1.5s, show the content anyway. Prevents the "invisible until click"
    // failure mode permanently, regardless of the underlying cause.
    const fallback = window.setTimeout(() => setShown(true), 1500);

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          window.clearTimeout(fallback);
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => {
      window.clearTimeout(fallback);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
        filter: shown ? 'blur(0px)' : 'blur(8px)',
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform, filter',
      }}
    >
      {children}
    </div>
  );
};

export default Reveal;
