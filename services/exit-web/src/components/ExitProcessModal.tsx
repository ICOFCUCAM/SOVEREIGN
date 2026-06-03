import React, { useEffect, useRef, useState } from "react";
import { Button, Card } from "../lib/ui";
import {
  EXIT_STEPS, runExitProcess, clearRun,
  type ExitRun, type ExitStep,
} from "../lib/exit-process";

const STATUS_BADGE: Record<ExitStep["status"], string> = {
  pending: "bg-white/5 text-white/40 ring-white/10",
  running: "bg-loi-500/15 text-loi-300 ring-loi-400/40 animate-pulse",
  done:    "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  error:   "bg-red-500/15 text-red-300 ring-red-400/40",
};

const STATUS_LABEL: Record<ExitStep["status"], string> = {
  pending: "Queued",
  running: "Running",
  done:    "Done",
  error:   "Failed",
};

function durationMs(step: ExitStep): number | null {
  if (!step.startedAt || !step.finishedAt) return null;
  return new Date(step.finishedAt).getTime() - new Date(step.startedAt).getTime();
}

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete?: (run: ExitRun) => void;
}

const ExitProcessModal: React.FC<Props> = ({ open, onClose, onComplete }) => {
  const [run, setRun] = useState<ExitRun | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open || startedRef.current) return;
    startedRef.current = true;
    clearRun();
    let alive = true;
    runExitProcess({
      onStepChange: (r) => {
        if (!alive) return;
        // shallow clone to force re-render
        setRun({ ...r, steps: r.steps.map((s) => ({ ...s })) });
      },
    })
      .then((finalRun) => { if (alive) onComplete?.(finalRun); })
      .catch(() => { /* error state is visible on the step badge */ });
    return () => { alive = false; };
  }, [open, onComplete]);

  if (!open) return null;

  const steps = run?.steps ?? EXIT_STEPS.map((s) => ({ ...s, status: "pending" as const }));
  const doneCount = steps.filter((s) => s.status === "done").length;
  const errored   = steps.some((s) => s.status === "error");
  const complete  = run?.status === "complete";
  const progressPct = (doneCount / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-2xl p-8">
        <div className="mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-deal-400">One-Click Exit</div>
          <h2 className="mt-2 font-serif text-2xl font-bold text-white">
            {complete ? "Exit process initialized" : errored ? "Exit process halted" : "Running exit process"}
          </h2>
          <p className="mt-2 text-sm text-white/55">
            {complete
              ? "All ten engines have run. Your valuation, CIM, teaser, NDAs, buyer list, and negotiator are live across the console."
              : errored
              ? "One step failed. The rest stayed where they were — fix the cause and re-run."
              : "Each engine runs in order and writes its artifact into your workspace."}
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between text-[11px]">
          <span className="text-white/45 uppercase tracking-[0.18em]">{doneCount} of {steps.length} steps</span>
          <span className="font-mono text-white/70">{progressPct.toFixed(0)}%</span>
        </div>
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-deal-700 to-deal-400 transition-all duration-300"
            style={{ width: `${Math.max(2, progressPct)}%` }}
          />
        </div>

        <ol className="max-h-[55vh] space-y-2.5 overflow-y-auto pr-1">
          {steps.map((s, i) => {
            const ms = durationMs(s);
            return (
              <li key={s.id} className="rounded-md border border-white/5 bg-ink-900/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] text-white/35">{String(i + 1).padStart(2, "0")}</span>
                    <span className={`font-medium ${s.status === "running" ? "text-white" : s.status === "done" ? "text-white/85" : s.status === "error" ? "text-red-300" : "text-white/50"}`}>
                      {s.label}
                    </span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${STATUS_BADGE[s.status]}`}>
                    {STATUS_LABEL[s.status]}{ms != null && s.status === "done" ? ` · ${ms}ms` : ""}
                  </span>
                </div>
                {s.status === "running" && (
                  <p className="ml-7 mt-1.5 text-[12px] text-white/55">{s.verb}…</p>
                )}
                {s.status === "done" && s.summary && (
                  <p className="ml-7 mt-1.5 text-[12px] text-white/65">{s.summary}</p>
                )}
                {s.status === "error" && s.error && (
                  <p className="ml-7 mt-1.5 text-[12px] text-red-300">{s.error}</p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex justify-end gap-3">
          {complete && (
            <Button onClick={onClose}>Open workspace →</Button>
          )}
          {!complete && !errored && (
            <Button variant="ghost" disabled>Working…</Button>
          )}
          {errored && (
            <Button variant="ghost" onClick={onClose}>Close</Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ExitProcessModal;
