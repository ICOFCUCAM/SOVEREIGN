import { useEffect, useRef, useState } from "react";
import { AudioLines, BookOpen, CheckCircle2, CircleDashed, FileText, GitCompare, Layers, Loader2, Lock, MoreHorizontal, Plus, ScanText, ScrollText, Upload, Wand2, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import KnowledgePanel from "@/components/book/KnowledgePanel";
import { STUDIO_ACCEPT, type StudioFile, type StudioThread } from "@/lib/claude-studio";
import type { Manuscript } from "@/lib/manuscript";
import type { ToolId } from "@/lib/studio-tools";
import { formatBytes, type DialogAction } from "./parts";
import { EYEBROW, SERIF } from "./ui";

// Sources (design spec §2): what Claude builds the book from and the rules it
// never breaks: manuscripts, file tools, book details, rules, knowledge, voice.
export default function SourcesStage({ thread, m, uploading, onUpload, onRemove, onTool, onAction, onJoin, onStart, wizardChapters, onUpdate, onVoice, busy, rulesRef, readText, onWizard, onOpenPdf }: {
  thread: StudioThread; m: Manuscript | null | undefined; uploading: string | null;
  onUpload: (files: FileList | File[]) => void; onRemove: (storedAs: string) => void;
  onTool: (t: ToolId) => void; onAction: (a: DialogAction) => void; onJoin: () => void;
  onStart: (from: "uploads" | "blank" | "wizard") => void; wizardChapters: number;
  /** Opens the Book wizard inside this project. */
  onWizard?: () => void;
  /** Opens a PDF the runner can't read in the owner's browser (password, scans). */
  onOpenPdf?: (f: StudioFile) => void;
  onUpdate: (m: Manuscript) => void; onVoice: () => void; busy: boolean; rulesRef: React.RefObject<HTMLTextAreaElement>;
  /** Reads a file's extracted text (for the word count and preview); null when there is none. */
  readText: (storedAs: string) => Promise<string | null>;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const originals = thread.files.filter((f) => f.kind === "original");
  const textCopy = (f: StudioFile) => /\.(txt|md|markdown)$/i.test(f.name) ? f.storedAs : thread.files.find((x) => x.kind === "text" && x.storedAs === f.storedAs.replace(/\.[^.]+$/, "") + ".txt")?.storedAs ?? null;

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-12">
      <header className="flex flex-wrap items-end gap-6">
        <div className="min-w-[280px] flex-1">
          <p className={EYEBROW}>Sources</p>
          <h1 className={`${SERIF} mt-2 text-[34px] font-medium leading-[1.15] text-[#172033] dark:text-white`}>Sources and rules</h1>
          <p className="mt-2 max-w-[60ch] text-[15px] text-[#64748B]">What Claude builds your book from, and the rules it never breaks.</p>
        </div>
        <Button className="h-10 px-4" onClick={() => file.current?.click()} disabled={Boolean(uploading)}>
          {uploading ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Uploading…</> : <><Upload className="h-4 w-4" /> Add a manuscript</>}
        </Button>
        <input ref={file} type="file" accept={STUDIO_ACCEPT} multiple hidden onChange={(e) => { if (e.target.files?.length) onUpload(e.target.files); e.target.value = ""; }} />
      </header>

      {/* Manuscripts: each one as a real document (spec §2): title, format, words, status, when it arrived, its opening lines. */}
      <section aria-labelledby="ms-h">
        <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-[#E6E8ED] pb-3 dark:border-white/10">
          <h2 id="ms-h" className="font-sans text-[14px] font-semibold text-[#172033] dark:text-white">Manuscripts <span className="ml-1 font-normal text-[#64748B]">{originals.length || ""}</span></h2>
          {/* Processing actions: one compact toolbar; the main one first, the rest in More. */}
          <div role="toolbar" aria-label="Manuscript tools" className="ml-auto flex flex-wrap items-center gap-1">
            <Button size="sm" variant="ghost" className="h-8" onClick={() => onAction("summarize")} disabled={busy || !originals.length}><ScrollText className="h-4 w-4" /> Summarise</Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => onAction("rewrite")} disabled={busy || !originals.length}><Wand2 className="h-4 w-4" /> Rewrite the whole book</Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={onJoin} disabled={busy}><Layers className="h-4 w-4" /> Join</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="More manuscript tools"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled={busy || !originals.length} onSelect={() => onTool("ocr")}><ScanText className="mr-2 h-4 w-4" /> Read scanned pages</DropdownMenuItem>
                <DropdownMenuItem disabled={busy || originals.length + thread.outputs.length < 2} onSelect={() => onTool("compare")}><GitCompare className="mr-2 h-4 w-4" /> Compare two versions</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files); }}
          className={`rounded-[12px] transition-colors ${drag ? "bg-[#EFF6FF] ring-2 ring-[#2563EB] dark:bg-[#172554]" : ""}`}>
          {originals.length ? (
            <ul className="grid gap-3 lg:grid-cols-2">
              {originals.map((f) => <ManuscriptCard key={f.storedAs} f={f} text={textCopy(f)} readText={readText} busy={busy} onRemove={() => { if (window.confirm(`Remove “${f.name}” from this project? The uploaded file and its extracted text are deleted; your book and results stay.`)) onRemove(f.storedAs); }} onOcr={() => (onOpenPdf && /\.pdf$/i.test(f.storedAs) ? onOpenPdf(f) : onTool("ocr"))} />)}
            </ul>
          ) : (
            <button type="button" onClick={() => file.current?.click()} disabled={Boolean(uploading)}
              className="flex w-full flex-col items-center justify-center gap-1.5 rounded-[12px] border-[1.5px] border-dashed border-[#CBD5E1] py-12 text-[14px] text-[#475569] transition-colors hover:border-[#2563EB] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:border-white/20 dark:text-[#CBD5E1]">
              <Upload className="h-5 w-5" /> Drop your manuscript here, or choose a file
              <span className="text-[12.5px] text-[#64748B]">PDF, Word, text, Markdown or scanned pages</span>
            </button>
          )}
        </div>
      </section>

      {/* Start the book: the two ways to rewrite it (spec §2, §10 "whole-book rewrite" and "guided rewrite … next chapter") */}
      {m === null && (
        <section aria-labelledby="start-h" className="rounded-[12px] border border-[#E6E8ED] bg-white p-6 dark:border-white/10 dark:bg-[#161A22]">
          <h2 id="start-h" className={`${SERIF} text-[24px] font-medium`}>Start the book</h2>
          <p className="mt-1 text-[14px] text-[#64748B]">Choose how Claude works on your manuscript. Either way your original stays untouched until you accept the new text.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF]/50 p-5 dark:border-[#1E3A8A] dark:bg-[#172554]/40">
              <p className="text-[15px] font-semibold">Chapter by chapter <span className="ml-1 rounded-full bg-[#2563EB] px-2 py-0.5 text-[11px] font-medium text-white">Recommended</span></p>
              <ol className="mt-2 flex-1 list-decimal space-y-1 pl-5 text-[13px] text-[#475569] dark:text-[#CBD5E1]">
                <li>Your manuscript is split into its chapters.</li>
                <li>Claude rewrites each chapter with your idea, rules and page notes; you accept or reject every change.</li>
                <li>Finish joins all chapters back into one book.</li>
              </ol>
              <Button className="mt-4" onClick={() => onStart("uploads")} disabled={!originals.length}><BookOpen className="h-4 w-4" /> Split into chapters</Button>
            </div>
            <div className="flex flex-col rounded-[10px] border border-[#E6E8ED] p-5 dark:border-white/10">
              <p className="text-[15px] font-semibold">The whole book in one run</p>
              <p className="mt-2 flex-1 text-[13px] text-[#475569] dark:text-[#CBD5E1]">Claude rewrites the entire manuscript under your strict instructions, re-reading them before each chapter, and returns one rewritten book as a result you can open, edit and save.</p>
              <Button variant="outline" className="mt-4" onClick={() => onAction("rewrite")} disabled={busy || !originals.length}><Wand2 className="h-4 w-4" /> Rewrite the whole book</Button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#E6E8ED] pt-4 text-[13px] dark:border-white/10">
            <span className="text-[#64748B]">Or start from</span>
            {wizardChapters > 0 && <Button size="sm" variant="ghost" onClick={() => onStart("wizard")}><FileText className="h-4 w-4" /> my Book wizard draft ({wizardChapters} chapters)</Button>}
            {onWizard && <Button size="sm" variant="ghost" onClick={onWizard}><BookOpen className="h-4 w-4" /> the Book wizard</Button>}
            <Button size="sm" variant="ghost" onClick={() => onStart("blank")}><Plus className="h-4 w-4" /> a blank book</Button>
          </div>
        </section>
      )}

      {m && (
        <div className="grid gap-12 lg:grid-cols-2">
          <section aria-labelledby="details-h" className="space-y-3">
            <h2 id="details-h" className="font-sans text-[14px] font-semibold">Book details</h2>
            <Input value={m.title} onChange={(e) => onUpdate({ ...m, title: e.target.value })} placeholder="Title" aria-label="Book title" className={`${SERIF} h-11 text-[18px]`} />
            <Input value={m.subtitle ?? ""} onChange={(e) => onUpdate({ ...m, subtitle: e.target.value })} placeholder="Subtitle" aria-label="Subtitle" />
            <Input value={m.author ?? ""} onChange={(e) => onUpdate({ ...m, author: e.target.value })} placeholder="Author" aria-label="Author" />
          </section>
          <section aria-labelledby="rules-h">
            <h2 id="rules-h" className="font-sans text-[14px] font-semibold">Rules for the whole book</h2>
            <p className="mb-3 mt-1 text-[13px] text-[#64748B]">One per line. Every action follows them, including material from other sources.</p>
            <Textarea ref={rulesRef} value={m.rules ?? ""} onChange={(e) => onUpdate({ ...m, rules: e.target.value })} rows={5} aria-labelledby="rules-h"
              placeholder={"Write Yahusha instead of Jesus\nWrite Yahuah instead of God (never Jehovah or Yahweh)"} className="rounded-[8px] text-[14px]" />
          </section>
        </div>
      )}

      {m && (
        <section aria-labelledby="kb-h">
          <h2 id="kb-h" className="font-sans mb-1 text-[14px] font-semibold">Knowledge</h2>
          <p className="mb-4 text-[13px] text-[#64748B]">Required terminology, forbidden words and reference documents from your Library.</p>
          <KnowledgePanel knowledge={m.knowledge ?? { rules: "", terminology: "", forbidden: "" }} setKnowledge={(k) => onUpdate({ ...m, knowledge: k })}
            activeDocIds={m.knowledgeDocIds ?? []} onActiveDocsChange={(ids) => onUpdate({ ...m, knowledgeDocIds: ids })} />
        </section>
      )}

      <section className="flex flex-wrap items-start gap-10 border-t border-[#E6E8ED] pt-8 dark:border-white/10">
        <div className="min-w-[240px] flex-1">
          <h2 className="font-sans flex items-center gap-2 text-[14px] font-semibold"><AudioLines className="h-4 w-4 text-[#2563EB]" /> Your voice</h2>
          <p className="mt-1 text-[13px] text-[#64748B]">"In my voice" follows your voice profile, learned from your own writing.</p>
          <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={onVoice}>Open My voice</Button><Button size="sm" variant="ghost" onClick={() => onTool("voice-profile")} disabled={busy || !originals.length}>Learn it from these files</Button></div>
        </div>
        <div className="min-w-[240px] flex-1">
          <h2 className="font-sans flex items-center gap-2 text-[14px] font-semibold"><Lock className="h-4 w-4 text-[#2563EB]" /> Private and contained</h2>
          <p className="mt-1 text-[13px] text-[#64748B]">Claude works only inside this project: it reads your files, searches and opens web pages, and writes results. It cannot run programs or reach anything else on the server.</p>
        </div>
      </section>
    </div>
  );
}

