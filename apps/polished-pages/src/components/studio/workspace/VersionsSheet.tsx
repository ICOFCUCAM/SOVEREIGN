import { useMemo, useState } from "react";
import { Bookmark, Clock, Eye, History, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import Markdown from "@/components/studio/Markdown";
import { words, type Manuscript, type Section, type SectionVersion } from "@/lib/manuscript";
import { VERSION_LABEL, addVersion, removeVersion, restoreVersion, versionsNewestFirst } from "@/lib/section-versions";
import { countChanges, diffText } from "@/lib/word-diff";
import { EYEBROW, SERIF } from "./ui";
import { OP_LABEL } from "./approaches";
import type { SectionOp } from "./useSectionRun";

const when = (iso: string) => {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60 && d.toDateString() === new Date().toDateString()) return `today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

// Version history for the open section (design spec §6): named snapshots,
// autosaved revisions and the text before every accepted change. Restoring
// keeps the current text as a version first, so newer work is never lost.
// Claude's own history for the section is listed separately.
export default function VersionsSheet({ open, onOpenChange, m, section, onUpdate }: {
  open: boolean; onOpenChange: (v: boolean) => void; m: Manuscript; section: Section; onUpdate: (m: Manuscript) => void;
}) {
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<SectionVersion | null>(null);
  const list = useMemo(() => versionsNewestFirst(section), [section]);
  // How far each version is from the text now (worked out only while the sheet is open).
  const changesSince = useMemo(() => new Map(open ? list.map((v) => [v.id, countChanges(diffText(v.body, section.body))]) : []), [open, list, section.body]);
  const ai = useMemo(() => m.history.filter((h) => h.sectionId === section.id).slice(-30).reverse(), [m.history, section.id]);
  const put = (s: Section) => onUpdate({ ...m, sections: m.sections.map((x) => (x.id === s.id ? s : x)) });

  const snapshot = () => { put(addVersion(section, "snapshot", name || `Snapshot ${new Date().toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`)); setName(""); };
  const restore = (v: SectionVersion) => { onUpdate(restoreVersion(m, section.id, v.id)); setPreview(null); };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setPreview(null); }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]">
        <div className="border-b border-[#E6E8ED] px-6 py-5 dark:border-white/10">
          <p className={EYEBROW}>Version history</p>
          <SheetTitle className={`${SERIF} mt-1 text-[22px] font-medium`}>{section.title || "This section"}</SheetTitle>
          <SheetDescription className="mt-1 text-[13px] text-[#64748B]">Restoring keeps the current text as a version first, so nothing newer is lost. Undo (⌘Z outside the text) also works.</SheetDescription>
          <form onSubmit={(e) => { e.preventDefault(); snapshot(); }} className="mt-4 flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this version (optional)" aria-label="Snapshot name" className="h-9" />
            <Button type="submit" size="sm" className="h-9 shrink-0" disabled={!section.body.trim()}><Bookmark className="h-4 w-4" /> Save</Button>
          </form>
        </div>

        {preview ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-[#E6E8ED] px-6 py-3 text-[13px] dark:border-white/10">
              <button type="button" onClick={() => setPreview(null)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted" aria-label="Back to the list"><X className="h-4 w-4" /></button>
              <span className="min-w-0 flex-1 truncate"><strong className="font-medium">{preview.label || VERSION_LABEL[preview.kind]}</strong> · {when(preview.at)}</span>
              <Button size="sm" className="h-8" onClick={() => restore(preview)}><RotateCcw className="h-4 w-4" /> Restore</Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 font-['Newsreader',Georgia,serif] text-[16px] leading-[1.7]">
              {preview.title !== section.title && <p className="mb-4 font-sans text-[12px] text-[#64748B]">Title then: {preview.title}</p>}
              <Markdown text={preview.body || "(empty)"} />
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {list.length === 0 ? (
              <div className="py-10 text-center">
                <History className="mx-auto h-6 w-6 text-[#94A3B8]" />
                <p className="mt-3 text-[14px] font-medium">No earlier versions yet</p>
                <p className="mx-auto mt-1 max-w-[260px] text-[13px] text-[#64748B]">Save a snapshot above. The Studio also keeps one while you write, and before every change of Claude's you accept.</p>
              </div>
            ) : (
              <ol className="space-y-2" aria-label="Earlier versions, newest first">
                {list.map((v) => {
                  const changes = changesSince.get(v.id) ?? 0;
                  return (
                    <li key={v.id} className="group rounded-[10px] border border-[#E6E8ED] bg-white px-4 py-3 transition-colors hover:border-[#CBD5E1] dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-start gap-3">
                        {v.kind === "snapshot" ? <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" /> : v.kind === "before-accept" ? <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#7C3AED]" /> : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#94A3B8]" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium">{v.kind === "snapshot" ? v.label : `${VERSION_LABEL[v.kind]}${v.label ? ` · ${v.label}` : ""}`}</p>
                          <p className="text-[12px] text-[#64748B]">{when(v.at)} · {words(v.body).toLocaleString()} words · {changes ? `${changes} ${changes === 1 ? "change" : "changes"} since` : "same as now"}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1 pl-7">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px]" onClick={() => setPreview(v)}><Eye className="h-3.5 w-3.5" /> Read</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px]" disabled={!changes && v.title === section.title} onClick={() => restore(v)}><RotateCcw className="h-3.5 w-3.5" /> Restore</Button>
                        {v.kind === "snapshot" && <Button size="sm" variant="ghost" className="ml-auto h-7 px-2 text-[12px] text-[#64748B]" aria-label={`Delete ${v.label}`} onClick={() => put(removeVersion(section, v.id))}><Trash2 className="h-3.5 w-3.5" /></Button>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {ai.length > 0 && (
              <section aria-labelledby="ai-h" className="mt-8">
                <h3 id="ai-h" className={`${EYEBROW} mb-2 font-sans`}>Claude's history for this section</h3>
                <ul className="space-y-1 text-[12.5px] text-[#475569] dark:text-[#94A3B8]">
                  {ai.map((h, i) => <li key={i} className="flex gap-2"><span className="w-28 shrink-0 text-[#64748B]">{when(h.at)}</span><span className="flex-1">{OP_LABEL[h.op as SectionOp] ?? h.op} · {h.engine === "api" ? "API" : "Claude Code"}</span><span className={h.accepted ? "text-emerald-700 dark:text-emerald-400" : ""}>{h.accepted ? "accepted" : "not used"}</span></li>)}
                </ul>
              </section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
