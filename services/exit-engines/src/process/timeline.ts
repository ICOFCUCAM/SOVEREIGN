// ── CANONICAL PROCESS TIMELINE ──────────────────────────────────────
// One plan for a sale process, in weeks from launch (week 1 = the teaser goes
// out). Every document that states a milestone — the CIM, the executive
// summary, the deck, the teaser, the outreach plan, the closing checklist —
// derives it from here, so no two documents can promise different dates.
//
// It is a planning assumption, stated as such in every document that quotes
// it; a transaction's own timeline (when it exists) replaces the default.

export type MilestoneId =
  | 'launch' | 'nda' | 'management_presentations' | 'ioi' | 'loi'
  | 'confirmatory_diligence' | 'signing' | 'closing';

export interface Milestone {
  readonly id: MilestoneId;
  readonly label: string;
  /** Weeks from launch, inclusive. */
  readonly startWeek: number;
  readonly endWeek: number;
  readonly description: string;
}

export interface ProcessTimeline {
  readonly version: string;
  /** What the dates are: a default plan, or a transaction's own dates. */
  readonly basis: string;
  readonly milestones: readonly Milestone[];
}

export const DEFAULT_PROCESS_TIMELINE: ProcessTimeline = {
  version: '1.0.0',
  basis: 'ExitOS default process plan — a planning assumption, not a commitment; dates move with buyer response, diligence findings and conditions to closing',
  milestones: [
    { id: 'launch',                   label: 'Launch',                        startWeek: 1,  endWeek: 1,  description: 'Target list confirmed; anonymised teaser sent to qualified buyers' },
    { id: 'nda',                      label: 'NDAs and CIM',                  startWeek: 1,  endWeek: 2,  description: 'Confidentiality agreements signed; the memorandum and staged data-room access released to signed parties' },
    { id: 'management_presentations', label: 'Management presentations',      startWeek: 2,  endWeek: 3,  description: 'Engaged buyers meet the management team' },
    { id: 'ioi',                      label: 'Indications of interest',       startWeek: 4,  endWeek: 4,  description: 'Non-binding proposals due from engaged buyers' },
    { id: 'loi',                      label: 'Letter of intent',              startWeek: 5,  endWeek: 6,  description: 'Preferred party chosen; terms and exclusivity agreed in writing' },
    { id: 'confirmatory_diligence',   label: 'Confirmatory diligence',        startWeek: 6,  endWeek: 9,  description: 'The preferred party completes its detailed review under exclusivity' },
    { id: 'signing',                  label: 'Definitive agreement',          startWeek: 8,  endWeek: 10, description: 'Sale and purchase terms negotiated and signed' },
    { id: 'closing',                  label: 'Closing',                       startWeek: 10, endWeek: 16, description: 'Conditions satisfied, funds flow and closing; timing depends on consents and regulatory approvals' },
  ],
};

export function milestone(t: ProcessTimeline, id: MilestoneId): Milestone {
  const m = t.milestones.find((x) => x.id === id);
  if (!m) throw new Error(`timeline has no milestone ${id}`);
  return m;
}

/** "Week 4" or "Weeks 5–6". */
export const weeksLabel = (m: Pick<Milestone, 'startWeek' | 'endWeek'>): string =>
  m.startWeek === m.endWeek ? `Week ${m.startWeek}` : `Weeks ${m.startWeek}–${m.endWeek}`;

/** "week 4" / "weeks 5–6", for use inside a sentence. */
export const weeksPhrase = (m: Pick<Milestone, 'startWeek' | 'endWeek'>): string => weeksLabel(m).toLowerCase();

/** The milestones as dated lines, in order: "Weeks 5–6 · Letter of intent — …". */
export const timelineLines = (t: ProcessTimeline, ids?: readonly MilestoneId[]): string[] =>
  t.milestones.filter((m) => !ids || ids.includes(m.id)).map((m) => `${weeksLabel(m)} · ${m.label} — ${m.description}`);

/** Basic structural checks: ordered, non-negative, each milestone ends no earlier than it starts. */
export function validateTimeline(t: ProcessTimeline): string[] {
  const errors: string[] = [];
  let prevStart = 0;
  for (const m of t.milestones) {
    if (m.startWeek < 1) errors.push(`${m.id} starts before week 1`);
    if (m.endWeek < m.startWeek) errors.push(`${m.id} ends before it starts`);
    if (m.startWeek < prevStart) errors.push(`${m.id} starts before the milestone listed before it`);
    prevStart = m.startWeek;
  }
  return errors;
}
