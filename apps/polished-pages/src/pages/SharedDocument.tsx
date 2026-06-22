import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Sparkles, Loader2, BadgeCheck, Building2, Eye, Download, BookMarked } from "lucide-react";
import { getShared, recordView, type SharedDoc } from "@/lib/documents";
import { BRAND } from "@/lib/tools";
import type { CvData } from "@/lib/cv-data";
import BookReader from "@/components/book/BookReader";
import PremiumCv from "@/components/PremiumCv";
import PictureBookView, { type PictureBookData } from "@/components/children/PictureBookView";
import ReviewsPanel from "@/components/app/ReviewsPanel";
import CreateCtaBand from "@/components/app/CreateCtaBand";

// Public, read-only view of a shared document. When the work is listed on the
// marketplace it reads as a proper listing — title hero, price, category,
// author/institution provenance and reach — above the live preview. Private
// share links (listed = false) keep the minimal document-viewer framing.
const priceLabel = (cents?: number) => ((cents ?? 0) > 0 ? `$${((cents ?? 0) / 100).toFixed(2)}` : "Free to read");

const SharedDocument = () => {
  const { token } = useParams();
  const [doc, setDoc] = useState<SharedDoc | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    if (!token) { setState("missing"); return; }
    getShared(token).then((d) => {
      if (d) { setDoc(d); setState("ready"); recordView(token); }
      else setState("missing");
    }).catch(() => setState("missing"));
  }, [token]);

  const p = (doc?.payload ?? {}) as Record<string, unknown>;
  const listed = !!doc?.listed;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold" /><span className="font-serif text-base font-bold">{BRAND}</span></Link>
          {state === "ready" && (
            <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground font-sans">
              <span className="truncate">{doc?.title}</span>
              {doc?.author_name && (
                <>
                  <span aria-hidden className="text-border">·</span>
                  <span className="shrink-0">by <Link to={`/catalog/author/${encodeURIComponent(doc.author_name)}`} className="font-medium text-foreground hover:text-primary hover:underline">{doc.author_name}</Link></span>
                  {doc.author_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified creator" />}
                </>
              )}
            </span>
          )}
        </div>
      </nav>

      <div className="container max-w-4xl mx-auto px-6 py-10">
        {state === "loading" && <div className="flex items-center gap-2 text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
        {state === "missing" && (
          <div className="py-20 text-center">
            <h1 className="font-serif text-2xl font-bold">This document isn’t available</h1>
            <p className="mt-2 text-muted-foreground font-sans">The link may be wrong, or sharing was turned off.</p>
            <Link to="/" className="mt-4 inline-block text-primary hover:underline font-sans">Go to {BRAND}</Link>
          </div>
        )}
        {state === "ready" && doc && (
          <>
            {listed && (
              <header className="mb-10 border-b border-border/60 pb-8">
                <div className="flex flex-wrap items-center gap-2">
                  {doc.category && <span className="eyebrow text-primary">{doc.category}</span>}
                  {doc.edition_language && <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground font-sans">{doc.edition_language}</span>}
                </div>
                <h1 className="text-display mt-3 text-3xl font-bold md:text-[2.6rem] md:leading-[1.1]">{doc.title}</h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-sans text-muted-foreground">
                  {doc.author_name && (
                    <span className="inline-flex items-center gap-1.5">
                      by <Link to={`/catalog/author/${encodeURIComponent(doc.author_name)}`} className="font-medium text-foreground hover:text-primary hover:underline">{doc.author_name}</Link>
                      {doc.author_verified && <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified creator" />}
                    </span>
                  )}
                  {doc.org_name && doc.org_slug && (
                    <Link to={`/org/${doc.org_slug}`} className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline">
                      <Building2 className="h-4 w-4" /> {doc.org_name}
                      {doc.org_verified && <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified institution" />}
                    </Link>
                  )}
                  {doc.imprint && (
                    <span className="inline-flex items-center gap-1.5" title="Imprint"><BookMarked className="h-4 w-4" /> {doc.imprint}</span>
                  )}
                  <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" /> {doc.view_count ?? 0} {(doc.view_count ?? 0) === 1 ? "view" : "views"}</span>
                  {(doc.download_count ?? 0) > 0 && <span className="inline-flex items-center gap-1.5"><Download className="h-4 w-4" /> {doc.download_count} {doc.download_count === 1 ? "download" : "downloads"}</span>}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground">{priceLabel(doc.price_cents)}</span>
                  {doc.license && <span className="text-xs text-muted-foreground font-sans">{doc.license}</span>}
                </div>
              </header>
            )}
            {(doc.kind === "book" || doc.kind === "tailored") && typeof p.markdown === "string" ? (
              <BookReader content={String(p.markdown)} title={doc.title} />
            ) : doc.kind === "cv" && p.data ? (
              <PremiumCv data={p.data as CvData} template={doc.template ?? undefined} />
            ) : doc.kind === "storybook" && p.book ? (
              <PictureBookView book={p.book as PictureBookData} pageAspect={String(p.pageAspect ?? "16/9")} showText={p.showText !== false} />
            ) : doc.kind === "audiobook" && Array.isArray(p.chapters) ? (
              <div className="space-y-2">
                {(p.chapters as { title: string; url: string }[]).map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3.5">
                    <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium font-sans">{c.title}</span>
                    <audio controls preload="none" src={c.url} className="h-9 max-w-[260px]" />
                  </div>
                ))}
              </div>
            ) : (doc.kind === "cover" || doc.kind === "illustration") ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[p.front, p.back, p.image].filter(Boolean).map((src, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-border shadow-premium bg-white"><img src={String(src)} alt={doc.title} className="w-full" /></div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground font-sans">This document type can’t be previewed here.</p>
            )}
            {doc.license && !listed && <p className="mt-6 text-center text-xs text-muted-foreground font-sans">License: {doc.license}</p>}
            {token && <ReviewsPanel token={token} />}
            <CreateCtaBand
              heading={`Create something like this with ${BRAND}`}
              sub="Build CVs, books, storybooks and educational content with AI — then publish, translate and sell them. Start on the free plan."
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SharedDocument;
