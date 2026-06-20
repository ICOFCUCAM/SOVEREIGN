import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Store, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { catalogList, CATALOG_CATEGORIES, type CatalogItem } from "@/lib/documents";
import { BRAND } from "@/lib/tools";

const priceLabel = (cents: number) => (cents > 0 ? `$${(cents / 100).toFixed(2)}` : "Free");

// Public catalog of shared/published educational resources. No sign-in required.
const CatalogPage = () => {
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [cat, setCat] = useState<string>("");

  useEffect(() => {
    setItems(null);
    catalogList(cat || undefined).then(setItems).catch(() => setItems([]));
  }, [cat]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold" /><span className="font-serif text-base font-bold">{BRAND}</span></Link>
          <Link to="/dashboard" className="text-sm text-primary hover:underline font-sans">Create your own</Link>
        </div>
      </nav>

      <div className="container max-w-5xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-4">
            <Store className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold-light font-medium font-sans">Content Catalog</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Browse <span className="text-gradient-gold italic">published resources</span></h1>
          <p className="mt-2 text-muted-foreground font-sans">Storybooks, readers, workbooks and classroom materials shared by the community.</p>
        </motion.div>

        <div className="mt-6 flex flex-wrap gap-1.5">
          <button onClick={() => setCat("")} className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${cat === "" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>All</button>
          {CATALOG_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${cat === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{c}</button>
          ))}
        </div>

        {items === null && <div className="mt-10 flex items-center gap-2 text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
        {items && items.length === 0 && <p className="mt-10 text-center text-sm text-muted-foreground font-sans">No published resources yet{cat ? ` in ${cat}` : ""}.</p>}
        {items && items.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <Link key={it.token} to={`/shared/${it.token}`} className="group block">
                <Card className="h-full border-border transition-all hover:border-primary/50 hover:shadow-premium">
                  <CardContent className="flex h-full flex-col p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">{it.category ?? "Other"}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${it.price_cents > 0 ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary"}`}>{priceLabel(it.price_cents)}</span>
                    </div>
                    <h3 className="mt-2 font-serif text-base font-semibold leading-snug">{it.title}</h3>
                    {it.preview && <p className="mt-1.5 line-clamp-3 flex-1 text-xs text-muted-foreground font-sans">{it.preview}</p>}
                    <span className="mt-3 inline-flex items-center text-sm font-medium text-primary font-sans">View <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogPage;
