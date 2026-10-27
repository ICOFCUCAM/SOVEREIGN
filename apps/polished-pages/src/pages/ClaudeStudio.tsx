import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SpineMark from "@/components/brand/SpineMark";
import Workspace from "@/components/studio/workspace/Workspace";
import { CITATION_STYLES_FALLBACK, SetupHint } from "@/components/studio/workspace/parts";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/newsreader/400-italic.css";
import { importText } from "@/lib/manuscript";
import { getDocument, updateDocument } from "@/lib/documents";
import type { CoverCopyWriter } from "@/lib/cover-copy";
import { apiCoverCopyWriter, browserBackend, decideEngine, runnerBackend, type EngineMode, type StudioBackend } from "@/lib/studio-backend";
import { isAdmin } from "@/lib/documents";
import { RUNNER_URL, claudeCoverCopyWriter, studio, type RunOptions, type StudioAction, type StudioMe, type StudioThreadSummary } from "@/lib/claude-studio";

// Claude Studio — the owner's own Claude Code inside Polished Pages: a
// full-screen editorial workspace (docs/claude-studio/DESIGN-SPEC.md) where
// manuscripts become finished books. Admin only; the runner enforces the same
// rule on every request.

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

function Studio() {
  const { toast } = useToast();
  const [me, setMe] = useState<StudioMe | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [threads, setThreads] = useState<StudioThreadSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Handed to a project when it opens: a view to show, or a run to start once.
  const [handoff, setHandoff] = useState<{ id: string; view?: "assistant" | "manuscript"; run?: { action: StudioAction; options: RunOptions } } | null>(null);
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

  // Who writes cover copy: the owner's Claude Code (in this project, or a "Book covers" project for Library books), else the API.
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

  useEffect(() => { refreshMe(); const t = window.setInterval(refreshMe, 60_000); return () => window.clearInterval(t); }, [refreshMe]);
  useEffect(() => {
    if (!ready) return;
    setThreads(null);
    // ?project=<id> (from a Library book made here) opens that project.
    const wanted = new URLSearchParams(window.location.search).get("project");
    loadThreads().then((t) => setActiveId((id) => (wanted && t.some((x) => x.id === wanted) ? wanted : id && t.some((x) => x.id === id) ? id : t[0]?.id ?? null)));
  }, [ready, loadThreads]);

  /**
   * A Library book in the Studio, linked both ways: the project's manuscript knows its Library book (Finish
   * updates that book instead of adding another), and the Library book knows its project (its page links
   * back). A book that already has a project opens that project.
   */
  const workInStudio = useCallback(async (title: string, markdown: string, docId?: string) => {
    const doc = docId ? await getDocument(docId).catch(() => null) : null;
    const payload = (doc?.payload ?? {}) as Record<string, unknown>;
    const existing = typeof payload.studioProject === "string" ? payload.studioProject : null;
    const all = await loadThreads();
    if (existing && all.some((x) => x.id === existing)) { setActiveId(existing); try { localStorage.setItem("studio.place", "plan"); } catch { /* preference */ } return; }
    const t = await backend.create(title);
    await backend.upload(t.id, new File([markdown], `${title.replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "book"}.md`, { type: "text/markdown" }));
    await backend.saveManuscript(t.id, { ...importText(title, markdown), ...(docId ? { libraryId: docId } : {}) });
    if (docId && doc) await updateDocument(docId, { ...payload, studioProject: t.id }, typeof doc.preview === "string" ? doc.preview : undefined).catch(() => {});
    await loadThreads();
    setHandoff({ id: t.id, view: "manuscript" }); setActiveId(t.id);
    try { localStorage.setItem("studio.place", "write"); } catch { /* preference */ }
  }, [backend, loadThreads]);

  // ?import=<Library book id> (the Library's "Work on it in Claude Studio") brings that book in once.
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams(window.location.search);
    const id = q.get("import");
    if (!id) return;
    q.delete("import"); window.history.replaceState(null, "", `${window.location.pathname}${q.toString() ? `?${q}` : ""}`);
    getDocument(id).then((d) => {
      if (!d || d.kind !== "book") throw new Error("That Library book wasn't found.");
      const p = (d.payload ?? {}) as Record<string, unknown>;
      return workInStudio(String(p.title ?? d.title), String(p.markdown ?? ""), id);
    }).catch((e) => toast({ title: "Couldn't bring the book in", description: e instanceof Error ? e.message : "", variant: "destructive" }));
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const newProject = async () => {
    try { const t = await backend.create("Untitled project"); await loadThreads(); setActiveId(t.id); }
    catch (e) { toast({ title: "Could not create the project", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const notice = backend === browserBackend ? (
    <div role="status" className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-5 py-2 text-[13px] text-amber-800 dark:text-amber-300">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{RUNNER_URL ? "The Claude Code runner isn't answering, so" : "The Claude Code runner isn't set up yet, so"} projects are kept in this browser and every run uses the API (billed per use). {RUNNER_URL ? <button className="font-semibold underline underline-offset-2" onClick={refreshMe}>Check again</button> : <SetupHint />}</span>
    </div>
  ) : mode === "claude" && !decision.active ? (
    <div role="alert" className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-5 py-2 text-[13px] text-amber-800 dark:text-amber-300"><AlertTriangle className="h-4 w-4 shrink-0" /> {decision.reason} Choose Automatic or API only in the engine menu to keep working on the API.</div>
  ) : null;

  return (
    <Workspace id={activeId} backend={backend} decision={decision} mode={mode} onMode={setMode} busy={Boolean(me?.busy)} ready={ready}
      busyElsewhere={Boolean(me?.busy && me.busy.threadId !== activeId)} coverWriter={coverWriter(activeId ?? undefined)} citationStyles={me?.citationStyles ?? CITATION_STYLES_FALLBACK}
      threads={threads} onProject={setActiveId} onNewProject={newProject} notice={notice}
      handoff={handoff?.id === activeId ? handoff : null} onHandoffUsed={() => setHandoff(null)}
      onChanged={() => { loadThreads(); refreshMe(); }} onDeleted={async () => { const t = await loadThreads(); setActiveId(t[0]?.id ?? null); }}
      onCheckEngine={async () => {
        try {
          const r = await studio.checkClaude();
          toast(r.claude.state === "ok" ? { title: "Claude Code is signed in", description: "New runs use your Claude plan." } : { title: "Still not signed in", description: r.claude.message ?? "", variant: "destructive" });
        } catch (e) { toast({ title: "Couldn't check", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
        refreshMe();
      }}
      onWorkInStudio={workInStudio}
      onLearnVoice={async (books) => {
        if (!decision.active) throw new Error(decision.reason);
        const t = await backend.create("My voice samples");
        for (const b of books) await backend.upload(t.id, new File([b.markdown], `${b.title.replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "book"}.md`, { type: "text/markdown" }));
        await loadThreads();
        setHandoff({ id: t.id, run: { action: "tool", options: { tool: "voice-profile" } } }); setActiveId(t.id);
      }}
    />
  );
}

export default ClaudeStudio;
