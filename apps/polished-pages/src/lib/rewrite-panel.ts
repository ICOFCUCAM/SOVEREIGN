// The Book Rewrite Control Panel (DESIGN-SPEC.md §20; brief recorded verbatim in
// docs/claude-studio/source/2026-10-rewrite-control-panel-brief.md). The owner ticks the
// editorial operations, picks a preset and a workflow, and the panel writes one readable
// instruction for the whole-book rewrite. The operations' labels are the brief's own words.
import DEMONOLOGY from "../../docs/claude-studio/source/2026-10-demonology-transformation.md?raw";

/** The owner's Demonology instruction, word for word, as a saved instruction in the panel. */
export const DEMONOLOGY_TRANSFORMATION = DEMONOLOGY.trim();

export interface PanelOption { id: string; label: string; help: string }
export interface PanelGroup { id: string; title: string; lead: string; options: PanelOption[] }

const o = (id: string, label: string, help: string): PanelOption => ({ id, label, help });

export const GROUPS: PanelGroup[] = [
  { id: "a", title: "A. Manuscript analysis", lead: "Before changing anything, study the original:", options: [
    o("a1", "Read the entire original manuscript before rewriting.", "Claude reads every chapter first, not just the opening."),
    o("a2", "Identify the author's central thesis and purpose.", "What the book is for, in a sentence or two."),
    o("a3", "Identify the author's theological or intellectual position.", "So the rewrite argues for the author's view, not another."),
    o("a4", "Map all major arguments and supporting evidence.", "Each argument with the scripture, sources and reasoning behind it."),
    o("a5", "Identify important personal testimonies and examples.", "So they are kept and placed where they support the argument."),
    o("a6", "Identify the intended audience and writing style.", "Who the book speaks to, and how."),
    o("a7", "Detect duplicate chapters, repeated paragraphs, and overlapping arguments.", "The repetition to consolidate."),
    o("a8", "Identify incomplete sections, missing references, and structural problems.", "Gaps the author may need to fill."),
    o("a9", "Produce a manuscript analysis report before rewriting.", "Saved as Rewrite · analysis (rewrite-analysis.md)."),
  ] },
  { id: "b", title: "B. Book structure", lead: "Shape of the book:", options: [
    o("b1", "Create a completely new table of contents.", "A new architecture, not the manuscript's order."),
    o("b2", "Reorganise the manuscript into parts and chapters.", "Parts where the book falls naturally into them."),
    o("b3", "Rename weak or confusing chapter titles.", "Professional, clear, distinctive titles."),
    o("b4", "Reorder chapters to improve logical progression.", "From foundations to application."),
    o("b5", "Split chapters containing unrelated subjects.", "One clear purpose per chapter."),
    o("b6", "Merge genuinely overlapping chapters.", "Only where two chapters truly cover the same ground."),
    o("b7", "Improve the introduction and conclusion.", "A focused opening and a conclusion that advances the purpose."),
    o("b8", "Create meaningful section headings and subsections.", "Headings that help the reader, never ones that restate a paragraph."),
    o("b9", "Create transitions between chapters.", "Each chapter leads into the next."),
    o("b10", "Require approval of the proposed table of contents before rewriting.", "The same as Approval mode below: Claude stops after the plan for you to approve."),
  ] },
  { id: "c", title: "C. Prose rewriting", lead: "The writing itself:", options: [
    o("c1", "Rewrite every substantive paragraph.", "Re-expressed, not copied with a few words changed."),
    o("c2", "Improve grammar, spelling, punctuation, and syntax.", "Correct, professional English."),
    o("c3", "Improve clarity, vocabulary, precision, and readability.", "Say exactly what is meant."),
    o("c4", "Improve paragraph development and sentence rhythm.", "Paragraphs that build an idea; varied sentences."),
    o("c5", "Add meaningful transitions and connective explanations.", "Arguments that connect."),
    o("c6", "Strengthen the presentation of existing arguments.", "Better writing and order, not new claims."),
    o("c7", "Remove awkward, fragmented, or repetitive writing.", "No broken or circling sentences."),
    o("c8", "Preserve the author's distinctive voice and convictions.", "It still sounds like the author."),
    o("c9", "Avoid generic AI-style language and unnecessary academic complexity.", "No stock phrases, no needless jargon."),
    o("c10", "Make the book read as one continuous, professionally edited work.", "Not a set of teaching notes."),
  ] },
  { id: "d", title: "D. Content preservation", lead: "What must not be lost:", options: [
    o("d1", "Preserve every major argument.", "Every argument of the original appears in the rewrite."),
    o("d2", "Preserve important qualifications and nuances.", "\"Probably\", \"in my view\" and the like are kept."),
    o("d3", "Preserve meaningful personal testimonies and experiences.", "Kept, and presented as the author's testimony."),
    o("d4", "Preserve important examples and illustrations.", "The examples that carry the teaching."),
    o("d5", "Preserve relevant biblical references and quotations.", "Scripture stays, word for word."),
    o("d6", "Preserve historical information and citations.", "Dates, names and sources kept accurate."),
    o("d7", "Preserve the author's original conclusions.", "The book ends where the author ends."),
    o("d8", "Track where every original chapter and major argument appears in the rewrite.", "A source-to-rewrite map."),
    o("d9", "Record all substantial omissions or consolidations.", "Nothing disappears without a record."),
    o("d10", "Do not silently remove unique or important content.", "Removing it needs a reason in the report."),
  ] },
  { id: "e", title: "E. Content reduction", lead: "What may be removed or consolidated:", options: [
    o("e1", "Remove accidental duplication.", "Text that appears twice by mistake."),
    o("e2", "Consolidate repeated explanations.", "One strong explanation instead of several."),
    o("e3", "Remove empty or redundant transitions.", "Sentences that only announce what comes next."),
    o("e4", "Remove irrelevant material that interrupts the book's purpose.", "Off-topic material, recorded in the report."),
    o("e5", "Convert classroom notes into suitable book prose where appropriate.", "Assignments and teaching notes become book text or are listed."),
    o("e6", "Remove malformed headings, editorial debris, and accidental formatting.", "Leftovers from conversion and editing."),
    o("e7", "Preserve distinct arguments even when they overlap.", "Overlap is not a reason to delete a distinct point."),
    o("e8", "Record substantial proposed omissions for review.", "Listed in the editorial report."),
    o("e9", "Do not shorten the manuscript merely to meet a word-count target.", "Length follows the content."),
  ] },
  { id: "f", title: "F. Expansion and explanation", lead: "What may be added (only from the author's own material):", options: [
    o("f1", "Add transitions where the existing argument needs a connection.", "Short connecting sentences."),
    o("f2", "Clarify ambiguous sentences when the intended meaning is clear.", "Only where the meaning is not in doubt."),
    o("f3", "Add brief explanations of concepts already present in the manuscript.", "Explaining what the author already says."),
    o("f4", "Add chapter introductions and conclusions where useful.", "Openings and closings built from the chapter."),
    o("f5", "Expand underdeveloped arguments using material already in the source.", "From elsewhere in the book, never from outside."),
    o("f6", "Avoid padding and unnecessary repetition.", "No filler."),
    o("f7", "Do not invent arguments, evidence, sources, or testimonies.", "Nothing that is not the author's."),
    o("f8", "Record substantive additions separately for approval.", "Listed under Additions in the report."),
    o("f9", "Set an optional target word count, without treating it as a reason to add filler.", "Uses the target word count field below."),
  ] },
  { id: "g", title: "G. Theology, terminology, and doctrine", lead: "Doctrine and names:", options: [
    o("g1", "Preserve the author's theological position.", "The author's theology leads."),
    o("g2", "Preserve the author's interpretation of spiritual warfare and related doctrines.", "The author's reading, not another tradition's."),
    o("g3", "Apply the project's approved divine-name terminology.", "Uses the terminology rules below."),
    o("g4", "Preserve direct quotations and bibliographic titles accurately.", "Names in quotations and titles are not changed where that would misrepresent the source."),
    o("g5", "Distinguish explicit biblical statements from interpretation and inference.", "What the text says, and what the author draws from it."),
    o("g6", "Distinguish personal testimony from independently verified facts.", "Testimony is presented as testimony."),
    o("g7", "Flag apparent contradictions without silently changing the author's position.", "Listed for the author to decide."),
    o("g8", "Flag questionable historical or doctrinal claims for review.", "Listed, not rewritten."),
    o("g9", "Do not introduce new doctrines or theological arguments without approval.", "Proposals go in the report."),
  ] },
  { id: "h", title: "H. Scripture and citations", lead: "Scripture and sources:", options: [
    o("h1", "Preserve all relevant Scripture references.", "No reference dropped."),
    o("h2", "Check chapter and verse numbering.", "References point to real verses."),
    o("h3", "Preserve the Bible translation where identified.", "Quotations stay in the author's translation."),
    o("h4", "Verify quotations against the identified translation when source access permits.", "Checked against the translation on the web where possible."),
    o("h5", "Check whether cited passages support the claims being made.", "A passage that doesn't support the claim is flagged."),
    o("h6", "Preserve non-biblical citations and references.", "Other sources kept."),
    o("h7", "Identify incomplete or inconsistent citations.", "Listed in the citation report."),
    o("h8", "Record proposed corrections and their reasons.", "Corrections proposed, not silently made."),
    o("h9", "Never invent quotations, references, authors, page numbers, or sources.", "Always on in the rules too."),
    o("h10", "Keep unresolved citation issues in a separate review report.", "Saved as Rewrite · citations."),
  ] },
  { id: "i", title: "I. Style and consistency", lead: "House style:", options: [
    o("i1", "Create a project-specific style sheet.", "Saved as Rewrite · style sheet."),
    o("i2", "Standardise terminology and spelling.", "One term per concept."),
    o("i3", "Standardise chapter numbering and heading hierarchy.", "Every number once, in order; levels never skip."),
    o("i4", "Standardise Scripture citation formatting.", "One form for every reference."),
    o("i5", "Standardise punctuation, italics, and quotation marks.", "Consistent throughout."),
    o("i6", "Maintain a consistent narrative voice.", "The same voice in every chapter."),
    o("i7", "Check consistency across all chapters.", "Names, terms and facts agree."),
    o("i8", "Check that cross-references point to the correct chapters.", "\"See chapter 5\" points to the right one."),
    o("i9", "Remove unfinished headings and editorial placeholders.", "No [citation needed], TODO or empty headings."),
  ] },
  { id: "j", title: "J. Quality assurance", lead: "Before calling it finished:", options: [
    o("j1", "Compare the final manuscript with the complete original.", "Side by side, chapter by chapter."),
    o("j2", "Verify that every original chapter has been accounted for.", "Each one placed in the rewrite or recorded."),
    o("j3", "Verify that major arguments and meaningful testimonies are preserved.", "Checked against the original."),
    o("j4", "Check for missing or truncated sections.", "Nothing cut off by length."),
    o("j5", "Check for accidental duplicate passages.", "No passage twice."),
    o("j6", "Check Scripture references and other citations.", "Against the original and the citation report."),
    o("j7", "Check the table of contents against the final headings.", "They match."),
    o("j8", "Calculate the actual word count from the saved final file.", "Counted from the file, not estimated."),
    o("j9", "Verify that all requested output files exist and contain the complete text.", "Each file opened and checked."),
    o("j10", "Produce a fidelity report.", "Saved as Rewrite · fidelity."),
    o("j11", "Produce an editorial report.", "Saved as Rewrite · notes."),
    o("j12", "Do not claim completion until the final checks have actually been performed.", "Always on in the rules too."),
  ] },
  { id: "k", title: "K. Deliverables", lead: "Files to deliver:", options: [
    o("k1", "Complete rewritten manuscript in DOCX.", "The Studio makes the Word file from the rewrite (Rewritten book → More → Export Word); Claude writes Markdown."),
    o("k2", "Complete rewritten manuscript in Markdown.", "Rewritten book (rewrite.md); always written."),
    o("k3", "Clean table of contents.", "Rewrite · contents (rewrite-contents.md)."),
    o("k4", "Manuscript analysis report.", "Rewrite · analysis (rewrite-analysis.md)."),
    o("k5", "Source-to-rewrite traceability report.", "Rewrite · traceability (rewrite-traceability.md)."),
    o("k6", "Editorial style sheet.", "Rewrite · style sheet (rewrite-style-sheet.md)."),
    o("k7", "Citation and Scripture review report.", "Rewrite · citations (rewrite-citations.md)."),
    o("k8", "Editorial queries requiring author decisions.", "Rewrite · queries for the author (rewrite-queries.md)."),
    o("k9", "Final editorial report.", "Rewrite · notes (rewrite-notes.md)."),
    o("k10", "Final fidelity and completeness report.", "Rewrite · fidelity (rewrite-fidelity.md)."),
    o("k11", "Final word count and original-versus-final comparison.", "In the fidelity report."),
  ] },
];

