import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Section } from "../components/xo";
import { useJourney } from "../components/GuidedJourney";
import { requiredEngagement } from "../lib/access";
import { guideState, onGuideChange, setJourneyHidden } from "../lib/onboarding";
import { journeyFor, stepStatus, currentStep, finished } from "../lib/journey";

// The guided journey on one page: every step of the sale (founder) or the acquisition (buyer), in order,
// with what has really been done. The banker's order of work from Autonomous Exit, run on the live
// exchange; the bar at the foot of each page walks the same steps with Back and Next.

const Journey: React.FC = () => {
  const { role, plan, signals } = useJourney();
  const steps = journeyFor(role);
  const at = currentStep(steps, signals);
  const done = finished(steps, signals);
  const [barHidden, setBarHidden] = useState(() => guideState().journeyHidden);
  useEffect(() => onGuideChange(() => setBarHidden(guideState().journeyHidden)), []);
  const count = steps.filter((s) => stepStatus(s, signals) !== "todo").length;
  const next = steps[at]!;

  return (
    <div data-page="journey" className="space-y-4 text-xo-text">
      <PageHeader eyebrow="◉ Guided journey" title={role === "buyer" ? "From mandate to acquisition" : "From first figures to a closed sale"}
        description={role === "buyer"
          ? "Every step of buying a company here, in order. Do each one on its own page; the bar at the foot of every page takes you Back and Next."
          : "Every step of selling your company here, in order. Do each one on its own page; the bar at the foot of every page takes you Back and Next."} />

      <section aria-label="Where you are" className="flex flex-wrap items-center gap-4 border border-[#E6D9BF] bg-[#FBF7EE] px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A6A2E]">{count} of {steps.length} steps · {done ? "complete" : `next: step ${at + 1}`}</div>
          <p className="mt-1 text-[15px] font-semibold">{done ? (role === "buyer" ? "The acquisition is complete." : "The sale is complete.") : next.title}</p>
          {!done && <p className="mt-0.5 text-[13px] text-xo-muted">{next.instruction}</p>}
          <div className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-[#EFE4CC]" role="progressbar" aria-label="Journey progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={count}>
            <div className="h-full rounded-full bg-[#B48737]" style={{ width: `${(count / steps.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!done && <Link to={next.to} state={{ journeyStep: at }} className="rounded-sm bg-[#B48737] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#9E7630] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{count === 0 ? "Start" : "Continue"} →</Link>}
          <button type="button" onClick={() => setJourneyHidden(!barHidden)} className="rounded-sm border border-[#E2D3B5] bg-white px-3 py-2 text-[12px] font-medium text-xo-text hover:border-[#B48737] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">
            {barHidden ? "Show the step bar on every page" : "Hide the step bar"}
          </button>
        </div>
      </section>

      <Section title={role === "buyer" ? "Your acquisition, step by step" : "Your sale, step by step"} eyebrow={`${steps.length} steps`} className="border border-xo-line"
        foot="A step is done only when its record says so: saved figures, a published listing, a signed NDA, an accepted offer, a signed or closed transaction. Steps that are about reading a page are marked Reviewed once you have opened it.">
        <ol className="divide-y divide-xo-line">
          {steps.map((s, i) => {
            const st = stepStatus(s, signals);
            const gate = requiredEngagement(s.to, role, plan);
            return (
              <li key={s.id} aria-current={i === at && !done ? "step" : undefined} className={`flex flex-wrap items-start gap-4 px-4 py-4 ${i === at && !done ? "bg-[#FBF6EC]" : ""}`}>
                <span aria-hidden className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold ring-1 ${st !== "todo" ? "bg-xo-verified/15 text-xo-verified ring-xo-verified/40" : i === at ? "bg-[#B48737] text-white ring-[#B48737]" : "bg-white text-xo-faint ring-[#E2D3B5]"}`}>{st !== "todo" ? "✓" : i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h3 className="text-[15px] font-semibold">{s.title}</h3>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-xo-faint">{s.desk}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-xo-muted">{s.instruction}</p>
                  {st === "todo" && s.needs && <p className="mt-1 text-[12px] text-xo-faint">{s.needs}</p>}
                  {gate && <p className="mt-1 text-[12px] text-xo-caution">Needs the {gate}.</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[12px] font-semibold ${st !== "todo" ? "text-xo-verified" : "text-xo-faint"}`}>{st === "done" ? "Done" : st === "reviewed" ? "Reviewed" : "To do"}</span>
                  <Link to={s.to} state={{ journeyStep: i }} className="rounded-sm border border-[#E2D3B5] bg-white px-3 py-1.5 text-[12px] font-semibold text-xo-text hover:border-[#B48737] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Open</Link>
                </div>
              </li>
            );
          })}
        </ol>
      </Section>
    </div>
  );
};

export default Journey;
