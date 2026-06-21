import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Crown, Zap, Library, FileText, BookOpen, BookHeart, GraduationCap, Palette, School,
  Store, TrendingUp, Eye, Download, Rocket, Clock, Image as ImageIcon, Send, Layers, Globe, Lightbulb,
  Sparkles, CheckCircle2, XCircle, PenLine, Share2, Headphones,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchPlanStatus, startUpgrade, type PlanStatus } from "@/lib/session";
import { listDocuments, catalogList, type DocSummary, type DocKind, type CatalogItem } from "@/lib/documents";
import { wankongListingsByDoc } from "@/lib/wankong";
import CountUp from "@/components/brand/CountUp";
import { planDisplayName } from "@/lib/plans";
import { STUDIO_THEME, type Studio } from "@/lib/studio-theme";
import GettingStarted from "@/components/app/GettingStarted";
import ActivationChecklist from "@/components/app/ActivationChecklist";
import { getAiActivity, type AiActivity } from "@/lib/ai-activity-log";
import { getBatchUsage } from "@/lib/editions";

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
  cover: "book cover", storybook: "storybook", illustration: "illustration", audiobook: "audiobook",
};
const KIND_ICON: Record<DocKind, typeof FileText> = {
  cv: FileText, tailored: FileText, "cover-letter": FileText, book: BookOpen,
  cover: ImageIcon, storybook: BookHeart, illustration: ImageIcon, audiobook: Headphones,
};
const trendScore = (i: CatalogItem) => (i.download_count ?? 0) * 3 + (i.view_count ?? 0);

// Compact relative time for orientation on recent-work cards.
const relTime = (iso: string): string => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return "just now";
  if (s < 86_400) { const h = Math.floor(s / 3600); return `${h}h ago`; }
  const d = Math.floor(s / 86_400);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return mo < 12 ? `${mo}mo ago` : `${Math.floor(mo / 12)}y ago`;
};

