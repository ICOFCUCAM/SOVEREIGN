import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileDown, Loader2, Library as LibraryIcon, Package, Store, Globe, CheckCircle2, Image as ImageIcon, Sparkles, Users, MapPin, Tags, FileText, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { listDocuments, getDocument, type DocSummary } from "@/lib/documents";
import { listEditions } from "@/lib/editions";
import { getPublishingAdvice, type PublishingAdvice } from "@/lib/publishing-advisor";
import { TRIM_SIZES, getTrim } from "@/lib/print-sizes";
import { markdownToEpub } from "@/lib/export-epub";
import { markdownToPrintPdf } from "@/lib/export-print-pdf";
import { markdownToIngramSparkPdf } from "@/lib/export-ingramspark-pdf";

type Fmt = "epub" | "kdp" | "ingram" | "all";
const Chips = ({ items }: { items?: string[] }) => (
  <div className="flex flex-wrap gap-1.5">{(items ?? []).map((t) => <span key={t} className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-sans">{t}</span>)}</div>
);

// One place to take any saved book to every store: EPUB for Kobo/Apple/Google,
// a KDP-ready interior, and an IngramSpark-grade interior with embedded fonts.
// Reuses the same export engine the reader uses, so output is identical.
const ExportCenter = () => {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [trimId, setTrimId] = useState("6x9");
  const [author, setAuthor] = useState("");
  const [busy, setBusy] = useState<Fmt | null>(null);
  const [editionCount, setEditionCount] = useState<number | null>(null);
  const [advice, setAdvice] = useState<PublishingAdvice | null>(null);
  const [advising, setAdvising] = useState(false);

  useEffect(() => {
    listDocuments()
      .then((all) => {
        const books = all.filter((d) => d.kind === "book" || d.kind === "tailored");
        setDocs(books);
        if (books[0]) setSelected(books[0].id);
      })
      .catch(() => setDocs([]));
  }, []);

  const selectedDoc = useMemo(() => docs?.find((d) => d.id === selected) ?? null, [docs, selected]);

  useEffect(() => {
    setEditionCount(null);
    setAdvice(null);
    if (selected) listEditions(selected).then((e) => setEditionCount(Math.max(0, e.filter((x) => !x.is_source).length))).catch(() => {});
  }, [selected]);

  const runAdvice = async () => {
    setAdvising(true);
    try {
      const doc = await load();
      if (!doc) { toast({ title: "Pick a book first" }); return; }
      setAdvice(await getPublishingAdvice({ title: doc.title, content: doc.markdown }));
    } catch (e) {
      toast({ title: "Advisor failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally { setAdvising(false); }
  };

  const load = async (): Promise<{ markdown: string; title: string } | null> => {
    if (!selected) return null;
    const row = await getDocument(selected);
    const p = (row?.payload ?? {}) as Record<string, unknown>;
    const markdown = String(p.markdown ?? "");
    if (!markdown.trim()) throw new Error("This document has no exportable text.");
    return { markdown, title: String(p.title ?? row?.title ?? "Book") };
  };

  const run = async (fmt: Fmt) => {
    setBusy(fmt);
    try {
      const doc = await load();
      if (!doc) { toast({ title: "Pick a book first" }); return; }
      const trim = getTrim(trimId);
      const base = doc.title || "book";
      if (fmt === "epub" || fmt === "all") await markdownToEpub(doc.markdown, { title: doc.title }, base);
      if (fmt === "kdp" || fmt === "all") await markdownToPrintPdf(doc.markdown, { title: doc.title, trim }, `${base}-kdp-interior`);
      if (fmt === "ingram" || fmt === "all") await markdownToIngramSparkPdf(doc.markdown, { title: doc.title, author: author.trim() || undefined, trim }, `${base}-ingramspark`);
      if (fmt === "all") toast({ title: "Store bundle exported", description: "EPUB + KDP + IngramSpark interiors downloaded." });
    } catch (e) {
      toast({ title: "Export failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif text-lg"><Package className="h-4 w-4 text-gold" /> Distribution center</CardTitle>
        <CardDescription className="font-sans">Take any saved book to every store, see its marketplace status, and manage its language editions — all in one place.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {docs === null && <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading your books…</div>}
        {docs && docs.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
            <LibraryIcon className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground font-sans">No books saved yet.</p>
            <Button asChild variant="hero" size="sm"><Link to="/book">Create a book</Link></Button>
          </div>
        )}
        {docs && docs.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="font-sans text-xs">Book</Label>
                <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                  {docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Trim size</Label>
                <select value={trimId} onChange={(e) => setTrimId(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                  {TRIM_SIZES.filter((t) => t.id !== "a4").map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Author (for the IngramSpark title page, optional)</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Alex Morgan" maxLength={80} />
            </div>

            {/* Per-title readiness */}
            <div className="rounded-lg border border-border bg-card/50 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">Title status</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-sm font-sans">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Manuscript ready
                </div>
                <div className="flex items-center gap-2 text-sm font-sans">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  {selectedDoc?.listed ? <span className="text-foreground">Published to marketplace</span> : <Link to="/library" className="text-primary hover:underline">Publish to marketplace</Link>}
                </div>
                <div className="flex items-center gap-2 text-sm font-sans">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {editionCount === null ? <span className="text-muted-foreground">…</span>
                    : editionCount > 0 ? <Link to="/editions" className="text-foreground hover:text-primary">{editionCount} language edition{editionCount === 1 ? "" : "s"}</Link>
                    : <Link to="/editions" className="text-primary hover:underline">Add language editions</Link>}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground font-sans">
                <ImageIcon className="mr-1 inline h-3.5 w-3.5" /> Need a cover? Generate one in the <Link to="/book" className="text-primary hover:underline">Book Creator</Link> and size it with the spine calculator below.
              </div>
            </div>

            {/* AI Publishing Advisor — publishing intelligence */}
            <div className="rounded-lg border border-publishing/30 bg-publishing/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold font-sans"><Sparkles className="h-4 w-4 text-publishing" /> AI Publishing Advisor</span>
                <Button variant="heroOutline" size="sm" disabled={advising} onClick={runAdvice}>
                  {advising ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />} {advice ? "Refresh plan" : "Get publishing plan"}
                </Button>
              </div>
              {!advice && !advising && <p className="mt-1 text-xs text-muted-foreground font-sans">A go-to-market plan for this book — audience, markets, categories, page count, price, distribution and translation opportunities.</p>}
              {advice && (
                <div className="mt-3 space-y-3">
                  {advice.positioning && <p className="text-sm italic text-foreground font-sans">“{advice.positioning}”</p>}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {advice.audience && <div><div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground font-sans"><Users className="h-3.5 w-3.5" /> Audience</div><div className="text-sm font-sans">{advice.audience}{advice.readingLevel ? ` · ${advice.readingLevel}` : ""}</div></div>}
                    {(advice.estimatedPages || advice.price) && <div><div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground font-sans"><FileText className="h-3.5 w-3.5" /> Format & price</div><div className="text-sm font-sans">{advice.estimatedPages ? `~${advice.estimatedPages} pages` : ""}{advice.price ? <> · <DollarSign className="inline h-3.5 w-3.5" />{advice.price.replace(/^\$?/, "")}</> : ""}</div>{advice.priceRationale && <div className="text-[11px] text-muted-foreground font-sans">{advice.priceRationale}</div>}</div>}
                    {advice.categories?.length ? <div><div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground font-sans"><Tags className="h-3.5 w-3.5" /> Categories</div><div className="mt-1"><Chips items={advice.categories} /></div></div> : null}
                    {advice.markets?.length ? <div><div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground font-sans"><MapPin className="h-3.5 w-3.5" /> Markets</div><div className="mt-1"><Chips items={advice.markets} /></div></div> : null}
                    {advice.distribution?.length ? <div><div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground font-sans"><Store className="h-3.5 w-3.5" /> Distribution</div><div className="mt-1"><Chips items={advice.distribution} /></div></div> : null}
                    {advice.translations?.length ? <div><div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground font-sans"><Globe className="h-3.5 w-3.5" /> Translation opportunities</div><div className="mt-1 flex items-center gap-2"><Chips items={advice.translations} /><Link to="/editions" className="shrink-0 text-xs text-primary hover:underline font-sans">Create editions →</Link></div></div> : null}
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">Export for stores</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="heroOutline" size="sm" disabled={busy !== null} onClick={() => run("epub")}>
                {busy === "epub" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <BookOpen className="mr-1 h-4 w-4" />} EPUB
              </Button>
              <Button variant="heroOutline" size="sm" disabled={busy !== null} onClick={() => run("kdp")}>
                {busy === "kdp" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileDown className="mr-1 h-4 w-4" />} KDP interior
              </Button>
              <Button variant="heroOutline" size="sm" disabled={busy !== null} onClick={() => run("ingram")}>
                {busy === "ingram" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileDown className="mr-1 h-4 w-4" />} IngramSpark interior
              </Button>
              <Button variant="hero" size="sm" disabled={busy !== null} onClick={() => run("all")} title="Download EPUB + KDP + IngramSpark interiors">
                {busy === "all" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Package className="mr-1 h-4 w-4" />} Export store bundle
              </Button>
            </div>
            <p className="text-xs text-muted-foreground font-sans">RTL languages export via EPUB; the text-interior PDFs are for left-to-right scripts. Need a cover? Use the spine calculator below.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ExportCenter;
