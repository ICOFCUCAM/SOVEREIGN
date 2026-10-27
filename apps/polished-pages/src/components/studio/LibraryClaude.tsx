import { useMemo, useState } from "react";
import { Check, Loader2, MessageSquare, Sparkles, TextSelect, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiAskInLibrary, apiReviseInLibrary } from "@/lib/studio-backend";
import { diffText } from "@/lib/word-diff";

// Claude on a book in the Library, for the owner only (DESIGN-SPEC.md §18): correct or
// rewrite one part of the book as the owner asks, review the change word by word, and
// accept it into the book (Save changes keeps the earlier text in History); or ask a
// question about the book. Whole-book rewriting and rebuilding stay in Claude Studio.

/** The book's parts: each heading with the text under it, and where it sits in the Markdown. */
export function bookParts(md: string): { title: string; start: number; end: number }[] {
  const heads = [...md.matchAll(/^#{1,3}\s+(.+)$/gm)].map((m) => ({ title: m[1].replace(/[*_]/g, "").trim(), start: m.index! }));
  if (!heads.length) return md.trim() ? [{ title: "The whole text", start: 0, end: md.length }] : [];
  const parts = heads.map((h, i) => ({ ...h, end: i + 1 < heads.length ? heads[i + 1].start : md.length }));
  return heads[0].start > 0 && md.slice(0, heads[0].start).trim() ? [{ title: "Opening (before the first heading)", start: 0, end: heads[0].start }, ...parts] : parts;
}

const ASKS = [
  "Correct the English: grammar, spelling, punctuation and awkward sentences. Change nothing else.",
  "Rewrite this professionally: clear, precise, well-organised prose that keeps every idea, conviction, quotation and scripture.",
  "Make it clearer and tighter without losing any point.",
];
const DEFAULT_RULES = "Write Yahusha instead of Jesus and Yahuah instead of God; never Jehovah or Yahweh. Do not change direct quotations except for these names.";
const rulesKey = (id: string) => `library.claude.rules.${id}`;

export default function LibraryClaude({ docId, title, markdown, onChange }: { docId: string; title: string; markdown: string; onChange: (md: string) => void }) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"correct" | "ask">("correct");
  const parts = useMemo(() => bookParts(markdown), [markdown]);
  const [pick, setPick] = useState<string>("0");
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [instruction, setInstruction] = useState(ASKS[0]);
  const [rules, setRules] = useState(() => { try { return localStorage.getItem(rulesKey(docId)) ?? DEFAULT_RULES; } catch { return DEFAULT_RULES; } });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ start: number; end: number; before: string; after: string } | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const keepRules = (v: string) => { setRules(v); try { localStorage.setItem(rulesKey(docId), v); } catch { /* storage blocked */ } };

  const range = pick === "selection" && selection ? selection : parts[Number(pick)] ?? null;
  const useSelection = () => {
    const text = window.getSelection()?.toString().trim() ?? "";
    const at = text ? markdown.indexOf(text) : -1;
    if (at < 0) { toast({ title: text ? "That selection couldn't be found in the book's text" : "Select some text in the book first", description: text ? "It may cross headings or formatting. Choose the part from the list instead." : "Highlight a sentence or paragraph on the page, then press this again.", variant: "destructive" }); return; }
    setSelection({ start: at, end: at + text.length }); setPick("selection");
  };

  const run = async () => {
    if (!range) return;
    setBusy(true); setResult(null);
    try {
      const before = markdown.slice(range.start, range.end);
      const context = `${markdown.slice(Math.max(0, range.start - 2500), range.start)}\n[…the passage…]\n${markdown.slice(range.end, range.end + 2500)}`;
      const after = await apiReviseInLibrary({ title, passage: before, instruction, rules, context });
      setResult({ ...range, before, after });
    } catch (e) { toast({ title: "Claude couldn't finish", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setBusy(false); }
  };
  const accept = () => {
    if (!result) return;
    // The passage must still be where Claude read it; otherwise nothing is replaced.
    if (markdown.slice(result.start, result.end) !== result.before) { toast({ title: "The book changed meanwhile", description: "Run it again on the current text.", variant: "destructive" }); return; }
    const lead = result.before.match(/^\s*/)![0], tail = result.before.match(/\s*$/)![0];
    onChange(markdown.slice(0, result.start) + lead + result.after.trim() + tail + markdown.slice(result.end));
    setResult(null); setSelection(null); setPick("0");
    toast({ title: "Changed in the book", description: "Press Save changes to keep it. The earlier text stays in History." });
  };
  const ask = async () => {
    setBusy(true); setAnswer(null);
    try { setAnswer(await apiAskInLibrary({ title, book: markdown, question, rules })); }
    catch (e) { toast({ title: "Claude couldn't answer", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setBusy(false); }
  };
  const diff = useMemo(() => (result ? diffText(result.before, result.after).flatMap((b) => [...b.parts, { kind: "same" as const, text: "\n\n" }]) : []), [result]);

  return (
    <section aria-label="Claude on this book" className="mb-6 rounded-xl border border-primary/25 bg-card p-4 font-sans">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Claude on this book</p>
        <div role="tablist" aria-label="Claude" className="ml-2 flex rounded-lg border border-border p-0.5 text-[12.5px]">
          {(["correct", "ask"] as const).map((m) => <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-md px-2.5 py-1 ${mode === m ? "bg-muted font-medium" : ""}`}>{m === "correct" ? "Correct a part" : "Ask about the book"}</button>)}
        </div>
        <span className="ml-auto text-[11.5px] text-muted-foreground">On the API · billed per use · only you see this</span>
      </div>

      {mode === "correct" ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="The part to work on" value={pick} onChange={(e) => setPick(e.target.value)} className="h-9 max-w-[420px] rounded-md border border-border bg-background px-2 text-sm">
              {selection && <option value="selection">The text I selected ({markdown.slice(selection.start, selection.end).split(/\s+/).length} words)</option>}
              {parts.map((p, i) => <option key={i} value={String(i)}>{p.title}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={useSelection}><TextSelect className="h-4 w-4" /> Use the text I selected</Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ASKS.map((a) => <button key={a} type="button" onClick={() => setInstruction(a)} className={`rounded-full border px-2.5 py-1 text-[12px] ${instruction === a ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}>{a.split(":")[0]}</button>)}
          </div>
          <Textarea aria-label="What Claude should do" value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={2} className="text-sm" />
          <details className="text-[12.5px]"><summary className="cursor-pointer text-muted-foreground">The book's rules (Claude follows them)</summary>
            <Textarea aria-label="The book's rules" value={rules} onChange={(e) => keepRules(e.target.value)} rows={2} className="mt-1.5 text-sm" /></details>
          <Button size="sm" disabled={busy || !range || !instruction.trim()} onClick={run}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Ask Claude</Button>
          {result && (
            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-[12px] text-muted-foreground">Claude's change: <del className="bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300">removed</del> and <ins className="bg-blue-50 no-underline dark:bg-blue-500/20">added</ins>. Nothing changes until you accept.</p>
              <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap font-serif text-[15px] leading-relaxed">
                {diff.map((p, i) => p.kind === "del" ? <del key={i} className="bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300">{p.text}</del> : p.kind === "add" ? <ins key={i} className="bg-blue-50 no-underline dark:bg-blue-500/20">{p.text}</ins> : <span key={i}>{p.text}</span>)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={accept}><Check className="h-4 w-4" /> Accept into the book</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={run}>Try again</Button>
                <Button size="sm" variant="ghost" onClick={() => setResult(null)}><X className="h-4 w-4" /> Discard</Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <Textarea aria-label="Your question" value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} placeholder="e.g. Where does the book repeat itself? List every scripture in the Introduction. Which sentences read badly?" className="text-sm" />
          <Button size="sm" disabled={busy || !question.trim()} onClick={ask}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />} Ask</Button>
          {answer && <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm">{answer}</div>}
        </div>
      )}
      <p className="mt-3 text-[12px] text-muted-foreground">For the whole book at once (rewrite, rebuild as a professional book, editorial check, compare with the original) and to run on your Claude Code, open it in Claude Studio.</p>
    </section>
  );
}
