import BookCover, { type BookSpec } from "./BookCover";

// Localization workflow, shown: a single title fanned into a shelf of language
// editions — the same book, ready for many markets.
const EDITIONS: BookSpec[] = [
  { title: "The Atlas of Tomorrow", author: "A. Okonkwo", lang: "EN", from: "hsl(221 83% 52%)", to: "hsl(221 83% 34%)" },
  { title: "El Atlas del Mañana", author: "A. Okonkwo", lang: "ES", from: "hsl(38 92% 52%)", to: "hsl(24 84% 42%)" },
  { title: "L’Atlas de Demain", author: "A. Okonkwo", lang: "FR", from: "hsl(160 84% 38%)", to: "hsl(190 84% 30%)" },
  { title: "Atlasi ya Kesho", author: "A. Okonkwo", lang: "SW", from: "hsl(330 80% 52%)", to: "hsl(262 83% 44%)" },
  { title: "أطلس الغد", author: "A. Okonkwo", lang: "AR", from: "hsl(262 83% 56%)", to: "hsl(221 83% 38%)" },
];

const LocalizationVisual = () => (
  <div className="rounded-2xl border border-border bg-card p-6 shadow-e3">
    <div className="flex items-end justify-center">
      {EDITIONS.map((e, i) => {
        const mid = (EDITIONS.length - 1) / 2;
        const rot = (i - mid) * 5;
        const lift = Math.abs(i - mid) * 10;
        return (
          <div
            key={e.lang}
            className="w-[78px] shrink-0 transition-transform hover:-translate-y-2"
            style={{ transform: `rotate(${rot}deg) translateY(${lift}px)`, marginLeft: i === 0 ? 0 : -14, zIndex: EDITIONS.length - Math.abs(i - mid) }}
          >
            <BookCover spec={e} />
          </div>
        );
      })}
    </div>
    <div className="mt-7 flex flex-wrap items-center justify-center gap-1.5">
      {["English", "Español", "Français", "Kiswahili", "العربية", "中文"].map((l, i) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/75 font-sans">{l}</span>
          {i < 5 && <span className="text-muted-foreground/40">·</span>}
        </span>
      ))}
      <span className="rounded-full bg-educational/10 px-2 py-0.5 text-[11px] font-semibold text-educational font-sans">+38 more</span>
    </div>
  </div>
);

export default LocalizationVisual;
