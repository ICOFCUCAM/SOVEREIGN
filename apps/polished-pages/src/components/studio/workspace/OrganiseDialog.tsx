import { useRef, useState } from "react";
import { AlertTriangle, ListTree, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { applyOrganise, type Organised, type OrganiseOptions, type OrganisePlan } from "@/lib/organise";
import { kindDef, words } from "@/lib/manuscript";
import { STUDIO_ACCEPT } from "@/lib/claude-studio";
import { EYEBROW, GRADIENT } from "./ui";

// Organise into chapters and sections (DESIGN-SPEC.md §19): a book uploaded here, the uploaded
// manuscript, or the manuscript as it stands (a rewritten book too). Claude says where each part
// begins and what it is called; the text is split there unchanged; the owner reviews, then applies.
export type OrganiseSource = "manuscript" | "uploads";

export default function OrganiseDialog({ hasManuscript, hasUploads, readText, organise, upload, onApply, onClose, engineLabel }: {
  hasManuscript: boolean; hasUploads: boolean;
  /** The text of the chosen source (null when it has none). */
  readText: (s: OrganiseSource) => Promise<string | null>;
  organise: (text: string, o: OrganiseOptions) => Promise<OrganisePlan>;
  /** Adds a book to the project's sources; the dialog then organises it. */
  upload: (files: FileList) => Promise<void>;
  onApply: (o: Organised) => void;
  onClose: () => void;
  engineLabel?: string;
}) {
  const [source, setSource] = useState<OrganiseSource>(hasManuscript ? "manuscript" : "uploads");
  const [titles, setTitles] = useState<OrganiseOptions["titles"]>("keep");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Organised | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const run = async (from = source) => {
    setError(null); setResult(null);
    try {
      setBusy("Reading the book…");
      const text = await readText(from);
      if (!text?.trim()) throw new Error(from === "uploads" ? "The uploaded book has no text yet. On its card in Sources, use “open it (password or scanned pages)” first." : "The manuscript is empty.");
      setBusy(`Claude is finding the chapters and sections of ${words(text).toLocaleString()} words. A long book can take a few minutes.`);
      const plan = await organise(text, { titles, instructions: instructions.trim() || undefined });
      setResult(applyOrganise(text, plan));
    } catch (e) { setError(e instanceof Error ? e.message : "Claude couldn't organise the book."); }
    finally { setBusy(null); }
  };
  const addBook = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    try { setBusy("Uploading the book…"); await upload(files); setSource("uploads"); await run("uploads"); }
    catch (e) { setError(e instanceof Error ? e.message : "The book couldn't be uploaded."); setBusy(null); }
  };

  let chapter = 0;
  return (
    <Dialog open onOpenChange={(v) => { if (!v && !busy) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl"><ListTree className="h-5 w-5 text-primary" /> Organise into chapters and sections</DialogTitle>
          <DialogDescription>{result ? "Claude's chapters and sections. Not a word of the book is changed: it is only divided and titled. Nothing changes until you apply it." : "Claude reads the whole book and finds its front matter, parts, chapters, sections and back matter, and titles them. Not a word of the text is changed. Works for a book you upload, your manuscript, or a rewritten book."}</DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <fieldset className="space-y-1.5">
              <legend className="mb-1.5 text-sm font-medium">The book to organise</legend>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                {([["manuscript", "The manuscript as it is now", "Also a rewritten book you made the manuscript", hasManuscript], ["uploads", "My uploaded book", "The book in Sources, as uploaded", hasUploads]] as const).map(([id, label, line, ok]) => (
                  <button key={id} type="button" role="radio" aria-checked={source === id} disabled={!ok} onClick={() => setSource(id)}
                    className={`rounded-[10px] border px-3 py-2.5 text-left disabled:opacity-40 ${source === id ? "border-[#2563EB] bg-[#EAF1FF] dark:bg-[#1E3A8A]/30" : "border-border hover:bg-muted/50"}`}>
                    <span className="block text-[13.5px] font-medium">{label}</span><span className="mt-0.5 block text-[12px] text-[#64748B]">{line}</span>
                  </button>
                ))}
                <button type="button" onClick={() => file.current?.click()} disabled={Boolean(busy)} className="rounded-[10px] border border-dashed border-border px-3 py-2.5 text-left hover:bg-muted/50">
                  <span className="flex items-center gap-1.5 text-[13.5px] font-medium"><Upload className="h-4 w-4" /> Upload a book</span><span className="mt-0.5 block text-[12px] text-[#64748B]">PDF, Word or text; it is organised at once</span>
                </button>
                <input ref={file} type="file" accept={STUDIO_ACCEPT} hidden onChange={(e) => { void addBook(e.target.files); e.target.value = ""; }} />
              </div>
            </fieldset>
            <fieldset className="space-y-1.5">
              <legend className="mb-1.5 text-sm font-medium">Titles</legend>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                {([["keep", "Keep the author's titles", "Where the book has a heading, it stays; untitled parts get a short title"], ["improve", "Write clear titles", "Professional titles that say what each chapter and section is about"]] as const).map(([id, label, line]) => (
                  <button key={id} type="button" role="radio" aria-checked={titles === id} onClick={() => setTitles(id)}
                    className={`rounded-[10px] border px-3 py-2.5 text-left ${titles === id ? "border-[#2563EB] bg-[#EAF1FF] dark:bg-[#1E3A8A]/30" : "border-border hover:bg-muted/50"}`}>
                    <span className="block text-[13.5px] font-medium">{label}</span><span className="mt-0.5 block text-[12px] text-[#64748B]">{line}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="org-ins">Anything else (optional)</Label>
              <Textarea id="org-ins" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. The book has three parts. Treat each numbered lesson as a chapter." />
            </div>
            {busy && <p role="status" className="text-[13px] text-[#64748B]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />{busy}</p>}
            {error && <p role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px]">{result.sections.length} parts · {result.keptWords.toLocaleString()} of the book's {result.totalWords.toLocaleString()} words kept as written{result.removedHeadingWords ? `, ${result.removedHeadingWords} words of old heading lines replaced by the titles` : ""}.</p>
            {(result.missed.length > 0 || result.notes) && (
              <div className="space-y-1 rounded-[10px] border border-amber-200 bg-[#FFFBEB] px-3 py-2 text-[13px] dark:border-amber-500/30 dark:bg-amber-500/10">
                {result.missed.length > 0 && <p className="flex items-start gap-1.5"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#92400E]" /> Not found in the text, so their words stay with the part before: {result.missed.join("; ")}</p>}
                {result.notes && <p><span className="font-medium">Claude notes: </span>{result.notes}</p>}
              </div>
            )}
            <p className={EYEBROW}>Contents</p>
            <ol className="space-y-1.5">
              {result.sections.map((s, i) => {
                const subs = [...s.body.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
                const label = s.kind === "chapter" ? `Chapter ${++chapter}` : kindDef(s.kind).label;
                return (
                  <li key={i} className="rounded-[10px] border border-[#E6E8ED] px-3 py-2 dark:border-white/10">
                    <p className="flex items-baseline justify-between gap-3"><span><span className="text-[12px] text-[#64748B]">{label} · </span><span className="text-[14px] font-medium">{s.title}</span></span><span className="shrink-0 text-[12px] text-[#64748B]">{words(s.body).toLocaleString()} words</span></p>
                    {subs.length > 0 && <p className="mt-0.5 text-[12.5px] text-[#475569] dark:text-[#CBD5E1]">{subs.join(" · ")}</p>}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!result ? (<>
            <Button variant="ghost" onClick={onClose} disabled={Boolean(busy)}>Cancel</Button>
            <Button className={`rounded-full ${GRADIENT}`} disabled={Boolean(busy) || (source === "manuscript" ? !hasManuscript : !hasUploads)} onClick={() => void run()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListTree className="h-4 w-4" />} Organise the book{engineLabel ? ` · ${engineLabel}` : ""}
            </Button>
          </>) : (<>
            <Button variant="ghost" onClick={() => setResult(null)}>Change the options</Button>
            <Button className={`rounded-full ${GRADIENT}`} onClick={() => onApply(result)}>Use these chapters</Button>
          </>)}
        </DialogFooter>
        {result && <p className="text-right text-[12px] text-[#64748B]">The manuscript's current chapters are kept: restore them from Plan at any time.</p>}
      </DialogContent>
    </Dialog>
  );
}
