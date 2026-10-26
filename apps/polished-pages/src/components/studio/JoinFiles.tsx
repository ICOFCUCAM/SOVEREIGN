import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Check, Download, FileImage, FileText, FileType2, FolderPlus, Layers, Library, Loader2, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { joinPdfs, pageCount, parseRanges, pdfKind } from "@/lib/join-pdf";
import { joinDocx } from "@/lib/join-docx";
import { extractFileText } from "@/lib/extract-file-text";
import { saveDocument } from "@/lib/documents";

// Join files: many PDFs (and scanned page images) into one PDF, many Word files
// into one Word file, or any mix into one book with a chapter per file. PDF and
// Word joining happen in the browser; nothing is uploaded until you choose to
// add the result to the project or save it to your Library.

type Kind = "pdf" | "jpg" | "png" | "docx" | "text";
interface Item { id: string; file: File; kind: Kind; pages?: number; ranges: string; error?: string }
type Result = { kind: "pdf" | "docx" | "book"; name: string; blob: Blob; detail: string; notes: string[]; markdown?: string };

const GRADIENT = "bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] text-white shadow-[0_10px_28px_-12px_hsl(248_83%_55%/0.7)] hover:opacity-95";
const ACCEPT = ".pdf,.docx,.jpg,.jpeg,.png,.txt,.md,.markdown";

function kindOf(f: File): Kind | null {
  const pk = pdfKind(f.name, f.type);
  if (pk) return pk;
  const n = f.name.toLowerCase();
  if (n.endsWith(".docx")) return "docx";
  if (/\.(txt|md|markdown)$/.test(n)) return "text";
  return null;
}
const baseName = (n: string) => n.replace(/\.[^.]+$/, "");
const safeFile = (n: string) => n.replace(/[^\p{L}\p{N} _.-]+/gu, "").trim() || "Joined document";

