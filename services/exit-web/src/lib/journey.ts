import type { Role } from "./access";

// ── THE GUIDED JOURNEY ──────────────────────────────────────────────
// The whole sale, or the whole acquisition, as one path a newcomer can walk with Back and Next: from the
// first figures to the signed and closed deal. It borrows the banker's order of work from Autonomous Exit
// (valuation → buyers → listing → NDAs → offers → signing → closing), but runs on the real exchange.
//
// A step is ticked only when its own record says it happened: saved figures, a published listing, an
// executed NDA, an accepted offer, a signed or closed transaction. Steps whose work is reading a page
// ("review" steps) are marked "Reviewed" once that page has been opened, and never "Done".

export type StepKind = "do" | "review";
export type StepStatus = "done" | "reviewed" | "todo";

/** What the console knows has really happened, read from the account's own records. */
export interface JourneySignals {
  readonly intakeSaved: boolean;
  readonly listed: boolean;
  readonly mandateSaved: boolean;
  readonly ndaRequested: boolean;
  readonly ndaExecuted: boolean;
  readonly offerMade: boolean;
  readonly offerAccepted: boolean;
  readonly txnSigned: boolean;
  readonly txnClosed: boolean;
  readonly visited: readonly string[];
}

export const NO_SIGNALS: JourneySignals = {
  intakeSaved: false, listed: false, mandateSaved: false, ndaRequested: false, ndaExecuted: false,
  offerMade: false, offerAccepted: false, txnSigned: false, txnClosed: false, visited: [],
};

export interface JourneyStep {
  readonly id: string;
  readonly to: string;
  readonly title: string;
  /** the specialist whose work this is, as on Autonomous Exit */
  readonly desk: string;
  /** one line: what to do on this page */
  readonly instruction: string;
  readonly kind: StepKind;
  /** for "do" steps: the record that completes it */
  readonly doneWhen?: (s: JourneySignals) => boolean;
  /** what has to be in place before the step can be finished, said plainly */
  readonly needs?: string;
}

export const SELLER_JOURNEY: readonly JourneyStep[] = [
  { id: "value", to: "/console/intake", title: "Value your company", desk: "Valuation", kind: "do",
    instruction: "Enter your company's figures and save them. Every later step is built from them.",
    doneWhen: (s) => s.intakeSaved },
  { id: "readiness", to: "/console/readiness", title: "Check readiness", desk: "Diligence", kind: "review",
    instruction: "See what a buyer would question first, and what to fix before you go to market." },
  { id: "worth", to: "/console/valuation", title: "See what it is worth", desk: "Valuation", kind: "review",
    instruction: "Your value range and how it is built, so you know your asking position." },
  { id: "buyers", to: "/console/buyers", title: "Meet your likely buyers", desk: "Buyer discovery", kind: "review",
    instruction: "The acquirers that fit your company, and why each one fits." },
  { id: "list", to: "/console/intake", title: "List on the exchange", desk: "Listing", kind: "do",
    instruction: "Open “List on the exchange”, complete the three listing steps and publish. Buyers see it anonymously.",
    doneWhen: (s) => s.listed, needs: "Publishing needs your identity verified with a provider." },
  { id: "ndas", to: "/console/inbox", title: "Answer NDA requests", desk: "Data room", kind: "do",
    instruction: "When a buyer asks for access, accept the request and issue the NDA. Files open only once it is signed.",
    doneWhen: (s) => s.ndaExecuted, needs: "Waits for a buyer to request an NDA." },
  { id: "offer", to: "/console/inbox", title: "Agree an offer", desk: "Negotiation", kind: "do",
    instruction: "Compare the offers you receive and accept the one you want to take forward.",
    doneWhen: (s) => s.offerAccepted, needs: "Waits for a buyer's offer." },
  { id: "sign", to: "/console/deals", title: "Sign the deal", desk: "Closing", kind: "do",
    instruction: "Work the signing checklist with the buyer until every required item is confirmed, then sign.",
    doneWhen: (s) => s.txnSigned || s.txnClosed, needs: "Opens once an offer is accepted." },
  { id: "close", to: "/console/deals", title: "Close and hand over", desk: "Closing", kind: "do",
    instruction: "Complete the closing items, confirm completion, and track what is owed after the sale.",
    doneWhen: (s) => s.txnClosed, needs: "Opens once the deal is signed." },
];

