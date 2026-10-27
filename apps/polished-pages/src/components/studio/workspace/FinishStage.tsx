import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BookOpen, Check, Download, FileText, Library, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { COMPLETE, DEFAULT_SHELVES, SHELF } from "@/lib/bookshelf";
import { saveDocument, setTags, updateDocument } from "@/lib/documents";
import { findBookCover } from "@/lib/book-covers";
import { authorshipNotes, compile, kindDef, words, type Manuscript } from "@/lib/manuscript";
import { localizeMarkdown, markdownEdition } from "@/lib/localize";
import type { CoverCopyWriter } from "@/lib/cover-copy";
import type { BookOutline } from "@/types/book";
import type { BookMeta } from "@/components/book/ProductionPanel";
import { EYEBROW, SERIF } from "./ui";

const BookReader = lazy(() => import("@/components/book/BookReader"));
const CoverGenerator = lazy(() => import("@/components/book/CoverGenerator"));
const BookExportPanel = lazy(() => import("@/components/book/BookExportPanel"));
const AudiobookPanel = lazy(() => import("@/components/book/AudiobookPanel"));
const LocalizePanel = lazy(() => import("@/components/app/LocalizePanel"));
const BookRepurposePanel = lazy(() => import("@/components/book/BookRepurposePanel"));
const ProductionPanel = lazy(() => import("@/components/book/ProductionPanel"));
const BookPublishingPackage = lazy(() => import("@/components/book/BookPublishingPackage"));

type Tab = "preview" | "cover" | "export" | "audio" | "translate" | "repurpose" | "production" | "publish" | "library";
const TABS: { id: Tab; label: string }[] = [
  { id: "preview", label: "Preview" }, { id: "cover", label: "Cover" }, { id: "export", label: "Interior and export" }, { id: "audio", label: "Audiobook" },
  { id: "translate", label: "Translate" }, { id: "repurpose", label: "Repurpose" }, { id: "production", label: "Production" }, { id: "publish", label: "Publishing package" }, { id: "library", label: "Save to Library" },
];
const download = (name: string, text: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };

