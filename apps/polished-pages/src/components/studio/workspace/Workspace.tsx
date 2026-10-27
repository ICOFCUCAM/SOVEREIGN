import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, CloudOff, Cpu, Focus, History, LifeBuoy, Loader2, Menu, MessageSquare, Moon, PanelRightOpen, Plus, Redo2, Search, Sparkles, Undo2, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme";
import { importText, insertSection, kindDef, words, type Manuscript } from "@/lib/manuscript";
import { readWizardDraft, wizardDraftToManuscript } from "@/lib/studio-merge";
import { apiBookEngine, type BookEngine } from "@/lib/book-engine";
import type { CoverCopyWriter } from "@/lib/cover-copy";
import { apiCoverCopyWriter, runnerBackend, type EngineDecision, type EngineMode, type StudioBackend } from "@/lib/studio-backend";
import { StudioError, claudeBookEngine, type RunOptions, type StudioAction, type StudioEvent, type StudioJob, type StudioThread, type StudioThreadSummary } from "@/lib/claude-studio";
import type { ToolId } from "@/lib/studio-tools";
import JoinFiles from "@/components/studio/JoinFiles";
import ToolsDialog from "@/components/studio/ToolsDialog";
import MyBooks from "@/components/studio/MyBooks";
import VoicePanel from "@/components/studio/VoicePanel";
import Frame, { STAGES, type Place } from "./Frame";
import Canvas, { VIEWS, type CanvasView } from "./Canvas";
import ClaudePanel, { type PanelMode } from "./ClaudePanel";
import StudioPalette from "./StudioPalette";
import SourcesStage from "./SourcesStage";
import PlanStage from "./PlanStage";
import FinishStage from "./FinishStage";
import { ActionDialog, ResultViewer, setPendingTarget, type DialogAction, type Live } from "./parts";
import { useManuscript } from "./useManuscript";
import { useSectionRun } from "./useSectionRun";
import { APPROACH_CARDS, type ApproachId } from "./approaches";
import { GRADIENT } from "./ui";
import VersionsSheet from "./VersionsSheet";
import { useApiCostNotice } from "./ApiCostNotice";

// Claude Studio's workspace (design spec): the frame, a top bar, the stage in
// the middle and the Claude panel. Every capability of the earlier project
// page lives here: uploads, whole-book runs and their live progress, results,
// the manuscript, the Book wizard's outline and finishing tools.

const pref = <T extends string>(key: string, fallback: T, allowed: readonly T[]): T => { try { const v = localStorage.getItem(key) as T | null; return v && allowed.includes(v) ? v : fallback; } catch { return fallback; } };
const keep = (key: string, v: string) => { try { localStorage.setItem(key, v); } catch { /* a per-browser preference */ } };
const PLACES: readonly Place[] = ["sources", "plan", "write", "finish", "books", "voice"];
const PANEL_MODES: readonly PanelMode[] = ["ask", "revise", "research", "notes"];
const VIEW_IDS = VIEWS.map((v) => v.id);
const APPROACH_IDS = APPROACH_CARDS.map((a) => a.id);

export interface WorkspaceProps {
  id: string | null; backend: StudioBackend; decision: EngineDecision; mode: EngineMode; onMode: (m: EngineMode) => void; onCheckEngine: () => Promise<void>;
  busy: boolean; busyElsewhere: boolean; ready: boolean; coverWriter?: CoverCopyWriter; citationStyles: string[];
  threads: StudioThreadSummary[] | null; onProject: (id: string) => void; onNewProject: () => Promise<void>;
  handoff: { view?: "assistant" | "manuscript"; run?: { action: StudioAction; options: RunOptions } } | null; onHandoffUsed: () => void;
  onChanged: () => void; onDeleted: () => void;
  onWorkInStudio: (title: string, markdown: string) => Promise<void>; onLearnVoice: (books: { title: string; markdown: string }[]) => Promise<void>;
  notice?: React.ReactNode;
}