// Consistent body section header — an eyebrow category tag over a serif title,
// the same intentional system the homepage uses, so the dashboard body reads as
// a command center rather than a stack of generic admin widgets.
const SectionHead = ({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) => (
  <div className="flex items-end justify-between gap-3">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 font-sans">{eyebrow}</p>
      <h2 className="mt-1 font-serif text-xl font-bold tracking-tight">{title}</h2>
    </div>
    {action}
  </div>
);

const Dashboard = () => {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [market, setMarket] = useState<CatalogItem[]>([]);
  const [aiLog] = useState<AiActivity[]>(() => getAiActivity().slice(0, 5));
  const [batchUnits, setBatchUnits] = useState<number | null>(null);
  const [wankongLive, setWankongLive] = useState(0);

  useEffect(() => {
    fetchPlanStatus().then(setStatus).catch(() => {});
    getBatchUsage().then(setBatchUnits).catch(() => {});
    listDocuments().then(setDocs).catch(() => setDocs([]));
    catalogList(undefined, undefined, "new").then(setMarket).catch(() => {});
    wankongListingsByDoc()
      .then((m) => setWankongLive(Object.values(m).filter((l) => l.status === "live").length))
      .catch(() => {});
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
  const sharedTotal = all.filter((d) => d.shared).length;
  const drafts = all.filter((d) => !d.shared).length;
  const totalViews = all.reduce((s, d) => s + (d.view_count ?? 0), 0);
  const totalDownloads = all.reduce((s, d) => s + (d.download_count ?? 0), 0);

  // The creator's real publishing funnel, framed like the homepage's numbered
  // lifecycle (Create → Distribute → Reach). Every count is real.
  const PIPELINE = [
    { n: "01", l: "Created", v: all.length, to: "/library", icon: PenLine, tint: "hsl(221 83% 66%)" },
    { n: "02", l: "Shared", v: sharedTotal, to: "/library?filter=shared", icon: Share2, tint: "hsl(160 84% 50%)" },
    { n: "03", l: "Listed", v: published, to: "/library?filter=listed", icon: Store, tint: "hsl(38 92% 58%)" },
    { n: "04", l: "Reader views", v: totalViews, to: "/insights", icon: Eye, tint: "hsl(262 83% 68%)" },
  ];

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

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Working late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const COCKPIT = [
    { v: published, l: "Published", to: "/library?filter=listed" },
    { v: totalViews, l: "Views", to: "/insights" },
    { v: totalDownloads, l: "Downloads", to: "/insights" },
    { v: wankongLive, l: "Live on Wankong", to: "/publishing#wankong" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Creator cockpit — the page opens on the creator's real headline numbers,
          framed like a media business's command center. No invented metrics. */}
      <section className="relative overflow-hidden text-white" style={{ background: "radial-gradient(120% 90% at 50% -10%, hsl(222 47% 12%) 0%, hsl(222 47% 7%) 45%, hsl(224 60% 4%) 100%)" }}>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 left-1/4 h-[26rem] w-[26rem] animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/22 blur-[120px]" />
          <div className="absolute -top-16 right-1/4 h-[22rem] w-[22rem] animate-glow-pulse rounded-full bg-[hsl(262_83%_58%)]/22 blur-[120px]" style={{ animationDelay: "2s" }} />
        </div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(262_83%_64%)]/60 to-transparent" />
        <div className="container relative max-w-6xl px-6 pb-10 pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-display text-3xl font-bold tracking-tight md:text-4xl">{greeting}</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 font-sans">
                {isPaid ? <Crown className="h-3.5 w-3.5 text-gold" /> : <Zap className="h-3.5 w-3.5 text-[hsl(217_91%_70%)]" />} {planDisplayName(status?.plan)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/library" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10"><Library className="h-4 w-4" /> Library</Link>
              <Link to="/catalog" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10"><Store className="h-4 w-4" /> Marketplace</Link>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
            {COCKPIT.map((s) => (
              <Link key={s.l} to={s.to} className="group bg-[hsl(222_47%_8%)] px-4 py-4 transition-colors hover:bg-[hsl(222_47%_11%)]">
                <div className="font-serif text-3xl font-bold text-white"><CountUp value={s.v} /></div>
                <div className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-white/45">{s.l}</div>
              </Link>
            ))}
          </div>

          {status && (
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-1 flex-wrap gap-x-8 gap-y-2">
                {!isPaid && (
                  <div className="min-w-[150px] flex-1">
                    <div className="mb-1 flex justify-between font-sans text-[11px] text-white/50"><span>{used}/{lim} text</span><span>{Math.max(0, lim - used)} left</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[hsl(221_83%_60%)] to-[hsl(262_83%_66%)]" style={{ width: `${pct}%` }} /></div>
                  </div>
                )}
                <div className="min-w-[150px] flex-1">
                  <div className="mb-1 flex justify-between font-sans text-[11px] text-white/50"><span>{imgUsed}/{imgLim} image credits</span><span>{Math.max(0, imgLim - imgUsed)} left</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[hsl(38_92%_56%)] to-[hsl(24_86%_52%)]" style={{ width: `${imgPct}%` }} /></div>
                </div>
              </div>
              {!isPaid ? (
                <button onClick={() => startUpgrade("creator").catch(() => {})} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[hsl(38_92%_54%)] to-[hsl(24_86%_50%)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03]">
                  <Crown className="h-4 w-4" /> Upgrade
                </button>
              ) : (
                <Link to="/account" className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10">Buy image credits</Link>
              )}
            </div>
          )}
          {batchUnits != null && batchUnits > 0 && (
            <p className="mt-3 font-sans text-[11px] text-white/45"><span className="font-semibold text-white/80">{batchUnits.toLocaleString()}</span> heavy operations this month — bulk translation, editions, batch covers</p>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* Knowledge pipeline — the creator's real funnel, rendered as a connected
          rail in the homepage's numbered-lifecycle language. Extends the dark
          command-center feel into the body instead of dropping into cards. */}
      {docs !== null && all.length > 0 && (
        <section className="relative overflow-hidden border-b border-white/5 text-white" style={{ background: "linear-gradient(180deg, hsl(222 47% 7%) 0%, hsl(224 60% 4%) 100%)" }}>
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/3 top-0 h-40 w-[28rem] animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/12 blur-[120px]" />
          </div>
          <div className="container max-w-6xl px-6 py-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-xs text-white/40">PIPELINE</span>
              <span className="h-px w-8 bg-white/15" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Your knowledge, in motion</span>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              {PIPELINE.map((p, i) => (
                <div key={p.l} className="flex flex-1 items-center">
                  <Link to={p.to} className="group relative flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]">
                    <div className="flex items-center justify-between">
                      <p.icon className="h-5 w-5" style={{ color: p.tint }} />
                      <span className="font-mono text-[11px] text-white/30">{p.n}</span>
                    </div>
                    <div className="mt-3 font-serif text-3xl font-bold"><CountUp value={p.v} /></div>
                    <div className="text-[11px] uppercase tracking-wide text-white/45 font-sans">{p.l}</div>
                  </Link>
                  {i < PIPELINE.length - 1 && (
                    <svg className="mx-1 hidden h-3 w-8 shrink-0 md:block" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden>
                      <line x1="0" y1="2" x2="100" y2="2" stroke="hsl(0 0% 100% / 0.12)" strokeWidth="2" />
                      <line x1="0" y1="2" x2="100" y2="2" stroke={p.tint} strokeWidth="2" strokeDasharray="2 8" className="animate-flow" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

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

      {/* Activation checklist for started-but-not-activated accounts */}
      {docs !== null && all.length > 0 && (
        <ActivationChecklist state={{ created: all.length > 0, shared: all.some((d) => d.shared), listed: published > 0, hasReader: totalViews > 0 }} />
      )}

      {/* Continue working */}
      {recent.length > 0 && (
        <section className="mt-10">
          <SectionHead eyebrow="Recent" title="Continue working" action={<Link to="/library" className="text-sm text-primary font-sans hover:underline">View all</Link>} />
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
                  <Card className="hover-lift h-full border-border transition-premium hover:border-primary/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Icon className="h-5 w-5 text-primary" />
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold font-sans ${statusClass}`}>{statusLabel}</span>
                      </div>
                      <div className="mt-2 truncate font-sans text-sm font-semibold">{d.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground font-sans">{KIND_NOUN[d.kind] ?? "document"} · {relTime(d.created_at)}</div>
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
        <SectionHead eyebrow="Studios" title="Create new" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CREATE.map((c) => {
            const t = STUDIO_THEME[c.studio];
            return (
              <Link key={c.to} to={c.to} className="group">
                <Card className={`hover-lift h-full border-border transition-premium ${t.hoverBorder}`}>
                  <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${t.bg}`}><c.icon className={`h-5 w-5 ${t.text}`} /></span>
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
              {[{ n: published, l: "Published", to: "/library?filter=listed" }, { n: sharedOnly, l: "Shared", to: "/library?filter=shared" }, { n: drafts, l: "Drafts", to: "/library?filter=drafts" }].map((s) => (
                <Link key={s.l} to={s.to} className={`group rounded-lg border p-3 transition-colors hover:border-primary/40 ${s.n > 0 ? "border-border" : "border-dashed border-border/60"}`}>
                  <div className={`font-serif text-2xl font-bold ${s.n === 0 ? "text-muted-foreground/50" : ""}`}>{s.n}</div>
                  <div className="text-xs text-muted-foreground font-sans">{s.l}</div>
                </Link>
              ))}
            </div>
            {drafts > 0 && (
              <p className="mt-3 rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground font-sans border border-border/60">
                {drafts} draft{drafts > 1 ? "s" : ""} ready to share — open the library to publish or share a link.
              </p>
            )}
            {wankongLive > 0 && (
              <Link to="/publishing#wankong" className="mt-3 flex items-center gap-2 rounded-lg border border-publishing/30 bg-publishing/[0.05] px-3 py-2 text-xs font-sans text-publishing transition-colors hover:bg-publishing/10">
                <Store className="h-3.5 w-3.5 shrink-0" />
                <span><span className="font-semibold">{wankongLive}</span> {wankongLive === 1 ? "title" : "titles"} live in the Wankong store</span>
                <ArrowRight className="ml-auto h-3.5 w-3.5" />
              </Link>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="heroOutline" size="sm"><Link to="/publishing"><Send className="mr-1 h-3.5 w-3.5" /> Distribution center</Link></Button>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground"><Link to="/series"><Layers className="mr-1 h-3.5 w-3.5" /> Series</Link></Button>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground"><Link to="/editions"><Globe className="mr-1 h-3.5 w-3.5" /> Editions</Link></Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-serif text-base font-semibold"><TrendingUp className="h-4 w-4 text-gold" /> Creator growth</h2>
              {published > 0 && <Link to="/insights" className="text-xs text-primary font-sans hover:underline">View insights</Link>}
            </div>
            {published === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border/60 px-4 py-6 text-center">
                <TrendingUp className="mx-auto h-6 w-6 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground font-sans">Publish your first work to see views and downloads here.</p>
                <Button asChild variant="heroOutline" size="sm" className="mt-3"><Link to="/publishing"><Send className="mr-1 h-3.5 w-3.5" /> Distribution center</Link></Button>
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[{ n: published, l: "Published", icon: Rocket }, { n: totalViews, l: "Views", icon: Eye }, { n: totalDownloads, l: "Downloads", icon: Download }].map((s) => (
                    <div key={s.l} className="rounded-lg border border-border p-3">
                      <s.icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                      <div className="font-serif text-2xl font-bold">{s.n}</div>
                      <div className="text-xs text-muted-foreground font-sans">{s.l}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground font-sans">Your published marketplace reach. Publish more to grow.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Library snapshot */}
      {all.length > 0 && (
        <section className="mt-10">
          <SectionHead eyebrow="Library" title="Your knowledge library" action={<Link to="/library" className="text-sm text-primary font-sans hover:underline">Open library</Link>} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SNAPSHOT.filter((s) => (counts.get(s.kind) ?? 0) > 0).map((s) => (
              <Link key={s.kind} to={`/library?kind=${encodeURIComponent(s.kind)}`} className="group">
                <Card className="hover-lift border-border transition-premium hover:border-primary/40">
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
          <SectionHead eyebrow="Marketplace" title="Marketplace activity" action={<Link to="/catalog" className="text-sm text-primary font-sans hover:underline">Browse all</Link>} />
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
      {aiLog.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Recent AI generations</h2>
          <Card className="mt-4 border-border"><CardContent className="divide-y divide-border p-0">
            {aiLog.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                {a.status === "ok" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <XCircle className="h-4 w-4 shrink-0 text-destructive/70" />}
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium font-sans">{a.tool}</span>
                  {a.description && <span className="ml-1.5 text-xs text-muted-foreground font-sans">{a.description}</span>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground font-sans">
                  {new Date(a.ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </CardContent></Card>
        </section>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