// Finish (design spec §9): readiness that links to its fix, the real cover,
// and every finishing tool working on the manuscript as it is now.
export default function FinishStage({ m, onUpdate, onOpen, coverWriter }: { m: Manuscript; onUpdate: (m: Manuscript) => void; onOpen: (sectionId: string) => void; coverWriter?: CoverCopyWriter }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("preview");
  const [shelf, setShelf] = useState("");
  const [complete, setComplete] = useState(false);
  const [contents, setContents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const title = m.title.trim() || "Untitled book";
  const md = useMemo(() => compile(m, { contents }), [m, contents]);
  const meta = (m.meta ?? {}) as BookMeta;
  const chapters = m.sections.filter((s) => s.kind === "chapter");

  useEffect(() => { let live = true; if (m.libraryId) findBookCover(m.libraryId).then((c) => { if (live) setCover(c?.payload.front || null); }).catch(() => {}); return () => { live = false; }; }, [m.libraryId, tab]);

  /** Saves the book to the Library (updating the same book after the first time) and returns its id. */
  const ensureSaved = async (): Promise<string | null> => {
    try {
      const payload = { markdown: md, title };
      const preview = md.replace(/^#.*$/m, "").trim().slice(0, 160);
      if (m.libraryId) { await updateDocument(m.libraryId, payload, preview); return m.libraryId; }
      const id = await saveDocument({ kind: "book", title, payload, preview });
      onUpdate({ ...m, libraryId: id });
      return id;
    } catch (e) { toast({ title: "Couldn't save the book", description: e instanceof Error ? e.message : "", variant: "destructive" }); return null; }
  };

  // Readiness: only true facts, each with the place to fix it.
  const checks = useMemo(() => {
    const out: { ok: boolean; text: string; fix?: () => void }[] = [];
    const emptyCh = chapters.filter((s) => !s.body.trim());
    out.push({ ok: chapters.length > 0 && !emptyCh.length, text: !chapters.length ? "No chapters yet" : emptyCh.length ? `${emptyCh.length} of ${chapters.length} chapters not written` : `All ${chapters.length} chapters written`, fix: emptyCh[0] ? () => onOpen(emptyCh[0].id) : undefined });
    const count = (re: RegExp) => m.sections.map((s) => ({ s, n: (s.body.match(re) ?? []).length })).filter((x) => x.n);
    const yours = count(/\[\[YOURS:[^\]]*\]\]/g), needed = count(/\[citation needed\]/gi), holes = count(/\[(?:placeholder|insert|add|TODO)[^\]]*\]/gi);
    out.push({ ok: !yours.length, text: yours.length ? (() => { const n = yours.reduce((t, x) => t + x.n, 0); return `${n} ${n === 1 ? "place" : "places"} marked to make it yours`; })() : "No [[YOURS]] markers left", fix: yours[0] ? () => onOpen(yours[0].s.id) : undefined });
    out.push({ ok: !needed.length, text: needed.length ? (() => { const n = needed.reduce((t, x) => t + x.n, 0); return `${n} ${n === 1 ? "claim" : "claims"} marked [citation needed]`; })() : "No [citation needed] left", fix: needed[0] ? () => onOpen(needed[0].s.id) : undefined });
    out.push({ ok: !holes.length, text: holes.length ? (() => { const n = holes.reduce((t, x) => t + x.n, 0); return `${n} ${n === 1 ? "placeholder" : "placeholders"} to fill`; })() : "No placeholders left", fix: holes[0] ? () => onOpen(holes[0].s.id) : undefined });
    out.push({ ok: m.sections.some((s) => kindDef(s.kind).group === "front"), text: m.sections.some((s) => kindDef(s.kind).group === "front") ? "Front matter present" : "No front matter (preface, introduction…)", fix: () => onOpen(m.sections[0]?.id ?? "") });
    out.push({ ok: Boolean(cover), text: cover ? "Cover designed" : "No cover yet", fix: () => setTab("cover") });
    out.push({ ok: Boolean(meta.isbn), text: meta.isbn ? `ISBN ${meta.isbn}` : "No ISBN (needed for print and stores)", fix: () => setTab("production") });
    return out;
  }, [m, chapters, cover, meta.isbn, onOpen]);

  const outline: BookOutline = {
    title, subtitle: m.subtitle ?? "", description: String(meta.description ?? ""), targetAudience: "", positioning: "", keywords: String(meta.keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean),
    categories: meta.category ? [String(meta.category)] : [], coverDirection: { style: "", colors: "", typography: "" }, frontMatter: "", backMatter: "",
    chapters: chapters.map((s) => ({ title: s.title, summary: s.summary ?? s.idea ?? "", keyPoints: [], hook: "" })),
  };

  const saveToLibrary = async () => {
    setSaving(true);
    const id = await ensureSaved();
    if (id) { await setTags(id, [...(shelf ? [SHELF + shelf] : []), ...(complete ? [COMPLETE] : [])]).catch(() => {}); toast({ title: "Saved to your Library", description: `“${title}”${shelf ? ` on the ${shelf} shelf` : ""}.` }); }
    setSaving(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <div className="flex flex-wrap items-start gap-12 border-b border-[#E6E8ED] pb-10 dark:border-white/10">
        <figure className="shrink-0">
          {cover ? <img src={cover} alt={`Front cover of ${title}`} className="h-[300px] w-auto rounded-[2px] shadow-[0_20px_40px_-20px_rgba(15,23,42,.5)]" />
            : <div className="grid h-[300px] w-[200px] place-items-center rounded-[2px] border border-dashed border-[#CBD5E1] p-6 text-center text-[13px] text-[#64748B] dark:border-white/20">No cover yet.<br /><button type="button" onClick={() => setTab("cover")} className="mt-2 font-medium text-[#2563EB] hover:underline">Design it</button></div>}
          <figcaption className="mt-2 text-[12px] text-[#64748B]">{cover ? "Your saved front cover" : "The front cover appears here"}</figcaption>
        </figure>
        <div className="min-w-[280px] flex-1">
          <p className={EYEBROW}>Finish</p>
          <h1 className={`${SERIF} mt-2 text-[36px] font-medium leading-[1.15]`}>{title}</h1>
          <p className="mt-1 text-[14px] text-[#64748B]">{m.sections.reduce((n, s) => n + words(s.body), 0).toLocaleString()} words · {chapters.length} chapters</p>
          <ul className="mt-5 space-y-2 text-[14px]" aria-label="Readiness">
            {checks.map((c) => (
              <li key={c.text} className="flex items-center gap-2.5">
                {c.ok ? <Check className="h-4 w-4 shrink-0 text-[#047857]" aria-label="Done" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-[#B45309]" aria-label="To do" />}
                <span className="flex-1">{c.text}</span>
                {!c.ok && c.fix && <button type="button" onClick={c.fix} className="text-[13px] font-medium text-[#2563EB] hover:underline">Fix</button>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div role="tablist" aria-label="Finishing tools" className="mt-8 flex flex-wrap gap-1">
        {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`h-9 rounded-[8px] px-3 text-[13px] ${tab === t.id ? "bg-[#172033] font-medium text-white dark:bg-white dark:text-[#172033]" : "text-[#475569] hover:bg-muted dark:text-[#CBD5E1]"}`}>{t.label}</button>)}
      </div>

      <div className="mt-6 min-h-[40vh]">
        <Suspense fallback={<div className="grid min-h-[30vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
          {tab === "preview" && <BookReader content={md} title={title} />}
          {tab === "cover" && <CoverGenerator title={title} subtitle={m.subtitle} author={m.author} isbn={meta.isbn} publisher={meta.publisher || meta.imprint} pageCount={meta.pageCount} paper={meta.paper} trimSize={meta.trimSize}
            bookText={() => compile(m, { contents: false })} copyWriter={coverWriter} bookId={m.libraryId ?? null} ensureSaved={ensureSaved} onSaved={() => m.libraryId && findBookCover(m.libraryId).then((c) => setCover(c?.payload.front || null))} />}
          {tab === "export" && <BookExportPanel bookTitle={title} fullContent={md} chapterCount={chapters.filter((s) => s.body.trim()).length} />}
          {tab === "audio" && <AudiobookPanel chapters={chapters.filter((s) => s.body.trim()).map((s) => ({ title: s.title, content: s.body }))} bookTitle={title} parentId={m.libraryId ?? null} ensureSaved={ensureSaved} />}
          {tab === "translate" && <LocalizePanel parentId={m.libraryId ?? null} ensureSaved={ensureSaved} kind="book" sourceTitle={title} hasContent={chapters.some((s) => s.body.trim())}
            buildEdition={async ({ language, mode, culture, onProgress }) => markdownEdition(title, await localizeMarkdown(md, { language, mode, culture, onProgress }), language, mode, culture)} />}
          {tab === "repurpose" && <BookRepurposePanel bookTitle={title} fullContent={md} />}
          {tab === "production" && <ProductionPanel meta={meta} setMeta={(x) => onUpdate({ ...m, meta: x as Record<string, unknown> })} bookTitle={title} manuscriptComplete={chapters.length > 0 && chapters.every((s) => s.body.trim())} coverDone={Boolean(cover)} parentId={m.libraryId ?? null} content={md} />}
          {tab === "publish" && <BookPublishingPackage outline={outline} />}
          {tab === "library" && (
            <div className="max-w-xl space-y-5">
              <p className="text-[14px] text-[#475569] dark:text-[#CBD5E1]">Compiles every section in publishing order into one book in your Library. Saving again updates the same book.</p>
              <div className="flex flex-wrap items-center gap-4">
                <Select value={shelf || "__"} onValueChange={(v) => setShelf(v === "__" ? "" : v)}><SelectTrigger className="w-[200px]" aria-label="Shelf"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__">No shelf</SelectItem>{DEFAULT_SHELVES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                <label className="flex items-center gap-2 text-[14px]"><Switch checked={complete} onCheckedChange={setComplete} /> Completed</label>
                <label className="flex items-center gap-2 text-[14px]"><Switch checked={contents} onCheckedChange={setContents} /> Table of contents</label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveToLibrary} disabled={saving || !m.sections.length}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />} {m.libraryId ? "Update the book in my Library" : "Save the book to my Library"}</Button>
                {m.libraryId && <Button asChild variant="outline"><Link to={`/library?open=${m.libraryId}`}><Library className="h-4 w-4" /> Open in Library</Link></Button>}
                <Button variant="ghost" onClick={() => download(`${title.replace(/[^\p{L}\p{N} _-]+/gu, "")}.md`, md)}><Download className="h-4 w-4" /> .md</Button>
                <Button variant="ghost" onClick={() => download("authorship-notes.md", authorshipNotes(m))}><FileText className="h-4 w-4" /> Authorship notes</Button>
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
