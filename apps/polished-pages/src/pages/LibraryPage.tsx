import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Target, PenTool, BookOpen, BookHeart, Image as ImageIcon, Download, Trash2, Loader2, Library as LibraryIcon, ArrowRight, Star, Search, History, Save, Share2, Store, FolderPlus, Copy, Tag, X, LayoutTemplate, Plus, Eye, Check, ExternalLink, Building2 } from "lucide-react";
import PublishDialog from "@/components/app/PublishDialog";
import AddToCollection from "@/components/app/AddToCollection";
import MoveToOrganization from "@/components/app/MoveToOrganization";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { listDocuments, getDocument, deleteDocument, toggleFavorite, updateDocument, listVersions, getVersion, setShared, duplicateDocument, setTemplateFlag, useTemplate as applyTemplate, type DocSummary, type DocKind, type DocVersion } from "@/lib/documents";
import { wankongListingsByDoc, type WankongListing } from "@/lib/wankong";
import { documentOrgMap, type DocOrgInfo } from "@/lib/organizations";
import SpineMark from "@/components/brand/SpineMark";
import TagEditor from "@/components/app/TagEditor";
import { elementToPdf } from "@/lib/export-pdf";
import type { CvData } from "@/lib/cv-data";
import CVPreview from "@/components/CVPreview";
import CoverLetterPreview from "@/components/CoverLetterPreview";
import BookReader from "@/components/book/BookReader";
import BookExportPanel from "@/components/book/BookExportPanel";
import PictureBookView, { type PictureBookData } from "@/components/children/PictureBookView";
import { ArrowLeft } from "lucide-react";

const KIND_META: Record<DocKind, { label: string; icon: typeof FileText }> = {
  cv: { label: "CV", icon: FileText },
  tailored: { label: "Tailored CV", icon: Target },
  "cover-letter": { label: "Cover letter", icon: PenTool },
  book: { label: "Book", icon: BookOpen },
  cover: { label: "Book cover", icon: ImageIcon },
  storybook: { label: "Storybook", icon: BookHeart },
  illustration: { label: "Illustration", icon: ImageIcon },
};

type Opened =
  | { kind: "cv"; data: CvData; template?: string }
  | { kind: "letter"; markdown: string; fullName: string; email?: string; phone?: string }
  | { kind: "book"; markdown: string; title: string }
  | { kind: "cover"; front?: string; back?: string; title: string }
  | { kind: "image"; src: string; title: string }
  | { kind: "picturebook"; book: PictureBookData; pageAspect: string; showText: boolean; title: string };

