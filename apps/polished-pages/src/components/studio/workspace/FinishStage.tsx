import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import PublishingPackage from "./PublishingPackage";
import { Link } from "react-router-dom";
import { AlertTriangle, BookOpen, Box, Check, Download, FileText, Info, Library, Loader2, Square } from "lucide-react";
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
import { FORMATS, estimatePages, formatReport, type FixTarget, type FormatId } from "@/lib/format-readiness";
import { auditBook } from "@/lib/editorial-audit";
import EditorialCheck from "./EditorialCheck";
import { coverSpec, getTrim } from "@/lib/print-sizes";
import { EYEBROW, SERIF } from "./ui";
import BookCover3D from "./BookCover3D";

const BookReader = lazy(() => import("@/components/book/BookReader"));
const CoverGenerator = lazy(() => import("@/components/book/CoverGenerator"));
const BookExportPanel = lazy(() => import("@/components/book/BookExportPanel"));
const AudiobookPanel = lazy(() => import("@/components/book/AudiobookPanel"));
const LocalizePanel = lazy(() => import("@/components/app/LocalizePanel"));
const BookRepurposePanel = lazy(() => import("@/components/book/BookRepurposePanel"));
const ProductionPanel = lazy(() => import("@/components/book/ProductionPanel"));
const BookPublishingPackage = lazy(() => import("@/components/book/BookPublishingPackage"));
const TeacherPanel = lazy(() => import("./TeacherPanel"));

type Tab = "preview" | "check" | "cover" | "export" | "audio" | "translate" | "repurpose" | "marketing" | "studyguide" | "production" | "publish" | "library" | "teacher";
/** Finish tabs that run a Studio tool on the manuscript and open its result (DESIGN-SPEC.md §2: marketing and study guide belong to Finish). */
const TOOL_TABS: Record<"marketing" | "studyguide", { output: string; title: string; line: string; run: string }> = {
  marketing: { output: "marketing-pack.md", title: "Marketing pack", line: "Title and subtitle options, a hook, the blurb, back-cover copy, the store description, keywords, categories, an author bio template, social posts and a press release, from the book as it stands. Never invented endorsements or facts about the author.", run: "Write the marketing pack" },
  studyguide: { output: "study-guide.md", title: "Study guide", line: "Chapter summaries, discussion questions, key terms and a quiz for readers, classes and small groups, from the book as it stands.", run: "Write the study guide" },
};
const TABS: { id: Tab; label: string }[] = [
  { id: "preview", label: "Preview" }, { id: "check", label: "Editorial check" }, { id: "cover", label: "Cover" }, { id: "export", label: "Interior and export" }, { id: "audio", label: "Audiobook" },
  { id: "translate", label: "Translate" }, { id: "repurpose", label: "Repurpose" }, { id: "marketing", label: "Marketing" }, { id: "studyguide", label: "Study guide" }, { id: "production", label: "Production" }, { id: "publish", label: "Publishing package" }, { id: "library", label: "Save to Library" }, { id: "teacher", label: "AI Teacher" },
];
const download = (name: string, text: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };

const savedFrontCover = async (libraryId: string) => (await findBookCover(libraryId))?.payload.front || null;
const pref = (k: string, f: string) => { try { return localStorage.getItem(k) ?? f; } catch { return f; } };
const keep = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* per-browser preference */ } };

