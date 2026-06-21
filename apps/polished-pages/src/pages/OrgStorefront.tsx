import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BadgeCheck, Globe, Building2, Library as LibraryIcon, Settings } from "lucide-react";
import ShelfCard from "@/components/app/ShelfCard";
import SpineMark from "@/components/brand/SpineMark";
import { coverArt } from "@/lib/cover-art";
import { getOrganization, orgStorefront, orgStorefrontStats, ORG_TYPES, ORG_PRESENTATION, can, type OrgDetail, type OrgStorefrontStats } from "@/lib/organizations";
import type { CatalogItem } from "@/lib/documents";

const typeLabel = (t: string) => ORG_TYPES.find((x) => x.value === t)?.label ?? t;
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "O";

// Public organization storefront — a publisher / school / NGO / ministry /
// company operating as a brand, with its published catalog. This is where the
// organization model becomes visible business value: real institutional names
// in the marketplace instead of individual accounts.
const OrgStorefront = () => {
  const { slug } = useParams();
  const [org, setOrg] = useState<OrgDetail | null | undefined>(undefined);
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [stats, setStats] = useState<OrgStorefrontStats | null>(null);

  useEffect(() => {
    if (!slug) return;
    setOrg(undefined); setItems(null); setStats(null);
    getOrganization(slug).then(setOrg).catch(() => setOrg(null));
    orgStorefront(slug).then(setItems).catch(() => setItems([]));
    orgStorefrontStats(slug).then(setStats).catch(() => {});
  }, [slug]);

  if (org === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><SpineMark animated /></div>;
  }
  if (org === null) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <main id="main" className="container max-w-xl px-6 py-32 text-center">
          <SpineMark className="mx-auto justify-center" />
          <h1 className="mt-6 font-serif text-2xl font-bold">Organization not found</h1>
          <p className="mt-2 text-muted-foreground font-sans">This organization doesn’t exist or its handle has changed.</p>
          <Link to="/catalog" className="mt-6 inline-block text-primary hover:underline font-sans">Browse the marketplace →</Link>
        </main><Footer />
      </div>
    );
  }

  const g = coverArt(org.name);
  const pres = ORG_PRESENTATION[org.type];
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Storefront banner — branded per institution type, not a user profile */}
      <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${pres.accent[0]}, ${pres.accent[1]})` }}>
        <div className="absolute inset-0 -z-10 opacity-50" style={{ background: `radial-gradient(60% 80% at 20% 0%, ${g.from}, transparent 60%)` }} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="container relative px-6 pb-12 pt-28">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl font-serif text-3xl font-bold text-white shadow-2xl ring-1 ring-white/15" style={{ backgroundImage: `linear-gradient(150deg, ${g.from}, ${g.to})` }}>
              {initials(org.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="eyebrow mb-1.5 text-white/55">{ORG_PRESENTATION[org.type].storefrontKicker}</div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/80">
                  <Building2 className="h-3 w-3" /> {typeLabel(org.type)}
                </span>
                {org.verified && <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-slate-900"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> Verified</span>}
              </div>
              <h1 className="text-display mt-2 text-4xl font-bold md:text-5xl">{org.name}</h1>
              {org.tagline && <p className="mt-2 max-w-2xl text-lg text-white/60 font-sans">{org.tagline}</p>}
            </div>
            {can.manage(org.my_role) && (
              <Link to="/organizations" className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10">
                <Settings className="h-4 w-4" /> Manage
              </Link>
            )}
          </div>
          {org.bio && <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-white/55 font-sans">{org.bio}</p>}
          {org.website && (
            <a href={org.website.startsWith("http") ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer nofollow"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white font-sans">
              <Globe className="h-4 w-4" /> {org.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* Brand stats — a publisher/institution presented as a brand */}
      {stats && stats.works > 0 && (
        <div className="border-b border-border bg-card/40">
          <div className="container flex flex-wrap gap-x-8 gap-y-3 px-6 py-4">
            {[
              { v: stats.works, l: "Published works" },
              { v: stats.languages, l: "Languages" },
              { v: stats.editions, l: "Editions" },
              { v: stats.series, l: "Series" },
              { v: stats.collections, l: "Collections" },
            ].filter((s) => s.l === "Published works" || s.v > 0).map((s) => (
              <div key={s.l}>
                <div className="font-serif text-xl font-bold tabular-nums">{s.v}</div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <main id="main" className="container px-6 py-12">
        <div className="flex items-baseline gap-2">
          <LibraryIcon className="h-4 w-4 text-marketplace" />
          <h2 className="font-serif text-xl font-bold">{org.type === "school" || org.type === "ministry" ? "Educational catalog" : org.type === "ngo" ? "Published programs" : "Published catalog"}</h2>
          {items && items.length > 0 && <span className="text-xs text-muted-foreground font-sans">{items.length} title{items.length === 1 ? "" : "s"}</span>}
        </div>
        {items === null ? (
          <div className="mt-8"><SpineMark animated /></div>
        ) : items.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <SpineMark className="justify-center" />
            <p className="text-sm text-muted-foreground font-sans">No published titles yet — this organization’s catalog will appear here.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((it) => <ShelfCard key={it.token} item={it} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrgStorefront;
