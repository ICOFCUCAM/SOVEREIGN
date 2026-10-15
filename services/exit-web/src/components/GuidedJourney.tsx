import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { Role } from "../lib/access";
import { requiredEngagement, type Plan } from "../lib/access";
import { loadActiveCompany, loadSavedIntake } from "../lib/active-company";
import { findOwnListing, subscribeListings } from "../lib/listings";
import { currentAccountId, myMandate, myNdaRequests, ndaRequestsForListing, offersForListing } from "../lib/exit-api";
import { subscribe as onDealEvent } from "../lib/deal-events";
import { loadNdas } from "../lib/nda-lifecycle";
import { loadTransactions } from "../lib/transactions";
import { useDocumentRemote } from "../lib/documents/remote";
import { listVersions } from "../lib/documents/store";
import { listDocuments, toRoomFile } from "../lib/data-room";
import { runDueDiligence, roomProgress } from "@exit/engines";
import { guideState, onGuideChange, setJourneyHidden } from "../lib/onboarding";
import { journeyFor, stepStatus, currentStep, stepOnPage, finished, NO_SIGNALS, type JourneySignals, type JourneyStep, type StepStatus } from "../lib/journey";
import { HintCard, useHint } from "./HintCard";

// The guided journey's bar at the foot of every founder and buyer page: which step of the sale (or the
// acquisition) this is, what to do here, and Back / Next. Progress is read from the account's own records
// (see lib/journey); nothing here marks a step done.

const settle = <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback);

/** What has really happened on this account, re-read on every page change and recorded action. */
export function useJourneySignals(role: Role): JourneySignals {
  const remote = useDocumentRemote();
  const loc = useLocation();
  const [signals, setSignals] = useState<JourneySignals>(NO_SIGNALS);
  const [visited, setVisited] = useState<readonly string[]>(() => guideState().visited);
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => onGuideChange(() => setVisited(guideState().visited)), []);
  useEffect(() => subscribeListings(bump), [bump]);
  useEffect(() => onDealEvent(bump), [bump]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const me = currentAccountId();
      const intakeSaved = loadSavedIntake() !== null;
      const own = role === "buyer" || !intakeSaved ? undefined : findOwnListing(loadActiveCompany().company);
      const [ndas, txns] = await Promise.all([
        remote ? settle(loadNdas(remote), null) : Promise.resolve(null),
        remote ? settle(loadTransactions(remote), []) : Promise.resolve([]),
      ]);
      const agreements = ndas?.agreements ?? [];
      // the server returns only the caller's own records; the side decides which ones are theirs here
      const mine = txns.map((r) => r.txn).filter((t) => !me || (role === "buyer" ? t.buyer_account_id : t.seller_account_id) === me);
      const txnSigned = mine.some((t) => t.state === "signed" || t.state === "closed");
      const txnClosed = mine.some((t) => t.state === "closed");
      let next: Omit<JourneySignals, "visited">;
      if (role === "buyer") {
        const [mandate, reqs] = await Promise.all([settle(myMandate(), null), settle(myNdaRequests(), [])]);
        const offers = (await Promise.all([...new Set(reqs.map((r) => r.listingId))].map((id) => settle(offersForListing(id), [])))).flat();
        next = {
          ...NO_SIGNALS, mandateSaved: !!mandate, ndaRequested: reqs.length > 0,
          ndaExecuted: reqs.some((r) => r.status === "signed") || agreements.some((a) => a.state === "executed" && a.buyer_account_id === me),
          offerMade: offers.some((o) => !me || o.buyerAccountId === me), txnSigned, txnClosed,
        };
      } else {
        const [reqs, offers] = own ? await Promise.all([settle(ndaRequestsForListing(own.id), []), settle(offersForListing(own.id), [])]) : [[], []];
        // Prepare for market: the saved story, the generated documents, and the data room's accepted files
        const { company, companyId, story } = loadActiveCompany();
        const [cims, teasers, roomFiles] = await Promise.all([
          settle(listVersions("exitos.cim", companyId, remote), []),
          settle(listVersions("exitos.teaser", companyId, remote), []),
          remote && companyId ? settle(listDocuments(), null) : Promise.resolve(null),
        ]);
        const room = roomFiles ? roomProgress(runDueDiligence(company).documents, roomFiles.map(toRoomFile), companyId) : null;
        next = {
          ...NO_SIGNALS, intakeSaved, listed: !!own,
          storySaved: !!companyId && !!story.updatedAt, cimSaved: cims.length > 0, teaserSaved: teasers.length > 0,
          dataRoomComplete: !!room && room.pct >= 100,
          ndaExecuted: reqs.some((r) => r.status === "signed") || agreements.some((a) => a.state === "executed" && a.owner_account_id === me),
          offerAccepted: offers.some((o) => o.status === "accepted"), txnSigned, txnClosed,
        };
      }
      if (alive) setSignals((s) => ({ ...next, visited: s.visited }));
    })();
    return () => { alive = false; };
  }, [role, remote, loc.pathname, tick]);

  return { ...signals, visited };
}

const MARK: Record<StepStatus, string> = { done: "✓", reviewed: "✓", todo: "" };
const STATUS_TEXT: Record<StepStatus, string> = { done: "Done", reviewed: "Reviewed", todo: "To do" };

