import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compareBook, restoreParagraph, type BookComparison, type CompareRow } from "@/lib/compare-book";
import { diffText } from "@/lib/word-diff";
import { EYEBROW } from "./ui";

// Original against rewrite, side by side, chapter by chapter (DESIGN-SPEC.md
// §16). The original is read from the project's sources and never changed; the
// author can put the original wording of any paragraph back into the rewrite.
const isHeading = (r: CompareRow) => Boolean(r.rewrite && /^#{1,6}\s/.test(r.rewrite.text.trim()));
/** What needs a look: anything not simply rewritten from one of the author's paragraphs (headings aside). */
const attention = (r: CompareRow) => !isHeading(r) && (r.kind !== "rewritten" || r.flags.length > 0);
/** Markdown marks off for reading: a heading reads as a heading. */
const readable = (t: string) => t.replace(/^#{1,6}\s+/gm, "").replace(/\*\*|__/g, "");
const KIND: Record<CompareRow["kind"], { label: string; tone: string }> = {
  rewritten: { label: "Rewritten", tone: "text-[#1D4ED8] dark:text-[#93C5FD]" },
  unchanged: { label: "Copied unchanged", tone: "text-[#92400E] dark:text-amber-300" },
  new: { label: "Only in the rewrite", tone: "text-[#7C3AED] dark:text-violet-300" },
  "not-in-rewrite": { label: "Not in the rewrite", tone: "text-[#B91C1C] dark:text-red-300" },
};

export default function CompareView({ text, rules, original, onChange }: {
  text: string; rules?: string;
  original: () => Promise<string>;
  /** The rewrite with a paragraph put back to the original wording. */
  onChange: (next: string) => void;
}) {
  const [source, setSource] = useState<string | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const [chapter, setChapter] = useState(0);
  const [only, setOnly] = useState<"all" | "attention">("attention");

  useEffect(() => {
    let live = true;
    original().then((o) => { if (live) { if (o.trim()) setSource(o); else setWhy("No readable original in this project's sources, so the rewrite can't be compared. Upload the original (or read scanned pages first)."); } })
      .catch(() => { if (live) setWhy("The original couldn't be read, so the rewrite can't be compared."); });
    return () => { live = false; };
  }, [original]);

  // Chapters with nothing in them (a title heading) are left out of the list.
  const cmp: BookComparison | null = useMemo(() => { if (!source) return null; const c = compareBook(source, text, { rules }); return { ...c, chapters: c.chapters.filter((x) => x.rows.length) }; }, [source, text, rules]);
  if (why) return <p role="status" className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">{why}</p>;
  if (!cmp) return <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading your original…</p>;

  if (!cmp.chapters.length) return <p role="status" className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">The rewrite has no paragraphs to compare.</p>;
  const ch = cmp.chapters[Math.min(chapter, cmp.chapters.length - 1)];
  const rows = ch.rows.filter((r) => only === "all" || attention(r));
  const s = cmp.summary;

  return (
    <section aria-label="Compare with your original" className="space-y-4">
      <div className="rounded-[10px] border border-[#E6E8ED] px-4 py-3 text-[13px] dark:border-white/10">
        <p className={EYEBROW}>What changed</p>
        <p className="mt-1">{s.rewritten.toLocaleString()} paragraphs rewritten · <span className={KIND.unchanged.tone}>{s.unchanged} copied unchanged</span> · <span className={KIND.new.tone}>{s.added} only in the rewrite</span> · <span className={KIND["not-in-rewrite"].tone}>{s.notInRewrite} of your paragraphs not in the rewrite</span> · {s.flagged} with scripture, numbers or quotations changed</p>
        <p className="mt-1 text-[12px] text-[#64748B]">Paragraphs are paired by the words they share, in the book's order: an aid to your reading, not a verdict. Your original is never changed. Your book's rules are applied to the original first.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[12.5px] font-medium" htmlFor="cmp-chapter">Chapter</label>
        <select id="cmp-chapter" value={chapter} onChange={(e) => setChapter(Number(e.target.value))} className="h-8 max-w-[360px] rounded-[8px] border border-border bg-background px-2 text-[13px]">
          {cmp.chapters.map((c, i) => <option key={i} value={i}>{c.title} ({c.rows.filter(attention).length} to look at)</option>)}
        </select>
        <Button size="sm" variant="ghost" disabled={chapter === 0} onClick={() => setChapter((c) => c - 1)}>Previous</Button>
        <Button size="sm" variant="ghost" disabled={chapter >= cmp.chapters.length - 1} onClick={() => setChapter((c) => c + 1)}>Next</Button>
        <div role="radiogroup" aria-label="Show" className="ml-auto flex rounded-[8px] border border-border p-0.5 text-[12.5px]">
          {(["attention", "all"] as const).map((v) => <button key={v} type="button" role="radio" aria-checked={only === v} onClick={() => setOnly(v)} className={`rounded-[6px] px-2.5 py-1 ${only === v ? "bg-muted font-medium" : ""}`}>{v === "attention" ? "What needs a look" : "Every paragraph"}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 border-b border-border pb-1 text-[12px] font-medium text-[#64748B]"><span>Your original</span><span>The rewrite</span></div>
      {rows.length === 0 && <p className="text-[13px] text-[#64748B]">Nothing in this chapter needs a look: every paragraph is rewritten from one of yours with its scripture, numbers and quotations intact.</p>}
      <ol className="space-y-4">
        {rows.map((r, i) => <Row key={`${chapter}-${i}`} row={r} onRestore={r.rewrite && r.original ? () => onChange(restoreParagraph(text, r.rewrite!, r.original!)) : undefined} />)}
      </ol>
    </section>
  );
}

function Row({ row, onRestore }: { row: CompareRow; onRestore?: () => void }) {
  const parts = useMemo(() => (row.original && row.rewrite && row.kind === "rewritten" ? diffText(row.original, row.rewrite.text).flatMap((b) => b.parts) : null), [row]);
  if (isHeading(row)) return <li className="pt-2 font-['Newsreader',Georgia,serif] text-[18px] font-medium">{readable(row.rewrite!.text)}</li>;
  const k = KIND[row.kind];
  return (
    <li className="rounded-[10px] border border-[#E6E8ED] p-3 dark:border-white/10">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
        <span className={`font-semibold ${k.tone}`}>{k.label}</span>
        {row.flags.map((f) => <span key={f} className="inline-flex items-center gap-1 rounded-[5px] bg-[#FFFBEB] px-1.5 py-0.5 font-medium text-[#92400E] dark:bg-amber-500/15 dark:text-amber-300"><AlertTriangle className="h-3 w-3" aria-hidden />{f}</span>)}
        {onRestore && row.kind === "rewritten" && <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={onRestore}><Undo2 className="h-3.5 w-3.5" /> Use my original wording</Button>}
      </div>
      <div className="grid grid-cols-2 gap-6 font-['Newsreader',Georgia,serif] text-[14.5px] leading-[1.6]">
        <p className="whitespace-pre-line text-[#475569] dark:text-[#94A3B8]">
          {parts ? parts.filter((p) => p.kind !== "add").map((p, i) => p.kind === "del" ? <del key={i} className="bg-[#FEF2F2] text-[#9F1239] decoration-[#9F1239]/50 dark:bg-red-500/10 dark:text-red-300">{p.text}</del> : <span key={i}>{p.text}</span>)
            : row.original ?? <span className="font-sans text-[12.5px] italic text-[#94A3B8]">No matching paragraph in your original.</span>}
        </p>
        <p className="whitespace-pre-line">
          {parts ? parts.filter((p) => p.kind !== "del").map((p, i) => p.kind === "add" ? <ins key={i} className="bg-[#EAF1FF] no-underline dark:bg-[#1E3A8A]/40">{p.text}</ins> : <span key={i}>{p.text}</span>)
            : row.rewrite ? readable(row.rewrite.text) : <span className="font-sans text-[12.5px] italic text-[#94A3B8]">Not in the rewrite.</span>}
        </p>
      </div>
    </li>
  );
}