export const ALL_IDS = GROUPS.flatMap((g) => g.options.map((x) => x.id));
const range = (g: string, ...n: number[]) => n.map((i) => `${g}${i}`);
const all = (g: string) => GROUPS.find((x) => x.id === g)!.options.map((x) => x.id);
const without = (ids: string[], ...drop: string[]) => ids.filter((i) => !drop.includes(i));

export type PresetId = "faithful" | "complete" | "no-removal" | "publication" | "audit" | "custom";
export const PRESETS: { id: PresetId; label: string; line: string; ids: string[] }[] = [
  { id: "faithful", label: "Faithful Professional Rewrite", line: "Full prose rewrite, structural improvement, content preservation, consistency checks and final audit; no new substantive material.",
    ids: [...range("a", 1, 2, 3, 4, 5, 6, 9), ...range("b", 3, 7, 8, 9), ...all("c"), ...all("d"), ...range("e", 1, 3, 6, 7, 8, 9), ...range("f", 1, 2, 6, 7, 8), ...all("g"), ...range("h", 1, 2, 3, 6, 7, 8, 9, 10), ...all("i"), ...all("j"), ...range("k", 1, 2, 3, 4, 9, 10, 11)] },
  { id: "complete", label: "Complete Book Transformation", line: "Full analysis, new book architecture, full prose rewrite, transitions, controlled clarification, duplicate removal, terminology consistency and all quality checks.",
    ids: [...all("a"), ...without(all("b"), "b10"), ...all("c"), ...all("d"), ...all("e"), ...range("f", 1, 2, 3, 4, 6, 7, 8), ...all("g"), ...all("h"), ...all("i"), ...all("j"), ...all("k")] },
  { id: "no-removal", label: "Faithful Rewrite — No Content Removal", line: "All rewriting and structural operations, but no content deletion or chapter merging; all substantive material kept.",
    ids: [...all("a"), ...without(all("b"), "b6", "b10"), ...all("c"), ...all("d"), ...range("e", 6, 7, 8, 9), ...range("f", 1, 2, 3, 4, 6, 7, 8), ...all("g"), ...all("h"), ...all("i"), ...all("j"), ...all("k")] },
  { id: "publication", label: "Publication Preparation", line: "Copyediting, formatting, heading consistency, references, cross-references, author-supplied front matter and final quality assurance; no major restructuring.",
    ids: [...range("a", 1, 8), ...range("b", 8), ...range("c", 2, 3, 7), ...all("d"), ...range("e", 1, 6, 7, 9), ...range("f", 6, 7), ...range("g", 3, 4), ...range("h", 1, 2, 3, 6, 7, 8, 9, 10), ...all("i"), ...all("j"), ...range("k", 1, 2, 3, 6, 9, 10, 11)] },
  { id: "audit", label: "Theological and Scripture Audit", line: "Argument traceability, biblical references, quotation integrity, doctrinal consistency, historical claims and editorial queries; the prose is not rewritten.",
    ids: [...range("a", 1, 2, 3, 4, 8, 9), ...range("d", 1, 2, 5, 6, 7, 8), ...all("g"), ...all("h"), ...range("j", 1, 2, 3, 6, 10, 11, 12), ...range("k", 4, 5, 7, 8, 9, 10)] },
  { id: "custom", label: "Custom", line: "Choose each operation yourself.", ids: [] },
];

