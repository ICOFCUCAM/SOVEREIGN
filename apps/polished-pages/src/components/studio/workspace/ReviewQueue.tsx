import { Check, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { kindDef, words, type Manuscript } from "@/lib/manuscript";
import { OP_LABEL } from "./approaches";
import type { Proposal } from "./useSectionRun";

// One review list for the whole book (DESIGN-SPEC.md §21): every suggestion Claude has waiting,
// section by section, to open and review change by change, accept as it is, or discard.
export default function ReviewQueue({ m, proposals, onOpen, onAccept, onDiscard, onClose }: {
  m: Manuscript; proposals: Record<string, Proposal>;
  onOpen: (sectionId: string) => void; onAccept: (sectionId: string, text: string) => void; onDiscard: (sectionId: string) => void; onClose: () => void;
}) {
  const list = m.sections.filter((s) => proposals[s.id]);
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Suggestions waiting · {list.length}</DialogTitle>
          <DialogDescription>Claude's suggestions for the whole book, in the book's order. Your text is unchanged until you accept one; the text before it is kept in the section's version history.</DialogDescription>
        </DialogHeader>
        {!list.length && <p className="text-[14px] text-[#64748B]">Nothing is waiting.</p>}
        <ol className="space-y-2">
          {list.map((s) => {
            const p = proposals[s.id];
            const before = words(s.body), after = words(p.text);
            return (
              <li key={s.id} className="rounded-[12px] border border-[#E6E8ED] p-3 dark:border-white/10">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[15px] font-semibold">{s.title || kindDef(s.kind).label}</p>
                  <p className="text-[12.5px] text-[#64748B]">{OP_LABEL[p.op] ?? p.op} · {before.toLocaleString()} → {after.toLocaleString()} words</p>
                </div>
                <p className="mt-1 line-clamp-2 font-serif text-[14px] text-[#475569] dark:text-[#CBD5E1]">{p.text.replace(/[#*>_]/g, "").slice(0, 260)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-8" onClick={() => onOpen(s.id)}><Eye className="h-3.5 w-3.5" /> Review change by change</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => { if (window.confirm(`Accept Claude's suggestion for “${s.title}” as it is? The text before is kept in its version history.`)) onAccept(s.id, p.text); }}><Check className="h-3.5 w-3.5" /> Accept as it is</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-[#B91C1C]" onClick={() => onDiscard(s.id)}><Trash2 className="h-3.5 w-3.5" /> Discard</Button>
                </div>
              </li>
            );
          })}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
