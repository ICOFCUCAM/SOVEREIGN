// Revise (DESIGN-SPEC.md §21): what the owner wants from a rewrite of a section, as goals they tick,
// their own instructions, and a few editorial settings, written into the section's idea for Claude.

export type GoalId = "flow" | "clarify" | "preserve" | "develop";
export const GOALS: { id: GoalId; label: string; line: string; brief: string }[] = [
  { id: "flow", label: "Improve flow", line: "Connect paragraphs and ideas naturally", brief: "Improve the flow: connect the paragraphs and ideas naturally, with transitions where the argument moves on." },
  { id: "clarify", label: "Clarify the argument", line: "Make complex explanations easier to follow", brief: "Clarify the argument: make complex explanations easier to follow, one step at a time, without simplifying what the author holds." },
  { id: "preserve", label: "Preserve my meaning", line: "Improve the writing without changing my position", brief: "Preserve the author's meaning: improve the writing only; keep every position, qualification and conclusion as it is." },
  { id: "develop", label: "Develop the explanation", line: "Add useful clarification from the source", brief: "Develop the explanation: add clarification where it helps, drawn only from the author's own material, never invented." },
];

export type CitationHandling = "keep" | "mark" | "add";
export type Scope = "light" | "full";
export interface ReviseSettings { goals: GoalId[]; citations: CitationHandling; scope: Scope }
export const DEFAULT_SETTINGS: ReviseSettings = { goals: [], citations: "keep", scope: "full" };
export const CITATION_LABEL: Record<CitationHandling, string> = { keep: "Keep the citations as they are", mark: "Mark claims that need a source", add: "Add citations from sources Claude opens" };
export const SCOPE_LABEL: Record<Scope, string> = { light: "Light edit: keep my sentences where they work", full: "Full rewrite: re-express every paragraph" };

const KEY = "studio.revise.settings";
export function loadSettings(): ReviseSettings {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<ReviseSettings> | null;
    return { goals: (v?.goals ?? []).filter((g): g is GoalId => GOALS.some((x) => x.id === g)), citations: v?.citations && v.citations in CITATION_LABEL ? v.citations : "keep", scope: v?.scope === "light" ? "light" : "full" };
  } catch { return DEFAULT_SETTINGS; }
}
export function keepSettings(s: ReviseSettings) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ } }

/** The idea Claude follows: the owner's own words first, then the goals and settings they chose. */
export function composeIdea(idea: string, s: ReviseSettings): string {
  const extra = [
    ...s.goals.map((g) => GOALS.find((x) => x.id === g)!.brief),
    s.scope === "light" ? "Scope: a light edit; keep the author's sentences where they already work." : null,
    s.citations === "mark" ? "Citations: mark each claim that needs a source as [citation needed]; add none." : s.citations === "add" ? "Citations: add citations only from sources you open and check; never invent one." : null,
  ].filter(Boolean) as string[];
  const own = idea.trim();
  return [own, extra.length ? `What the owner chose:\n${extra.map((x) => `- ${x}`).join("\n")}` : ""].filter(Boolean).join("\n\n");
}