export default function JoinFiles({ open, onClose, onAddToProject }: { open: boolean; onClose: () => void; onAddToProject?: (file: File) => Promise<void> }) {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("Joined document");
  const [newPage, setNewPage] = useState(true);
  const [headings, setHeadings] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const dragFrom = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const add = async (files: FileList | File[]) => {
    setResult(null); setSavedId(null);
    const added: Item[] = [];
    const refused: string[] = [];
    for (const f of Array.from(files)) {
      const k = kindOf(f);
      if (!k) { refused.push(f.name); continue; }
      const it: Item = { id: crypto.randomUUID(), file: f, kind: k, ranges: "" };
      if (k === "pdf") { try { it.pages = await pageCount(await f.arrayBuffer()); } catch { it.error = "Can't be read as a PDF"; } }
      added.push(it);
    }
    if (refused.length) toast({ title: "Some files can't be joined", description: `${refused.join(", ")}: use PDF, Word (.docx), JPG, PNG, text or Markdown. Old .doc files must be saved as .docx.`, variant: "destructive" });
    setItems((x) => {
      const next = [...x, ...added];
      if (x.length === 0 && next[0]) setName(baseName(next[0].file.name) + (next.length > 1 ? " (joined)" : ""));
      return next;
    });
  };

  const move = (from: number, to: number) => setItems((x) => {
    if (to < 0 || to >= x.length || from === to) return x;
    const n = [...x]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n;
  });
  const set = (id: string, p: Partial<Item>) => setItems((x) => x.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const allPdf = items.length > 0 && items.every((i) => i.kind === "pdf" || i.kind === "jpg" || i.kind === "png");
  const allDocx = items.length > 0 && items.every((i) => i.kind === "docx");
  const rangeError = (i: Item) => { if (i.kind !== "pdf" || !i.pages || !i.ranges.trim()) return null; try { parseRanges(i.ranges, i.pages); return null; } catch (e) { return e instanceof Error ? e.message : "Invalid"; } };
  const blocked = items.some((i) => i.error || rangeError(i));

  const run = async (kind: Result["kind"]) => {
    setBusy(kind); setResult(null); setSavedId(null);
    try {
      if (kind === "pdf") {
        const parts = await Promise.all(items.map(async (i) => ({ name: i.file.name, kind: i.kind as "pdf" | "jpg" | "png", bytes: await i.file.arrayBuffer(), ranges: i.ranges })));
        const { bytes, pages } = await joinPdfs(parts, { title: name });
        setResult({ kind, name: `${safeFile(name)}.pdf`, blob: new Blob([bytes], { type: "application/pdf" }), detail: `${pages} pages from ${items.length} files`, notes: [] });
      } else if (kind === "docx") {
        const parts = await Promise.all(items.map(async (i) => ({ name: i.file.name, bytes: await i.file.arrayBuffer() })));
        const r = await joinDocx(parts, { newPage, headings });
        setResult({ kind, name: `${safeFile(name)}.docx`, blob: r.blob, detail: `${r.documents} Word files joined`, notes: r.notes });
      } else {
        const notes: string[] = [];
        const chapters: string[] = [];
        for (const i of items) {
          if (i.kind === "jpg" || i.kind === "png") { notes.push(`“${i.file.name}” is an image: add it to the project and ask Claude to read it.`); continue; }
          try {
            const text = (await extractFileText(i.file)).replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
            chapters.push(`## ${baseName(i.file.name)}\n\n${text}`);
          } catch { notes.push(`“${i.file.name}” has no readable text (a scanned PDF?): add it to the project and ask Claude to read it.`); }
        }
        if (!chapters.length) throw new Error("None of these files has readable text.");
        const markdown = `# ${name.trim() || "Untitled book"}\n\n${chapters.join("\n\n")}\n`;
        const words = markdown.split(/\s+/).filter(Boolean).length;
        setResult({ kind, name: `${safeFile(name)}.md`, blob: new Blob([markdown], { type: "text/markdown;charset=utf-8" }), detail: `${chapters.length} chapters · ${words.toLocaleString()} words`, notes, markdown });
      }
    } catch (e) {
      toast({ title: "Couldn't join the files", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setBusy(null); }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(result.blob); a.download = result.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const toProject = async () => {
    if (!result || !onAddToProject) return;
    setBusy("project");
    try { await onAddToProject(new File([result.blob], result.name, { type: result.blob.type })); toast({ title: "Added to the project", description: "Claude can now summarise, rewrite or cite the whole thing." }); onClose(); }
    catch (e) { toast({ title: "Couldn't add it", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setBusy(null); }
  };
  const toLibrary = async () => {
    if (!result?.markdown) return;
    setBusy("library");
    try {
      const title = name.trim() || "Untitled book";
      setSavedId(await saveDocument({ kind: "book", title, payload: { markdown: result.markdown, title }, preview: result.markdown.replace(/^#.*$/m, "").trim().slice(0, 160) }));
    } catch (e) { toast({ title: "Couldn't save", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const Icon = (k: Kind) => (k === "pdf" ? FileType2 : k === "jpg" || k === "png" ? FileImage : FileText);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl"><Layers className="h-5 w-5 text-primary" /> Join files</DialogTitle>
          <DialogDescription>Put many PDFs, scanned pages or Word files together, in the order you choose, as one PDF, one Word file or one book.</DialogDescription>
        </DialogHeader>

        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) add(e.dataTransfer.files); }}
          className={`rounded-2xl border border-dashed p-4 transition-colors ${drag ? "border-primary bg-primary/5" : "border-border"}`}>
          {items.length === 0 ? (
            <button type="button" onClick={() => input.current?.click()} className="flex w-full flex-col items-center gap-2 py-6 text-center">
              <Upload className="h-7 w-7 text-primary" />
              <span className="font-medium">Choose files or drop them here</span>
              <span className="text-xs text-muted-foreground">PDF, Word (.docx), JPG or PNG scans, text or Markdown</span>
            </button>
          ) : (
            <ol className="space-y-2">
              {items.map((i, n) => {
                const I = Icon(i.kind); const re = rangeError(i);
                return (
                  <li key={i.id} draggable onDragStart={() => { dragFrom.current = n; }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (dragFrom.current !== null) move(dragFrom.current, n); dragFrom.current = null; }}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                    <span className="w-5 text-center text-xs font-semibold text-muted-foreground">{n + 1}</span>
                    <I className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium" title={i.file.name}>{i.file.name}</span>
                    {i.error ? <span className="text-xs text-destructive">{i.error}</span> : i.kind === "pdf" && i.pages ? (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {i.pages} p ·
                        <Input value={i.ranges} onChange={(e) => set(i.id, { ranges: e.target.value })} placeholder="all pages" aria-label={`Pages of ${i.file.name}`} aria-invalid={Boolean(re) || undefined}
                          className={`h-7 w-28 px-2 text-xs ${re ? "border-destructive" : ""}`} title={re ?? "e.g. 1-3, 5, 8-"} />
                      </span>
                    ) : null}
                    <span className="flex">
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={n === 0} onClick={() => move(n, n - 1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={n === items.length - 1} onClick={() => move(n, n + 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setItems((x) => x.filter((y) => y.id !== i.id)); setResult(null); }} aria-label={`Remove ${i.file.name}`}><X className="h-3.5 w-3.5" /></Button>
                    </span>
                    {re && <span className="w-full pl-7 text-xs text-destructive">{re}</span>}
                  </li>
                );
              })}
              <li><Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => input.current?.click()}><Upload className="h-4 w-4" /> Add more</Button>
                <span className="ml-3 text-xs text-muted-foreground">Drag rows or use the arrows to set the order.</span></li>
            </ol>
          )}
          <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { if (e.target.files?.length) add(e.target.files); e.target.value = ""; }} />
        </div>

        {items.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="join-name">Name of the joined file</Label><Input id="join-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <OutCard title="One PDF" line={allPdf ? "Pages copied exactly, no quality loss" : "Only for PDFs and JPG/PNG scans"} icon={FileType2} disabled={!allPdf || blocked || Boolean(busy)} busy={busy === "pdf"} onClick={() => run("pdf")} />
              <OutCard title="One Word file" line={allDocx ? "Formatting, images, lists and notes kept" : "Only when every file is .docx"} icon={FileText} disabled={!allDocx || Boolean(busy)} busy={busy === "docx"} onClick={() => run("docx")} />
              <OutCard title="One book" line="Any mix: one chapter per file" icon={BookOpen} disabled={blocked || Boolean(busy)} busy={busy === "book"} onClick={() => run("book")} />
            </div>
            {allDocx && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm"><span>Each file starts on a new page</span><Switch checked={newPage} onCheckedChange={setNewPage} /></label>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm"><span>File names as headings</span><Switch checked={headings} onCheckedChange={setHeadings} /></label>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{result.name}</div>
                <div className="text-sm text-muted-foreground">{result.detail}</div>
                {result.notes.map((n) => <p key={n} className="mt-1 text-xs text-amber-700 dark:text-amber-400">{n}</p>)}
                {result.kind === "docx" && <p className="mt-1 text-xs text-muted-foreground">The first file's styles, headers and footers lead; each file keeps its own page size and margins.</p>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" className={`rounded-full ${GRADIENT}`} onClick={download}><Download className="h-4 w-4" /> Download</Button>
              {onAddToProject && <Button size="sm" variant="outline" className="rounded-full" disabled={busy === "project"} onClick={toProject}>{busy === "project" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />} Add to this project</Button>}
              {result.kind === "book" && (savedId
                ? <Button asChild size="sm" variant="outline" className="rounded-full"><Link to={`/library?open=${savedId}`}><Library className="h-4 w-4" /> Open in Library</Link></Button>
                : <Button size="sm" variant="outline" className="rounded-full" disabled={busy === "library"} onClick={toLibrary}>{busy === "library" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />} Save to Library as a book</Button>)}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OutCard({ title, line, icon: I, disabled, busy, onClick }: { title: string; line: string; icon: typeof FileText; disabled: boolean; busy: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="flex flex-col items-start gap-1 rounded-2xl border border-border bg-card p-3 text-left transition hover:border-primary/40 hover:shadow-sm disabled:pointer-events-none disabled:opacity-45">
      <span className="flex items-center gap-2 font-semibold">{busy ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <I className="h-4 w-4 text-primary" />} {title}</span>
      <span className="text-xs text-muted-foreground">{line}</span>
    </button>
  );
}
