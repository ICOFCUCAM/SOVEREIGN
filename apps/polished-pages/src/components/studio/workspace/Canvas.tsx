import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, Bold, BookOpenText, Check, CornerDownLeft, Image as ImageIcon, Italic, Link2, List, ListOrdered, MessageSquarePlus, PenLine, RotateCcw, Superscript, TextQuote, Undo2, X } from "lucide-react";
import { applyFormat, insertBlock, insertFootnote, styleAt, type FormatKind } from "@/lib/markdown-format";
import { prepareImage } from "@/lib/figures";
import { TRANSLATIONS, fetchVerse, verseBlock } from "@/lib/scripture-insert";
import { fixHits, parseRules, ruleHits } from "@/lib/rule-check";
import { Button } from "@/components/ui/button";
import { SuggestionChecks } from "./EditorialCheck";
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
function GrowingText({ value, onChange, label, placeholder, className, min = 360, single, inputRef }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string; className?: string; min?: number; single?: boolean; inputRef?: React.RefObject<HTMLTextAreaElement> }) {
  const own = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? own;
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

export default function Canvas({ m, section, view, proposal, running, onBody, onTitle, onAccept, onDiscard, onRedo, onRestoreOriginal, onView, bookTrim, onTrim, designInPanel, showContents, select, onFigure, onComment, onEditParagraph, onSection, onAppend }: {
  m: Manuscript; section: Section; view: CanvasView; proposal: Proposal | null; running: boolean;
  onBody: (t: string) => void; onTitle: (t: string) => void;
  onAccept: (text: string) => void; onDiscard: () => void; onRedo: () => void; onRestoreOriginal: () => void; onView: (v: CanvasView) => void; bookTrim?: string; onTrim?: (id: string) => void; designInPanel?: boolean; showContents?: number;
  /** An image placed at the cursor (kept with the book), and a comment on the selected words (§21). */
  onFigure?: (dataUrl: string, caption: string, at: number) => void; onComment?: (quote: string, text: string) => void;
  onEditParagraph?: (setText: string) => void;
  /** Words to select in the text (a search hit, a comment), with when it was asked. */
  select?: { start: number; end: number; at: number } | null;
  /** Moves to another section: the previous and next ones, for working through the book chapter by chapter. */
  onSection?: (id: string) => void;
  /** Adds Claude's text below the section's own, instead of replacing it (as the Manuscript editor offered). */
  onAppend?: () => void;
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
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!select) return;
    const t = window.setTimeout(() => {
      const el = bodyRef.current; if (!el) return;
      el.focus(); el.setSelectionRange(select.start, select.end);
      // Scroll the selection into view: measure how far down the text it starts.
      const lines = el.value.slice(0, select.start).split("\n").length;
      const total = Math.max(1, el.value.split("\n").length);
      document.getElementById("studio-main")?.scrollTo({ top: el.offsetTop + (el.scrollHeight * (lines - 1)) / total - 200, behavior: "smooth" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [select?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  // Writing shows the text formatted or as written (with its Markdown marks); the choice is kept on this device.
  const [formatted, setFormattedState] = useState(() => { try { return localStorage.getItem("studio.formatted") === "1"; } catch { return false; } });
  const setFormatted = (v: boolean) => { setFormattedState(v); try { localStorage.setItem("studio.formatted", v ? "1" : "0"); } catch { /* storage blocked */ } };
  const header = (
    <header className="mb-10">
      <p className="mb-2 text-[12px] font-medium text-[#64748B]">{def.label}</p>
      {view === "writing" || view === "mine"
        ? <GrowingText value={section.title} onChange={onTitle} label="Section title" single min={0} className={`text-[#172033] dark:text-white ${TITLE}`} />
        : <h1 className={`text-[#172033] dark:text-white ${TITLE}`}>{section.title}</h1>}
    </header>
  );

  if (view === "book") return <BookPageView m={m} section={section} trimId={bookTrim} onTrim={onTrim} designInPanel={designInPanel} showContents={showContents} onEditParagraph={onEditParagraph} />;

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
          {!(formatted && section.body.trim()) && <FormatBar target={bodyRef} onChange={onBody} onFigure={onFigure} onComment={onComment} />}
          <RuleBar text={section.body} rules={m.rules ?? ""} onFix={onBody} onShow={(a, b) => { const el = bodyRef.current; if (el) { el.focus(); el.setSelectionRange(a, b); } }} />
          {formatted && section.body.trim()
            // Formatted (§21): headings, bold, lists and quotations as they will read; a click goes back to writing.
            ? <div role="button" tabIndex={0} aria-label={`${section.title} text, formatted: click to edit`} title="Click to edit" onClick={() => setFormatted(false)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setFormatted(false); } }} className={`${PROSE} cursor-text rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40`}><Markdown text={section.body} /></div>
            : <GrowingText inputRef={bodyRef} value={section.body} onChange={onBody} label={`${section.title} text`} className={PROSE}
                placeholder={`Write the ${def.label.toLowerCase()} here${effective === "writing" ? ", or ask Claude in the panel" : ""}.`} />}
          <p className="mt-6 flex flex-wrap items-center gap-3 text-[12px] text-[#64748B]">{words(section.body).toLocaleString()} words
            {section.body.trim() && <button type="button" aria-pressed={formatted} onClick={() => setFormatted(!formatted)} className="rounded-full border border-[#E6E8ED] px-2.5 py-0.5 hover:bg-muted dark:border-white/10">{formatted ? "Edit the text" : "Show formatted"}</button>}
          </p>
          {onSection && <SectionSteps m={m} section={section} onSection={onSection} />}
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
        ) : (<>
          <SuggestionChecks before={section.body} after={mine.text} rules={[m.rules, m.knowledge?.terminology].filter(Boolean).join("\n")} rewrite={mine.op === "rewrite" || mine.op === "voice"} />
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
        </>)
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
          {onAppend && editing === null && <Button size="sm" variant="ghost" className="h-8 text-white hover:bg-white/10 hover:text-white" onClick={onAppend} title="Keep your text and add Claude's below it">Add below</Button>}
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

/** Previous and next section, so a guided rewrite moves through the book chapter by chapter (spec §10). */
function SectionSteps({ m, section, onSection }: { m: Manuscript; section: Section; onSection: (id: string) => void }) {
  const i = m.sections.findIndex((s) => s.id === section.id);
  const prev = i > 0 ? m.sections[i - 1] : null, next = i >= 0 && i < m.sections.length - 1 ? m.sections[i + 1] : null;
  if (!prev && !next) return null;
  return (
    <nav aria-label="Previous and next section" className="mt-10 flex items-center justify-between gap-4 border-t border-[#E6E8ED] pt-4 text-[13px] dark:border-white/10">
      {prev ? <button type="button" onClick={() => onSection(prev.id)} className="min-w-0 text-left text-[#475569] hover:text-[#1D4ED8] dark:text-[#CBD5E1]"><span className="block text-[11px] uppercase tracking-[0.12em] text-[#94A3B8]">Previous</span><span className="block truncate">← {prev.title}</span></button> : <span />}
      {next && <button type="button" onClick={() => onSection(next.id)} className="min-w-0 text-right font-medium text-[#1D4ED8] hover:underline dark:text-[#93C5FD]"><span className="block text-[11px] font-normal uppercase tracking-[0.12em] text-[#94A3B8]">{next.body.trim() ? "Next" : "Next · not written yet"}</span><span className="block truncate">{next.title} →</span></button>}
    </nav>
  );
}

// The Writing toolbar (§21): paragraph style and formatting for the selected text, kept as the book's
// own marks (## headings, **bold**, > quotations, lists) so every view and export shows them.
const FMT_BTN = "grid h-8 w-8 place-items-center rounded-md text-[#334155] hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:text-[#CBD5E1] dark:hover:bg-white/10";
function FormatBar({ target, onChange, onFigure, onComment }: { target: React.RefObject<HTMLTextAreaElement>; onChange: (v: string) => void; onFigure?: (dataUrl: string, caption: string, at: number) => void; onComment?: (quote: string, text: string) => void }) {
  const [style, setStyle] = useState<ReturnType<typeof styleAt>>("paragraph");
  const [form, setForm] = useState<null | "verse" | "comment">(null);
  const [ref, setRef] = useState(""); const [tr, setTr] = useState("kjv"); const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const sel = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const file = useRef<HTMLInputElement>(null);
  const remember = () => { const t = target.current; if (t) sel.current = { start: t.selectionStart, end: t.selectionEnd }; };
  const put = (r: { text: string; start: number; end: number }) => { const t = target.current; onChange(r.text); requestAnimationFrame(() => { t?.focus(); t?.setSelectionRange(r.start, r.end); }); };
  const footnote = () => { const t = target.current; if (!t) return; put(insertFootnote(t.value, t.selectionEnd)); };
  const verse = async () => {
    const t = target.current; if (!t) return;
    setBusy(true); setErr(null);
    try { const v = await fetchVerse(ref, tr); put(insertBlock(t.value, sel.current.end, verseBlock(v))); setForm(null); setRef(""); }
    catch (e) { setErr(e instanceof Error ? e.message : "The verse couldn't be fetched."); }
    finally { setBusy(false); }
  };
  const picture = async (f: File | undefined) => {
    if (!f || !onFigure) return;
    try { const url = await prepareImage(f); const caption = window.prompt("Caption for the image (optional)", f.name.replace(/\.[^.]+$/, "")) ?? ""; onFigure(url, caption, sel.current.end); }
    catch (e) { setErr(e instanceof Error ? e.message : "The image couldn't be added."); }
  };
  const comment = () => { const t = target.current; if (!t || !onComment) return; const quote = t.value.slice(sel.current.start, sel.current.end).trim(); if (!quote || !note.trim()) return; onComment(quote, note.trim()); setNote(""); setForm(null); };
  useEffect(() => {
    const t = target.current; if (!t) return;
    const on = () => setStyle(styleAt(t.value, t.selectionStart));
    t.addEventListener("keyup", on); t.addEventListener("mouseup", on); t.addEventListener("focus", on);
    return () => { t.removeEventListener("keyup", on); t.removeEventListener("mouseup", on); t.removeEventListener("focus", on); };
  }, [target]);
  const apply = (kind: FormatKind) => {
    const t = target.current; if (!t) return;
    const url = kind === "link" ? window.prompt("Link address", "https://") : "";
    if (kind === "link" && !url) return;
    const r = applyFormat(t.value, t.selectionStart, t.selectionEnd, kind, url ?? "");
    onChange(r.text);
    requestAnimationFrame(() => { t.focus(); t.setSelectionRange(r.start, r.end); setStyle(styleAt(r.text, r.start)); });
  };
  const keep = (e: React.MouseEvent) => e.preventDefault(); // the text keeps its selection while a button is pressed
  return (
    <div role="toolbar" aria-label="Formatting" className="sticky top-0 z-10 -mx-2 mb-6 flex flex-wrap items-center gap-0.5 rounded-[12px] border border-[#E6E8ED] bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#11151C]/95">
      <select aria-label="Paragraph style" value={style} onMouseDown={(e) => e.stopPropagation()} onChange={(e) => apply(e.target.value as FormatKind)} className="h-8 rounded-md border-0 bg-transparent px-1.5 text-[13.5px] font-medium hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:hover:bg-white/10">
        <option value="paragraph">Paragraph</option><option value="heading">Heading</option><option value="subheading">Subheading</option><option value="quote">Quotation</option>
      </select>
      <span aria-hidden className="mx-1 h-5 w-px bg-[#E6E8ED] dark:bg-white/10" />
      <button type="button" onMouseDown={keep} onClick={() => apply("bold")} aria-label="Bold" title="Bold" className={FMT_BTN}><Bold className="h-4 w-4" /></button>
      <button type="button" onMouseDown={keep} onClick={() => apply("italic")} aria-label="Italic" title="Italic" className={FMT_BTN}><Italic className="h-4 w-4" /></button>
      <span aria-hidden className="mx-1 h-5 w-px bg-[#E6E8ED] dark:bg-white/10" />
      <button type="button" onMouseDown={keep} onClick={() => apply("bullets")} aria-label="Bulleted list" title="Bulleted list" className={FMT_BTN}><List className="h-4 w-4" /></button>
      <button type="button" onMouseDown={keep} onClick={() => apply("numbers")} aria-label="Numbered list" title="Numbered list" className={FMT_BTN}><ListOrdered className="h-4 w-4" /></button>
      <button type="button" onMouseDown={keep} onClick={() => apply("quote")} aria-label="Quotation" title="Quotation (set indented in the book)" className={FMT_BTN}><TextQuote className="h-4 w-4" /></button>
      <button type="button" onMouseDown={keep} onClick={() => apply("link")} aria-label="Link" title="Link" className={FMT_BTN}><Link2 className="h-4 w-4" /></button>
      <span aria-hidden className="mx-1 h-5 w-px bg-[#E6E8ED] dark:bg-white/10" />
      <button type="button" onMouseDown={keep} onClick={footnote} aria-label="Footnote" title="Footnote (set as a note at the end of the chapter)" className={FMT_BTN}><Superscript className="h-4 w-4" /></button>
      {onFigure && <button type="button" onMouseDown={keep} onClick={() => { remember(); file.current?.click(); }} aria-label="Image" title="Image or figure, with a caption" className={FMT_BTN}><ImageIcon className="h-4 w-4" /></button>}
      <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { void picture(e.target.files?.[0]); e.target.value = ""; }} />
      <button type="button" onMouseDown={keep} onClick={() => { remember(); setForm(form === "verse" ? null : "verse"); setErr(null); }} aria-pressed={form === "verse"} aria-label="Insert a scripture verse" title="Insert a scripture verse, word for word" className={FMT_BTN}><BookOpenText className="h-4 w-4" /></button>
      {onComment && <button type="button" onMouseDown={keep} onClick={() => { remember(); setForm(form === "comment" ? null : "comment"); setErr(null); }} aria-pressed={form === "comment"} aria-label="Comment on the selected words" title="Comment on the selected words" className={FMT_BTN}><MessageSquarePlus className="h-4 w-4" /></button>}
      {form === "verse" && (
        <form onSubmit={(e) => { e.preventDefault(); void verse(); }} className="flex w-full flex-wrap items-center gap-2 border-t border-[#F1F5F9] pt-2 dark:border-white/5">
          <input autoFocus value={ref} onChange={(e) => setRef(e.target.value)} aria-label="Scripture reference" placeholder="e.g. Malachi 3:6 or Psalm 23:1-3" className="h-8 min-w-[200px] flex-1 rounded-md border border-input bg-background px-2 text-[13.5px]" />
          <select value={tr} onChange={(e) => setTr(e.target.value)} aria-label="Translation" className="h-8 rounded-md border border-input bg-background px-1.5 text-[13px]">{TRANSLATIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
          <button type="submit" disabled={!ref.trim() || busy} className="h-8 rounded-md bg-[#172033] px-3 text-[13px] font-medium text-white disabled:opacity-50">{busy ? "Fetching…" : "Insert"}</button>
          <span className="w-full text-[12px] text-[#64748B]">Inserted word for word as a quotation, with its reference. The book's naming rules apply to your words, not to quoted scripture.</span>
        </form>
      )}
      {form === "comment" && (
        <form onSubmit={(e) => { e.preventDefault(); comment(); }} className="flex w-full flex-wrap items-center gap-2 border-t border-[#F1F5F9] pt-2 dark:border-white/5">
          <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} aria-label="Comment" placeholder={sel.current.end > sel.current.start ? "Your comment on the selected words" : "Select some words in the text first"} className="h-8 min-w-[200px] flex-1 rounded-md border border-input bg-background px-2 text-[13.5px]" />
          <button type="submit" disabled={!note.trim() || sel.current.end <= sel.current.start} className="h-8 rounded-md bg-[#172033] px-3 text-[13px] font-medium text-white disabled:opacity-50">Add comment</button>
        </form>
      )}
      {err && <p role="alert" className="w-full pt-1 text-[12.5px] text-[#B91C1C]">{err}</p>}
    </div>
  );
}

// The live rule checker (§21): words in this section that break the book's rules, outside quotations,
// each shown on request, all fixed with one click (Undo puts them back).
function RuleBar({ text, rules, onFix, onShow }: { text: string; rules: string; onFix: (v: string) => void; onShow: (start: number, end: number) => void }) {
  const parsed = useMemo(() => parseRules(rules), [rules]);
  const hits = useMemo(() => (parsed.length ? ruleHits(text, parsed) : []), [text, parsed]);
  if (!hits.length) return null;
  const n = hits.reduce((k, h) => k + h.matches.length, 0);
  return (
    <div role="status" className="-mt-3 mb-6 flex flex-wrap items-center gap-2 rounded-[10px] border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[13px]">
      <span className="font-medium">{n} {n === 1 ? "word doesn't" : "words don't"} follow the book's rules:</span>
      {hits.map((h) => (
        <button key={h.rule.wrong} type="button" onClick={() => onShow(h.matches[0].index, h.matches[0].index + h.matches[0].length)} title="Show it in the text" className="rounded-full bg-white/70 px-2 py-0.5 text-[12.5px] hover:bg-white dark:bg-white/10">
          {h.rule.wrong} ×{h.matches.length} → {h.rule.right}
        </button>
      ))}
      <button type="button" onClick={() => onFix(fixHits(text, hits))} className="ml-auto rounded-md bg-[#172033] px-2.5 py-1 text-[12.5px] font-medium text-white hover:bg-[#172033]/90">Fix outside quotations</button>
    </div>
  );
}