export default function Workspace(p: WorkspaceProps) {
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [place, setPlaceState] = useState<Place>(() => pref("studio.place", "write", PLACES));
  const [view, setViewState] = useState<CanvasView>(() => pref("studio.view", "writing", VIEW_IDS));
  const [panelMode, setPanelModeState] = useState<PanelMode>(() => pref("studio.panelMode", "revise", PANEL_MODES));
  const [panelOpen, setPanelOpenState] = useState(() => pref("studio.panel", "open", ["open", "closed"] as const) === "open");
  const [collapsed, setCollapsedState] = useState(() => pref("studio.frame", "open", ["open", "rail"] as const) === "rail");
  const [approach, setApproachState] = useState<ApproachId>(() => pref(`studio.approach.${p.id}`, "mine-and-research", APPROACH_IDS));
  const [focus, setFocus] = useState(false);
  const [palette, setPalette] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const setPlace = (x: Place) => { setPlaceState(x); keep("studio.place", x); setDrawer(false); };
  const setView = (x: CanvasView) => { setViewState(x); keep("studio.view", x); };
  const setPanelMode = (x: PanelMode) => { setPanelModeState(x); keep("studio.panelMode", x); };
  const setPanelOpen = (x: boolean) => { setPanelOpenState(x); keep("studio.panel", x ? "open" : "closed"); };
  const setCollapsed = (x: boolean) => { setCollapsedState(x); keep("studio.frame", x ? "rail" : "open"); };
  const setApproach = (x: ApproachId) => { setApproachState(x); keep(`studio.approach.${p.id}`, x); };

  // Below 1280px the Claude panel slides over the page instead of sitting beside it (spec §3).
  useEffect(() => { const q = window.matchMedia("(max-width: 1279px)"); const f = () => setNarrow(q.matches); f(); q.addEventListener("change", f); return () => q.removeEventListener("change", f); }, []);

  if (!p.id || !p.ready) {
    return (
      <Shell p={p} place={place} setPlace={setPlace} collapsed={collapsed} setCollapsed={setCollapsed} drawer={drawer} setDrawer={setDrawer} m={undefined} sectionId={null} onSection={() => {}} pending={null} title="">
        {place === "books" || place === "voice" ? <Library place={place} p={p} onBooks={() => setPlace("books")} /> : <Welcome p={p} />}
      </Shell>
    );
  }
  return <Project key={`${p.backend.storage}:${p.id}`} p={p as WorkspaceProps & { id: string }} {...{ place, setPlace, view, setView, panelMode, setPanelMode, panelOpen, setPanelOpen, collapsed, setCollapsed, approach, setApproach, focus, setFocus, palette, setPalette, drawer, setDrawer, narrow, reduce: Boolean(reduce), toast }} />;
}

