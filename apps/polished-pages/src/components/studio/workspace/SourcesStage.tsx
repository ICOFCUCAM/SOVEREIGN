import { useRef, useState } from "react";
import { AudioLines, BookOpen, FileText, GitCompare, Layers, Loader2, Lock, Plus, ScanText, ScrollText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import KnowledgePanel from "@/components/book/KnowledgePanel";
import { STUDIO_ACCEPT, type StudioThread } from "@/lib/claude-studio";
import type { Manuscript } from "@/lib/manuscript";
import type { ToolId } from "@/lib/studio-tools";
import { formatBytes, type DialogAction } from "./parts";
import { EYEBROW, SERIF } from "./ui";

// Sources (design spec §2): what Claude builds the book from and the rules it
// never breaks: manuscripts, file tools, book details, rules, knowledge, voice.
export default function SourcesStage({ thread, m, uploading, onUpload, onRemove, onTool, onAction, onJoin, onStart, wizardChapters, onUpdate, onVoice, busy, rulesRef }: {
  thread: StudioThread; m: Manuscript | null | undefined; uploading: string | null;
  onUpload: (files: FileList | File[]) => void; onRemove: (storedAs: string) => void;
  onTool: (t: ToolId) => void; onAction: (a: DialogAction) => void; onJoin: () => void;
  onStart: (from: "uploads" | "blank" | "wizard") => void; wizardChapters: number;
  onUpdate: (m: Manuscript) => void; onVoice: () => void; busy: boolean; rulesRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const originals = thread.files.filter((f) => f.kind === "original");
  const hasText = (storedAs: string) => thread.files.some((x) => x.kind === "text" && x.storedAs === storedAs.replace(/\.[^.]+$/, "") + ".txt");

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-12">
      <header>
        <p className={EYEBROW}>Sources</p>
        <h1 className={`${SERIF} mt-2 text-[36px] font-medium leading-[1.15] text-[#172033] dark:text-white`}>Sources and rules</h1>
        <p className="mt-2 text-[15px] text-[#64748B]">What Claude builds your book from, and the rules it never breaks.</p>
      </header>

      {/* Manuscripts */}
      <section aria-labelledby="ms-h">
        <h2 id="ms-h" className="font-sans mb-4 text-[14px] font-semibold text-[#172033] dark:text-white">Manuscripts</h2>
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files); }}
          className={`grid grid-cols-2 gap-4 rounded-[12px] p-1 sm:grid-cols-3 lg:grid-cols-4 ${drag ? "bg-[#EFF6FF] ring-2 ring-[#2563EB] dark:bg-[#172554]" : ""}`}>
          {originals.map((f) => (
            <div key={f.storedAs} className="group relative">
              <div aria-hidden className="flex h-[150px] flex-col gap-1.5 rounded-[6px] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.06),0_12px_24px_-14px_rgba(15,23,42,.25)] dark:bg-[#161A22]">
                <span className="h-1.5 w-3/5 rounded bg-[#E6E8ED] dark:bg-white/10" />
                {[100, 92, 96, 70, 88].map((w, i) => <span key={i} className="h-1 rounded bg-[#F1F5F9] dark:bg-white/5" style={{ width: `${w}%`, marginTop: i ? 0 : 8 }} />)}
                <span className="mt-auto self-start rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#475569] dark:bg-white/10 dark:text-[#CBD5E1]">{(f.name.split(".").pop() ?? "").toUpperCase()}</span>
              </div>
              <p className="mt-2.5 truncate text-[13px] font-medium" title={f.name}>{f.name}</p>
              <p className="text-[12px] text-[#64748B]">{formatBytes(f.bytes)}{hasText(f.storedAs) ? " · text read" : /\.(txt|md|markdown)$/i.test(f.name) ? " · text" : ""}</p>
              <button type="button" disabled={busy} onClick={() => onRemove(f.storedAs)} aria-label={`Remove ${f.name}`}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-white/90 text-[#475569] opacity-0 shadow-sm transition-opacity hover:text-[#172033] focus-visible:opacity-100 group-hover:opacity-100 disabled:hidden dark:bg-[#1F2430]"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <button type="button" onClick={() => file.current?.click()} disabled={Boolean(uploading)}
            className="flex h-[150px] flex-col items-center justify-center gap-1.5 rounded-[6px] border-[1.5px] border-dashed border-[#CBD5E1] text-[13px] text-[#475569] transition-colors hover:border-[#2563EB] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:border-white/20 dark:text-[#CBD5E1]">
            {uploading ? <><Loader2 className="h-5 w-5 animate-spin" /> <span className="max-w-[90%] truncate">Uploading {uploading}…</span></> : <><Upload className="h-5 w-5" /> Add a manuscript<span className="text-[12px] text-[#64748B]">PDF, Word, text, Markdown or scans</span></>}
          </button>
          <input ref={file} type="file" accept={STUDIO_ACCEPT} multiple hidden onChange={(e) => { if (e.target.files?.length) onUpload(e.target.files); e.target.value = ""; }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onJoin} disabled={busy}><Layers className="h-4 w-4" /> Join into one</Button>
          <Button size="sm" variant="outline" onClick={() => onTool("ocr")} disabled={busy || !originals.length}><ScanText className="h-4 w-4" /> Read scanned pages</Button>
          <Button size="sm" variant="outline" onClick={() => onTool("compare")} disabled={busy || originals.length + thread.outputs.length < 2}><GitCompare className="h-4 w-4" /> Compare two versions</Button>
          <Button size="sm" variant="outline" onClick={() => onAction("summarize")} disabled={busy || !originals.length}><ScrollText className="h-4 w-4" /> Summarise the whole book</Button>
        </div>
      </section>

      {/* Start the book */}
      {m === null && (
        <section aria-labelledby="start-h" className="rounded-[12px] border border-[#E6E8ED] bg-white p-6 dark:border-white/10 dark:bg-[#161A22]">
          <h2 id="start-h" className={`${SERIF} text-[24px] font-medium`}>Start the book</h2>
          <p className="mt-1 text-[14px] text-[#64748B]">The book you write here is one manuscript of front matter, chapters and back matter.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => onStart("uploads")} disabled={!originals.length}><BookOpen className="h-4 w-4" /> From my manuscripts</Button>
            {wizardChapters > 0 && <Button variant="outline" onClick={() => onStart("wizard")}><FileText className="h-4 w-4" /> Bring in my Book wizard draft ({wizardChapters} chapters)</Button>}
            <Button variant="outline" onClick={() => onStart("blank")}><Plus className="h-4 w-4" /> A blank book</Button>
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
