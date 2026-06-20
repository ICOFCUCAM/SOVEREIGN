import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Store, Search, X, Eye, Download, TrendingUp, Clock, Star, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { catalogList, CATALOG_CATEGORIES, isAdmin, adminFeature, type CatalogItem, type CatalogSort } from "@/lib/documents";
import { getAuthorProfile, type AuthorProfile } from "@/lib/profiles";
import CatalogCard from "@/components/app/CatalogCard";
import { BRAND } from "@/lib/tools";

const trendScore = (i: CatalogItem) => (i.download_count ?? 0) * 3 + (i.view_count ?? 0);

// Public marketplace. Default view is a discovery homepage (Featured, Trending,
// Recently published, Browse by category). Searching or picking a category drops
// into a filtered grid. Reached as an author page via /catalog/author/:author.
const CatalogPage = () => {
  const { author: authorParam } = useParams();
  const navigate = useNavigate();
  const author = authorParam ?? "";
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [cat, setCat] = useState<string>("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CatalogSort>("new");
  const [admin, setAdmin] = useState(false);
  const [profile, setProfile] = useState<AuthorProfile | null>(null);

  const filtering = !!(query.trim() || cat || author);

  useEffect(() => { isAdmin().then(setAdmin).catch(() => {}); }, []);

  useEffect(() => {
    setProfile(null);
    if (author) getAuthorProfile(author).then(setProfile).catch(() => {});
  }, [author]);

  useEffect(() => {
    setItems(null);
    const id = setTimeout(() => {
      const f = !!(query.trim() || cat || author);
      // Discovery fetches the newest 200 and derives sections client-side.
      catalogList(cat || undefined, query.trim() || undefined, f ? sort : "new", author || undefined)
        .then(setItems).catch(() => setItems([]));
    }, query ? 300 : 0);
    return () => clearTimeout(id);
  }, [cat, query, sort, author]);

  const feature = async (it: CatalogItem) => {
    const next = !it.featured;
    setItems((prev) => prev?.map((x) => (x.token === it.token ? { ...x, featured: next } : x)) ?? null);
    try { await adminFeature(it.token, next); } catch { setItems((prev) => prev?.map((x) => (x.token === it.token ? { ...x, featured: !next } : x)) ?? null); }
  };

  const all = useMemo(() => items ?? [], [items]);
  const featured = useMemo(() => all.filter((i) => i.featured).slice(0, 6), [all]);
  const trending = useMemo(() => all.filter((i) => trendScore(i) > 0).sort((a, b) => trendScore(b) - trendScore(a)).slice(0, 6), [all]);
  const recent = useMemo(() => all.slice(0, 9), [all]);
  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of all) m.set(i.category ?? "Other", (m.get(i.category ?? "Other") ?? 0) + 1);
    return m;
  }, [all]);

  const Section = ({ icon: Icon, title, hint, list }: { icon: typeof Store; title: string; hint?: string; list: CatalogItem[] }) => (
    <section className="mt-10">
      <div className="flex items-baseline gap-2">
        <Icon className="h-4 w-4 text-gold" />
        <h2 className="font-serif text-xl font-bold">{title}</h2>
        {hint && <span className="text-xs text-muted-foreground font-sans">{hint}</span>}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((it) => <CatalogCard key={it.token} item={it} admin={admin} onFeature={feature} />)}
      </div>
    </section>
  );

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
            <span className="text-sm text-gold-light font-medium font-sans">{author ? "Author" : "Marketplace"}</span>
          </div>
          {author ? (
            <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Resources by <span className="text-gradient-gold italic">{author}</span></h1>
          ) : (
            <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Discover <span className="text-gradient-gold italic">published resources</span></h1>
          )}
          <p className="mt-2 text-muted-foreground font-sans">{author ? `Everything ${author} has published, newest first.` : "Storybooks, readers, workbooks and classroom materials published by the community."}</p>
          {author && profile && (
            <div className="mt-4 rounded-xl border border-border bg-card/50 p-4">
              {profile.bio && <p className="text-sm text-foreground font-sans">{profile.bio}</p>}
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground font-sans">
                <span><span className="font-semibold text-foreground">{profile.works}</span> published</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> <span className="font-semibold text-foreground">{profile.views}</span> views</span>
                <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" /> <span className="font-semibold text-foreground">{profile.downloads}</span> downloads</span>
              </div>
            </div>
          )}
        </motion.div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the marketplace…" className="pl-8" />
          </div>
          {filtering && !author && (
            <select value={sort} onChange={(e) => setSort(e.target.value as CatalogSort)} className="rounded-md border border-border bg-card px-2.5 py-2 text-sm font-sans">
              <option value="new">Recently published</option>
              <option value="trending">Trending</option>
              <option value="price">Price: low to high</option>
            </select>
          )}
        </div>

        {!author && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button onClick={() => setCat("")} className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${cat === "" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>All</button>
            {CATALOG_CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${cat === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{c}</button>
            ))}
          </div>
        )}

        {author && (
          <div className="mt-3">
            <button onClick={() => navigate("/catalog")} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary font-sans">
              By {author} <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {items === null && <div className="mt-10 flex items-center gap-2 text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}

        {/* Filtered / author view: flat grid */}
        {items && filtering && (
          all.length === 0
            ? <p className="mt-10 text-center text-sm text-muted-foreground font-sans">No published resources found.</p>
            : <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{all.map((it) => <CatalogCard key={it.token} item={it} admin={admin} onFeature={feature} />)}</div>
        )}

        {/* Discovery homepage: curated sections */}
        {items && !filtering && (
          all.length === 0
            ? <p className="mt-10 text-center text-sm text-muted-foreground font-sans">Nothing published yet — be the first to share something.</p>
            : (
              <>
                {featured.length > 0 && <Section icon={Star} title="Featured" hint="hand-picked" list={featured} />}
                {trending.length > 0 && <Section icon={TrendingUp} title="Trending now" hint="most downloaded" list={trending} />}
                <Section icon={Clock} title="Recently published" list={recent} />
                <section className="mt-10">
                  <div className="flex items-baseline gap-2"><Store className="h-4 w-4 text-gold" /><h2 className="font-serif text-xl font-bold">Browse by category</h2></div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CATALOG_CATEGORIES.map((c) => (
                      <button key={c} onClick={() => setCat(c)} className="group flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-left transition hover:border-primary/50">
                        <span className="text-sm font-medium font-sans">{c}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-sans">{categoryCounts.get(c) ?? 0} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )
        )}
      </div>
    </div>
  );
};

export default CatalogPage;
