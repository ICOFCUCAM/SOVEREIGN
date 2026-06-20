import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Sparkles, FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicCollection, type PublicCollection as PC } from "@/lib/collections";
import CatalogCard from "@/components/app/CatalogCard";
import CreateCtaBand from "@/components/app/CreateCtaBand";
import { BRAND } from "@/lib/tools";

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
        {state === "loading" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4"><Skeleton className="h-3 w-20" /><Skeleton className="mt-3 h-5 w-3/4" /><Skeleton className="mt-2 h-3 w-24" /><Skeleton className="mt-3 h-3 w-full" /></div>
            ))}
          </div>
        )}
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
            <p className="mt-1 text-sm text-muted-foreground font-sans">{col.items.length} {col.items.length === 1 ? "resource" : "resources"}</p>
            {col.description && <p className="mt-2 max-w-2xl text-muted-foreground font-sans text-pretty">{col.description}</p>}

            {col.items.length === 0 ? (
              <p className="mt-10 text-center text-sm text-muted-foreground font-sans">This collection has no public items yet.</p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {col.items.map((it) => <CatalogCard key={it.token} item={it} />)}
              </div>
            )}
            <CreateCtaBand
              heading={`Build your own collection on ${BRAND}`}
              sub="Group your storybooks, workbooks and resources into a shareable repository — for a class, a team, or the world."
              cta="Start free"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PublicCollection;
