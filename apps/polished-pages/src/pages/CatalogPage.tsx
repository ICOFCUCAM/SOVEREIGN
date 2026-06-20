import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Store, ArrowRight, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { catalogList, CATALOG_CATEGORIES, type CatalogItem } from "@/lib/documents";
import { BRAND } from "@/lib/tools";

const priceLabel = (cents: number) => (cents > 0 ? `$${(cents / 100).toFixed(2)}` : "Free");
type Sort = "new" | "price-asc" | "free";

// Public catalog of shared/published educational resources. No sign-in required.
const CatalogPage = () => {
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [cat, setCat] = useState<string>("");
  const [query, setQuery] = useState("");
  const [author, setAuthor] = useState<string>("");
  const [sort, setSort] = useState<Sort>("new");

  useEffect(() => {
    setItems(null);
    const id = setTimeout(() => {
      catalogList(cat || undefined, query.trim() || undefined).then(setItems).catch(() => setItems([]));
    }, query ? 300 : 0);
    return () => clearTimeout(id);
  }, [cat, query]);

  const view = useMemo(() => {
    let list = items ?? [];
    if (author) list = list.filter((i) => (i.author_name ?? "") === author);
    if (sort === "free") list = [...list].sort((a, b) => a.price_cents - b.price_cents);
    else if (sort === "price-asc") list = [...list].sort((a, b) => a.price_cents - b.price_cents);
    else list = [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return list;
  }, [items, author, sort]);

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

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the catalog…" className="pl-8" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-md border border-border bg-card px-2.5 py-2 text-sm font-sans">
            <option value="new">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="free">Free first</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button onClick={() => setCat("")} className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${cat === "" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>All</button>
          {CATALOG_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${cat === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{c}</button>
          ))}
        </div>

        {author && (
          <div className="mt-3">
            <button onClick={() => setAuthor("")} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary font-sans">
              By {author} <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {items === null && <div className="mt-10 flex items-center gap-2 text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
        {items && view.length === 0 && <p className="mt-10 text-center text-sm text-muted-foreground font-sans">No published resources found.</p>}
        {items && view.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {view.map((it) => (
              <Card key={it.token} className="flex h-full flex-col border-border transition-all hover:border-primary/50 hover:shadow-premium">
                <CardContent className="flex h-full flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">{it.category ?? "Other"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${it.price_cents > 0 ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary"}`}>{priceLabel(it.price_cents)}</span>
                  </div>
                  <Link to={`/shared/${it.token}`} className="group mt-2 block">
                    <h3 className="font-serif text-base font-semibold leading-snug group-hover:text-primary">{it.title}</h3>
                  </Link>
                  {it.author_name && (
                    <button onClick={() => setAuthor(it.author_name!)} className="mt-0.5 self-start text-xs text-muted-foreground hover:text-primary font-sans">by {it.author_name}</button>
                  )}
                  {it.preview && <p className="mt-1.5 line-clamp-3 flex-1 text-xs text-muted-foreground font-sans">{it.preview}</p>}
                  {it.license && <div className="mt-2 text-[11px] text-muted-foreground font-sans">{it.license}</div>}
                  <Link to={`/shared/${it.token}`} className="group mt-3 inline-flex items-center text-sm font-medium text-primary font-sans">
                    View <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogPage;
