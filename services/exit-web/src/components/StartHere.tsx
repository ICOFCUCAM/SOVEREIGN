import React, { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { requiredEngagement, type Role, type Plan } from "../lib/access";
import { loadSavedIntake } from "../lib/active-company";
import { guideState, onGuideChange, setGuideHidden, stepsFor } from "../lib/onboarding";

// The "Start here" guide: the few steps that matter, in order, with honest
// progress (see lib/onboarding). Shown on the founder and buyer home pages;
// hidden on request and brought back from the sidebar.

const StartHere: React.FC = () => {
  const { session } = useAuth();
  const role: Role = session?.role ?? "founder";
  const plan: Plan = session?.plan ?? "free";
  const [state, setState] = useState(guideState);
  useEffect(() => onGuideChange(() => setState(guideState())), []);
  const id = useId();
  if (state.hidden) return null;

  const steps = stepsFor(role);
  const saved = loadSavedIntake() !== null;
  const status = (s: (typeof steps)[number]): "done" | "opened" | "todo" =>
    s.signal === "intake" ? (saved ? "done" : "todo") : state.visited.includes(s.to) ? "opened" : "todo";
  const next = steps.find((s) => status(s) === "todo");

  return (
    <section aria-labelledby={id} data-guide="start-here" className="border border-xo-line bg-xo-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-xo-line px-4 pb-2 pt-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-xo-brass">Start here</div>
          <h2 id={id} className="text-[14px] font-semibold tracking-tight text-xo-text">
            {role === "buyer" ? "Four steps to your first deal" : "Five steps to prepare your exit"}
          </h2>
        </div>
        <button type="button" onClick={() => setGuideHidden(true)}
          className="min-h-6 rounded-sm px-1.5 py-1 text-[11px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">
          Hide guide
        </button>
      </header>
      <ol className={`grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 ${steps.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
        {steps.map((s, i) => {
          const st = status(s);
          const gate = requiredEngagement(s.to, role, plan);
          const isNext = s === next;
          return (
            <li key={s.to} className={`flex flex-col gap-1 bg-xo-panel px-4 py-3 ${isNext ? "ring-1 ring-inset ring-xo-action/50" : ""}`}>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-mono text-xo-faint">Step {i + 1}</span>
                {st === "done" && <span className="font-semibold text-xo-verified">✓ Done</span>}
                {st === "opened" && <span className="text-xo-muted">Opened</span>}
                {st === "todo" && isNext && <span className="font-semibold text-xo-action">Next</span>}
              </div>
              <Link to={s.to} className="rounded-sm text-[13px] font-semibold text-xo-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">
                {s.title} <span aria-hidden>→</span>
              </Link>
              <p className="text-[12px] leading-snug text-xo-muted">{s.why}</p>
              {gate && <p className="text-[11px] text-xo-caution">Needs {gate}</p>}
            </li>
          );
        })}
      </ol>
      <p className="border-t border-xo-line px-4 py-2 text-[11px] text-xo-faint">
        {role === "buyer" ? "" : "“Done” means your figures are saved. "}“Opened” means you have opened that page in this browser. Progress is kept in this browser only.
      </p>
    </section>
  );
};

export default StartHere;
