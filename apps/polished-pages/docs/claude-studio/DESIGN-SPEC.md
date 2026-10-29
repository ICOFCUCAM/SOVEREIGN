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
| Claude panel | 460px on screens 1600px and wider, 380px from 1366px, 320px below; the owner drags it between 320 and 640px (remembered); **collapsible**; full height against the right edge of the window with a small 14px gap and a soft shadow (deviation approved by the owner, 28 October 2026: "GO", then "extend it to the end of the right", "leave just a small gap for design", see §21) |
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

## 17. Rebuild as a professional book (adopted October 2026, on the owner's instruction)
The owner, 27 October 2026: "Here Claude was supposed to have a place where you can instruct it to reorganise all as a true professional book and not just follow the manuscripts only." The whole-book rewrite (§15) keeps the manuscript's order and re-expresses it; the Plan stage's old "Restructure" outline took no instructions and added its chapters beside the old ones instead of replacing them. Rebuild is the one place for a new structure; "Restructure" is removed from the outline styles (the other outline styles stay).

### 17a. The flow (Plan → Rebuild as a professional book)
1. The owner chooses a book type (course textbook, non-fiction for general readers, academic study, teaching and ministry book, practical handbook, or their instructions only), writes instructions for the whole book, and chooses where chapters come from (from my book only, or my book + cited sources).
2. Claude reads the whole of the material (uploads, and the manuscript on Claude Code) and writes an inventory, then a design: reader, rationale, sections in reading order (parts only where natural, number of chapters set by the material), for each section its summary, key points, **what it draws on** and its apparatus; **not placed** material with the reason; **missing** items for the author.
3. The owner reviews the design. Nothing changes until "Use this design". The manuscript's sections are then replaced by the designed ones, each with its plan; the replaced manuscript is kept (newest five) and can be restored from Plan; the rebuilt one is kept in turn when restoring. Undo also works.
4. "Write the N empty sections" writes chapters first, then the front and back matter that summarise them, each a suggestion the owner accepts. Every section is given the book's design (type, apparatus, the owner's instructions, the standard), its own plan, and the manuscript before the rebuild as the author's latest material; length follows the material, never padded.
5. Finish (cover, interior, production, audiobook, translation, AI Teacher, Library) works on the rebuilt manuscript, as on any manuscript.

### 17b. The standard (word for word on both engines: `src/lib/book-design.ts` DESIGN_RULES and BOOK_TYPES, runner `src/prompts.mjs`; `book-design.test.ts` keeps them identical)
Publisher's design, not the manuscript's order; everything placed or listed; the author's teaching, convictions and certainty lead, nothing added; apparatus from the book's own content; chapters re-expressed, quotations and scripture word for word; one numbering scheme; gaps reported, never filled.

### 17c. Results reach the book (from the audit of what was built but not shown, 27 October 2026)
- A whole-book result (rewrite, corrected, voice, cited, proofread, translation) can become the book's manuscript ("Use as the manuscript"), so Finish works on it; the earlier manuscript is kept to restore.
- A saved design (`book-design.json`) can be applied again from the result viewer; other JSON results say what they are for.
- Runs and results open from every stage (Results in the top bar), with Stop for a running whole-book job, also for projects with no chapters yet.
- Redo repeats the whole request (instructions, improvement type, factor, citation style, voice), not only the action.
- "Claude is busy in another project" is shown; the palette offers Changes and Side by side only when there is a suggestion.
- The Library's book view counts chapters from the book's headings (it said "0 chapters").

### 17d. Limits stated plainly
- Rebuild needs the book uploaded in Sources (chapters are written from it).
- On the API the design reads at most about 400,000 characters of material in one request; Claude Code reads all of it.
- "Draws on" and "Not placed" are Claude's account; the comparison with the original (§16) is the check of what the rewrite kept.
- The Book Creator wizard's chapter and improve steps on Claude Code are not used by Claude Studio (Studio writes through manuscript sections); they remain for the wizard.
- The Library page is used by every customer, so its export and interior tools stay; for a book made in Claude Studio it is a companion, not a second Finish (§17f).

