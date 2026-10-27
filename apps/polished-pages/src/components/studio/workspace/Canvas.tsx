import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, CornerDownLeft, PenLine, RotateCcw, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Markdown from "@/components/studio/Markdown";
import { kindDef, words, type Manuscript, type Section } from "@/lib/manuscript";
import { diffText, type DiffBlock } from "@/lib/word-diff";
import BookPageView from "./BookPageView";
import { APPROACH_CARDS, OP_LABEL } from "./approaches";
import type { Proposal } from "./useSectionRun";

// The page in the middle of Write (design spec §5.1): the manuscript, and
// Claude's proposal when there is one. Views: writing (default), the real
// typeset page, changes (accept or reject each one), clean, original, side by
// side, and write myself.

export type CanvasView = "writing" | "book" | "changes" | "clean" | "original" | "side" | "mine";
export const VIEWS: { id: CanvasView; label: string; needsProposal?: boolean }[] = [
  { id: "writing", label: "Writing" }, { id: "book", label: "Book page" }, { id: "changes", label: "Changes", needsProposal: true },
  { id: "clean", label: "Clean" }, { id: "original", label: "Original" }, { id: "side", label: "Side by side", needsProposal: true }, { id: "mine", label: "Write myself" },
];

const TITLE = "font-['Newsreader',Georgia,serif] text-[30px] sm:text-[36px] leading-[1.15] font-medium tracking-[-0.01em]";
const PROSE = "font-['Newsreader',Georgia,serif] text-[18px] leading-[1.7]";
const COLUMN = "mx-auto w-full max-w-[720px]";

/** A textarea that grows with its text, so the page reads as one continuous manuscript. */
function GrowingText({ value, onChange, label, placeholder, className, min = 360, single }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string; className?: string; min?: number; single?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Measured again when the text changes, when the book font has loaded and when the width changes.
  useLayoutEffect(() => {
    const t = ref.current; if (!t) return;
    const fit = () => { t.style.height = "auto"; t.style.height = `${Math.max(t.scrollHeight, min)}px`; };
    fit();
    let live = true;
    document.fonts?.ready.then(() => { if (live) fit(); });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(t);
    return () => { live = false; ro?.disconnect(); };
  }, [value, min]);
  return <textarea ref={ref} value={value} onChange={(e) => onChange(single ? e.target.value.replace(/\n/g, " ") : e.target.value)} aria-label={label} placeholder={placeholder} rows={1}
    className={`block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus-visible:ring-0 dark:text-[#E5E7EB] ${className ?? ""}`} />;
}

// "(Author, 1992)" in Claude's added text becomes a numbered marker.
const CITE = /\(([A-Z][^()]{1,80}?,\s*(?:\d{4}[a-z]?|n\.d\.)[^()]{0,20})\)/g;

/** Each change (a removal, an addition, or a replacement) gets a number the owner can accept or reject. */
function numberChanges(blocks: DiffBlock[]) {
  let n = -1;
  return blocks.map((b) => b.parts.map((p, i) => {
    if (p.kind === "same") return { ...p, change: -1 };
    if (!(p.kind === "add" && b.parts[i - 1]?.kind === "del")) n++;
    return { ...p, change: n };
  }));
}

