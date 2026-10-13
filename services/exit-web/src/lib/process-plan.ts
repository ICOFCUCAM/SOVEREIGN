import { DEFAULT_PROCESS_TIMELINE, milestone, weeksLabel, weeksPhrase, type ProcessTimeline, type MilestoneId } from "@exit/engines";

// The sale process as the console states it, derived from the one process
// timeline in the engines — the outreach sequence, the Banker's plan and the
// closing checklist quote these weeks, as the CIM, summary, deck and teaser do.

export interface ProcessStep { readonly step: string; readonly timing: string; readonly body: string; readonly milestone: MilestoneId }

const ACTION: Partial<Record<MilestoneId, [string, string]>> = {
  launch: ["Build the target list and issue the teaser", "Rank acquirers by fit, appetite and recent activity; send the anonymised teaser under your listing's code name. No company name before an NDA."],
  nda: ["NDAs and CIM", "Counter-sign NDAs; release the CIM and staged data-room access to signed parties only."],
  management_presentations: ["Management presentations", "Present to engaged buyers."],
  ioi: ["Indications of interest", "Request non-binding indications of interest; compare them side by side."],
  loi: ["Letter of intent", "Run the remaining bidders to a signed letter of intent and exclusivity."],
};

/** The outreach sequence (launch to LOI), timed from the timeline. */
export function outreachSequence(t: ProcessTimeline = DEFAULT_PROCESS_TIMELINE): ProcessStep[] {
  return t.milestones.filter((m) => ACTION[m.id]).map((m) => {
    const [step, body] = ACTION[m.id]!;
    return { step, timing: weeksLabel(m), body, milestone: m.id };
  });
}

/** One sentence on when the deal is expected to close, with its basis. */
export const closingWindow = (t: ProcessTimeline = DEFAULT_PROCESS_TIMELINE): string =>
  `Signing in ${weeksPhrase(milestone(t, "signing"))} and closing in ${weeksPhrase(milestone(t, "closing"))} of the process, once consents and approvals are in (${t === DEFAULT_PROCESS_TIMELINE ? "the default plan, a planning assumption" : t.basis}).`;

export { DEFAULT_PROCESS_TIMELINE };
