import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Sparkles, ArrowRight, BookHeart, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicSeries, type PublicSeries } from "@/lib/series";
import CreateCtaBand from "@/components/app/CreateCtaBand";
import { BRAND } from "@/lib/tools";

// Public, read-only series storefront: the shared universe and its published
// books, each linking to its public reader. No sign-in required.
const PublicSeriesPage = () => {
  const { token } = useParams();
  const [series, setSeries] = useState<PublicSeries | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    if (!token) { setState("missing"); return; }
    getPublicSeries(token).then((s) => { if (s) { setSeries(s); setState("ready"); } else setState("missing"); }).catch(() => setState("missing"));
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold" /><span className="font-serif text-base font-bold">{BRAND}</span></Link>
          <Link to="/catalog" className="text-sm text-primary hover:underline font-sans">Browse the catalog</Link>
        </div>
      </nav>

      <div className="container max-w-4xl mx-auto px-6 py-10">
        {state === "loading" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4"><Skeleton className="h-3 w-16" /><Skeleton className="mt-2 h-5 w-2/3" /><Skeleton className="mt-2 h-3 w-full" /></div>
            ))}
          </div>
        )}
        {state === "missing" && (
          <div className="py-20 text-center">
            <h1 className="font-serif text-2xl font-bold">This series isn’t available</h1>
            <p className="mt-2 text-muted-foreground font-sans">The link may be wrong, or the series isn’t public.</p>
            <Link to="/catalog" className="mt-4 inline-block text-primary hover:underline font-sans">Browse the catalog</Link>
          </div>
        )}
        {state === "ready" && series && (
          <>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-4">
              <Layers className="w-4 h-4 text-gold" /><span className="text-sm text-gold-light font-medium font-sans">Series</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">{series.title}</h1>
            {series.author && (
              <Link to={`/catalog/author/${encodeURIComponent(series.author)}`} className="mt-1 inline-block text-sm text-muted-foreground hover:text-primary font-sans">by {series.author}</Link>
            )}
            {series.premise && <p className="mt-3 max-w-2xl text-muted-foreground font-sans">{series.premise}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-sans">
              {series.setting && <span>Setting: {series.setting}</span>}
              {series.objective && <span>Objective: {series.objective}</span>}
              {series.culture && <span>Culture: {series.culture}</span>}
              {series.language && <span>Language: {series.language}</span>}
            </div>

            {series.books.length === 0 ? (
              <p className="mt-10 text-center text-sm text-muted-foreground font-sans">No published books in this series yet.</p>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {series.books.map((b, i) => (
                  <Card key={b.token} className="hover-lift border-border transition-premium hover:border-primary/50">
                    <CardContent className="p-4">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">Book {b.series_index ?? i + 1}</div>
                      <Link to={`/shared/${b.token}`} className="group mt-1 flex items-start gap-2">
                        <BookHeart className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <h3 className="font-serif text-base font-semibold leading-snug group-hover:text-primary">{b.title}</h3>
                      </Link>
                      {b.preview && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground font-sans">{b.preview}</p>}
                      <Link to={`/shared/${b.token}`} className="group mt-2 inline-flex items-center text-sm font-medium text-primary font-sans">Read <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <CreateCtaBand
              heading={`Create your own series on ${BRAND}`}
              sub="Build an illustrated, multi-book series with a shared universe — then publish it as a public page like this one."
              cta="Start free"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PublicSeriesPage;
