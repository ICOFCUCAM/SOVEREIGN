import { Search } from "lucide-react";
import BookCover, { type BookSpec } from "./BookCover";

// Marketplace workflow, shown: a real storefront — covers, prices and ratings
// in a browsable grid, the moment a title goes live.
const ITEMS: (BookSpec & { price: string; rating: string })[] = [
  { title: "The Atlas of Tomorrow", author: "A. Okonkwo", lang: "EN", from: "hsl(262 83% 58%)", to: "hsl(221 83% 40%)", price: "$9.99", rating: "4.9" },
  { title: "Cuentos de la Luna", author: "M. Vega", lang: "ES", from: "hsl(38 92% 52%)", to: "hsl(14 86% 46%)", price: "$6.50", rating: "4.8" },
  { title: "Mathématiques Vivantes", author: "C. Laurent", lang: "FR", from: "hsl(160 84% 38%)", to: "hsl(190 84% 30%)", price: "$12", rating: "5.0" },
  { title: "Hadithi za Kiafrika", author: "J. Mwangi", lang: "SW", from: "hsl(192 84% 44%)", to: "hsl(221 83% 40%)", price: "Free", rating: "4.7" },
  { title: "未来之书", author: "W. Chen", lang: "ZH", from: "hsl(221 83% 50%)", to: "hsl(252 83% 40%)", price: "$8.00", rating: "4.9" },
  { title: "The Quiet Harvest", author: "R. Bello", lang: "EN", from: "hsl(24 80% 50%)", to: "hsl(38 92% 42%)", price: "$5.99", rating: "4.8" },
];

const MarketplaceVisual = () => (
  <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-e3">
    {/* Browser chrome */}
    <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-[11px] text-muted-foreground font-sans">
        <Search className="h-3 w-3" /> marketplace · all languages
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3 p-4">
      {ITEMS.map((it) => (
        <div key={it.title} className="group">
          <div className="relative">
            <BookCover spec={it} />
            <span className="absolute left-1 top-1 rounded bg-black/55 px-1.5 py-0.5 text-[8px] font-bold text-white backdrop-blur-sm">{it.price}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[9px] text-amber-500">★★★★★</span>
            <span className="text-[9px] font-medium text-muted-foreground font-sans">{it.rating}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default MarketplaceVisual;
