import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Circle, Loader2, PenLine, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { bookFacts, kindDef, type Manuscript } from "@/lib/manuscript";
import { copyrightLines } from "@/lib/copyright-page";
import { MATTER_STEPS, bookForMatter, given, matterProgress, sectionFor, setIncluded, setPage, stepLabel, stepStatus, type MatterStep } from "@/lib/matter-guide";
import type { MatterInput } from "@/lib/claude-studio";
import { frontMatterChecks, putInOrder } from "@/lib/front-matter-check";
import { toIsbn13 } from "@/lib/cover-design";
import { EYEBROW, GRADIENT } from "./ui";

// Front and back matter, page by page (DESIGN-SPEC.md §21): for each page in printing order, the author
// writes what they want, Claude rewrites it professionally (again as often as they like), they accept it
// and go on. A page the manuscript already has is shown filled in, to edit by hand or with Claude.
// Facts are asked for in fields and never invented; Claude marks what it would need as [[YOURS: …]].
export default function MatterGuide({ m, onUpdate, rewrite, engineLabel, onClose, start }: {
  m: Manuscript;
  onUpdate: (m: Manuscript) => void;
  /** Claude's professional rewrite of a page (null when no engine is set up). */
  rewrite: ((i: MatterInput) => Promise<string>) | null;
  engineLabel?: string;
  onClose: () => void;
  /** The page to open first (default: the first one still to do). */
  start?: string;
}) {
  const firstTodo = MATTER_STEPS.findIndex((s) => stepStatus(m, s) === "to-do" && (s.standard || s.facts));
  const [at, setAt] = useState(() => Math.max(0, start ? MATTER_STEPS.findIndex((s) => s.kind === start) : firstTodo));
  const step = MATTER_STEPS[at];
  const progress = matterProgress(m);
  const go = (i: number) => setAt(Math.min(MATTER_STEPS.length - 1, Math.max(0, i)));

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-5xl">
        <div className="flex max-h-[92vh] flex-col sm:flex-row">
          <nav aria-label="Pages" className="shrink-0 overflow-y-auto border-b border-[#E6E8ED] bg-[#F8FAFC] p-4 sm:w-[250px] sm:border-b-0 sm:border-r dark:border-white/10 dark:bg-white/5">
            <p className="text-[12px] text-[#64748B]">{progress.done} of {progress.total} pages ready</p>
            <div className="mt-1.5 h-1.5 rounded-full bg-[#E2E8F0] dark:bg-white/10"><div className="h-1.5 rounded-full bg-[#2563EB]" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} /></div>
            {(["front", "back"] as const).map((g) => (
              <div key={g} className="mt-4">
                <p className={EYEBROW}>{g === "front" ? "Front matter" : "Back matter"}</p>
                <ol className="mt-1.5 space-y-0.5">
                  {MATTER_STEPS.map((s, i) => s.group !== g ? null : (
                    <li key={s.kind}>
                      <button type="button" onClick={() => go(i)} aria-current={i === at ? "step" : undefined}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] ${i === at ? "bg-white font-medium text-[#1D4ED8] shadow-sm dark:bg-white/10" : "text-[#334155] hover:bg-white/70 dark:text-[#CBD5E1] dark:hover:bg-white/5"}`}>
                        <StatusIcon status={stepStatus(m, s)} />{stepLabel(s.kind)}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            {/* The checks the book must pass before it is complete (§22), as they stand now. */}
            <div className="mt-5">
              <p className={EYEBROW}>Checks</p>
              <ul className="mt-1.5 space-y-1 text-[12px]">
                {frontMatterChecks(m).map((c) => (
                  <li key={c.text} className={`flex items-start gap-1.5 ${c.ok ? "text-[#475569] dark:text-[#94A3B8]" : c.level === "required" ? "text-[#B91C1C] dark:text-red-300" : "text-[#92400E] dark:text-amber-300"}`}>
                    {c.ok ? <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#16A34A]" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}<span>{c.text}{!c.ok && c.fix === "order" && <> <button type="button" className="font-medium text-[#2563EB] underline" onClick={() => onUpdate(putInOrder(m))}>Put them in order</button></>}</span>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6">
            <DialogHeader>
              <p className={EYEBROW}>{step.group === "front" ? "Front matter" : "Back matter"} · page {at + 1} of {MATTER_STEPS.length}</p>
              <DialogTitle className="font-serif text-2xl">{stepLabel(step.kind)}</DialogTitle>
              <DialogDescription>{step.ask}</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex-1">
              {/* Keyed by page so each page starts with its own draft. */}
              <StepBody key={step.kind} step={step} m={m} onUpdate={onUpdate} rewrite={rewrite} engineLabel={engineLabel} onNext={() => go(at + 1)} />
            </div>
            <div className="mt-6 flex items-center justify-between gap-2 border-t border-[#E6E8ED] pt-4 dark:border-white/10">
              <Button variant="ghost" disabled={at === 0} onClick={() => go(at - 1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
              {at < MATTER_STEPS.length - 1
                ? <Button variant="outline" onClick={() => go(at + 1)}>{stepStatus(m, step) === "to-do" ? "Skip for now" : "Next page"} <ArrowRight className="h-4 w-4" /></Button>
                : <Button className={`rounded-full ${GRADIENT}`} onClick={onClose}><Check className="h-4 w-4" /> Done</Button>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusIcon({ status }: { status: ReturnType<typeof stepStatus> }) {
  if (status === "done") return <Check aria-label="ready" className="h-3.5 w-3.5 shrink-0 text-[#16A34A]" />;
  if (status === "off") return <span aria-label="left out" className="h-3.5 w-3.5 shrink-0 text-center text-[11px] leading-[14px] text-[#94A3B8]">–</span>;
  return <Circle aria-label="to do" className="h-3.5 w-3.5 shrink-0 text-[#CBD5E1]" />;
}

const holes = (t: string) => [...t.matchAll(/\[\[YOURS:\s*([^\]]+)\]\]/g)].map((x) => x[1].trim());

function StepBody({ step, m, onUpdate, rewrite, engineLabel, onNext }: { step: MatterStep; m: Manuscript; onUpdate: (m: Manuscript) => void; rewrite: ((i: MatterInput) => Promise<string>) | null; engineLabel?: string; onNext: () => void }) {
  const sec = sectionFor(m, step.kind);
  const status = stepStatus(m, step);
  const [editing, setEditing] = useState(!sec?.body.trim());
  const [notes, setNotes] = useState(sec?.body ?? "");
  const [proposal, setProposal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guidance = useMemo(() => kindDef(step.kind).guidance, [step.kind]);

  if (step.facts) return <Facts step={step} m={m} onUpdate={onUpdate} />;
  // Shown once the page is in the book (accepting a page adds it); the contents are always in.
  const includeToggle = !sec && step.kind !== "contents" && !step.auto ? null : (
    <label className="mb-3 flex items-center gap-2 text-[13.5px]">
      <input type="checkbox" checked={status !== "off" && (Boolean(sec) || step.kind === "contents")} disabled={step.kind === "contents"}
        onChange={(e) => onUpdate(setIncluded(m, step.kind, e.target.checked))} />
      Include this page in the book{status === "off" && sec?.body.trim() ? " (its text is kept)" : ""}
    </label>
  );
  if (step.auto) return (
    <div>{includeToggle}<p className="rounded-[10px] border border-[#E6E8ED] bg-[#F8FAFC] px-4 py-3 text-[13.5px] text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-[#CBD5E1]">
      {step.kind === "contents" ? "The contents are made from the book's chapters and sections with their page numbers, and change by themselves when the book does. Preliminary pages are numbered i, ii, iii…; the main text starts at 1." : "The half-title is the book's title alone, on the first page."}
    </p></div>
  );

  const ask = async () => {
    if (!rewrite) return;
    setBusy(true); setError(null);
    try {
      setProposal(await rewrite({ kind: step.kind, label: stepLabel(step.kind), notes, title: m.title, subtitle: m.subtitle, author: m.author, rules: m.rules, guidance, fromBook: Boolean(step.fromBook), book: step.fromBook ? bookForMatter(m) : undefined }));
    } catch (e) { setError(e instanceof Error ? e.message : "Claude couldn't rewrite the page."); }
    finally { setBusy(false); }
  };
  const accept = (text: string) => { onUpdate(setPage(m, step.kind, text)); setProposal(null); setEditing(false); onNext(); };
  const canAsk = Boolean(rewrite) && !step.verbatim && (notes.trim() || (step.fromBook && m.sections.some((s) => kindDef(s.kind).group === "body" && s.body.trim())));

  // The page as the manuscript has it: read, then edit by hand or with Claude.
  if (!editing && sec?.body.trim() && !proposal) return (
    <div>
      {includeToggle}
      <p className="mb-2 text-[12.5px] text-[#64748B]">{status === "off" ? "Left out of the book. " : ""}In the manuscript{sec.versions?.length ? ` · ${sec.versions.length} earlier ${sec.versions.length === 1 ? "version" : "versions"} kept` : ""}.</p>
      <div className="max-h-[42vh] overflow-y-auto whitespace-pre-wrap rounded-[10px] border border-[#E6E8ED] bg-white px-4 py-3 font-serif text-[15px] leading-relaxed dark:border-white/10 dark:bg-white/5">{sec.body}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => { setNotes(sec.body); setEditing(true); }}><PenLine className="h-4 w-4" /> Edit it myself</Button>
        {rewrite && !step.verbatim && <Button variant="outline" onClick={() => { setNotes(sec.body); setEditing(true); void (async () => { setBusy(true); setError(null); try { setProposal(await rewrite({ kind: step.kind, label: stepLabel(step.kind), notes: sec.body, title: m.title, subtitle: m.subtitle, author: m.author, rules: m.rules, guidance, fromBook: Boolean(step.fromBook), book: step.fromBook ? bookForMatter(m) : undefined })); } catch (e) { setError(e instanceof Error ? e.message : "Claude couldn't rewrite the page."); } finally { setBusy(false); } })(); }}><Sparkles className="h-4 w-4" /> Improve it with Claude</Button>}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {includeToggle}
      {!proposal ? (<>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={9} aria-label={`Your words for the ${stepLabel(step.kind)}`} placeholder={step.hint || "Write what you want on this page, in your own words."} className="font-serif text-[15px] leading-relaxed" />
        {step.fromBook && !notes.trim() && <p className="text-[12.5px] text-[#64748B]">Nothing written yet: Claude can draft this page from the book itself. It adds no facts about you; anything it would need is marked for you to fill in.</p>}
        <div className="flex flex-wrap items-center gap-2">
          {step.verbatim ? <p className="w-full text-[12.5px] text-[#64748B]">These are other people's words: they are printed exactly as you give them, never rewritten.</p> : <Button className={`rounded-full ${GRADIENT}`} disabled={!canAsk || busy} onClick={() => void ask()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {notes.trim() ? "Rewrite it professionally" : "Draft it from the book"}
          </Button>}
          <Button variant="outline" disabled={!notes.trim() || busy} onClick={() => accept(notes)}><Check className="h-4 w-4" /> Use my words as they are</Button>
          {sec?.body.trim() && <Button variant="ghost" disabled={busy} onClick={() => { setEditing(false); setNotes(sec.body); }}>Cancel</Button>}
        </div>
        {rewrite && engineLabel && <p className="text-[12px] text-[#64748B]">{engineLabel}</p>}
        {!rewrite && <p className="text-[12.5px] text-[#64748B]">Set up Claude Code or the API to have pages rewritten; you can still write them yourself.</p>}
      </>) : (<>
        <p className="text-[12.5px] text-[#64748B]">Claude's version. Change anything before you accept it; your own words are kept below.</p>
        <Textarea value={proposal} onChange={(e) => setProposal(e.target.value)} rows={11} aria-label="Claude's version" className="font-serif text-[15px] leading-relaxed" />
        {holes(proposal).length > 0 && (
          <p className="flex items-start gap-1.5 rounded-[10px] border border-amber-200 bg-[#FFFBEB] px-3 py-2 text-[13px] dark:border-amber-500/30 dark:bg-amber-500/10"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#92400E]" /> For you to fill in (Claude doesn't invent them): {holes(proposal).join("; ")}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button className={`rounded-full ${GRADIENT}`} disabled={busy} onClick={() => accept(proposal)}><Check className="h-4 w-4" /> Accept and go to the next page</Button>
          <Button variant="outline" disabled={busy} onClick={() => void ask()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Rewrite again</Button>
          <Button variant="ghost" disabled={busy} onClick={() => setProposal(null)}>Back to my words</Button>
        </div>
        <details className="text-[12.5px] text-[#64748B]"><summary className="cursor-pointer">My words</summary><p className="mt-1 whitespace-pre-wrap">{notes || "(none)"}</p></details>
      </>)}
      {busy && <p role="status" className="text-[13px] text-[#64748B]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Claude is writing the page…</p>}
      {error && <p role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</p>}
    </div>
  );
}

/** Title page and copyright page: the book's details, each a fact the author gives (or leaves for later). */
function Facts({ step, m, onUpdate }: { step: MatterStep; m: Manuscript; onUpdate: (m: Manuscript) => void }) {
  const meta = m.meta ?? {};
  const setMeta = (k: string, v: string) => onUpdate({ ...m, meta: { ...meta, [k]: v } });
  const field = (label: string, value: string, set: (v: string) => void, hint?: string) => (
    <label className="block text-[13px] font-medium">{label}<Input value={value} onChange={(e) => set(e.target.value)} placeholder={hint} className="mt-1 h-9 font-normal" /></label>
  );
  const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");
  if (step.facts === "title") return (
    <div className="grid gap-3 sm:grid-cols-2">
      {field("Title", m.title, (v) => onUpdate({ ...m, title: v }))}
      {field("Subtitle", m.subtitle ?? "", (v) => onUpdate({ ...m, subtitle: v }))}
      {field("Author, as printed", m.author ?? "", (v) => onUpdate({ ...m, author: v }), "Your name as it should appear")}
      {field("Publisher or imprint (optional)", str(meta.publisher), (v) => setMeta("publisher", v), "Leave empty if self-published without an imprint")}
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {field("Copyright holder", str(meta.copyrightHolder), (v) => setMeta("copyrightHolder", v), given(m.author) ? `${given(m.author)} (when empty)` : "The author, or a ministry or company")}
        {field("Year of publication", str(meta.copyrightYear), (v) => setMeta("copyrightYear", v.replace(/[^\d]/g, "").slice(0, 4)), String(new Date().getFullYear()))}
        <div>
          {field("ISBN (optional)", str(meta.isbn), (v) => setMeta("isbn", v), "Leave empty until you have one")}
          {/* The same ISBN prints on this page and as the barcode on the back cover. */}
          {str(meta.isbn).trim() && <p className={`mt-1 text-[12px] ${toIsbn13(str(meta.isbn)) ? "text-[#15803D]" : "text-[#B91C1C]"}`}>{toIsbn13(str(meta.isbn)) ? "A valid ISBN: its barcode is drawn on the back cover." : "Not a valid ISBN-10 or ISBN-13: check the digits."}</p>}
        </div>
        {field("Edition (optional)", str(meta.edition), (v) => setMeta("edition", v), "e.g. First edition 2026")}
      </div>
      <label className="block text-[13px] font-medium">Scripture permission notices (one per line)
        <Textarea value={str(meta.scriptureNotices)} onChange={(e) => setMeta("scriptureNotices", e.target.value)} rows={3} placeholder="e.g. Scripture quotations are from the King James Version (public domain)." className="mt-1 font-normal" />
      </label>
      <p className="text-[12.5px] text-[#64748B]">The standard rights wording ("All rights reserved. No part of this book may be reproduced…") is added for you. Empty fields are left off the page, never filled with a guess.</p>
      {/* The page as it will print, from the same lines the typesetter and the EPUB use. */}
      <figure aria-label="Copyright page preview" className="mx-auto mt-2 flex aspect-[2/3] w-full max-w-[300px] flex-col justify-end rounded-[6px] border border-[#E6E8ED] bg-white p-5 shadow-sm dark:border-white/10">
        {copyrightLines({ title: m.title || "Untitled book", author: m.author, ...bookFacts(m) }).map((l, i) => <p key={i} className="mb-1.5 font-serif text-[8.5px] leading-snug text-[#334155]">{l}</p>)}
      </figure>
    </div>
  );
}
