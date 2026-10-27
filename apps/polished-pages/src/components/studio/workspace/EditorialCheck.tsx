import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Info, Loader2, ScanSearch, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AREA_LABEL, auditBook, auditMarkdown, correctionBrief, type AuditArea, type AuditFinding, type AuditPlace } from "@/lib/editorial-audit";
import { compareFidelity, type FidelityReport } from "@/lib/fidelity";
import { EYEBROW } from "./ui";

// The editorial check (DESIGN-SPEC.md §15): the deterministic audit of a whole
// book, and, when the original is available, its faithfulness to it. Shown on a
// whole-book rewrite and in Finish before export. It reports; it never edits.
const LEVEL = {
  blocker: { label: "Fix", tone: "bg-[#FEF2F2] text-[#B91C1C] dark:bg-red-500/15 dark:text-red-300" },
  review: { label: "Review", tone: "bg-[#FFFBEB] text-[#92400E] dark:bg-amber-500/15 dark:text-amber-300" },
  note: { label: "Note", tone: "bg-[#F1F5F9] text-[#475569] dark:bg-white/10 dark:text-[#CBD5E1]" },
} as const;

export default function EditorialCheck({ text, rules, original, title = "Editorial check", onPlace, placeLabel = "Open", onCorrect }: {
  text: string; rules?: string;
  /** Loads the author's original for the faithfulness comparison; omitted when there is none to compare. */
  original?: () => Promise<string>;
  title?: string;
  /** Takes the author to a place in the book (Finish opens the section). */
  onPlace?: (p: AuditPlace) => void; placeLabel?: string;
  /** Starts a targeted correction of these findings (stage 5, DESIGN-SPEC.md §15b). */
  onCorrect?: (brief: string) => void;
}) {
  const audit = useMemo(() => auditBook(text, { rules }), [text, rules]);
  const [fidelity, setFidelity] = useState<FidelityReport | null>(null);
  const [comparing, setComparing] = useState(false);
  const [why, setWhy] = useState<string | null>(null);

  useEffect(() => {
    if (!original) return;
    let live = true;
    setComparing(true); setWhy(null);
    original().then((o) => { if (!live) return; if (o.trim()) setFidelity(compareFidelity(o, text, { rules })); else setWhy("No readable original in this project's sources, so faithfulness can't be compared."); })
      .catch(() => { if (live) setWhy("The original couldn't be read, so faithfulness can't be compared."); })
      .finally(() => { if (live) setComparing(false); });
    return () => { live = false; };
  }, [original, text, rules]);

  const findings: AuditFinding[] = useMemo(() => [...(fidelity?.findings ?? []), ...audit.findings], [fidelity, audit]);
  const blockers = findings.filter((f) => f.level === "blocker").length;
  const reviews = findings.filter((f) => f.level === "review").length;
  const download = () => {
    const report = auditMarkdown({ ...audit, findings, blockers, reviews, notes: findings.length - blockers - reviews, ready: blockers === 0 }, title);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([report], { type: "text/markdown;charset=utf-8" }));
    a.download = "editorial-check.md"; a.click(); URL.revokeObjectURL(a.href);
  };
  const s = fidelity?.stats;

  return (
    <section aria-label={title} className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <ScanSearch className="h-5 w-5 text-[#2563EB]" aria-hidden />
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <span role="status" className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${blockers ? LEVEL.blocker.tone : "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"}`}>
          {blockers ? `${blockers} to fix before publishing` : "Nothing blocks publishing"}{reviews ? ` · ${reviews} to review` : ""}
        </span>
        <span className="ml-auto flex gap-1">
          {onCorrect && (blockers > 0 || reviews > 0) && <Button size="sm" variant="outline" disabled={comparing} onClick={() => onCorrect(correctionBrief(findings))}><Wand2 className="h-4 w-4" /> Correct these with Claude</Button>}
          <Button size="sm" variant="ghost" onClick={download}><Download className="h-4 w-4" /> Report (.md)</Button>
        </span>
      </div>
      <p className="text-[12.5px] text-[#64748B]">Checked by code, the same way every time: numbering, unfinished markers, references, front matter against the contents, certainty, terminology and sensitive claims{original ? ", and faithfulness to your original" : ""}. It points to problems; it never changes the text. Matters of judgement are marked Review, for you to decide.</p>

      {original && (
        <div className="rounded-[10px] border border-[#E6E8ED] px-4 py-3 text-[13px] dark:border-white/10">
          <p className={EYEBROW}>Against your original</p>
          {comparing ? <p className="mt-1 inline-flex items-center gap-2 text-[#64748B]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Comparing with your sources…</p>
            : why ? <p className="mt-1 text-[#64748B]">{why}</p>
            : s && <ul className="mt-1.5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                <li>Scripture references kept: {s.refsKept} of {s.refsKept + s.refsLost}{s.refsAdded ? ` · ${s.refsAdded} new` : ""}</li>
                <li>Quotations kept word for word: {s.quotesKept} of {s.quotesKept + s.quotesLost}</li>
                <li>Qualifying sentences: {s.qualifiersOriginal} in the original, {s.qualifiersRewrite} in the rewrite</li>
                <li>Sentences copied unchanged: {Math.round(s.copiedShare * 100)}% (a rewrite re-expresses the ideas)</li>
                <li>Length: {s.rewriteWords.toLocaleString()} words, from {s.originalWords.toLocaleString()}</li>
              </ul>}
        </div>
      )}

      {findings.length === 0 && !comparing && <p className="inline-flex items-center gap-2 text-[13.5px] text-[#047857] dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> No problems found by the checks.</p>}
      {(Object.keys(AREA_LABEL) as AuditArea[]).map((area) => {
        const fs = findings.filter((f) => f.area === area);
        if (!fs.length) return null;
        return (
          <div key={area}>
            <p className={`${EYEBROW} mb-2`}>{AREA_LABEL[area]}</p>
            <ul className="space-y-2">
              {fs.map((f) => (
                <li key={f.id} className="rounded-[10px] border border-[#E6E8ED] px-3 py-2.5 dark:border-white/10">
                  <div className="flex gap-2.5 text-[13.5px]">
                    <span className={`mt-0.5 h-fit shrink-0 rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold ${LEVEL[f.level].tone}`}>{LEVEL[f.level].label}</span>
                    <span className="min-w-0">{f.level === "blocker" ? <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-[#B91C1C]" aria-hidden /> : f.level === "note" ? <Info className="mr-1 inline h-3.5 w-3.5 text-[#64748B]" aria-hidden /> : null}{f.text}</span>
                  </div>
                  {f.places.length > 0 && (
                    <details className="mt-1.5 pl-[46px]">
                      <summary className="cursor-pointer text-[12.5px] text-[#2563EB]">Where ({f.places.length}{f.places.length >= 8 ? "+" : ""})</summary>
                      <ul className="mt-1.5 space-y-1.5">
                        {f.places.map((p, i) => (
                          <li key={i} className="text-[12.5px] text-[#475569] dark:text-[#CBD5E1]">
                            {p.line > 0 && <span className="mr-1.5 font-medium text-[#64748B]">{p.heading && p.heading !== "(before the first heading)" ? `${p.heading} · ` : ""}line {p.line}</span>}
                            <span className="font-['Newsreader',Georgia,serif] text-[13.5px]">{p.excerpt}</span>
                            {onPlace && p.line > 0 && <button type="button" onClick={() => onPlace(p)} className="ml-2 font-medium text-[#2563EB] hover:underline">{placeLabel}</button>}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

/**
 * The checks on one suggestion for one section, shown above its changes: what
 * the suggestion lost or added against the author's text (scripture,
 * quotations, qualifications, new names), and unfinished markers it introduced.
 */
export function SuggestionChecks({ before, after, rules, rewrite }: { before: string; after: string; rules?: string; /** A rewrite should re-express the text; other actions may keep it. */ rewrite: boolean }) {
  const findings = useMemo(() => {
    if (!before.trim()) return [];
    const f = compareFidelity(before, after, { rules }).findings.filter((x) => (rewrite || (x.id !== "copied" && x.id !== "longer")) && x.id !== "heads-lost");
    const introduced = auditBook(after, { rules }).findings.filter((x) => ["placeholders", "artifacts", "caps", "rules", "quotes"].includes(x.id) && !auditBook(before, { rules }).findings.some((y) => y.id === x.id));
    return [...f, ...introduced].sort((a, b) => ["blocker", "review", "note"].indexOf(a.level) - ["blocker", "review", "note"].indexOf(b.level));
  }, [before, after, rules, rewrite]);
  if (!before.trim()) return null;
  return (
    <aside aria-label="Checks on this suggestion" className="mb-8 rounded-[10px] border border-[#E6E8ED] px-4 py-3 font-sans text-[13px] dark:border-white/10">
      {findings.length === 0
        ? <p className="inline-flex items-center gap-2 text-[#047857] dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Checked against your text: scripture, quotations and qualifications kept; nothing unfinished added.</p>
        : <>
            <p className="font-medium text-[#172033] dark:text-white">Checked against your text: {findings.length} {findings.length === 1 ? "point" : "points"} before you accept</p>
            <ul className="mt-2 space-y-1.5">
              {findings.map((f) => (
                <li key={f.id} className="flex gap-2">
                  <span className={`mt-0.5 h-fit shrink-0 rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold ${LEVEL[f.level].tone}`}>{LEVEL[f.level].label}</span>
                  <span className="min-w-0">{f.text}
                    {f.places.length > 0 && <details className="mt-1"><summary className="cursor-pointer text-[12.5px] text-[#2563EB]">Show</summary>
                      <ul className="mt-1 space-y-1 text-[12.5px] text-[#475569] dark:text-[#CBD5E1]">{f.places.map((p, i) => <li key={i} className="font-['Newsreader',Georgia,serif] text-[13.5px]">{p.excerpt}</li>)}</ul></details>}
                  </span>
                </li>
              ))}
            </ul>
          </>}
    </aside>
  );
}
