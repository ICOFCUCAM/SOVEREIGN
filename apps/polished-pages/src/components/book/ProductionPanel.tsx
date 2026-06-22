import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ClipboardCheck, Globe, Headphones, FileDown, BookOpen, Package, Sparkles, Loader2, Store, Eye, Download, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { listDocuments, type DocSummary } from "@/lib/documents";
import { wankongListingsByDoc, type WankongListing } from "@/lib/wankong";
import { TRIM_SIZES, PAPER_MM_PER_PAGE, getTrim } from "@/lib/print-sizes";
import { markdownToPrintPdf } from "@/lib/export-print-pdf";
import { markdownToIngramSparkPdf } from "@/lib/export-ingramspark-pdf";
import { markdownToEpub } from "@/lib/export-epub";
import { getPublishingAdvice, type PublishingAdvice } from "@/lib/publishing-advisor";

const MM_PER_IN = 25.4;
const spineInches = (pages: number, paper?: string): string =>
  ((pages * (PAPER_MM_PER_PAGE[paper ?? "Cream"] ?? PAPER_MM_PER_PAGE["White"])) / MM_PER_IN).toFixed(3);

// Publishing metadata captured on a book project. Stored with the book draft and
// fed into the cover (ISBN/publisher) and — later — the spine and print package.
export interface BookMeta {
  author?: string;
  subtitle?: string;
  isbn?: string;
  publisher?: string;
  imprint?: string;
  trimSize?: string;
  pageCount?: string;
  paper?: string; // "white" | "cream" — affects spine width
}

