import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CheckCircle2, History, Loader2, RotateCcw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Markdown from "@/components/studio/Markdown";
import { AREA_LABEL, CHECKS, auditBook, type AuditFinding } from "@/lib/editorial-audit";
import { compareFidelity } from "@/lib/fidelity";
import { diffText } from "@/lib/word-diff";
import type { ApprovalSummary, ResultHistory } from "@/lib/claude-studio";
import { EYEBROW } from "./ui";

// Versions of a whole-book result and its approval as publication-ready
// (DESIGN-SPEC.md §16). Every rerun, correction, saved edit and restore is a
// numbered version kept by the runner (or this browser); nothing is lost.
// Approval belongs to one version and lapses when a newer one is saved.

export type ResultStatus = { label: string; tone: "draft" | "approved" | "lapsed" | "unsaved" };

export function resultStatus(h: ResultHistory | null, edited: boolean): ResultStatus {
  const latest = h?.versions.at(-1);
  if (edited) return { label: "Edited, not saved as a version", tone: "unsaved" };
  if (!latest) return { label: "Draft", tone: "draft" };
  const a = h?.approval;
  if (a && a.version === latest.n) return { label: `Approved for publication · version ${a.version}${a.by ? ` · ${a.by}` : ""} · ${when(a.at)}`, tone: "approved" };
  if (a) return { label: `Draft · version ${latest.n} (the approval was for version ${a.version})`, tone: "lapsed" };
  return { label: `Draft · version ${latest.n} of ${h!.versions.length}`, tone: "draft" };
}
const when = (at: string) => new Date(at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
export const STATUS_TONE: Record<ResultStatus["tone"], string> = {
  draft: "bg-[#F1F5F9] text-[#334155] dark:bg-white/10 dark:text-[#CBD5E1]",
  approved: "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  lapsed: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  unsaved: "bg-[#EFF6FF] text-[#1D4ED8] dark:bg-[#172554] dark:text-[#93C5FD]",
};

/** The list of versions: open one read-only, compare it with the current text, restore it as a new version. */
export function VersionsPanel({ history, current, read, onRestore }: {
  history: ResultHistory; current: string;
  read: (n: number) => Promise<string>;
  onRestore: (n: number, text: string) => Promise<void>;
}) {
  const [open, setOpen] = useState<{ n: number; text: string } | null>(null);
  const [mode, setMode] = useState<"read" | "diff">("diff");
  const [busy, setBusy] = useState<number | null>(null);
  const latest = history.versions.at(-1)?.n;
  const show = async (n: number) => { setBusy(n); try { setOpen({ n, text: await read(n) }); } finally { setBusy(null); } };
  const blocks = useMemo(() => (open && mode === "diff" ? diffText(open.text, current) : null), [open, mode, current]);

  if (!history.versions.length) return <p className="text-sm text-muted-foreground">No versions yet: the first is kept when this result is next rewritten, corrected or saved.</p>;
  return (
    <section aria-label="Versions" className="space-y-4">
      <p className="text-[12.5px] text-[#64748B]">Every rewrite, correction, saved edit and restore of this book is kept as a version (the newest 30). Restoring makes a new version, so nothing is lost; your original uploads are never changed.</p>
      <ol className="divide-y divide-border rounded-[10px] border border-border">
        {[...history.versions].reverse().map((v) => (
          <li key={v.n} className={`flex flex-wrap items-center gap-3 px-4 py-2.5 text-[13.5px] ${open?.n === v.n ? "bg-muted/50" : ""}`}>
            <span className="w-20 shrink-0 font-medium">Version {v.n}</span>
            <span className="min-w-0 flex-1">{v.op}{v.label ? ` · ${v.label}` : ""} <span className="text-[#64748B]">· {when(v.at)} · {v.words.toLocaleString()} words</span></span>
            {v.n === latest && <span className="rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-medium">Current</span>}
            {history.approval?.version === v.n && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"><BadgeCheck className="h-3 w-3" /> Approved</span>}
            {v.n !== latest && <Button size="sm" variant="ghost" className="h-7" disabled={busy !== null} onClick={() => show(v.n)}>{busy === v.n ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Open</Button>}
          </li>
        ))}
      </ol>
      {open && (
        <div className="rounded-[10px] border border-border p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="font-medium">Version {open.n} · read only</p>
            <div role="radiogroup" aria-label="Show" className="ml-2 flex rounded-[8px] border border-border p-0.5 text-[12.5px]">
              {(["diff", "read"] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`rounded-[6px] px-2.5 py-1 ${mode === m ? "bg-muted font-medium" : ""}`}>{m === "diff" ? "Compared with the current text" : "As it was"}</button>)}
            </div>
            <Button size="sm" variant="outline" className="ml-auto" disabled={busy !== null} onClick={async () => { setBusy(open.n); try { await onRestore(open.n, open.text); setOpen(null); } finally { setBusy(null); } }}><RotateCcw className="h-4 w-4" /> Restore as a new version</Button>
          </div>
          {mode === "diff" && blocks
            ? <div className="space-y-3 font-['Newsreader',Georgia,serif] text-[15px] leading-[1.65]">{blocks.map((b, bi) => (
                <p key={bi} className="whitespace-pre-line">{b.parts.map((p, i) => p.kind === "same" ? <span key={i}>{p.text}</span> : p.kind === "del" ? <del key={i} className="bg-[#FEF2F2] text-[#9F1239] dark:bg-red-500/10 dark:text-red-300" title="Only in this version">{p.text}</del> : <ins key={i} className="bg-[#EAF1FF] no-underline dark:bg-[#1E3A8A]/40" title="Only in the current text">{p.text}</ins>)}</p>
              ))}</div>
            : <Markdown text={open.text} />}
          {mode === "diff" && <p className="mt-2 text-[12px] text-[#64748B]">Struck through: only in version {open.n}. Highlighted: only in the current text.</p>}
        </div>
      )}
    </section>
  );
}

/**
 * Approve the current version as publication-ready. Only when the code checks
 * find nothing that blocks publishing and the author has decided every item
 * that needs judgement; the approval records who, when, which version and
 * what was checked. Saving and exporting never imply it.
 */
export function ApproveDialog({ text, rules, original, version, dismissedKey, aiReview, onReview, onApprove, onClose }: {
  text: string; rules?: string; original?: () => Promise<string>; version: number;
  /** Where the editorial check keeps the author's dismissals: those items count as decided. */
  dismissedKey?: string;
  /** Whether an AI editorial review exists for this version, and a way to ask for one. */
  aiReview: boolean; onReview?: () => void;
  onApprove: (s: ApprovalSummary) => Promise<void>; onClose: () => void;
}) {
  const audit = useMemo(() => auditBook(text, { rules }), [text, rules]);
  const [fidelity, setFidelity] = useState<AuditFinding[] | null>(original ? null : []);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!original) return;
    let live = true;
    original().then((o) => { if (live) setFidelity(o.trim() ? compareFidelity(o, text, { rules }).findings : []); }).catch(() => { if (live) setFidelity([]); });
    return () => { live = false; };
  }, [original, text, rules]);
  const findings = useMemo(() => [...(fidelity ?? []), ...audit.findings], [fidelity, audit]);
  const dismissed = useMemo(() => { try { return new Set<string>(dismissedKey ? JSON.parse(localStorage.getItem(dismissedKey) ?? "[]") : []); } catch { return new Set<string>(); } }, [dismissedKey]);
  const key = (f: AuditFinding) => `${f.id}|${f.text}`;
  const blockers = findings.filter((f) => f.level === "blocker");
  const reviews = findings.filter((f) => f.level === "review");
  const [decided, setDecided] = useState<Set<string>>(new Set());
  useEffect(() => { setDecided(new Set(reviews.filter((f) => dismissed.has(key(f))).map(key))); }, [findings]); // eslint-disable-line react-hooks/exhaustive-deps
  const allDecided = reviews.every((f) => decided.has(key(f)));
  const loading = fidelity === null;
  const can = !loading && blockers.length === 0 && allDecided;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl"><BadgeCheck className="h-5 w-5 text-emerald-600" /> Approve version {version} for publication</DialogTitle>
          <DialogDescription>Approval says you, the author, have checked this version and it is ready to publish. It is recorded with your name and the time, belongs to version {version} only, and lapses when a newer version is saved.</DialogDescription>
        </DialogHeader>
        {loading ? <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Running the checks…</p> : (
          <div className="space-y-4 text-[13.5px]">
            <div>
              <p className={EYEBROW}>Required checks</p>
              <ul className="mt-1.5 space-y-1">
                {CHECKS.filter((c) => c.area !== "fidelity" || original).map((c) => {
                  const n = findings.filter((f) => f.area === c.area && f.level === "blocker").length;
                  return <li key={c.area} className="flex gap-2">{n ? <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#B91C1C]" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}<span><strong className="font-medium">{AREA_LABEL[c.area]}</strong>{n ? `: ${n} to fix` : ": nothing blocks"}</span></li>;
                })}
              </ul>
              {blockers.length > 0 && <p role="alert" className="mt-2 text-[#B91C1C]">{blockers.length} {blockers.length === 1 ? "problem blocks" : "problems block"} publishing. Fix {blockers.length === 1 ? "it" : "them"} (or correct with Claude), save the new version, then approve.</p>}
            </div>
            {reviews.length > 0 && (
              <div>
                <p className={EYEBROW}>Your decisions ({reviews.filter((f) => decided.has(key(f))).length} of {reviews.length})</p>
                <p className="mt-1 text-[12.5px] text-[#64748B]">Each needs your judgement. Tick it once you have read it and chosen to keep the text as it is (items you dismissed in the check are already ticked).</p>
                <ul className="mt-2 space-y-1.5">
                  {reviews.map((f) => (
                    <li key={key(f)}><label className="flex gap-2"><input type="checkbox" checked={decided.has(key(f))} onChange={() => setDecided((d) => { const n = new Set(d); if (n.has(key(f))) n.delete(key(f)); else n.add(key(f)); return n; })} className="mt-1 h-3.5 w-3.5 shrink-0 accent-[#2563EB]" /><span>{f.text}</span></label></li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className={EYEBROW}>Judgement review</p>
              <p className="mt-1">{aiReview ? "An AI editorial review (Claude's judgement) exists for this version; its findings are yours to weigh." : "No AI editorial review for this version yet. It is optional: the code checks cannot judge arguments or coherence, and the review is a model's reading, not a check."}
                {!aiReview && onReview && <Button size="sm" variant="link" className="h-auto px-1" onClick={onReview}>Ask Claude for one</Button>}</p>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!can || busy} onClick={async () => { setBusy(true); try { await onApprove({ blockers: 0, reviews: reviews.length, decided: decided.size, checks: CHECKS.filter((c) => c.area !== "fidelity" || original).map((c) => c.area), aiReview }); } finally { setBusy(false); } }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />} Approve version {version}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { History as VersionsIcon };
