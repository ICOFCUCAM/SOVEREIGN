import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Info, Loader2, ScanSearch, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AREA_CODE, AREA_LABEL, CHECKS, auditBook, auditMarkdown, correctionBrief, suggestedFix, type AuditArea, type AuditFinding, type AuditPlace } from "@/lib/editorial-audit";
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

/** The author's dismissals of review items, kept on this device (a convenience; blockers can never be dismissed). */
function useDismissed(key?: string) {
  const read = () => { try { return new Set<string>(key ? JSON.parse(localStorage.getItem(key) ?? "[]") : []); } catch { return new Set<string>(); } };
  const [set, setSet] = useState<Set<string>>(read);
  useEffect(() => { setSet(read()); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (id: string) => setSet((old) => {
    const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id);
    try { if (key) localStorage.setItem(key, JSON.stringify([...next])); } catch { /* storage unavailable */ }
    return next;
  });
  return [set, toggle] as const;
}

export default function EditorialCheck({ text, rules, original, title = "Editorial check", onPlace, placeLabel = "Open", onCorrect, storageKey }: {
  text: string; rules?: string;
  /** Loads the author's original for the faithfulness comparison; omitted when there is none to compare. */
  original?: () => Promise<string>;
  title?: string;
  /** Takes the author to a place in the book (the passage in the text, or its section in Finish). */
  onPlace?: (p: AuditPlace) => void; placeLabel?: string;
  /** Starts a targeted correction of the selected findings (stage 5, DESIGN-SPEC.md §15b). */
  onCorrect?: (brief: string) => void;
  /** Where the author's dismissals of review items are remembered. */
  storageKey?: string;
}) {
  const audit = useMemo(() => auditBook(text, { rules }), [text, rules]);
  const [fidelity, setFidelity] = useState<FidelityReport | null>(null);
  const [comparing, setComparing] = useState(false);
  const [why, setWhy] = useState<string | null>(null);
  const [dismissed, toggleDismissed] = useDismissed(storageKey);
  const [unselected, setUnselected] = useState<Set<string>>(new Set());

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
  // Each finding's code within its area (S1, C2…), stable for this text.
  const codes = useMemo(() => { const n: Record<string, number> = {}; return new Map(findings.map((f) => [f.id, `${AREA_CODE[f.area]}${(n[f.area] = (n[f.area] ?? 0) + 1)}`])); }, [findings]);
  // A dismissal holds for the finding as it stands: if its text changes (more places, a new count), it is open again.
  const dkey = (f: AuditFinding) => `${f.id}|${f.text}`;
  const isDismissed = (f: AuditFinding) => f.level !== "blocker" && dismissed.has(dkey(f));
  const open = findings.filter((f) => !isDismissed(f));
  const blockers = open.filter((f) => f.level === "blocker").length;
  const reviews = open.filter((f) => f.level === "review").length;
  const selected = open.filter((f) => f.level !== "note" && !unselected.has(f.id));
  const fidelityRan = Boolean(fidelity);
  const download = () => {
    const report = auditMarkdown({ ...audit, findings: open, blockers, reviews, notes: open.length - blockers - reviews, ready: blockers === 0 }, title);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([report], { type: "text/markdown;charset=utf-8" }));
    a.download = "editorial-check.md"; a.click(); URL.revokeObjectURL(a.href);
  };
  const s = fidelity?.stats;
  const checksRun = CHECKS.filter((c) => c.area !== "fidelity" || original);

  return (
    <section aria-label={title} className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <ScanSearch className="h-5 w-5 text-[#2563EB]" aria-hidden />
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <span role="status" className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${blockers ? LEVEL.blocker.tone : "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"}`}>
          {comparing ? "Checking…" : blockers ? `${blockers} to fix before publishing` : "No blocking problems found by the code checks"}{reviews ? ` · ${reviews} for your decision` : ""}{findings.some(isDismissed) ? ` · ${findings.filter(isDismissed).length} dismissed` : ""}
        </span>
        <span className="ml-auto flex gap-1">
          {onCorrect && selected.length > 0 && <Button size="sm" variant="outline" disabled={comparing} onClick={() => onCorrect(correctionBrief(selected))}><Wand2 className="h-4 w-4" /> Correct {selected.length} selected with Claude</Button>}
          <Button size="sm" variant="ghost" onClick={download}><Download className="h-4 w-4" /> Report (.md)</Button>
        </span>
      </div>
      <p className="text-[12.5px] text-[#64748B]">Checked by code, the same way every time; it points to problems and never changes the text. <strong className="font-medium">Fix</strong> blocks publishing. <strong className="font-medium">Review</strong> needs your decision. These checks cannot judge whether an argument holds or a teaching is right: that stays with you.</p>

      <details className="rounded-[10px] border border-[#E6E8ED] px-4 py-2.5 text-[12.5px] dark:border-white/10">
        <summary className="cursor-pointer font-medium">What was checked ({checksRun.length} checks{original && !fidelityRan && !comparing ? ", faithfulness not run" : ""})</summary>
        <ul className="mt-2 space-y-1">
          {CHECKS.map((c) => {
            const ran = c.area !== "fidelity" || fidelityRan;
            const n = open.filter((f) => f.area === c.area).length;
            return <li key={c.area} className="flex gap-2"><span className={`w-[92px] shrink-0 font-medium ${ran ? (n ? "text-[#92400E] dark:text-amber-300" : "text-[#047857] dark:text-emerald-400") : "text-[#64748B]"}`}>{!ran ? (comparing ? "Running…" : "Not run") : n ? `${n} found` : "Passed"}</span><span><strong className="font-medium">{AREA_LABEL[c.area]}</strong>: {c.what}{!ran && !comparing ? (original ? ` (${why ?? "no original"})` : " (no original for this result)") : ""}</span></li>;
          })}
        </ul>
      </details>

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

      {findings.length === 0 && !comparing && <p className="inline-flex items-center gap-2 text-[13.5px] text-[#047857] dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> The code checks found no problems. Judgement-level review (arguments, teaching) is still yours.</p>}
      {(Object.keys(AREA_LABEL) as AuditArea[]).map((area) => {
        const fs = findings.filter((f) => f.area === area);
        if (!fs.length) return null;
        return (
          <div key={area}>
            <p className={`${EYEBROW} mb-2`}>{AREA_LABEL[area]}</p>
            <ul className="space-y-2">
              {fs.map((f) => {
                const gone = isDismissed(f);
                const pick = onCorrect && f.level !== "note" && !gone;
                return (
                <li key={f.id} className={`rounded-[10px] border border-[#E6E8ED] px-3 py-2.5 dark:border-white/10 ${gone ? "opacity-60" : ""}`}>
                  <div className="flex gap-2.5 text-[13.5px]">
                    {pick ? <input type="checkbox" aria-label={`Include ${codes.get(f.id)} in the correction`} checked={!unselected.has(f.id)} onChange={() => setUnselected((u) => { const n = new Set(u); if (n.has(f.id)) n.delete(f.id); else n.add(f.id); return n; })} className="mt-1 h-3.5 w-3.5 shrink-0 accent-[#2563EB]" /> : <span className="w-3.5 shrink-0" />}
                    <span className="mt-0.5 w-7 shrink-0 font-mono text-[11.5px] text-[#64748B]">{codes.get(f.id)}</span>
                    <span className={`mt-0.5 h-fit shrink-0 rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold ${LEVEL[f.level].tone}`}>{gone ? "Dismissed" : LEVEL[f.level].label}</span>
                    <span className="min-w-0 flex-1">{f.level === "blocker" ? <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-[#B91C1C]" aria-hidden /> : f.level === "note" ? <Info className="mr-1 inline h-3.5 w-3.5 text-[#64748B]" aria-hidden /> : null}{f.text}
                      <span className="mt-1 block text-[12.5px] text-[#475569] dark:text-[#CBD5E1]"><span className="font-medium">Suggested: </span>{suggestedFix(f)}</span>
                    </span>
                    {f.level !== "blocker" && <button type="button" onClick={() => toggleDismissed(dkey(f))} className="h-fit shrink-0 text-[12px] font-medium text-[#64748B] hover:text-[#172033] hover:underline dark:hover:text-white">{gone ? "Reopen" : "Dismiss"}</button>}
                  </div>
                  {f.places.length > 0 && (
                    <details className="mt-1.5 pl-[78px]">
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
              ); })}
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
