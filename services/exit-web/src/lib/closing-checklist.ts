import { DEFAULT_PROCESS_TIMELINE, milestone, weeksLabel, type MilestoneId, type ProcessTimeline } from "@exit/engines";
import { structuredDoc } from "./deliverables";
import { closingWindow } from "./process-plan";

// ── THE CLOSING CHECKLIST ───────────────────────────────────────────
// One checklist: the Closing page shows it and the exported document renders
// the same items, owners, statuses and timing. Statuses are set by the person
// and kept in this browser; nothing here is marked done until they mark it.
// A status is a tracking note, not evidence that a document was signed.

export type ItemStatus = "pending" | "in_progress" | "done" | "blocked";
export type Owner = "Founder" | "Counsel" | "Buyer" | "Banker";
export interface ClosingItem { readonly id: string; readonly title: string; readonly owner: Owner; readonly by: MilestoneId; readonly gating: boolean }
export interface ClosingRow extends ClosingItem { readonly status: ItemStatus; readonly timing: string }

export const CLOSING_ITEMS: readonly ClosingItem[] = [
  { id: "c-01", title: "SPA execution and signature pages",                                owner: "Counsel", by: "signing", gating: false },
  { id: "c-02", title: "Disclosure schedule final review",                                 owner: "Counsel", by: "signing", gating: false },
  { id: "c-03", title: "Shareholder consent at the threshold your documents require",      owner: "Founder", by: "signing", gating: true },
  { id: "c-04", title: "Bring-down certificate",                                          owner: "Founder", by: "closing", gating: true },
  { id: "c-05", title: "Escrow agent engagement",                                         owner: "Banker",  by: "signing", gating: false },
  { id: "c-06", title: "Wire instructions (buyer side)",                                  owner: "Buyer",   by: "closing", gating: false },
  { id: "c-07", title: "Escrow funding confirmation",                                     owner: "Banker",  by: "closing", gating: true },
  { id: "c-08", title: "Cap-table snapshot at closing",                                   owner: "Founder", by: "closing", gating: false },
  { id: "c-09", title: "Regulatory and tax filings, as counsel advises",                  owner: "Counsel", by: "closing", gating: true },
  { id: "c-10", title: "Press and employee announcement coordination",                    owner: "Founder", by: "closing", gating: false },
  { id: "c-11", title: "Buyer board approval",                                            owner: "Buyer",   by: "signing", gating: true },
  { id: "c-12", title: "Closing call agenda and dial-ins",                                owner: "Banker",  by: "closing", gating: false },
];

export const STATUS_LABEL: Record<ItemStatus, string> = { pending: "Not started", in_progress: "In progress", done: "Done", blocked: "Blocked" };

const KEY = "exitos.closing.v1";
export const loadClosingStatuses = (): Record<string, ItemStatus> => {
  try { return JSON.parse(globalThis.localStorage?.getItem(KEY) ?? "{}") as Record<string, ItemStatus>; } catch { return {}; }
};
export const saveClosingStatuses = (s: Record<string, ItemStatus>): void => {
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify(s)); } catch { /* in-memory only */ }
};

/** The checklist with statuses and the timeline's timing for each item. */
export function closingRows(statuses: Record<string, ItemStatus>, t: ProcessTimeline = DEFAULT_PROCESS_TIMELINE): ClosingRow[] {
  return CLOSING_ITEMS.map((i) => ({ ...i, status: statuses[i.id] ?? "pending", timing: `by ${weeksLabel(milestone(t, i.by)).toLowerCase()}` }));
}

/** The exported checklist: the same rows the Closing page shows. */
export function closingChecklistDoc(statuses: Record<string, ItemStatus> = loadClosingStatuses(), t: ProcessTimeline = DEFAULT_PROCESS_TIMELINE): string {
  const rows = closingRows(statuses, t);
  const count = (s: ItemStatus): number => rows.filter((r) => r.status === s).length;
  return structuredDoc("Closing Checklist", "Signature, escrow and filing items to the wire", [
    { heading: "Status", body: `${count("done")} of ${rows.length} items marked done, ${count("in_progress")} in progress, ${count("blocked")} blocked. Statuses are tracking notes set in ExitOS, not evidence of execution.` },
    { heading: "Items", table: { headers: ["#", "Item", "Owner", "Timing", "Gate", "Status"], rows: rows.map((r, n) => [String(n + 1), r.title, r.owner, r.timing, r.gating ? "Yes" : "", STATUS_LABEL[r.status]]) } },
    { heading: "Timing", body: closingWindow(t) },
    { heading: "Terms", body: "Escrow, holdback, indemnity and break-fee terms are negotiated for the deal and set in the definitive agreement with counsel; this checklist states none." },
  ]);
}
