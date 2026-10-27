import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, BookOpen, Check, Copy, Download, FileText, Globe, Languages, Layers, Library, Loader2, MessageSquare,
  PenLine, Plus, Quote, Rocket, ScanSearch, ScrollText, Search, ShieldAlert, Sparkles, Square, Wand2, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Markdown from "@/components/studio/Markdown";
import { createSeriesInLibrary, readManifest, startPlannedBooks } from "@/lib/series-from-plan";
import type { StudioBackend } from "@/lib/studio-backend";
import { saveDocument } from "@/lib/documents";
import { outputLabel, titleOf, type RunOptions, type StudioAction, type StudioJob, type StudioThread } from "@/lib/claude-studio";
import { GRADIENT } from "./ui";
import EditorialCheck from "./EditorialCheck";
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

export function OutputRow({ path, bytes, at, onOpen, compact }: { path: string; bytes: number; at: string; onOpen: (p: string) => void; compact?: boolean }) {
  return (
    <button onClick={() => onOpen(path)} className={`flex w-full items-center gap-3 rounded-xl border border-border text-left transition hover:border-primary/40 hover:bg-muted/40 ${compact ? "px-2 py-1.5" : "px-3 py-2.5"}`}>
      <FileText className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{outputLabel(path)}</span>
        {!compact && <span className="block text-xs text-muted-foreground">{formatBytes(bytes)} · {new Date(at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>}</span>
    </button>
  );
}


export function ActionDialog({ action, thread, styles, onClose, onRun }: { action: DialogAction; thread: StudioThread; styles: string[]; onClose: () => void; onRun: (o: RunOptions) => void }) {
  const [initial] = useState(() => { const t = pendingTarget, x = pendingOptions; setPendingTarget(null); return { target: t, options: x }; });
  const [target, setTarget] = useState<string>(initial.target ?? (thread.files.length ? "source" : thread.outputs[0]?.path ?? "source"));
  const [o, setO] = useState<RunOptions>({ length: action === "rewrite" ? "same" : "standard", keepStructure: true, keepVoice: true, addCitations: false, citationStyle: styles[0] ?? "APA 7", scope: "claims", ...(initial.options ?? {}) });
  const correcting = action === "rewrite" && Boolean(o.correct);
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
            <div className="space-y-1.5">
              <Label htmlFor="ins">Your instructions <span className="text-destructive">*</span></Label>
              <Textarea id="ins" rows={7} value={o.instructions ?? ""} onChange={(e) => set({ instructions: e.target.value })} autoFocus
                placeholder={"Be precise; Claude follows these to the letter. Claude re-expresses every paragraph professionally and keeps your ideas, convictions, quotations and scripture. For example:\n• A university course textbook: precise, measured academic English.\n• Testimony stays clearly the author's testimony.\n• Each chapter opens with its learning objectives and ends with a summary."} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Keep chapter structure" checked={o.keepStructure !== false} onChange={(v) => set({ keepStructure: v })} />
              <Toggle label="Keep the author's voice" checked={o.keepVoice !== false} onChange={(v) => set({ keepVoice: v })} />
            </div>
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

export function ResultViewer({ backend, threadId, path, projectTitle, onClose, onUseAsTarget, check }: {
  backend: StudioBackend; threadId: string; path: string; projectTitle: string; onClose: () => void;
  /** Rewrite this result, or correct it with the editorial check's findings filled in. */
  onUseAsTarget: (p: string, o?: Partial<RunOptions>) => void;
  /** The book's rules and the author's original, for the editorial check. */
  check?: { rules: string; original: () => Promise<string> };
}) {
  const { toast } = useToast();
  const [text, setText] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(false);
  useEffect(() => { backend.output(threadId, path).then(setText).catch((e) => { setText(""); toast({ title: "Could not open the result", description: e instanceof Error ? e.message : "", variant: "destructive" }); }); }, [backend, threadId, path, toast]);

  const bookTitle = text ? titleOf(text, projectTitle) : projectTitle;
  const save = async () => {
    if (!text) return;
    if (warning && !window.confirm(`${warning}\n\nSave it to your Library anyway?`)) return;
    if (audit && audit.blockers && !window.confirm(`The editorial check found ${audit.blockers} ${audit.blockers === 1 ? "problem" : "problems"} to fix before publishing (open Editorial check to see them).\n\nSave it to your Library anyway?`)) return;
    setSaving(true);
    try {
      const id = await saveDocument({ kind: "book", title: bookTitle, payload: { markdown: text, title: bookTitle }, preview: text.replace(/^#.*$/m, "").trim().slice(0, 160) });
      setSavedId(id);
      toast({ title: "Saved to your Library", description: `“${bookTitle}” is ready for editing, export and publishing.` });
    } catch (e) { toast({ title: "Could not save", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setSaving(false); }
  };
  const download = () => {
    if (!text) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    a.download = `${bookTitle.replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "result"}.md`;
    a.click(); URL.revokeObjectURL(a.href);
  };
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const isJson = path.endsWith(".json");
  const [checking, setChecking] = useState(false);
  const checkable = Boolean(text) && BOOK_RESULT(path) && words >= 200;
  const audit = useMemo(() => (checkable && text ? auditBook(text, { rules: check?.rules }) : null), [checkable, text, check?.rules]);
  // A rewrite that came back very short, or that says the source couldn't be read, is not a book yet.
  const warning = !text || isJson ? null
    : /\b(could ?n[o']t|can ?not|unable to|was not able to) (read|open|decode|extract)\b|\b(garbled|unreadable|not readable|encoding (problem|issue|error))\b/i.test(text) ? "Claude says it couldn't read part of the source, so this may be incomplete."
    : words < 300 && /book|rewrite|draft|manuscript/i.test(path + projectTitle) ? `Only ${words.toLocaleString()} words came back. The source file may not have been read properly: upload the original PDF or Word file and run it again.`
    : null;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 font-serif text-xl"><button onClick={onClose} className="text-muted-foreground hover:text-foreground sm:hidden" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>{outputLabel(path)}</DialogTitle>
          <DialogDescription>{text === null ? "Opening…" : `${words.toLocaleString()} words · ${path}${edited ? " · edited" : ""}`}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-10">
          {warning && <div role="alert" className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">{warning}</div>}
          {audit && !checking && (audit.blockers > 0 || audit.reviews > 0) && (
            <div role="status" className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <ScanSearch className="h-4 w-4 text-primary" aria-hidden />
              <span>Editorial check: {audit.blockers ? `${audit.blockers} to fix before publishing` : "nothing blocks publishing"}{audit.reviews ? `, ${audit.reviews} to review` : ""}{check && REWRITE_RESULT(path) ? "; compare it with your original" : ""}.</span>
              <Button size="sm" variant="outline" className="ml-auto rounded-full" onClick={() => setChecking(true)}>See the check</Button>
            </div>
          )}
          {text === null ? <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" /> : checking && text
            ? <EditorialCheck text={text} rules={check?.rules} original={check && REWRITE_RESULT(path) ? check.original : undefined} onCorrect={edited ? undefined : (brief) => onUseAsTarget(path, { correct: true, instructions: brief })} />
            : editing
            ? <Textarea value={text} onChange={(e) => { setText(e.target.value); setEdited(true); setSavedId(null); }} aria-label="Edit the result" className="min-h-[60vh] font-serif text-[15px] leading-relaxed" />
            : path.endsWith(".json") ? <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-[13px]">{prettyJson(text)}</pre> : <Markdown text={text} />}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/30 px-6 py-3">
          {isJson ? <span className="text-sm text-muted-foreground">The outline the Book wizard uses. Edit it in the wizard.</span> : savedId ? (<>
            <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"><Check className="h-4 w-4" /> In your Library</span>
            <Button asChild size="sm" className={`rounded-full ${GRADIENT}`}><Link to={`/library?open=${savedId}`}><Library className="h-4 w-4" /> Open: edit, export EPUB / PDF / print</Link></Button>
            <Button asChild size="sm" variant="outline" className="rounded-full"><Link to="/translate"><Languages className="h-4 w-4" /> Translate</Link></Button>
            <Button asChild size="sm" variant="outline" className="rounded-full"><Link to="/publishing"><Rocket className="h-4 w-4" /> Publish</Link></Button>
          </>) : (
            <Button size="sm" className={`rounded-full ${GRADIENT}`} disabled={!text || saving} onClick={save}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />} Save to Library as a book</Button>
          )}
          <div className="ml-auto flex gap-1">
            {checkable && <Button size="sm" variant={checking ? "secondary" : "outline"} className="rounded-full" onClick={() => setChecking((v) => !v)} aria-pressed={checking}><ScanSearch className="h-4 w-4" /> {checking ? "Back to the text" : "Editorial check"}</Button>}
            {!isJson && !savedId && <Button size="sm" variant={editing ? "secondary" : "outline"} className="rounded-full" disabled={!text} onClick={() => { setChecking(false); setEditing((v) => !v); }}><PenLine className="h-4 w-4" /> {editing ? "Preview" : "Edit before saving"}</Button>}
            {path === "series-plan.md" && <SeriesActions backend={backend} threadId={threadId} onDone={onClose} />}
            {path === "voice-profile.md" && <Button size="sm" variant="ghost" disabled={!text} onClick={async () => { try { await backend.saveVoice(text ?? ""); toast({ title: "Saved as your voice profile", description: "“In my voice” and “Rewrite in my voice” now follow it." }); } catch (e) { toast({ title: "Couldn't save", description: e instanceof Error ? e.message : "", variant: "destructive" }); } }}><PenLine className="h-4 w-4" /> Use as my voice profile</Button>}
            {!isJson && <Button size="sm" variant="ghost" disabled={!text} onClick={() => onUseAsTarget(path)}><Wand2 className="h-4 w-4" /> Rewrite this</Button>}
            <Button size="sm" variant="ghost" disabled={!text} onClick={() => { navigator.clipboard.writeText(text ?? ""); toast({ title: "Copied" }); }}><Copy className="h-4 w-4" /> Copy</Button>
            <Button size="sm" variant="ghost" disabled={!text} onClick={download}><Download className="h-4 w-4" /> .md</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

