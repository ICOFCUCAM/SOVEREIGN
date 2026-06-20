import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Crown, Zap, Library, FileText, BookOpen, BookHeart, GraduationCap, Palette, School,
  Store, TrendingUp, Eye, Download, Rocket, Clock, Image as ImageIcon, Send, Layers, Globe, Lightbulb,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { fetchPlanStatus, startUpgrade, type PlanStatus } from "@/lib/session";
import { listDocuments, catalogList, type DocSummary, type DocKind, type CatalogItem } from "@/lib/documents";
import { planDisplayName } from "@/lib/plans";
import { STUDIO_THEME, type Studio } from "@/lib/studio-theme";
import GettingStarted from "@/components/app/GettingStarted";

// One-click "create" tiles spanning the four studios, each in its studio colour.
const CREATE: { label: string; to: string; icon: typeof FileText; studio: Studio }[] = [
  { label: "CV", to: "/cv", icon: FileText, studio: "career" },
  { label: "Book", to: "/book", icon: BookOpen, studio: "publishing" },
  { label: "Storybook", to: "/storybook", icon: BookHeart, studio: "educational" },
  { label: "Textbook", to: "/primary-books", icon: School, studio: "educational" },
  { label: "Workbook", to: "/workbooks", icon: GraduationCap, studio: "educational" },
  { label: "Coloring book", to: "/coloring", icon: Palette, studio: "educational" },
];

const KIND_NOUN: Record<DocKind, string> = {
  cv: "CV", tailored: "tailored CV", "cover-letter": "cover letter", book: "book",
  cover: "book cover", storybook: "storybook", illustration: "illustration",
};
const KIND_ICON: Record<DocKind, typeof FileText> = {
  cv: FileText, tailored: FileText, "cover-letter": FileText, book: BookOpen,
  cover: ImageIcon, storybook: BookHeart, illustration: ImageIcon,
};
const trendScore = (i: CatalogItem) => (i.download_count ?? 0) * 3 + (i.view_count ?? 0);

