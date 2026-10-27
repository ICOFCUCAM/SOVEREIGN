# Claude Studio — Design Specification (binding)

Status: **binding specification** for the owner-only Claude Studio (`/admin/claude`). **Governing source (verbatim)**: `source/2026-10-design-review.md`. This file organises it with the owner's brief and the mock-up, and adds implementation detail; it never removes or weakens anything the source says. Where this file is shorter, vaguer or silent, the source text governs. Source: the owner's brief, the clickable mock-up (Claude Studio redesign artifact), and an external senior design review (October 2026, scored the proposal 78/100, target 92), adopted by the owner with the instruction "document and strictly implement". Mandatory unless this file records an owner-approved change.

Principle: **the manuscript is the product, Claude is the editorial partner, the interface disappears when the author wants to write.** Calm of iA Writer when writing, the structure of Scrivener when managing a book, the publishing confidence of Vellum when finishing — with Claude's contribution contextual, transparent and reversible.

## 1. Non-negotiables
1. **No feature is removed.** Every capability listed in §9 keeps working; only its place and look change. "We don't need double features": one place per feature.
2. The runner stays owner-only; nothing here is exposed to customers.
3. Never change the author's text without review. Every Claude change is a proposal until accepted; accepted changes keep the previous version recoverable.
4. Honest states: nothing is shown as "Ready", "verified" or "saved" unless it is.

## 2. Information architecture
Four stages in the frame — **Sources → Plan → Write → Finish** — as the primary journey, **not a one-way sequence**: the author can move between them at any time without losing their place, and changes upstream update downstream readiness without overwriting accepted work.
- **Sources**: manuscripts (several per project), scans/OCR, join files, compare versions, summarise, reference documents, knowledge (terminology, forbidden words), book-wide rules, voice profile, book details, start blank / from uploads / bring in a Book wizard draft.
- **Plan**: contents (outline), chapter notes and page notes, order, outline with Claude (outline styles), turn into a series, links to supporting sources.
- **Write**: manuscript, binder, Claude panel, revision review, source-use record, front/back matter, version history.
- **Finish**: cover, six interior styles, EPUB/PDF/print, audiobook, translation/localisation, preview, publish, Library, repurpose, marketing kit, study guide, authorship notes.

## 3. Layout (1440px reference)
| Part | Spec |
|---|---|
| Frame (navigation) | 248px expanded; 64px icon rail collapsed; soft navy `#172033` |
| Top bar | 56–60px |
| Claude panel | 320px default, 280px compact, **collapsible**; 12–16px gap to the page |
| Manuscript | 640–720px target, responsive; measure 65–80 characters |
| Page padding | 64–80px horizontal where space permits |
| Panel padding | 20–24px |
| Controls | 36–40px high; main action 44px; input radius 8px; panel radius 10–12px |
| Spacing | 4px grid; gaps 8/12/16/24/32 |
| Borders/shadows | 1px neutral `#E6E8ED`; shadow only on menus and floating overlays |
When space is short the Claude panel collapses first, then the frame becomes the icon rail. Below `lg` the frame is a drawer; below `xl` the Claude panel is a slide-over.

Frame hierarchy (one active-state treatment only): 1 project identity and switcher · 2 the four stages · 3 expandable manuscript tree (chapter completion shown here) · 4 My books, My voice · 5 engine and account status. Engine reads **"Claude Code · Automatic"** (or the real mode); plan and usage details live in its menu; its indicator never implies availability or activity that isn't true.

## 4. Colour and type
Canvas `#F7F6F2` (warm) — page colour is a **preference** (warm or white). Surface `#FFFFFF`. Text `#172033`. Secondary `#64748B`. Borders `#E6E8ED`. Primary action `#2563EB` — one main action per screen. The blue→violet gradient only on the primary AI action or a brand moment.
Interface: Inter 13–14px controls, 14–15px copy, 20–24px section titles, 12px metadata (sparingly). Manuscript: Newsreader 18px, line height 1.65–1.75; chapter titles Newsreader 34–38px / 1.15 in the writing view; section headings Newsreader 23–28px; running heads 10–11px **only in the book-page view**. Reader-controlled manuscript size and line spacing, separate from interface scale. No small caps on every structural element.
Dark mode: a tuned writing theme (not inverted colours), optional.

