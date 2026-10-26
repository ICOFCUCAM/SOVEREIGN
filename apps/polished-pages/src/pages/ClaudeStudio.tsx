import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, BookOpen, Check, Copy, Download, FileText, FolderOpen, Globe, Languages, Library, Loader2, MessageSquare,
  Cpu, Layers, PenLine, Plus, Wrench, Quote, Rocket, ScrollText, Search, Send, ShieldAlert, Sparkles, Square, Trash2, Upload, Wand2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import SpineMark from "@/components/brand/SpineMark";
import Markdown from "@/components/studio/Markdown";
import JoinFiles from "@/components/studio/JoinFiles";
import ToolsDialog from "@/components/studio/ToolsDialog";
import ManuscriptEditor from "@/components/studio/ManuscriptEditor";
import MyBooks from "@/components/studio/MyBooks";
import VoicePanel from "@/components/studio/VoicePanel";
import { importText } from "@/lib/manuscript";
import type { CoverCopyWriter } from "@/lib/cover-copy";
import { createSeriesInLibrary, readManifest, startPlannedBooks } from "@/lib/series-from-plan";
import { apiBookEngine } from "@/lib/book-engine";
import { apiCoverCopyWriter, browserBackend, decideEngine, runnerBackend, type EngineDecision, type EngineMode, type StudioBackend } from "@/lib/studio-backend";
import { isAdmin, saveDocument } from "@/lib/documents";
import {
  RUNNER_URL, STUDIO_ACCEPT, StudioError, claudeBookEngine, claudeCoverCopyWriter, outputLabel, studio, titleOf,
  type RunOptions, type StudioAction, type StudioEvent, type StudioJob, type StudioMe, type StudioThread, type StudioThreadSummary,
} from "@/lib/claude-studio";

// The real Book Creator wizard, driven by Claude Code inside a project (loaded on demand).
const BookCreator = lazy(() => import("@/pages/BookCreator"));

// Claude Studio — the owner's own Claude Code inside Polished Pages. Upload a
// document or a whole book, then summarise it, rewrite it under strict
// instructions, add researched citations, or talk it through. Results are saved
// to the Library as books, where every existing book tool (editing, history,
// EPUB/PDF/print export, translation, audiobook, publishing) takes over.
// Admin only; the runner enforces the same rule on every request.

const GRADIENT = "bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] text-white shadow-[0_10px_28px_-12px_hsl(248_83%_55%/0.7)] hover:opacity-95";
const STAGE = { background: "radial-gradient(120% 140% at 20% -20%, hsl(222 47% 13%) 0%, hsl(222 47% 8%) 50%, hsl(224 60% 5%) 100%)" };

type Live = { job: StudioJob; steps: { line: string; kind: "tool" | "notice" | "denied" | "status"; at: string }[]; text: string[] };

const ClaudeStudio = () => {
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => { isAdmin().then(setAdmin).catch(() => setAdmin(false)); }, []);

  if (admin === null) return <div className="flex min-h-[60vh] items-center justify-center"><SpineMark animated /></div>;
  if (!admin) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-2xl font-bold">Admins only</h1>
        <p className="mt-2 font-sans text-muted-foreground">Claude Studio is private to the site owner.</p>
        <Link to="/dashboard" className="mt-6 inline-block font-sans text-primary hover:underline">← Back to dashboard</Link>
      </div>
    );
  }
  return <Studio />;
};

const MODE_KEY = "studio.engineMode";
const readMode = (): EngineMode => { try { const v = localStorage.getItem(MODE_KEY); return v === "claude" || v === "api" ? v : "auto"; } catch { return "auto"; } };

// Always visible: which engine does the work right now, and why.
function EngineBadge({ decision, mode, onMode, busy }: { decision: EngineDecision; mode: EngineMode; onMode: (m: EngineMode) => void; busy: boolean }) {
  const isClaude = decision.active === "claude-code";
  const dot = decision.tone === "ok" ? "bg-emerald-400" : decision.tone === "warn" ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div className="flex items-center gap-2">
        <span data-testid="engine-badge" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white">
          <span className={`h-2 w-2 rounded-full ${dot} ${busy ? "animate-pulse" : ""}`} />
          {decision.active === null ? "No engine available" : isClaude ? "Engine: Claude Code · your plan" : "Engine: API · billed per use"}
        </span>
        <Select value={mode} onValueChange={(v) => onMode(v as EngineMode)}>
          <SelectTrigger aria-label="Engine mode" className="h-8 w-[150px] border-white/15 bg-white/5 text-xs text-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto (prefer Claude Code)</SelectItem>
            <SelectItem value="claude">Claude Code only</SelectItem>
            <SelectItem value="api">API only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <span className="text-[11px] text-white/55">{decision.reason}</span>
    </div>
  );
}

