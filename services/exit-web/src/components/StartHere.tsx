import React from "react";
import { Link } from "react-router-dom";
import { useJourney } from "./GuidedJourney";
import { journeyFor, currentStep, finished, stepStatus } from "../lib/journey";

// The home page's one line on where you are: the guided journey's next step, with Continue. It replaces
// the earlier five-step "Start here" card, so there is one guide (the Guided Journey), not two.

const StartHere: React.FC = () => {
  const { role, plan, signals } = useJourney();
  const steps = journeyFor(role, plan);
  const at = currentStep(steps, signals);
  const step = steps[at]!;
  const done = finished(steps, signals);
  const count = steps.filter((s) => stepStatus(s, signals) !== "todo").length;

  return (
    <section aria-label="Guided journey" data-guide="start-here" className="flex flex-wrap items-center gap-x-5 gap-y-2 border border-[#E6D9BF] bg-[#FBF7EE] px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A6A2E]">
          Guided journey · {done ? "complete" : `step ${at + 1} of ${steps.length}`}{count > 0 && !done ? ` · ${count} done` : ""}
        </div>
        <p className="mt-0.5 text-[14px] text-xo-text">
          <span className="font-semibold">{done ? (role === "buyer" ? "The acquisition is complete." : "The sale is complete.") : step.title}</span>
          {!done && <span className="text-xo-muted"> — {step.instruction}</span>}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {!done && <Link to={step.to} state={{ journeyStep: at }} className="rounded-sm bg-[#B48737] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#9E7630] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{count === 0 ? "Start" : "Continue"} →</Link>}
        <Link to="/console/journey" className="text-[12px] font-medium text-xo-muted underline-offset-2 hover:text-xo-text hover:underline">All steps</Link>
      </div>
    </section>
  );
};

export default StartHere;