/** The cover title's size: the longest word fits the 72px measure (Newsreader capitals are about 0.8em wide). */
const coverSize = (title: string) => Math.max(9, Math.min(13, Math.floor(72 / (Math.max(...title.split(/\s+/).map((w) => w.length)) * (title === title.toUpperCase() ? 0.8 : 0.55)))));

/**
 * One manuscript as a document: a typographic cover (its title set in the book
 * face), the facts the Studio actually has (format, size, words once its text
 * is read, when it arrived) and its opening lines. Nothing is invented: a scan
 * whose text has not been read says so.
 */
function ManuscriptCard({ f, text, readText, busy, onRemove, onOcr }: { f: StudioFile; text: string | null; readText: (s: string) => Promise<string | null>; busy: boolean; onRemove: () => void; onOcr: () => void }) {
  const [body, setBody] = useState<string | null | undefined>(text ? undefined : null);
  useEffect(() => { let live = true; if (text) readText(text).then((t) => { if (live) setBody(t ?? null); }).catch(() => { if (live) setBody(null); }); return () => { live = false; }; }, [text, readText]);
  const title = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+(ms|word|final|draft)\b.*$/i, "").trim() || f.name;
  const ext = (f.name.split(".").pop() ?? "").toUpperCase();
  const words = body ? body.trim().split(/\s+/).filter(Boolean).length : null;
  const opening = body ? body.replace(/^\s*#.*$/m, "").replace(/\s+/g, " ").trim().slice(0, 220) : "";
  const arrived = f.at ? new Date(f.at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : null;
  return (
    <li className="group relative flex gap-4 rounded-[12px] border border-[#E6E8ED] bg-white p-4 transition-colors hover:border-[#CBD5E1] dark:border-white/10 dark:bg-[#161A22] dark:hover:border-white/20">
      <div aria-hidden className="relative flex h-[132px] w-[96px] shrink-0 flex-col justify-between overflow-hidden rounded-[3px] bg-[#1B2438] px-3 py-3.5 text-[#F3E7C9] shadow-[inset_3px_0_0_rgba(0,0,0,.25),0_1px_2px_rgba(15,23,42,.12)] dark:ring-1 dark:ring-white/10">
        <span className="h-px w-6 bg-[#C9A55B]/70" />
        <span className={`${SERIF} line-clamp-4 leading-[1.2] [overflow-wrap:anywhere]`} style={{ fontSize: coverSize(title) }}>{title}</span>
        <span className="text-[9px] font-semibold tracking-[0.18em] text-[#C9A55B]">{ext}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold text-[#172033] dark:text-white" title={f.name}>{title}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-[#64748B]">{f.name}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[#475569] dark:text-[#CBD5E1]">
          <span>{ext}</span><span aria-hidden>·</span><span>{formatBytes(f.bytes)}</span>
          {words !== null && <><span aria-hidden>·</span><span>{words.toLocaleString()} words</span></>}
          {arrived && <><span aria-hidden>·</span><span>Added {arrived}</span></>}
        </p>
        <p className="mt-2 text-[12.5px]">
          {body === undefined ? <span className="inline-flex items-center gap-1.5 text-[#64748B]"><Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> Reading the text…</span>
            : body ? <span className="inline-flex items-center gap-1.5 text-[#047857] dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Text ready for Claude</span>
            : <span className="inline-flex items-center gap-1.5 text-[#B45309]"><CircleDashed className="h-3.5 w-3.5" /> No text yet{/\.(pdf|png|jpe?g|tiff?|heic|webp)$/i.test(f.name) && <> · <button type="button" onClick={onOcr} disabled={busy} className="font-medium underline-offset-2 hover:underline">{/\.pdf$/i.test(f.name) ? "open it (password or scanned pages)" : "read the scanned pages"}</button></>}</span>}
        </p>
        {opening && <p className={`${SERIF} mt-2 line-clamp-2 text-[13.5px] leading-[1.5] text-[#475569] dark:text-[#94A3B8]`}>{opening}…</p>}
      </div>
      <button type="button" disabled={busy} onClick={onRemove} aria-label={`Remove ${f.name}`}
        className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-md text-[#64748B] opacity-0 transition-opacity hover:bg-[#F1F5F9] hover:text-[#172033] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] group-hover:opacity-100 disabled:hidden dark:hover:bg-white/10 dark:hover:text-white"><X className="h-4 w-4" /></button>
    </li>
  );
}