export default function Canvas({ m, section, view, proposal, running, onBody, onTitle, onAccept, onDiscard, onRedo, onRestoreOriginal, onView, bookTrim }: {
  m: Manuscript; section: Section; view: CanvasView; proposal: Proposal | null; running: boolean;
  onBody: (t: string) => void; onTitle: (t: string) => void;
  onAccept: (text: string) => void; onDiscard: () => void; onRedo: () => void; onRestoreOriginal: () => void; onView: (v: CanvasView) => void; bookTrim?: string;
}) {
  const reduce = useReducedMotion();
  const def = kindDef(section.kind);
  const mine = proposal?.sectionId === section.id ? proposal : null;
  const blocks = useMemo(() => (mine ? numberChanges(diffText(section.body, mine.text)) : []), [mine, section.body]);
  const total = useMemo(() => blocks.reduce((n, b) => Math.max(n, ...b.map((p) => p.change)), -1) + 1, [blocks]);
  const [rejected, setRejected] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [at, setAt] = useState(0);
  useEffect(() => { setRejected(new Set()); setEditing(null); setAt(0); }, [mine]);
  const changeRefs = useRef<Map<number, HTMLElement>>(new Map());

  // The text that "Accept" applies: Claude's version with the rejected changes put back.
  const accepted = useMemo(() => blocks.map((b) => b.map((p) => (p.kind === "same" ? p.text : p.kind === "add" ? (rejected.has(p.change) ? "" : p.text) : rejected.has(p.change) ? p.text : "")).join("").trim()).filter(Boolean).join("\n\n"), [blocks, rejected]);
  const citations = useMemo(() => (mine ? [...new Set([...mine.text.matchAll(CITE)].map((x) => x[1]))] : []), [mine]);
  const go = (d: 1 | -1) => { if (!total) return; const next = (at + d + total) % total; setAt(next); changeRefs.current.get(next)?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); };
  const toggle = (c: number) => setRejected((r) => { const x = new Set(r); if (x.has(c)) x.delete(c); else x.add(c); return x; });

  // Keyboard review (spec §6): J/K next and previous change, X keeps or rejects it, ⌘↵ accepts. Never while typing.
  const reviewing = Boolean(mine) && view === "changes" && editing === null && !running;
  useEffect(() => {
    if (!reviewing) return;
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onAccept(accepted); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "j") { e.preventDefault(); go(1); } else if (k === "k") { e.preventDefault(); go(-1); } else if (k === "x" && total) { e.preventDefault(); toggle(at); }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  });

  const card = mine ? APPROACH_CARDS.find((a) => a.id === mine.approach) : null;
  const header = (
    <header className="mb-10">
      <p className="mb-2 text-[12px] font-medium text-[#64748B]">{def.label}</p>
      {view === "writing" || view === "mine"
        ? <GrowingText value={section.title} onChange={onTitle} label="Section title" single min={0} className={`text-[#172033] dark:text-white ${TITLE}`} />
        : <h1 className={`text-[#172033] dark:text-white ${TITLE}`}>{section.title}</h1>}
    </header>
  );

  if (view === "book") return <BookPageView bookTitle={m.title} author={m.author} chapterTitle={section.title} text={section.body} trimId={bookTrim}
    plain={section.kind !== "chapter"} chapterNumber={section.kind === "chapter" ? m.sections.filter((s) => s.kind === "chapter").findIndex((s) => s.id === section.id) + 1 : undefined} />;

  // Changes, side by side and clean need a proposal; without one they fall back to the writing view.
  const effective: CanvasView = (view === "changes" || view === "side") && !mine ? "writing" : view;

  return (
    <div className={COLUMN}>
      {header}
      {mine && effective !== "changes" && effective !== "side" && (
        <div role="status" className="mb-8 flex flex-wrap items-center gap-3 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-[13.5px] text-[#1E3A8A] dark:border-[#1E3A8A] dark:bg-[#172554] dark:text-[#BFDBFE]">
          <span className="flex-1">Claude has a suggestion for this section ({OP_LABEL[mine.op] ?? mine.op}). Your text is unchanged until you accept it.</span>
          <Button size="sm" variant="outline" className="h-8" onClick={() => onView("changes")}>Review the changes</Button>
        </div>
      )}

      {effective === "writing" || effective === "mine" ? (
        <>
          <GrowingText value={section.body} onChange={onBody} label={`${section.title} text`} className={PROSE}
            placeholder={`Write the ${def.label.toLowerCase()} here${effective === "writing" ? ", or ask Claude in the panel" : ""}.`} />
          <p className="mt-6 text-[12px] text-[#64748B]">{words(section.body).toLocaleString()} words</p>
        </>
      ) : effective === "original" ? (
        <>
          <p className="mb-6 text-[12px] text-[#64748B]">{section.original ? "The text from before Claude's rewrite." : "Your text as it is now (there is no earlier version from a rewrite)."}</p>
          <div className={PROSE}><Markdown text={section.original ?? section.body} /></div>
          {section.original && <Button variant="outline" size="sm" className="mt-8" onClick={onRestoreOriginal}><Undo2 className="h-4 w-4" /> Put this version back</Button>}
        </>
      ) : effective === "clean" ? (
        <div className={PROSE}><Markdown text={mine ? accepted : section.body} /></div>
      ) : effective === "side" && mine ? (
        <div className="grid gap-10 md:grid-cols-2">
          <section aria-label="Your text"><p className="mb-4 text-[12px] font-medium text-[#64748B]">Your text</p><div className={`${PROSE} text-[16px] text-[#475569] dark:text-[#94A3B8]`}><Markdown text={section.body || "(empty)"} /></div></section>
          <section aria-label="Claude's version" className="md:border-l md:border-[#E6E8ED] md:pl-10 dark:md:border-white/10"><p className="mb-4 text-[12px] font-medium text-[#2563EB]">Claude's version</p><div className={`${PROSE} text-[16px]`}><Markdown text={mine.text} /></div></section>
        </div>
      ) : mine ? (
        editing !== null ? (
          <GrowingText value={editing} onChange={setEditing} label="Edit Claude's suggestion before accepting it" className={PROSE} />
        ) : (
          <div className={`${PROSE} text-[#172033] dark:text-[#E5E7EB]`}>
            {blocks.map((b, bi) => {
              // A heading (old or new) reads as a heading, without its Markdown marks.
              const head = /^#{1,6}\s/.test(b.map((x) => x.text).join(""));
              let stripped = false;
              return (
                <p key={bi} className={head ? "mb-3 mt-8 font-['Newsreader',Georgia,serif] text-[24px] font-medium" : "mb-5"}>
                  {b.map((p, pi) => {
                    const text = head && !stripped && /^#/.test(p.text) ? (stripped = true, p.text.replace(/^#+\s*/, "")) : p.text;
                    if (p.kind === "same") return <span key={pi}>{text}</span>;
                    const off = rejected.has(p.change);
                    const shown = p.kind === "add" ? !off : off;
                    const label = `${p.kind === "add" ? "Added" : "Removed"}: change ${p.change + 1} of ${total}, ${off ? "rejected" : "accepted"}. Press to ${off ? "accept" : "reject"}.`;
                    return (
                      <button key={pi} type="button" onClick={() => toggle(p.change)} aria-label={label} aria-pressed={!off}
                        ref={(el) => { if (el && (p.kind === "del" || !changeRefs.current.has(p.change))) changeRefs.current.set(p.change, el); }}
                        className={`inline rounded-[3px] px-0.5 text-left align-baseline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${at === p.change ? "ring-1 ring-[#2563EB]/50" : ""} ${p.kind === "add"
                          ? shown ? "bg-[#EAF1FF] underline decoration-[#2563EB] decoration-[1.5px] underline-offset-[5px] dark:bg-[#1E3A8A]/40" : "text-[#94A3B8] line-through decoration-[#94A3B8]"
                          : shown ? "bg-transparent text-[#172033] dark:text-[#E5E7EB]" : "text-[#9F1239]/70 line-through decoration-[#9F1239]/60 dark:text-[#FDA4AF]/70"}`}>
                        {p.kind === "add" ? text.replace(CITE, (_s, c) => `[${citations.indexOf(c) + 1}]`) : text}
                      </button>
                    );
                  })}
                </p>
              );
            })}
            {citations.length > 0 && (
              <aside aria-label="Citations in this suggestion" className="mt-10 border-t border-[#E6E8ED] pt-5 font-sans text-[13px] leading-relaxed dark:border-white/10">
                <p className="mb-2 font-medium text-[#172033] dark:text-white">Citations Claude added <span className="font-normal text-[#B45309]">· not verified yet</span></p>
                <ol className="list-decimal space-y-1 pl-5 text-[#475569] dark:text-[#94A3B8]">{citations.map((c) => <li key={c}>{c}</li>)}</ol>
              </aside>
            )}
          </div>
        )
      ) : null}

      {/* Review bar: only while there's a suggestion for this section (spec §5.4). */}
      {mine && !running && (effective === "changes" || effective === "side" || effective === "clean") && (
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}
          className="sticky bottom-6 z-20 mt-12 rounded-[12px] bg-[#172033] px-4 py-3 text-[13px] text-[#E5E7EB] shadow-[0_20px_40px_-16px_rgba(15,23,42,.55)]">
          <p className="mb-2.5 truncate text-[12.5px] text-[#CBD5E1]">
            <strong className="font-semibold text-white">{OP_LABEL[mine.op] ?? "Suggestion"}</strong>
            {card && <> · {card.label} · source policy: {card.policy}</>}
            {" "}· {words(editing ?? accepted).toLocaleString()} words{total ? ` · ${total - rejected.size} of ${total} changes kept` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
          {effective === "changes" && editing === null && total > 1 && <>
            <button type="button" aria-label="Previous change (K)" title="Previous change (K)" onClick={() => go(-1)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-white/10"><ArrowUp className="h-4 w-4" /></button>
            <button type="button" aria-label="Next change (J)" title="Next change (J)" onClick={() => go(1)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-white/10"><ArrowDown className="h-4 w-4" /></button>
            <button type="button" onClick={() => setRejected(rejected.size ? new Set() : new Set(Array.from({ length: total }, (_, i) => i)))} className="h-8 rounded-md px-2.5 hover:bg-white/10">{rejected.size ? "Keep all" : "Reject all"}</button>
          </>}
          <Button size="sm" className="h-8 bg-white text-[#172033] hover:bg-white/90" onClick={() => onAccept(editing ?? accepted)} title="Accept (⌘↵)"><Check className="h-4 w-4" /> Accept</Button>
          {effective === "changes" && <Button size="sm" variant="ghost" className="h-8 text-white hover:bg-white/10 hover:text-white" onClick={() => setEditing(editing === null ? accepted : null)}>{editing === null ? <><PenLine className="h-4 w-4" /> Edit first</> : <><CornerDownLeft className="h-4 w-4" /> Back to changes</>}</Button>}
          <Button size="sm" variant="ghost" className="h-8 text-white hover:bg-white/10 hover:text-white" onClick={onRedo}><RotateCcw className="h-4 w-4" /> Redo</Button>
          <Button size="sm" variant="ghost" className="h-8 text-[#CBD5E1] hover:bg-white/10 hover:text-white" onClick={onDiscard}><X className="h-4 w-4" /> Discard</Button>
          {reviewing && <span className="ml-auto hidden text-[11.5px] text-[#94A3B8] lg:inline" aria-hidden><kbd>J</kbd>/<kbd>K</kbd> move · <kbd>X</kbd> keep or reject · <kbd>⌘↵</kbd> accept</span>}
          </div>
        </motion.div>
      )}
    </div>
  );
}
