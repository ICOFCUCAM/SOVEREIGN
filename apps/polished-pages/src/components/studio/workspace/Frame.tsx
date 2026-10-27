import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AudioLines, BookMarked, Check, Pencil, Trash2, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Cpu, FolderOpen, Library, ListTree, Loader2, PenLine, Plus, Rocket, Sparkles,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { kindDef, words, type Manuscript } from "@/lib/manuscript";
import type { StudioThreadSummary } from "@/lib/claude-studio";
import type { EngineDecision, EngineMode } from "@/lib/studio-backend";

// The frame around the work (design spec §3): project, the four stages, the
// manuscript tree, My books and My voice, and the engine. 248px, or a 64px
// rail of icons when collapsed. One active-state treatment throughout.

export type Stage = "sources" | "plan" | "write" | "finish";
export type Place = Stage | "books" | "voice";
export const STAGES: { id: Stage; label: string; icon: typeof ListTree; line: string }[] = [
  { id: "sources", label: "Sources", icon: FolderOpen, line: "Manuscripts, rules and voice" },
  { id: "plan", label: "Plan", icon: ListTree, line: "Contents and notes" },
  { id: "write", label: "Write", icon: PenLine, line: "Chapter by chapter" },
  { id: "finish", label: "Finish", icon: Rocket, line: "Cover, export, publish" },
];
const MODE_LABEL: Record<EngineMode, string> = { auto: "Automatic", claude: "Claude Code only", api: "API only" };