export const BUYER_JOURNEY: readonly JourneyStep[] = [
  { id: "mandate", to: "/console/acquisition-radar", title: "Set your mandate", desk: "Mandate", kind: "do",
    instruction: "Choose the sectors, regions, size and growth you want, and save the mandate. Every listing is scored against it.",
    doneWhen: (s) => s.mandateSaved },
  { id: "browse", to: "/console/marketplace", title: "Browse opportunities", desk: "Buyer discovery", kind: "review",
    instruction: "Companies listed for sale, shown anonymously. Follow the ones you like." },
  { id: "request", to: "/console/acquisition-radar", title: "Request an NDA", desk: "Data room", kind: "do",
    instruction: "On a company you want to know more about, press “Express interest (request NDA)”.",
    doneWhen: (s) => s.ndaRequested },
  { id: "nda", to: "/console/deals", title: "Sign the NDA and read the files", desk: "Data room", kind: "do",
    instruction: "Sign the NDA the seller issues. The files it covers then open here.",
    doneWhen: (s) => s.ndaExecuted, needs: "Waits for the seller to accept your request." },
  { id: "offer", to: "/console/acquisition-radar", title: "Make an offer", desk: "Negotiation", kind: "do",
    instruction: "Submit your price and terms on the company. The seller can accept or decline it.",
    doneWhen: (s) => s.offerMade },
  { id: "sign", to: "/console/deals", title: "Sign the deal", desk: "Closing", kind: "do",
    instruction: "Once your offer is accepted, work the signing checklist with the seller, then sign.",
    doneWhen: (s) => s.txnSigned || s.txnClosed, needs: "Opens once the seller accepts your offer." },
  { id: "close", to: "/console/deals", title: "Close the acquisition", desk: "Closing", kind: "do",
    instruction: "Complete the closing items and confirm completion. The business is yours.",
    doneWhen: (s) => s.txnClosed, needs: "Opens once the deal is signed." },
];

export const journeyFor = (role: Role): readonly JourneyStep[] => (role === "buyer" ? BUYER_JOURNEY : SELLER_JOURNEY);

export function stepStatus(step: JourneyStep, s: JourneySignals): StepStatus {
  if (step.kind === "do") return step.doneWhen?.(s) ? "done" : "todo";
  return s.visited.includes(step.to) ? "reviewed" : "todo";
}

/** The first step not yet finished; the last step when everything is. */
export function currentStep(steps: readonly JourneyStep[], s: JourneySignals): number {
  const i = steps.findIndex((x) => stepStatus(x, s) === "todo");
  return i === -1 ? steps.length - 1 : i;
}

/** Which step this page is, when the person is on one. Where two steps share a page, the step the person
 *  came to with Back / Next wins, then the current step, then the first unfinished one there. */
export function stepOnPage(steps: readonly JourneyStep[], path: string, s: JourneySignals, intended?: number): number {
  if (intended !== undefined && steps[intended]?.to === path) return intended;
  const cur = currentStep(steps, s);
  if (steps[cur]?.to === path) return cur;
  const firstOpen = steps.findIndex((x) => x.to === path && stepStatus(x, s) === "todo");
  return firstOpen !== -1 ? firstOpen : steps.findIndex((x) => x.to === path);
}

export const finished = (steps: readonly JourneyStep[], s: JourneySignals): boolean => steps.every((x) => stepStatus(x, s) !== "todo");