## 5. Write workspace
Three areas: **navigation** (binder), **canvas** (manuscript and review state), **assistant** (Claude panel, optional and collapsible).

### 5.1 Canvas views (contextual switcher, persists across chapters where sensible; scroll and selection preserved)
- **Writing** (default for editing): calm continuous manuscript, minimal decoration.
- **Book page**: the real typeset page (same engine as the print PDF): page size, running heads, drop caps, styles, numbers.
- **Changes**: current text vs the pending proposal.
- **Clean**: current text without markup.
- **Original**: the source text or a previous version.
- **Side by side**: synchronised versions.
- **Write myself**: hides AI affordances for manual work.
The title bar always says which chapter and whether the author is **editing**, **reviewing a proposal** or **viewing an earlier version**.

### 5.2 Claude panel — four modes (remembers the last; never switches by itself)
- **Ask**: discuss the chapter/book (project conversation, whole-book tools started from here report here).
- **Revise**: "What this chapter says" (with links to source passages where available), the author's idea, the five approaches, inherited rules, generate, progress, the active proposal summary.
- **Research**: references, evidence, citations (add citations, fact-check, verify scripture) and their verification status.
- **Notes**: chapter notes, page notes, the source-use record.
Results live in a contextual results area (all project outputs remain reachable).

### 5.3 Approaches — five option cards, each with a source policy (shown again on the review summary)
| Approach | Description | Source policy |
|---|---|---|
| Polish my book | Clarity and flow, author's meaning kept | existing manuscript |
| From my book only | Only the author's material, no outside research | manuscript only |
| My book + cited sources | External evidence with traceable citations | manuscript + references (citations **unverified** until checked) |
| Research-led | Argument built on research, research distinguished from the author's claims | research with provenance |
| New from outline | New chapter from the approved plan and notes | outline and book rules |
Selection persists per task. Never imply citations are verified because they were generated.

### 5.4 Revision lifecycle
1 Understand (summary) → 2 Direction (idea, approach, inherited rules/policy) → 3 Proposal (progress in the panel, not over the page; named stages: completed/active/failed; what actually happened; cancel) → 4 Review → 5 Record.
- Markup: additions = subtle tint + underline; deletions = strikethrough, muted red, only in Changes; citations = numbered markers; selection distinct from revision colours; never colour alone.
- Each change accepted/rejected individually; navigate between changes; accept all / reject all; changes summary.
- **Accept** = apply the proposal (or the accepted subset) to the current text **and keep the previous version**. Not a certification of facts or citations.
- **Redo** = keep the current text, generate a new proposal against it. **Discard** = drop the proposal only.
- Review bar appears **only** while a proposal exists and never covers the paragraph being read.
- The record keeps the accepted version, the previous version, the instructions, the source-use information and the changes.

