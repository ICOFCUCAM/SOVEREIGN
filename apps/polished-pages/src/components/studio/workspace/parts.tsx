import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, BadgeCheck, BookOpen, Check, Columns2, Copy, Download, FileText, Globe, History, Languages, Layers, Library, Loader2, MessageSquare, MoreHorizontal,
  PenLine, Plus, Quote, Rocket, ScanSearch, ScrollText, Search, ShieldAlert, SlidersHorizontal, Sparkles, Square, Wand2, Wrench,
} from "lucide-react";
import RewriteControlPanel from "./RewriteControlPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Markdown from "@/components/studio/Markdown";
import { createSeriesInLibrary, readManifest, startPlannedBooks } from "@/lib/series-from-plan";
import type { StudioBackend } from "@/lib/studio-backend";
import { saveDocument, updateDocument } from "@/lib/documents";
import { isBookResult, outputLabel, titleOf, type ResultHistory, type RunOptions, type StudioAction, type StudioJob, type StudioThread } from "@/lib/claude-studio";
import { GRADIENT } from "./ui";
import EditorialCheck from "./EditorialCheck";
import CompareView from "./CompareView";
import { ApproveDialog, STATUS_TONE, VersionsPanel, resultStatus } from "./ResultVersions";
import { bookFile, bookFileName, saveFile, type BookFormat } from "@/lib/book-export";
import { auditBook } from "@/lib/editorial-audit";

// The parts of Claude Studio that every view shares: the dialogs for the
// whole-book actions, the result viewer (edit before saving), the
// conversation cards and the live view of a run.

export type Live = { job: StudioJob; steps: { line: string; kind: "tool" | "notice" | "denied" | "status"; at: string }[]; text: string[] };

export const CITATION_STYLES_FALLBACK = ["APA 7", "Chicago (notes and bibliography)", "Chicago (author-date)", "MLA 9", "Harvard", "SBL", "IEEE", "Vancouver"];

export function SetupHint() {
  return <span className="ml-1">To use your Claude Code plan instead, deploy the runner (see <code className="rounded bg-amber-500/10 px-1">services/polished-claude-runner</code>).</span>;
}

export function SetupCard() {
  return (
    <div className="container max-w-2xl px-6 py-14">
      <h2 className="font-serif text-2xl font-bold">Connect your Claude Code</h2>
      <p className="mt-2 text-muted-foreground">Claude Studio talks to a small runner that holds your Claude Code sign-in. It isn't set up for this site yet.</p>
      <ol className="mt-6 space-y-3 text-sm">
        {[
          <>On your computer, run <code className="rounded bg-muted px-1.5 py-0.5">claude setup-token</code> and keep the token it prints.</>,
          <>Deploy <code className="rounded bg-muted px-1.5 py-0.5">services/polished-claude-runner</code> with that token and a persistent disk (its README lists every setting).</>,
          <>Set <code className="rounded bg-muted px-1.5 py-0.5">VITE_CLAUDE_RUNNER_URL</code> on this site to the runner's address and redeploy.</>,
        ].map((t, i) => (
          <li key={i} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span><span className="pt-0.5">{t}</span></li>
        ))}
      </ol>
    </div>
  );
}

export type DialogAction = "summarize" | "rewrite" | "cite";

export const ACTIONS: { id: DialogAction; title: string; line: string; icon: typeof ScrollText }[] = [
  { id: "summarize", title: "Summarise", line: "Overview, key points, chapter by chapter", icon: ScrollText },
  { id: "rewrite", title: "Rewrite", line: "Whole book, under your strict instructions", icon: Wand2 },
  { id: "cite", title: "Citations & references", line: "Researched on the web, never invented", icon: Quote },
];

let pendingTarget: string | null = null;
let pendingOptions: Partial<RunOptions> | null = null;
/** Opens the next action dialog on a result, optionally filled in (a targeted correction from the editorial check). */
export const setPendingTarget = (p: string | null, o: Partial<RunOptions> | null = null) => { pendingTarget = p; pendingOptions = o; };

