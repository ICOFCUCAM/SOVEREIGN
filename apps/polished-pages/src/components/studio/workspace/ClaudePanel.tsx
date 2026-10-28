import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BookOpen, Check, ChevronDown, CircleDashed, Eye, FileText, Layers, Loader2, Maximize2, MessageSquare, NotebookPen, Paperclip, PanelRightClose, Plus, Quote, Route, ScrollText, Search, Send, ShieldCheck, SlidersHorizontal, Sparkles, Square, Trash2, Wand2, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Markdown from "@/components/studio/Markdown";
import { kindDef, words, type Manuscript, type PageNote, type Section } from "@/lib/manuscript";
import { CITATION_LABEL, GOALS, SCOPE_LABEL, composeIdea, keepSettings, loadSettings, type CitationHandling, type GoalId, type ReviseSettings, type Scope } from "@/lib/revise-goals";
import { findCitations } from "@/lib/section-citations";
import type { RunOptions, StudioThread } from "@/lib/claude-studio";
import type { EngineId } from "@/lib/studio-backend";
import type { ToolId } from "@/lib/studio-tools";
import { APPROACH_CARDS, OP_LABEL, type ApproachId } from "./approaches";
import { LiveCard, MessageCard, ResultsList, type DialogAction, type Live } from "./parts";
import type { Proposal, Running, SectionOp } from "./useSectionRun";
import { GRADIENT } from "./ui";