### 17f. Added on "add those left" (27 October 2026)
- Library: a book saved from Claude Studio keeps its author, trim size, draft or approved status and its Studio project (kept when edited in the Library); its page says so and links to "Finish in Claude Studio" (`/admin/claude?project=…` opens that project); the interior tools start with the book's author and trim; one EPUB export per page (the reader's own EPUB button is off where the export list has one).
- Finish: Marketing and Study guide tabs, written from the manuscript as it stands. Every tool can now work on "The book's manuscript, as it stands" (both engines), not only on the upload or a result.
- Write: previous and next section at the end of each page, and "Next: …" after accepting a suggestion, for working through the book chapter by chapter.
- Results: each suggestion is named after its section ("Suggestion · …", "What it says · …", "What Claude used · …").
- Narrow screens: the page views are a menu.

### 17e. Checklist
- [x] Owner's instruction recorded (above)
- [x] Book types, instructions and source choice; design with draws-on, not placed and missing (`BookDesignDialog.test.tsx`)
- [x] Same standard on both engines (`book-design.test.ts`, runner test "rebuild as a professional book")
- [x] Design replaces the manuscript only when the owner applies it; replaced manuscript kept and restorable (`book-design.test.ts`)
- [x] Designed sections written with the design, their plan and the manuscript before the rebuild (runner test; `sectionContext`)
- [x] Old "Restructure" outline removed (it appended instead of restructuring)
- [x] Whole-book result → manuscript; saved design re-applied; runs and results from every stage; full Redo; busy elsewhere shown; chapter count in the Library
- [x] Every stage, Finish tab and card clicked through in the preview with no page errors; screenshots 42–47
- [x] §17f: Library keeps the book's details and links to the Studio; Marketing and Study guide in Finish on the manuscript (runner test "Finish's tools work on the manuscript"); previous/next section; suggestions named after their section (`output-label.test.ts`); view menu on narrow screens

### 17g. Corrections after the owner's check of the live Studio (27 October 2026)
- Plan, Write and Finish showed the Sources page whenever the project had no manuscript yet, so the four stages looked identical. Each now has its own page saying what it is for and offering every way to start: Rebuild as a professional book (straight from the upload), Split into chapters, the Book wizard, a blank book.
- The Book wizard (Book Creator: quick, guided, restructure, improve, publishing-ready; depth; writing voice) was part of Claude Studio until the workspace redesign (commit 49dc52be), which dropped it without telling the owner. It is back inside the project, on the engine in use: Plan (Book wizard), Sources ("Or start from the Book wizard") and the no-manuscript pages; its chapters come into the manuscript with "Bring them in".
- [x] Tested: `Workspace.test.tsx` "shows Plan, Write and Finish as their own pages before there is a manuscript… and opens the Book wizard"