export type Workflow = "approval" | "autonomous";
export interface PanelConfig {
  title: string; subtitle: string; author: string; language: string; audience: string; format: string;
  /** A name for this version of the rewrite, so it is clearly labelled among the project's results. */
  versionName: string; notes: string; terminology: string; targetWords: string;
  workflow: Workflow; preset: PresetId; selected: string[];
}
export const DEFAULT_CONFIG: PanelConfig = {
  title: "", subtitle: "", author: "", language: "", audience: "", format: "Print and e-book", versionName: "", notes: "", terminology: "", targetWords: "",
  workflow: "approval", preset: "faithful", selected: PRESETS[0].ids,
};

/** The preset whose operations these are exactly, if any; and whether the chosen preset was changed by hand. */
export function presetState(c: PanelConfig): { matches: PresetId | null; modified: boolean } {
  const key = (ids: string[]) => [...new Set(ids)].sort().join(",");
  const now = key(c.selected);
  const match = PRESETS.find((p) => p.id !== "custom" && key(p.ids) === now)?.id ?? null;
  return { matches: match, modified: c.preset !== "custom" && match !== c.preset };
}

const has = (c: PanelConfig, id: string) => c.selected.includes(id);
/** The rewrite has new structure (the manuscript's order may change). */
export const restructures = (c: PanelConfig) => ["b1", "b2", "b4", "b5", "b6"].some((i) => has(c, i));
/** Nothing in the prose is rewritten or restructured: reports only. */
export const auditOnly = (c: PanelConfig) => !GROUPS.find((g) => g.id === "c")!.options.some((x) => has(c, x.id)) && !restructures(c) && !["b3", "b7", "b8", "b9"].some((i) => has(c, i));