function Project({ p, place, setPlace, view, setView, panelMode, setPanelMode, panelOpen, setPanelOpen, collapsed, setCollapsed, approach, setApproach, focus, setFocus, palette, setPalette, drawer, setDrawer, narrow, reduce, toast }: {
  p: WorkspaceProps & { id: string }; place: Place; setPlace: (x: Place) => void; view: CanvasView; setView: (v: CanvasView) => void;
  panelMode: PanelMode; setPanelMode: (m: PanelMode) => void; panelOpen: boolean; setPanelOpen: (v: boolean) => void; collapsed: boolean; setCollapsed: (v: boolean) => void;
  approach: ApproachId; setApproach: (a: ApproachId) => void; focus: boolean; setFocus: (v: boolean) => void; palette: boolean; setPalette: (v: boolean) => void;
  drawer: boolean; setDrawer: (v: boolean) => void; narrow: boolean; reduce: boolean; toast: ReturnType<typeof useToast>["toast"];
}) {
  const { id, backend, decision } = p;
  const engineId = decision.active;
  const [thread, setThread] = useState<StudioThread | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogAction | null>(null);
  const [tool, setTool] = useState<{ initial?: ToolId } | null>(null);
  const [joining, setJoining] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [retry, setRetry] = useState<{ action: StudioAction; options: RunOptions; why: string } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const lastRun = useRef<{ action: StudioAction; options: RunOptions } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const rulesRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef("");
  const { m, update, patchSection, replace, persist, saving, latest, undo, redo, canUndo, canRedo, recovery, recover } = useManuscript(backend, id);
  const [versions, setVersions] = useState(false);
  const online = useOnline();
  const cost = useApiCostNotice(engineId);
  // Back online after a failed save: save again.
  useEffect(() => { if (online && saving === "error") void persist(); }, [online]); // eslint-disable-line react-hooks/exhaustive-deps
  const sr = useSectionRun({ backend, id, engine: engineId, persist, patchSection, latest, update, onChanged: () => { reload().catch(() => {}); p.onChanged(); } });
  const [sectionId, setSectionId] = useState<string | null>(null);
  useEffect(() => { if (m && (!sectionId || !m.sections.some((s) => s.id === sectionId))) setSectionId(m.sections.find((s) => s.kind === "chapter")?.id ?? m.sections[0]?.id ?? null); }, [m, sectionId]);
  const section = m?.sections.find((s) => s.id === sectionId) ?? null;
  const wizard = useMemo(() => readWizardDraft(id), [id]);

  // The Book wizard's engine (outline): the owner's Claude Code when it's in use, else the API.
  const bookEngine: BookEngine | null = useMemo(() => !engineId ? null : engineId === "claude-code" && backend === runnerBackend
    ? claudeBookEngine(id, (o) => { if (o.title && titleRef.current === "Untitled project") backend.rename(id, o.title).then((t) => { setThread(t); p.onChanged(); }).catch(() => {}); })
    : { ...apiBookEngine, label: "Written by the API · billed per use", coverCopy: apiCoverCopyWriter }, [id, engineId, backend, p]);

  const reload = useCallback(async () => { const r = await backend.thread(id); setThread(r.thread); titleRef.current = r.thread.title; return r; }, [id, backend]);

  // A whole-book run (summary, rewrite, tools, chat): followed live, its main result opened when it ends.
  const follow = useCallback((job: StudioJob) => {
    abort.current?.abort();
    const ctl = new AbortController(); abort.current = ctl;
    setLive({ job, steps: [], text: [] });
    backend.follow(job, (e: StudioEvent) => {
      if (e.type === "done") {
        setLive(null);
        reload().then(({ thread: t }) => {
          const outs = e.outputs ?? [];
          const pick = (e.output && outs.includes(e.output) ? e.output : null) ?? ["rewrite.md", "cited.md", "summary.md", "series-plan.md"].find((x) => outs.includes(x)) ?? outs.find((x) => !x.includes("/") && !x.endsWith(".json")) ?? outs[0];
          if (pick && t.outputs.some((o) => o.path === pick)) setViewing(pick);
        }).catch(() => {});
        p.onChanged();
        if (e.status === "failed") {
          const plan = e.errorKind === "auth" || e.errorKind === "limit";
          if (plan && lastRun.current && p.mode !== "claude") setRetry({ ...lastRun.current, why: e.errorKind === "auth" ? "Claude Code is signed out." : "Your Claude plan's limit is reached." });
          else toast({ title: "Claude couldn't finish", description: e.error ?? "", variant: "destructive" });
        }
        return;
      }
      setLive((l) => (!l ? l : e.type === "text" ? { ...l, text: [...l.text, e.text] } : { ...l, steps: [...l.steps, { line: e.line, kind: e.type, at: e.at }].slice(-200) }));
    }, ctl.signal).catch((err) => { if (!ctl.signal.aborted) toast({ title: "Lost the live view", description: err instanceof Error ? err.message : "", variant: "destructive" }); });
  }, [backend, reload, toast, p]);

  useEffect(() => {
    reload().then(({ job }) => { if (job?.status === "running") follow(job); }).catch((e) => toast({ title: "Could not open the project", description: e instanceof Error ? e.message : "", variant: "destructive" }));
    return () => abort.current?.abort();
  }, [reload, follow, toast]);

  const start = useCallback(async (action: StudioAction, options: RunOptions, force?: "api") => {
    const use = force ?? engineId;
    if (!use) { toast({ title: "No engine available", description: decision.reason, variant: "destructive" }); return; }
    if (!navigator.onLine) { toast({ title: "You're offline", description: "Claude can run again when the connection returns.", variant: "destructive" }); return; }
    const bookWords = latest.current ? latest.current.sections.reduce((n, s) => n + words(s.body), 0) : undefined;
    if (!(await cost.confirm({ what: action === "chat" ? "Your message to Claude" : action === "tool" ? "This tool" : "This whole-book run", words: bookWords || undefined }, use))) return;
    try {
      setRetry(null); lastRun.current = { action, options };
      const job = await backend.run(id, action, options, use);
      setDialog(null); setTool(null);
      await reload(); follow(job);
    } catch (e) { toast({ title: e instanceof StudioError && e.status === 409 ? "Claude is busy" : "Could not start", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  }, [engineId, backend, id, reload, follow, toast, decision.reason, cost, latest]);

  // Section runs ask about API billing first, like every other run.
  const runSection = async (o: Parameters<typeof sr.run>[0]) => {
    if (!online) { toast({ title: "You're offline", description: "Claude can run again when the connection returns. Your text is safe.", variant: "destructive" }); return; }
    const sec = latest.current?.sections.find((x) => x.id === o.sectionId);
    if (await cost.confirm({ what: `Claude working on “${sec?.title || "this section"}”`, words: sec ? words(sec.body) || undefined : undefined })) void sr.run(o);
  };
  const runSections = async (list: Parameters<typeof sr.runAll>[0]) => {
    if (!online) { toast({ title: "You're offline", description: "Claude can run again when the connection returns.", variant: "destructive" }); return; }
    const all = latest.current?.sections.filter((x) => list.some((o) => o.sectionId === x.id)) ?? [];
    if (await cost.confirm({ what: `Claude writing ${list.length} ${list.length === 1 ? "section" : "sections"}`, words: all.reduce((n, x) => n + words(x.body), 0) || undefined })) void sr.runAll(list);
  };

  // A run handed over from My books (e.g. Learn my voice) starts once, when the project opens.
  const handed = useRef(false);
  useEffect(() => {
    if (!thread || !p.handoff || handed.current) return;
    handed.current = true; p.onHandoffUsed();
    if (p.handoff.view === "manuscript") setPlace("write");
    if (p.handoff.run) void start(p.handoff.run.action, p.handoff.run.options);
  }, [thread, p, start, setPlace]);

  const upload = async (files: FileList | File[]) => {
    for (const f of Array.from(files)) {
      setUploading(f.name);
      try {
        const t = await backend.upload(id, f);
        setThread(t);
        if (t.title === "Untitled project") { const nt = await backend.rename(id, f.name.replace(/\.[^.]+$/, "")); setThread(nt); titleRef.current = nt.title; }
        p.onChanged();
      } catch (e) { toast({ title: `Could not upload ${f.name}`, description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    }
    setUploading(null);
  };
  const removeFile = async (storedAs: string) => {
    let t = await backend.removeFile(id, storedAs);
    const txt = storedAs.replace(/\.[^.]+$/, "") + ".txt";
    if (txt !== storedAs && t.files.some((x) => x.storedAs === txt)) t = await backend.removeFile(id, txt);
    setThread(t); p.onChanged();
  };

  const startBook = async (from: "uploads" | "blank" | "wizard") => {
    let next: Manuscript;
    if (from === "wizard" && wizard) next = wizardDraftToManuscript(wizard);
    else if (from === "uploads" && thread) {
      const texts: string[] = [];
      for (const f of thread.files.filter((x) => x.kind === "original")) {
        const copy = thread.files.find((x) => x.kind === "text" && x.storedAs === f.storedAs.replace(/\.[^.]+$/, "") + ".txt");
        const t = copy ? await backend.source(id, copy.storedAs) : /\.(txt|md|markdown)$/i.test(f.storedAs) ? await backend.source(id, f.storedAs) : null;
        if (t?.trim()) texts.push(t);
      }
      if (!texts.length) { toast({ title: "No readable text in the manuscripts", description: "Scanned files need Claude Code: use “Read scanned pages” first.", variant: "destructive" }); return; }
      next = importText(thread.title, texts.join("\n\n"));
    } else next = insertSection({ title: thread?.title === "Untitled project" ? "" : thread?.title ?? "", sections: [], history: [] }, "chapter", "Chapter 1").manuscript;
    await replace(next);
    setSectionId(next.sections.find((s) => s.kind === "chapter")?.id ?? next.sections[0]?.id ?? null);
    setPlace(from === "blank" ? "write" : "plan");
  };

  const openSection = (sid: string) => { if (!sid) return; setSectionId(sid); setPlace("write"); };
  const toggleTheme = () => { const order: Theme[] = ["light", "dark", "system"]; setTheme(order[(order.indexOf(getStoredTheme()) + 1) % 3]); };

  // Keyboard: ⌘. focus, ⌘\ Claude panel, Esc leaves focus (spec §6). ⌘K is handled by the palette.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = Boolean(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
      // ⌘Z / ⌘⇧Z undo and redo book changes; inside a text field the field's own undo applies.
      if ((e.metaKey || e.ctrlKey) && !typing && (e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) { e.preventDefault(); if (e.shiftKey || e.key.toLowerCase() === "y") redo(); else undo(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === ".") { e.preventDefault(); setFocus(!focus); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "\\") { e.preventDefault(); setPanelOpen(!panelOpen); }
      else if (e.key === "Escape" && focus) setFocus(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [focus, panelOpen, setFocus, setPanelOpen, undo, redo]);

  if (!thread || m === undefined) {
    return <Shell p={p} place={place} setPlace={setPlace} collapsed={collapsed} setCollapsed={setCollapsed} drawer={drawer} setDrawer={setDrawer} m={undefined} sectionId={null} onSection={() => {}} pending={null} title={thread?.title ?? ""}>
      <div className="mx-auto mt-16 w-full max-w-[720px] space-y-4" aria-busy="true" aria-label="Opening the project">
        <div className="h-9 w-2/3 animate-pulse rounded bg-[#E6E8ED] motion-reduce:animate-none dark:bg-white/10" />
        {[100, 96, 92, 98, 70].map((w, i) => <div key={i} className="h-4 animate-pulse rounded bg-[#EEF0F3] motion-reduce:animate-none dark:bg-white/5" style={{ width: `${w}%` }} />)}
      </div>
    </Shell>;
  }

  const proposal = section ? sr.proposals[section.id] ?? null : null;
  const pendingIds = Object.keys(sr.proposals);
  const hasUploads = thread.files.some((f) => f.kind === "original");
  const state = !section || place !== "write" ? null : proposal ? (view === "original" ? "Viewing the earlier version" : "Reviewing a suggestion") : view === "original" && section.original ? "Viewing the earlier version" : "Editing";
  // On narrow screens the panel is a sheet the owner opens; it never covers the page by itself.
  const showPanel = place === "write" && !focus && view !== "mine" && (narrow ? sheet : panelOpen);
  const busy = Boolean(live) || Boolean(sr.running);

  const panel = section && m ? (
    <ClaudePanel mode={panelMode} onMode={setPanelMode} onClose={() => (narrow ? setSheet(false) : setPanelOpen(false))}
      thread={thread} live={live} onStopLive={() => { if (live) void backend.cancel(live.job); }} onChat={(message) => start("chat", { message })} chatBusy={busy || !engineId}
      onOpenResult={setViewing} onAction={setDialog} onTool={(t) => setTool({ initial: t })} onJoin={() => setJoining(true)}
      m={m} section={section} hasUploads={hasUploads} engine={engineId} citationStyles={p.citationStyles}
      run={(o) => { void runSection(o); }} running={sr.running} onCancel={sr.cancel} proposal={proposal} onReview={() => setView("changes")}
      patchSection={patchSection} onEditRules={() => { setPlace("sources"); setTimeout(() => rulesRef.current?.focus(), 250); }} approach={approach} onApproach={setApproach} />
  ) : null;

  const stage = (() => {
    if (place === "books" || place === "voice") return <Library place={place} p={p} onBooks={() => setPlace("books")} />;
    if (place === "sources" || m === null) {
      return <SourcesStage thread={thread} m={m} uploading={uploading} onUpload={upload} onRemove={removeFile} onTool={(t) => setTool({ initial: t })} onAction={setDialog} onJoin={() => setJoining(true)}
        onStart={startBook} wizardChapters={wizard?.chapters?.length ?? 0} onUpdate={update} onVoice={() => setPlace("voice")} busy={busy} rulesRef={rulesRef} />;
    }
    if (place === "plan") {
      return <>
        {wizard && !m.sections.some((s) => s.body.trim()) && <WizardBanner count={wizard.chapters?.length ?? 0} onBring={() => update(wizardDraftToManuscript(wizard, m))} />}
        <PlanStage m={m} onUpdate={update} onOpen={openSection} engine={bookEngine} approach={approach} hasUploads={hasUploads} busy={busy}
          onWriteAll={(ids) => void runSections(ids.map((sid) => ({ sectionId: sid, op: "compose" as const, approach, title: m.sections.find((s) => s.id === sid)?.title })))}
          queue={sr.queue} onSeries={() => setTool({ initial: "series" })} />
      </>;
    }
    if (place === "finish") return <FinishStage m={m} onUpdate={update} onOpen={openSection} coverWriter={p.coverWriter} />;
    if (!section) return <EmptyWrite onAdd={() => { const r = insertSection(m, "chapter"); update(r.manuscript); setSectionId(r.id); }} onPlan={() => setPlace("plan")} />;
    return <Canvas m={m} section={section} view={view} proposal={proposal} running={Boolean(sr.running)} onView={setView} bookTrim={String(m.meta?.trimSize ?? "")}
      onBody={(t) => patchSection(section.id, { body: t })} onTitle={(t) => patchSection(section.id, { title: t })}
      onAccept={(t) => { sr.decide(section.id, "replace", t); setView("writing"); toast({ title: "Accepted", description: "Your previous text is kept in Version history." }); }}
      onDiscard={() => { sr.decide(section.id, "discard"); setView("writing"); }}
      onRedo={() => { const op = proposal?.op ?? "rewrite"; void runSection({ sectionId: section.id, op, title: section.title, approach: proposal?.approach }); }}
      onRestoreOriginal={() => { if (window.confirm("Put back the text from before Claude's rewrite? The current text becomes the earlier version.")) patchSection(section.id, { body: section.original!, original: section.body }); }} />;
  })();

  const top = (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#E6E8ED] bg-white/90 px-4 backdrop-blur dark:border-white/10 dark:bg-[#11151C]/90">
      <button type="button" onClick={() => setDrawer(true)} aria-label="Open the sidebar" className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted lg:hidden"><Menu className="h-5 w-5" /></button>
      {/* Which chapter, and whether the owner is editing, reviewing or viewing an earlier version (spec §5.1): the state never truncates. */}
      <div className="flex min-w-0 flex-1 items-center gap-2 text-[13px]">
        <p className="min-w-0 truncate text-[#64748B]" title={place === "write" && section ? section.title : undefined}>
          {place === "write" && section
            ? <span className="font-medium text-[#172033] dark:text-white">{section.title || kindDef(section.kind).label}</span>
            : STAGES.find((s) => s.id === place)?.label ?? (place === "books" ? "My books" : "My voice")}
        </p>
        {state && <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] ${proposal ? "bg-[#EFF6FF] text-[#1D4ED8] dark:bg-[#172554] dark:text-[#93C5FD]" : "bg-[#F1F5F9] text-[#475569] dark:bg-white/10 dark:text-[#CBD5E1]"}`}>{state}</span>}
      </div>
      {place === "write" && section && (
        <div role="tablist" aria-label="Page view" className="hidden items-center gap-0.5 rounded-[9px] bg-[#F1F5F9] p-[3px] md:flex dark:bg-white/5">
          {VIEWS.filter((v) => !v.needsProposal || proposal).map((v) => (
            <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}
              className={`h-[30px] rounded-[7px] px-2.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${view === v.id ? "bg-white font-semibold text-[#172033] shadow-[0_1px_2px_rgba(15,23,42,.1)] dark:bg-[#1F2430] dark:text-white" : "font-medium text-[#475569] hover:text-[#172033] dark:text-[#94A3B8] dark:hover:text-white"}`}>{v.label}</button>
          ))}
        </div>
      )}
      {m && (
        <div className="hidden items-center sm:flex">
          <button type="button" onClick={undo} disabled={!canUndo} aria-label="Undo (⌘Z)" title="Undo (⌘Z)" className="grid h-9 w-8 place-items-center rounded-md text-[#475569] hover:bg-muted disabled:opacity-35 dark:text-[#CBD5E1]"><Undo2 className="h-4 w-4" /></button>
          <button type="button" onClick={redo} disabled={!canRedo} aria-label="Redo (⌘⇧Z)" title="Redo (⌘⇧Z)" className="grid h-9 w-8 place-items-center rounded-md text-[#475569] hover:bg-muted disabled:opacity-35 dark:text-[#CBD5E1]"><Redo2 className="h-4 w-4" /></button>
          {place === "write" && section && <button type="button" onClick={() => setVersions(true)} aria-label="Version history" title="Version history" className="grid h-9 w-8 place-items-center rounded-md text-[#475569] hover:bg-muted dark:text-[#CBD5E1]"><History className="h-4 w-4" /></button>}
        </div>
      )}
      <span aria-live="polite" className="hidden min-w-[72px] text-right text-[12px] text-[#64748B] sm:block">
        {saving === "error" ? <button type="button" onClick={() => void persist()} className="inline-flex items-center gap-1 font-medium text-[#B91C1C] hover:underline dark:text-[#FCA5A5]"><CloudOff className="h-3.5 w-3.5" /> Not saved · Retry</button>
          : saving === "saving" ? "Saving…" : saving === "saved" ? <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> Saved</span> : ""}
      </span>
      {live && <button type="button" onClick={() => { setPlace("write"); setPanelOpen(true); setPanelMode("ask"); }} className="hidden items-center gap-1.5 rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[12px] font-medium text-[#1D4ED8] sm:flex dark:bg-[#172554] dark:text-[#93C5FD]"><Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" /> {live.job.label}</button>}
      <button type="button" onClick={() => setPalette(true)} className="flex h-9 items-center gap-2 rounded-[8px] border border-[#E6E8ED] bg-white px-2.5 text-[13px] text-[#64748B] hover:border-[#CBD5E1] dark:border-white/10 dark:bg-white/5">
        <Search className="h-4 w-4" /><span className="hidden lg:inline">Tools and chapters</span><kbd className="rounded border border-[#E6E8ED] bg-[#F8FAFC] px-1.5 text-[11px] text-[#475569] dark:border-white/10 dark:bg-white/5">⌘K</kbd>
      </button>
      {place === "write" && <button type="button" onClick={() => setFocus(true)} aria-label="Focus mode (⌘.)" title="Focus mode (⌘.)" className="grid h-9 w-9 place-items-center rounded-md text-[#475569] hover:bg-muted dark:text-[#CBD5E1]"><Focus className="h-4 w-4" /></button>}
      <button type="button" onClick={toggleTheme} aria-label="Light, dark or system theme" title="Theme" className="grid h-9 w-9 place-items-center rounded-md text-[#475569] hover:bg-muted dark:text-[#CBD5E1]"><Moon className="h-4 w-4" /></button>
      {place === "write" && (narrow || !panelOpen) && <Button size="sm" variant="outline" className="h-9" onClick={() => (narrow ? setSheet(true) : setPanelOpen(true))} aria-label="Open the Claude panel (⌘\\)"><PanelRightOpen className="h-4 w-4" /><span className="hidden sm:inline">Claude</span></Button>}
    </header>
  );

  return (
    <>
      {focus ? (
        <div className="fixed inset-0 z-[45] overflow-y-auto bg-[#F7F6F2] dark:bg-[#0D1016]">
          <button type="button" onClick={() => setFocus(false)} className="fixed right-5 top-4 z-10 inline-flex h-9 items-center gap-2 rounded-full border border-[#E6E8ED] bg-white/90 px-3.5 text-[12.5px] text-[#475569] shadow-sm backdrop-blur hover:text-[#172033] dark:border-white/10 dark:bg-[#11151C]/90 dark:text-[#CBD5E1]"><X className="h-3.5 w-3.5" /> Leave focus <kbd className="text-[11px]">Esc</kbd></button>
          <div className="px-6 py-20 sm:px-16">{stage}</div>
        </div>
      ) : (
        <Shell p={p} place={place} setPlace={setPlace} collapsed={collapsed} setCollapsed={setCollapsed} drawer={drawer} setDrawer={setDrawer}
          m={m} sectionId={sectionId} onSection={openSection} pending={pendingIds[0] ?? null} title={thread.title}
          onRename={() => setRenaming(thread.title)}
          onDelete={busy ? undefined : async () => { if (!window.confirm(`Delete “${thread.title}” with its documents and results? Anything saved to your Library stays.`)) return; try { await backend.remove(id); p.onDeleted(); } catch (e) { toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" }); } }}
          header={top} side={showPanel && !narrow ? panel : null} reduce={reduce}>
          {recovery && (
            <div role="alert" className="mx-auto mb-6 flex w-full max-w-[720px] flex-wrap items-center gap-3 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-[13.5px] text-[#1E3A8A] dark:border-[#1E3A8A] dark:bg-[#172554] dark:text-[#BFDBFE]">
              <LifeBuoy className="h-4 w-4" /><span className="flex-1">Changes from {new Date(recovery.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} were never saved to the server. They are kept on this device.</span>
              <Button size="sm" className="h-8" onClick={() => recover(true)}>Put them back</Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => recover(false)}>Discard</Button>
            </div>
          )}
          {!online && (
            <div role="status" className="mx-auto mb-6 flex w-full max-w-[720px] items-center gap-3 rounded-[10px] border border-[#E6E8ED] bg-white px-4 py-3 text-[13.5px] text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-[#CBD5E1]">
              <WifiOff className="h-4 w-4" /><span className="flex-1">You're offline. Keep writing: changes stay on this device and are saved when the connection returns. Claude can't run until then.</span>
            </div>
          )}
          {retry && (
            <div role="alert" className="mx-auto mb-6 flex w-full max-w-[720px] flex-wrap items-center gap-3 rounded-[10px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[13.5px]">
              <AlertTriangle className="h-4 w-4 text-amber-600" /><span className="flex-1">{retry.why} New runs use the API.{decision.fix && <span className="mt-1 block text-[12px] opacity-90">{decision.fix}</span>}</span>
              <Button size="sm" className={GRADIENT} onClick={() => void start(retry.action, retry.options, "api")}><Cpu className="h-4 w-4" /> Run it on the API</Button>
              <Button size="sm" variant="ghost" onClick={() => setRetry(null)}>Dismiss</Button>
            </div>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={place} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.16 }}>{stage}</motion.div>
          </AnimatePresence>
        </Shell>
      )}
      <Dialog open={renaming !== null} onOpenChange={(v) => { if (!v) setRenaming(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Rename the project</DialogTitle></DialogHeader>
          <form onSubmit={async (e) => { e.preventDefault(); const t = (renaming ?? "").trim(); if (t) { setThread(await backend.rename(id, t)); titleRef.current = t; p.onChanged(); } setRenaming(null); }} className="space-y-4">
            <Input value={renaming ?? ""} onChange={(e) => setRenaming(e.target.value)} aria-label="Project name" autoFocus />
            <DialogFooter><Button type="button" variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {narrow && <Sheet open={showPanel} onOpenChange={setSheet}><SheetContent side="right" className="w-[320px] p-0 sm:max-w-[320px]"><SheetTitle className="sr-only">Claude</SheetTitle>{panel}</SheetContent></Sheet>}

      {m && section && <VersionsSheet open={versions} onOpenChange={setVersions} m={m} section={section} onUpdate={update} />}
      <StudioPalette open={palette} onOpenChange={setPalette} m={m} thread={thread}
        onUndo={canUndo ? undo : undefined} onRedo={canRedo ? redo : undefined} onHistory={section ? () => { setPlace("write"); setVersions(true); } : undefined} onPlace={setPlace} onSection={openSection} onTool={(t) => setTool({ initial: t })} onAction={setDialog} onJoin={() => setJoining(true)}
        onResult={setViewing} onView={(v) => { setPlace("write"); setView(v); }} onFocus={() => { setPlace("write"); setFocus(true); }} onPanel={() => setPanelOpen(!panelOpen)} onTheme={toggleTheme} />
      {tool && <ToolsDialog thread={thread} engine={engineId} initial={tool.initial} onClose={() => setTool(null)} onRun={(o) => start("tool", o)} />}
      <JoinFiles open={joining} onClose={() => setJoining(false)} onAddToProject={(f) => upload([f])} />
      {dialog && <ActionDialog action={dialog} thread={thread} styles={p.citationStyles} onClose={() => setDialog(null)} onRun={(o) => start(dialog, o)} />}
      {viewing && <ResultViewer backend={backend} threadId={id} path={viewing} projectTitle={thread.title} onClose={() => { setViewing(null); p.onChanged(); }} onUseAsTarget={(x) => { setViewing(null); setPendingTarget(x); setDialog("rewrite"); }} />}
      {/* Last, so it sits above a tool or action dialog that started the run. */}
      {cost.dialog}
    </>
  );
}

/** Frame + header + stage + optional Claude panel, laid out for the screen size (spec §3). */
function Shell({ p, place, setPlace, collapsed, setCollapsed, drawer, setDrawer, m, sectionId, onSection, pending, title, header, side, reduce, onRename, onDelete, children }: {
  p: WorkspaceProps; place: Place; setPlace: (x: Place) => void; collapsed: boolean; setCollapsed: (v: boolean) => void; drawer: boolean; setDrawer: (v: boolean) => void;
  m: Manuscript | null | undefined; sectionId: string | null; onSection: (id: string) => void; pending: string | null; title: string;
  header?: React.ReactNode; side?: React.ReactNode; reduce?: boolean; onRename?: () => void; onDelete?: () => void; children: React.ReactNode;
}) {
  const frame = (rail: boolean) => (
    <Frame collapsed={rail} onCollapse={setCollapsed} place={place} onPlace={setPlace} threads={p.threads} activeId={p.id} onProject={(x) => { setDrawer(false); p.onProject(x); }}
      onNewProject={() => { setDrawer(false); void p.onNewProject(); }} ready={p.ready} title={title} m={m} sectionId={sectionId} onSection={(x) => { setDrawer(false); onSection(x); }} pending={pending}
      decision={p.decision} mode={p.mode} onMode={p.onMode} onCheckEngine={p.onCheckEngine} busy={p.busy} onRename={onRename} onDelete={onDelete} />
  );
  return (
    <div className="fixed inset-0 z-40 flex bg-[#F7F6F2] text-[#172033] dark:bg-[#0D1016] dark:text-[#E5E7EB]">
      <div className="hidden h-full shrink-0 lg:block">{frame(collapsed)}</div>
      <Sheet open={drawer} onOpenChange={setDrawer}><SheetContent side="left" className="w-[248px] border-0 p-0"><SheetTitle className="sr-only">Claude Studio</SheetTitle>{frame(false)}</SheetContent></Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        {header ?? <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#E6E8ED] px-4 dark:border-white/10"><button type="button" onClick={() => setDrawer(true)} aria-label="Open the sidebar" className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted lg:hidden"><Menu className="h-5 w-5" /></button><span className="text-[13px] text-[#64748B]">Claude Studio</span></header>}
        {p.notice}
        <div className="flex min-h-0 flex-1">
          <main id="studio-main" className="min-w-0 flex-1 overflow-y-auto px-5 pb-24 pt-10 sm:px-10 xl:px-16">{children}</main>
          <AnimatePresence initial={false}>
            {side && (
              <motion.div key="panel" initial={reduce ? false : { width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={reduce ? undefined : { width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="h-full shrink-0 overflow-hidden border-l border-[#E6E8ED] dark:border-white/10"><div className="h-full w-[320px]">{side}</div></motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function WizardBanner({ count, onBring }: { count: number; onBring: () => void }) {
  return (
    <div role="status" className="mx-auto mb-8 flex w-full max-w-[1080px] flex-wrap items-center gap-3 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-[13.5px] text-[#1E3A8A] dark:border-[#1E3A8A] dark:bg-[#172554] dark:text-[#BFDBFE]">
      <span className="flex-1">Your Book wizard draft for this project has {count} chapters. Bring them in, with the text already written, their plans and your knowledge rules.</span>
      <Button size="sm" variant="outline" className="h-8" onClick={onBring}>Bring them in</Button>
    </div>
  );
}

function EmptyWrite({ onAdd, onPlan }: { onAdd: () => void; onPlan: () => void }) {
  return (
    <div className="mx-auto mt-20 max-w-md text-center">
      <Sparkles className="mx-auto h-7 w-7 text-[#2563EB]" />
      <h2 className="mt-4 font-['Newsreader',Georgia,serif] text-[28px] font-medium">Nothing to write yet</h2>
      <p className="mt-2 text-[14px] text-[#64748B]">Add a first chapter, or plan the book's contents first.</p>
      <div className="mt-6 flex justify-center gap-2"><Button onClick={onAdd}><Plus className="h-4 w-4" /> Add a chapter</Button><Button variant="outline" onClick={onPlan}>Plan the book</Button></div>
    </div>
  );
}

function Welcome({ p }: { p: WorkspaceProps }) {
  return (
    <div className="mx-auto mt-[12vh] max-w-lg text-center">
      <h1 className="font-['Newsreader',Georgia,serif] text-[38px] font-medium leading-[1.15]">Claude Studio</h1>
      <p className="mt-3 text-[15px] text-[#64748B]">Turn your manuscripts into a finished book: ground it in your sources, plan it, write it chapter by chapter with Claude as your editor, then publish.</p>
      <ol className="mx-auto mt-8 max-w-sm space-y-2 text-left text-[14px]">
        {STAGES.map((s, i) => <li key={s.id} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#EFF6FF] text-[12px] font-semibold text-[#1D4ED8] dark:bg-[#172554] dark:text-[#93C5FD]">{i + 1}</span><span><strong className="font-medium">{s.label}</strong> · <span className="text-[#64748B]">{s.line}</span></span></li>)}
      </ol>
      <Button className={`mt-8 h-11 px-6 ${GRADIENT}`} disabled={!p.ready} onClick={() => void p.onNewProject()}><Plus className="h-4 w-4" /> Start a project</Button>
    </div>
  );
}

function Library({ place, p, onBooks }: { place: "books" | "voice"; p: WorkspaceProps; onBooks: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[1080px]">
      {place === "books"
        ? <MyBooks coverWriter={p.coverWriter} onWorkInStudio={p.onWorkInStudio} onLearnVoice={p.onLearnVoice} />
        : <VoicePanel backend={p.backend} onGoToBooks={onBooks} />}
      <p className="mt-10 text-center text-[12px] text-[#64748B]"><MessageSquare className="mr-1 inline h-3 w-3" />My books and My voice are shared by all your projects.</p>
    </div>
  );
}

/** Whether the browser has a connection (offline state, spec §7). */
function useOnline() {
  const [on, setOn] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setOn(true), down = () => setOn(false);
    window.addEventListener("online", up); window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return on;
}
