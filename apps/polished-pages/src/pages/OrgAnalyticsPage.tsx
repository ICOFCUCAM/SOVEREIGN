import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, TrendingUp, Store, Languages, Users, Layers, BarChart3, Eye, Download, Loader2,
} from "lucide-react";
import SpineMark from "@/components/brand/SpineMark";
import {
  getOrganization, orgAnalytics, orgTrends, orgTopWorks, orgMemberContributions, orgLanguages,
  orgCollectionHealth, ROLE_LABEL, COLLECTION_KINDS,
  type OrgDetail, type OrgAnalytics, type OrgTrendRow, type OrgTopWork, type OrgContribution,
  type OrgLanguageRow, type OrgCollectionHealth, type CollectionKind,
} from "@/lib/organizations";

const KIND_LABEL: Record<string, string> = { book: "Book", storybook: "Storybook", cv: "CV", tailored: "Tailored", cover: "Cover", illustration: "Illustration", "cover-letter": "Cover letter" };
const COLLECTION_KIND_LABEL = Object.fromEntries(COLLECTION_KINDS.map((k) => [k.value, k.label])) as Record<CollectionKind, string>;
const monthLabel = (p: string) => new Date(p + "T00:00:00").toLocaleDateString(undefined, { month: "short" });

const Section = ({ icon: Icon, title, hint, children }: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <div className="mb-3 flex items-baseline gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="font-serif text-lg font-bold">{title}</h2>
      {hint && <span className="text-xs text-muted-foreground font-sans">{hint}</span>}
    </div>
    {children}
  </section>
);

