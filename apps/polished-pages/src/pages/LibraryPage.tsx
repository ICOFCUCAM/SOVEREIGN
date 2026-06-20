import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Target, PenTool, BookOpen, Image as ImageIcon, Download, Trash2, Loader2, Library as LibraryIcon, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { listDocuments, getDocument, deleteDocument, type DocSummary, type DocKind } from "@/lib/documents";
import type { CvData } from "@/lib/cv-data";
import CVPreview from "@/components/CVPreview";
import CoverLetterPreview from "@/components/CoverLetterPreview";
import BookReader from "@/components/book/BookReader";
import BookExportPanel from "@/components/book/BookExportPanel";
import { ArrowLeft } from "lucide-react";

const KIND_META: Record<DocKind, { label: string; icon: typeof FileText }> = {
  cv: { label: "CV", icon: FileText },
  tailored: { label: "Tailored CV", icon: Target },
  "cover-letter": { label: "Cover letter", icon: PenTool },
  book: { label: "Book", icon: BookOpen },
  cover: { label: "Book cover", icon: ImageIcon },
};

type Opened =
  | { kind: "cv"; data: CvData; template?: string }
  | { kind: "letter"; markdown: string; fullName: string; email?: string; phone?: string }
  | { kind: "book"; markdown: string; title: string }
  | { kind: "cover"; front?: string; back?: string; title: string };

const LibraryPage = () => {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [opened, setOpened] = useState<Opened | null>(null);

  const load = () => { listDocuments().then(setDocs).catch((e) => { toast({ title: "Could not load library", description: e.message, variant: "destructive" }); setDocs([]); }); };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = async (d: DocSummary) => {
    setOpening(d.id);
    try {
      const row = await getDocument(d.id);
      if (!row) throw new Error("Document not found.");
      const p = row.payload as Record<string, unknown>;
      if (d.kind === "cover-letter") {
        setOpened({ kind: "letter", markdown: String(p.markdown ?? ""), fullName: String(p.fullName ?? d.title), email: p.email as string | undefined, phone: p.phone as string | undefined });
      } else if (d.kind === "book") {
        setOpened({ kind: "book", markdown: String(p.markdown ?? ""), title: String(p.title ?? d.title) });
      } else if (d.kind === "cover") {
        setOpened({ kind: "cover", front: p.front as string | undefined, back: p.back as string | undefined, title: String(p.title ?? d.title) });
      } else {
        // cv and tailored both restore a CvData document
        setOpened({ kind: "cv", data: p.data as CvData, template: (row.template ?? undefined) || (p.template as string | undefined) });
      }
    } catch (e) {
      toast({ title: "Could not open", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setOpening(null);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocs((prev) => prev?.filter((d) => d.id !== id) ?? null);
    } catch (e) {
      toast({ title: "Could not delete", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    }
  };

  if (opened?.kind === "cv") {
    return <CVPreview data={opened.data} template={opened.template} canSave={false} onBack={() => setOpened(null)} />;
  }
  if (opened?.kind === "letter") {
    return <CoverLetterPreview markdown={opened.markdown} fullName={opened.fullName} email={opened.email} phone={opened.phone} canSave={false} onBack={() => setOpened(null)} />;
  }
  if (opened?.kind === "book") {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-12 px-6">
            <span className="text-sm font-medium text-muted-foreground font-sans">{opened.title}</span>
            <Button variant="ghost" size="sm" onClick={() => setOpened(null)} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Library
            </Button>
          </div>
        </div>
        <div className="container max-w-4xl mx-auto px-6 pt-8 pb-16">
          <BookExportPanel bookTitle={opened.title} fullContent={opened.markdown} chapterCount={0} />
          <div className="mt-6">
            <BookReader
              content={opened.markdown}
              title={opened.title}
              onContentChange={(s) => setOpened({ kind: "book", markdown: s, title: opened.title })}
            />
          </div>
        </div>
      </div>
    );
  }
  if (opened?.kind === "cover") {
    const dl = (src: string, name: string) => { const a = document.createElement("a"); a.href = src; a.download = name; a.click(); };
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-12 px-6">
            <span className="text-sm font-medium text-muted-foreground font-sans">{opened.title}</span>
            <Button variant="ghost" size="sm" onClick={() => setOpened(null)} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Library
            </Button>
          </div>
        </div>
        <div className="container max-w-3xl mx-auto px-6 pt-8 pb-16">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {(["front", "back"] as const).map((side) => {
              const src = opened[side];
              if (!src) return null;
              return (
                <div key={side}>
                  <div className="overflow-hidden rounded-lg border border-border shadow-premium">
                    <img src={src} alt={`${side} cover`} className="w-full" />
                  </div>
                  <Button variant="heroOutline" size="sm" className="mt-2 w-full" onClick={() => dl(src, `${opened.title}-${side}.png`)}>
                    <Download className="w-4 h-4 mr-1" /> {side === "front" ? "Front" : "Back"} PNG
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Library</h1>
        <p className="mt-1 text-muted-foreground font-sans">Your saved CVs, cover letters and tailored applications.</p>
      </motion.div>

      {docs === null && (
        <div className="mt-10 flex items-center gap-2 text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      )}

      {docs && docs.length === 0 && (
        <Card className="mt-8 border-dashed border-border">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <LibraryIcon className="h-10 w-10 text-muted-foreground/60" />
            <p className="font-sans text-sm font-medium">Nothing saved yet</p>
            <p className="max-w-sm text-sm text-muted-foreground font-sans">Generate a CV, cover letter, or tailored application and choose “Save to library” to keep it here.</p>
            <Button asChild variant="hero" size="sm" className="mt-1"><Link to="/cv">Create a CV <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
      )}

      {docs && docs.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {docs.map((d) => {
            const meta = KIND_META[d.kind] ?? KIND_META.cv;
            return (
              <Card key={d.id} className="group border-border transition-colors hover:border-primary/40">
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <meta.icon className="h-4 w-4 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-sans text-sm font-semibold">{d.title}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground font-sans">
                      {meta.label} · {new Date(d.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </div>
                    {d.preview && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground font-sans">{d.preview}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" variant="heroOutline" disabled={opening === d.id} onClick={() => open(d)}>
                        {opening === d.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null} Open
                      </Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => remove(d.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