const Dashboard = () => {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [market, setMarket] = useState<CatalogItem[]>([]);

  useEffect(() => {
    fetchPlanStatus().then(setStatus).catch(() => {});
    listDocuments().then(setDocs).catch(() => setDocs([]));
    catalogList(undefined, undefined, "new").then(setMarket).catch(() => {});
  }, []);

  const all = useMemo(() => docs ?? [], [docs]);
  const isPaid = !!status && status.plan !== "free";
  const used = status?.used ?? 0, lim = status?.lim ?? 0;
  const pct = lim > 0 ? Math.min(100, Math.round((used / lim) * 100)) : 0;
  const imgUsed = status?.imagesUsed ?? 0, imgLim = status?.imagesLim ?? 0;
  const imgPct = imgLim > 0 ? Math.min(100, Math.round((imgUsed / imgLim) * 100)) : 0;

  const recent = all.slice(0, 4);
  const counts = useMemo(() => {
    const m = new Map<DocKind, number>();
    for (const d of all) m.set(d.kind, (m.get(d.kind) ?? 0) + 1);
    return m;
  }, [all]);
  const published = all.filter((d) => d.listed).length;
  const sharedOnly = all.filter((d) => d.shared && !d.listed).length;
  const drafts = all.filter((d) => !d.shared).length;
  const totalViews = all.reduce((s, d) => s + (d.view_count ?? 0), 0);
  const totalDownloads = all.reduce((s, d) => s + (d.download_count ?? 0), 0);

  const trending = useMemo(() => [...market].filter((i) => trendScore(i) > 0).sort((a, b) => trendScore(b) - trendScore(a)).slice(0, 4), [market]);
  const recentPubs = market.slice(0, 4);

  // Smart next-step: pick the single most relevant action for this creator
  // right now. Priority order: drafts → unpublished → growth → upgrade.
  const nudge: { msg: string; cta: string; to: string } | null = useMemo(() => {
    if (docs === null) return null;
    if (drafts > 0) return { msg: `You have ${drafts} unpublished draft${drafts > 1 ? "s" : ""}.`, cta: "Go to library", to: "/library" };
    if (sharedOnly > 0) return { msg: `${sharedOnly} work${sharedOnly > 1 ? "s" : ""} shared but not listed on the marketplace.`, cta: "List on marketplace", to: "/library" };
    if (published > 0 && totalViews === 0) return { msg: "Your published work has no views yet. Share the link to get your first readers.", cta: "Browse marketplace", to: "/catalog" };
    if (published === 0 && all.length > 0) return { msg: "You have content but nothing published yet. List your best work and reach an audience.", cta: "Open publishing center", to: "/publishing" };
    if (imgPct >= 70 && !isPaid) return { msg: `You've used ${imgPct}% of your image credits this month. Upgrade to keep creating.`, cta: "See plans", to: "/pricing" };
    return null;
  }, [docs, drafts, sharedOnly, published, totalViews, all.length, imgPct, isPaid]);

  const SNAPSHOT: { kind: DocKind; label: string; icon: typeof FileText }[] = [
    { kind: "book", label: "Books", icon: BookOpen },
    { kind: "storybook", label: "Storybooks", icon: BookHeart },
    { kind: "cv", label: "CVs", icon: FileText },
    { kind: "cover-letter", label: "Cover letters", icon: FileText },
    { kind: "illustration", label: "Illustrations", icon: ImageIcon },
    { kind: "cover", label: "Covers", icon: ImageIcon },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Command center</h1>
          <p className="mt-1 text-muted-foreground font-sans">Create, publish and grow — across career, publishing, education and the marketplace.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="heroOutline" size="sm"><Link to="/library"><Library className="mr-1.5 h-4 w-4" /> Library</Link></Button>
          <Button asChild variant="heroOutline" size="sm"><Link to="/catalog"><Store className="mr-1.5 h-4 w-4" /> Marketplace</Link></Button>
        </div>
      </motion.div>

      {/* Plan / usage */}
      <Card className="mt-6 border-border">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isPaid ? <Crown className="h-4 w-4 text-gold" /> : <Zap className="h-4 w-4 text-primary" />}
              <span className="font-sans text-sm font-semibold">{planDisplayName(status?.plan)} plan</span>
            </div>
            <div className="mt-3 grid max-w-xl gap-3 sm:grid-cols-2">
              {!isPaid && status && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground font-sans"><span>{used}/{lim} text</span><span>{Math.max(0, lim - used)} left</span></div>
                  <Progress value={pct} className="h-2" />
                </div>
              )}
              {status && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground font-sans"><span>{imgUsed}/{imgLim} image credits</span><span>{Math.max(0, imgLim - imgUsed)} left</span></div>
                  <Progress value={imgPct} className="h-2" />
                </div>
              )}
            </div>
          </div>
          {!isPaid && (
            <Button variant="hero" onClick={() => startUpgrade("creator").catch(() => {})}><Crown className="mr-2 h-4 w-4" /> Upgrade</Button>
          )}
        </CardContent>
      </Card>

      {/* Smart next-step nudge — one contextual action, derived from real state */}
      {nudge && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/[0.05] px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm font-sans text-foreground">{nudge.msg}</p>
          </div>
          <Button asChild variant="heroOutline" size="sm" className="shrink-0">
            <Link to={nudge.to}>{nudge.cta} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </motion.div>
      )}

      {/* First-run onboarding for empty accounts */}
      {docs !== null && all.length === 0 && <GettingStarted />}

      {/* Continue working */}
      {recent.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold"><Clock className="h-4 w-4 text-gold" /> Continue working</h2>
            <Link to="/library" className="text-sm text-primary font-sans hover:underline">View all</Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((d) => {
              const Icon = KIND_ICON[d.kind] ?? FileText;
              const statusLabel = d.listed ? "Published" : d.shared ? "Shared" : "Draft";
              const statusClass = d.listed
                ? "bg-primary/10 text-primary"
                : d.shared
                ? "bg-gold/15 text-gold"
                : "bg-border text-muted-foreground";
              return (
                <Link key={d.id} to={`/library?open=${d.id}`} className="group block">
                  <Card className="h-full border-border transition-all hover:border-primary/50 hover:shadow-premium">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Icon className="h-5 w-5 text-primary" />
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold font-sans ${statusClass}`}>{statusLabel}</span>
                      </div>
                      <div className="mt-2 truncate font-sans text-sm font-semibold">{d.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground font-sans">{KIND_NOUN[d.kind] ?? "document"}</div>
                      <span className="mt-2 inline-flex items-center text-xs font-medium text-primary font-sans">Resume <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Create new */}
      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold">Create new</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CREATE.map((c) => {
            const t = STUDIO_THEME[c.studio];
            return (
              <Link key={c.to} to={c.to} className="group">
                <Card className={`h-full border-border transition-all hover:shadow-premium ${t.hoverBorder}`}>
                  <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.bg}`}><c.icon className={`h-5 w-5 ${t.text}`} /></span>
                    <span className="font-sans text-sm font-semibold">{c.label}</span>
                    <span className="text-[11px] text-muted-foreground font-sans">{t.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Publishing center + Creator growth */}
      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border">
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 font-serif text-base font-semibold"><Rocket className="h-4 w-4 text-publishing" /> Publishing center</h2>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[{ n: published, l: "Published" }, { n: sharedOnly, l: "Shared" }, { n: drafts, l: "Drafts" }].map((s) => (
                <div key={s.l} className="rounded-lg border border-border p-3">
                  <div className="font-serif text-2xl font-bold">{s.n}</div>
                  <div className="text-xs text-muted-foreground font-sans">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="heroOutline" size="sm"><Link to="/publishing"><Send className="mr-1 h-3.5 w-3.5" /> Distribution center</Link></Button>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground"><Link to="/series"><Layers className="mr-1 h-3.5 w-3.5" /> Series</Link></Button>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground"><Link to="/editions"><Globe className="mr-1 h-3.5 w-3.5" /> Editions</Link></Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 font-serif text-base font-semibold"><TrendingUp className="h-4 w-4 text-gold" /> Creator growth</h2>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[{ n: published, l: "Published", icon: Rocket }, { n: totalViews, l: "Views", icon: Eye }, { n: totalDownloads, l: "Downloads", icon: Download }].map((s) => (
                <div key={s.l} className="rounded-lg border border-border p-3">
                  <s.icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                  <div className="font-serif text-2xl font-bold">{s.n}</div>
                  <div className="text-xs text-muted-foreground font-sans">{s.l}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground font-sans">Across everything you've published to the marketplace. Publish more to grow your reach.</p>
          </CardContent>
        </Card>
      </div>

      {/* Library snapshot */}
      {all.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold">Your library</h2>
            <Link to="/library" className="text-sm text-primary font-sans hover:underline">Open library</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SNAPSHOT.filter((s) => (counts.get(s.kind) ?? 0) > 0).map((s) => (
              <Link key={s.kind} to={`/library?kind=${encodeURIComponent(s.kind)}`} className="group">
                <Card className="border-border transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-3 p-4">
                    <s.icon className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-serif text-lg font-bold leading-none">{counts.get(s.kind)}</div>
                      <div className="text-xs text-muted-foreground font-sans">{s.label}</div>
                    </div>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Marketplace activity */}
      {(trending.length > 0 || recentPubs.length > 0) && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold"><Store className="h-4 w-4 text-marketplace" /> Marketplace activity</h2>
            <Link to="/catalog" className="text-sm text-primary font-sans hover:underline">Browse all</Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {trending.length > 0 && (
              <Card className="border-border"><CardContent className="p-5">
                <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold font-sans"><TrendingUp className="h-4 w-4 text-gold" /> Trending now</div>
                <ul className="divide-y divide-border">
                  {trending.map((it) => (
                    <li key={it.token} className="py-2"><Link to={`/shared/${it.token}`} className="group flex items-center justify-between gap-2">
                      <span className="min-w-0"><span className="block truncate text-sm font-medium font-sans group-hover:text-primary">{it.title}</span><span className="text-xs text-muted-foreground font-sans">{it.category ?? "Other"}{it.author_name ? ` · ${it.author_name}` : ""}</span></span>
                      <span className="shrink-0 text-xs text-muted-foreground font-sans">{(it.download_count ?? 0)} ↓</span>
                    </Link></li>
                  ))}
                </ul>
              </CardContent></Card>
            )}
            {recentPubs.length > 0 && (
              <Card className="border-border"><CardContent className="p-5">
                <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold font-sans"><Clock className="h-4 w-4 text-gold" /> Recently published</div>
                <ul className="divide-y divide-border">
                  {recentPubs.map((it) => (
                    <li key={it.token} className="py-2"><Link to={`/shared/${it.token}`} className="group flex items-center justify-between gap-2">
                      <span className="min-w-0"><span className="block truncate text-sm font-medium font-sans group-hover:text-primary">{it.title}</span><span className="text-xs text-muted-foreground font-sans">{it.category ?? "Other"}{it.author_name ? ` · ${it.author_name}` : ""}</span></span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${it.price_cents > 0 ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary"}`}>{it.price_cents > 0 ? `$${(it.price_cents / 100).toFixed(2)}` : "Free"}</span>
                    </Link></li>
                  ))}
                </ul>
              </CardContent></Card>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
