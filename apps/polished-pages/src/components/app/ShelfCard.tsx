import { Link } from "react-router-dom";
import { Star, BadgeCheck } from "lucide-react";
import type { CatalogItem } from "@/lib/documents";
import { coverArt } from "@/lib/cover-art";

const priceLabel = (c: number) => (c > 0 ? `$${(c / 100).toFixed(2)}` : "Free");
const isNew = (d: string) => { const days = (Date.now() - new Date(d).getTime()) / 86_400_000; return days >= 0 && days <= 14; };

// A storefront cover tile — the marketplace's atom. Generates a stable cover
// from the title (no uploaded art exists), overlays the real price, badges and
// byline, and links to the listing. Built for horizontal "shelves" so browsing
// feels like Apple Books, not a form.
const ShelfCard = ({ item: it, rank }: { item: CatalogItem; rank?: number }) => {
  const { from, to } = coverArt(`${it.title}·${it.category ?? ""}`);
  return (
    <Link to={`/shared/${it.token}`} className="group block w-[148px] shrink-0 snap-start sm:w-[166px]">
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-md rounded-l-[3px] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] ring-1 ring-black/5 transition-transform duration-300 group-hover:-translate-y-1.5"
        style={{ backgroundImage: `linear-gradient(150deg, ${from}, ${to})` }}
      >
        <div className="absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/35 to-transparent" />
        <div className="absolute inset-y-0 left-[7%] w-px bg-white/15" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/30" />

        <span className="absolute left-1.5 top-1.5 rounded bg-black/45 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">{priceLabel(it.price_cents)}</span>
        <div className="absolute right-1.5 top-1.5 flex gap-1">
          {rank != null && <span className="rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-900">#{rank}</span>}
          {it.featured && <span className="rounded bg-gold px-1.5 py-0.5 text-[9px] font-bold text-white">★</span>}
          {!it.featured && isNew(it.created_at) && <span className="rounded bg-educational px-1.5 py-0.5 text-[9px] font-bold text-white">New</span>}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-2.5 pl-[12%]">
          {it.category && <div className="text-[7.5px] font-semibold uppercase tracking-[0.16em] text-white/65">{it.category}</div>}
          <div className="mt-0.5 line-clamp-3 font-serif text-[13px] font-bold leading-[1.08] text-white drop-shadow-sm">{it.title}</div>
          {it.author_name && (
            <div className="mt-1 inline-flex items-center gap-0.5 text-[9px] font-medium text-white/75">
              {it.author_name}{it.author_verified && <BadgeCheck className="h-2.5 w-2.5" />}
            </div>
          )}
        </div>
      </div>

      {(it.review_count ?? 0) > 0 && it.avg_rating != null ? (
        <div className="mt-1.5 flex items-center gap-1 px-0.5">
          <Star className="h-3 w-3 fill-gold text-gold" />
          <span className="font-sans text-[10px] text-muted-foreground">{Number(it.avg_rating).toFixed(1)} · {it.review_count}</span>
        </div>
      ) : (
        <div className="mt-1.5 truncate px-0.5 font-sans text-[10px] text-muted-foreground group-hover:text-primary">{it.author_name ? `by ${it.author_name}` : "View listing"}</div>
      )}
    </Link>
  );
};

export default ShelfCard;