// The Book Production Center: a project-centric readiness view + the publishing
// metadata that turns a manuscript into a distributable book.
const ProductionPanel = ({
  meta, setMeta, bookTitle, manuscriptComplete, coverDone, parentId, content,
}: {
  meta: BookMeta;
  setMeta: (m: BookMeta) => void;
  bookTitle: string;
  manuscriptComplete: boolean;
  coverDone: boolean;
  parentId: string | null;
  content: string;
}) => {
  const { toast } = useToast();
  const [children, setChildren] = useState<DocSummary[] | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [advice, setAdvice] = useState<PublishingAdvice | null>(null);
  const [advising, setAdvising] = useState(false);

  const trim = getTrim(meta.trimSize || "6x9");

  // Reuse the existing export engine (the same one the Preview/Export Center
  // uses) so output is identical — driven here by the project's metadata.
  const runExport = async (fmt: "kdp" | "ingram" | "epub" | "all") => {
    if (!content.trim()) { toast({ title: "Nothing to export yet", description: "Generate the manuscript first." }); return; }
    setExporting(fmt);
    const base = bookTitle || "book";
    try {
      if (fmt === "kdp" || fmt === "all") await markdownToPrintPdf(content, { title: bookTitle, trim }, `${base}-kdp-interior`);
      if (fmt === "ingram" || fmt === "all") await markdownToIngramSparkPdf(content, { title: bookTitle, author: meta.author?.trim() || undefined, trim }, `${base}-ingramspark`);
      if (fmt === "epub" || fmt === "all") await markdownToEpub(content, { title: bookTitle }, base);
      if (fmt === "all") toast({ title: "Store bundle exported", description: "KDP + IngramSpark interiors + EPUB downloaded." });
    } catch (e) {
      toast({ title: "Export failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally { setExporting(null); }
  };

  const runAdvice = async () => {
    if (!content.trim()) { toast({ title: "Generate the manuscript first" }); return; }
    setAdvising(true);
    try { setAdvice(await getPublishingAdvice({ title: bookTitle, content })); }
    catch (e) { toast({ title: "Advisor failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" }); }
    finally { setAdvising(false); }
  };

  // The project's saved assets (the book itself + its language editions and
  // audiobook, linked via parent_document_id) — so we can score readiness and
  // summarise distribution/analytics across the whole project.
  const [self, setSelf] = useState<DocSummary | null>(null);
  const [wankong, setWankong] = useState<Record<string, WankongListing>>({});
  useEffect(() => {
    if (!parentId) { setChildren([]); setSelf(null); return; }
    listDocuments().then((all) => {
      setChildren(all.filter((d) => d.parent_document_id === parentId));
      setSelf(all.find((d) => d.id === parentId) ?? null);
    }).catch(() => setChildren([]));
    wankongListingsByDoc().then(setWankong).catch(() => {});
  }, [parentId]);

  const editions = (children ?? []).filter((c) => c.edition_language).length;
  const hasAudiobook = (children ?? []).some((c) => c.kind === "audiobook");
  const pages = Number(meta.pageCount) || 0;

  // Distribution + analytics across the whole project (real counts only).
  const projectDocs = [self, ...(children ?? [])].filter(Boolean) as DocSummary[];
  const totalViews = projectDocs.reduce((n, d) => n + (d.view_count ?? 0), 0);
  const totalDownloads = projectDocs.reduce((n, d) => n + (d.download_count ?? 0), 0);
  const marketplaceListed = projectDocs.some((d) => d.listed);
  const wankongLive = projectDocs.some((d) => wankong[d.id]?.status === "live");

  const set = (k: keyof BookMeta) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setMeta({ ...meta, [k]: e.target.value });

  const items: { label: string; ok: boolean; hint?: string }[] = [
    { label: "Manuscript written", ok: manuscriptComplete },
    { label: "Title & author", ok: !!bookTitle.trim() && !!meta.author?.trim() },
    { label: "Cover designed", ok: coverDone },
    { label: "ISBN assigned", ok: !!meta.isbn?.trim(), hint: "Enables the print barcode" },
    { label: "Publisher set", ok: !!meta.publisher?.trim() },
    { label: "Print specs (trim + page count)", ok: !!meta.trimSize && pages > 0, hint: "Needed for the spine & print wrap" },
    { label: "Localized edition", ok: editions > 0 },
    { label: "Audiobook produced", ok: hasAudiobook },
  ];
  const done = items.filter((i) => i.ok).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <div className="space-y-6">
      {/* Production readiness */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h3 className="font-serif text-lg font-bold">Production readiness</h3>
            </div>
            <div className="text-right">
              <div className="font-serif text-2xl font-bold tabular-nums">{pct}%</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">{done}/{items.length} ready</div>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {items.map((it) => (
              <li key={it.label} className="flex items-start gap-2 text-sm font-sans">
                {it.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />}
                <span>
                  <span className={it.ok ? "" : "text-muted-foreground"}>{it.label}</span>
                  {!it.ok && it.hint && <span className="block text-[11px] text-muted-foreground/70">{it.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
          {(editions > 0 || hasAudiobook) && (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/60 pt-3 text-[11px] font-sans">
              {editions > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground"><Globe className="h-3 w-3" /> {editions} edition{editions === 1 ? "" : "s"}</span>}
              {hasAudiobook && <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground"><Headphones className="h-3 w-3" /> Audiobook</span>}
              <Link to="/library" className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-primary hover:bg-primary/5">Open in Library →</Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution & analytics — real counts across the project's assets. */}
      <Card className="border-border">
        <CardContent className="space-y-3 p-5">
          <h3 className="flex items-center gap-2 font-serif text-base font-semibold"><Store className="h-4 w-4 text-primary" /> Distribution &amp; analytics</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-card/50 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">Marketplace</div>
              <div className="mt-0.5 text-sm font-medium font-sans">{marketplaceListed ? <span className="text-emerald-600">Listed</span> : <span className="text-muted-foreground">Not listed</span>}</div>
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">Wankong store</div>
              <div className="mt-0.5 text-sm font-medium font-sans">{wankongLive ? <span className="inline-flex items-center gap-1 text-publishing">Live <ExternalLink className="h-3 w-3" /></span> : <span className="text-muted-foreground">Not published</span>}</div>
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans"><Eye className="mr-1 inline h-3 w-3" />Views</div>
              <div className="mt-0.5 font-serif text-lg font-bold tabular-nums">{totalViews.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans"><Download className="mr-1 inline h-3 w-3" />Downloads</div>
              <div className="mt-0.5 font-serif text-lg font-bold tabular-nums">{totalDownloads.toLocaleString()}</div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-sans">
            Counts cover this book and its {editions} edition{editions === 1 ? "" : "s"}{hasAudiobook ? " + audiobook" : ""}. Manage distribution from the <Link to="/library" className="text-primary hover:underline">Library</Link>. Sales figures aren’t synced back from Wankong yet.
          </p>
        </CardContent>
      </Card>

      {/* Publishing metadata */}
      <Card className="border-border">
        <CardContent className="space-y-4 p-5">
          <h3 className="font-serif text-base font-semibold">Publishing details</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Author</Label>
              <Input value={meta.author ?? ""} onChange={set("author")} placeholder="e.g. Chama Meyembi" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Subtitle</Label>
              <Input value={meta.subtitle ?? ""} onChange={set("subtitle")} placeholder="e.g. Recovering the Original Authority…" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">ISBN <span className="text-muted-foreground/60">(optional)</span></Label>
              <Input value={meta.isbn ?? ""} onChange={set("isbn")} placeholder="978-1-23456-789-0" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Publisher</Label>
              <Input value={meta.publisher ?? ""} onChange={set("publisher")} placeholder="e.g. Polished Pages" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Imprint <span className="text-muted-foreground/60">(optional)</span></Label>
              <Input value={meta.imprint ?? ""} onChange={set("imprint")} placeholder="e.g. Wankong Publishing" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Trim size</Label>
              <select value={meta.trimSize ?? ""} onChange={set("trimSize")} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                <option value="">Choose…</option>
                {TRIM_SIZES.filter((t) => t.id !== "a4").map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Page count</Label>
              <Input value={meta.pageCount ?? ""} onChange={set("pageCount")} placeholder="e.g. 220" inputMode="numeric" maxLength={5} />
              {pages > 0 && <p className="text-[11px] text-muted-foreground font-sans">Approx spine width: {spineInches(pages, meta.paper)} in</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Paper</Label>
              <select value={meta.paper ?? "Cream"} onChange={set("paper")} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                {Object.keys(PAPER_MM_PER_PAGE).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-sans">ISBN and publisher feed the cover’s barcode and imprint mark; trim size and page count size the spine and print wrap.</p>
        </CardContent>
      </Card>

      {/* Print & store files — the same engine the Preview/Export Center uses,
          driven by this project's trim + author. */}
      <Card className="border-border">
        <CardContent className="space-y-3 p-5">
          <h3 className="font-serif text-base font-semibold">Print &amp; store files</h3>
          <p className="text-[11px] text-muted-foreground font-sans">Paginated, selectable-text interiors at {trim.label}{meta.author ? ` · ${meta.author}` : ""}. Choose the interior design in the Preview tab.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="heroOutline" size="sm" disabled={exporting !== null} onClick={() => runExport("kdp")}>
              {exporting === "kdp" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />} KDP interior
            </Button>
            <Button variant="heroOutline" size="sm" disabled={exporting !== null} onClick={() => runExport("ingram")}>
              {exporting === "ingram" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />} IngramSpark interior
            </Button>
            <Button variant="heroOutline" size="sm" disabled={exporting !== null} onClick={() => runExport("epub")}>
              {exporting === "epub" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <BookOpen className="mr-1.5 h-4 w-4" />} EPUB
            </Button>
            <Button variant="hero" size="sm" disabled={exporting !== null} onClick={() => runExport("all")} title="KDP + IngramSpark interiors + EPUB">
              {exporting === "all" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Package className="mr-1.5 h-4 w-4" />} Store bundle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Publishing Advisor — a go-to-market plan for this book. */}
      <Card className="border-publishing/30 bg-publishing/[0.03]">
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-serif text-base font-semibold"><Sparkles className="h-4 w-4 text-publishing" /> Publishing advisor</h3>
            <Button variant="heroOutline" size="sm" disabled={advising} onClick={runAdvice}>
              {advising ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />} {advice ? "Refresh plan" : "Get publishing plan"}
            </Button>
          </div>
          {!advice && !advising && <p className="text-xs text-muted-foreground font-sans">Audience, markets, categories, suggested page count and price, distribution channels and translation opportunities for this book.</p>}
          {advice && (
            <div className="space-y-2 text-sm font-sans">
              {advice.positioning && <p className="italic text-foreground">“{advice.positioning}”</p>}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {advice.audience && <div><span className="text-xs font-semibold text-muted-foreground">Audience</span><div>{advice.audience}{advice.readingLevel ? ` · ${advice.readingLevel}` : ""}</div></div>}
                {(advice.estimatedPages || advice.price) && <div><span className="text-xs font-semibold text-muted-foreground">Format &amp; price</span><div>{advice.estimatedPages ? `~${advice.estimatedPages} pages` : ""}{advice.price ? ` · ${advice.price}` : ""}</div></div>}
                {advice.categories?.length ? <div><span className="text-xs font-semibold text-muted-foreground">Categories</span><div className="mt-0.5 flex flex-wrap gap-1">{advice.categories.map((c) => <span key={c} className="rounded-full border border-border px-2 py-0.5 text-[11px]">{c}</span>)}</div></div> : null}
                {advice.markets?.length ? <div><span className="text-xs font-semibold text-muted-foreground">Markets</span><div className="mt-0.5 flex flex-wrap gap-1">{advice.markets.map((m) => <span key={m} className="rounded-full border border-border px-2 py-0.5 text-[11px]">{m}</span>)}</div></div> : null}
                {advice.translations?.length ? <div className="sm:col-span-2"><span className="text-xs font-semibold text-muted-foreground">Translation opportunities</span><div className="mt-0.5 flex flex-wrap items-center gap-1">{advice.translations.map((t) => <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[11px]">{t}</span>)}</div></div> : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionPanel;