function Studio() {
  const { toast } = useToast();
  const [me, setMe] = useState<StudioMe | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [threads, setThreads] = useState<StudioThreadSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"projects" | "books" | "voice">("projects");
  // Handed to a project when it opens: a view to show, or a run to start once.
  const [handoff, setHandoff] = useState<{ id: string; view?: "assistant" | "manuscript"; run?: { action: StudioAction; options: RunOptions } } | null>(null);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [mode, setModeState] = useState<EngineMode>(readMode);
  const setMode = (m: EngineMode) => { setModeState(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* per-browser preference only */ } };

  const decision = decideEngine(mode, me, meError);
  // Projects live on the runner when it answers; otherwise in this browser (API only).
  const backend: StudioBackend = RUNNER_URL && !meError ? runnerBackend : browserBackend;
  const ready = backend === browserBackend || Boolean(me);

  const refreshMe = useCallback(() => {
    if (!RUNNER_URL) return;
    studio.me().then((m) => { setMe(m); setMeError(null); }).catch((e) => { setMe(null); setMeError(e instanceof Error ? e.message : "The runner can't be reached."); });
  }, []);

  const loadThreads = useCallback(async () => {
    try { const t = await backend.threads(); setThreads(t); return t; }
    catch (e) { setThreads([]); if (backend === runnerBackend) setMeError(e instanceof Error ? e.message : "The runner can't be reached."); return []; }
  }, [backend]);
  // Who writes cover copy: the owner's Claude Code (as a job in the given
  // project, or in a "Book covers" project for books from the Library), else the API.
  const coverWriter = useCallback((threadId?: string): CoverCopyWriter | undefined => {
    if (decision.active === "claude-code" && backend === runnerBackend) {
      return claudeCoverCopyWriter(async () => {
        if (threadId) return threadId;
        const found = (await backend.threads()).find((t) => t.title === "Book covers");
        const id = found?.id ?? (await backend.create("Book covers")).id;
        void loadThreads();
        return id;
      });
    }
    return decision.active ? { ...apiCoverCopyWriter, label: "API · billed per use" } : undefined;
  }, [decision.active, backend, loadThreads]);

  useEffect(() => {
    refreshMe();
    const t = window.setInterval(refreshMe, 60_000); // a plan limit lifts, a runner comes back
    return () => window.clearInterval(t);
  }, [refreshMe]);
  useEffect(() => {
    if (!ready) return;
    setThreads(null);
    loadThreads().then((t) => setActiveId((id) => (id && t.some((x) => x.id === id) ? id : t[0]?.id ?? null)));
  }, [ready, loadThreads]);

  const newProject = async () => {
    try {
      const t = await backend.create("Untitled project");
      await loadThreads();
      setActiveId(t.id); setProjectsOpen(false);
    } catch (e) { toast({ title: "Could not create the project", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const list = (
    <div className="flex h-full flex-col">
      <Button onClick={newProject} className={`h-10 w-full rounded-full ${GRADIENT}`} disabled={!ready}><Plus className="h-4 w-4" /> New project</Button>
      <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Projects{backend === browserBackend ? " · in this browser" : ""}</div>
      <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
        {threads === null && ready && <p className="px-2 py-3 text-sm text-muted-foreground">Loading…</p>}
        {threads?.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">No projects yet. Start one, then upload a document or a book.</p>}
        {threads?.map((t) => (
          <button key={t.id} onClick={() => { setActiveId(t.id); setProjectsOpen(false); }}
            className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${t.id === activeId ? "bg-primary/10 text-foreground ring-1 ring-primary/20" : "hover:bg-muted"}`}>
            <span className="block truncate text-sm font-medium">{t.title}</span>
            <span className="block text-xs text-muted-foreground">{t.files} {t.files === 1 ? "document" : "documents"} · {t.outputs} {t.outputs === 1 ? "result" : "results"}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <section className="relative isolate overflow-hidden text-white" style={STAGE}>
        <div className="pointer-events-none absolute -top-24 left-1/3 -z-10 h-72 w-72 rounded-full bg-[hsl(262_83%_58%)]/25 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(262_83%_64%)]/60 to-transparent" />
        <div className="container flex flex-col gap-4 px-6 py-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Owner workspace</p>
            <h1 className="text-display mt-1.5 text-3xl font-bold sm:text-4xl">Claude <span className="bg-gradient-to-r from-[hsl(217_91%_70%)] via-[hsl(245_85%_74%)] to-[hsl(280_85%_74%)] bg-clip-text pr-1 italic text-transparent">Studio</span></h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/60">Summarise, rewrite under strict instructions, research citations, check, translate and produce books. Runs on your own Claude Code when it's available, and on the API when it isn't.</p>
          </div>
          <div className="flex items-end gap-2">
            <EngineBadge decision={decision} mode={mode} onMode={setMode} busy={Boolean(me?.busy)} />
            <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10 lg:hidden" onClick={() => setProjectsOpen(true)}><FolderOpen className="h-4 w-4" /> Projects</Button>
          </div>
        </div>
      </section>

      {backend === browserBackend && (
        <div className="border-b border-amber-500/30 bg-amber-500/10">
          <div className="container px-6 py-2.5 text-sm text-amber-800 dark:text-amber-300">
            {RUNNER_URL ? "The Claude Code runner isn't answering, so" : "The Claude Code runner isn't set up yet, so"} projects are kept in this browser and every run uses the API (billed per use). {RUNNER_URL && <button className="font-semibold underline underline-offset-2" onClick={refreshMe}>Check again</button>}
            {!RUNNER_URL && <SetupHint />}
          </div>
        </div>
      )}

      <div className="border-b border-border">
        <div className="container flex gap-1 px-4 sm:px-6" role="tablist" aria-label="Studio">
          {([["projects", "Projects"], ["books", "My books"], ["voice", "My voice"]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{l}</button>
          ))}
        </div>
      </div>

      {tab === "books" ? (
        <div className="container px-4 py-6 sm:px-6">
          <MyBooks
            coverWriter={coverWriter()}
            onWorkInStudio={async (title, markdown) => {
              const t = await backend.create(title);
              await backend.upload(t.id, new File([markdown], `${title.replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "book"}.md`, { type: "text/markdown" }));
              await backend.saveManuscript(t.id, importText(title, markdown));
              await loadThreads();
              setHandoff({ id: t.id, view: "manuscript" }); setActiveId(t.id); setTab("projects");
            }}
            onLearnVoice={async (books) => {
              if (!decision.active) throw new Error(decision.reason);
              const t = await backend.create("My voice samples");
              for (const b of books) await backend.upload(t.id, new File([b.markdown], `${b.title.replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "book"}.md`, { type: "text/markdown" }));
              await loadThreads();
              setHandoff({ id: t.id, run: { action: "tool", options: { tool: "voice-profile" } } }); setActiveId(t.id); setTab("projects");
            }}
          />
        </div>
      ) : tab === "voice" ? (
        <div className="container px-4 py-8 sm:px-6"><VoicePanel backend={backend} onGoToBooks={() => setTab("books")} /></div>
      ) : mode === "claude" && backend === browserBackend ? (
        <div className="container max-w-2xl px-6 py-16 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
          <h2 className="mt-4 font-serif text-2xl font-bold">Claude Code isn't available</h2>
          <p className="mt-2 text-muted-foreground">{decision.reason} Choose Auto or API only in the engine menu to keep working on the API.</p>
          {!RUNNER_URL && <SetupCard />}
        </div>
      ) : (
        <div className="container grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="hidden h-[calc(100vh-15rem)] lg:block">{list}</aside>
          <Sheet open={projectsOpen} onOpenChange={setProjectsOpen}>
            <SheetContent side="left" className="w-[300px]"><SheetHeader><SheetTitle>Projects</SheetTitle></SheetHeader><div className="mt-4 h-[calc(100%-3rem)]">{list}</div></SheetContent>
          </Sheet>
          {activeId && ready ? (
            <Project key={`${backend.storage}:${activeId}`} id={activeId} backend={backend} decision={decision} mode={mode} coverWriter={coverWriter(activeId)}
              citationStyles={me?.citationStyles ?? CITATION_STYLES_FALLBACK} busyElsewhere={Boolean(me?.busy && me.busy.threadId !== activeId)}
              handoff={handoff?.id === activeId ? handoff : null} onHandoffUsed={() => setHandoff(null)}
              onChanged={() => { loadThreads(); refreshMe(); }} onDeleted={async () => { const t = await loadThreads(); setActiveId(t[0]?.id ?? null); }} />
          ) : (
            <EmptyState onNew={newProject} disabled={!ready} />
          )}
        </div>
      )}
    </div>
  );
}

const CITATION_STYLES_FALLBACK = ["APA 7", "Chicago (notes and bibliography)", "Chicago (author-date)", "MLA 9", "Harvard", "SBL", "IEEE", "Vancouver"];

function SetupHint() {
  return <span className="ml-1">To use your Claude Code plan instead, deploy the runner (see <code className="rounded bg-amber-500/10 px-1">services/polished-claude-runner</code>).</span>;
}

function SetupCard() {
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

function EmptyState({ onNew, disabled }: { onNew: () => void; disabled: boolean }) {
  return (
    <div className="grid min-h-[50vh] place-items-center rounded-2xl border border-dashed border-border p-10 text-center">
      <div>
        <Sparkles className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-4 font-serif text-2xl font-bold">Start a project</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">A project holds your documents, the conversation with Claude, and everything it writes.</p>
        <Button className={`mt-6 rounded-full ${GRADIENT}`} onClick={onNew} disabled={disabled}><Plus className="h-4 w-4" /> New project</Button>
      </div>
    </div>
  );
}

type DialogAction = "summarize" | "rewrite" | "cite";

const ACTIONS: { id: DialogAction; title: string; line: string; icon: typeof ScrollText }[] = [
  { id: "summarize", title: "Summarise", line: "Overview, key points, chapter by chapter", icon: ScrollText },
  { id: "rewrite", title: "Rewrite", line: "Whole book, under your strict instructions", icon: Wand2 },
  { id: "cite", title: "Citations & references", line: "Researched on the web, never invented", icon: Quote },
];

function Project({ id, backend, decision, mode, coverWriter, citationStyles, busyElsewhere, handoff, onHandoffUsed, onChanged, onDeleted }: {
  id: string; backend: StudioBackend; decision: EngineDecision; mode: EngineMode; coverWriter?: CoverCopyWriter; citationStyles: string[]; busyElsewhere: boolean;
  handoff: { view?: "assistant" | "manuscript"; run?: { action: StudioAction; options: RunOptions } } | null; onHandoffUsed: () => void;
  onChanged: () => void; onDeleted: () => void;
}) {
  const { toast } = useToast();
  const [thread, setThread] = useState<StudioThread | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogAction | null>(null);
  const [message, setMessage] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [drag, setDrag] = useState(false);
  const [wizard, setWizard] = useState(false);
  const [joining, setJoining] = useState(false);
  const [tools, setTools] = useState(false);
  const [view, setView] = useState<"assistant" | "manuscript">(handoff?.view ?? "assistant");
  // A Claude Code run that failed because the plan is signed out or at its limit can be re-run on the API.
  const [retry, setRetry] = useState<{ action: StudioAction; options: RunOptions; why: string } | null>(null);
  const lastRun = useRef<{ action: StudioAction; options: RunOptions } | null>(null);
  const engineId = decision.active;
  const titleRef = useRef("");
  // The Book wizard follows the engine in use, and says so in its header.
  const engine = useMemo(() => engineId === "claude-code" && backend === runnerBackend
    ? claudeBookEngine(id, (o) => {
      // An untitled project takes the book's title once Claude has outlined it.
      if (o.title && titleRef.current === "Untitled project") backend.rename(id, o.title).then((t) => { setThread(t); setTitle(t.title); onChanged(); }).catch(() => {});
    })
    : { ...apiBookEngine, label: "Written by the API · billed per use", coverCopy: apiCoverCopyWriter }, [id, onChanged, engineId, backend]);
  const fileRef = useRef<HTMLInputElement>(null);
  const feedEnd = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    const { thread: t, job } = await backend.thread(id);
    setThread(t); setTitle(t.title);
    return { t, job };
  }, [id, backend]);

  const follow = useCallback((job: StudioJob) => {
    abort.current?.abort();
    const ctl = new AbortController(); abort.current = ctl;
    setLive({ job, steps: [], text: [] });
    const onEvent = (e: StudioEvent) => {
      if (e.type === "done") {
        setLive(null);
        reload().then(({ t }) => {
          const outs = e.outputs ?? [];
          // Open the run's main result (series plan, summary, rewritten book…), not a by-product.
          const pick = (e.output && outs.includes(e.output) ? e.output : null) ?? ["rewrite.md", "cited.md", "summary.md", "series-plan.md"].find((p) => outs.includes(p)) ?? outs.find((p) => !p.includes("/") && !p.endsWith(".json")) ?? outs[0];
          if (pick && t.outputs.some((o) => o.path === pick)) setViewing(pick);
        }).catch(() => {});
        onChanged();
        if (e.status === "failed") {
          const planProblem = e.errorKind === "auth" || e.errorKind === "limit";
          if (planProblem && lastRun.current && mode !== "claude") setRetry({ ...lastRun.current, why: e.errorKind === "auth" ? "Claude Code is signed out." : "Your Claude plan's limit is reached." });
          else toast({ title: "Claude couldn't finish", description: e.error ?? "", variant: "destructive" });
        }
        return;
      }
      setLive((l) => {
        if (!l) return l;
        if (e.type === "text") return { ...l, text: [...l.text, e.text] };
        return { ...l, steps: [...l.steps, { line: e.line, kind: e.type, at: e.at }].slice(-200) };
      });
    };
    backend.follow(job, onEvent, ctl.signal).catch((err) => { if (!ctl.signal.aborted) toast({ title: "Lost the live view", description: err instanceof Error ? err.message : "", variant: "destructive" }); });
  }, [reload, onChanged, toast, backend, mode]);

  useEffect(() => {
    reload().then(({ job }) => { if (job?.status === "running") follow(job); }).catch((e) => toast({ title: "Could not open the project", description: e instanceof Error ? e.message : "", variant: "destructive" }));
    return () => abort.current?.abort();
  }, [reload, follow, toast]);

  useEffect(() => { titleRef.current = thread?.title ?? ""; }, [thread?.title]);
  useEffect(() => { feedEnd.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [thread?.messages.length, live?.steps.length, live?.text.length]);

  const upload = async (files: FileList | File[]) => {
    for (const f of Array.from(files)) {
      setUploading(f.name);
      try {
        const t = await backend.upload(id, f);
        setThread(t);
        if (t.title === "Untitled project") { const nt = await backend.rename(id, f.name.replace(/\.[^.]+$/, "")); setThread(nt); setTitle(nt.title); }
        onChanged();
      } catch (e) { toast({ title: `Could not upload ${f.name}`, description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    }
    setUploading(null);
  };

  const start = async (action: StudioAction, options: RunOptions, force?: "api") => {
    const use = force ?? engineId;
    if (!use) { toast({ title: "No engine available", description: decision.reason, variant: "destructive" }); return; }
    try {
      setRetry(null);
      lastRun.current = { action, options };
      const job = await backend.run(id, action, options, use);
      setDialog(null);
      if (action === "chat") setMessage("");
      await reload();
      follow(job);
    } catch (e) {
      toast({ title: e instanceof StudioError && e.status === 409 ? "Claude is busy" : "Could not start", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const stop = async () => { if (live) await backend.cancel(live.job).catch(() => {}); };

  const saveTitle = async () => {
    if (!thread || !title.trim() || title === thread.title) return;
    try { setThread(await backend.rename(id, title.trim())); onChanged(); } catch { setTitle(thread.title); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${thread?.title}” with its documents and results? Anything saved to your Library stays.`)) return;
    try { await backend.remove(id); onDeleted(); } catch (e) { toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  // A run handed over from My books (e.g. Learn my voice) starts once, when the project is open.
  const handed = useRef(false);
  const loaded = Boolean(thread);
  useEffect(() => {
    if (!loaded || !handoff || handed.current) return;
    handed.current = true;
    onHandoffUsed();
    if (handoff.run) void start(handoff.run.action, handoff.run.options);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per hand-over
  }, [loaded, handoff]);

  if (!thread) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const viewSwitch = (
    <div className="mb-4 inline-flex rounded-full border border-border p-0.5 text-sm" role="tablist" aria-label="Project view">
      {([["assistant", "Assistant"], ["manuscript", "Manuscript"]] as const).map(([k, l]) => (
        <button key={k} role="tab" aria-selected={view === k} type="button" onClick={() => setView(k)}
          className={`rounded-full px-4 py-1.5 font-medium ${view === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
      ))}
    </div>
  );

  if (view === "manuscript" && !wizard) {
    return (
      <div className="min-w-0">
        {viewSwitch}
        <ManuscriptEditor thread={thread} backend={backend} engine={engineId} coverWriter={coverWriter} citationStyles={citationStyles} onChanged={() => { reload().catch(() => {}); onChanged(); }} />
      </div>
    );
  }

  if (wizard) {
    return (
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setWizard(false); reload().catch(() => {}); onChanged(); }}><ArrowLeft className="h-4 w-4" /> Back to {thread.title}</Button>
          <span className="text-xs text-muted-foreground">{engine.label === "Written by your Claude Code" ? "Outline, chapters and improvements are written by your Claude Code in this project." : "Outline, chapters and improvements are written by the API (billed per use)."} Covers, audiobook voices, translations and repurposing use the site's own services.</span>
        </div>
        <div className="-mx-4 mt-2 overflow-hidden rounded-2xl border border-border sm:mx-0">
          <Suspense fallback={<div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <BookCreator engine={engine} draftKey={`studio.book.${id}`} />
          </Suspense>
        </div>
      </div>
    );
  }

  const originals = thread.files.filter((f) => f.kind === "original");
  const busy = Boolean(live) || (busyElsewhere && engineId === "claude-code" && !live) || !engineId;
  const hasSource = thread.files.length > 0;
  // Results: main files first; by-products folded into named groups.
  const GROUPS: { prefix: string; label: string }[] = [
    { prefix: "volumes/", label: "Series volumes" }, { prefix: "planned/", label: "Planned books" }, { prefix: "book/", label: "Book wizard" },
    { prefix: "translation/", label: "Translated chapters" }, { prefix: "sections/", label: "Manuscript suggestions" },
  ];
  const grouped = (o: { path: string }) => o.path.startsWith("rewrite/") || o.path === "series.json" || GROUPS.some((g) => o.path.startsWith(g.prefix));
  const mainOutputs = thread.outputs.filter((o) => !grouped(o));
  const outputGroups = GROUPS.map((g) => ({ ...g, items: thread.outputs.filter((o) => o.path.startsWith(g.prefix)).sort((a, b) => a.path.localeCompare(b.path)) })).filter((g) => g.items.length);
  const chapters = thread.outputs.filter((o) => o.path.startsWith("rewrite/")).sort((a, b) => a.path.localeCompare(b.path));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        {viewSwitch}
        {/* Title */}
        <div className="flex items-center gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            aria-label="Project name" className="h-11 border-transparent bg-transparent px-1 font-serif text-2xl font-bold shadow-none focus-visible:border-input" />
          <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete project" disabled={Boolean(live)}><Trash2 className="h-4 w-4" /></Button>
        </div>

        {/* Documents */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); }}
          className={`mt-3 rounded-2xl border border-dashed p-4 transition-colors ${drag ? "border-primary bg-primary/5" : "border-border"}`}>
          <div className="flex flex-wrap items-center gap-2">
            {originals.map((f) => (
              <span key={f.storedAs} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <span className="max-w-[220px] truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(f.bytes)}{thread.files.some((x) => x.kind === "text" && x.storedAs === f.storedAs.replace(/\.[^.]+$/, "") + ".txt") ? " · text read" : ""}</span>
                <button type="button" aria-label={`Remove ${f.name}`} disabled={Boolean(live)} className="text-muted-foreground hover:text-foreground"
                  onClick={async () => { let t = await backend.removeFile(id, f.storedAs); const txt = f.storedAs.replace(/\.[^.]+$/, "") + ".txt"; if (txt !== f.storedAs && t.files.some((x) => x.storedAs === txt)) t = await backend.removeFile(id, txt); setThread(t); onChanged(); }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => fileRef.current?.click()} disabled={Boolean(uploading)}>
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading {uploading}…</> : <><Upload className="h-4 w-4" /> {originals.length ? "Add document" : "Upload a document or book"}</>}
            </Button>
            {!originals.length && !uploading && <span className="text-xs text-muted-foreground">PDF, Word, text, Markdown or scanned images. Drop files here.</span>}
            <input ref={fileRef} type="file" accept={STUDIO_ACCEPT} multiple hidden onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.target.value = ""; }} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={busy} onClick={() => setWizard(true)}
            className="group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.07] to-transparent p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md disabled:pointer-events-none disabled:opacity-50">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${GRADIENT}`}><BookOpen className="h-5 w-5" /></span>
            <span><span className="block font-semibold">Book wizard</span><span className="block text-xs text-muted-foreground">Outline, write and produce a new book, chapter by chapter</span></span>
          </button>
          <button type="button" disabled={Boolean(live)} onClick={() => setJoining(true)}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md disabled:pointer-events-none disabled:opacity-50">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Layers className="h-5 w-5" /></span>
            <span><span className="block font-semibold">Join files</span><span className="block text-xs text-muted-foreground">Many PDFs or Word files into one PDF, one Word file or one book</span></span>
          </button>
          <button type="button" disabled={busy || (!hasSource && thread.outputs.length === 0)} onClick={() => setTools(true)}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md disabled:pointer-events-none disabled:opacity-50">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Wrench className="h-5 w-5" /></span>
            <span><span className="block font-semibold">More tools</span><span className="block text-xs text-muted-foreground">Proofread, fact-check, verify scripture, translate, study guide, index and more</span></span>
          </button>
          {ACTIONS.map((a) => (
            <button key={a.id} type="button" disabled={busy || (!hasSource && thread.outputs.length === 0)} onClick={() => setDialog(a.id)}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md disabled:pointer-events-none disabled:opacity-50">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><a.icon className="h-5 w-5" /></span>
              <span><span className="block font-semibold">{a.title}</span><span className="block text-xs text-muted-foreground">{a.line}</span></span>
            </button>
          ))}
        </div>

        {retry && (
          <div role="alert" className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="flex-1">{retry.why} The engine has switched to the API for new runs.</span>
            <Button size="sm" className={`rounded-full ${GRADIENT}`} onClick={() => start(retry.action, retry.options, "api")}><Cpu className="h-4 w-4" /> Run it on the API</Button>
            <Button size="sm" variant="ghost" onClick={() => setRetry(null)}>Dismiss</Button>
          </div>
        )}

        {/* Conversation */}
        <div className="mt-6 space-y-4" aria-live="polite">
          {thread.messages.length === 0 && !live && (
            <div className="rounded-2xl bg-muted/40 p-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How it works</p>
              <p className="mt-1">Upload a document, then use a button above or ask anything below: “List every scripture quoted in chapter 3”, “Rewrite the introduction for teenagers”, “Check the dates in chapter 5 and cite sources”. Claude reads your files, searches the web when needed, and writes results you can save to your Library as a book.</p>
            </div>
          )}
          {thread.messages.map((m) => <MessageCard key={m.id} m={m} onOpen={setViewing} />)}
          {live && <LiveCard live={live} onStop={stop} />}
          <div ref={feedEnd} className="scroll-mb-44" />
        </div>

        {/* Composer */}
        <form onSubmit={(e) => { e.preventDefault(); if (message.trim()) start("chat", { message }); }} className="sticky bottom-[4.75rem] z-30 mt-6 md:bottom-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder={busy ? "Claude is working… you can write your next message." : "Ask Claude about your document, or tell it what to write…"}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (message.trim() && !busy) start("chat", { message }); } }}
              aria-label="Message to Claude" className="min-h-[52px] resize-none border-0 shadow-none focus-visible:ring-0" />
            <Button type="submit" size="icon" disabled={busy || !message.trim()} className={`h-11 w-11 shrink-0 rounded-full ${GRADIENT}`} aria-label="Send"><Send className="h-4 w-4" /></Button>
          </div>
          <p className="mt-1.5 hidden px-2 text-[11px] text-muted-foreground md:block">Ctrl + Enter to send. Claude remembers this project's conversation.</p>
        </form>
      </div>

      {/* Results */}
      <aside className="xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Results</div>
        {thread.outputs.length === 0 ? (
          <p className="mt-2 rounded-xl border border-border p-4 text-sm text-muted-foreground">What Claude writes appears here: summaries, rewritten books, references and reports.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {mainOutputs.map((o) => <OutputRow key={o.path} path={o.path} bytes={o.bytes} at={o.modifiedAt} onOpen={setViewing} />)}
            {outputGroups.map((g) => (
              <details key={g.prefix} className="rounded-xl border border-border px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium">{g.label} · {g.items.length}</summary>
                <div className="mt-2 space-y-1">{g.items.map((o) => <OutputRow key={o.path} path={o.path} bytes={o.bytes} at={o.modifiedAt} onOpen={setViewing} compact />)}</div>
              </details>
            ))}
            {chapters.length > 0 && (
              <details className="rounded-xl border border-border px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium">{chapters.length} rewritten chapters</summary>
                <div className="mt-2 space-y-1">{chapters.map((o) => <OutputRow key={o.path} path={o.path} bytes={o.bytes} at={o.modifiedAt} onOpen={setViewing} compact />)}</div>
              </details>
            )}
          </div>
        )}
        <div className="mt-6 rounded-xl bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Private and contained</p>
          Claude works only inside this project: it can read your files, search and open web pages, and write results. It cannot run programs or reach anything else on the server.
        </div>
      </aside>

      {tools && <ToolsDialog thread={thread} engine={engineId} onClose={() => setTools(false)} onRun={(o) => { setTools(false); start("tool", o); }} />}
      <JoinFiles open={joining} onClose={() => setJoining(false)} onAddToProject={(f) => upload([f])} />
      {dialog && <ActionDialog action={dialog} thread={thread} styles={citationStyles} onClose={() => setDialog(null)} onRun={(o) => start(dialog, o)} />}
      {viewing && <ResultViewer backend={backend} threadId={id} path={viewing} projectTitle={thread.title} onClose={() => { setViewing(null); onChanged(); }} onUseAsTarget={(p) => { setViewing(null); setDialog("rewrite"); setPendingTarget(p); }} />}
    </div>
  );
}

// A result chosen as the target of the next action ("rewrite this result") is
// handed to the dialog through this small module-level slot.
let pendingTarget: string | null = null;
const setPendingTarget = (p: string | null) => { pendingTarget = p; };

function SeriesActions({ backend, threadId, onDone }: { backend: StudioBackend; threadId: string; onDone: () => void }) {
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

function prettyJson(t: string) {
  try { return JSON.stringify(JSON.parse(t), null, 2); } catch { return t; }
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const ACTION_ICON: Record<StudioAction, typeof MessageSquare> = { chat: MessageSquare, summarize: ScrollText, rewrite: Wand2, cite: Quote, tool: Wrench, section: PenLine, "book-outline": BookOpen, "book-chapter": BookOpen, "book-improve": BookOpen };

function MessageCard({ m, onOpen }: { m: StudioThread["messages"][number]; onOpen: (p: string) => void }) {
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

function LiveCard({ live, onStop }: { live: Live; onStop: () => void }) {
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

function OutputRow({ path, bytes, at, onOpen, compact }: { path: string; bytes: number; at: string; onOpen: (p: string) => void; compact?: boolean }) {
  return (
    <button onClick={() => onOpen(path)} className={`flex w-full items-center gap-3 rounded-xl border border-border text-left transition hover:border-primary/40 hover:bg-muted/40 ${compact ? "px-2 py-1.5" : "px-3 py-2.5"}`}>
      <FileText className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{outputLabel(path)}</span>
        {!compact && <span className="block text-xs text-muted-foreground">{formatBytes(bytes)} · {new Date(at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>}</span>
    </button>
  );
}

function ActionDialog({ action, thread, styles, onClose, onRun }: { action: DialogAction; thread: StudioThread; styles: string[]; onClose: () => void; onRun: (o: RunOptions) => void }) {
  const [target, setTarget] = useState<string>(() => { const p = pendingTarget; setPendingTarget(null); return p ?? (thread.files.length ? "source" : thread.outputs[0]?.path ?? "source"); });
  const [o, setO] = useState<RunOptions>({ length: action === "rewrite" ? "same" : "standard", keepStructure: true, keepVoice: true, addCitations: false, citationStyle: styles[0] ?? "APA 7", scope: "claims" });
  const [sending, setSending] = useState(false);
  const set = (p: Partial<RunOptions>) => setO((x) => ({ ...x, ...p }));
  const meta = ACTIONS.find((a) => a.id === action)!;
  const targets = useMemo(() => [...(thread.files.length ? [{ v: "source", l: "My uploaded documents" }] : []), ...thread.outputs.filter((x) => !x.path.startsWith("rewrite/") && !x.path.endsWith(".json")).map((x) => ({ v: x.path, l: `Result · ${outputLabel(x.path)}` }))], [thread]);
  const canRun = action !== "rewrite" || Boolean(o.instructions?.trim());

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl"><meta.icon className="h-5 w-5 text-primary" /> {meta.title}</DialogTitle>
          <DialogDescription>{action === "rewrite" ? "Claude works chapter by chapter and re-reads your instructions before each one, so they hold across the whole book." : action === "cite" ? "Claude searches the web, opens the sources and cites only what it actually found. Anything unsupported is marked [citation needed]." : "A faithful summary of what the document says, with nothing added."}</DialogDescription>
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

          {action === "rewrite" && (<>
            <div className="space-y-1.5">
              <Label htmlFor="ins">Your instructions <span className="text-destructive">*</span></Label>
              <Textarea id="ins" rows={7} value={o.instructions ?? ""} onChange={(e) => set({ instructions: e.target.value })} autoFocus
                placeholder={"Be precise; Claude follows these to the letter. For example:\n• Modern, warm English for adult readers; short paragraphs.\n• Keep every scripture reference exactly as written.\n• Do not add new arguments; fix grammar and flow only.\n• Each chapter opens with a one-sentence summary in italics."} />
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
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <meta.icon className="h-4 w-4" />} Start {meta.title.toLowerCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm"><span>{label}</span><Switch checked={checked} onCheckedChange={onChange} /></label>;
}

function StylePicker({ styles, value, onChange }: { styles: string[]; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5"><Label>Citation style</Label>
      <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{styles.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
  );
}

function ResultViewer({ backend, threadId, path, projectTitle, onClose, onUseAsTarget }: { backend: StudioBackend; threadId: string; path: string; projectTitle: string; onClose: () => void; onUseAsTarget: (p: string) => void }) {
  const { toast } = useToast();
  const [text, setText] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { backend.output(threadId, path).then(setText).catch((e) => { setText(""); toast({ title: "Could not open the result", description: e instanceof Error ? e.message : "", variant: "destructive" }); }); }, [backend, threadId, path, toast]);

  const bookTitle = text ? titleOf(text, projectTitle) : projectTitle;
  const save = async () => {
    if (!text) return;
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

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 font-serif text-xl"><button onClick={onClose} className="text-muted-foreground hover:text-foreground sm:hidden" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>{outputLabel(path)}</DialogTitle>
          <DialogDescription>{text === null ? "Opening…" : `${words.toLocaleString()} words · ${path}`}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-10">
          {text === null ? <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" /> : path.endsWith(".json") ? <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-[13px]">{prettyJson(text)}</pre> : <Markdown text={text} />}
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

export default ClaudeStudio;