const LibraryPage = () => {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);
  const [versions, setVersions] = useState<DocVersion[] | null>(null);
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [tplOnly, setTplOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"date" | "title" | "views">("date");
  const pbRef = useRef<HTMLDivElement>(null);

  const [wankong, setWankong] = useState<Record<string, WankongListing>>({});
  const [orgMap, setOrgMap] = useState<Record<string, DocOrgInfo>>({});

  const load = () => { listDocuments().then(setDocs).catch((e) => { toast({ title: "Could not load library", description: e.message, variant: "destructive" }); setDocs([]); }); };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-document Wankong store status, fetched once for the whole library so
  // cards can show a "live in store" badge without a query each.
  useEffect(() => { wankongListingsByDoc().then(setWankong).catch(() => {}); }, []);

  // Where each document lives — its organization and repositories — so a card
  // can always show "Owned by / Collection / Published".
  const loadOrgMap = () => documentOrgMap().then(setOrgMap).catch(() => {});
  useEffect(() => { loadOrgMap(); }, []);
  const afterOrgChange = () => { load(); loadOrgMap(); };

  // One-click resume from the dashboard: /library?open=<id> auto-opens the doc once.
  // ?kind=<DocKind> and ?filter=listed|shared|drafts apply initial filters from dashboard links.
  const [searchParams, setSearchParams] = useSearchParams();
  const [kindFilter, setKindFilter] = useState<DocKind | "">(() => (searchParams.get("kind") ?? "") as DocKind | "");
  const [statusFilter, setStatusFilter] = useState<"" | "listed" | "shared" | "drafts">(() => {
    const f = searchParams.get("filter") ?? "";
    return (["listed", "shared", "drafts"].includes(f) ? f : "") as "" | "listed" | "shared" | "drafts";
  });
  useEffect(() => {
    const id = searchParams.get("open");
    if (!id || !docs) return;
    const d = docs.find((x) => x.id === id);
    if (d) { open(d); setSearchParams({}, { replace: true }); }
  }, [docs]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = async (d: DocSummary) => {
    setOpening(d.id);
    setOpenedId(d.id);
    setVersions(null);
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
      } else if (d.kind === "illustration") {
        setOpened({ kind: "image", src: String(p.image ?? ""), title: d.title });
      } else if (d.kind === "storybook") {
        setOpened({ kind: "picturebook", book: p.book as PictureBookData, pageAspect: String(p.pageAspect ?? "16/9"), showText: p.showText !== false, title: d.title });
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

  const share = async (d: DocSummary) => {
    const next = !d.shared;
    try {
      const token = await setShared(d.id, next);
      setDocs((prev) => prev?.map((x) => (x.id === d.id ? { ...x, shared: next, share_token: next ? token : null } : x)) ?? null);
      if (next && token) {
        const url = `${window.location.origin}/shared/${token}`;
        await navigator.clipboard.writeText(url).catch(() => {});
        toast({ title: "Public link copied", description: url });
      } else {
        toast({ title: "Sharing turned off" });
      }
    } catch (e) {
      toast({ title: "Could not update sharing", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const dup = async (d: DocSummary) => {
    try { await duplicateDocument(d.id); load(); toast({ title: "Duplicated", description: `"${d.title}" copied.` }); }
    catch (e) { toast({ title: "Could not duplicate", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setDocs((prev) => prev?.filter((x) => !ids.includes(x.id)) ?? null);
    setSelected(new Set());
    try { await Promise.all(ids.map((id) => deleteDocument(id))); toast({ title: `${ids.length} document${ids.length > 1 ? "s" : ""} deleted` }); }
    catch { load(); toast({ title: "Some deletes failed", variant: "destructive" }); }
  };

  const toggleSelect = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const star = async (d: DocSummary) => {
    const next = !d.favorite;
    setDocs((prev) => prev?.map((x) => (x.id === d.id ? { ...x, favorite: next } : x)) ?? null);
    try { await toggleFavorite(d.id, next); }
    catch { setDocs((prev) => prev?.map((x) => (x.id === d.id ? { ...x, favorite: !next } : x)) ?? null); }
  };

  const toggleTemplate = async (d: DocSummary) => {
    const next = !d.is_template;
    setDocs((prev) => prev?.map((x) => (x.id === d.id ? { ...x, is_template: next } : x)) ?? null);
    try {
      await setTemplateFlag(d.id, next);
      toast({ title: next ? "Saved as template" : "Removed from templates", description: next ? `"${d.title}" can now start new documents.` : undefined });
    } catch (e) {
      setDocs((prev) => prev?.map((x) => (x.id === d.id ? { ...x, is_template: !next } : x)) ?? null);
      toast({ title: "Could not update template", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const startFromTemplate = async (d: DocSummary) => {
    try {
      await applyTemplate(d.id);
      load();
      toast({ title: "New document started", description: `Copied from template "${d.title}".` });
    } catch (e) {
      toast({ title: "Could not use template", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  if (opened?.kind === "cv") {
    return <CVPreview data={opened.data} template={opened.template} canSave={false} onBack={() => setOpened(null)} />;
  }
  if (opened?.kind === "letter") {
    return <CoverLetterPreview markdown={opened.markdown} fullName={opened.fullName} email={opened.email} phone={opened.phone} canSave={false} onBack={() => setOpened(null)} />;
  }
  if (opened?.kind === "book") {
    const bk = opened;
    const saveChanges = async () => {
      if (!openedId) return;
      setSavingDoc(true);
      try {
        await updateDocument(openedId, { markdown: bk.markdown, title: bk.title }, bk.markdown.slice(0, 160));
        setDocs((prev) => prev?.map((d) => (d.id === openedId ? { ...d, title: bk.title } : d)) ?? null);
        toast({ title: "Changes saved", description: "Previous version kept in history." });
        setVersions(null);
      } catch (e) {
        toast({ title: "Could not save", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
      } finally { setSavingDoc(false); }
    };
    const toggleHistory = async () => {
      if (versions) { setVersions(null); return; }
      if (!openedId) return;
      try { setVersions(await listVersions(openedId)); }
      catch (e) { toast({ title: "Could not load history", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    };
    const restore = async (v: DocVersion) => {
      try {
        const payload = (await getVersion(v.id)) as { markdown?: string; title?: string } | null;
        if (payload?.markdown != null) setOpened({ kind: "book", markdown: String(payload.markdown), title: String(payload.title ?? bk.title) });
      } catch (e) { toast({ title: "Could not restore", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    };
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-12 px-6">
            <span className="truncate text-sm font-medium text-muted-foreground font-sans">{opened.title}</span>
            <div className="flex items-center gap-2">
              <Button variant="heroOutline" size="sm" onClick={toggleHistory}><History className="w-4 h-4 mr-1" /> History</Button>
              <Button variant="hero" size="sm" disabled={savingDoc} onClick={saveChanges}>
                {savingDoc ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save changes
              </Button>
              {openedId && (
                <MoveToOrganization
                  documentId={openedId}
                  listed={docs?.find((x) => x.id === openedId)?.listed}
                  onDone={afterOrgChange}
                  trigger={<Button variant="heroOutline" size="sm"><Building2 className="w-4 h-4 mr-1" /> Organization</Button>}
                />
              )}
              <Button variant="ghost" size="sm" onClick={() => setOpened(null)} className="text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Library
              </Button>
            </div>
          </div>
        </div>
        <div className="container max-w-4xl mx-auto px-6 pt-8 pb-16">
          {versions && (
            <Card className="mb-6 border-border">
              <CardContent className="p-4">
                <div className="mb-2 text-sm font-semibold font-sans">Version history</div>
                {versions.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-sans">No earlier versions yet — they appear here after you save changes.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {versions.map((v) => (
                      <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="truncate text-xs text-muted-foreground font-sans">{new Date(v.created_at).toLocaleString()}{v.preview ? ` · ${v.preview.slice(0, 60)}` : ""}</span>
                        <Button variant="heroOutline" size="sm" onClick={() => restore(v)}>Restore</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
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
  if (opened?.kind === "picturebook") {
    const exportPdf = async () => {
      if (!pbRef.current) return;
      try { await elementToPdf(pbRef.current, `${opened.title}.pdf`, "#ffffff"); }
      catch (e) { toast({ title: "PDF export failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" }); }
    };
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-12 px-6">
            <span className="truncate text-sm font-medium text-muted-foreground font-sans">{opened.title}</span>
            <div className="flex items-center gap-2">
              <Button variant="heroOutline" size="sm" onClick={exportPdf}><Download className="w-4 h-4 mr-1" /> PDF</Button>
              {openedId && (
                <MoveToOrganization
                  documentId={openedId}
                  listed={docs?.find((x) => x.id === openedId)?.listed}
                  onDone={afterOrgChange}
                  trigger={<Button variant="heroOutline" size="sm"><Building2 className="w-4 h-4 mr-1" /> Organization</Button>}
                />
              )}
              <Button variant="ghost" size="sm" onClick={() => setOpened(null)} className="text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-2" /> Library</Button>
            </div>
          </div>
        </div>
        <div className="container max-w-3xl mx-auto px-6 pt-8 pb-16">
          <PictureBookView book={opened.book} innerRef={pbRef} pageAspect={opened.pageAspect} showText={opened.showText} />
        </div>
      </div>
    );
  }
  if (opened?.kind === "image") {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-12 px-6">
            <span className="truncate text-sm font-medium text-muted-foreground font-sans">{opened.title}</span>
            <div className="flex items-center gap-2">
              <Button variant="heroOutline" size="sm" onClick={() => { const a = document.createElement("a"); a.href = opened.src; a.download = `${opened.title}.png`; a.click(); }}><Download className="w-4 h-4 mr-1" /> PNG</Button>
              <Button variant="ghost" size="sm" onClick={() => setOpened(null)} className="text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-2" /> Library</Button>
            </div>
          </div>
        </div>
        <div className="container max-w-3xl mx-auto px-6 pt-8 pb-16">
          <div className="overflow-hidden rounded-xl border border-border shadow-premium bg-white"><img src={opened.src} alt={opened.title} className="w-full" /></div>
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
        <p className="mt-1 text-muted-foreground font-sans">Every document you’ve saved — CVs, letters, books, covers and children’s books.</p>
      </motion.div>

      {selected.size > 0 && (
        <div className="sticky top-[72px] z-30 mt-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 backdrop-blur-sm">
          <span className="text-sm font-medium font-sans">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="text-muted-foreground">Deselect all</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive"><Trash2 className="mr-1 h-3.5 w-3.5" /> Delete {selected.size}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selected.size} document{selected.size === 1 ? "" : "s"}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the selected document{selected.size === 1 ? "" : "s"} from your library. This can’t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={bulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {docs && docs.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your library…" className="pl-8" />
            </div>
            <Button variant={favOnly ? "hero" : "heroOutline"} size="sm" onClick={() => setFavOnly((f) => !f)}>
              <Star className={`mr-1 h-4 w-4 ${favOnly ? "fill-current" : ""}`} /> Favorites
            </Button>
            <Button variant={tplOnly ? "hero" : "heroOutline"} size="sm" onClick={() => setTplOnly((t) => !t)}>
              <LayoutTemplate className="mr-1 h-4 w-4" /> Templates
            </Button>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-md border border-border bg-card px-2 py-1.5 text-xs font-sans select-premium">
              <option value="">All statuses</option>
              <option value="listed">Listed</option>
              <option value="shared">Shared</option>
              <option value="drafts">Drafts</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="rounded-md border border-border bg-card px-2 py-1.5 text-xs font-sans select-premium">
              <option value="date">Newest first</option>
              <option value="title">A → Z</option>
              <option value="views">Most viewed</option>
            </select>
            {tagFilter && (
              <button onClick={() => setTagFilter("")} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary font-sans">
                <Tag className="h-3 w-3" /> {tagFilter} <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([["", "All"], ...Object.entries(KIND_META).map(([k, v]) => [k, v.label])] as [string, string][]).map(([k, label]) => (
              <button key={k} onClick={() => setKindFilter(k as DocKind | "")}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-sans transition ${kindFilter === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {docs === null && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-1.5 h-3 w-40" />
                  <Skeleton className="mt-2 h-3 w-full" />
                  <Skeleton className="mt-1 h-3 w-5/6" />
                  <div className="mt-3 flex gap-2">
                    <Skeleton className="h-7 w-16 rounded-md" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {docs && docs.length === 0 && (
        <Card className="mt-8 border-dashed border-border">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <SpineMark size="sm" className="mb-2 justify-center" />
            <p className="font-sans text-sm font-medium">Nothing saved yet</p>
            <p className="max-w-sm text-sm text-muted-foreground font-sans">Generate a CV, cover letter, or tailored application and choose "Save to library" to keep it here.</p>
            <Button asChild variant="hero" size="sm" className="mt-1"><Link to="/cv">Create a CV <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
      )}

      {docs && docs.length > 0 && (() => {
        const q = query.trim().toLowerCase();
        const filtered = docs.filter((d) =>
          (!favOnly || d.favorite) &&
          (!tplOnly || d.is_template) &&
          (!tagFilter || (d.tags ?? []).includes(tagFilter)) &&
          (!q || d.title.toLowerCase().includes(q) || (d.preview ?? "").toLowerCase().includes(q)) &&
          (kindFilter === "" || d.kind === kindFilter) &&
          (statusFilter === "" || (statusFilter === "listed" ? d.listed : statusFilter === "shared" ? (d.shared && !d.listed) : !d.shared))
        ).sort((a, b) =>
          sortBy === "title" ? a.title.localeCompare(b.title)
          : sortBy === "views" ? ((b.view_count ?? 0) - (a.view_count ?? 0))
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        if (filtered.length === 0) {
          return (
            <div className="mt-8 rounded-xl border border-dashed border-border/60 p-10 text-center">
              <Search className="mx-auto h-7 w-7 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium font-sans">No documents match your filters</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {(query || kindFilter || statusFilter || favOnly || tplOnly || tagFilter) && (
                  <Button size="sm" variant="heroOutline" onClick={() => { setQuery(""); setKindFilter(""); setStatusFilter(""); setFavOnly(false); setTplOnly(false); setTagFilter(""); }}>
                    <X className="mr-1 h-3.5 w-3.5" /> Clear all filters
                  </Button>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((d) => {
              const meta = KIND_META[d.kind] ?? KIND_META.cv;
              return (
                <Card key={d.id} className={`group border-border transition-colors hover:border-primary/40 ${selected.has(d.id) ? "border-primary/60 bg-primary/5" : ""}`}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <button type="button" onClick={() => toggleSelect(d.id)}
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${selected.has(d.id) ? "bg-primary" : "bg-primary/10 group-hover:bg-primary/20"}`}
                      aria-label={selected.has(d.id) ? "Deselect" : "Select"}>
                      {selected.has(d.id) ? <Check className="h-4 w-4 text-primary-foreground" /> : <meta.icon className="h-4 w-4 text-primary" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-sans text-sm font-semibold">{d.title}</span>
                        {d.listed ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 font-sans">Listed</span>
                        ) : d.shared ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary font-sans">Shared</span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground font-sans">Draft</span>
                        )}
                        {d.is_template && (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-gold font-sans">
                            <LayoutTemplate className="h-3 w-3" /> Template
                          </span>
                        )}
                        {wankong[d.id]?.status === "live" && (
                          wankong[d.id]?.external_url ? (
                            <a href={wankong[d.id]!.external_url!} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                              className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-publishing/15 px-1.5 py-0.5 text-[10px] font-medium text-publishing font-sans hover:bg-publishing/25" title="Live in the Wankong store">
                              <Store className="h-3 w-3" /> Wankong <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ) : (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-publishing/15 px-1.5 py-0.5 text-[10px] font-medium text-publishing font-sans" title="Live in the Wankong store">
                              <Store className="h-3 w-3" /> Wankong
                            </span>
                          )
                        )}
                        <button type="button" onClick={() => star(d)} className="ml-auto shrink-0 text-muted-foreground hover:text-gold" aria-label="Favorite">
                          <Star className={`h-4 w-4 ${d.favorite ? "fill-gold text-gold" : ""}`} />
                        </button>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground font-sans">
                        <span>{meta.label} · {new Date(d.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                        {d.listed && ((d.view_count ?? 0) > 0 || (d.download_count ?? 0) > 0) && (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3" /> {d.view_count ?? 0}</span>
                            <span className="inline-flex items-center gap-0.5"><Download className="h-3 w-3" /> {d.download_count ?? 0}</span>
                          </span>
                        )}
                      </div>
                      {d.preview && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground font-sans">{d.preview}</p>}
                      {orgMap[d.id] && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-sans">
                          <Link to={`/org/${orgMap[d.id].org_slug}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary hover:bg-primary/20" title="Owned by this organization">
                            <Building2 className="h-3 w-3" /> {orgMap[d.id].org_name}
                          </Link>
                          {orgMap[d.id].collections.map((c) => (
                            <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{c}</span>
                          ))}
                          {orgMap[d.id].listed && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-marketplace/10 px-2 py-0.5 font-medium text-marketplace"><Store className="h-3 w-3" /> Marketplace</span>
                          )}
                        </div>
                      )}
                      {(d.tags ?? []).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {(d.tags ?? []).map((t) => (
                            <button key={t} onClick={() => setTagFilter(t)} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-primary font-sans">{t}</button>
                          ))}
                        </div>
                      )}
                      {d.shared && d.share_token && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1">
                          <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground font-sans">{`${window.location.origin}/shared/${d.share_token}`}</span>
                          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/shared/${d.share_token}`).catch(() => {}); toast({ title: "Link copied" }); }} className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-primary" title="Copy link">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" variant="heroOutline" disabled={opening === d.id} onClick={() => open(d)}>
                          {opening === d.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null} Open
                        </Button>
                        {d.is_template && (
                          <Button size="sm" variant="hero" onClick={() => startFromTemplate(d)} title="Start a new document from this template">
                            <Plus className="mr-1 h-3.5 w-3.5" /> Use
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className={d.is_template ? "text-gold" : "text-muted-foreground"} onClick={() => toggleTemplate(d)} aria-label="Template" title={d.is_template ? "Remove from templates" : "Save as template"}>
                          <LayoutTemplate className="h-4 w-4" />
                        </Button>
                        <TagEditor
                          documentId={d.id}
                          current={d.tags ?? []}
                          onSaved={(tags) => setDocs((prev) => prev?.map((x) => (x.id === d.id ? { ...x, tags } : x)) ?? null)}
                          trigger={<Button size="sm" variant="ghost" className="text-muted-foreground" aria-label="Edit tags" title="Edit tags"><Tag className="h-4 w-4" /></Button>}
                        />
                        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => dup(d)} aria-label="Duplicate" title="Duplicate"><Copy className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className={d.shared ? "text-primary" : "text-muted-foreground"} onClick={() => share(d)} aria-label="Share" title={d.shared ? "Shared — click to copy link or unshare" : "Share publicly"}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <AddToCollection
                          documentId={d.id}
                          trigger={
                            <Button size="sm" variant="ghost" className="text-muted-foreground" aria-label="Add to collection" title="Add to collection">
                              <FolderPlus className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <MoveToOrganization
                          documentId={d.id}
                          listed={d.listed}
                          onDone={afterOrgChange}
                          trigger={
                            <Button size="sm" variant="ghost" className="text-muted-foreground" aria-label="Add to organization" title="Add to an organization">
                              <Building2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <PublishDialog
                          doc={d}
                          onChanged={(listed) => setDocs((prev) => prev?.map((x) => (x.id === d.id ? { ...x, listed } : x)) ?? null)}
                          trigger={
                            <Button size="sm" variant="ghost" className={d.listed ? "text-gold" : "text-muted-foreground"} aria-label="Publish" title={d.listed ? "Listed in catalog" : "Publish to catalog"}>
                              <Store className="h-4 w-4" />
                            </Button>
                          }
                        />
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
        );
      })()}
    </div>
  );
};

export default LibraryPage;