export function SeriesActions({ backend, threadId, onDone }: { backend: StudioBackend; threadId: string; onDone: () => void }) {
  const { toast } = useToast();
  const [counts, setCounts] = useState<{ volumes: number; planned: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { readManifest(backend, threadId).then((m) => setCounts({ volumes: m.volumes.length, planned: m.planned.length })).catch(() => setCounts({ volumes: 0, planned: 0 })); }, [backend, threadId]);
  if (!counts) return null;
  return (<>
    {counts.volumes > 0 && <Button size="sm" variant="ghost" disabled={Boolean(busy)} onClick={async () => {
      setBusy("lib");
      try { const r = await createSeriesInLibrary(backend, threadId); toast({ title: "Series created in your Library", description: `${r.books} volumes saved as books, in order. Find them in My books and on the Series page.` }); }
      catch (e) { toast({ title: "Couldn't create the series", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
      finally { setBusy(null); }
    }}>{busy === "lib" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />} Save {counts.volumes} volumes as a series</Button>}
    {counts.planned > 0 && <Button size="sm" variant="ghost" disabled={Boolean(busy)} onClick={async () => {
      setBusy("plan");
      try { const ids = await startPlannedBooks(backend, threadId); toast({ title: `${ids.length} new ${ids.length === 1 ? "project" : "projects"} started`, description: "Each planned book is in Projects, with its chapters laid out in the Manuscript." }); onDone(); }
      catch (e) { toast({ title: "Couldn't start the books", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
      finally { setBusy(null); }
    }}>{busy === "plan" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Start writing {counts.planned} planned {counts.planned === 1 ? "book" : "books"}</Button>}
  </>);
}

export function prettyJson(t: string) {
  try { return JSON.stringify(JSON.parse(t), null, 2); } catch { return t; }
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}


const ACTION_ICON: Record<StudioAction, typeof MessageSquare> = { chat: MessageSquare, summarize: ScrollText, rewrite: Wand2, cite: Quote, tool: Wrench, section: PenLine, "book-outline": BookOpen, "book-chapter": BookOpen, "book-improve": BookOpen };

export function MessageCard({ m, onOpen }: { m: StudioThread["messages"][number]; onOpen: (p: string) => void }) {
  const Icon = ACTION_ICON[m.action] ?? MessageSquare;
  if (m.role === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary/10 px-4 py-3 text-sm">
        {m.action !== "chat" && <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"><Icon className="h-3.5 w-3.5" /> {m.text.split("\n")[0]}</div>}
        <div className="whitespace-pre-wrap">{m.action === "chat" ? m.text : m.text.split("\n").slice(2).join("\n")}</div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl rounded-bl-md border border-border bg-card px-5 py-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> Claude
        {m.engine && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.engine === "api" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"}`}>{m.engine === "api" ? "API" : "Claude Code"}</span>}
        {m.status === "failed" && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">Didn't finish</span>}
        {m.status === "cancelled" && <span className="rounded-full bg-muted px-2 py-0.5">Stopped</span>}
      </div>
      <Markdown text={m.text || "(no reply)"} className="text-sm" />
      {!!m.outputs?.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {m.outputs.filter((p) => !p.startsWith("rewrite/")).map((p) => (
            <button key={p} onClick={() => onOpen(p)} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"><FileText className="h-3.5 w-3.5" /> {outputLabel(p)}</button>
          ))}
          {m.outputs.some((p) => p.startsWith("rewrite/")) && <span className="px-1 py-1 text-xs text-muted-foreground">+ {m.outputs.filter((p) => p.startsWith("rewrite/")).length} chapters</span>}
        </div>
      )}
    </div>
  );
}

const STEP_ICON = (line: string) => /^Searching the web/.test(line) ? Search : /^Opening/.test(line) ? Globe : /^Writing|^Editing/.test(line) ? PenLine : /^Reading/.test(line) ? BookOpen : Sparkles;

export function LiveCard({ live, onStop }: { live: Live; onStop: () => void }) {
  const steps = live.steps.filter((s) => s.kind !== "status" || live.steps.length === 1);
  const writes = live.steps.filter((s) => /^Writing out\//.test(s.line)).length;
  const searches = live.steps.filter((s) => /^Searching the web/.test(s.line)).length;
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/30 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-primary/5 px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><Loader2 className="h-4 w-4 animate-spin text-primary" /> Claude is working · {live.job.label}</div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">{writes} files written · {searches} searches</span>
          <Button size="sm" variant="outline" onClick={onStop} className="h-8 rounded-full"><Square className="h-3.5 w-3.5" /> Stop</Button>
        </div>
      </div>
      <ol className="max-h-64 space-y-1.5 overflow-y-auto px-5 py-3 text-sm">
        {steps.slice(-30).map((s, i) => {
          const I = s.kind === "denied" ? ShieldAlert : s.kind === "notice" ? AlertTriangle : STEP_ICON(s.line);
          return <li key={i} className={`flex items-start gap-2 ${s.kind === "denied" || s.kind === "notice" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}><I className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0 break-words">{s.line}</span></li>;
        })}
      </ol>
      {live.text.length > 0 && <div className="border-t border-border px-5 py-3"><Markdown text={live.text.at(-1) ?? ""} className="text-sm text-muted-foreground" /></div>}
      <p className="border-t border-border px-5 py-2 text-[11px] text-muted-foreground">You can leave this page: Claude keeps working and the results will be here when you come back.</p>
    </div>
  );
}

// Results: main files first; by-products folded into named groups (as the Studio listed them before the redesign).
const RESULT_GROUPS: { prefix: string; label: string }[] = [
  { prefix: "rewrite/", label: "Rewritten chapters" }, { prefix: "rewrite-earlier-", label: "Earlier rewritten chapters" }, { prefix: "scanned/", label: "Scanned pages, as text" }, { prefix: "scanned-earlier-", label: "Earlier readings of scanned pages" }, { prefix: "volumes/", label: "Series volumes" }, { prefix: "planned/", label: "Planned books" },
  { prefix: "book/", label: "Book wizard" }, { prefix: "translation/", label: "Translated chapters" }, { prefix: "sections/", label: "Manuscript suggestions" },
];
/** The project's results, newest first, with chapter files, volumes, wizard files and suggestions grouped. */
export function ResultsList({ outputs, onOpen }: { outputs: StudioThread["outputs"]; onOpen: (p: string) => void }) {
  const sorted = [...outputs].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  const grouped = (p: string) => p === "series.json" || RESULT_GROUPS.some((g) => p.startsWith(g.prefix));
  // (rewrite-earlier-<time>/: chapters set aside when a rewrite started from an approved plan.)
  const groups = RESULT_GROUPS.map((g) => ({ ...g, items: outputs.filter((o) => o.path.startsWith(g.prefix)).sort((a, b) => a.path.localeCompare(b.path)) })).filter((g) => g.items.length);
  return (
    <div className="space-y-1">
      {sorted.filter((o) => !grouped(o.path)).map((o) => <OutputRow key={o.path} path={o.path} bytes={o.bytes} at={o.modifiedAt} onOpen={onOpen} compact />)}
      {groups.map((g) => (
        <details key={g.prefix} className="rounded-xl border border-border px-2 py-1.5">
          <summary className="cursor-pointer text-[13px] font-medium">{g.label} · {g.items.length}</summary>
          <div className="mt-1.5 space-y-1">{g.items.map((o) => <OutputRow key={o.path} path={o.path} bytes={o.bytes} at={o.modifiedAt} onOpen={onOpen} compact />)}</div>
        </details>
      ))}
    </div>
  );
}

export function OutputRow({ path, bytes, at, onOpen, compact }: { path: string; bytes: number; at: string; onOpen: (p: string) => void; compact?: boolean }) {
  return (
    <button onClick={() => onOpen(path)} className={`flex w-full items-center gap-3 rounded-xl border border-border text-left transition hover:border-primary/40 hover:bg-muted/40 ${compact ? "px-2 py-1.5" : "px-3 py-2.5"}`}>
      <FileText className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{outputLabel(path)}</span>
        {!compact && <span className="block text-xs text-muted-foreground">{formatBytes(bytes)} · {new Date(at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>}</span>
    </button>
  );
}


export function ActionDialog({ action, thread, styles, onClose, onRun, rules, claudeCode = true }: { action: DialogAction; thread: StudioThread; styles: string[]; onClose: () => void; onRun: (o: RunOptions) => void;
  /** The book's rules, the control panel's default terminology. */ rules?: string; /** The engine is Claude Code (approval mode and audits need it). */ claudeCode?: boolean }) {
  const [initial] = useState(() => { const t = pendingTarget, x = pendingOptions; setPendingTarget(null); return { target: t, options: x }; });
  const [target, setTarget] = useState<string>(initial.target ?? (thread.files.length ? "source" : thread.outputs[0]?.path ?? "source"));
  const [o, setO] = useState<RunOptions>({ length: action === "rewrite" ? "same" : "standard", keepStructure: true, keepVoice: true, addCitations: false, citationStyle: styles[0] ?? "APA 7", scope: "claims", ...(initial.options ?? {}) });
  const correcting = action === "rewrite" && Boolean(o.correct);
  const [panel, setPanel] = useState(false);
  const targetLabel = (v: string) => (v === "source" ? "My uploaded documents" : `Result · ${outputLabel(v)}`);
  const [sending, setSending] = useState(false);
  const set = (p: Partial<RunOptions>) => setO((x) => ({ ...x, ...p }));
  const meta = ACTIONS.find((a) => a.id === action)!;
  const targets = useMemo(() => [...(thread.files.length ? [{ v: "source", l: "My uploaded documents" }] : []), ...thread.outputs.filter((x) => !x.path.startsWith("rewrite/") && !x.path.endsWith(".json")).map((x) => ({ v: x.path, l: `Result · ${outputLabel(x.path)}` }))], [thread]);
  const canRun = action !== "rewrite" || Boolean(o.instructions?.trim());

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl"><meta.icon className="h-5 w-5 text-primary" /> {correcting ? "Correct the problems" : meta.title}</DialogTitle>
          <DialogDescription>{correcting ? "A targeted correction: Claude fixes only the problems the editorial check found, keeps every passage that passes, and reports what needs you (a missing chapter, a claim without a source). The result is a separate “Corrected book”." : action === "rewrite" ? "Claude works chapter by chapter and re-reads your instructions before each one, so they hold across the whole book." : action === "cite" ? "Claude searches the web, opens the sources and cites only what it actually found. Anything unsupported is marked [citation needed]." : "A faithful summary of what the document says, with nothing added."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Work on</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{targets.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {action === "summarize" && (<>
            <div className="space-y-1.5"><Label>Length</Label>
              <Select value={o.length} onValueChange={(v) => set({ length: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="brief">Brief (about 300 words)</SelectItem><SelectItem value="standard">Standard (about 800 words)</SelectItem><SelectItem value="detailed">Detailed, chapter by chapter</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="focus">Focus (optional)</Label><Input id="focus" value={o.focus ?? ""} onChange={(e) => set({ focus: e.target.value })} placeholder="e.g. the main arguments and the scriptures used" /></div>
          </>)}

          {correcting && (
            <div className="space-y-1.5">
              <Label htmlFor="ins">Problems to fix (from the editorial check; remove any you want to keep) <span className="text-destructive">*</span></Label>
              <Textarea id="ins" rows={10} value={o.instructions ?? ""} onChange={(e) => set({ instructions: e.target.value })} className="font-mono text-[12.5px]" />
            </div>
          )}
          {action === "rewrite" && !correcting && (<>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-primary/25 bg-primary/5 px-3 py-2.5">
              <span className="text-[13px]"><span className="font-medium">Book Rewrite Control Panel</span><span className="block text-[12px] text-muted-foreground">Tick the editorial operations, pick a preset (or your Demonology transformation instruction) and approval or autonomous mode; it writes the instructions.</span></span>
              <Button size="sm" variant="outline" onClick={() => setPanel(true)}><SlidersHorizontal className="h-4 w-4" /> Open the control panel</Button>
            </div>
            {(o.approval || o.auditOnly) && <p className="rounded-[10px] bg-muted/50 px-3 py-2 text-[12.5px]">{o.auditOnly ? "Audit only: Claude checks the book and writes the reports; the prose is not rewritten." : "Approval mode: Claude analyses the book and proposes the new contents and plan, then stops. Open “Rewrite · plan for your approval” in Results and approve it to start the rewrite."}{!claudeCode && <span className="block text-[#B45309]">This needs Claude Code: switch the engine first.</span>}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="ins">Your instructions <span className="text-destructive">*</span></Label>
              <Textarea id="ins" rows={7} value={o.instructions ?? ""} onChange={(e) => set({ instructions: e.target.value })} autoFocus
                placeholder={"Be precise; Claude follows these to the letter. Claude re-expresses every paragraph professionally and keeps your ideas, convictions, quotations and scripture. For example:\n• A university course textbook: precise, measured academic English.\n• Testimony stays clearly the author's testimony.\n• Each chapter opens with its learning objectives and ends with a summary."} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Keep chapter structure" checked={o.keepStructure !== false} onChange={(v) => set({ keepStructure: v })} />
              <Toggle label="Keep the author's voice" checked={o.keepVoice !== false} onChange={(v) => set({ keepVoice: v })} />
            </div>
            {o.keepStructure === false && <p className="rounded-[10px] bg-muted/50 px-3 py-2 text-[12.5px] text-muted-foreground">This rewrite may reorganise where your instructions say so. To give the whole book a new professional structure (parts, chapters in the reader's order, openings, summaries, questions), use <span className="font-medium text-foreground">Plan → Rebuild as a professional book</span>: you review Claude's design before anything changes.</p>}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Length</Label>
                <Select value={o.length} onValueChange={(v) => set({ length: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="same">About the same</SelectItem><SelectItem value="shorter">Shorter</SelectItem><SelectItem value="longer">Longer</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="aud">Audience</Label><Input id="aud" value={o.audience ?? ""} onChange={(e) => set({ audience: e.target.value })} placeholder="e.g. teenagers" /></div>
              <div className="space-y-1.5"><Label htmlFor="lang">Language</Label><Input id="lang" value={o.language ?? ""} onChange={(e) => set({ language: e.target.value })} placeholder="Same as source" /></div>
            </div>
            <Toggle label="Also add citations and references" checked={Boolean(o.addCitations)} onChange={(v) => set({ addCitations: v })} />
            {o.addCitations && <StylePicker styles={styles} value={o.citationStyle} onChange={(v) => set({ citationStyle: v })} />}
          </>)}

          {action === "cite" && (<>
            <StylePicker styles={styles} value={o.citationStyle} onChange={(v) => set({ citationStyle: v })} />
            <div className="space-y-1.5"><Label>What to support</Label>
              <Select value={o.scope} onValueChange={(v) => set({ scope: v as RunOptions["scope"] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="claims">Quotations, statistics, dates and specific claims</SelectItem><SelectItem value="all">Every factual claim</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="notes">Notes (optional)</Label><Input id="notes" value={o.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} placeholder="e.g. prefer academic and primary sources" /></div>
          </>)}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button className={`rounded-full ${GRADIENT}`} disabled={!canRun || sending} onClick={() => { setSending(true); onRun({ ...o, target }); }}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <meta.icon className="h-4 w-4" />} {correcting ? "Start the correction" : `Start ${meta.title.toLowerCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
      {panel && <RewriteControlPanel projectId={thread.id} defaults={{ title: thread.title === "Untitled project" ? "" : thread.title, terminology: rules }} sourceLabel={targetLabel(target)} claudeCode={claudeCode}
        onClose={() => setPanel(false)}
        onUse={(r) => { set({ instructions: r.instructions, keepStructure: r.keepStructure, approval: r.approval, auditOnly: r.auditOnly, ...(r.language ? { language: r.language } : {}), ...(r.audience ? { audience: r.audience } : {}) }); setPanel(false); }} />}
    </Dialog>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm"><span>{label}</span><Switch checked={checked} onCheckedChange={onChange} /></label>;
}

export function StylePicker({ styles, value, onChange }: { styles: string[]; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5"><Label>Citation style</Label>
      <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{styles.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
  );
}

/** Whole-book results the editorial check applies to, and those it compares with the original (DESIGN-SPEC.md §15). */
const BOOK_RESULT = (p: string) => /^(rewrite\.md|corrected\.md|voice\.md|cited\.md|rewrite\/.+\.md|book\/.+\.md|volumes\/.+\.md)$/.test(p) && !/-notes\.md$/.test(p);
const REWRITE_RESULT = (p: string) => p === "rewrite.md" || p === "corrected.md" || p === "voice.md";
/** Whole-book results that can become the book's manuscript. */
const WHOLE_BOOK = (p: string) => /^(rewrite|corrected|voice|cited|proofread|translation)\.md$/.test(p);
const JSON_NOTE: Record<string, string> = {
  "book/outline.json": "An outline from Plan → Outline with Claude; it was added to your plan when it was made.",
  "cover-copy.json": "Cover copy Claude wrote; Cover uses it.",
  "series.json": "The series plan as data; Turn into a series uses it.",
  "book-design.json": "The design of the rebuilt book.",
};

/** Which Library book each saved result became, on this device, so a second save updates it. */
const libraryCopy = {
  key: (t: string, p: string) => `studio.library.${t}.${p}`,
  get(t: string, p: string): string | null { try { return localStorage.getItem(this.key(t, p)); } catch { return null; } },
  set(t: string, p: string, id: string) { try { localStorage.setItem(this.key(t, p), id); } catch { /* storage blocked */ } },
};

export function ResultViewer({ backend, threadId, path, projectTitle, onClose, onUseAsTarget, check, onReview, reviewAt, onUseAsManuscript, onUseDesign, onApprovePlan }: {
  backend: StudioBackend; threadId: string; path: string; projectTitle: string; onClose: () => void;
  /** Rewrite this result, or correct it with the editorial check's findings filled in. */
  onUseAsTarget: (p: string, o?: Partial<RunOptions>) => void;
  /** The book's rules and the author's original, for the editorial check. */
  check?: { rules: string; original: () => Promise<string> };
  /** Ask Claude for the judgement-level editorial review of this result, and when the last one was written. */
  onReview?: (p: string) => void; reviewAt?: string | null;
  /** Makes a whole-book result the book's manuscript (the current one is kept to restore), so Finish works on it. */
  onUseAsManuscript?: (text: string, label: string) => void;
  /** Lays the manuscript out to a saved design of the rebuilt book. */
  onUseDesign?: (raw: string) => void;
  /** Approval mode: approve the proposed plan and start the rewrite from it. */
  onApprovePlan?: () => void;
}) {
  const { toast } = useToast();
  const [text, setText] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(false);
  useEffect(() => { backend.output(threadId, path).then(setText).catch((e) => { setText(""); toast({ title: "Could not open the result", description: e instanceof Error ? e.message : "", variant: "destructive" }); }); }, [backend, threadId, path, toast]);
  // Versions and approval of a whole-book result (DESIGN-SPEC.md §16).
  const versioned = isBookResult(path);
  const [history, setHistory] = useState<ResultHistory | null>(null);
  const [base, setBase] = useState<number | null>(null);
  const [op, setOp] = useState("Edited by the owner");
  const [approving, setApproving] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  useEffect(() => {
    if (!versioned) return;
    backend.history(threadId, path).then((h) => { setHistory(h); setBase(h.versions.at(-1)?.n ?? 0); }).catch(() => setHistory(null));
  }, [backend, threadId, path, versioned]);
  const latest = history?.versions.at(-1) ?? null;
  const status = versioned ? resultStatus(history, edited) : null;
  const approvedNow = Boolean(history?.approval && latest && history.approval.version === latest.n && !edited);
  const aiReview = Boolean(reviewAt && latest && reviewAt > latest.at);
  const saveVersion = async (body: string, how: string) => {
    setSavingVersion(true);
    try {
      const h = await backend.saveOutput(threadId, path, body, { op: how, base: base ?? undefined });
      setHistory(h); setBase(h.versions.at(-1)?.n ?? null); setText(body); setEdited(false); setOp("Edited by the owner");
      toast({ title: `Saved as version ${h.versions.at(-1)?.n}`, description: "The earlier versions are kept." });
      return true;
    } catch (e) { toast({ title: "Not saved", description: e instanceof Error ? e.message : "", variant: "destructive" }); return false; }
    finally { setSavingVersion(false); }
  };

  const bookTitle = text ? titleOf(text, projectTitle) : projectTitle;
  const save = async () => {
    if (!text) return;
    if (warning && !window.confirm(`${warning}\n\nSave it to your Library anyway?`)) return;
    if (audit && audit.blockers && !window.confirm(`The editorial check found ${audit.blockers} ${audit.blockers === 1 ? "problem" : "problems"} to fix before publishing (open Editorial check to see them).\n\nSave it to your Library anyway?`)) return;
    setSaving(true);
    try {
      // The Library copy says whether it is the approved book or a working draft, and which version.
      const state = versioned ? { status: approvedNow ? "approved" : "draft", version: latest?.n ?? null, approvedAt: approvedNow ? history!.approval!.at : null, approvedBy: approvedNow ? history!.approval!.by : null } : {};
      // Saving the same result again updates its Library book instead of adding another copy.
      const payload = { markdown: text, title: bookTitle, ...state, studioProject: threadId };
      const preview = text.replace(/^#.*$/m, "").trim().slice(0, 160);
      const known = libraryCopy.get(threadId, path);
      let id = known;
      if (known) { try { await updateDocument(known, payload, preview); } catch { id = null; } }
      if (!id) { id = await saveDocument({ kind: "book", title: bookTitle, payload, preview }); libraryCopy.set(threadId, path, id); }
      setSavedId(id);
      toast({ title: "Saved to your Library", description: versioned ? (approvedNow ? `“${bookTitle}”, version ${latest?.n}, approved for publication.` : `“${bookTitle}” is saved as a working draft (not approved for publication).`) : `“${bookTitle}” is ready for editing, export and publishing.` });
    } catch (e) { toast({ title: "Could not save", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setSaving(false); }
  };
  const [exporting, setExporting] = useState<BookFormat | null>(null);
  // Exports of a whole-book result are named as drafts until the version is approved.
  const download = async (format: BookFormat = "md") => {
    if (!text) return;
    setExporting(format);
    try { saveFile(await bookFile(text, bookTitle, format), bookFileName(bookTitle, format, { draft: versioned && !approvedNow })); }
    catch (e) { toast({ title: "Export failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setExporting(null); }
  };
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const isJson = path.endsWith(".json");
  const [checking, setChecking] = useState(false);
  // "Go to the passage" from the check: open the text for editing with the line selected.
  const editor = useRef<HTMLTextAreaElement>(null);
  const [jump, setJump] = useState<number | null>(null);
  const goTo = (line: number) => { setChecking(false); setComparing(false); setEditing(true); setJump(line); };
  const [comparing, setComparing] = useState(false);
  const comparable = Boolean(check) && REWRITE_RESULT(path) && Boolean(text);
  // Edits here live only in this window until saved to the Library; closing asks first.
  const close = () => { if (edited && !savedId && !window.confirm(versioned ? "Your changes are not saved as a version. Close and lose them?" : "Your changes to this result are not saved. Close and lose them?")) return; onClose(); };
  const [versionsOpen, setVersionsOpen] = useState(false);
  const view = (v: "text" | "check" | "compare" | "versions") => { setChecking(v === "check"); setComparing(v === "compare"); setVersionsOpen(v === "versions"); if (v !== "text") setEditing(false); };
  useEffect(() => {
    const el = editor.current;
    if (jump === null || !el || text === null) return;
    const lines = text.split("\n");
    const start = lines.slice(0, jump - 1).reduce((n, l) => n + l.length + 1, 0);
    el.focus();
    el.setSelectionRange(start, start + (lines[jump - 1]?.length ?? 0));
    el.scrollTop = Math.max(0, (el.scrollHeight * (jump - 1)) / Math.max(1, lines.length) - el.clientHeight / 3);
    el.scrollIntoView?.({ block: "center" });
    setJump(null);
  }, [jump, editing, text]);
  const checkable = Boolean(text) && BOOK_RESULT(path) && words >= 200;
  const audit = useMemo(() => (checkable && text ? auditBook(text, { rules: check?.rules }) : null), [checkable, text, check?.rules]);
  // A rewrite that came back very short, or that says the source couldn't be read, is not a book yet.
  const warning = !text || isJson ? null
    : /\b(could ?n[o']t|can ?not|unable to|was not able to) (read|open|decode|extract)\b|\b(garbled|unreadable|not readable|encoding (problem|issue|error))\b/i.test(text) ? "Claude says it couldn't read part of the source, so this may be incomplete."
    : words < 300 && /book|rewrite|draft|manuscript/i.test(path + projectTitle) ? `Only ${words.toLocaleString()} words came back. The source file may not have been read properly: upload the original PDF or Word file and run it again.`
    : null;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className={`flex max-h-[92vh] flex-col gap-0 p-0 ${comparing ? "max-w-6xl" : "max-w-4xl"}`}>
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 font-serif text-xl"><button onClick={close} className="text-muted-foreground hover:text-foreground sm:hidden" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>{outputLabel(path)}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">{text === null ? "Opening…" : `${words.toLocaleString()} words · ${path}${edited ? " · edited" : ""}`}
            {status && text !== null && <span role="status" aria-label="Review status" className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${STATUS_TONE[status.tone]}`}>{status.label}</span>}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-10">
          {warning && <div role="alert" className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">{warning}</div>}
          {audit && !checking && !comparing && (audit.blockers > 0 || audit.reviews > 0) && (
            <div role="status" className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <ScanSearch className="h-4 w-4 text-primary" aria-hidden />
              <span>Editorial check: {audit.blockers ? `${audit.blockers} to fix before publishing` : "no blocking problems found by the code checks"}{audit.reviews ? `, ${audit.reviews} for your decision` : ""}{check && REWRITE_RESULT(path) ? "; the comparison with your original runs when you open it" : ""}.</span>
              <Button size="sm" variant="outline" className="ml-auto rounded-full" onClick={() => view("check")}>See the check</Button>
              {comparable && <Button size="sm" variant="ghost" className="rounded-full" onClick={() => view("compare")}>Compare with original</Button>}
            </div>
          )}
          {text === null ? <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" /> : versionsOpen && history
            ? <VersionsPanel history={history} current={text} read={(n) => backend.version(threadId, path, n)} onRestore={async (n, old) => { if (edited && !window.confirm("Your unsaved changes will be replaced by this version. Continue?")) return; if (await saveVersion(old, `Restored version ${n}`)) view("text"); }} />
            : comparing && text && check
            ? <CompareView text={text} rules={check.rules} original={check.original} onChange={(next) => { setText(next); setEdited(true); setSavedId(null); setOp("Original wording restored in a paragraph"); toast({ title: "Your original wording is back", description: versioned ? "Only that paragraph changed. Save it as a version to keep it." : "Only that paragraph changed. Save to your Library to keep it." }); }} />
            : checking && text
            ? <EditorialCheck text={text} rules={check?.rules} original={check && REWRITE_RESULT(path) ? check.original : undefined} storageKey={`studio.review.${threadId}.${path}`}
                placeLabel="Go to the passage" onPlace={(p) => goTo(p.line)}
                onCorrect={edited ? undefined : (brief) => onUseAsTarget(path, { correct: true, instructions: brief })} />
            : editing
            ? <Textarea ref={editor} value={text} onChange={(e) => { setText(e.target.value); setEdited(true); setSavedId(null); }} aria-label="Edit the result" className="min-h-[60vh] font-serif text-[15px] leading-relaxed" />
            : path.endsWith(".json") ? <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-[13px]">{prettyJson(text)}</pre> : <Markdown text={text} />}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/30 px-6 py-3">
          {isJson ? (path === "book-design.json" && onUseDesign
            ? <Button size="sm" className={`rounded-full ${GRADIENT}`} disabled={!text} onClick={() => { if (text && window.confirm("Lay your manuscript out to this design?\n\nThe manuscript's sections are replaced by the designed ones, each with its plan. The current manuscript is kept and can be restored from Plan.")) { onUseDesign(text); onClose(); } }}><Sparkles className="h-4 w-4" /> Use this design</Button>
            : <span className="text-sm text-muted-foreground">{JSON_NOTE[path] ?? "Data Claude wrote for the Studio, used where it was made."}</span>) : savedId ? (<>
            <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"><Check className="h-4 w-4" /> In your Library</span>
            <Button asChild size="sm" className={`rounded-full ${GRADIENT}`}><Link to={`/library?open=${savedId}`}><Library className="h-4 w-4" /> Open: edit, export EPUB / PDF / print</Link></Button>
            <Button asChild size="sm" variant="outline" className="rounded-full"><Link to="/translate"><Languages className="h-4 w-4" /> Translate</Link></Button>
            <Button asChild size="sm" variant="outline" className="rounded-full"><Link to="/publishing"><Rocket className="h-4 w-4" /> Publish</Link></Button>
          </>) : (<>
            {versioned && edited && <Button size="sm" className={`rounded-full ${GRADIENT}`} disabled={!text || savingVersion} onClick={() => text && saveVersion(text, op)}>{savingVersion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save as version {(latest?.n ?? 0) + 1}</Button>}
            <Button size="sm" variant={versioned && edited ? "outline" : "default"} className={`rounded-full ${versioned && edited ? "" : GRADIENT}`} disabled={!text || saving || (versioned && edited)} title={versioned && edited ? "Save your edits as a version first" : undefined} onClick={save}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />} {libraryCopy.get(threadId, path) ? (versioned ? (approvedNow ? "Update in Library (approved)" : "Update the draft in Library") : "Update in Library") : versioned ? (approvedNow ? "Save to Library (approved)" : "Save draft to Library") : "Save to Library as a book"}</Button>
            {versioned && !edited && latest && !approvedNow && <Button size="sm" variant="outline" className="rounded-full" onClick={() => setApproving(true)} aria-label="Approve for publication"><BadgeCheck className="h-4 w-4" /> Approve…</Button>}
            {WHOLE_BOOK(path) && onUseAsManuscript && <Button size="sm" variant="outline" className="rounded-full" disabled={!text || edited} title={edited ? "Save your edits first" : "Make this the book's manuscript, so Finish works on it"} aria-label="Make this the book's manuscript" onClick={() => { if (text && window.confirm("Make this the book's manuscript?\n\nIts chapters replace the manuscript's, so the cover, interior design, production, audiobook, translation and AI Teacher in Finish work on it. The current manuscript is kept and can be restored from Plan.")) { onUseAsManuscript(text, outputLabel(path)); onClose(); } }}><BookOpen className="h-4 w-4" /> Use as the manuscript</Button>}
          </>)}
          <div className="ml-auto flex gap-1">
            {checkable && <Button size="sm" variant={checking ? "secondary" : "outline"} className="rounded-full" onClick={() => view(checking ? "text" : "check")} aria-pressed={checking} aria-label={checking ? "Back to the text" : "Editorial check"}><ScanSearch className="h-4 w-4" /> {checking ? "Text" : "Check"}</Button>}
            {comparable && <Button size="sm" variant={comparing ? "secondary" : "outline"} className="rounded-full" onClick={() => view(comparing ? "text" : "compare")} aria-pressed={comparing} aria-label={comparing ? "Back to the text" : "Compare with original"}><Columns2 className="h-4 w-4" /> {comparing ? "Text" : "Compare"}</Button>}
            {!isJson && !savedId && <Button size="sm" variant={editing ? "secondary" : "outline"} className="rounded-full" disabled={!text} onClick={() => { view("text"); setEditing((v) => !v); }}><PenLine className="h-4 w-4" /> {editing ? "Preview" : versioned ? "Edit" : "Edit before saving"}</Button>}
            {versioned && history && <Button size="sm" variant={versionsOpen ? "secondary" : "outline"} className="rounded-full" onClick={() => view(versionsOpen ? "text" : "versions")} aria-pressed={versionsOpen} aria-label={versionsOpen ? "Back to the text" : `Versions (${history.versions.length})`}><History className="h-4 w-4" /> {versionsOpen ? "Text" : `Versions (${history.versions.length})`}</Button>}
            {path === "rewrite-plan.md" && onApprovePlan && <Button size="sm" className={`rounded-full ${GRADIENT}`} disabled={!text} onClick={() => { if (window.confirm("Approve this plan and rewrite the whole book from it?\n\nClaude rewrites every chapter of the plan from your original, then integrates and audits the book. Your original is not changed.")) { onApprovePlan(); onClose(); } }}><Check className="h-4 w-4" /> Approve this plan and rewrite the book</Button>}
            {path === "series-plan.md" && <SeriesActions backend={backend} threadId={threadId} onDone={onClose} />}
            {path === "voice-profile.md" && <Button size="sm" variant="ghost" disabled={!text} onClick={async () => { try { await backend.saveVoice(text ?? ""); toast({ title: "Saved as your voice profile", description: "“In my voice” and “Rewrite in my voice” now follow it." }); } catch (e) { toast({ title: "Couldn't save", description: e instanceof Error ? e.message : "", variant: "destructive" }); } }}><PenLine className="h-4 w-4" /> Use as my voice profile</Button>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="sm" variant="ghost" disabled={!text} aria-label="More actions"><MoreHorizontal className="h-4 w-4" /> More</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isJson && <DropdownMenuItem className="gap-2" onSelect={() => onUseAsTarget(path)}><Wand2 className="h-4 w-4" /> Rewrite this</DropdownMenuItem>}
                <DropdownMenuItem className="gap-2" onSelect={() => { navigator.clipboard.writeText(text ?? ""); toast({ title: "Copied" }); }}><Copy className="h-4 w-4" /> Copy</DropdownMenuItem>
                {versioned && onReview && <DropdownMenuItem className="gap-2" onSelect={() => onReview(path)}><ScanSearch className="h-4 w-4" /> Editorial review by Claude (judgement)</DropdownMenuItem>}
                <DropdownMenuItem className="gap-2" onSelect={() => download("md")}><Download className="h-4 w-4" /> Download Markdown (.md)</DropdownMenuItem>
                {!isJson && <DropdownMenuItem className="gap-2" disabled={exporting !== null} onSelect={() => download("docx")}><FileText className="h-4 w-4" /> {exporting === "docx" ? "Exporting Word…" : "Export Word (.docx)"}</DropdownMenuItem>}
                {!isJson && <DropdownMenuItem className="gap-2" disabled={exporting !== null} onSelect={() => download("epub")}><BookOpen className="h-4 w-4" /> {exporting === "epub" ? "Exporting EPUB…" : "Export EPUB"}</DropdownMenuItem>}
                {versioned && !approvedNow && <p className="px-2 py-1.5 text-[11.5px] text-muted-foreground">Exports are named “draft” until this version is approved.</p>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </DialogContent>
      {approving && text && latest && <ApproveDialog text={text} rules={check?.rules} original={check && REWRITE_RESULT(path) ? check.original : undefined} version={latest.n}
        dismissedKey={`studio.review.${threadId}.${path}`} aiReview={aiReview} onReview={onReview ? () => { setApproving(false); onReview(path); } : undefined} onClose={() => setApproving(false)}
        onApprove={async (summary) => { try { const h = await backend.approve(threadId, path, { version: latest.n, summary }); setHistory(h); setApproving(false); toast({ title: `Version ${latest.n} approved for publication`, description: "Recorded with your name and the time. It lapses if a newer version is saved." }); } catch (e) { toast({ title: "Not approved", description: e instanceof Error ? e.message : "", variant: "destructive" }); } }} />}
    </Dialog>
  );
}

