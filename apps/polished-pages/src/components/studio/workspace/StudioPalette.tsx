import { useEffect } from "react";
import { BookOpen, Eye, FileText, Focus, History, Layers, ListTree, Moon, PanelRight, PenLine, Quote, Redo2, ScrollText, Undo2, Wand2, Wrench } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { STUDIO_TOOLS, type ToolId } from "@/lib/studio-tools";
import { kindDef, type Manuscript } from "@/lib/manuscript";
import { outputLabel, type StudioThread } from "@/lib/claude-studio";
import { STAGES, type Place } from "./Frame";
import type { CanvasView } from "./Canvas";
import { VIEWS } from "./Canvas";
import type { DialogAction } from "./parts";

// ⌘K (design spec §6): search tools, chapters, results and actions from anywhere in the Studio.
export default function StudioPalette({ open, onOpenChange, m, thread, onPlace, onSection, onTool, onAction, onJoin, onResult, onView, onFocus, onPanel, onTheme, onUndo, onRedo, onHistory }: {
  open: boolean; onOpenChange: (v: boolean) => void; m: Manuscript | null | undefined; thread: StudioThread | null;
  onPlace: (p: Place) => void; onSection: (id: string) => void; onTool: (t: ToolId) => void; onAction: (a: DialogAction) => void; onJoin: () => void;
  onResult: (path: string) => void; onView: (v: CanvasView) => void; onFocus: () => void; onPanel: () => void; onTheme: () => void;
  /** Present only when there is something to undo or redo, or a section whose history to open. */
  onUndo?: () => void; onRedo?: () => void; onHistory?: () => void;
}) {
  // ⌘K / Ctrl+K opens it; the site's own palette is not mounted inside the Studio.
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onOpenChange(!open); } };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);
  const run = (f: () => void) => () => { onOpenChange(false); f(); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Claude Studio: tools, chapters and results">
      <CommandInput placeholder="Search tools, chapters and results…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>Nothing matches.</CommandEmpty>
        <CommandGroup heading="Go to">
          {STAGES.map((s) => <CommandItem key={s.id} onSelect={run(() => onPlace(s.id))}><s.icon className="mr-2" />{s.label}<span className="ml-2 truncate text-xs opacity-70">{s.line}</span></CommandItem>)}
          <CommandItem onSelect={run(() => onPlace("books"))}><BookOpen className="mr-2" />My books</CommandItem>
          <CommandItem onSelect={run(() => onPlace("voice"))}><PenLine className="mr-2" />My voice</CommandItem>
        </CommandGroup>
        {m && m.sections.length > 0 && (
          <CommandGroup heading="Manuscript">
            {m.sections.map((s) => <CommandItem key={s.id} value={`section ${s.title} ${kindDef(s.kind).label}`} onSelect={run(() => onSection(s.id))}><ListTree className="mr-2" />{s.title || kindDef(s.kind).label}</CommandItem>)}
          </CommandGroup>
        )}
        <CommandSeparator />
        <CommandGroup heading="Whole-book tools">
          <CommandItem onSelect={run(() => onAction("summarize"))}><ScrollText className="mr-2" />Summarise</CommandItem>
          <CommandItem onSelect={run(() => onAction("rewrite"))}><Wand2 className="mr-2" />Rewrite the whole book</CommandItem>
          <CommandItem onSelect={run(() => onAction("cite"))}><Quote className="mr-2" />Citations and references</CommandItem>
          <CommandItem onSelect={run(onJoin)}><Layers className="mr-2" />Join files</CommandItem>
          {STUDIO_TOOLS.map((t) => <CommandItem key={t.id} value={`tool ${t.title} ${t.line}`} onSelect={run(() => onTool(t.id))}><Wrench className="mr-2" /><span className="shrink-0">{t.title}</span><span className="ml-2 truncate text-xs opacity-70">{t.line}</span></CommandItem>)}
        </CommandGroup>
        <CommandSeparator />
        {(onUndo || onRedo || onHistory) && (
          <CommandGroup heading="Edit">
            {onUndo && <CommandItem onSelect={run(onUndo)}><Undo2 className="mr-2" />Undo<CommandShortcut>⌘Z</CommandShortcut></CommandItem>}
            {onRedo && <CommandItem onSelect={run(onRedo)}><Redo2 className="mr-2" />Redo<CommandShortcut>⌘⇧Z</CommandShortcut></CommandItem>}
            {onHistory && <CommandItem onSelect={run(onHistory)}><History className="mr-2" />Version history of this section</CommandItem>}
          </CommandGroup>
        )}
        <CommandGroup heading="View">
          {VIEWS.map((v) => <CommandItem key={v.id} value={`view ${v.label}`} onSelect={run(() => onView(v.id))}><Eye className="mr-2" />{v.label}</CommandItem>)}
          <CommandItem onSelect={run(onFocus)}><Focus className="mr-2" />Focus mode<CommandShortcut>⌘.</CommandShortcut></CommandItem>
          <CommandItem onSelect={run(onPanel)}><PanelRight className="mr-2" />Show or hide the Claude panel<CommandShortcut>⌘\</CommandShortcut></CommandItem>
          <CommandItem onSelect={run(onTheme)}><Moon className="mr-2" />Light, dark or system theme</CommandItem>
        </CommandGroup>
        {thread && thread.outputs.length > 0 && (
          <CommandGroup heading="Results">
            {thread.outputs.slice(0, 60).map((o) => <CommandItem key={o.path} value={`result ${outputLabel(o.path)} ${o.path}`} onSelect={run(() => onResult(o.path))}><FileText className="mr-2" />{outputLabel(o.path)}</CommandItem>)}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