const Bar = ({ value, max, className }: { value: number; max: number; className?: string }) => (
  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
    <div className={`h-full rounded-full ${className ?? "bg-gold-gradient"}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
  </div>
);

const OrgAnalyticsPage = () => {
  const { slug } = useParams();
  const [org, setOrg] = useState<OrgDetail | null | undefined>(undefined);
  const [stats, setStats] = useState<OrgAnalytics | null>(null);
  const [trends, setTrends] = useState<OrgTrendRow[]>([]);
  const [top, setTop] = useState<OrgTopWork[]>([]);
  const [contrib, setContrib] = useState<OrgContribution[]>([]);
  const [langs, setLangs] = useState<OrgLanguageRow[]>([]);
  const [health, setHealth] = useState<OrgCollectionHealth[]>([]);

  useEffect(() => {
    if (!slug) return;
    setOrg(undefined);
    getOrganization(slug).then((o) => {
      setOrg(o);
      if (o && o.my_role) {
        orgAnalytics(o.id).then(setStats).catch(() => {});
        orgTrends(o.id).then(setTrends).catch(() => {});
        orgTopWorks(o.id).then(setTop).catch(() => {});
        orgMemberContributions(o.id).then(setContrib).catch(() => {});
        orgLanguages(o.id).then(setLangs).catch(() => {});
        orgCollectionHealth(o.id).then(setHealth).catch(() => {});
      }
    }).catch(() => setOrg(null));
  }, [slug]);

  if (org === undefined) return <div className="flex min-h-[60vh] items-center justify-center"><SpineMark animated /></div>;
  if (org === null || !org.my_role) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <SpineMark className="mx-auto justify-center" />
        <h1 className="mt-6 font-serif text-2xl font-bold">Analytics unavailable</h1>
        <p className="mt-2 text-muted-foreground font-sans">You need to be a member of this organization to view its analytics.</p>
        <Link to="/organizations" className="mt-6 inline-block text-primary hover:underline font-sans">← Back to organizations</Link>
      </div>
    );
  }

  const trendMax = Math.max(...trends.map((t) => t.created), 1);
  const engageMax = Math.max(...top.map((w) => (w.views ?? 0) + (w.downloads ?? 0)), 1);
  const langMax = Math.max(...langs.map((l) => l.total), 1);
  const contribMax = Math.max(...contrib.map((c) => c.works), 1);
  const hasTrendData = trends.some((t) => t.created > 0);

  const SUMMARY = stats ? [
    { v: stats.works, l: "Works" }, { v: stats.published, l: "Published" }, { v: stats.views, l: "Views" },
    { v: stats.downloads, l: "Downloads" }, { v: stats.languages, l: "Languages" }, { v: stats.translations, l: "Editions" },
    { v: stats.members, l: "Members" }, { v: stats.collections, l: "Collections" },
  ] : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <Link to={`/organizations/${org.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-sans"><ArrowLeft className="h-4 w-4" /> {org.name}</Link>
        <Link to={`/org/${org.slug}`} className="text-sm font-medium text-primary hover:underline font-sans">Storefront →</Link>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="font-serif text-3xl font-bold tracking-tight">Analytics</h1>
      </div>
      <p className="mt-1 text-muted-foreground font-sans">How {org.name} is creating, localizing and publishing — and how its catalog performs.</p>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {!stats ? <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div> :
          SUMMARY.map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="font-serif text-2xl font-bold tabular-nums">{s.v}</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground font-sans">{s.l}</div>
            </div>
          ))}
      </div>

      {/* Activity trends */}
      <Section icon={TrendingUp} title="Activity trends" hint="last 6 months">
        {!hasTrendData ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground font-sans">No activity in the last six months yet. Created works, listings and editions will chart here.</p>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex flex-wrap gap-4 text-xs font-sans">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold-gradient" /> Created</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-marketplace" /> Listed</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-educational" /> Editions</span>
            </div>
            <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
              {trends.map((t) => (
                <div key={t.period} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 110 }}>
                    <div className="w-2.5 rounded-t bg-gold-gradient sm:w-3" style={{ height: `${(t.created / trendMax) * 100}%` }} title={`${t.created} created`} />
                    <div className="w-2.5 rounded-t bg-marketplace sm:w-3" style={{ height: `${(t.published / trendMax) * 100}%` }} title={`${t.published} listed`} />
                    <div className="w-2.5 rounded-t bg-educational sm:w-3" style={{ height: `${(t.editions / trendMax) * 100}%` }} title={`${t.editions} editions`} />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-sans">{monthLabel(t.period)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Marketplace performance */}
        <Section icon={Store} title="Marketplace performance" hint="top works">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No works in this organization yet.</p>
          ) : (
            <div className="space-y-2.5">
              {top.map((w, i) => (
                <div key={`${w.title}-${i}`}>
                  <div className="flex items-center justify-between gap-2 text-sm font-sans">
                    <span className="min-w-0 truncate font-medium">{w.title} <span className="text-xs text-muted-foreground">· {KIND_LABEL[w.kind] ?? w.kind}</span></span>
                    <span className="shrink-0 text-xs text-muted-foreground inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3" /> {w.views}</span>
                      <span className="inline-flex items-center gap-0.5"><Download className="h-3 w-3" /> {w.downloads}</span>
                    </span>
                  </div>
                  <Bar value={(w.views ?? 0) + (w.downloads ?? 0)} max={engageMax} className="bg-marketplace" />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Localization */}
        <Section icon={Languages} title="Localization activity" hint="by language">
          {langs.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No content yet.</p>
          ) : (
            <div className="space-y-2.5">
              {langs.map((l) => (
                <div key={l.language}>
                  <div className="flex items-center justify-between text-sm font-sans"><span className="font-medium">{l.language}</span><span className="text-muted-foreground">{l.total}</span></div>
                  <Bar value={l.total} max={langMax} className="bg-educational" />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Member contributions */}
        <Section icon={Users} title="Member contributions" hint="works per member">
          {contrib.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No members yet.</p>
          ) : (
            <div className="space-y-2.5">
              {contrib.map((c) => (
                <div key={c.email}>
                  <div className="flex items-center justify-between gap-2 text-sm font-sans">
                    <span className="min-w-0 truncate font-medium">{c.email} <span className="text-xs text-muted-foreground">· {ROLE_LABEL[c.role]}</span></span>
                    <span className="shrink-0 text-xs text-muted-foreground">{c.published}/{c.works} published</span>
                  </div>
                  <Bar value={c.works} max={contribMax} />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Collection health */}
        <Section icon={Layers} title="Repository health" hint="items per repository">
          {health.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No repositories yet.</p>
          ) : (
            <div className="space-y-2">
              {health.map((h) => (
                <div key={h.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-semibold font-sans">{h.name} <span className="text-xs font-normal text-muted-foreground">· {COLLECTION_KIND_LABEL[h.kind]}</span></span>
                    <span className="shrink-0 text-xs text-muted-foreground font-sans">{h.items} item{h.items === 1 ? "" : "s"} · {h.published} published</span>
                  </div>
                  {h.items === 0 && <p className="mt-1 text-xs text-gold font-sans">Empty — add works to give this repository value.</p>}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
};

export default OrgAnalyticsPage;
