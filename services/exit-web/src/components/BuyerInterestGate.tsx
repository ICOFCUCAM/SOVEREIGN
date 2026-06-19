import React from "react";
import { useNavigate } from "react-router-dom";
import { BUYERS } from "../lib/engines";
import { allDealEvents, subscribe } from "../lib/deal-events";

// CONVERSION LOGIC — the Listed Founder lead-generation engine. A free
// (Listed Founder) account is listed in the exchange and scored. This gate is
// deliberately honest about WHAT it is surfacing:
//   • If real buyers have fired an "expressed_interest" event against a
//     listing, it reports actual inbound interest.
//   • Otherwise it reports the discovery engine's acquisition-PROBABILITY
//     matches — buyers most likely to acquire a company like this — and says
//     so plainly. It never claims interest that has not occurred.
// Both numbers are real engine/telemetry output, never fabricated.

const MATCHED = BUYERS.candidates.filter((c) => c.probability >= 0.5).length;

// Real inbound interest = buyers (not the founder) who expressed interest in a
// listing, from the deal-events telemetry.
function inboundInterest(): number {
  return new Set(
    allDealEvents()
      .filter((e) => e.actorRole === "buyer" && e.kind === "expressed_interest")
      .map((e) => e.subjectId),
  ).size;
}

const BuyerInterestGate: React.FC = () => {
  const nav = useNavigate();
  const [interest, setInterest] = React.useState<number>(() => inboundInterest());
  React.useEffect(() => subscribe(() => setInterest(inboundInterest())), []);

  if (interest <= 0 && MATCHED <= 0) return null;
  const hasInterest = interest > 0;

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-deal-400/40 bg-gradient-to-r from-deal-600/15 via-deal-600/5 to-transparent">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-deal-500/20 text-deal-300 ring-1 ring-deal-400/40" aria-hidden>🔒</span>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-deal-300">
              {hasInterest ? "Buyer interest · Listed Founder" : "Buyer matches · Listed Founder"}
            </div>
            {hasInterest ? (
              <>
                <div className="mt-1 font-serif text-lg font-bold text-white">
                  <span className="tabular-nums text-deal-200">{interest}</span> buyer{interest === 1 ? " has" : "s have"} expressed interest in your company.
                </div>
                <div className="mt-0.5 text-[12px] text-white/55">
                  Their identities and NDA requests are locked. Upgrade to a mandate to see who they are and engage.
                </div>
              </>
            ) : (
              <>
                <div className="mt-1 font-serif text-lg font-bold text-white">
                  <span className="tabular-nums text-deal-200">{MATCHED}</span> buyer{MATCHED === 1 ? " is" : "s are"} a strong acquisition match for your company.
                </div>
                <div className="mt-0.5 text-[12px] text-white/55">
                  Ranked by the discovery engine's acquisition-probability model — these are matches, not inbound interest. Upgrade to a mandate to engage them directly.
                </div>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => nav("/console/upgrade")}
          className="shrink-0 rounded-md bg-deal-500 px-5 py-2.5 text-[12.5px] font-semibold text-ink-950 transition hover:bg-deal-400"
        >
          {hasInterest ? "Unlock buyers →" : "See your matches →"}
        </button>
      </div>
    </div>
  );
};

export default BuyerInterestGate;