// The Claude panel (design spec §5.2, upgraded in §21): one persistent, collapsible panel with
// Revise, Research, Notes and Citations, and Ask docked at its foot. It remembers the last mode
// and never switches by itself.
export type PanelMode = "ask" | "revise" | "research" | "notes" | "citations";
// The tabs (§21): Ask is the box docked at the foot of the panel, which opens the whole conversation.
const MODES: { id: PanelMode; label: string; icon: typeof Sparkles }[] = [
  { id: "revise", label: "Revise", icon: Wand2 }, { id: "research", label: "Research", icon: Search },
  { id: "notes", label: "Notes", icon: NotebookPen }, { id: "citations", label: "Citations", icon: Quote },
];
const GOAL_ICON: Record<GoalId, typeof Sparkles> = { flow: Route, clarify: FileText, preserve: ShieldCheck, develop: Plus };
const LABEL = "text-[12px] font-semibold uppercase tracking-[0.12em] text-[#64748B] dark:text-[#94A3B8]";
// Revise is three steps (§21): what the section says, the owner's idea, how Claude writes it.
const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <span className="flex items-center gap-2"><span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#EEF2FF] text-[12px] font-semibold text-[#1D4ED8] dark:bg-[#1E3A8A]/40 dark:text-[#BFDBFE]">{n}</span><span className={LABEL}>{children}</span></span>
);
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
  /** Book page view: back to the page design in this panel. */
  onPageDesign?: () => void;
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
  const [choosing, setChoosing] = useState(false);
  const chosen = APPROACH_CARDS.find((a) => a.id === p.approach);
  const [settings, setSettingsState] = useState<ReviseSettings>(() => loadSettings());
  const setSettings = (x: ReviseSettings) => { setSettingsState(x); keepSettings(x); };
  const chapterNo = section && section.kind === "chapter" ? p.m.sections.filter((x) => x.kind === "chapter").findIndex((x) => x.id === section.id) + 1 : 0;
  const [ask, setAsk] = useState("");
  const [factor, setFactor] = useState("2");
  const [instructions, setInstructions] = useState("");
  const [improve, setImprove] = useState<NonNullable<RunOptions["improvementType"]>>("enhance");
  const [useVoice, setUseVoice] = useState(false);
  const [style, setStyle] = useState(p.citationStyles[0] ?? "APA 7");
  const [page, setPage] = useState("");
  const [note, setNote] = useState("");
  const feedEnd = useRef<HTMLDivElement>(null);
  useEffect(() => { if (p.mode === "ask") feedEnd.current?.scrollIntoView({ block: "end" }); }, [p.mode, p.thread.messages.length, p.live?.steps.length]);

  const found = useMemo(() => findCitations(section?.body ?? ""), [section?.body]);
  // A question about this section: it names the section, whose text Claude reads in ./manuscript/, then shows the conversation.
  const sendAsk = () => {
    if (!ask.trim() || p.chatBusy) return;
    p.onChat(section ? `About the section “${section.title}”${chapterNo ? ` (chapter ${chapterNo})` : ""}: ${ask.trim()}` : ask.trim());
    setAsk(""); p.onMode("ask");
  };
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
    // The owner's own words first, then the goals and settings ticked (Claude follows them as the section's idea).
    const idea = composeIdea(section.idea ?? "", settings);
    if ((p.approach === "polish" || p.approach === "mine") && !p.hasUploads) p.run({ ...base, op: "rewrite", ...(idea ? { idea } : {}) });
    else p.run({ ...base, op: "compose", approach: p.approach, ...(idea ? { idea } : {}) });
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
      <div className="border-b border-[#E6E8ED] px-4 pb-3 pt-3 dark:border-white/10">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#4F46E5]" aria-hidden />
          <p className="text-[16px] font-semibold">Claude</p>
          {p.onPageDesign && <button type="button" onClick={p.onPageDesign} className="ml-auto h-8 rounded-md px-2 text-[13px] font-medium text-[#2563EB] hover:bg-muted">Page design</button>}
          <button type="button" onClick={p.onClose} aria-label="Close the Claude panel" className={`${p.onPageDesign ? "" : "ml-auto "}grid h-8 w-8 place-items-center rounded-md text-[#64748B] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]`}><PanelRightClose className="h-4 w-4" /></button>
        </div>
        <div role="tablist" aria-label="Claude panel" className="grid grid-cols-4 gap-1 rounded-[10px] bg-[#F1F5F9] p-1 dark:bg-white/5">
          {MODES.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={p.mode === x.id} onClick={() => p.onMode(x.id)}
              className={`h-9 rounded-[8px] text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${p.mode === x.id ? "bg-white font-semibold text-[#1D4ED8] shadow-sm dark:bg-[#1E293B] dark:text-white" : "font-medium text-[#475569] hover:text-[#172033] dark:text-[#94A3B8] dark:hover:text-white"}`}>{x.label}</button>
          ))}
        </div>
        {p.mode === "ask" && <button type="button" onClick={() => p.onMode("revise")} className="mt-2 text-[13px] font-medium text-[#2563EB] hover:underline">← Back to Revise</button>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-[15px] leading-relaxed">
        {/* ── Revise ── */}
        {p.mode === "revise" && (!section ? <p className="text-[#64748B]">Choose a section in the manuscript to revise it with Claude.</p> : (
          <div className="space-y-6">
            {/* The section Claude works on, and what it says (Claude reads it without changing anything). */}
            <section aria-label="Current section" className="rounded-[12px] border border-[#E6E8ED] p-4 dark:border-white/10">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#1E3A8A]/40"><BookOpen className="h-4.5 w-4.5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] text-[#64748B]">Current section</p>
                  <p className="truncate text-[15.5px] font-semibold">{section.title || kindDef(section.kind).label}</p>
                  <p className="text-[12.5px] text-[#64748B]">{kindDef(section.kind).label}{chapterNo ? ` ${chapterNo}` : ""} · {words(section.body).toLocaleString()} words</p>
                </div>
                <button type="button" disabled={!engine || empty || Boolean(p.running)} onClick={() => p.run({ sectionId: section.id, op: "explain", title: section.title })} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[13.5px] font-medium text-[#2563EB] hover:underline disabled:opacity-50">
                  {p.running?.op === "explain" && busyHere ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}{section.summary ? "Read again" : "Read it"}
                </button>
              </div>
              {section.summary && <div className="mt-3 border-t border-[#F1F5F9] pt-3 font-['Newsreader',Georgia,serif] text-[15.5px] leading-[1.6] dark:border-white/10"><Markdown text={section.summary} /></div>}
            </section>

            <section>
              <p className="mb-2.5 text-[15px] font-semibold">What would you like to do?</p>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((g) => {
                  const on = settings.goals.includes(g.id); const I = GOAL_ICON[g.id];
                  return (
                    <button key={g.id} type="button" aria-pressed={on} onClick={() => setSettings({ ...settings, goals: on ? settings.goals.filter((x) => x !== g.id) : [...settings.goals, g.id] })}
                      className={`relative flex gap-2.5 rounded-[12px] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${on ? "border-[#6366F1] bg-[#F5F7FF] dark:bg-[#1E1B4B]/40" : "border-[#E6E8ED] hover:border-[#C7D2FE] dark:border-white/10"}`}>
                      <I className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${on ? "text-[#4F46E5]" : "text-[#64748B]"}`} aria-hidden />
                      <span className="min-w-0"><span className={`block text-[14px] font-semibold leading-snug ${on ? "text-[#4338CA] dark:text-[#C7D2FE]" : ""}`}>{g.label}</span><span className="mt-0.5 block text-[12.5px] leading-snug text-[#64748B]">{g.line}</span></span>
                      {on && <Check className="absolute right-2 top-2 h-4 w-4 rounded-full bg-[#4F46E5] p-0.5 text-white" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <label htmlFor="idea" className="mb-2 block text-[15px] font-semibold">Additional instructions <span className="font-normal text-[#64748B]">(optional)</span></label>
              <Textarea id="idea" aria-label="Your idea for this section" value={section.idea ?? ""} onChange={(e) => p.patchSection(section.id, { idea: e.target.value })} rows={4}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !blocked && !p.running) { e.preventDefault(); generate(); } }}
                placeholder="Tell Claude what to keep, change, add or avoid…" className="min-h-[110px] rounded-[10px] text-[15.5px] leading-relaxed" />
              <p className={`mt-1 text-right text-[12px] ${(section.idea ?? "").length > 1000 ? "text-amber-700" : "text-[#94A3B8]"}`}>{(section.idea ?? "").length}/1000</p>
            </section>

            {/* Source policy: the chosen approach in one row; "Change" opens the six. */}
            <section className="rounded-[12px] border border-[#E6E8ED] dark:border-white/10">
              <button type="button" onClick={() => setChoosing(!choosing)} aria-expanded={choosing} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
                <BookOpen className="h-4.5 w-4.5 shrink-0 text-[#64748B]" aria-hidden />
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">Source policy</span>
                  {chosen && <span className="block truncate text-[13px] text-[#475569] dark:text-[#94A3B8]"><span className="font-medium text-[#1D4ED8] dark:text-[#93C5FD]">{chosen.label}</span> · {chosen.line}</span>}</span>
                <span className="text-[13px] font-medium text-[#2563EB]">{choosing ? "Done" : "Change"}</span>
              </button>
              {choosing && <div role="radiogroup" aria-label="Approach" className="grid gap-2 border-t border-[#F1F5F9] p-3 dark:border-white/10">
                {APPROACH_CARDS.map((a) => (
                  <button key={a.id} type="button" role="radio" aria-checked={p.approach === a.id} onClick={() => { p.onApproach(a.id); setChoosing(false); }}
                    className={`rounded-[10px] border px-3.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${p.approach === a.id ? "border-[#2563EB] bg-[#F5F8FF] dark:bg-[#0F1A33]" : "border-[#E6E8ED] hover:border-[#BFD0F5] dark:border-white/10"}`}>
                    <span className="flex items-center justify-between gap-2"><span className="text-[14.5px] font-medium text-[#172033] dark:text-white">{a.label}</span>{p.approach === a.id && <Check className="h-4 w-4 text-[#2563EB]" />}</span>
                    <span className="mt-0.5 block text-[13px] text-[#475569] dark:text-[#94A3B8]">{a.line}</span>
                    <span className="mt-0.5 block text-[12px] text-[#64748B]">Source policy: {a.policy}</span>
                  </button>
                ))}
              </div>}
            </section>

            {/* Advanced editorial settings: terminology (the book's rules), citation handling, rewrite scope. */}
            <details className="group rounded-[12px] border border-[#E6E8ED] dark:border-white/10">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3">
                <SlidersHorizontal className="h-4.5 w-4.5 shrink-0 text-[#64748B]" aria-hidden />
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">Advanced editorial settings</span><span className="block truncate text-[13px] text-[#64748B]">Terminology, citation handling, rewrite scope</span></span>
                <ChevronDown className="h-4 w-4 text-[#64748B] transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="space-y-4 border-t border-[#F1F5F9] p-3.5 dark:border-white/10">
                <div>
                  <p className="mb-1.5 text-[13px] font-medium">Terminology (the book's rules, always followed)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rules.slice(0, 4).map((r) => <button key={r} type="button" onClick={p.onEditRules} title={r} className="max-w-full truncate rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[12.5px] text-[#334155] hover:bg-[#E2E8F0] dark:bg-white/10 dark:text-[#CBD5E1]">{r}</button>)}
                    {rules.length > 4 && <button type="button" onClick={p.onEditRules} className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[12.5px] text-[#334155] dark:bg-white/10 dark:text-[#CBD5E1]">+{rules.length - 4} rules</button>}
                    <button type="button" onClick={p.onEditRules} className="rounded-full border border-dashed border-[#CBD5E1] px-2.5 py-1 text-[12.5px] text-[#475569]">{rules.length ? "Edit the rules" : "+ Rules for the whole book"}</button>
                    {pageNotes.length > 0 && <button type="button" onClick={() => p.onMode("notes")} className="rounded-full bg-[#FFFBEB] px-2.5 py-1 text-[12.5px] text-[#92400E] dark:bg-amber-500/10 dark:text-amber-300">{pageNotes.length} page {pageNotes.length === 1 ? "note" : "notes"}</button>}
                  </div>
                </div>
                <label className="block"><span className="mb-1.5 block text-[13px] font-medium">Citation handling</span>
                  <select value={settings.citations} onChange={(e) => setSettings({ ...settings, citations: e.target.value as CitationHandling })} className="h-10 w-full rounded-[8px] border border-input bg-background px-2.5 text-[14px]">
                    {(Object.keys(CITATION_LABEL) as CitationHandling[]).map((k) => <option key={k} value={k}>{CITATION_LABEL[k]}</option>)}
                  </select></label>
                <label className="block"><span className="mb-1.5 block text-[13px] font-medium">Rewrite scope</span>
                  <select value={settings.scope} onChange={(e) => setSettings({ ...settings, scope: e.target.value as Scope })} className="h-10 w-full rounded-[8px] border border-input bg-background px-2.5 text-[14px]">
                    {(Object.keys(SCOPE_LABEL) as Scope[]).map((k) => <option key={k} value={k}>{SCOPE_LABEL[k]}</option>)}
                  </select></label>
              </div>
            </details>

            {/* The action stays in view at the foot of the panel while the steps scroll. */}
            {progress ?? (
              <div className="sticky -bottom-5 z-10 -mx-5 border-t border-[#E6E8ED] bg-white/95 px-5 pb-5 pt-3 backdrop-blur dark:border-white/10 dark:bg-[#11151C]/95">
                <button type="button" onClick={generate} disabled={Boolean(blocked) || Boolean(p.running)}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-[10px] text-[15.5px] font-semibold transition-opacity disabled:opacity-50 ${GRADIENT}`}>
                  <Sparkles className="h-4 w-4" /> {empty && p.approach !== "new" ? "Write it with Claude" : "Rewrite with my idea"}
                  <kbd className="ml-1 rounded border border-white/35 px-1.5 text-[11px] font-medium opacity-80">⌘↵</kbd>
                </button>
                <p className="mt-2 text-[13px] text-[#64748B]">{blocked ?? (billed ? "Runs on the API: billed per use." : "Runs on your Claude Code plan.")} You review every change before it's used.</p>
              </div>
            )}

            {mine && !busyHere && (
              <div className="rounded-[10px] border border-[#E6E8ED] p-4 dark:border-white/10">
                <p className="text-[14px] font-medium">{OP_LABEL[mine.op] ?? "Suggestion"} is ready</p>
                {mine.approach && <p className="mt-0.5 text-[12.5px] text-[#64748B]">Source policy: {APPROACH_CARDS.find((a) => a.id === mine.approach)?.policy}</p>}
                <button type="button" onClick={p.onReview} className="mt-2 text-[13px] font-medium text-[#2563EB] hover:underline">Show it on the page</button>
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
            {section && <p className="text-[13.5px] text-[#64748B]">Citations for this section are in <button type="button" onClick={() => p.onMode("citations")} className="font-medium text-[#2563EB] hover:underline">Citations</button>.</p>}
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

        {/* ── Citations ── */}
        {p.mode === "citations" && (!section ? <p className="text-[#64748B]">Choose a section to see its citations.</p> : (
          <div className="space-y-6">
            <section>
              <p className="mb-2 text-[15px] font-semibold">In this section</p>
              <p className="mb-3 text-[13px] text-[#64748B]">Found in the text as it stands; nothing is changed.</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {([["Scripture", found.scripture.length], ["Works cited", found.works.length], ["Quotations", found.quotations]] as const).map(([l, n]) => (
                  <div key={l} className="rounded-[10px] border border-[#E6E8ED] px-2 py-2.5 dark:border-white/10"><p className="text-[20px] font-semibold tabular-nums">{n}</p><p className="text-[12px] text-[#64748B]">{l}</p></div>
                ))}
              </div>
              {found.scripture.length > 0 && <><p className={`${LABEL} mb-1.5 mt-4`}>Scripture</p><div className="flex flex-wrap gap-1.5">{found.scripture.map((r) => <span key={r} className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[12.5px] dark:bg-white/10">{r}</span>)}</div></>}
              {found.works.length > 0 && <><p className={`${LABEL} mb-1.5 mt-4`}>Works cited</p><ul className="space-y-1 text-[13.5px]">{found.works.map((w) => <li key={w} className="flex gap-2"><FileText className="mt-1 h-3.5 w-3.5 shrink-0 text-[#64748B]" />{w}</li>)}</ul></>}
            </section>
            <section>
              <p className="mb-2 text-[15px] font-semibold">Add citations to this section</p>
              <div className="flex gap-2">
                <Select value={style} onValueChange={setStyle}><SelectTrigger className="h-10 flex-1" aria-label="Citation style"><SelectValue /></SelectTrigger><SelectContent>{p.citationStyles.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" className="h-10" disabled={!engine || empty || Boolean(p.running)} onClick={() => p.run({ sectionId: section.id, op: "cite", title: section.title, citationStyle: style })}><Quote className="h-4 w-4" /> Add citations</Button>
              </div>
              {busyHere && p.running?.op === "cite" && <div className="mt-3">{progress}</div>}
              <p className="mt-2 text-[12.5px] text-[#64748B]">Claude cites only sources it opened, and marks unsupported claims [citation needed]. Citations stay unverified until you check them.</p>
            </section>
            <p className="text-[13px] text-[#64748B]">Citations and quotations across the whole book: <button type="button" onClick={() => p.onMode("research")} className="font-medium text-[#2563EB] hover:underline">Research</button>.</p>
          </div>
        ))}

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
                <div className="mt-2"><ResultsList outputs={outputs} onOpen={p.onOpenResult} /></div>
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
      {/* Ask Claude about this chapter: always at the foot of the panel; the section goes with the question. */}
      {p.mode !== "ask" && (
        <form onSubmit={(e) => { e.preventDefault(); sendAsk(); }} className="border-t border-[#E6E8ED] bg-[#F8F9FF] p-3 dark:border-white/10 dark:bg-white/5">
          <div className="mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#4F46E5]" aria-hidden /><p className="text-[14px] font-semibold">Ask Claude about this {section?.kind === "chapter" ? "chapter" : "section"}</p>
            <button type="button" onClick={() => p.onMode("ask")} aria-label="Open the whole conversation" className="ml-auto grid h-7 w-7 place-items-center rounded-md text-[#64748B] hover:bg-white dark:hover:bg-white/10"><Maximize2 className="h-3.5 w-3.5" /></button></div>
          <div className="rounded-[10px] border border-[#E6E8ED] bg-white p-2 dark:border-white/10 dark:bg-[#11151C]">
            <Textarea value={ask} onChange={(e) => setAsk(e.target.value)} rows={2} aria-label="Ask Claude about this section" placeholder="Ask a question, discuss this section, or request a revision…"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendAsk(); } }}
              className="min-h-[48px] resize-none border-0 bg-transparent p-1 text-[14px] shadow-none focus-visible:ring-0" />
            <div className="flex items-center gap-2">
              {section && <span className="inline-flex min-w-0 items-center gap-1 truncate text-[12.5px] text-[#64748B]"><Paperclip className="h-3.5 w-3.5 shrink-0" /> “{section.title}” attached</span>}
              <Button type="submit" size="icon" aria-label="Send" disabled={!ask.trim() || p.chatBusy} className={`ml-auto h-9 w-9 shrink-0 rounded-full ${GRADIENT}`}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
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
