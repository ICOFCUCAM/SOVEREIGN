import { Globe } from "lucide-react";
import BookCover, { type BookSpec } from "./BookCover";

// Localization made iconic: one manuscript becomes a fan of language editions
// over a globe — write once, sell in every market. The covers share a design
// and differ only in language, which is the whole point.
const EDITIONS: BookSpec[] = [
  { title: "The Atlas of Tomorrow", author: "A. Okonkwo", lang: "EN", from: "hsl(221 83% 52%)", to: "hsl(221 83% 34%)" },
  { title: "El Atlas del Mañana", author: "A. Okonkwo", lang: "ES", from: "hsl(38 92% 52%)", to: "hsl(24 84% 42%)" },
  { title: "L’Atlas de Demain", author: "A. Okonkwo", lang: "FR", from: "hsl(160 84% 38%)", to: "hsl(190 84% 30%)" },
  { title: "Atlasi ya Kesho", author: "A. Okonkwo", lang: "SW", from: "hsl(330 80% 52%)", to: "hsl(262 83% 44%)" },
  { title: "أطلس الغد", author: "A. Okonkwo", lang: "AR", from: "hsl(262 83% 56%)", to: "hsl(221 83% 38%)" },
];

const LocalizationVisual = () => (
  <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-background p-6 shadow-e3">
    {/* Globe backdrop */}
    <svg viewBox="0 0 320 320" className="pointer-events-none absolute left-1/2 top-[42%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 opacity-[0.5]" aria-hidden>
      <defs>
        <radialGradient id="loc-globe" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="hsl(221 83% 53% / 0.12)" />
          <stop offset="100%" stopColor="hsl(221 83% 53% / 0)" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="160" r="150" fill="url(#loc-globe)" />
      <circle cx="160" cy="160" r="150" fill="none" stroke="hsl(var(--primary) / 0.18)" strokeWidth="1" />
      {[40, 80, 120].map((r) => (
        <ellipse key={`lat${r}`} cx="160" cy="160" rx="150" ry={r} fill="none" stroke="hsl(var(--primary) / 0.12)" strokeWidth="1" />
      ))}
      {[40, 80, 120].map((r) => (
        <ellipse key={`lon${r}`} cx="160" cy="160" rx={r} ry="150" fill="none" stroke="hsl(var(--primary) / 0.12)" strokeWidth="1" />
      ))}
    </svg>

    <div className="relative">
      {/* Reach badge */}
      <div className="mb-2 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary font-sans">
          <Globe className="h-3.5 w-3.5" /> 1 manuscript → 40+ languages
        </span>
      </div>

      {/* Fanned editions */}
      <div className="flex items-end justify-center">
        {EDITIONS.map((e, i) => {
          const mid = (EDITIONS.length - 1) / 2;
          const rot = (i - mid) * 6;
          const lift = Math.abs(i - mid) * 12;
          return (
            <div
              key={e.lang}
              className="w-[80px] shrink-0 transition-transform duration-300 hover:-translate-y-3"
              style={{ transform: `rotate(${rot}deg) translateY(${lift}px)`, marginLeft: i === 0 ? 0 : -16, zIndex: EDITIONS.length - Math.abs(i - mid) }}
            >
              <BookCover spec={e} />
            </div>
          );
        })}
      </div>

      {/* Language ticker */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-1.5">
        {["English", "Español", "Français", "Kiswahili", "العربية", "中文", "Português", "हिन्दी"].map((l) => (
          <span key={l} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/70 font-sans">{l}</span>
        ))}
        <span className="rounded-full bg-educational/10 px-2 py-0.5 text-[11px] font-semibold text-educational font-sans">+32 more</span>
      </div>
    </div>
  </div>
);

export default LocalizationVisual;
