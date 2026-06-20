import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Sparkles, Loader2, BadgeCheck } from "lucide-react";
import { getShared, recordView, type SharedDoc } from "@/lib/documents";
import { getAuthorProfile } from "@/lib/profiles";
import { BRAND } from "@/lib/tools";
import type { CvData } from "@/lib/cv-data";
import BookReader from "@/components/book/BookReader";
import PremiumCv from "@/components/PremiumCv";
import PictureBookView, { type PictureBookData } from "@/components/children/PictureBookView";
import ReviewsPanel from "@/components/app/ReviewsPanel";

// Public, read-only view of a shared document (the marketplace foundation:
// publish a resource, share the link, anyone can view and export it).
const SharedDocument = () => {
  const { token } = useParams();
  const [doc, setDoc] = useState<SharedDoc | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!token) { setState("missing"); return; }
    getShared(token).then((d) => {
      if (d) {
        setDoc(d); setState("ready"); recordView(token);
        if (d.author_name) getAuthorProfile(d.author_name).then((a) => setVerified(!!a?.verified)).catch(() => {});
      } else setState("missing");
    }).catch(() => setState("missing"));
  }, [token]);

  const p = (doc?.payload ?? {}) as Record<string, unknown>;

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
                  {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified creator" />}
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
            {(doc.kind === "book" || doc.kind === "tailored") && typeof p.markdown === "string" ? (
              <BookReader content={String(p.markdown)} title={doc.title} />
            ) : doc.kind === "cv" && p.data ? (
              <PremiumCv data={p.data as CvData} template={doc.template ?? undefined} />
            ) : doc.kind === "storybook" && p.book ? (
              <PictureBookView book={p.book as PictureBookData} pageAspect={String(p.pageAspect ?? "16/9")} showText={p.showText !== false} />
            ) : (doc.kind === "cover" || doc.kind === "illustration") ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[p.front, p.back, p.image].filter(Boolean).map((src, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-border shadow-premium bg-white"><img src={String(src)} alt={doc.title} className="w-full" /></div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground font-sans">This document type can’t be previewed here.</p>
            )}
            {doc.license && <p className="mt-6 text-center text-xs text-muted-foreground font-sans">License: {doc.license}</p>}
            {token && <ReviewsPanel token={token} />}
            <p className="mt-6 text-center text-xs text-muted-foreground font-sans">Shared via {BRAND}. <Link to="/" className="text-primary hover:underline">Create your own →</Link></p>
          </>
        )}
      </div>
    </div>
  );
};

export default SharedDocument;
