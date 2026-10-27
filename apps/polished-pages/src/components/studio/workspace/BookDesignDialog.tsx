import { useState } from "react";
import { AlertTriangle, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BOOK_TYPES, type BookDesign, type BookTypeId, type DesignApproach, type DesignBriefInput } from "@/lib/book-design";
import { kindDef } from "@/lib/manuscript";
import { EYEBROW, GRADIENT, SERIF } from "./ui";

// Rebuild as a professional book (DESIGN-SPEC.md §17): the owner says what the
// book should become, Claude designs it from the whole of the material, the
// owner reviews the design, and only then does it replace the manuscript.
const APPROACHES: { id: DesignApproach; label: string; line: string }[] = [
  { id: "mine", label: "From my book only", line: "Every chapter is written from your material; nothing from outside." },
  { id: "mine-and-research", label: "My book + cited sources", line: "Your material leads; other sources add context, each one cited." },
];

export default function BookDesignDialog({ initial, sections, design, onClose, onApply, engineLabel }: {
  initial?: Partial<DesignBriefInput>;
  /** How many sections the manuscript has now (they are kept and can be restored). */
  sections: number;
  design: (b: DesignBriefInput) => Promise<BookDesign>;
  onClose: () => void;
  onApply: (d: BookDesign, b: DesignBriefInput) => void;
  engineLabel?: string;
}) {
  const [brief, setBrief] = useState<DesignBriefInput>({ bookType: "course", instructions: "", approach: "mine", ...initial } as DesignBriefInput);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookDesign | null>(null);
  const set = (p: Partial<DesignBriefInput>) => setBrief((b) => ({ ...b, ...p }));
  const canRun = brief.bookType !== "custom" || brief.instructions.trim().length >= 10;

  const run = async () => {
    setBusy(true); setError(null);
    try { setResult(await design(brief)); }
    catch (e) { setError(e instanceof Error ? e.message : "Claude couldn't design the book."); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v && !busy) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl"><Sparkles className="h-5 w-5 text-primary" /> Rebuild as a professional book</DialogTitle>
          <DialogDescription>
            {result ? "Claude's design for the new book. Nothing has changed yet: read it, then use it or go back and change your instructions."
              : "Claude reads the whole of your material and designs the book a publisher would make from it: who it is for, its parts and chapters in the order the reader needs them, and what each chapter includes. Your teaching, convictions, quotations and scripture stay yours; nothing is invented, and anything left out is listed."}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <fieldset className="space-y-1.5">
              <legend className="mb-1.5 text-sm font-medium">What kind of book should it become?</legend>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(BOOK_TYPES) as BookTypeId[]).map((id) => (
                  <button key={id} type="button" role="radio" aria-checked={brief.bookType === id} onClick={() => set({ bookType: id })}
                    className={`rounded-[10px] border px-3 py-2.5 text-left ${brief.bookType === id ? "border-[#2563EB] bg-[#EAF1FF] dark:bg-[#1E3A8A]/30" : "border-border hover:bg-muted/50"}`}>
                    <span className="block text-[13.5px] font-medium">{BOOK_TYPES[id].label}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[12px] text-[#64748B]">{BOOK_TYPES[id].apparatus}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="design-ins">Your instructions for the book{brief.bookType === "custom" && <span className="text-destructive"> *</span>}</Label>
              <Textarea id="design-ins" rows={6} value={brief.instructions} onChange={(e) => set({ instructions: e.target.value })}
                placeholder={"Say what the finished book must be. For example:\n• A 12-week university course on demonology, in three parts: foundations, the powers of darkness, deliverance in practice.\n• Put all the teaching on the names and ranks of spirits in one chapter.\n• Move the testimonies to the chapters they illustrate.\n• Each chapter ends with five review questions."} />
            </div>
            <fieldset className="space-y-1.5">
              <legend className="mb-1.5 text-sm font-medium">Where the chapters come from</legend>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                {APPROACHES.map((a) => (
                  <button key={a.id} type="button" role="radio" aria-checked={brief.approach === a.id} onClick={() => set({ approach: a.id })}
                    className={`rounded-[10px] border px-3 py-2.5 text-left ${brief.approach === a.id ? "border-[#2563EB] bg-[#EAF1FF] dark:bg-[#1E3A8A]/30" : "border-border hover:bg-muted/50"}`}>
                    <span className="block text-[13.5px] font-medium">{a.label}</span>
                    <span className="mt-0.5 block text-[12px] text-[#64748B]">{a.line}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            {error && <p role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</p>}
            {busy && <p role="status" className="text-[12.5px] text-[#64748B]">Claude is reading the whole of your material and designing the book. On Claude Code this can take several minutes.</p>}
          </div>
        ) : <DesignReview d={result} />}

        <DialogFooter className="gap-2 sm:gap-0">
          {!result ? (<>
            <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button className={`rounded-full ${GRADIENT}`} disabled={!canRun || busy} onClick={run}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Design the book{engineLabel ? ` · ${engineLabel}` : ""}
            </Button>
          </>) : (<>
            <Button variant="ghost" onClick={() => setResult(null)}><ArrowLeft className="h-4 w-4" /> Change my instructions</Button>
            <Button className={`rounded-full ${GRADIENT}`} onClick={() => onApply(result, brief)}>Use this design</Button>
          </>)}
        </DialogFooter>
        {result && <p className="text-right text-[12px] text-[#64748B]">{sections ? `Your manuscript's ${sections} ${sections === 1 ? "section is" : "sections are"} replaced by the ${result.sections.length} designed ones. The current manuscript is kept: restore it from Plan at any time.` : `The ${result.sections.length} designed sections become your manuscript.`} Then Claude writes each one, and each waits for you to accept it.</p>}
      </DialogContent>
    </Dialog>
  );
}

export function DesignReview({ d }: { d: BookDesign }) {
  let chapter = 0;
  return (
    <div className="space-y-4">
      <div>
        <p className={`${SERIF} text-[22px] leading-tight`}>{d.title || "Untitled book"}</p>
        {d.subtitle && <p className="text-[14px] text-[#475569] dark:text-[#CBD5E1]">{d.subtitle}</p>}
        {d.reader && <p className="mt-2 text-[13px]"><span className="font-medium">For: </span>{d.reader}</p>}
        {d.rationale && <p className="mt-1 text-[13px] text-[#475569] dark:text-[#CBD5E1]"><span className="font-medium text-foreground">Why this shape: </span>{d.rationale}</p>}
      </div>
      {(d.unplaced.length > 0 || d.missing.length > 0) && (
        <div className="space-y-2 rounded-[10px] border border-amber-200 bg-[#FFFBEB] px-3 py-2.5 text-[13px] dark:border-amber-500/30 dark:bg-amber-500/10">
          {d.unplaced.length > 0 && <div><p className="flex items-center gap-1.5 font-medium text-[#92400E] dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Not placed in the new book ({d.unplaced.length})</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">{d.unplaced.map((u, i) => <li key={i}>{u.what}{u.where ? ` (${u.where})` : ""}{u.why ? `: ${u.why}` : ""}</li>)}</ul></div>}
          {d.missing.length > 0 && <div><p className="flex items-center gap-1.5 font-medium text-[#92400E] dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Missing: for you to supply ({d.missing.length})</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">{d.missing.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
        </div>
      )}
      <div>
        <p className={EYEBROW}>Contents</p>
        <ol className="mt-2 space-y-2.5">
          {d.sections.map((s, i) => {
            const label = s.kind === "chapter" ? `Chapter ${++chapter}` : kindDef(s.kind).label;
            if (s.kind === "part") return <li key={i} className={`${SERIF} pt-2 text-[17px] font-medium`}>{s.title}{s.summary && <span className="block font-sans text-[12.5px] font-normal text-[#64748B]">{s.summary}</span>}</li>;
            return (
              <li key={i} className="rounded-[10px] border border-[#E6E8ED] px-3 py-2.5 dark:border-white/10">
                <p className="text-[12px] font-medium text-[#64748B]">{label}</p>
                <p className="text-[14.5px] font-medium">{s.title}</p>
                {s.summary && <p className="mt-0.5 text-[13px] text-[#475569] dark:text-[#CBD5E1]">{s.summary}</p>}
                {s.draws && <p className="mt-1 text-[12.5px]"><span className="font-medium">Draws on: </span><span className="text-[#475569] dark:text-[#CBD5E1]">{s.draws}</span></p>}
                {s.apparatus && <p className="text-[12.5px]"><span className="font-medium">Includes: </span><span className="text-[#475569] dark:text-[#CBD5E1]">{s.apparatus}</span></p>}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
