import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Eye, Download, Rocket, ArrowRight, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { listDocuments, type DocSummary } from "@/lib/documents";

const KIND_LABEL: Record<string, string> = {
  cv: "CVs", tailored: "Tailored CVs", "cover-letter": "Cover letters", book: "Books",
  cover: "Book covers", storybook: "Storybooks", illustration: "Illustrations",
};

// Creator analytics, computed entirely from the user's real published works —
// views, downloads, and reach by content type. No fabricated metrics.
const Insights = () => {
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  useEffect(() => { listDocuments().then(setDocs).catch(() => setDocs([])); }, []);

  const published = useMemo(() => (docs ?? []).filter((d) => d.listed), [docs]);
  const totals = useMemo(() => ({
    works: published.length,
    views: published.reduce((s, d) => s + (d.view_count ?? 0), 0),
    downloads: published.reduce((s, d) => s + (d.download_count ?? 0), 0),
  }), [published]);
  const convRate = totals.views > 0 ? Math.round((totals.downloads / totals.views) * 100) : 0;
  const ranked = useMemo(() => [...published].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)), [published]);
  const maxViews = ranked[0]?.view_count ?? 0;
  const byType = useMemo(() => {
    const m = new Map<string, { works: number; views: number; downloads: number }>();
    for (const d of published) {
      const cur = m.get(d.kind) ?? { works: 0, views: 0, downloads: 0 };
      cur.works += 1; cur.views += d.view_count ?? 0; cur.downloads += d.download_count ?? 0;
      m.set(d.kind, cur);
    }
    return Array.from(m.entries()).map(([kind, v]) => ({ kind, ...v })).sort((a, b) => b.views - a.views);
  }, [published]);

  const HEAD = [
    { label: "Published works", value: totals.works, icon: Rocket },
    { label: "Total views", value: totals.views, icon: Eye },
    { label: "Total downloads", value: totals.downloads, icon: Download },
    { label: "View → download", value: `${convRate}%`, icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight"><BarChart3 className="h-6 w-6 text-primary" /> Insights</h1>
        <p className="mt-1 text-muted-foreground font-sans">How your published work is performing — measured from real marketplace activity.</p>
      </motion.div>

      {docs === null ? (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="rounded-xl border border-border p-5"><Skeleton className="h-4 w-16" /><Skeleton className="mt-3 h-8 w-20" /></div>)}
        </div>
      ) : totals.works === 0 ? (
        <Card className="mt-8 border-dashed border-border">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-sans text-sm font-medium">No published work yet</p>
            <p className="max-w-sm text-sm text-muted-foreground font-sans">Once you list work on the marketplace, your views, downloads and reach will appear here.</p>
            <Button asChild variant="hero" size="sm" className="mt-1"><Link to="/library">Publish a work <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {HEAD.map((h) => (
              <Card key={h.label} className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans"><h.icon className="h-3.5 w-3.5" /> {h.label}</div>
                  <div className="mt-2 font-serif text-3xl font-bold">{typeof h.value === "number" ? h.value.toLocaleString() : h.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {byType.length > 1 && (
            <>
              <h2 className="mt-10 font-serif text-lg font-semibold">Reach by content type</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {byType.map((t) => (
                  <Card key={t.kind} className="border-border">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium capitalize text-muted-foreground font-sans">{KIND_LABEL[t.kind] ?? t.kind}</div>
                      <div className="mt-1 font-serif text-xl font-bold">{t.views.toLocaleString()}<span className="ml-1 text-xs font-normal text-muted-foreground">views</span></div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground font-sans">{t.works} work{t.works === 1 ? "" : "s"} · {t.downloads} download{t.downloads === 1 ? "" : "s"}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          <h2 className="mt-10 font-serif text-lg font-semibold">Performance by work</h2>
          <div className="mt-3 space-y-2">
            {ranked.map((d) => (
              <Card key={d.id} className="border-border">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <Link to={`/library?open=${d.id}`} className="truncate font-sans text-sm font-semibold hover:text-primary">{d.title}</Link>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gold-gradient" style={{ width: maxViews > 0 ? `${((d.view_count ?? 0) / maxViews) * 100}%` : "0%" }} />
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-4 text-xs text-muted-foreground font-sans">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {d.view_count ?? 0}</span>
                    <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {d.download_count ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Insights;