export default function Frame({
  collapsed, onCollapse, place, onPlace, threads, activeId, onProject, onNewProject, ready, title,
  m, sectionId, onSection, pending, decision, mode, onMode, onCheckEngine, busy, onRename, onDelete,
}: {
  collapsed: boolean; onCollapse: (v: boolean) => void;
  place: Place; onPlace: (p: Place) => void;
  threads: StudioThreadSummary[] | null; activeId: string | null; onProject: (id: string) => void; onNewProject: () => void; ready: boolean; title: string;
  m: Manuscript | null | undefined; sectionId: string | null; onSection: (id: string) => void; pending: string | null;
  decision: EngineDecision; mode: EngineMode; onMode: (m: EngineMode) => void; onCheckEngine: () => Promise<void>; busy: boolean;
  /** Rename or delete the open project (absent when no project is open). */
  onRename?: () => void; onDelete?: () => void;
}) {
  const [tree, setTree] = useState(true);
  const [checking, setChecking] = useState(false);
  const item = (on: boolean) => `group flex w-full items-center gap-3 rounded-lg text-left text-[13.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${collapsed ? "h-10 justify-center" : "h-9 px-2.5"} ${on ? "bg-white/[0.09] font-semibold text-white" : "font-medium text-[#CBD5E1] hover:bg-white/[0.05] hover:text-white"}`;
  const engineName = decision.active === "claude-code" ? "Claude Code" : decision.active === "api" ? "API" : "No engine";
  const groups = m ? (["front", "body", "back"] as const).map((g) => ({ g, list: m.sections.filter((s) => kindDef(s.kind).group === g) })).filter((x) => x.list.length) : [];

  return (
    <nav aria-label="Claude Studio" className={`flex h-full flex-col bg-[#172033] text-[#E5E7EB] transition-[width] duration-200 motion-reduce:transition-none ${collapsed ? "w-16 px-2" : "w-[248px] px-3"} py-3`}>
      {/* Studio + collapse */}
      <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-2 px-1"} pb-3`}>
        <Link to="/dashboard" aria-label="Polished Pages dashboard" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#7C3AED]"><Sparkles className="h-3.5 w-3.5 text-white" /></Link>
        {!collapsed && <span className="flex-1 truncate text-[14px] font-semibold tracking-[-0.01em]">Claude Studio</span>}
        <button type="button" onClick={() => onCollapse(!collapsed)} aria-label={collapsed ? "Expand the sidebar" : "Collapse the sidebar"}
          className="grid h-8 w-8 place-items-center rounded-lg text-[#94A3B8] hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD]">
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* 1 · Project */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" disabled={!ready} aria-label={`Project: ${title || "none"}. Switch project`}
            className={`flex w-full items-center gap-3 rounded-[10px] border border-white/[0.08] bg-white/[0.04] text-left transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] disabled:opacity-50 ${collapsed ? "justify-center p-2" : "p-2.5"}`}>
            <span aria-hidden className="grid h-10 w-[30px] shrink-0 place-items-center rounded-[3px_5px_5px_3px] bg-gradient-to-br from-[#1E293B] via-[#312E81] to-[#4C1D95] font-['Newsreader',Georgia,serif] text-[11px] text-[#E0E7FF] shadow-[inset_3px_0_0_rgba(0,0,0,.35)]">{(title || "?").slice(0, 1).toUpperCase()}</span>
            {!collapsed && <>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-['Newsreader',Georgia,serif] text-[16px] leading-tight">{title || "No project"}</span>
                <span className="mt-0.5 block text-[12px] text-[#94A3B8]">{m ? `${m.sections.filter((s) => s.kind === "chapter").length} chapters · ${m.sections.reduce((n, s) => n + words(s.body), 0).toLocaleString()} words` : "Switch or start a project"}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8]" />
            </>}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[60vh] w-64 overflow-y-auto">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Projects</DropdownMenuLabel>
          {threads?.length === 0 && <div className="px-2 py-1.5 text-sm text-muted-foreground">No projects yet</div>}
          {threads?.map((t) => (
            <DropdownMenuItem key={t.id} onClick={() => onProject(t.id)} className="flex items-start gap-2">
              <span className="mt-0.5 w-4">{t.id === activeId && <Check className="h-4 w-4" />}</span>
              <span className="min-w-0"><span className="block truncate">{t.title}</span><span className="block text-xs text-muted-foreground">{t.files} {t.files === 1 ? "document" : "documents"} · {t.outputs} {t.outputs === 1 ? "result" : "results"}</span></span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onNewProject}><Plus className="mr-2 h-4 w-4" /> New project</DropdownMenuItem>
          {onRename && <DropdownMenuItem onClick={onRename}><Pencil className="mr-2 h-4 w-4" /> Rename this project</DropdownMenuItem>}
          {onDelete && <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete this project</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 2 · Stages */}
      <div className="mt-4 space-y-0.5" role="list" aria-label="Book stages">
        {STAGES.map((s) => (
          <div role="listitem" key={s.id}>
            <button type="button" onClick={() => onPlace(s.id)} aria-current={place === s.id ? "page" : undefined} title={collapsed ? s.label : undefined} className={item(place === s.id)}>
              <s.icon className="h-[17px] w-[17px] shrink-0" aria-hidden />
              {!collapsed && <span className="flex-1">{s.label}</span>}
              <span className="sr-only">{s.line}</span>
            </button>
          </div>
        ))}
      </div>

      {/* 3 · Manuscript tree */}
      {!collapsed && m && m.sections.length > 0 && (
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
          <button type="button" onClick={() => setTree(!tree)} aria-expanded={tree}
            className="flex w-full items-center gap-1.5 px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD]">
            {tree ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} Manuscript
          </button>
          {tree && groups.map(({ g, list }) => (
            <ol key={g} aria-label={g === "front" ? "Front matter" : g === "back" ? "Back matter" : "Chapters"} className={`space-y-px ${g !== "front" ? "mt-2" : ""}`}>
              {list.map((s) => {
                const n = words(s.body);
                const state = pending === s.id ? "suggestion waiting" : n ? `${n.toLocaleString()} words` : "empty";
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => onSection(s.id)} aria-current={sectionId === s.id && place === "write" ? "true" : undefined}
                      className={`flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${sectionId === s.id && place === "write" ? "bg-white/[0.09] text-white" : "text-[#CBD5E1] hover:bg-white/[0.05]"}`}>
                      <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${pending === s.id ? "bg-[#93C5FD]" : n ? "bg-[#6EE7B7]" : "border border-[#64748B]"}`} />
                      <span className="min-w-0 flex-1 truncate">{s.title || kindDef(s.kind).label}</span>
                      <span className="sr-only">, {state}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ))}
        </div>
      )}
      {(collapsed || !m || !m.sections.length) && <div className="flex-1" />}

      {/* 4 · Library and voice */}
      <div className="mt-3 space-y-0.5 border-t border-white/[0.08] pt-3">
        <button type="button" onClick={() => onPlace("books")} aria-current={place === "books" ? "page" : undefined} title={collapsed ? "My books" : undefined} className={item(place === "books")}><Library className="h-[17px] w-[17px] shrink-0" aria-hidden />{!collapsed && "My books"}</button>
        <button type="button" onClick={() => onPlace("voice")} aria-current={place === "voice" ? "page" : undefined} title={collapsed ? "My voice" : undefined} className={item(place === "voice")}><AudioLines className="h-[17px] w-[17px] shrink-0" aria-hidden />{!collapsed && "My voice"}</button>
      </div>

      {/* 5 · Engine */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" data-testid="engine-badge" aria-label={`Engine: ${engineName}, ${MODE_LABEL[mode]}. Change`}
            className={`mt-2 flex w-full items-center gap-2.5 rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-left hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${collapsed ? "justify-center p-2.5" : "px-3 py-2.5"}`}>
            {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#93C5FD] motion-reduce:animate-none" aria-hidden /> : <Cpu className={`h-4 w-4 shrink-0 ${decision.tone === "ok" ? "text-[#6EE7B7]" : decision.tone === "warn" ? "text-[#FCD34D]" : "text-[#FCA5A5]"}`} aria-hidden />}
            {!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{engineName} · {MODE_LABEL[mode]}</span>{busy && <span className="block text-[11px] text-[#94A3B8]">Working…</span>}</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-80 p-2">
          <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">What writes your book</p>
          {(["auto", "claude", "api"] as EngineMode[]).map((k) => (
            <button key={k} type="button" onClick={() => onMode(k)} className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted ${mode === k ? "bg-muted" : ""}`}>
              <span className="mt-0.5 w-4">{mode === k && <Check className="h-4 w-4 text-primary" />}</span>
              <span><span className="block text-sm font-medium">{MODE_LABEL[k]}</span><span className="block text-xs text-muted-foreground">{k === "auto" ? "Claude Code first; the API only when it can't run" : k === "claude" ? "Your Claude plan, never billed per use" : "Billed per use"}</span></span>
            </button>
          ))}
          <div className="mt-1 border-t border-border px-2 pt-2 text-xs text-muted-foreground">
            <p>{decision.reason}</p>
            {decision.fix && <p className="mt-1 text-amber-700 dark:text-amber-400">{decision.fix}</p>}
            <button type="button" disabled={checking} onClick={async () => { setChecking(true); try { await onCheckEngine(); } finally { setChecking(false); } }}
              className="mt-2 inline-flex items-center gap-1.5 font-medium text-primary hover:underline disabled:opacity-60">
              {checking && <Loader2 className="h-3 w-3 animate-spin" />}<BookMarked className="h-3 w-3" /> Check Claude Code again
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </nav>
  );
}