// Finish (design spec §9): readiness that links to its fix, the real cover
// (flat, or as a book), a format switcher showing what each format needs, and
// every finishing tool working on the manuscript as it is now.
export default function FinishStage({ m, onUpdate, onOpen, coverWriter, findCover = savedFrontCover, projectId, onTool, outputs, onOpenResult }: {
  m: Manuscript; onUpdate: (m: Manuscript) => void; onOpen: (sectionId: string) => void; coverWriter?: CoverCopyWriter;
  /** Finds the saved front cover of the Library book (the Studio preview passes a stand-in). */
  findCover?: (libraryId: string) => Promise<string | null>;
  /** The Studio project, so the Library copy can link back to it. */
  projectId?: string;
  /** Runs a tool on the manuscript (Marketing, Study guide), and the project's results to open. */
  onTool?: (tool: "marketing" | "studyguide") => void;
  outputs?: { path: string; modifiedAt: string }[];
  onOpenResult?: (path: string) => void;
}) {
  const { toast } = useToast();
  // The sidebar's "Book cover" opens Finish at the cover.
  const [tab, setTab] = useState<Tab>(() => { try { const t = sessionStorage.getItem("studio.finish.tab"); sessionStorage.removeItem("studio.finish.tab"); return t === "cover" ? "cover" : "preview"; } catch { return "preview"; } });
  const [shelf, setShelf] = useState("");
  const [complete, setComplete] = useState(false);
  const [contents, setContents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const [dimensional, setDimensional] = useState(() => pref("studio.cover3d", "flat") === "3d");
  const [format, setFormatState] = useState<FormatId>(() => (FORMATS.some((f) => f.id === pref("studio.format", "")) ? pref("studio.format", "epub") : "epub") as FormatId);
  const setFormat = (f: FormatId) => { setFormatState(f); keep("studio.format", f); };
  const title = m.title.trim() || "Untitled book";
  const md = useMemo(() => compile(m, { contents }), [m, contents]);
  const meta = (m.meta ?? {}) as BookMeta;
  const chapters = m.sections.filter((s) => s.kind === "chapter");

  useEffect(() => { let live = true; if (m.libraryId) findCover(m.libraryId).then((c) => { if (live) setCover(c); }).catch(() => {}); return () => { live = false; }; }, [m.libraryId, tab, findCover]);
  const trim = getTrim(String(meta.trimSize || "6x9"));
  const spineMm = coverSpec(trim, Number(meta.pageCount) || estimatePages(m, trim.id), String(meta.paper || "Cream")).spineMm;
  const fix = (t?: FixTarget, sectionId?: string) => { if (t === "section") { if (sectionId) onOpen(sectionId); } else if (t) setTab(t); };

  /** Saves the book to the Library (updating the same book after the first time) and returns its id. */
  const ensureSaved = async (): Promise<string | null> => {
    try {
      // The Library copy keeps the book's author, trim size and its Studio project, so it isn't a thinner copy.
      const payload = { markdown: md, title, ...(m.author?.trim() ? { author: m.author.trim() } : {}), ...(meta.trimSize ? { trimSize: String(meta.trimSize) } : {}), ...(projectId ? { studioProject: projectId } : {}) };
      const preview = md.replace(/^#.*$/m, "").trim().slice(0, 160);
      if (m.libraryId) { await updateDocument(m.libraryId, payload, preview); return m.libraryId; }
      const id = await saveDocument({ kind: "book", title, payload, preview });
      onUpdate({ ...m, libraryId: id });
      return id;
    } catch (e) { toast({ title: "Couldn't save the book", description: e instanceof Error ? e.message : "", variant: "destructive" }); return null; }
  };

  // Readiness, per format (spec §9): only true facts, each with the place to fix it.
  // The editorial check of the whole book, once, for every format (DESIGN-SPEC.md §15).
  const bookRules = [m.rules, m.knowledge?.terminology].filter(Boolean).join("\n");
  const plain = useMemo(() => compile(m), [m]);
  const audit = useMemo(() => auditBook(plain, { rules: bookRules }), [plain, bookRules]);
  const reports = useMemo(() => FORMATS.map((f) => formatReport(f.id, m, { cover: Boolean(cover), audit })), [m, cover, audit]);
  /** The section a place in the compiled book belongs to: the nearest section heading at or above it. */
  const sectionAt = (line: number) => {
    const heads = plain.split("\n").slice(0, line).map((l, i) => ({ l, i })).filter((x) => /^##\s/.test(x.l)).map((x) => x.l.replace(/^##\s+/, "").replace(/\s*\{[^}]*\}\s*$/, "").trim());
    const title = heads[heads.length - 1];
    return m.sections.find((s) => s.title.trim() === title)?.id;
  };
  const report = reports.find((r) => r.id === format)!;

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
          {cover && dimensional ? <BookCover3D src={cover} alt={`${title} as a printed book`} spineMm={spineMm} trimHmm={trim.hmm} trimWmm={trim.wmm} />
            : cover ? <img src={cover} alt={`Front cover of ${title}`} className="h-[300px] w-auto rounded-[2px] shadow-[0_20px_40px_-20px_rgba(15,23,42,.5)]" />
            : <div className="grid h-[300px] w-[200px] place-items-center rounded-[2px] border border-dashed border-[#CBD5E1] p-6 text-center text-[13px] text-[#64748B] dark:border-white/20">No cover yet.<br /><button type="button" onClick={() => setTab("cover")} className="mt-2 font-medium text-[#2563EB] hover:underline">Design it</button></div>}
          <figcaption className="mt-2 flex items-center gap-2 text-[12px] text-[#64748B]">
            <span className="flex-1">{cover ? (dimensional ? `As a book: spine ${spineMm.toFixed(1)} mm` : "Your saved front cover") : "The front cover appears here"}</span>
            {cover && (
              <span role="group" aria-label="Cover view" className="inline-flex rounded-[7px] bg-[#F1F5F9] p-[2px] dark:bg-white/5">
                {([["flat", Square, "Flat"], ["3d", Box, "As a book"]] as const).map(([v, Icon, label]) => (
                  <button key={v} type="button" aria-pressed={dimensional === (v === "3d")} onClick={() => { setDimensional(v === "3d"); keep("studio.cover3d", v); }}
                    className={`inline-flex h-6 items-center gap-1 rounded-[5px] px-1.5 text-[11.5px] ${dimensional === (v === "3d") ? "bg-white font-medium text-[#172033] shadow-sm dark:bg-[#1F2430] dark:text-white" : "text-[#475569] dark:text-[#94A3B8]"}`}><Icon className="h-3 w-3" />{label}</button>
                ))}
              </span>
            )}
          </figcaption>
        </figure>
        <div className="min-w-[280px] flex-1">
          <p className={EYEBROW}>Finish</p>
          <h1 className={`${SERIF} mt-2 text-[36px] font-medium leading-[1.15]`}>{title}</h1>
          <p className="mt-1 text-[14px] text-[#64748B]">{m.sections.reduce((n, s) => n + words(s.body), 0).toLocaleString()} words · {chapters.length} chapters</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2" aria-label="Readiness by format">
            {reports.map((r) => {
              const todo = r.checks.filter((c) => !c.ok && c.level === "required").length;
              return (
                <li key={r.id}>
                  <button type="button" onClick={() => { setFormat(r.id); document.getElementById("formats-h")?.scrollIntoView({ block: "start", behavior: "smooth" }); }} aria-pressed={format === r.id}
                    className={`flex w-full items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-left text-[13.5px] transition-colors hover:border-[#CBD5E1] dark:hover:border-white/25 ${format === r.id ? "border-[#2563EB] bg-[#EFF6FF]/60 dark:bg-[#172554]/50" : "border-[#E6E8ED] bg-white dark:border-white/10 dark:bg-white/5"}`}>
                    {r.ready ? <Check className="h-4 w-4 shrink-0 text-[#047857]" aria-hidden /> : <AlertTriangle className="h-4 w-4 shrink-0 text-[#B45309]" aria-hidden />}
                    <span className="flex-1 font-medium">{r.label}</span>
                    <span className="text-[12.5px] text-[#64748B]">{r.ready ? "Ready" : `${todo} to fix`}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Format switcher (spec §9): each format's constraints, from the manuscript as it is now. */}
      <section aria-labelledby="formats-h" className="border-b border-[#E6E8ED] py-8 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-4">
          <h2 id="formats-h" className="font-sans text-[14px] font-semibold">Formats</h2>
          <div role="tablist" aria-label="Format" className="flex items-center gap-0.5 rounded-[9px] bg-[#F1F5F9] p-[3px] dark:bg-white/5">
            {FORMATS.map((f) => (
              <button key={f.id} type="button" role="tab" aria-selected={format === f.id} onClick={() => setFormat(f.id)}
                className={`h-[30px] rounded-[7px] px-3 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${format === f.id ? "bg-white font-semibold text-[#172033] shadow-[0_1px_2px_rgba(15,23,42,.1)] dark:bg-[#1F2430] dark:text-white" : "font-medium text-[#475569] hover:text-[#172033] dark:text-[#94A3B8] dark:hover:text-white"}`}>{f.label}</button>
            ))}
          </div>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[12px] font-medium ${report.ready ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"}`}>{report.ready ? `Ready for ${report.label}` : `${report.checks.filter((c) => !c.ok && c.level === "required").length} to fix for ${report.label}`}</span>
        </div>
        <div role="tabpanel" aria-label={report.label} className="mt-5 grid gap-8 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-[14px] text-[#475569] dark:text-[#CBD5E1]">{report.line}</p>
            <ul className="mt-3 space-y-1.5 text-[13px] text-[#64748B]">{report.facts.map((f) => <li key={f} className="flex gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{f}</li>)}</ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {format === "audiobook" ? <Button size="sm" onClick={() => setTab("audio")}>Make the audiobook</Button>
                : <Button size="sm" onClick={() => setTab("export")} disabled={!report.ready}>Export {report.label}…</Button>}
              {format === "paperback" && <Button size="sm" variant="outline" onClick={() => setTab("cover")}>Full wrap cover</Button>}
            </div>
            {!report.ready && format !== "audiobook" && <p className="mt-2 text-[12px] text-[#64748B]">Export opens once the items marked as needed are fixed; advice items don't block it.</p>}
          </div>
          <ul className="space-y-2 text-[13.5px]" aria-label={`What ${report.label} needs`}>
            {report.checks.map((c) => (
              <li key={c.text} className="flex items-center gap-2.5">
                {c.ok ? <Check className="h-4 w-4 shrink-0 text-[#047857]" aria-label="Done" /> : <AlertTriangle className={`h-4 w-4 shrink-0 ${c.level === "required" ? "text-[#B45309]" : "text-[#94A3B8]"}`} aria-label={c.level === "required" ? "Needed" : "Advised"} />}
                <span className="flex-1">{c.text}{!c.ok && c.level === "advised" && <span className="text-[#64748B]"> · advised</span>}</span>
                {!c.ok && c.fix && <button type="button" onClick={() => fix(c.fix, c.sectionId)} className="text-[13px] font-medium text-[#2563EB] hover:underline">Fix</button>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div role="tablist" aria-label="Finishing tools" className="mt-8 flex flex-wrap gap-1">
        {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`h-9 rounded-[8px] px-3 text-[13px] ${tab === t.id ? "bg-[#172033] font-medium text-white dark:bg-white dark:text-[#172033]" : "text-[#475569] hover:bg-muted dark:text-[#CBD5E1]"}`}>{t.label}</button>)}
      </div>

      <div className="mt-6 min-h-[40vh]">
        <Suspense fallback={<div className="grid min-h-[30vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
          {tab === "preview" && <BookReader content={md} title={title} />}
          {tab === "check" && <EditorialCheck text={plain} rules={bookRules} title="Editorial check of the book" placeLabel="Open the section" onPlace={(p) => { const sid = sectionAt(p.line); if (sid) onOpen(sid); }} />}
          {tab === "cover" && <CoverGenerator title={title} subtitle={m.subtitle} author={m.author} isbn={meta.isbn} publisher={meta.publisher || meta.imprint} pageCount={meta.pageCount} paper={meta.paper} trimSize={meta.trimSize}
            bookText={() => compile(m, { contents: false })} copyWriter={coverWriter} bookId={m.libraryId ?? null} ensureSaved={ensureSaved} onSaved={() => m.libraryId && findCover(m.libraryId).then(setCover)} />}
          {tab === "export" && <BookExportPanel bookTitle={title} fullContent={md} chapterCount={chapters.filter((s) => s.body.trim()).length} />}
          {tab === "audio" && <AudiobookPanel chapters={chapters.filter((s) => s.body.trim()).map((s) => ({ title: s.title, content: s.body }))} bookTitle={title} parentId={m.libraryId ?? null} ensureSaved={ensureSaved} />}
          {tab === "translate" && <LocalizePanel parentId={m.libraryId ?? null} ensureSaved={ensureSaved} kind="book" sourceTitle={title} hasContent={chapters.some((s) => s.body.trim())}
            buildEdition={async ({ language, mode, culture, onProgress }) => markdownEdition(title, await localizeMarkdown(md, { language, mode, culture, onProgress }), language, mode, culture)} />}
          {tab === "repurpose" && <BookRepurposePanel bookTitle={title} fullContent={md} />}
          {tab === "production" && <ProductionPanel meta={meta} setMeta={(x) => onUpdate({ ...m, meta: x as Record<string, unknown> })} bookTitle={title} manuscriptComplete={chapters.length > 0 && chapters.every((s) => s.body.trim())} coverDone={Boolean(cover)} parentId={m.libraryId ?? null} content={md} />}
          {tab === "publish" && <>
            <PublishingPackage markdown={md} input={{ title, subtitle: m.subtitle, author: m.author, isbn: meta.isbn ? String(meta.isbn) : undefined, publisher: String(meta.publisher || meta.imprint || "") || undefined, paper: meta.paper ? String(meta.paper) : undefined, trim, language: meta.language ? String(meta.language) : null, coverUrl: cover }} />
            <BookPublishingPackage outline={outline} />
          </>}
          {(tab === "marketing" || tab === "studyguide") && (() => {
            const t = TOOL_TABS[tab];
            const done = outputs?.find((o) => o.path === t.output);
            return (
              <div className="max-w-xl space-y-4">
                <p className={`${SERIF} text-[22px]`}>{t.title}</p>
                <p className="text-[14px] text-[#475569] dark:text-[#CBD5E1]">{t.line}</p>
                {done && <p className="text-[13px] text-[#64748B]">Last written {new Date(done.modifiedAt).toLocaleString()}. Writing it again keeps nothing of the old one, so open it first if you want to keep anything.</p>}
                <div className="flex flex-wrap gap-2">
                  {done && onOpenResult && <Button onClick={() => onOpenResult(t.output)}><FileText className="h-4 w-4" /> Open the {t.title.toLowerCase()}</Button>}
                  <Button variant={done ? "outline" : "default"} disabled={!onTool || !m.sections.some((s) => s.body.trim())} onClick={() => onTool?.(tab)}>{done ? `${t.run} again` : t.run}</Button>
                </div>
                {!m.sections.some((s) => s.body.trim()) && <p className="text-[12.5px] text-[#64748B]">Write the manuscript first: these are written from the book as it stands.</p>}
              </div>
            );
          })()}
          {tab === "teacher" && <TeacherPanel m={m} ensureSaved={ensureSaved} />}
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
