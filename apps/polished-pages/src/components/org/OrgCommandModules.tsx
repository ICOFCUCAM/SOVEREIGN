import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, GitBranch, Layers, Languages, GraduationCap, Megaphone, MapPin, Store,
  ArrowRight, Rocket, Eye, Download,
} from "lucide-react";
import {
  orgLanguages, orgRegions, orgTopWorks, orgCollectionHealth, ORG_PRESENTATION, EDUCATIONAL_CATEGORIES,
  COLLECTION_KINDS,
  type OrgType, type OrgAnalytics, type OrgCategoryRow, type OrgLanguageRow, type OrgRegionRow,
  type OrgTopWork, type OrgCollectionHealth, type ModuleKey, type CollectionKind,
} from "@/lib/organizations";

const KIND_LABEL: Record<string, string> = { book: "Book", storybook: "Storybook", cv: "CV", tailored: "Tailored", cover: "Cover", illustration: "Illustration", "cover-letter": "Cover letter" };
const COLLECTION_KIND_LABEL = Object.fromEntries(COLLECTION_KINDS.map((k) => [k.value, k.label])) as Record<CollectionKind, string>;

const MODULE_META: Record<ModuleKey, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  catalog: { title: "Catalog health", icon: BookOpen },
  pipeline: { title: "Publishing pipeline", icon: GitBranch },
  series: { title: "Series", icon: Layers },
  localization: { title: "Localization coverage", icon: Languages },
  curriculum: { title: "Grades & subjects", icon: GraduationCap },
  assets: { title: "Educational assets", icon: GraduationCap },
  programs: { title: "Programs", icon: Megaphone },
  regions: { title: "Regional coverage", icon: MapPin },
  distribution: { title: "Distribution readiness", icon: Store },
  repositories: { title: "Repositories", icon: Layers },
};

const MiniBar = ({ value, max, className }: { value: number; max: number; className?: string }) => (
  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${className ?? "bg-gold-gradient"}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} /></div>
);
const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted-foreground font-sans">{children}</p>;

