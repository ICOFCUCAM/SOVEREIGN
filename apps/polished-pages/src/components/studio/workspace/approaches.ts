import type { RunOptions } from "@/lib/claude-studio";
import type { SectionOp } from "./useSectionRun";

// The five ways Claude can write a chapter (design spec §5.3), each with the
// source policy it follows. The policy is repeated on the review summary.
export type ApproachId = NonNullable<RunOptions["approach"]>;
export const APPROACH_CARDS: { id: ApproachId; label: string; line: string; policy: string; needsBook: boolean }[] = [
  { id: "polish", label: "Polish my book", line: "Clarity and flow, your meaning kept.", policy: "your manuscript", needsBook: false },
  { id: "mine", label: "From my book only", line: "Only your own material. No outside research.", policy: "manuscript only", needsBook: false },
  { id: "mine-and-research", label: "My book + cited sources", line: "Your book first, with outside evidence and citations.", policy: "manuscript + references (unverified until checked)", needsBook: true },
  { id: "research", label: "Research-led", line: "Built on research, arguing your book's position.", policy: "research with provenance", needsBook: true },
  { id: "new", label: "New from outline", line: "A new chapter from your plan and notes.", policy: "outline and book rules", needsBook: false },
];

export const OP_LABEL: Partial<Record<SectionOp, string>> = {
  compose: "Claude's draft", rewrite: "Claude's rewrite", expand: "Expanded", cite: "With citations", voice: "In your voice",
  edit: "Edited as you asked", draft: "Claude's draft", improve: "Improved", explain: "What this section says",
};
