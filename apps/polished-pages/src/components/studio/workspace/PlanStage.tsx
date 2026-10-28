import { useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, ChevronDown, History, Layers3, ListTree, Loader2, PenLine, Plus, Replace, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { LARGE_CHAPTER_WORDS, SECTION_KINDS, insertSection, kindDef, largeSections, moveSection, words, type Manuscript } from "@/lib/manuscript";
import { outlineToManuscript } from "@/lib/studio-merge";
import type { BookEngine } from "@/lib/book-engine";
import type { BookDepth, BookMode } from "@/types/book";
import { EYEBROW, GRADIENT, PAPER, SERIF } from "./ui";
import type { ApproachId } from "./approaches";
import BookDesignDialog from "./BookDesignDialog";
import { BOOK_TYPES, sectionsToWrite, type BookDesign, type BookTypeId, type DesignBriefInput } from "@/lib/book-design";

const MODES: { id: BookMode; label: string; line: string }[] = [
  { id: "improve", label: "Improve", line: "An outline for an improved version" },
  { id: "guided", label: "Guided", line: "A thorough outline with chapter summaries" },
  { id: "quick", label: "Quick", line: "A complete outline, bold decisions" },
  { id: "publish", label: "Publish-ready", line: "With positioning, keywords and categories" },
];
const GROUPS = [{ id: "front", label: "Front Matter" }, { id: "body", label: "Main Matter" }, { id: "back", label: "Back Matter" }] as const;

// Plan (design spec §2): the book's contents, with the plan and notes for each
// chapter, its order, Claude's outline, and turning the book into a series.
export default function PlanStage({ m, onUpdate, onOpen, engine, approach, hasUploads, onWriteAll, queue, onSeries, busy, onFinish, onDesign, onApplyDesign, onRestore, onWizard, onResplit, onOrganise, onFind }: {
  m: Manuscript; onUpdate: (m: Manuscript) => void; onOpen: (id: string) => void; engine: BookEngine | null; approach: ApproachId; hasUploads: boolean;
  onWriteAll: (ids: string[]) => void; queue: { done: number; total: number } | null; onSeries: () => void; busy: boolean;
  /** Finish joins every chapter into one book. */
  onFinish: () => void;
  /** Rebuild as a professional book (DESIGN-SPEC.md §17): Claude's design, then applying it. */
  onDesign?: (b: DesignBriefInput) => Promise<BookDesign>;
  onApplyDesign: (d: BookDesign, b: DesignBriefInput) => void;
  /** Puts back a manuscript a rebuild replaced. */
  onRestore: (index: number) => void;
  /** Opens the Book wizard inside this project. */
  onWizard?: () => void;
  /** Splits the uploaded manuscript into chapters again (when the first split found the wrong headings). */
  onResplit?: () => void;
  /** Organise a book (uploaded here, in Sources, or the manuscript as it is) into chapters and sections. */
  onOrganise?: () => void;
  /** Find and replace across the book (§21). */
  onFind?: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const [outlining, setOutlining] = useState(false);
  const [showOutline, setShowOutline] = useState(!m.sections.length);
  const [mode, setMode] = useState<BookMode>("guided");
  const [designing, setDesigning] = useState(false);
  const [depth, setDepth] = useState<BookDepth>("standard");
  const [genre, setGenre] = useState("");
  const [audience, setAudience] = useState("");
  // After a rebuild every designed section with a plan is written (chapters first); otherwise the empty chapters.
  const empty = sectionsToWrite(m);
  const written = m.sections.filter((s) => s.kind === "chapter" && s.body.trim());
  const large = largeSections(m);

  const outline = async () => {
    if (!engine) return;
    setOutlining(true);
    try {
      const o = await engine.outline({ bookTitle: m.title || "Untitled book", genre, targetAudience: audience, depth, mode, existingContent: m.sections.map((s) => `## ${s.title}\n\n${s.body}`).join("\n\n").slice(0, 200_000), knowledge: m.knowledge ?? null, ...(engine.approaches ? { approach } : {}) });
      onUpdate(outlineToManuscript(o, m));
      setShowOutline(false);
      toast({ title: "Outline added", description: `${o.chapters.length} chapters. Chapters you already had kept their text.` });
    } catch (e) { toast({ title: "Couldn't outline the book", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setOutlining(false); }
  };

  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4" /> Add a section <ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[60vh] w-64 overflow-y-auto">
        {GROUPS.map((g, gi) => (
          <div key={g.id}>
            {gi > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground">{g.label}</DropdownMenuLabel>
            {SECTION_KINDS.filter((k) => k.group === g.id).map((k) => {
              const taken = k.single && m.sections.some((s) => s.kind === k.kind);
              return <DropdownMenuItem key={k.kind} disabled={taken} onClick={() => { const r = insertSection(m, k.kind); onUpdate(r.manuscript); setOpen(r.id); }}>{k.label}{taken && <span className="ml-auto text-[10px] text-muted-foreground">added</span>}</DropdownMenuItem>;
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-start justify-center gap-10">
      <article className={`min-w-0 flex-[1_1_620px] px-6 py-12 sm:px-16 ${PAPER}`}>
        <h1 className={`${SERIF} mb-10 text-center text-[36px] font-medium`}>Contents</h1>
        {large.length > 0 && (
          <div role="status" className="mb-8 rounded-[10px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[13.5px]">
            <p className="font-medium">{large.length === 1 ? `“${large[0].title || "One section"}” is` : `${large.length} sections are`} very long (over {LARGE_CHAPTER_WORDS.toLocaleString()} words{large.length === 1 ? `: ${words(large[0].body).toLocaleString()}` : ""}).</p>
            <p className="mt-1 text-[12.5px] opacity-90">Claude works less reliably on a section this long, and readers expect shorter chapters. Organise finds the chapters and sections inside it and titles them, without changing a word.</p>
            {onOrganise && <Button size="sm" variant="outline" className="mt-2" disabled={busy} onClick={onOrganise}><ListTree className="h-4 w-4" /> Organise into chapters and sections</Button>}
          </div>
        )}
        {!m.sections.length && <p className="text-center text-[14px] text-[#64748B]">No sections yet. Outline the book with Claude, or add sections yourself.</p>}
        {GROUPS.map((g) => {
          const list = m.sections.filter((s) => kindDef(s.kind).group === g.id);
          if (!list.length) return null;
          return (
            <section key={g.id} aria-label={g.label} className="mb-6">
              {g.id !== "body" && <p className="mb-1 text-[12px] font-medium text-[#64748B]">{g.label}</p>}
              <ol>
                {list.map((s) => {
                  const n = g.id === "body" ? m.sections.filter((x) => x.kind === "chapter").indexOf(s) + 1 : 0;
                  const isOpen = open === s.id;
                  return (
                    <li key={s.id} className="border-b border-[#F1F5F9] py-3 dark:border-white/5">
                      <div className="flex items-baseline gap-3">
                        <span className={`${SERIF} w-6 shrink-0 text-[16px] tabular-nums text-[#64748B]`}>{n || ""}</span>
                        <button type="button" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen} className={`${SERIF} min-w-0 text-left text-[18px] text-[#172033] hover:text-[#1D4ED8] dark:text-[#E5E7EB]`}>{s.title || kindDef(s.kind).label}</button>
                        <span aria-hidden className="mb-1 min-w-[24px] flex-1 border-b border-dotted border-[#CBD5E1] dark:border-white/15" />
                        <span className={`shrink-0 text-[12px] ${words(s.body) > LARGE_CHAPTER_WORDS ? "font-medium text-[#B45309] dark:text-amber-300" : "text-[#64748B]"}`}>{words(s.body) ? `${words(s.body).toLocaleString()} words` : "not written"}</span>
                      </div>
                      <div className="ml-9 mt-1 flex flex-wrap gap-x-3 text-[12px]">
                        <span className="text-[#475569] dark:text-[#94A3B8]">{s.idea?.trim() ? `Plan: ${s.idea.split("\n")[0].slice(0, 90)}${s.idea.length > 90 ? "…" : ""}` : "+ Chapter notes"}</span>
                        {(s.pageNotes?.length ?? 0) > 0 && <span className="text-[#92400E] dark:text-amber-300">{s.pageNotes!.length} page {s.pageNotes!.length === 1 ? "note" : "notes"}</span>}
                      </div>
                      {isOpen && (
                        <div className="ml-9 mt-3 space-y-2">
                          <Input value={s.title} onChange={(e) => onUpdate({ ...m, sections: m.sections.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)) })} aria-label="Title" className="h-9" />
                          <Textarea value={s.idea ?? ""} rows={3} onChange={(e) => onUpdate({ ...m, sections: m.sections.map((x) => (x.id === s.id ? { ...x, idea: e.target.value } : x)) })} aria-label="Chapter notes and plan" placeholder="What this chapter should teach, keep, add or cut." className="text-[13.5px]" />
                          <div className="flex flex-wrap gap-1.5">
                            <Button size="sm" variant="outline" className="h-8" onClick={() => onOpen(s.id)}><PenLine className="h-3.5 w-3.5" /> Write</Button>
                            <Button size="sm" variant="ghost" className="h-8" aria-label="Move up" onClick={() => onUpdate(moveSection(m, s.id, -1))}><ArrowUp className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-8" aria-label="Move down" onClick={() => onUpdate(moveSection(m, s.id, 1))}><ArrowDown className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-8 text-[#B91C1C]" onClick={() => { if (window.confirm(`Delete “${s.title}” and its text?`)) onUpdate({ ...m, sections: m.sections.filter((x) => x.id !== s.id) }); }}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
        <div className="mt-6 flex flex-wrap gap-2">{addMenu}{onFind && m.sections.length > 0 && <Button size="sm" variant="outline" onClick={onFind}><Replace className="h-4 w-4" /> Find and replace</Button>}</div>
      </article>

      <aside className="flex-[0_1_280px] space-y-8">
        <div>
          <p className={EYEBROW}>Plan</p>
          <p className={`${SERIF} mt-2 text-[24px] leading-tight`}>The shape of the book</p>
          <p className="mt-2 text-[13.5px] text-[#64748B]">Open a chapter to rename it, move it, or add the notes Claude follows when it writes.</p>
        </div>

        <div className="space-y-2 rounded-[10px] border border-[#BFD3FF] bg-[#F5F8FF] p-4 dark:border-[#1E3A8A] dark:bg-[#1E3A8A]/20">
          <p className="flex items-center gap-2 text-[14px] font-semibold"><Sparkles className="h-4 w-4 text-[#2563EB]" /> Rebuild as a professional book</p>
          <p className="text-[12.5px] text-[#475569] dark:text-[#CBD5E1]">Tell Claude what the book must become (a course textbook, a book for general readers…). Claude designs it from the whole of your material, not in the manuscript's order: parts, chapters, openings, summaries, questions. You review the design before anything changes.</p>
          {m.design && <p className="text-[12px] text-[#64748B]">Rebuilt as: {BOOK_TYPES[m.design.bookType as BookTypeId]?.label ?? m.design.bookType} · {m.design.approach === "mine-and-research" ? "my book + cited sources" : "from my book only"} · {new Date(m.design.at).toLocaleDateString()}</p>}
          <Button variant="outline" className="h-9 w-full" disabled={!onDesign || busy || Boolean(queue) || !hasUploads} onClick={() => setDesigning(true)}>
            <Sparkles className="h-4 w-4" /> {m.design ? "Design it again" : "Rebuild the book"}
          </Button>
          {!hasUploads && <p className="text-[12px] text-[#64748B]">Upload your book in Sources first: Claude writes the new chapters from it.</p>}
          {(m.archive ?? []).map((a, i) => (
            <button key={`${a.at}-${i}`} type="button" onClick={() => { if (window.confirm(`Put back the manuscript from ${new Date(a.at).toLocaleString()} (${a.sections.length} sections)?\n\nThe current manuscript is kept too, so you can switch back.`)) onRestore(i); }}
              className="flex w-full items-center gap-1.5 text-left text-[12.5px] font-medium text-[#2563EB] hover:underline"><History className="h-3.5 w-3.5 shrink-0" /> Restore: {a.label.toLowerCase()} ({new Date(a.at).toLocaleDateString()}, {a.sections.length} sections)</button>
          ))}
        </div>

        {onOrganise && (
          <div className="space-y-2 rounded-[10px] border border-[#E6E8ED] bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <p className="flex items-center gap-2 text-[14px] font-semibold"><ListTree className="h-4 w-4 text-[#2563EB]" /> Organise into chapters and sections</p>
            <p className="text-[12.5px] text-[#64748B]">Upload a book here, or use the manuscript as it is (a rewritten book too): Claude finds its chapters and sections and titles them. Not a word of the text changes.</p>
            <Button variant="outline" className="h-9 w-full" disabled={busy || Boolean(queue)} onClick={onOrganise}><ListTree className="h-4 w-4" /> Organise the book</Button>
          </div>
        )}

        <div className="space-y-2">
          <Button className={`h-11 w-full ${GRADIENT}`} disabled={!empty.length || Boolean(queue) || busy || (approach !== "new" && !hasUploads)}
            onClick={() => onWriteAll(empty)}>
            {queue ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing {queue.done + 1} of {queue.total}…</> : <><Sparkles className="h-4 w-4" /> Write the {empty.length || ""} empty {m.design ? (empty.length === 1 ? "section" : "sections") : empty.length === 1 ? "chapter" : "chapters"}</>}
          </Button>
          <p className="text-[12px] text-[#64748B]">{approach !== "new" && !hasUploads ? "Upload your book in Sources, or choose “New from outline” in Write." : "One at a time, with the approach chosen in Write. Each one waits for you to review."}</p>
        </div>

        {/* Chapter-by-chapter rewrite of the whole book, then Finish merges it into one book. */}
        <div className="space-y-2 rounded-[10px] border border-[#E6E8ED] bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-[14px] font-semibold">Rewrite chapter by chapter</p>
          <p className="text-[12.5px] text-[#64748B]">Claude rewrites each of the {written.length} written {written.length === 1 ? "chapter" : "chapters"} in turn, following your book rules, page notes and each chapter's idea. Every chapter waits for you to accept it.</p>
          <Button variant="outline" className="h-9 w-full" disabled={!written.length || Boolean(queue) || busy} onClick={() => onWriteAll(written.map((s) => s.id))}>
            <PenLine className="h-4 w-4" /> Rewrite all {written.length || ""} {written.length === 1 ? "chapter" : "chapters"}
          </Button>
          <p className="pt-1 text-[12.5px] text-[#64748B]">Then <button type="button" onClick={onFinish} className="font-medium text-[#2563EB] hover:underline">Finish</button> joins every chapter, front and back matter into one book: preview, export, or save it to your Library.</p>
        </div>

        <div className="border-t border-[#E6E8ED] pt-6 dark:border-white/10">
          <button type="button" onClick={() => setShowOutline(!showOutline)} aria-expanded={showOutline} className="flex w-full items-center justify-between text-[14px] font-semibold"><span className="flex items-center gap-2"><ListTree className="h-4 w-4 text-[#2563EB]" /> Outline with Claude</span><ChevronDown className={`h-4 w-4 transition-transform ${showOutline ? "rotate-180" : ""}`} /></button>
          {showOutline && (
            <div className="mt-4 space-y-2.5">
              <Select value={mode} onValueChange={(v) => setMode(v as BookMode)}><SelectTrigger aria-label="Outline style"><SelectValue /></SelectTrigger><SelectContent>{MODES.map((x) => <SelectItem key={x.id} value={x.id}>{x.label} · {x.line}</SelectItem>)}</SelectContent></Select>
              <Select value={depth} onValueChange={(v) => setDepth(v as BookDepth)}><SelectTrigger aria-label="Length"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="short">Short · about 6 chapters</SelectItem><SelectItem value="standard">Standard · 8–10 chapters</SelectItem><SelectItem value="detailed">Detailed · 10–12 chapters</SelectItem></SelectContent></Select>
              <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre (optional)" aria-label="Genre" />
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Readers (optional)" aria-label="Readers" />
              <Button variant="outline" className="w-full" disabled={!engine || outlining || busy} onClick={outline}>{outlining ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListTree className="h-4 w-4" />} Outline the book</Button>
              <p className="text-[12px] text-[#64748B]">Chapters you already have keep their text; new ones are added with their plan.</p>
            </div>
          )}
        </div>

        <div className="border-t border-[#E6E8ED] pt-6 dark:border-white/10">
          {onWizard && <Button variant="outline" className="mb-2 w-full" onClick={onWizard} disabled={busy}><BookOpen className="h-4 w-4" /> Book wizard</Button>}
          {onResplit && <Button variant="outline" className="mb-2 w-full" onClick={onResplit} disabled={busy || Boolean(queue)} title="When the chapters were split at the wrong headings">Split the upload again</Button>}
          <Button variant="outline" className="w-full" onClick={onSeries} disabled={busy}><Layers3 className="h-4 w-4" /> Turn into a series</Button>
        </div>
      </aside>
      {designing && onDesign && <BookDesignDialog initial={m.design as Partial<DesignBriefInput> | undefined} sections={m.sections.length} design={onDesign} engineLabel={engine?.label}
        onClose={() => setDesigning(false)}
        onApply={(d, b) => { onApplyDesign(d, b); setDesigning(false); toast({ title: "The new book is laid out", description: `${d.sections.length} sections, each with its plan. Next: write them (chapters first). Your earlier manuscript can be restored here.` }); }} />}
    </div>
  );
}
