import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Sparkles, Loader2, ArrowRight, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicCollection, type PublicCollection as PC } from "@/lib/collections";
import { BRAND } from "@/lib/tools";

const priceLabel = (cents: number) => (cents > 0 ? `$${(cents / 100).toFixed(2)}` : "Free");

const PublicCollection = () => {
  const { token } = useParams();
  const [col, setCol] = useState<PC | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    if (!token) { setState("missing"); return; }
    getPublicCollection(token).then((c) => { if (c) { setCol(c); setState("ready"); } else setState("missing"); }).catch(() => setState("missing"));
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold" /><span className="font-serif text-base font-bold">{BRAND}</span></Link>
          <Link to="/catalog" className="text-sm text-primary hover:underline font-sans">Browse catalog</Link>
        </div>
      </nav>

      <div className="container max-w-5xl mx-auto px-6 py-10">
        {state === "loading" && <div className="flex items-center gap-2 text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
        {state === "missing" && (
          <div className="py-20 text-center">
            <h1 className="font-serif text-2xl font-bold">This collection isn’t available</h1>
            <p className="mt-2 text-muted-foreground font-sans">The link may be wrong, or it was made private.</p>
            <Link to="/catalog" className="mt-4 inline-block text-primary hover:underline font-sans">Browse the catalog</Link>
          </div>
        )}
        {state === "ready" && col && (
          <>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-4">
              <FolderOpen className="w-4 h-4 text-gold" />
              <span className="text-sm text-gold-light font-medium font-sans">Collection</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">{col.title}</h1>
            {col.description && <p className="mt-2 max-w-2xl text-muted-foreground font-sans">{col.description}</p>}

            {col.items.length === 0 ? (
              <p className="mt-10 text-center text-sm text-muted-foreground font-sans">This collection has no public items yet.</p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {col.items.map((it) => (
                  <Link key={it.token} to={`/shared/${it.token}`} className="group block">
                    <Card className="h-full border-border transition-all hover:border-primary/50 hover:shadow-premium">
                      <CardContent className="flex h-full flex-col p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">{it.category ?? "Other"}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${it.price_cents > 0 ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary"}`}>{priceLabel(it.price_cents)}</span>
                        </div>
                        <h3 className="mt-2 font-serif text-base font-semibold leading-snug group-hover:text-primary">{it.title}</h3>
                        {it.author_name && <div className="mt-0.5 text-xs text-muted-foreground font-sans">by {it.author_name}</div>}
                        {it.preview && <p className="mt-1.5 line-clamp-3 flex-1 text-xs text-muted-foreground font-sans">{it.preview}</p>}
                        <span className="mt-3 inline-flex items-center text-sm font-medium text-primary font-sans">View <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
            <p className="mt-8 text-center text-xs text-muted-foreground font-sans">A collection on {BRAND}. <Link to="/" className="text-primary hover:underline">Create your own →</Link></p>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicCollection;
