import { Globe, Sparkles } from "lucide-react";
import BookCover, { type BookSpec } from "./BookCover";

// Localization as a superpower: one manuscript becomes eight language editions
// at once, shown as a shelf over a globe. The covers share a design and differ
// only in language — write once, sell in every market.
const EDITIONS: (BookSpec & { source?: boolean })[] = [
  { title: "The Atlas of Tomorrow", author: "A. Okonkwo", tag: "Fiction", lang: "EN", from: "hsl(221 83% 52%)", to: "hsl(221 83% 34%)", source: true },
  { title: "L’Atlas de Demain", author: "A. Okonkwo", tag: "Fiction", lang: "FR", from: "hsl(262 83% 56%)", to: "hsl(221 83% 38%)" },
  { title: "El Atlas del Mañana", author: "A. Okonkwo", tag: "Fiction", lang: "ES", from: "hsl(38 92% 52%)", to: "hsl(24 84% 42%)" },
  { title: "أطلس الغد", author: "A. Okonkwo", tag: "Fiction", lang: "AR", from: "hsl(330 80% 52%)", to: "hsl(262 83% 44%)" },
  { title: "未来之书", author: "A. Okonkwo", tag: "Fiction", lang: "中文", from: "hsl(0 78% 52%)", to: "hsl(14 84% 40%)" },
  { title: "Atlasi ya Kesho", author: "A. Okonkwo", tag: "Fiction", lang: "SW", from: "hsl(160 84% 40%)", to: "hsl(190 84% 30%)" },
  { title: "O Atlas do Amanhã", author: "A. Okonkwo", tag: "Fiction", lang: "PT", from: "hsl(142 70% 40%)", to: "hsl(160 84% 28%)" },
  { title: "Der Atlas von Morgen", author: "A. Okonkwo", tag: "Fiction", lang: "DE", from: "hsl(222 30% 38%)", to: "hsl(222 40% 22%)" },
];

const LocalizationVisual = () => (
  <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-background p-5 shadow-e3">
    {/* Globe backdrop */}
    <svg viewBox="0 0 320 320" className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 opacity-50" aria-hidden>
      <circle cx="160" cy="160" r="150" fill="none" stroke="hsl(var(--primary) / 0.16)" strokeWidth="1" />
      {[45, 90, 130].map((r) => <ellipse key={`a${r}`} cx="160" cy="160" rx="150" ry={r} fill="none" stroke="hsl(var(--primary) / 0.1)" strokeWidth="1" />)}
      {[45, 90, 130].map((r) => <ellipse key={`b${r}`} cx="160" cy="160" rx={r} ry="150" fill="none" stroke="hsl(var(--primary) / 0.1)" strokeWidth="1" />)}
    </svg>

    <div className="relative">
      <div className="mb-3 flex items-center justify-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary font-sans">
          <Globe className="h-3.5 w-3.5" /> One title → 8 languages
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {EDITIONS.map((e) => (
          <div key={e.lang} className="relative">
            {e.source && (
              <span className="absolute -top-1.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-primary-foreground shadow">
                <Sparkles className="mr-0.5 inline h-2 w-2" />Source
              </span>
            )}
            <BookCover spec={e} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-x-3 text-[11px] font-medium text-muted-foreground font-sans">
        <span>English · Français · Español · العربية</span>
        <span className="text-muted-foreground/40">·</span>
        <span>中文 · Kiswahili · Português · Deutsch</span>
      </div>
      <div className="mt-1 text-center text-[11px] text-muted-foreground/70 font-sans">…and 40+ more, each a sellable edition</div>
    </div>
  </div>
);

export default LocalizationVisual;
