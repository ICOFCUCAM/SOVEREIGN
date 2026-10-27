import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Manuscript, Section } from "@/lib/manuscript";
import type { RunOptions, StudioEvent, StudioJob } from "@/lib/claude-studio";
import type { EngineId, StudioBackend } from "@/lib/studio-backend";

export type SectionOp = NonNullable<RunOptions["op"]>;
export interface Proposal { sectionId: string; op: SectionOp; text: string; engine: EngineId; notes?: string | null }
export interface Running { job: StudioJob; line: string; steps: string[]; sectionId: string; op: SectionOp }

// Claude working on one section: the run, its progress lines, and the
// suggestion it leaves. Nothing changes in the book until the owner accepts;
// "What this section says" is stored on the section straight away.
export function useSectionRun({ backend, id, engine, persist, patchSection, latest, update, onChanged }: {
  backend: StudioBackend; id: string; engine: EngineId | null;
  persist: () => Promise<void>; patchSection: (sid: string, p: Partial<Section>) => void;
  latest: React.MutableRefObject<Manuscript | null>; update: (m: Manuscript) => void; onChanged: () => void;
}) {
  const { toast } = useToast();
  const [running, setRunning] = useState<Running | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  const run = useCallback(async (options: RunOptions & { sectionId: string; op: SectionOp }) => {
    if (!engine) { toast({ title: "No engine available", variant: "destructive" }); return; }
    await persist();
    try {
      const job = await backend.run(id, "section", options, engine);
      const ctl = new AbortController(); abort.current?.abort(); abort.current = ctl;
      setRunning({ job, line: "Starting…", steps: [], sectionId: options.sectionId, op: options.op });
      if (options.op !== "explain") setProposal(null);
      await backend.follow(job, async (e: StudioEvent) => {
        if (e.type === "tool" || e.type === "status" || e.type === "notice") setRunning((r) => (r ? { ...r, line: e.line, steps: [...r.steps, e.line].slice(-40) } : r));
        if (e.type !== "done") return;
        setRunning(null);
        onChanged();
        if (e.status !== "done") { if (e.status !== "cancelled") toast({ title: "Claude couldn't finish", description: e.error ?? "", variant: "destructive" }); return; }
        const sid = options.sectionId;
        if (options.op === "explain") {
          try { patchSection(sid, { summary: (await backend.output(id, e.output ?? `sections/${sid}-summary.md`)).trim() }); }
          catch { toast({ title: "Couldn't open Claude's summary", variant: "destructive" }); }
          return;
        }
        try {
          const text = (await backend.output(id, e.output ?? `sections/${sid}.md`)).trim();
          // What Claude used, written alongside a chapter built with one of the approaches (Claude Code only).
          const notes = options.op === "compose" && (e.outputs ?? []).includes(`sections/${sid}-notes.md`) ? await backend.output(id, `sections/${sid}-notes.md`).catch(() => null) : null;
          setProposal({ sectionId: sid, op: options.op, text, engine, notes });
        } catch { toast({ title: "Couldn't open Claude's suggestion", variant: "destructive" }); }
      }, ctl.signal);
    } catch (e) { setRunning(null); toast({ title: "Couldn't start", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  }, [backend, id, engine, persist, patchSection, toast, onChanged]);

  /** Uses the suggestion (replacing the text or adding it below) or sets it aside; either way it goes into the history. */
  const decide = useCallback((how: "replace" | "append" | "discard", text?: string) => {
    const m = latest.current;
    if (!m || !proposal) return;
    const t = text ?? proposal.text;
    update({
      ...m,
      sections: m.sections.map((s) => (s.id !== proposal.sectionId || how === "discard" ? s : {
        ...s,
        body: how === "replace" ? t : `${s.body.trim()}\n\n${t}`.trim(),
        // The text before a rewrite is kept so it can be put back.
        ...((proposal.op === "rewrite" || proposal.op === "compose") && !s.original && s.body.trim() ? { original: s.body } : {}),
      })),
      history: [...m.history, { sectionId: proposal.sectionId, op: proposal.op, engine: proposal.engine, at: new Date().toISOString(), accepted: how !== "discard" }],
    });
    setProposal(null);
  }, [latest, proposal, update]);

  const cancel = useCallback(() => { if (running) void backend.cancel(running.job); }, [backend, running]);

  return { run, running, proposal, setProposal, decide, cancel };
}
