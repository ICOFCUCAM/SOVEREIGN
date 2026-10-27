import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BookOpen, Check, CircleDashed, Eye, FileText, Layers, Loader2, MessageSquare, NotebookPen, PanelRightClose, Plus, Quote, ScrollText, Search, Send, Sparkles, Square, Trash2, Wand2, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Markdown from "@/components/studio/Markdown";
import { kindDef, type Manuscript, type PageNote, type Section } from "@/lib/manuscript";
import type { RunOptions, StudioThread } from "@/lib/claude-studio";
import type { EngineId } from "@/lib/studio-backend";
import type { ToolId } from "@/lib/studio-tools";
import { APPROACH_CARDS, OP_LABEL, type ApproachId } from "./approaches";
import { LiveCard, MessageCard, OutputRow, type DialogAction, type Live } from "./parts";
import type { Proposal, Running, SectionOp } from "./useSectionRun";
import { GRADIENT } from "./ui";

// The Claude panel (design spec §5.2): one persistent, collapsible panel with
// four modes. It remembers the last mode and never switches by itself.
export type PanelMode = "ask" | "revise" | "research" | "notes";
const MODES: { id: PanelMode; label: string; icon: typeof Sparkles }[] = [
  { id: "ask", label: "Ask", icon: MessageSquare }, { id: "revise", label: "Revise", icon: Wand2 },
  { id: "research", label: "Research", icon: Search }, { id: "notes", label: "Notes", icon: NotebookPen },
];
const LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B] dark:text-[#94A3B8]";
const IMPROVE: { id: NonNullable<RunOptions["improvementType"]>; label: string }[] = [
  { id: "enhance", label: "Quality" }, { id: "tighten", label: "Tighten" }, { id: "hooks", label: "Hooks" },
  { id: "examples", label: "Examples" }, { id: "consistency", label: "Consistency" }, { id: "expand", label: "More depth" },
];
type MoreOp = "expand" | "voice" | "edit" | "draft" | "improve";

/** Named stages of a run, from the progress lines (spec §5.4: completed, active, failed). */
function stages(steps: string[], line: string) {
  const did = (re: RegExp) => steps.some((s) => re.test(s));
  return [
    { label: "Reading your book", done: did(/^Reading/) },
    { label: "Searching and opening sources", done: did(/^(Searching the web|Opening)/), optional: true },
    { label: "Writing", done: did(/^Writing/), active: /^Writing|Editing/.test(line) },
  ];
}

export default function ClaudePanel(p: {
  mode: PanelMode; onMode: (m: PanelMode) => void; onClose: () => void;
  thread: StudioThread; live: Live | null; onStopLive: () => void; onChat: (message: string) => void; chatBusy: boolean;
  onOpenResult: (path: string) => void; onAction: (a: DialogAction) => void; onTool: (t?: ToolId) => void; onJoin: () => void;
  m: Manuscript; section: Section | null; hasUploads: boolean; engine: EngineId | null; citationStyles: string[];
  run: (o: RunOptions & { sectionId: string; op: SectionOp }) => void; running: Running | null; onCancel: () => void;
  proposal: Proposal | null; onReview: () => void; patchSection: (id: string, patch: Partial<Section>) => void; onEditRules: () => void;
  approach: ApproachId; onApproach: (a: ApproachId) => void;
}) {
  const { section, engine } = p;
  const [message, setMessage] = useState("");
  const [more, setMore] = useState<MoreOp>("expand");
  const [factor, setFactor] = useState("2");
  const [instructions, setInstructions] = useState("");
  const [improve, setImprove] = useState<NonNullable<RunOptions["improvementType"]>>("enhance");
  const [useVoice, setUseVoice] = useState(false);
  const [style, setStyle] = useState(p.citationStyles[0] ?? "APA 7");
  const [page, setPage] = useState("");
  const [note, setNote] = useState("");
  const feedEnd = useRef<HTMLDivElement>(null);
  useEffect(() => { if (p.mode === "ask") feedEnd.current?.scrollIntoView({ block: "end" }); }, [p.mode, p.thread.messages.length, p.live?.steps.length]);

  const busyHere = Boolean(p.running && section && p.running.sectionId === section.id);
  const card = APPROACH_CARDS.find((a) => a.id === p.approach)!;
  const empty = !section?.body.trim();
  const rules = (p.m.rules ?? "").split("\n").map((r) => r.trim()).filter(Boolean);
  const pageNotes = section?.pageNotes ?? [];
  const mine = p.proposal && section && p.proposal.sectionId === section.id ? p.proposal : null;
  const billed = engine === "api";

  // The five approaches map onto the runner's actions: building on the uploaded book needs uploads;
  // polishing or rewriting from the book alone works on the section's own text when nothing is uploaded.
  const generate = () => {
    if (!section) return;
    const base = { sectionId: section.id, title: section.title };
    if ((p.approach === "polish" || p.approach === "mine") && !p.hasUploads) p.run({ ...base, op: "rewrite" });
    else p.run({ ...base, op: "compose", approach: p.approach });
  };
  const blocked = !engine ? "No engine is available." : card.needsBook && !p.hasUploads ? "Upload your book in Sources first: this approach builds on it." : (p.approach === "polish" || p.approach === "mine") && empty && !p.hasUploads ? "This section is empty: write something, or upload your book in Sources." : null;
  const runMore = () => {
    if (!section) return;
    const base = { sectionId: section.id, title: section.title };
    if (more === "improve") p.run({ ...base, op: "improve", improvementType: improve });
    else p.run({ ...base, op: more, factor: Number(factor), instructions: instructions.trim() || undefined, guidance: kindDef(section.kind).guidance, useVoice: (more === "expand" || more === "edit" || more === "draft") && useVoice });
  };

  const addNote = () => {
    if (!section || !note.trim()) return;
    const next: PageNote[] = [...pageNotes, { page: page.trim() || "?", text: note.trim() }];
    p.patchSection(section.id, { pageNotes: next }); setNote(""); setPage("");
  };

  const progress = busyHere && p.running ? (
    <div role="status" aria-live="polite" className="rounded-[10px] border border-[#DBEAFE] bg-[#F8FAFF] p-4 dark:border-[#1E3A8A] dark:bg-[#0F1A33]">
      <p className="mb-3 text-[13px] font-medium">{OP_LABEL[p.running.op] ?? "Working"}…</p>
      <ol className="space-y-2 text-[13px]">
        {stages(p.running.steps, p.running.line).map((s) => (
          <li key={s.label} className={`flex items-center gap-2 ${s.done ? "text-[#047857] dark:text-[#6EE7B7]" : s.active ? "font-medium text-[#1D4ED8] dark:text-[#93C5FD]" : "text-[#64748B]"}`}>
            {s.done ? <Check className="h-3.5 w-3.5" /> : s.active ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <CircleDashed className="h-3.5 w-3.5" />}{s.label}{s.optional && !s.done ? " (if needed)" : ""}
          </li>
        ))}
      </ol>
      <p className="mt-3 truncate text-[12px] text-[#64748B]">{p.running.line}</p>
      <Button size="sm" variant="outline" className="mt-3 h-8" onClick={p.onCancel}><Square className="h-3.5 w-3.5" /> Stop</Button>
    </div>
  ) : null;

  const outputs = useMemo(() => [...p.thread.outputs].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt)), [p.thread.outputs]);

  return (
    <aside aria-label="Claude" className="flex h-full w-full flex-col bg-white dark:bg-[#11151C]">
      <div className="flex items-center gap-1 border-b border-[#E6E8ED] px-3 dark:border-white/10" role="tablist" aria-label="Claude panel">
        {MODES.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={p.mode === x.id} onClick={() => p.onMode(x.id)}
            className={`-mb-px flex h-12 items-center gap-1.5 border-b-2 px-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${p.mode === x.id ? "border-[#172033] font-semibold text-[#172033] dark:border-white dark:text-white" : "border-transparent font-medium text-[#64748B] hover:text-[#172033] dark:hover:text-white"}`}>
            <x.icon className="h-3.5 w-3.5" aria-hidden />{x.label}
          </button>
        ))}
        <button type="button" onClick={p.onClose} aria-label="Close the Claude panel" className="ml-auto grid h-8 w-8 place-items-center rounded-md text-[#64748B] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"><PanelRightClose className="h-4 w-4" /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-[14px] leading-relaxed">
        {/* ── Revise ── */}
        {p.mode === "revise" && (!section ? <p className="text-[#64748B]">Choose a section in the manuscript to revise it with Claude.</p> : (
          <div className="space-y-6">
            <section>
              <div className="mb-2 flex items-center justify-between"><p className={LABEL}>What this section says</p>
                <button type="button" disabled={!engine || empty || Boolean(p.running)} onClick={() => p.run({ sectionId: section.id, op: "explain", title: section.title })} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#2563EB] hover:underline disabled:opacity-50">
                  {p.running?.op === "explain" && busyHere ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}{section.summary ? "Read again" : "Read it"}
                </button></div>
              {section.summary ? <div className="font-['Newsreader',Georgia,serif] text-[15.5px] leading-[1.6]"><Markdown text={section.summary} /></div>
                : <p className="text-[13px] text-[#64748B]">{empty ? "This section is empty." : "Claude reads the section and tells you its main teaching, key points and sources, without changing anything."}</p>}
            </section>

            <section>
              <label htmlFor="idea" className={`${LABEL} mb-2 block`}>Your idea for this section</label>
              <Textarea id="idea" value={section.idea ?? ""} onChange={(e) => p.patchSection(section.id, { idea: e.target.value })} rows={3}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !blocked && !p.running) { e.preventDefault(); generate(); } }}
                placeholder="What should it teach? What to keep, add, cut or reorder?" className="rounded-[8px] text-[13.5px]" />
            </section>

            <section>
              <p className={`${LABEL} mb-2`}>How Claude writes it</p>
              <div role="radiogroup" aria-label="Approach" className="grid gap-2">
                {APPROACH_CARDS.map((a) => (
                  <button key={a.id} type="button" role="radio" aria-checked={p.approach === a.id} onClick={() => p.onApproach(a.id)}
                    className={`rounded-[10px] border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${p.approach === a.id ? "border-[#2563EB] bg-[#F5F8FF] dark:bg-[#0F1A33]" : "border-[#E6E8ED] hover:border-[#BFD0F5] dark:border-white/10"}`}>
                    <span className="flex items-center justify-between gap-2"><span className="text-[13.5px] font-medium text-[#172033] dark:text-white">{a.label}</span>{p.approach === a.id && <Check className="h-4 w-4 text-[#2563EB]" />}</span>
                    <span className="mt-0.5 block text-[12.5px] text-[#475569] dark:text-[#94A3B8]">{a.line}</span>
                    <span className="mt-1 block text-[11.5px] text-[#64748B]">Source policy: {a.policy}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className={`${LABEL} mb-2`}>Also followed</p>
              <div className="flex flex-wrap gap-1.5">
                {rules.slice(0, 3).map((r) => <button key={r} type="button" onClick={p.onEditRules} title={r} className="max-w-full truncate rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[12px] text-[#334155] hover:bg-[#E2E8F0] dark:bg-white/10 dark:text-[#CBD5E1]">{r}</button>)}
                {rules.length > 3 && <button type="button" onClick={p.onEditRules} className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[12px] text-[#334155] dark:bg-white/10 dark:text-[#CBD5E1]">+{rules.length - 3} rules</button>}
                {!rules.length && <button type="button" onClick={p.onEditRules} className="rounded-full border border-dashed border-[#CBD5E1] px-2.5 py-1 text-[12px] text-[#475569]">+ Rules for the whole book</button>}
                {pageNotes.length > 0 && <button type="button" onClick={() => p.onMode("notes")} className="rounded-full bg-[#FFFBEB] px-2.5 py-1 text-[12px] text-[#92400E] dark:bg-amber-500/10 dark:text-amber-300">{pageNotes.length} page {pageNotes.length === 1 ? "note" : "notes"}</button>}
              </div>
            </section>

            {progress ?? (
              <div>
                <button type="button" onClick={generate} disabled={Boolean(blocked) || Boolean(p.running)}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-[10px] text-[14.5px] font-semibold transition-opacity disabled:opacity-50 ${GRADIENT}`}>
                  <Sparkles className="h-4 w-4" /> {empty && p.approach !== "new" ? "Write it with Claude" : "Rewrite with my idea"}
                  <kbd className="ml-1 rounded border border-white/35 px-1.5 text-[11px] font-medium opacity-80">⌘↵</kbd>
                </button>
                <p className="mt-2 text-[12px] text-[#64748B]">{blocked ?? (billed ? "Runs on the API: billed per use." : "Runs on your Claude Code plan.")} You review every change before it's used.</p>
              </div>
            )}

            {mine && !busyHere && (
              <div className="rounded-[10px] border border-[#E6E8ED] p-4 dark:border-white/10">
                <p className="text-[13.5px] font-medium">{OP_LABEL[mine.op] ?? "Suggestion"} is ready</p>
                {mine.approach && <p className="mt-0.5 text-[12px] text-[#64748B]">Source policy: {APPROACH_CARDS.find((a) => a.id === mine.approach)?.policy}</p>}
                <button type="button" onClick={p.onReview} className="mt-2 text-[12.5px] font-medium text-[#2563EB] hover:underline">Show it on the page</button>
              </div>
            )}

            <section className="border-t border-[#F1F5F9] pt-5 dark:border-white/10">
              <p className={`${LABEL} mb-2`}>More for this section</p>
              <div className="flex flex-wrap gap-1.5">
                {([["expand", "Expand"], ["voice", "In my voice"], ["edit", "Edit as I say"], ["draft", "Draft with Claude"], ["improve", "Improve"]] as [MoreOp, string][]).map(([id, l]) => (
                  <button key={id} type="button" onClick={() => setMore(id)} aria-pressed={more === id}
                    className={`h-8 rounded-[8px] border px-2.5 text-[12.5px] ${more === id ? "border-[#2563EB] bg-[#F5F8FF] font-medium text-[#1D4ED8] dark:bg-[#0F1A33] dark:text-[#93C5FD]" : "border-[#E6E8ED] text-[#334155] hover:bg-muted dark:border-white/10 dark:text-[#CBD5E1]"}`}>{l}</button>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {more === "expand" && <Select value={factor} onValueChange={setFactor}><SelectTrigger className="h-9" aria-label="How much longer"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1.5">1.5× longer</SelectItem><SelectItem value="2">2× longer</SelectItem><SelectItem value="3">3× longer</SelectItem></SelectContent></Select>}
                {more === "improve" && <Select value={improve} onValueChange={(v) => setImprove(v as typeof improve)}><SelectTrigger className="h-9" aria-label="Improvement"><SelectValue /></SelectTrigger><SelectContent>{IMPROVE.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent></Select>}
                {(more === "edit" || more === "draft" || more === "expand") && <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} className="h-9" aria-label="Instructions for Claude" placeholder={more === "edit" ? "What should change? (required)" : "Anything to focus on? (optional)"} />}
                {(more === "expand" || more === "edit" || more === "draft") && <label className="flex items-center gap-2 text-[12.5px]"><Switch checked={useVoice} onCheckedChange={setUseVoice} /> In my voice</label>}
                <Button size="sm" variant="outline" className="h-9 w-full" onClick={runMore} disabled={!engine || Boolean(p.running) || (more === "edit" && !instructions.trim()) || (more !== "draft" && empty)}>
                  {busyHere && p.running?.op === more ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Run
                </Button>
              </div>
            </section>
          </div>
        ))}

        {/* ── Research ── */}
        {p.mode === "research" && (
          <div className="space-y-6">
            {section && (
              <section>
                <p className={`${LABEL} mb-2`}>This section</p>
                <div className="flex gap-2">
                  <Select value={style} onValueChange={setStyle}><SelectTrigger className="h-9 flex-1" aria-label="Citation style"><SelectValue /></SelectTrigger><SelectContent>{p.citationStyles.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  <Button size="sm" variant="outline" className="h-9" disabled={!engine || empty || Boolean(p.running)} onClick={() => p.run({ sectionId: section.id, op: "cite", title: section.title, citationStyle: style })}><Quote className="h-4 w-4" /> Add citations</Button>
                </div>
                {busyHere && p.running?.op === "cite" && <div className="mt-3">{progress}</div>}
                <p className="mt-2 text-[12px] text-[#64748B]">Claude cites only sources it opened, and marks unsupported claims [citation needed]. Citations stay unverified until you check them.</p>
              </section>
            )}
            {mine?.ledger && mine.ledger.length > 0 && (
              <section>
                <p className={`${LABEL} mb-2`}>What the run actually opened</p>
                <ul className="space-y-1 text-[12.5px] text-[#334155] dark:text-[#CBD5E1]">{mine.ledger.map((l) => <li key={l} className="flex gap-2"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64748B]" /><span className="min-w-0 break-words">{l}</span></li>)}</ul>
              </section>
            )}
            <section>
              <p className={`${LABEL} mb-2`}>Check the whole book</p>
              <div className="grid gap-2">
                <PanelAction icon={Quote} title="Citations and references" line="Researched on the web, never invented" onClick={() => p.onAction("cite")} />
                <PanelAction icon={Check} title="Fact-check" line="Every claim against web sources" onClick={() => p.onTool("factcheck")} />
                <PanelAction icon={BookOpen} title="Verify quotations and scripture" line="Word for word" onClick={() => p.onTool("quotes")} />
              </div>
            </section>
          </div>
        )}

        {/* ── Notes ── */}
        {p.mode === "notes" && (!section ? <p className="text-[#64748B]">Choose a section to see its notes.</p> : (
          <div className="space-y-6">
            <section>
              <p className={`${LABEL} mb-2`}>Notes on pages of your book</p>
              <p className="mb-3 text-[12.5px] text-[#64748B]">Claude follows these first, then your idea for the section, then the rules for the whole book. Page numbers refer to your uploaded book.</p>
              {pageNotes.length === 0 && <p className="text-[13px] text-[#64748B]">No page notes yet.</p>}
              <ul className="space-y-2">
                {pageNotes.map((n, i) => (
                  <li key={i} className="group flex gap-3 border-l-2 border-[#F59E0B] pl-3">
                    <span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold text-[#92400E] dark:text-amber-300">Page {n.page}</span><span className="block text-[13.5px]">{n.text}</span></span>
                    <button type="button" aria-label={`Delete the note on page ${n.page}`} onClick={() => p.patchSection(section.id, { pageNotes: pageNotes.filter((_, j) => j !== i) })} className="opacity-60 hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Input value={page} onChange={(e) => setPage(e.target.value)} placeholder="Page" aria-label="Page" className="h-9 w-20" />
                <Input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addNote(); }} placeholder="Your note for this page" aria-label="Note" className="h-9 flex-1" />
                <Button size="sm" variant="outline" className="h-9" onClick={addNote} disabled={!note.trim()} aria-label="Add the note"><Plus className="h-4 w-4" /></Button>
              </div>
            </section>
            <section>
              <p className={`${LABEL} mb-2`}>Your idea for this section</p>
              {section.idea?.trim() ? <p className="whitespace-pre-wrap text-[13.5px]">{section.idea}</p> : <p className="text-[13px] text-[#64748B]">None yet.</p>}
              <button type="button" onClick={() => p.onMode("revise")} className="mt-1 text-[12.5px] font-medium text-[#2563EB] hover:underline">Edit in Revise</button>
            </section>
            <section>
              <p className={`${LABEL} mb-2`}>What Claude used</p>
              {mine?.notes ? <><p className="mb-2 text-[12px] text-[#64748B]">Claude's own account of this suggestion:</p><div className="text-[13.5px]"><Markdown text={mine.notes} /></div></>
                : <p className="text-[13px] text-[#64748B]">After Claude writes this section with one of the approaches, its account of what it used appears here, next to the list of what the run actually opened (in Research).</p>}
            </section>
          </div>
        ))}

        {/* ── Ask ── */}
        {p.mode === "ask" && (
          <div className="space-y-4" aria-live="polite">
            <div className="grid grid-cols-2 gap-2">
              <PanelAction icon={ScrollText} title="Summarise" onClick={() => p.onAction("summarize")} compact />
              <PanelAction icon={Wand2} title="Rewrite the book" onClick={() => p.onAction("rewrite")} compact />
              <PanelAction icon={Layers} title="Join files" onClick={p.onJoin} compact />
              <PanelAction icon={Wrench} title="More tools" onClick={() => p.onTool()} compact />
            </div>
            {p.thread.messages.length === 0 && !p.live && <p className="text-[13px] text-[#64748B]">Ask anything about your book: "List every scripture quoted in chapter 3", "Check the dates in chapter 5". Claude remembers this project's conversation.</p>}
            {p.thread.messages.map((msg) => <MessageCard key={msg.id} m={msg} onOpen={p.onOpenResult} />)}
            {p.live && <LiveCard live={p.live} onStop={p.onStopLive} />}
            <div ref={feedEnd} />
            {outputs.length > 0 && (
              <details className="rounded-[10px] border border-[#E6E8ED] px-3 py-2 dark:border-white/10">
                <summary className="cursor-pointer text-[13px] font-medium">Results · {outputs.length}</summary>
                <div className="mt-2 space-y-1">{outputs.map((o) => <OutputRow key={o.path} path={o.path} bytes={o.bytes} at={o.modifiedAt} onOpen={p.onOpenResult} compact />)}</div>
              </details>
            )}
          </div>
        )}
      </div>

      {p.mode === "ask" && (
        <form onSubmit={(e) => { e.preventDefault(); if (message.trim() && !p.chatBusy) { p.onChat(message.trim()); setMessage(""); } }} className="border-t border-[#E6E8ED] p-3 dark:border-white/10">
          <div className="flex items-end gap-2 rounded-[10px] border border-[#E6E8ED] bg-[#FAFAFB] p-1.5 pl-3 dark:border-white/10 dark:bg-white/5">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={1} aria-label="Message to Claude" placeholder="Ask Claude about your book…"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (message.trim() && !p.chatBusy) { p.onChat(message.trim()); setMessage(""); } } }}
              className="min-h-[36px] resize-none border-0 bg-transparent p-1 text-[13.5px] shadow-none focus-visible:ring-0" />
            <Button type="submit" size="icon" aria-label="Send" disabled={!message.trim() || p.chatBusy} className="h-9 w-9 shrink-0 rounded-[8px] bg-[#172033] hover:bg-[#172033]/90"><Send className="h-4 w-4" /></Button>
          </div>
          {billed && <p className="mt-1.5 px-1 text-[11.5px] text-[#64748B]">Runs on the API: billed per use.</p>}
        </form>
      )}
      {!engine && <p role="alert" className="flex items-center gap-2 border-t border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[12.5px] text-amber-800 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5" /> No engine is available: see the engine menu at the bottom of the sidebar.</p>}
    </aside>
  );
}

function PanelAction({ icon: I, title, line, onClick, compact }: { icon: typeof X; title: string; line?: string; onClick: () => void; compact?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-2.5 rounded-[10px] border border-[#E6E8ED] text-left transition-colors hover:border-[#BFD0F5] hover:bg-[#F8FAFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:border-white/10 dark:hover:bg-white/5 ${compact ? "px-3 py-2.5" : "px-3.5 py-3"}`}>
      <I className="h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden />
      <span className="min-w-0"><span className="block text-[13px] font-medium">{title}</span>{line && <span className="block text-[12px] text-[#64748B]">{line}</span>}</span>
    </button>
  );
}
