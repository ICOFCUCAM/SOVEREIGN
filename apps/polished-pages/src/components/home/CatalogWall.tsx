import { type CSSProperties } from "react";
import BookCover, { type BookSpec } from "./BookCover";

// A living catalog wall: two rows of hand-built covers drifting in opposite
// directions. It does the job a paragraph can't — showing range (genres),
// reach (languages) and scale at a glance. Pure CSS marquee; pauses for users
// who prefer reduced motion.

const ROW_A: BookSpec[] = [
  { title: "The Atlas of Tomorrow", author: "A. Okonkwo", tag: "Fiction", lang: "EN", from: "hsl(262 83% 58%)", to: "hsl(221 83% 38%)" },
  { title: "Cuentos de la Luna", author: "M. Vega", tag: "Children", lang: "ES", from: "hsl(38 92% 52%)", to: "hsl(14 86% 46%)" },
  { title: "Mathématiques Vivantes", author: "C. Laurent", tag: "Education", lang: "FR", from: "hsl(160 84% 38%)", to: "hsl(190 84% 30%)" },
  { title: "Hadithi za Kiafrika", author: "J. Mwangi", tag: "Folklore", lang: "SW", from: "hsl(192 84% 44%)", to: "hsl(221 83% 40%)" },
  { title: "رحلة النور", author: "L. Haddad", tag: "Poetry", lang: "AR", from: "hsl(280 70% 50%)", to: "hsl(330 80% 45%)" },
  { title: "未来之书", author: "W. Chen", tag: "Sci-Fi", lang: "ZH", from: "hsl(221 83% 50%)", to: "hsl(252 83% 40%)" },
  { title: "The Quiet Harvest", author: "R. Bello", tag: "Memoir", lang: "EN", from: "hsl(24 80% 50%)", to: "hsl(38 92% 42%)" },
];

const ROW_B: BookSpec[] = [
  { title: "Grammar in Motion", author: "S. Adeyemi", tag: "Workbook", lang: "EN", from: "hsl(160 84% 40%)", to: "hsl(160 70% 26%)" },
  { title: "Estrellas y Números", author: "P. Cruz", tag: "Early Years", lang: "ES", from: "hsl(221 83% 56%)", to: "hsl(262 83% 46%)" },
  { title: "Le Code des Rivières", author: "N. Diallo", tag: "Adventure", lang: "FR", from: "hsl(330 80% 52%)", to: "hsl(262 83% 44%)" },
  { title: "Mwongozo wa Mwalimu", author: "T. Juma", tag: "Curriculum", lang: "SW", from: "hsl(200 84% 46%)", to: "hsl(221 83% 34%)" },
  { title: "كتاب المغامرة", author: "F. Nasser", tag: "Fiction", lang: "AR", from: "hsl(38 92% 50%)", to: "hsl(24 84% 40%)" },
  { title: "成长的力量", author: "Y. Liang", tag: "Self-Help", lang: "ZH", from: "hsl(280 72% 52%)", to: "hsl(221 83% 40%)" },
  { title: "Letters to the Sea", author: "D. Okeke", tag: "Poetry", lang: "EN", from: "hsl(190 84% 42%)", to: "hsl(221 83% 34%)" },
];

const Row = ({ books, reverse = false }: { books: BookSpec[]; reverse?: boolean }) => (
  <div className="flex w-max gap-4 pr-4 motion-safe:[animation:var(--anim)] motion-reduce:animate-none"
    style={{ "--anim": reverse ? "marquee-reverse 75s linear infinite" : "marquee 60s linear infinite" } as CSSProperties}>
    {[...books, ...books].map((b, i) => (
      <div key={i} className="w-[120px] shrink-0 sm:w-[136px]">
        <BookCover spec={b} />
      </div>
    ))}
  </div>
);

const CatalogWall = () => {
  return (
    <div
      className="relative space-y-4 py-2"
      style={{ maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)" }}
    >
      <Row books={ROW_A} />
      <Row books={ROW_B} reverse />
    </div>
  );
};

export default CatalogWall;