### 5.5 Provenance
The per-chapter source-use record is a structured ledger: what the run **actually** accessed (files read, pages opened — from the runner's event log), separated from Claude's own account; supplied evidence vs newly researched evidence vs AI interpretation; page references where available; unsupported assertions and unverified citations flagged.

### 5.6 Notes
Margin/page notes are contextual (open in the panel), anchored to source page references now; anchoring to stable text ranges later. Page notes take precedence, then chapter notes, then book rules.

## 6. Trust features (before calling the redesign done)
Autosave with visible saved / saving / error; recovery after interruption; manuscript undo/redo independent of AI history; version history (named snapshots, autosaved revisions, before/after every accepted rewrite, restore without losing newer work); focus mode (hides frame, panel, notes and toolbars; a minimal floating control returns; Esc exits); cancel and retry for long tasks; a clear cost notice and engine before any API-billed run; keyboard system (⌘K palette for tools, chapters, files and actions with shortcuts; navigation; focus; revisions); visible focus rings, labelled controls, screen-reader announcements.

## 7. States (every major screen)
Empty/first use · loading · ready · editing · pending proposal · partially accepted · failed · offline/interrupted · saved/unsaved · read-only or engine unavailable · recovery after an interrupted session. First-project onboarding: short walkthrough of manuscript → publication.

## 8. Motion
Frame collapse 160–200ms; panel slide/resize 180–220ms; revision result 140–180ms; save confirmation a subtle label/icon change; AI progress as discrete named stages. `prefers-reduced-motion` suppresses non-essential motion. No pulsing gradients, animated borders, bouncing avatars or page flips.

## 9. Finish
Real previews of the current settings: the actual front cover (Cover Studio design; dimensional view optional and secondary), the typeset interior, with a format switcher **EPUB · Print PDF · Paperback · Audiobook** revealing each format's constraints. Readiness is actionable: missing front matter, unresolved placeholders ([[YOURS]], [citation needed], [placeholders]), unverified references and export errors link to their fix. Export opens a format/settings dialog and validates first.

## 10. Feature inventory (all must remain reachable)
Projects (create, rename, delete, switch) · uploads (PDF, Word, text, Markdown, scans; encoding fix) · join files · read scanned pages · compare versions · summarise · whole-book rewrite under strict instructions (staged, with the editorial check, §15) · citations & references · proofread · fact-check · verify quotes and scripture · readability · translate · marketing kit · study guide · index & glossary · remove AI patterns · rewrite in my voice · learn my voice / voice profile · turn into a series (+ save volumes as series, start planned books) · chat with project memory · results list, open/copy/.md/"rewrite this", edit before saving, short-result warning, save to Library · engine switch (Automatic / Claude Code only / API only, check again, re-run on API) · manuscript sections (front/body/back, add, reorder, rename, delete, write, autosave, word counts) · expand / add citations / in my voice / edit as I say / draft / improve (6 types) · [[YOURS]] markers · authorship notes · history · guided rewrite (what it says, idea, rewrite, restore original, progress, next chapter) · five approaches with "what Claude used" · page notes · book rules · knowledge base and reference documents · Book wizard drafts brought into the manuscript · outline with Claude · cover studio · interior styles · export EPUB/PDF/print/IngramSpark · audiobook · localize · preview/reader · production checklist · publishing package · save to Library (shelf, completed, contents) · repurpose · My books (categories, audiobook, add to series, work in Studio, learn voice).

## 11. Delivery passes (each a PR with screenshots)
- **Pass 1 — Workspace**: frame, top bar, canvas views (Writing default), collapsible Claude panel with four modes, approach cards, responsive layout, colour/type/spacing, autosave state, focus mode, empty and loading states; every feature in §10 reachable.
- **Pass 2 — Trustworthy writing**: per-change review, provenance ledger from the event log, version history and undo, keyboard system, failure/interrupted/recovery states, API cost notice.
- **Pass 3 — Publishing**: Sources and Plan in the system, Finish with real previews and format switcher, actionable readiness, dark-mode tuning, motion refinement, onboarding.

## 12. Checklist
- [x] Pass 1 complete (§3, §4, §5.1–5.3, §6 autosave + focus, §7 empty/loading, §10 all reachable)
- [x] Pass 2 complete (§5.4, §5.5, §6 remaining, §7 failure/recovery)
- [ ] Pass 3 complete (§2 Sources/Plan, §9, dark mode, §8, onboarding) — open items below

Itemised (ticked only when implemented and covered by a test or a reviewed screenshot; see `SCREENSHOTS.md`):

Pass 1 — Workspace
- [x] Frame 248px / 64px rail, navy `#172033`, one active-state treatment; project switcher with rename and delete; engine reads "Claude Code · Automatic" (screens 01, 08)
- [x] Top bar: chapter name and state (editing / reviewing / viewing an earlier version) that never truncates; view switcher; saved state (01, 02)
- [x] Canvas views: Writing (default), Book page (real typeset pages), Changes, Clean, Original, Side by side, Write myself (01, 02, 04)
- [x] Claude panel: Ask, Revise, Research, Notes; remembers the last mode; collapsible; a sheet below 1280px opened only by the owner (01, 11, 12)
- [x] Five approach cards with source policy, repeated on the review bar; selection kept per project (01, 02; test "revises a chapter")
- [x] Autosave with saving / saved, and focus mode with Esc (10; test "focus mode")
- [x] Empty and loading states for project, Write, Book page and Finish
- [x] Every feature in §10 reachable from the frame, a stage, the panel or ⌘K (09)

Pass 2 — Trustworthy writing
- [x] Per-change accept/reject, navigation, accept all / reject all, edit before accepting; Accept keeps the previous version (02, 14; tests)
- [x] Provenance ledger from the run's own event log, separate from Claude's account (Research mode)
- [x] Version history per section: named snapshots, autosaved revisions (at most every 10 min), before every accepted change and every restore; restore never loses newer work (15, 16; tests `section-versions`, "version restore")
- [x] Undo/redo of book changes independent of Claude's history (⌘Z / ⌘⇧Z outside text fields; buttons) (test "undoes and redoes")
- [x] Keyboard system: ⌘K palette with an Edit group, ⌘. focus, ⌘\ panel, J/K/X/⌘↵ review (09, 14; test "keyboard")
- [x] Failure and recovery: save error with Retry; unsaved changes kept on the device and offered back; unreviewed suggestions survive a reload; offline banner and no runs offline (17; test "offers back changes")
- [x] Cost notice and engine before every API-billed run (section, whole book, tools, chat), with "don't ask again this session" (21; test "asks before a run billed to the API")
- [x] Cancel and retry for long tasks; "Run it on the API" when the plan's limit is reached

Pass 3 — Publishing
- [x] Sources and Plan inside the system (05, 06)
- [x] Finish: format switcher EPUB · Print PDF · Paperback · Audiobook with each format's constraints; readiness per format, each check linked to its fix (07, 18–20; tests `format-readiness`)
- [x] Real front cover from Cover Studio, with the optional dimensional view (spine from page count and paper) (18)
- [x] Dark mode tuned (08, 19, 24)
- [x] First-project onboarding, reopened from ⌘K (22–24; test "walks a first-time owner")
- [ ] Export opens a format/settings dialog that validates first (today: export is disabled until the format is ready, and the export panel opens)
- [ ] Motion refinement pass against §8 timings across every surface (frame, panel and revision timings are in; a full audit is pending)
- [ ] Writing view renders Markdown headings as headings while editing (today the marks are visible in Writing and hidden in Changes, Clean and Book page)

## 13. Quality bar (added on the owner's instruction to upgrade the specification, October 2026)
Every screen meets these measurable targets before a pass is called complete. They add to §1–§11 and never relax them.

| Area | Target | How it is checked |
|---|---|---|
| Responsiveness | Typing never waits on the network; a keystroke paints within one frame (16 ms) on a mid-range laptop | Manual check with the performance panel on a 60k-word book |
| Open a project | Manuscript visible ≤ 1.5 s on a warm cache; skeleton within 100 ms | Timed in the preview and on the deployed site |
| Book page view | First typeset page ≤ 3 s for a 6,000-word chapter; re-set ≤ 1 s after typing stops | Timed; pages capped at 60 per view |
| Save durability | No accepted text is ever only in memory: local copy on every change, server save ≤ 1.2 s after typing stops, visible error and retry on failure | Tests "offers back changes", save-error path |
| Reversibility | Every Claude change is a proposal; every accepted change and every restore leaves a version; undo covers every book change | Tests `section-versions`, workspace lifecycle |
| Honesty | No "Ready", "verified" or "saved" unless true; estimates are labelled as estimates; placeholders are never counted as content | Tests `format-readiness`; review of every status string |
| Accessibility | WCAG 2.2 AA: visible focus rings, every control labelled, state changes announced (`aria-live`), full keyboard operation, contrast ≥ 4.5:1 for text, reduced motion respected | Keyboard-only walkthrough of Sources → Finish; axe check per screen |
| Typography | Manuscript measure 65–80 characters; Newsreader 18/1.7; interface Inter 13–15; no font-loading layout jump (text re-measured when the font loads) | Screenshots 01, 08, 10 |
| Cost transparency | No API-billed run starts without the notice in §6; the engine in use is always visible | Test "asks before a run billed to the API" |
| Security | The runner stays owner-only; no customer path reaches it; credentials never leave the server | CLAUDE.md rules; review of every new network call |

## 14. Horizon to 2036 (direction, owner approval needed before any item becomes binding)
The Studio is built so its core promises hold for a decade even as models, devices and publishing formats change.

1. **Model independence.** Engines are adapters behind one interface (today Claude Code and the API). A new model or provider is a new adapter, never a redesign; each proposal records the engine that wrote it (already in the history) so provenance survives model changes.
2. **Provenance as a standard, not a screen.** The source-use ledger and version history map onto open content-credential formats (for example C2PA manifests embedded in exported EPUB and PDF), so a reader, publisher or rights-holder can verify which text the author wrote, which Claude proposed and which the author accepted.
3. **Local-first and collaboration.** The manuscript is already kept on the device until the server confirms it. The next step is a conflict-free merge model (CRDT) so the owner can write on two devices, offline, and later invite an editor with change-level review identical to Claude's (one review system for people and AI, no double features).
4. **Accessible publishing by default.** Exports meet EPUB Accessibility 1.1 / WCAG for publications: semantic headings, image descriptions (already flagged in readiness), reading order, language tags, and audio that stays in sync with text (read-along). Readiness reports these as constraints, like page minimums today.
5. **Archival durability.** Every book can be exported as plain Markdown plus a JSON record of versions and provenance (the `.md` and authorship-notes exports are the start), so the owner's work never depends on the Studio existing.
6. **Voice and multimodal authoring.** Dictation and spoken review ("accept the second change") come only after the text review loop is trusted, with the same proposal-first rule: nothing spoken changes the book until accepted.
7. **Measured quality.** A small, permanent evaluation set of the owner's own chapters (rules such as Yahusha/Yahuah, quotation fidelity, citation honesty) runs whenever a model, prompt or engine changes, mirroring the AI Teacher's release gates.
8. **Cost and sustainability.** Per-run cost and token use are recorded per book, so the owner can see what a book cost to write and choose engines accordingly.

## 15. Editorial quality pipeline for rewrites (adopted October 2026; governing source, verbatim: `source/2026-10-rewrite-review.md`)
The owner's review of a whole-book rewrite (Demonology I) found duplicate and skipped numbering, `[citation needed]` left in the book, an empty References section, front matter promising chapters the book does not contain, certainty that changed on the same subject, unmarked testimony, sensitive claims stated as fact, and inconsistent terminology. Its conclusion is binding: **rewriting is professional book editing, not sentence polishing, and it must be controlled by a pipeline that detects, explains and corrects defects before the book reaches the reader**, with deterministic checks wherever possible. The owner added: **"rewriting must not be verbatim … rewriting is to keep the idea but make it professional in several ways."**

### 15a. The standard every rewrite follows (both engines, word for word)
`REWRITE_POLICY` (whole book) and `SECTION_POLICY` (one section) in `services/polished-claude-runner/src/prompts.mjs`, mirrored in `src/lib/studio-tools.ts`; a test keeps them identical. In short:
1. **Rewrite, do not copy.** Every paragraph is re-expressed in clear, professional prose for the book's purpose (structure, precise vocabulary, varied sentences, transitions, synthesis where points accumulate). The ideas, teaching, arguments and convictions are kept, not the sentences. Only direct quotations and scripture stay word for word.
2. **No additions of substance.** No new theological claims, historical assertions, sources, statistics, course outcomes, credentials or coverage statements; every idea that is not the author's is listed under Additions.
3. **The author's certainty, in professional wording.** A qualification may be reworded ("I suppose" → "probably", "in the author's view") but is never dropped; an interpretation never becomes a settled fact; a firm conviction is never softened.
4. **Each kind of writing stays what it is**: scriptural quotation, interpretation, testimony (clearly presented as the author's testimony, not evidence), exhortation, course instruction.
5. **No unfinished work in the book**: no `[citation needed]`, placeholders, TODOs or editor's notes; no References heading without entries. Claims needing support go to the notes.
6. **Numbering and hierarchy**: every number once per level, in order, none missing; heading levels never skip.
7. **Front matter matches the book**: missing material is never written to fill a promise; the gap is reported.
8. **One term per concept** outside quotations, following the book's rules; deliberate variation is explained.
9. **Emphasis by house style** (italics), not capitals, keeping the author's force.
10. **Sensitive claims about groups of people** (sexuality, mental illness, disability, health) keep the author's conviction and certainty, never stronger, never as medical or established fact unless the author cites evidence, and are listed for the author to decide on. The engine never removes the author's perspective.

### 15b. The stages (source §5)
Claude Code runs the whole-book rewrite in six stages, each leaving a file: 1 source analysis (`rewrite-analysis.md`: chapters and numbering as found, front-matter promises against the contents, kinds of writing, terms) → 2 editorial plan (`rewrite-plan.md`: book type, numbering scheme, terminology policy, permitted changes, gaps to report) → 3 controlled rewriting, chapter by chapter, re-reading the instructions and the plan (`rewrite/NN-….md`) → 4 assembly (`rewrite.md`) → 5 editorial audit and targeted correction (only what fails) → 6 notes for the owner (`rewrite-notes.md`: instructions not followed, claims that need a source, promised but missing, sensitive claims, additions, structure changes, for you to check). The API engine applies the same standard per part and continues numbering across parts; its notes point to the editorial check.

### 15c. The independent audit (code, `src/lib/editorial-audit.ts`)
Deterministic, so the same book always gives the same report; it never edits. **Fix** (blocks export) · **Review** (judgement, for the author) · **Note**.
- Structure: duplicate and skipped heading numbers (numbered, "Section 20", "Chapter IV", "2.3"), numbered lists with a repeated or missing item, skipped heading levels, empty sections.
- Completeness: `[citation needed]`, `[[YOURS]]`, placeholders, TODO/TBD; drafting remarks from the tool; References/Bibliography without entries; unbalanced quotation marks; an academic course with no bibliography.
- Style: capitals for emphasis, doubled words, repeated paragraph openings, sermon-level density of rhetorical questions, mixed spellings.
- Logic: certainty and uncertainty about the same subject, repeated paragraphs, personal testimony to present as testimony.
- Terminology: the book's rules outside quotations; mixed names for one concept (Holy Ghost / Holy Spirit).
- Sensitive claims: sentences linking a group of people with demonic or spiritual causes, flagged for the author.
- Coverage: items in Contents or a course schedule with no matching chapter or section (word matching is an estimate, so Review).

### 15d. Faithfulness to the original (code, `src/lib/fidelity.ts`; source §3–§4)
The rewrite against the uploaded originals, with the book's rules applied to the original first (so Yahusha for Jesus is never a "change"): scripture references lost (Fix) or added (Review); quotations changed or dropped (Fix); qualifications removed (Fix at three or more) and certainty added; names and numbers only the rewrite contains (possible invented details); headings with no counterpart; much shorter (dropped teaching) or much longer; **sentences copied unchanged outside quotations** (Review above 30%, Fix above 60%: a rewrite re-expresses the ideas).

### 15e. Where the author sees it (one check, three places, and a correction)
- **Result viewer** for whole-book results: a summary line, "Editorial check" with the full report and, for `rewrite.md` and `voice.md`, the comparison with the originals; saving to the Library with problems to fix asks first. Report downloadable as Markdown.
- **Each section suggestion** (including "Rewrite all chapters" in Plan): "Checked against your text" above the changes, before accepting.
- **Targeted correction**: "Correct these with Claude" sends the findings (editable) as a correction, not a new rewrite; passages that pass stay as they are; the result is a separate "Corrected book" (`corrected.md`) to check again.
- **Finish**: an "Editorial check" tab; problems to fix are a required readiness item for every format (export waits for them), each place opens its section.

### 15f. Checklist
- [x] Owner's review recorded verbatim (`source/2026-10-rewrite-review.md`)
- [x] Editorial standard on both engines, word for word, with the "rewrite, do not copy" rule (test `rewrite-policy.test.ts`; runner test "whole-book rewrite runs in editorial stages")
- [x] Six-stage whole-book rewrite on Claude Code; API parity per part with numbering continued
- [x] Deterministic audit of structure, completeness, style, logic, terminology, sensitive claims and coverage (`editorial-audit.test.ts`, built from the review's own examples)
- [x] Faithfulness comparison with the original, including copied sentences (`fidelity.test.ts`)
- [x] Check in the result viewer, on section suggestions and in Finish readiness (`EditorialCheck.test.tsx`; Finish export waits for problems to fix)
- [x] Run on the owner's real Demonology I rewrite: it reported "nothing blocks publishing", which exposed the formats the audit did not read (fixed in §16a)
- [x] Targeted correction: "Correct these with Claude" in the check opens the rewrite dialog as a correction with the findings filled in (editable); both engines fix only those and write a separate "Corrected book" with notes (runner test "a targeted correction…", `parts.test.tsx`, `EditorialCheck.test.tsx`)
- [x] Judgement-level review by a model as a separate, labelled pass (coherence of arguments, contradictions in meaning), never replacing the code checks (§16b)

## 16. Rewritten-book review workflow (adopted October 2026; governing source, verbatim: `source/2026-10-review-workflow-brief.md`)
The owner showed the live preview of the real Demonology I rewrite reporting "nothing blocks publishing, 3 to review" on a book the §15 review had found full of defects, and forwarded a brief: keep the interface, but make the check an evidence-based report, add the comparison with the original, version history, and a publication approval separate from saving.

### 16a. Why the live check missed the defects (fixed)
The audit read only Markdown headings and plain brackets. Real rewrites write section labels as bold lines (`**20. Sift**`) or as numbered lines standing alone before prose, escape brackets (`\[citation needed\]`), and put a note such as "(To be completed)" under References. All four are now read; a references entry must name a work (a year, URL, DOI or page). Tests use exactly these forms. The status no longer says "nothing blocks publishing": it says "No blocking problems found by the code checks" and lists what was checked, because code cannot judge an argument.

### 16b. Audit of the functions (before → now)
| Function (brief §) | Before this change | Now |
|---|---|---|
| Rewrite preview, save to Library, edit, copy, .md (§1) | Existed | Kept; closing with unsaved edits asks first |
| Comparison with the original (§2.1, instruction 2) | Missing for whole books (sections had Side by side and Changes) | **Compare with original**: chapter by chapter, side by side, words added and removed highlighted, scripture/numbers/quotations that changed inside a pair flagged, paragraphs only in the rewrite and paragraphs of the original not in it, a summary of changes, "Use my original wording" per paragraph; the original is read, never written; says plainly when there is no readable original (`src/lib/compare-book.ts`, `CompareView.tsx`) |
| Detailed report (§2.2, instruction 3) | Findings with level, area, places | Each finding has a code (S1, C2…), severity, category, chapter/section and line, passage, explanation, **suggested correction**, and a status: open, **dismissed** (review items only; blockers cannot be dismissed; remembered on this device), or **your decision**; **What was checked** shows passed / found / not run for each check, never a check that did not run as passed; **Go to the passage** opens the text with the line selected |
| Whole-manuscript validation (§2.3, instruction 4) | Headings only | Plus bold and stand-alone labels, escaped markers, references without usable entries, **cross-references** to numbers the book lacks; front/back matter in Finish readiness (§9) |
| Meaning and fidelity (§2.4, instruction 5) | §15d | Unchanged, plus the paragraph-level comparison |
| Targeted corrections (instruction 6) | Correct all findings | **Correct the selected findings** (each with its suggested correction); the result is a separate "Corrected book" checked again on opening, so nothing is marked resolved because a correction was generated. Sections: Write's section actions; a whole chapter: Plan/Write |
| Version history for rewrite results (§2.5, instruction 7) | Manuscript sections have versions (§6); a rewrite result is overwritten by the next rewrite; a correction writes `corrected.md` beside it | **Versions**: every content of `rewrite.md`, `corrected.md`, `voice.md` and `cited.md` is a numbered version (rerun, correction, API result, saved edit, restore; newest 30), kept by the runner outside `./out/` (so Claude never edits them) and in browser storage when the runner is offline; open any version read only or compared with the current text, restore it as a new version; edits are saved as a version with the version they were based on, and a save over a newer version is refused with the reason (runner test "book results keep numbered versions…", `parts.test.tsx`) |
| Publication approval separate from saving (§2.6, instruction 8) | Finish readiness gates export; saving to the Library asks when problems remain | **Approve for publication**: a dialog runs every check (code and, with the original, faithfulness), lists what passed, refuses while anything blocks, and asks the author to decide each review item (dismissed items count); the runner records the version, who and when, and refuses approval of anything but the latest saved version or with blockers; the approval lapses when a newer version is saved, and the status says so. Status beside the title: Draft · version N, Edited (not saved as a version), Approved for publication, or the lapsed approval. Saving to the Library records draft or approved with the version; exports (.md, Word, EPUB) are named "draft" until approved |
| AI review for judgement (instruction 4) | — | **Editorial review (Claude's judgement)**: a tool on both engines (same brief, test-enforced) reading the whole book for contradictions, unsupported conclusions, certainty against its basis, mixed voices, missing synthesis, claims about groups and front matter; labelled as a model's reading, not a check; never changes the text or replaces the code checks; reachable from the viewer (More) and the approval dialog, which records whether one exists for the version |

### 16c. Limits stated plainly
- The approval gate is enforced by the app (the checks run in the browser) and recorded by the runner; the runner refuses an approval reported with blockers or for anything but the latest version, but does not run the checks itself.
- Dismissals of review items are remembered on the device where they were made.
- Versions cover whole-book results; manuscript sections keep their own versions (§6).

### 16d. Checklist
- [x] Brief recorded verbatim (`source/2026-10-review-workflow-brief.md`)
- [x] Audit reads the formats real rewrites use; honest status wording; tests built from them (`editorial-audit.test.ts` "the formats real rewrites use")
- [x] Detailed report: codes, suggested correction, dismiss (review only), what was checked, go to the passage, correct selected (`EditorialCheck.test.tsx`, `parts.test.tsx`)
- [x] Cross-references checked
- [x] Compare with original, with restore per paragraph (`compare-book.test.ts`, `parts.test.tsx`)
- [x] Unsaved edits in the viewer ask before closing
- [x] Versions of rewrite results (numbered, compare, restore), kept by the runner and in browser storage; a save over a newer version is refused
- [x] Approve as publication-ready, separate from saving and exporting, with the approval recorded and lapsing on change
- [x] Export Word (.docx) and EPUB from the viewer through the same helper as Finish (`src/lib/book-export.ts`); drafts named as drafts
- [x] Judgement-level AI review pass, labelled as such, on both engines
