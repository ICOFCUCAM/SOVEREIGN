import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { isAdmin } from "@/lib/documents";
import { marketplaceHealth, type MarketplaceHealth } from "@/lib/organizations";
import SpineMark from "@/components/brand/SpineMark";

const Tile = ({ v, l, warn }: { v: number; l: string; warn?: boolean }) => (
  <div className={`rounded-xl border p-3 text-center ${warn && v > 0 ? "border-gold/40 bg-gold/[0.05]" : "border-border bg-card"}`}>
    <div className="font-serif text-2xl font-bold tabular-nums">{v}</div>
    <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground font-sans">{l}</div>
  </div>
);

// Marketplace Health + Content-Density dashboard (admin only). Every number is a
// live count from production — no estimates, no fabricated metrics.
const MarketplaceHealthPage = () => {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [h, setH] = useState<MarketplaceHealth | null>(null);

  useEffect(() => {
    isAdmin().then((a) => {
      setAdmin(a);
      if (a) marketplaceHealth().then(setH).catch(() => {});
    }).catch(() => setAdmin(false));
  }, []);

  if (admin === null) return <div className="flex min-h-[60vh] items-center justify-center"><SpineMark animated /></div>;
  if (!admin) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-2xl font-bold">Admins only</h1>
        <p className="mt-2 text-muted-foreground font-sans">The marketplace health dashboard is restricted.</p>
        <Link to="/dashboard" className="mt-6 inline-block text-primary hover:underline font-sans">← Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-sans"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
      <div className="mt-3 flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h1 className="font-serif text-3xl font-bold tracking-tight">Marketplace health</h1>
      </div>
      <p className="mt-1 text-muted-foreground font-sans">Live production data — no estimates or projections.</p>

      {!h ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <>
          {/* Ecosystem */}
          <h2 className="mt-8 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">Ecosystem</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            <Tile v={h.listings} l="Listings" />
            <Tile v={h.publishing_organizations} l="Storefronts" />
            <Tile v={h.organizations} l="Organizations" />
            <Tile v={h.repositories} l="Repositories" />
            <Tile v={h.public_collections} l="Collections" />
            <Tile v={h.listed_languages} l="Languages" />
          </div>

          {/* Engagement */}
          <h2 className="mt-8 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">Engagement</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile v={h.listing_views} l="Listing views" />
            <Tile v={h.listing_downloads} l="Downloads" />
            <Tile v={h.paid_listings} l="Paid" />
            <Tile v={h.free_listings} l="Free" />
          </div>

          {/* Content density audit */}
          <h2 className="mt-8 mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans"><AlertTriangle className="h-3.5 w-3.5 text-gold" /> Content density audit</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Tile v={h.documents_total} l="Documents" />
            <Tile v={h.documents_in_orgs} l="In orgs" />
            <Tile v={h.unpublished_works} l="Unpublished" warn />
            <Tile v={h.orphaned_documents} l="Orphaned" warn />
            <Tile v={h.empty_storefronts} l="Empty stores" warn />
            <Tile v={h.empty_repositories} l="Empty repos" warn />
          </div>
          <p className="mt-3 text-xs text-muted-foreground font-sans">
            Orphaned = documents whose owner no longer exists (seed/test rows). Unpublished = saved works not yet listed.
            Empty stores/repos = organizations or repositories with no published content. Highlighted figures indicate density bottlenecks to address.
          </p>
        </>
      )}
    </div>
  );
};

export default MarketplaceHealthPage;
