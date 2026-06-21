import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Building2, Languages, BookOpen, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpineMark from "@/components/brand/SpineMark";
import { coverArt } from "@/lib/cover-art";
import { orgShowcase, ORG_TYPES, ORG_PRESENTATION, type OrgShowcaseRow, type OrgType } from "@/lib/organizations";

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "O";
const typeLabel = (t: string) => ORG_TYPES.find((x) => x.value === t)?.label ?? t;

// Public institutional showcase — publishers, schools, NGOs and ministries that
// are actively publishing. Only organizations with real, listed content appear
// (the showcase RPC inner-joins published works), so nothing here is fabricated.
const Institutions = () => {
  const [orgs, setOrgs] = useState<OrgShowcaseRow[] | null>(null);
  useEffect(() => { orgShowcase().then(setOrgs).catch(() => setOrgs([])); }, []);

  const byType = (t: OrgType) => (orgs ?? []).filter((o) => o.type === t);
  const presentTypes = ORG_TYPES.map((t) => t.value).filter((t) => byType(t).length > 0);

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
          <div className="space-y-12">
            {presentTypes.map((t) => (
              <section key={t}>
                <div className="mb-4 flex items-baseline gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h2 className="font-serif text-xl font-bold">{typeLabel(t)}s</h2>
                  <span className="text-xs text-muted-foreground font-sans">{ORG_PRESENTATION[t].noun}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {byType(t).map((o) => {
                    const g = coverArt(o.name);
                    return (
                      <Link key={o.slug} to={`/org/${o.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
                        <div className="h-20" style={{ backgroundImage: `linear-gradient(135deg, ${g.from}, ${g.to})` }} />
                        <div className="-mt-8 px-5 pb-5">
                          <span className="flex h-14 w-14 items-center justify-center rounded-xl border-4 border-card font-serif text-lg font-bold text-white" style={{ backgroundImage: `linear-gradient(150deg, ${g.from}, ${g.to})` }}>{initials(o.name)}</span>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="truncate font-serif text-lg font-bold">{o.name}</span>
                            {o.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                          </div>
                          {o.tagline && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground font-sans">{o.tagline}</p>}
                          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground font-sans">
                            <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {o.works} work{o.works === 1 ? "" : "s"}</span>
                            {o.languages > 0 && <span className="inline-flex items-center gap-1"><Languages className="h-3.5 w-3.5" /> {o.languages} language{o.languages === 1 ? "" : "s"}</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Institutions;
