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
Projects (create, rename, delete, switch) · uploads (PDF, Word, text, Markdown, scans; encoding fix) · join files · read scanned pages · compare versions · summarise · whole-book rewrite under strict instructions · citations & references · proofread · fact-check · verify quotes and scripture · readability · translate · marketing kit · study guide · index & glossary · remove AI patterns · rewrite in my voice · learn my voice / voice profile · turn into a series (+ save volumes as series, start planned books) · chat with project memory · results list, open/copy/.md/"rewrite this", edit before saving, short-result warning, save to Library · engine switch (Automatic / Claude Code only / API only, check again, re-run on API) · manuscript sections (front/body/back, add, reorder, rename, delete, write, autosave, word counts) · expand / add citations / in my voice / edit as I say / draft / improve (6 types) · [[YOURS]] markers · authorship notes · history · guided rewrite (what it says, idea, rewrite, restore original, progress, next chapter) · five approaches with "what Claude used" · page notes · book rules · knowledge base and reference documents · Book wizard drafts brought into the manuscript · outline with Claude · cover studio · interior styles · export EPUB/PDF/print/IngramSpark · audiobook · localize · preview/reader · production checklist · publishing package · save to Library (shelf, completed, contents) · repurpose · My books (categories, audiobook, add to series, work in Studio, learn voice).

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