### 17h. Everything the redesign dropped, found and restored (27 October 2026, owner: "look all those you dropped without telling me and restored")
Found by comparing every button and label of the Studio before the redesign (`ClaudeStudio.tsx` before commit 49dc52be, `ManuscriptEditor.tsx` before 0c6b15ef) with today's code.
- [x] Book wizard (quick, guided, restructure, improve, publishing-ready) inside the project: dropped in 49dc52be; restored (§17g).
- [x] "Add below" (keep your text and add Claude's suggestion beneath it): dropped in 0c6b15ef; restored in the review bar (Write).
- [x] Results grouped (main results first; rewritten chapters, series volumes, planned books, Book wizard files, translated chapters and manuscript suggestions folded into groups): dropped in 49dc52be; restored in the Claude panel and in Ask Claude · Results.
- [x] The conversation with Claude ("How it works", Ctrl + Enter to send) for a project with no chapters yet: lost in 49dc52be (the Claude panel needs a chapter); restored in Ask Claude · Results on every stage.
- [x] "Next chapter" in the guided rewrite: dropped in 0c6b15ef; restored (§17f).
- Removed with notice, not restored: the Plan outline style "Restructure" (it added chapters beside the old ones instead of restructuring); restructuring is in Rebuild as a professional book and in the Book wizard's Restructure mode.
- Renamed, not dropped (checked): Restore original → "Put this version back"; Put them back → "Restore these changes"; Correct these with Claude → "Correct N selected with Claude"; Delete project → "Delete this project"; drag-and-drop upload, Check again, Run it on the API, Lost the live view and the engine modes are all present.

### 17i. Studio and Library, linked both ways (27 October 2026, owner: "there seems to be no connection from the Studio to the Library")
- [x] Studio → Library: "In your Library" in the top bar opens the project's Library book; Finish → Save to Library updates that one book; a result saved to the Library is linked to its project, and saving it again updates the same Library book ("Update in Library") instead of adding a copy (`parts.test.tsx` "result viewer and the Library").
- [x] Library → Studio: a book made in the Studio links to "Finish in Claude Studio" (its project); any other book offers the owner (admins only, never customers) "Work on it in Claude Studio" (`/admin/claude?import=<id>`).
- [x] "Work in Studio" (My books and the Library) links both ways: the new project's manuscript records its Library book and the Library book records its project; a book that already has a project opens that project instead of creating another.
- Limit: Library books saved before this change carry no project link; "Work on it in Claude Studio" makes a new project for them (and links it from then on).

## 18. Claude on a Library book (owner only; adopted 27 October 2026 on the owner's request: "can Claude chat be added here so I can correct directly using Claude")
- Shown on a Library book's page to the owner only (admin check in the page; `studio-api` refuses anyone else). Customers never see it.
- **Correct a part:** choose a headed part of the book, or the text selected on the page; ask (correct the English / rewrite professionally / clearer and tighter / own words); the book's rules apply (default: Yahusha, Yahuah, never Jehovah or Yahweh; quotations unchanged otherwise; editable, kept per book). Claude's change is shown word by word; nothing changes until "Accept into the book"; then Save changes keeps the earlier text in History. The same editorial standard as a section rewrite (§15a SECTION_POLICY).
- **Ask about the book:** answers from the book's text; the book is not changed.
- Runs on the owner's Claude Code (the runner), never on the API (owner's instruction, 27 October 2026: "this should run on Claude Code and not API calls"). The book's text goes with the request (runner tools `library-revise` and `library-ask`); it runs in the book's Studio project when it has one, else in one "Library corrections" project. If the runner is not reachable or busy, the panel says so; it never falls back to the API. Whole-book work stays in Claude Studio.
- [x] Tested: `LibraryClaude.test.tsx`; runner test "Claude on a Library book runs on Claude Code".

### 18a. Scanned PDFs (27 October 2026: "why is Claude failing to rewrite the pdf?")
A scanned PDF (pictures of pages) has no text, so the rewrite had nothing to work from; "Read scanned pages" wrote its transcription only as a separate result, so the upload stayed "No text yet" and Split, Rewrite and Rebuild still found nothing.
- [x] The transcription now becomes the scanned document's own text (runner: per-file `out/scanned/<name>.txt`, adopted as the upload's text copy), so the card shows "Text ready" and every action uses it (runner test "read scanned pages").
- [x] A rewrite, summary, citation run, tool or rebuild on uploads that are all scans offers "Read the scanned pages now?" first instead of a run that fails (`scanned.test.ts`).
- [x] Root cause of "Claude finished without writing the result" on onenessofgod.pdf: Claude Code reads PDF pages with `pdftoppm` (poppler-utils), which the runner image did not have, so it could not open the scanned PDF. The Dockerfile now installs poppler-utils; the scan prompt reads at most 20 pages at a time, writes as it goes, and reports a file it cannot open; a job that ends without its result now shows Claude's own last words.

