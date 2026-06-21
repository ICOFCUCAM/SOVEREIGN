import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Building2, Languages, BookOpen, Layers, ArrowRight, Sparkles, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpineMark from "@/components/brand/SpineMark";
import { coverArt } from "@/lib/cover-art";
import { orgShowcase, marketLanguages, ORG_TYPES, ORG_PRESENTATION, type OrgShowcaseRow, type OrgType } from "@/lib/organizations";

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "O";
const typeLabel = (t: string) => ORG_TYPES.find((x) => x.value === t)?.label ?? t;
const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 30 * 24 * 60 * 60 * 1000;

// Public institutional discovery — publishers, schools, NGOs and ministries
// actively publishing. Only organizations with real, listed content appear (the
// showcase RPC inner-joins published works), so nothing here is fabricated.
const Institutions = () => {
  const [orgs, setOrgs] = useState<OrgShowcaseRow[] | null>(null);
  const [langCount, setLangCount] = useState(0);
  const [type, setType] = useState<OrgType | "">("");
  const [sort, setSort] = useState<"featured" | "newest">("featured");

  useEffect(() => {
    orgShowcase().then(setOrgs).catch(() => setOrgs([]));
    marketLanguages().then((l) => setLangCount(l.length)).catch(() => {});
  }, []);

  const network = useMemo(() => {
    const list = orgs ?? [];
    return {
      institutions: list.length,
      works: list.reduce((s, o) => s + o.works, 0),
      collections: list.reduce((s, o) => s + o.collections, 0),
      languages: langCount,
    };
  }, [orgs, langCount]);

  const present = useMemo(() => {
    const types = new Set((orgs ?? []).map((o) => o.type));
    return ORG_TYPES.map((t) => t.value).filter((t) => types.has(t));
  }, [orgs]);

  const visible = useMemo(() => {
    let list = (orgs ?? []).filter((o) => !type || o.type === type);
    if (sort === "newest") list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [orgs, type, sort]);

  const newest = useMemo(
    () => [...(orgs ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).filter((o) => isNew(o.created_at)).slice(0, 6),
    [orgs],
  );

  const Card = ({ o }: { o: OrgShowcaseRow }) => {
    const g = coverArt(o.name);
    return (
      <Link to={`/org/${o.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
        <div className="h-20" style={{ backgroundImage: `linear-gradient(135deg, ${g.from}, ${g.to})` }} />
        <div className="-mt-8 px-5 pb-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl border-4 border-card font-serif text-lg font-bold text-white" style={{ backgroundImage: `linear-gradient(150deg, ${g.from}, ${g.to})` }}>{initials(o.name)}</span>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="truncate font-serif text-lg font-bold">{o.name}</span>
            {o.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
            {isNew(o.created_at) && <span className="shrink-0 rounded-full bg-marketplace/10 px-1.5 py-0.5 text-[10px] font-semibold text-marketplace">New</span>}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground font-sans">{typeLabel(o.type)} · {ORG_PRESENTATION[o.type].noun}</div>
          {o.tagline && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground font-sans">{o.tagline}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-sans">
            <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {o.works} work{o.works === 1 ? "" : "s"}</span>
            {o.languages > 0 && <span className="inline-flex items-center gap-1"><Languages className="h-3.5 w-3.5" /> {o.languages} language{o.languages === 1 ? "" : "s"}</span>}
            {o.collections > 0 && <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {o.collections} collection{o.collections === 1 ? "" : "s"}</span>}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="relative overflow-hidden text-white" style={{ background: "radial-gradient(120% 100% at 50% -10%, hsl(222 47% 12%) 0%, hsl(222 47% 7%) 55%, hsl(224 60% 4%) 100%)" }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="container relative px-6 pb-14 pt-28 text-center">
          <span className="eyebrow text-white/60">Institutions on Polished Pages</span>
          <h1 className="text-display mx-auto mt-3 max-w-3xl text-4xl font-bold md:text-5xl">Publishers, schools, NGOs and ministries building knowledge at scale</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60 font-sans">Real organizations operating Polished Pages as an institution — with shared libraries, teams and branded storefronts.</p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* Knowledge network — the ecosystem at a glance (real aggregates) */}
      {orgs && orgs.length > 0 && (
        <div className="border-b border-border bg-card/40">
          <div className="container px-6 py-5">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 sm:gap-x-5">
              {[
                { v: network.institutions, l: "Institutions" },
                { v: network.works, l: "Published works" },
                { v: network.collections, l: "Collections" },
                { v: network.languages, l: "Languages" },
              ].map((n, i, arr) => (
                <div key={n.l} className="flex items-center gap-3 sm:gap-5">
                  <div className="text-center">
                    <div className="font-serif text-2xl font-bold tabular-nums">{n.v}</div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">{n.l}</div>
                  </div>
                  {i < arr.length - 1 && <span className="hidden h-px w-8 bg-gradient-to-r from-primary/40 to-transparent sm:block" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main id="main" className="container px-6 py-12">
        {orgs === null ? (
          <div className="py-16"><SpineMark animated /></div>
        ) : orgs.length === 0 ? (
          <div className="mx-auto max-w-xl py-12 text-center">
            <SpineMark className="mx-auto justify-center" />
            <h2 className="mt-6 font-serif text-2xl font-bold">The first institutions are coming</h2>
            <p className="mt-2 text-muted-foreground font-sans">As publishers, schools, NGOs and ministries publish their first catalogs, their branded storefronts will appear here.</p>
            <Link to="/organizations" className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground font-sans">Create your organization <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <>
            {/* New institutions */}
            {newest.length > 0 && sort === "featured" && !type && (
              <section className="mb-10">
                <div className="mb-4 flex items-baseline gap-2"><Clock className="h-4 w-4 text-marketplace" /><h2 className="font-serif text-xl font-bold">New institutions</h2><span className="text-xs text-muted-foreground font-sans">recently joined</span></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{newest.map((o) => <Card key={o.slug} o={o} />)}</div>
              </section>
            )}

            {/* Controls */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <button onClick={() => setType("")} className={`rounded-full border px-3 py-1 text-xs font-sans transition ${type === "" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>All</button>
              {present.map((t) => (
                <button key={t} onClick={() => setType(t)} className={`rounded-full border px-3 py-1 text-xs font-sans transition ${type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{typeLabel(t)}s</button>
              ))}
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field select-premium ml-auto font-sans">
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {sort === "featured" && !type ? (
              <div className="space-y-12">
                {present.map((t) => {
                  const list = visible.filter((o) => o.type === t);
                  if (list.length === 0) return null;
                  return (
                    <section key={t}>
                      <div className="mb-4 flex items-baseline gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <h2 className="font-serif text-xl font-bold">{typeLabel(t)}s</h2>
                        <span className="text-xs text-muted-foreground font-sans">{ORG_PRESENTATION[t].noun}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((o) => <Card key={o.slug} o={o} />)}</div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.length === 0 ? <p className="text-sm text-muted-foreground font-sans">No institutions of this type yet.</p> : visible.map((o) => <Card key={o.slug} o={o} />)}
              </div>
            )}

            <Link to="/catalog" className="mt-12 flex items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-sm transition-colors hover:border-primary/40">
              <Sparkles className="h-4 w-4 text-marketplace" />
              <span className="font-sans">Browse the marketplace catalog</span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Institutions;
