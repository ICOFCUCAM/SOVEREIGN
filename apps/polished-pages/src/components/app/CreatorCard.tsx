import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import type { CatalogItem } from "@/lib/documents";
import { coverArt } from "@/lib/cover-art";
import { avatarColors, avatarInitials } from "@/lib/avatar";

// A creator-brand card for the marketplace — a real author (derived from
// published catalog items) shown with a stack of their covers, identity and
// verified status. Turns bylines into recognizable creators, not initials.
const CreatorCard = ({ name, verified, works }: { name: string; verified: boolean; works: CatalogItem[] }) => {
  const top = works.slice(0, 3);
  const av = avatarColors(name);
  return (
    <Link
      to={`/catalog/author/${encodeURIComponent(name)}`}
      className="group block w-[210px] shrink-0 snap-start rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-e3"
    >
      <div className="flex h-[72px] items-end justify-center">
        {top.map((w, i) => {
          const c = coverArt(`${w.title}·${w.category ?? ""}`);
          return (
            <div
              key={w.token}
              className="relative h-16 w-11 overflow-hidden rounded-sm rounded-l-[2px] shadow-[0_10px_22px_-10px_rgba(0,0,0,0.55)] ring-1 ring-black/5 transition-transform duration-300 group-hover:-translate-y-0.5"
              style={{ backgroundImage: `linear-gradient(150deg, ${c.from}, ${c.to})`, transform: `rotate(${(i - (top.length - 1) / 2) * 7}deg)`, marginLeft: i === 0 ? 0 : -10, zIndex: top.length - i }}
            >
              <div className="absolute inset-y-0 left-0 w-[8%] bg-black/25" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/25" />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-sm font-bold ${av.bg} ${av.text}`}>{avatarInitials(name)}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-sm font-semibold font-sans">
            <span className="truncate">{name}</span>
            {verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Verified creator" />}
          </div>
          <div className="font-sans text-xs text-muted-foreground">{works.length} {works.length === 1 ? "work" : "works"}</div>
        </div>
      </div>
    </Link>
  );
};

export default CreatorCard;