// The type-specific command center. A publisher sees a catalog and pipeline; a
// school sees grades and curriculum; an NGO/ministry sees programs and regional
// coverage — all from real data.
const OrgCommandModules = ({ type, orgId, stats, categories }: {
  type: OrgType; orgId: string; stats: OrgAnalytics | null; categories: OrgCategoryRow[];
}) => {
  const [langs, setLangs] = useState<OrgLanguageRow[]>([]);
  const [regions, setRegions] = useState<OrgRegionRow[]>([]);
  const [top, setTop] = useState<OrgTopWork[]>([]);
  const [health, setHealth] = useState<OrgCollectionHealth[]>([]);

  useEffect(() => {
    orgLanguages(orgId).then(setLangs).catch(() => {});
    orgRegions(orgId).then(setRegions).catch(() => {});
    orgTopWorks(orgId).then(setTop).catch(() => {});
    orgCollectionHealth(orgId).then(setHealth).catch(() => {});
  }, [orgId]);

  const pres = ORG_PRESENTATION[type];
  const works = stats?.works ?? 0;
  const published = stats?.published ?? 0;
  const drafts = Math.max(works - published, 0);
  const eduCats = categories.filter((c) => EDUCATIONAL_CATEGORIES.includes(c.category));
  const eduTotal = eduCats.reduce((s, c) => s + c.total, 0);

  const repos = (kinds: CollectionKind[]) => health.filter((h) => kinds.includes(h.kind));

  const RepoList = ({ rows, emptyHint }: { rows: OrgCollectionHealth[]; emptyHint: string }) =>
    rows.length === 0 ? <Empty>{emptyHint}</Empty> : (
      <div className="space-y-1.5">
        {rows.map((h) => (
          <div key={h.id} className="flex items-center justify-between gap-2 text-sm font-sans">
            <span className="min-w-0 truncate font-medium">{h.name} <span className="text-xs font-normal text-muted-foreground">· {COLLECTION_KIND_LABEL[h.kind]}</span></span>
            <span className="shrink-0 text-xs text-muted-foreground">{h.items} item{h.items === 1 ? "" : "s"}{h.published > 0 ? ` · ${h.published} published` : ""}</span>
          </div>
        ))}
      </div>
    );

  const renderModule = (key: ModuleKey) => {
    switch (key) {
      case "catalog":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div><div className="font-serif text-2xl font-bold tabular-nums">{published}</div><div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">Published</div></div>
              <div><div className="font-serif text-2xl font-bold tabular-nums">{drafts}</div><div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">Drafts</div></div>
              <div className="flex-1"><div className="mb-1 text-[11px] text-muted-foreground font-sans">{published}/{works} of catalog published</div><MiniBar value={published} max={works} className="bg-marketplace" /></div>
            </div>
            {top.length > 0 && (
              <div className="space-y-1 border-t border-border pt-2">
                {top.slice(0, 3).map((w, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs font-sans">
                    <span className="min-w-0 truncate">{w.title}</span>
                    <span className="shrink-0 text-muted-foreground inline-flex items-center gap-1.5"><span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3" />{w.views}</span><span className="inline-flex items-center gap-0.5"><Download className="h-3 w-3" />{w.downloads}</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "pipeline":
        return (
          <div>
            <div className="flex items-center gap-2 text-center">
              {[{ v: drafts, l: "Drafts" }, { v: published, l: "Listed" }].map((s, i) => (
                <div key={s.l} className="flex flex-1 items-center gap-2">
                  <div className="flex-1 rounded-lg border border-border bg-background py-2"><div className="font-serif text-xl font-bold tabular-nums">{s.v}</div><div className="text-[10px] uppercase tracking-wide text-muted-foreground font-sans">{s.l}</div></div>
                  {i === 0 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </div>
              ))}
            </div>
            <Link to="/publishing" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline font-sans">Open the publishing center <ArrowRight className="h-3 w-3" /></Link>
          </div>
        );
      case "series":
        return <RepoList rows={repos(["series"])} emptyHint="No series yet. Create a series repository to group multi-title works." />;
      case "curriculum":
        return <RepoList rows={repos(["curriculum"])} emptyHint="No grade or subject repositories yet. Add one below to organize curriculum." />;
      case "programs":
        return <RepoList rows={repos(["program", "curriculum"])} emptyHint="No programs yet. Create a program repository to track initiatives." />;
      case "repositories":
        return <RepoList rows={health} emptyHint="No repositories yet." />;
      case "assets":
        return eduCats.length === 0 ? <Empty>No educational assets published yet. Listed curriculum, textbooks and workbooks appear here.</Empty> : (
          <div>
            <div className="mb-2 font-serif text-2xl font-bold tabular-nums">{eduTotal}</div>
            <div className="flex flex-wrap gap-1.5">{eduCats.map((c) => <span key={c.category} className="rounded-full border border-educational/40 bg-educational/10 px-2.5 py-1 text-xs font-medium font-sans">{c.category} · {c.total}</span>)}</div>
          </div>
        );
      case "localization": {
        const max = Math.max(...langs.map((l) => l.total), 1);
        return (
          <div className="space-y-3">
            <div className="flex gap-4">
              <div><div className="font-serif text-2xl font-bold tabular-nums">{stats?.languages ?? 0}</div><div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">Languages</div></div>
              <div><div className="font-serif text-2xl font-bold tabular-nums">{stats?.translations ?? 0}</div><div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">Editions</div></div>
            </div>
            {langs.length === 0 ? <Empty>No localized content yet. Localize a title to expand language coverage.</Empty> : (
              <div className="space-y-1.5">{langs.slice(0, 5).map((l) => (
                <div key={l.language}><div className="flex justify-between text-xs font-sans"><span className="font-medium">{l.language}</span><span className="text-muted-foreground">{l.total}</span></div><MiniBar value={l.total} max={max} className="bg-educational" /></div>
              ))}</div>
            )}
          </div>
        );
      }
      case "regions": {
        const max = Math.max(...regions.map((r) => r.total), 1);
        return regions.length === 0 ? <Empty>No regional editions yet. Cultural localization tags appear here as regions.</Empty> : (
          <div className="space-y-1.5">{regions.slice(0, 6).map((r) => (
            <div key={r.region}><div className="flex justify-between text-xs font-sans"><span className="inline-flex items-center gap-1 font-medium"><MapPin className="h-3 w-3 text-muted-foreground" />{r.region}</span><span className="text-muted-foreground">{r.total}</span></div><MiniBar value={r.total} max={max} className="bg-primary" /></div>
          ))}</div>
        );
      }
      case "distribution":
        return (
          <div>
            <div className="flex gap-4">
              <div><div className="font-serif text-2xl font-bold tabular-nums">{published}</div><div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">Live</div></div>
              <div><div className="font-serif text-2xl font-bold tabular-nums">{drafts}</div><div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">In progress</div></div>
              <div><div className="font-serif text-2xl font-bold tabular-nums">{stats?.languages ?? 0}</div><div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">Languages</div></div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground font-sans">Published works are distributed through the organization storefront and the marketplace.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">
        <Rocket className="h-3.5 w-3.5" /> Running your {pres.noun}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {pres.modules.map((key) => {
          const meta = MODULE_META[key];
          return (
            <div key={key} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold font-sans"><meta.icon className="h-4 w-4 text-primary" /> {meta.title}</div>
              {renderModule(key)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrgCommandModules;