### 18b. Password-protected PDFs (27 October 2026: "can it open such that I insert password?")
onenessofgod.pdf is password-protected: no tool on the runner can open it without the password. (DeployPro builds the runner's Dockerfile as written, so poppler is present from commit 452e015 on; the password was the real block.)
- [x] On a PDF without text, Sources offers "open it (password or scanned pages)". The owner's browser fetches the PDF from the runner and opens it (pdf.js), asking for the password when it has one and saying when it is wrong. The password stays in the browser.
- [x] A PDF with its own text: the text is saved as the upload's text copy at once ("Text ready"); nothing is scanned.
- [x] A scan: each page is drawn as a JPEG in the browser and stored on the runner as a page image (`<name>-p001.jpg`…); Read scanned pages then reads those images, which needs no poppler; the transcription becomes the PDF's text (§18a). Removing the PDF removes its page images.
- [x] Tested: `OpenPdfDialog.test.tsx`; runner test "a password-protected PDF"; pdf.js checked against a real encrypted PDF (no password: asks; wrong: says so; right: opens with its text).
- [x] Fixed: a scan that could not open the PDF left a note ("This file could not be opened… password-protected"), and §18a adopted it as the PDF's text ("Text ready, 95 words"), hiding the password option. The runner now never adopts such a note (and the combined transcription only with its page markers); the card says "No text yet: Claude couldn't open this file" for an old note and offers "open it (password or scanned pages)"; a PDF with text keeps "open it again"; a re-read removes the earlier text copy and its new transcription replaces it (runner test "a report that a PDF could not be opened"; `scanned.test.ts`; `OpenPdfDialog.test.tsx`).

### 18c. A large book (onenessofgod: 84,954 words) — 27 October 2026
- [x] Saves of more than 256 KB go gzipped (runner reads `Content-Encoding: gzip`; an older runner gets the plain body), so a whole book passes proxies that cap request size; when the runner doesn't answer a large save, the message says so and that the changes are kept on the device (runner test "a large save may arrive gzipped").
- [x] Splitting plain text from a PDF takes only real headings ("CHAPTER 3", "Chapter 3: The Name", "Part II"), not sentences that start with the word ("Chapter 4 affirmed that…", "chapter 9.) In short…") (`manuscript.test.ts`).
- [x] Plan → "Split the upload again" re-splits with that rule; the earlier chapters are kept to restore.

## 19. Organise into chapters and sections (adopted 28 October 2026, owner: "a book is uploaded and a function organises it into chapters and sections; even rewritten books can come here for a redesign of titles and chapters")
- Plan → "Organise into chapters and sections" (also on the no-manuscript pages). The book: the manuscript as it is now (a rewritten book made the manuscript too), the uploaded book, or a book uploaded in the dialog.
- Claude (Claude Code, or the API when that is the engine; the same prompt, word for word, tested) reads the whole book and returns, for every part (front matter, parts, chapters, back matter) and every section inside a chapter, its kind, a title and "starts" (its first words copied from the book). Titles: keep the author's, or write clear titles.
- The Studio splits the text at those places itself (`src/lib/organise.ts`), so no word changes: old heading lines are replaced by the titles, section headings become "### ", text before the first part is kept as "Opening pages", a place that can't be found is reported and its words stay with the part before. The review shows every part with its word count and sections, the words kept, Claude's notes; nothing changes until "Use these chapters"; the replaced chapters are kept to restore.
- [x] Tested: `organise.test.ts` (split, nothing lost, missed parts, same prompt on both engines), `OrganiseDialog.test.tsx`.

## 20. Book Rewrite Control Panel (adopted 28 October 2026; governing source, verbatim: `source/2026-10-rewrite-control-panel-brief.md`; the owner's Demonology instruction, verbatim: `source/2026-10-demonology-transformation.md`)
- In the Rewrite dialog: "Open the control panel". Project fields (title, subtitle, author, language, readers, publishing format, name of this version, notes, terminology rules; source and output shown: the dialog's "Work on", the project's Results with versions, the original never changed).
- Every operation of the brief, groups A–K (108), each a checkbox with its label (the brief's words) and a short explanation; collapsible groups with counts. Presets: Faithful Professional Rewrite, Complete Book Transformation, Faithful Rewrite — No Content Removal, Publication Preparation, Theological and Scripture Audit, Custom. Choosing a preset after changes by hand asks first; the active preset and "changed by hand" are shown; the number of operations is shown.
- Controls: select all, clear all, preset, save as my default, reset to defaults, preview, copy, use. The configuration is kept per project as it is left (browser storage, the Studio's existing mechanism for preferences); the saved default starts new projects.
- The owner's "Complete Book Transformation — Demonology: The Battle of Angels" instruction, word for word, under its own checkbox (read from the source file, never retyped).
- The instruction is built readably from the choices only: the project, the workflow, the chosen operations by group, limits stated where an unticked operation could be read as permission (structure kept, no merging, no deletion, no additions), terminology rules, deliverables with their file names, and the rules that always apply (original untouched, whole manuscript, progress record, no truncation, never invent, no false completion). "Require approval" is the workflow, said once. DOCX: the Studio exports Word from the result (Claude writes Markdown).
- Workflow: Approval mode runs the analysis and the plan only (`rewrite-analysis.md`, `rewrite-plan.md`) and stops; the plan opens in Results with "Approve this plan and rewrite the book", which runs the rewrite from the approved plan (earlier chapter files set aside). Autonomous mode runs the whole staged rewrite. An audit preset (no prose or structure operations) writes the reports only (`rewrite-audit.md`). Approval mode and audits run on Claude Code; the API engine says so.
- [x] Tested: `rewrite-panel.test.ts` (groups, presets, changed-by-hand, instruction content, limits, audit), `RewriteControlPanel.test.tsx` (panel in the dialog, preset, checkbox, preview, use, approval flags, the verbatim instruction), runner test "the rewrite control panel"; screenshots 48–49.

## 21. Closing the gaps (adopted 28 October 2026; the owner approved the list of twelve gaps with "ok")
- **Runner level.** The runner reports its level and features (`/health`, `/v1/me`); the Studio needs the current level (5) and shows a banner naming what to do when the runner is older or poppler is missing. A save or call that fails says whether the runner is down or the request was refused on the way.
- **Queue.** While Claude is working, a new job waits in the runner's queue (up to 12) and starts by itself; the Studio shows it as "Waiting"; cancelling a waiting job removes it.
- **Finished while away.** When a whole-book or section job finishes or fails while the Studio tab is hidden, the tab title is marked (✓ / ⚠) until the owner returns, and a browser notification is shown if the owner allowed it (asked once, when a long job starts).
- **Continue where Claude stopped.** A rewrite that stops (limit, error, stopped by the owner) keeps its chapter files; the project shows "Claude stopped before finishing (N chapters written)" with "Continue where Claude stopped", which runs on Claude Code with the stopped run's instructions, keeps the finished chapters, completes a cut-off one, writes the rest and assembles the whole book. A scan that stops says how many pages were read and continues from the next page.
- **Scans in batches.** A scanned document is read 20 pages per run (page count from the Studio's page images, else the PDF); each run adds its pages to the document's text (kept as it goes, page markers removed) and queues the next batch, which the Studio follows; "Read scanned pages" again starts from page 1 and sets the earlier reading aside.
- **Change the plan before approving it.** In Approval mode the plan opens with "Edit the plan"; "Save the plan" keeps the owner's version (Claude's first proposal is kept as `rewrite-plan.claude.md`), and approving with unsaved changes saves them first. The rewrite follows the owner's version where the two differ.
- **Very long chapters.** Plan marks any section over 15,000 words and says why it matters, with "Organise into chapters and sections".
- **Correct the division before applying it.** In Organise's review each part's title and kind can be changed, and a part can be joined to the one before (its title becomes a section heading there, so no word is lost).
- **Find and replace in the book.** From Plan ("Find and replace"), the command palette, or ⌘⇧H: whole words, match case, titles too; every match listed with its context and chosen one by one; matches inside quotations (quotation marks or block quotes) start unchosen; each changed section keeps its earlier text in its version history; Undo works.
- **Backup of a project.** The project menu's "Download a backup of this project" saves one .zip: the manuscript (with every section's versions), the uploaded documents as uploaded and their text, every result, the earlier versions of whole-book results, the conversation, and a README listing anything that could not be included. (Restoring from a backup is not built yet; the files open in any editor.)
- **Check before exporting a result.** Word and EPUB from a result's viewer open a short summary first: the editorial check's blocking problems and decisions, a warning that the text may be incomplete, whether the version is approved (else the file is named a draft), unsaved edits included; "See the check" or "Export anyway". (Finish keeps its own readiness check before its exports.)
- **Formatted writing.** Under the Writing text, "Show formatted" shows the section with its headings, bold, lists and quotations as they will read (kept on this device); a click on the text, or "Edit the text", returns to writing.
- **The book page is the whole book.** Book page sets the whole manuscript as it will print (title page, the contents filled with every section and its page, front matter, chapters, back matter) and opens at the section, with "Show the title page and contents". Its toolbar chooses the format (A4, A5, B5, US and UK trade sizes, mass-market, Kindle and phone screens for how the ebook reads) and the page design: 14 interior styles (Classic, Literary, Modern, Devotional, Academic, Large print, Elegant, Scripture study, Textbook, Memoir, Minimal, Contemporary, E-reader, Manuscript submission), typefaces, size, line spacing and margins: the same settings Finish and every PDF export use. A heading is never left at the foot of a page (it keeps at least two lines of its text), a paragraph never leaves one line alone at the foot or the top of a page, and a title written as a file name is set with spaces and made small enough to fit.
- **Saves reach the runner.** The runner allows PUT from the site (it never did, so the browser blocked saves of the manuscript, results and voice profile; the Studio kept them on the device). A project's title from an uploaded file has no underscores.
- **The Claude panel, upgraded (owner's approval 28 October 2026, "GO", and the owner's mockup: "check what is on the image that we don't have and use it to upgrade ours"; "our features remain, only upgrade").** Larger type (15px text, 16px headings in the panel), wider and resizable, full height at the right edge (see §3). Header "Claude" with Revise, Research, Notes and Citations as tabs; Ask is the box docked at the foot ("Ask Claude about this chapter/section", the section attached), whose expand button opens the whole conversation with its actions (Summarise, Rewrite the book, Join files, More tools). Revise: the current section (kind, number, words, "Read it" with Claude's summary), "What would you like to do?" (Improve flow, Clarify the argument, Preserve my meaning, Develop the explanation), additional instructions (the section's idea, with a count), source policy in one row ("Change" shows the six), advanced editorial settings (the book's rules and page notes, citation handling, rewrite scope), the action pinned at the foot; "More for this section" unchanged. The goals and settings are written after the owner's own words into the idea Claude follows (both engines). Citations: the scripture, works cited and quotations found in the section, and "Add citations" for the section (whole-book citations and quotations stay in Research). Writing has a formatting toolbar (paragraph style, bold, italic, lists, quotation, link) that keeps the book's own marks. Book page view: the panel holds the page design at full size, with "Ask Claude" to switch (remembered). Quotations ("> " lines, or one introduced with a colon and closed by its source) are set indented and smaller in the printed book.
- **The owner's second mockup, and the ten additions ("ADD ALL", 28 October 2026; "don't change what is already good, only upgrade").**
  - Chat at the foot of the page area, docked like Claude Code's input: the section it is about (or the whole book), "Current section attached", "+" for the whole-book actions, dictation (the site allows its own microphone), stop, the engine; the answer opens in the panel's conversation.
  - Search in book: ⌘K ("Search in book…") finds the words in every section and opens the place selected.
  - Research this section (top of Research): Claude finds scripture, related topics and scholars (checked, never invented; on the API without web access, scholars are marked unchecked), and "My sources" searches the uploads and the manuscript.
  - The book's three areas in the sidebar and Plan: Front Matter (with the book cover, made in Finish, and the automatic table of contents), Main Matter, Back Matter; new kinds Half-title page and Author's note; the half-title page is set before the title page and the contents before the introduction (the owner's front-matter order).
  - Live rule checker in Writing: words that break the book's naming rules, outside quotations, shown and fixed with one click.
  - Footnotes (toolbar; [^1] in the text) printed as numbered notes at the end of their chapter; images and figures (toolbar) kept with the book and printed at the text width with their captions; scripture verses inserted word for word from a public-domain translation (bible-api.com) as quotations with their reference; comments on selected words, listed in Notes (show, resolve, delete).
  - Edit on the Book page: a paragraph clicked on a set page opens for correcting, and is saved into its section.
  - Suggestions waiting: every suggestion of Claude's for the whole book in one list, to review change by change, accept or discard.
  - Restore a project from its backup (project menu): a new project with the manuscript, documents and results; the original is never touched.
  - Publishing package (Finish → Publishing package, above the publishing metadata): interior PDF, EPUB, metadata sheet and the cover's size with its spine, checked against KDP and IngramSpark (print size, 24–828 pages, author, ISBN, cover).
- Runner level 5.
- [x] Tested: runner tests "runner level", "queue", "a long scan is read in batches", "a rewrite that stopped can be continued"; `runner-level.test.ts`, `notify.test.ts`, Workspace "offers to continue a rewrite that stopped"; runner "the plan waiting for approval can be changed"; viewer "lets the owner change the plan before approving it"; Workspace "warns in Plan about a very long chapter"; Organise "lets the owner correct the division"; `find-replace.test.ts`; Workspace "finds and replaces across the book"; `project-backup.test.ts`; viewer "shows what the checks found before exporting Word"; Workspace "shows the writing formatted when asked"; typesetter "page makeup" (headings, file-name titles, where sections open) and every interior style; `BookPageView.test.ts`; runner CORS test (PUT); typesetter "quotations"; `revise-goals.test.ts`, `markdown-format.test.ts`; Workspace "shows the page design beside the Book page"; screenshots 61–71; `rule-check.test.ts`, `insertions.test.ts`, `research.test.ts`, `project-restore.test.ts`, `publishing-package.test.ts`, `page-edit.test.ts`; typesetter "front matter in order", "footnotes", "figures"; runner "research", "restored from its backup"; Workspace "shows words that break the book's rules".

## 22. Front matter, back matter and arranging the book (adopted 28–29 October 2026)
Owner's brief: "Review and implement a complete, professionally structured front-matter system… Do not begin the book's main text immediately after the title page." Order: cover (separate), half-title, title page, copyright, dedication, epigraph, foreword, preface or author's note, contents, introduction, chapter 1. "The author must be able to enable, disable, reorder, edit and preview the optional preliminary pages." "Do not invent the author's name, copyright owner, publication year, ISBN, publisher, foreword writer, endorsements, dedication or biographical details." "The book system must be able rearrange the informations of the book to fit the different sections… where there is no information, write something professional." Also: "dont forget to also organise the backmatter too"; "the front matter and back matter should have an additional onboarding section where the write can write what they want, with a botton that ask for rewrite the information more professionally, after it is rewriten, you can repeat or accept and move to next step until the front matter is complete. if the front and back matters are part of the manuscript, they can be added automatically with edit button on each section. either manual or with ai".
- **Arrange from the book's own contents.** Organise → "From the book's own contents" (the default): a typed contents list at the top of the text is the author's map. Each entry is found where it stands as a heading; numbered entries become chapters, their sub-entries sections (###), Introduction/Preface/… front matter, Conclusion, Appendix, Discussion questions, Glossary, Notes, References/Bibliography, Index, About the author, Also by, Resources back matter. The title block becomes the title and subtitle (all-capitals titles set in title case); a working label ("COMPLETE MANUSCRIPT") and the typed list are set aside and said so. Sections are put in conventional order (front, chapters in the author's order, back in printing order; acknowledgements stay where the author placed them). No word changes; the owner reviews (title, subtitle, each part's title and kind) before applying; the manuscript before is restorable. Without a contents list, Claude reads the book as before.
- **Front and back matter, page by page.** Plan → "Front and back matter" (and "Go through it page by page" on the Front/Back matter headings, "Edit with Claude" on each such section): every page in printing order with its status (ready, to do, left out) and a progress count. Title page and copyright page are fields (title, subtitle, author, publisher; copyright holder, year, ISBN, edition, scripture notices) — an empty field or a [placeholder] prints nothing. Text pages: the author writes, "Rewrite it professionally" (Claude Code or API, the same question), "Rewrite again" as often as wanted, edit Claude's version, "Accept and go to the next page", or "Use my words as they are". Claude keeps every fact, adds none, keeps quotations word for word, follows the book's rules, and marks what it would need as [[YOURS: …]] (shown as "For you to fill in"). Pages Claude may draft from the book when the author writes nothing: preface, author's note, introduction, conclusion, discussion questions, glossary, bibliography. A page the manuscript has is shown filled in with "Edit it myself" and "Improve it with Claude". Any page can be left out ("Include this page in the book"); its text is kept. Accepted text keeps the page's previous text as a version.
- **Typesetting.** Half-title; title page with subtitle and publisher; copyright page (both layouts) from the supplied facts plus the standard rights wording, set once (a Copyright section's own lines, such as scripture notices, are added to it); dedication and epigraph as display pages (no heading, no contents entry, no folio); contents with chapter numbers and, optionally, sections, Roman-numeral references for preliminary pages, leaders that stop before the number, type size following the book's. Preliminary pages are numbered i, ii, iii (counted from the first page, blind folios on the title, copyright, contents and display pages); Arabic 1 starts at the Introduction (or Chapter 1). The Book page shows the same numbers.
- **Page design faults fixed across all fourteen styles** (owner: "check all the page designs and identify their faults"): drop caps never deeper than their paragraph (a short opening takes a smaller cap or none; the reader view keeps the cap inside its paragraph); three-line paragraphs kept together (no widow line); no doubled chapter number (a numeral label and a numbered title) or "Chapter 1" under a CHAPTER ONE label; contents leaders measured as set.
- **Checked before the book is complete.** In Finish readiness (print, paperback, EPUB) and beside the pages in the guide: front matter, chapters and back matter in the usual order; no page twice; no included page empty or with something still to fill in; title and author; the Preface not repeating the Introduction; the Introduction followed by Chapter 1 and chapter titles that carry a number matching their place. The contents are made from the headings, so they always match.
- [x] Implemented: arrange from contents, conventional order, page-by-page guide (both engines), typesetter front matter, Roman folios, contents levels and numbers, page-design fixes, front matter checks.
- [x] Tested: `arrange-book.test.ts`, `matter-guide.test.ts` (same prompt on both engines, order, status, setting and leaving out pages), `MatterGuide.test.tsx`, `manuscript.test.ts` (copyright once, omitted pages, display pages), `front-matter-check.test.ts`, typesetter "front matter conventions"; runner "front and back matter".
- **The ten further upgrades** (owner: "build them", 29 October 2026):
  1. Bold and italic inside paragraphs are set in their own faces in the print interior (italic inside italic text is set roman); a definition ("**Term**: meaning") starts at the margin.
  2. Page design: "Page 1 is" the Introduction or Chapter 1, and "Contents list" chapters or chapters and sections; used by the Book page and every export.
  3. "Put them in order" (Finish readiness and the guide) moves the front and back matter to their usual places; the chapters keep their order; Undo puts it back.
  4. One ISBN for the book: the guide, the copyright page and the cover's barcode share it (changed on the cover, it changes for the book); the guide and Finish say when it isn't a valid ISBN.
  5. Praise for the book: endorsements word for word (never rewritten), set before the half-title with each attribution to the right.
  6. The EPUB has the same front matter as the print book: endorsements, title page, copyright page, dedication and epigraph as pages of their own, a linked contents page, chapter numbers, block quotes, figures, footnotes as linked notes, and no markers.
  7. Index of scripture: every chapter-and-verse reference, by book in canonical order, with the pages it is printed on (in the EPUB, links to its chapters); an index the author wrote is kept as written.
  8. Short last pages: the Book page says which chapters end with only a line or two on their last page.
  9. Words joined by the import ("Yahushaand"): shown in Write for review, each with "Fix", and in Finish readiness; nothing changes until the author agrees.
  10. The copyright page previewed beside its fields, from the same lines the print interior and the EPUB use.
- **Fault found on the Oneness book and fixed** (owner, 29 October 2026: "are the table of contents not suppose to be numbered and also added with the opening pages? are the opening pages subtitles not part of the table of content?"): a section with its chapter's name ("2. Theophanies", then "Theophanies") ended the reading of the contents list, so the rest of the list was left as text ("Opening pages", set as Chapter 1) and the later chapters were not split out. A repeated entry now ends the list only when prose follows it; a chapter's numbered heading line ("2. Theophanies") is no longer left at the top of its text; text left unplaced is named in the review and is a required check; Organise can start again from "As it was before the last organising"; the contents list chapters and their sections by default (Page design can choose chapters only).
- **"Opening pages" recognised and put back** (owner, 29 October 2026: "the opening pages is not chapter one. the system must be able to identify chapter one. This opening pages are pages inside the table of content. even the table of content is still not numbered, open subpages not numbered"): a section that is the rest of the book's contents list (short heading lines, found again in the other sections) is named in Plan and Write; "Put the chapters and sections in place" rebuilds the whole list (the arranged parts and their sections, with the leftover entries where they stand) and arranges the book from it, for review before applying; text left as "Opening pages" is never set as a numbered chapter. Sections of numbered chapters are numbered 1.1, 1.2 in the text and the contents (Page design: "Section numbers", default on).
- **A small chat on each front or back matter page** (owner: "should have a small claude code chat where one can instruct claude to compose something for a number of words"): one line of instruction and "about N words", to compose a page or change Claude's version; the same on Claude Code and the API (runner level 7).
- [x] Tested: typesetter "emphasis inside paragraphs", "praise for the book", "index of scripture", "short last pages", "where page 1 is"; `export-epub.test.ts`; `joined-words.test.ts`; `front-matter-check.test.ts` ("putting the book in order", ISBN); `MatterGuide.test.tsx` (copyright preview).