/** One step dot in the bar, with the step's summary on hover or keyboard focus. */
const StepDot: React.FC<{ step: JourneyStep; i: number; current: boolean; status: StepStatus; plan: string }> = ({ step: s, i, current, status: st, plan }) => {
  const hint = useHint();
  return (
    <li>
      <Link to={s.to} state={{ journeyStep: i }} aria-label={`Step ${i + 1}: ${s.title} · ${STATUS_TEXT[st]}`} aria-current={current ? "step" : undefined} {...hint.bind}
        className={`grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold ring-1 transition ${current ? "bg-[#B48737] text-white ring-[#B48737]" : st !== "todo" ? "bg-xo-verified/15 text-xo-verified ring-xo-verified/40" : "bg-white text-xo-faint ring-[#E2D3B5] hover:ring-[#B48737]"}`}>
        {MARK[st] || i + 1}
      </Link>
      <HintCard hint={hint} side="top" title={`${i + 1}. ${s.title}`} what={s.instruction} plan={plan} />
    </li>
  );
};

/** The bar: shown on founder and buyer pages until switched off. */
export const JourneyBar: React.FC = () => {
  const { session } = useAuth();
  const role: Role = session?.role ?? "founder";
  const plan: Plan = session?.plan ?? "free";
  const loc = useLocation();
  const nav = useNavigate();
  const signals = useJourneySignals(role);
  const [hidden, setHidden] = useState(() => guideState().journeyHidden);
  useEffect(() => onGuideChange(() => setHidden(guideState().journeyHidden)), []);
  if (hidden || (role !== "founder" && role !== "buyer") || loc.pathname === "/console/journey") return null;

  const steps = journeyFor(role, plan);
  const intended = (loc.state as { journeyStep?: unknown } | null)?.journeyStep;
  const here = stepOnPage(steps, loc.pathname, signals, typeof intended === "number" ? intended : undefined);
  const at = here === -1 ? currentStep(steps, signals) : here;
  const step = steps[at]!;
  const status = stepStatus(step, signals);
  const onStep = here !== -1;
  const done = finished(steps, signals);
  const gate = requiredEngagement(step.to, role, plan);
  const go = (i: number): void => { const s = steps[i]; if (s) nav(s.to, { state: { journeyStep: i } }); };
  const BTN = "rounded-sm border px-3 py-1.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-40";

  return (
    <aside aria-label="Guided journey" className="sticky bottom-0 z-20 border-t border-[#E6D9BF] bg-[#FBF7EE]/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A6A2E]">
            <span>{role === "buyer" ? "Your acquisition" : "Your sale"} · step {at + 1} of {steps.length}</span>
            <span aria-hidden className="text-[#C9B48A]">·</span><span>{step.desk}</span>
            {status !== "todo" && <span className="rounded-sm bg-xo-verified/10 px-1.5 py-px text-xo-verified">{STATUS_TEXT[status]}</span>}
          </div>
          <p className="mt-0.5 text-[13px] text-xo-text">
            <span className="font-semibold">{done ? (role === "buyer" ? "Acquisition complete." : "Sale complete.") : step.title}</span>
            {!done && <> — {onStep ? step.instruction : <>this page isn't a journey step. <Link to={step.to} state={{ journeyStep: at }} className="font-medium text-xo-action underline">Go to step {at + 1} →</Link></>}</>}
            {!done && status === "todo" && step.needs && <span className="text-xo-muted"> {step.needs}</span>}
            {!done && gate && <span className="text-xo-caution"> Needs the {gate}.</span>}
          </p>
        </div>
        <ol aria-label="Steps" className="hidden items-center gap-1 md:flex">
          {steps.map((s, i) => <StepDot key={s.id} step={s} i={i} current={i === at} status={stepStatus(s, signals)} plan={requiredEngagement(s.to, role, "free") ?? "Free"} />)}
        </ol>
        <div className="flex items-center gap-2">
          <button type="button" className={`${BTN} border-[#E2D3B5] bg-white text-xo-text hover:border-[#B48737]`} disabled={at === 0} onClick={() => go(at - 1)}>← Back</button>
          {at < steps.length - 1
            ? <button type="button" className={`${BTN} border-[#B48737] bg-[#B48737] text-white hover:bg-[#9E7630]`} onClick={() => go(at + 1)}>Next →</button>
            : <Link to="/console/journey" className={`${BTN} border-[#B48737] bg-[#B48737] text-white hover:bg-[#9E7630]`}>See the journey</Link>}
          <Link to="/console/journey" className="hidden text-[11px] font-medium text-xo-muted underline-offset-2 hover:underline lg:inline">All steps</Link>
          <button type="button" onClick={() => setJourneyHidden(true)} aria-label="Hide the guided journey" title="Hide the guided journey (bring it back from the Guided Journey page)"
            className="rounded p-1 text-xo-faint hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">✕</button>
        </div>
      </div>
    </aside>
  );
};

/** For the journey page: the steps with their status. */
export function useJourney(): { role: Role; plan: Plan; signals: JourneySignals } {
  const { session } = useAuth();
  const role: Role = session?.role === "buyer" ? "buyer" : "founder";
  return { role, plan: session?.plan ?? "free", signals: useJourneySignals(role) };
}

