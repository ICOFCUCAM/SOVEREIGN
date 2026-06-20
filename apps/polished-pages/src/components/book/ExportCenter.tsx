import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileDown, Loader2, Library as LibraryIcon, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { listDocuments, getDocument, type DocSummary } from "@/lib/documents";
import { TRIM_SIZES, getTrim } from "@/lib/print-sizes";
import { markdownToEpub } from "@/lib/export-epub";
import { markdownToPrintPdf } from "@/lib/export-print-pdf";
import { markdownToIngramSparkPdf } from "@/lib/export-ingramspark-pdf";

type Fmt = "epub" | "kdp" | "ingram" | "all";

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

  useEffect(() => {
    listDocuments()
      .then((all) => {
        const books = all.filter((d) => d.kind === "book" || d.kind === "tailored");
        setDocs(books);
        if (books[0]) setSelected(books[0].id);
      })
      .catch(() => setDocs([]));
  }, []);

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
        <CardTitle className="flex items-center gap-2 font-serif text-lg"><Package className="h-4 w-4 text-gold" /> Export center</CardTitle>
        <CardDescription className="font-sans">Take any saved book to every store — EPUB, a KDP interior, and an IngramSpark-grade interior with embedded fonts.</CardDescription>
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
