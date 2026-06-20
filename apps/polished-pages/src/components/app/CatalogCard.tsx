import { Link } from "react-router-dom";
import { ArrowRight, Star, Eye, Download } from "lucide-react";

const Stars = ({ value }: { value: number }) => (
  <span className="inline-flex items-center" aria-label={`${value.toFixed(1)} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={`h-3 w-3 ${i <= Math.round(value) ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
    ))}
  </span>
);
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CatalogItem } from "@/lib/documents";

const priceLabel = (cents: number) => (cents > 0 ? `$${(cents / 100).toFixed(2)}` : "Free");

// One marketplace listing. Shared by the catalog discovery sections, the
// filtered grid and author pages so every surface looks consistent.
const CatalogCard = ({ item: it, admin, onFeature }: { item: CatalogItem; admin?: boolean; onFeature?: (it: CatalogItem) => void }) => (
  <Card className="flex h-full flex-col border-border transition-all hover:border-primary/50 hover:shadow-premium">
    <CardContent className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground font-sans">
          {it.featured && <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-gold normal-case"><Star className="h-3 w-3 fill-current" /> Featured</span>}
          {it.category ?? "Other"}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${it.price_cents > 0 ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary"}`}>{priceLabel(it.price_cents)}</span>
      </div>
      <Link to={`/shared/${it.token}`} className="group mt-2 block">
        <h3 className="font-serif text-base font-semibold leading-snug group-hover:text-primary">{it.title}</h3>
      </Link>
      {it.author_name && (
        <Link to={`/catalog/author/${encodeURIComponent(it.author_name)}`} className="mt-0.5 self-start text-xs text-muted-foreground hover:text-primary font-sans">by {it.author_name}</Link>
      )}
      {(it.review_count ?? 0) > 0 && it.avg_rating != null && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <Stars value={Number(it.avg_rating)} />
          <span className="text-[11px] text-muted-foreground font-sans">{Number(it.avg_rating).toFixed(1)} · {it.review_count} review{it.review_count === 1 ? "" : "s"}</span>
        </div>
      )}
      {it.preview && <p className="mt-1.5 line-clamp-3 flex-1 text-xs text-muted-foreground font-sans">{it.preview}</p>}
      {((it.view_count ?? 0) > 0 || (it.download_count ?? 0) > 0) && (
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground font-sans">
          {(it.view_count ?? 0) > 0 && <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {it.view_count}</span>}
          {(it.download_count ?? 0) > 0 && <span className="inline-flex items-center gap-1"><Download className="h-3 w-3" /> {it.download_count}</span>}
        </div>
      )}
      {it.license && <div className="mt-2 text-[11px] text-muted-foreground font-sans">{it.license}</div>}
      <div className="mt-3 flex items-center justify-between">
        <Link to={`/shared/${it.token}`} className="group inline-flex items-center text-sm font-medium text-primary font-sans">
          View <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        {admin && onFeature && (
          <Button variant="ghost" size="sm" className={it.featured ? "text-gold" : "text-muted-foreground"} onClick={() => onFeature(it)} title={it.featured ? "Unfeature" : "Feature"}>
            <Star className={`h-4 w-4 ${it.featured ? "fill-current" : ""}`} />
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

export default CatalogCard;
