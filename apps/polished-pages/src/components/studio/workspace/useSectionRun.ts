import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Manuscript, Section } from "@/lib/manuscript";
import type { RunOptions, StudioEvent, StudioJob } from "@/lib/claude-studio";
import type { EngineId, StudioBackend } from "@/lib/studio-backend";
import { addVersion } from "@/lib/section-versions";
import { OP_LABEL } from "./approaches";

export type SectionOp = NonNullable<RunOptions["op"]>;
export interface Proposal {
  sectionId: string; op: SectionOp; text: string; engine: EngineId;
  /** Claude's own account of what it used (approaches on Claude Code). */
  notes?: string | null;
  approach?: RunOptions["approach"];
  /** What the run actually opened, from its event log. */
  ledger?: string[];
}
export interface Running { job: StudioJob; line: string; steps: string[]; sectionId: string; op: SectionOp }
type SectionRun = RunOptions & { sectionId: string; op: SectionOp };
const proposalsKey = (id: string) => `studio.proposals.${id}`;

// Claude working on sections: one run at a time, its progress, and the
// suggestion it leaves for each section. Nothing changes in the book until the
// owner accepts; "What this section says" is stored on the section at once.
export function useSectionRun({ backend, id, engine, persist, patchSection, latest, update, onChanged }: {
  backend: StudioBackend; id: string; engine: EngineId | null;
  persist: () => Promise<void>; patchSection: (sid: string, p: Partial<Section>) => void;
  latest: React.MutableRefObject<Manuscript | null>; update: (m: Manuscript) => void; onChanged: () => void;
}) {
  const { toast } = useToast();
  const [running, setRunning] = useState<Running | null>(null);
  // Suggestions not yet reviewed are kept on this device, so a reload or a closed tab doesn't lose them (spec §7 recovery).
  const [proposals, setProposals] = useState<Record<string, Proposal>>(() => { try { return JSON.parse(localStorage.getItem(proposalsKey(id)) ?? "{}") as Record<string, Proposal>; } catch { return {}; } });
  useEffect(() => { try { if (Object.keys(proposals).length) localStorage.setItem(proposalsKey(id), JSON.stringify(proposals)); else localStorage.removeItem(proposalsKey(id)); } catch { /* storage full or blocked */ } }, [id, proposals]);
  const [queue, setQueue] = useState<{ done: number; total: number } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const accessed = useRef<string[]>([]);
  const stopQueue = useRef(false);
  useEffect(() => () => abort.current?.abort(), []);

  /** Runs one action on one section and resolves when it has finished. */
  const run = useCallback(async (options: SectionRun): Promise<boolean> => {
    if (!engine) { toast({ title: "No engine available", variant: "destructive" }); return false; }
    await persist();
    let ok = false;
    try {
      const job = await backend.run(id, "section", options, engine);
      const ctl = new AbortController(); abort.current?.abort(); abort.current = ctl;
      accessed.current = [];
      setRunning({ job, line: "Starting…", steps: [], sectionId: options.sectionId, op: options.op });
      if (options.op !== "explain") setProposals((p) => { const n = { ...p }; delete n[options.sectionId]; return n; });
      await backend.follow(job, async (e: StudioEvent) => {
        if (e.type === "tool" || e.type === "status" || e.type === "notice") setRunning((r) => (r ? { ...r, line: e.line, steps: [...r.steps, e.line].slice(-40) } : r));
        // What the run actually opened, from its own log (not Claude's account of it).
        if (e.type === "tool" && /^(Reading|Opening|Searching the web)/.test(e.line) && !accessed.current.includes(e.line)) accessed.current = [...accessed.current, e.line].slice(-200);
        if (e.type !== "done") return;
        setRunning(null);
        onChanged();
        if (e.status !== "done") { if (e.status !== "cancelled") toast({ title: "Claude couldn't finish", description: e.error ?? "Your text is unchanged. Try again, or switch engine.", variant: "destructive" }); return; }
        const sid = options.sectionId;
        if (options.op === "explain") {
          try { patchSection(sid, { summary: (await backend.output(id, e.output ?? `sections/${sid}-summary.md`)).trim() }); ok = true; }
          catch { toast({ title: "Couldn't open Claude's summary", variant: "destructive" }); }
          return;
        }
        try {
          const text = (await backend.output(id, e.output ?? `sections/${sid}.md`)).trim();
          const notes = options.op === "compose" && (e.outputs ?? []).includes(`sections/${sid}-notes.md`) ? await backend.output(id, `sections/${sid}-notes.md`).catch(() => null) : null;
          setProposals((p) => ({ ...p, [sid]: { sectionId: sid, op: options.op, text, engine, notes, approach: options.op === "compose" ? options.approach : undefined, ledger: accessed.current } }));
          ok = true;
        } catch { toast({ title: "Couldn't open Claude's suggestion", variant: "destructive" }); }
      }, ctl.signal);
    } catch (e) { setRunning(null); toast({ title: "Couldn't start", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    return ok;
  }, [backend, id, engine, persist, patchSection, toast, onChanged]);

  /** Writes several sections in turn (each leaves a suggestion to review). */
  const runAll = useCallback(async (list: SectionRun[]) => {
    stopQueue.current = false;
    setQueue({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      if (stopQueue.current) break;
      const ok = await run(list[i]);
      setQueue({ done: i + 1, total: list.length });
      if (!ok) break;
    }
    setQueue(null);
  }, [run]);

  /** Uses a suggestion (the text given, e.g. with some changes rejected, or edited) or sets it aside; either way it is recorded. */
  const decide = useCallback((sectionId: string, how: "replace" | "append" | "discard", text?: string) => {
    const m = latest.current;
    const proposal = proposals[sectionId];
    if (!m || !proposal) return;
    const t = text ?? proposal.text;
    update({
      ...m,
      sections: m.sections.map((s) => (s.id !== sectionId || how === "discard" ? s : {
        // Every accepted change keeps the text before it in the section's history.
        ...(s.body.trim() ? addVersion(s, "before-accept", OP_LABEL[proposal.op] ?? proposal.op) : s),
        body: how === "replace" ? t : `${s.body.trim()}\n\n${t}`.trim(),
        // The text before a rewrite is kept so it can be put back.
        ...((proposal.op === "rewrite" || proposal.op === "compose") && !s.original && s.body.trim() ? { original: s.body } : {}),
      })),
      history: [...m.history, { sectionId, op: proposal.op, engine: proposal.engine, at: new Date().toISOString(), accepted: how !== "discard" }],
    });
    setProposals((p) => { const n = { ...p }; delete n[sectionId]; return n; });
  }, [latest, proposals, update]);

  const cancel = useCallback(() => { stopQueue.current = true; if (running) void backend.cancel(running.job); }, [backend, running]);

  return { run, runAll, queue, running, proposals, decide, cancel };
}