const FILES: Record<string, string> = {
  k3: "./out/rewrite-contents.md (the clean table of contents)", k4: "./out/rewrite-analysis.md (the manuscript analysis)", k5: "./out/rewrite-traceability.md (where each original chapter and major argument is in the rewrite)",
  k6: "./out/rewrite-style-sheet.md (the style sheet)", k7: "./out/rewrite-citations.md (citation and Scripture review, with unresolved issues)", k8: "./out/rewrite-queries.md (questions that need the author's decision)",
  k9: "./out/rewrite-notes.md (the editorial report: structural changes, omissions and consolidations, additions, open questions)", k10: "./out/rewrite-fidelity.md (fidelity and completeness: arguments and testimonies checked against the original)",
};

/** One readable instruction from the selections: only the chosen operations, the project details and the rules that always apply. */
export function buildInstruction(c: PanelConfig): string {
  const lines: string[] = [];
  const title = [c.title.trim(), c.subtitle.trim()].filter(Boolean).join(": ");
  lines.push(`# ${title ? `Book rewrite: ${title}` : "Book rewrite"}`, "");
  const details = [
    c.title.trim() && `Book title: ${c.title.trim()}`, c.subtitle.trim() && `Subtitle: ${c.subtitle.trim()}`, c.author.trim() && `Author: ${c.author.trim()}`,
    c.language.trim() && `Language: ${c.language.trim()}`, c.audience.trim() && `Readers: ${c.audience.trim()}`, c.format.trim() && `Publishing format: ${c.format.trim()}`,
    c.versionName.trim() && `This version: ${c.versionName.trim()}`,
  ].filter(Boolean) as string[];
  if (details.length) lines.push("## The project", ...details.map((d) => `- ${d}`), "");
  if (c.title.trim()) lines.push(`Use the exact title${c.subtitle.trim() ? " and subtitle" : ""} given above. Do not invent an author biography, endorsements, a foreword, a publisher or other front matter that has not been supplied.`, "");
  if (c.notes.trim()) lines.push("## The author's notes", c.notes.trim(), "");

  lines.push("## How to work", c.workflow === "approval"
    ? "Approval mode: analyse the entire manuscript and propose the new table of contents and editorial plan first. The owner approves the plan before any chapter is rewritten."
    : "Autonomous mode: analyse, restructure, rewrite, integrate and audit the whole manuscript without stopping for approval at each stage. Stop only where a substantive decision cannot safely be inferred from the source, and list it in the queries for the author.", "");
  if (auditOnly(c)) lines.push("This is an audit, not a rewrite: do not rewrite the prose or change the structure. Write the reports only.", "");

  lines.push("## What to do", "");
  for (const g of GROUPS) {
    const chosen = g.options.filter((x) => has(c, x.id) && x.id !== "b10" && x.id !== "k1" && !(x.id === "f9" && !c.targetWords.trim()));
    if (!chosen.length) continue;
    lines.push(`### ${g.title.replace(/^[A-K]\.\s*/, "")}`, g.lead, ...chosen.map((x) => `- ${x.id === "f9" ? `Aim for about ${c.targetWords.trim()} words, without adding filler to reach it.` : x.id === "g3" && c.terminology.trim() ? "Apply the terminology rules below consistently in the author's own prose." : x.label}`), "");
  }
  // What was left unticked, said plainly where silence could be read as permission.
  const limits: string[] = [];
  if (!restructures(c)) limits.push("Keep the existing chapters, in the same order; do not create a new table of contents, reorder, split or merge chapters.");
  else if (!has(c, "b6")) limits.push("Do not merge chapters unless the owner approves it; propose any merge in the editorial report.");
  if (!["e1", "e2", "e3", "e4", "e5"].some((i) => has(c, i))) limits.push("Do not delete or consolidate content; keep all substantive source material, and record any proposed removal in the report instead.");
  if (!["f1", "f2", "f3", "f4", "f5"].some((i) => has(c, i)) && !auditOnly(c)) limits.push("Do not add explanations, introductions or conclusions; add only the minimum needed for grammar.");
  if (limits.length) lines.push("### Limits", ...limits.map((l) => `- ${l}`), "");

  if (has(c, "g3")) lines.push("## Terminology rules", c.terminology.trim() || "Follow the book's rules (in the project) for divine names and terms.", "Do not change quotations, published titles or bibliographic records where that would misrepresent the source.", "");

  const files = Object.entries(FILES).filter(([id]) => has(c, id)).map(([, f]) => f);
  lines.push("## Deliverables", ...(auditOnly(c) ? [] : ["- ./out/rewrite.md: the complete rewritten book, \"# Title\" first, \"## \" for each chapter, \"### \" for sections."]), ...files.map((f) => `- ${f}`), ...(has(c, "k11") ? ["- In the fidelity report: the final word count, counted from the saved file, beside the original's."] : []), "");

  lines.push("## Rules that always apply", ...[
    "The original manuscript in ./source/ must remain untouched; the rewrite is saved as a separate result with its own versions.",
    "Work through the entire manuscript. If it is too long to rewrite reliably in one pass, work chapter by chapter, keeping a shared outline, terminology guide and progress record in ./out/rewrite-progress.md, then integrate and audit the whole book.",
    "Never claim the whole book is done if only part was processed. Never truncate the manuscript or omit chapters because of length.",
    "Never invent quotations, references, authors, page numbers, sources, testimonies or facts.",
    "Do not treat the book as final until the complete rewrite has passed the checks; report what was checked and what was not.",
  ].map((l) => `- ${l}`));
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

const key = (projectId: string) => `studio.rewritePanel.${projectId}`;
const DEFAULT_KEY = "studio.rewritePanel.default";
/** The configuration kept for this project (as last left), else the owner's saved default, else the built-in default. */
export function loadConfig(projectId: string): PanelConfig {
  for (const k of [key(projectId), DEFAULT_KEY]) {
    try { const raw = localStorage.getItem(k); if (raw) return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<PanelConfig>) }; } catch { /* storage blocked or bad JSON */ }
  }
  return { ...DEFAULT_CONFIG };
}
export function keepConfig(projectId: string, c: PanelConfig) { try { localStorage.setItem(key(projectId), JSON.stringify(c)); } catch { /* storage blocked */ } }
export function saveAsDefault(c: PanelConfig) { try { localStorage.setItem(DEFAULT_KEY, JSON.stringify({ ...c, title: "", subtitle: "", versionName: "", notes: "" })); } catch { /* storage blocked */ } }
