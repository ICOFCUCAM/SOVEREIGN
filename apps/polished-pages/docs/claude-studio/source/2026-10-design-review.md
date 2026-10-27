# Source document (verbatim): Claude Studio — Senior Product Design Review

Received from the owner on 27 October 2026 and adopted as binding ("document and strictly implement"). This is the original text as pasted, kept word for word; only line breaks and table layout were restored where the paste flattened them. `../DESIGN-SPEC.md` is the working specification derived from it; where the specification is shorter or silent, **this text governs**.

---

Claude Studio — Senior Product Design Review
Polished Pages · Desktop product · 1440px viewport · October 2026

## 1. My honest score: 78/100

Your proposed design has a credible foundation, but I would not yet consider it a premium publishing studio at the level of the strongest products in your comparison set.

The central issue is not that the interface is ugly or that it lacks features. It is that you are combining three different products — a manuscript editor, an AI editorial studio, and a book-production system — into one interface without yet establishing a sufficiently clear hierarchy between them.

Your strongest decision is treating the manuscript as a real book page rather than another generic text editor. Your biggest risk is surrounding that page with so many controls, status indicators, tabs, and toolbars that the author experiences a complicated control room instead of a confident writing environment.

Current proposed design: 78/100
Target after refinement: 92/100

These are my design assessments, not measured benchmark scores or usability-test results.

### Score breakdown

| Dimension | Score | My assessment |
|---|---|---|
| Visual identity | 17/20 | Strong editorial direction; dark navigation is somewhat generic |
| Writing experience | 17/20 | Excellent book-page concept; potential distractions from surrounding UI |
| AI workflow | 16/20 | Rich capabilities, but too much functionality competes for attention |
| Navigation and information architecture | 12/15 | Clear four-stage journey; five inspector tabs create ambiguity |
| Interaction and feedback | 9/15 | Good review actions; missing focus, history, recovery and interaction refinement |
| Publishing and accessibility | 7/10 | Broad output capabilities, but readiness, preview and accessibility need definition |
| Total | 78/100 | Strong concept; not yet a finished premium experience |

The comparisons require some nuance. Vellum, Atticus and Reedsy Studio excel at different aspects of book creation. Scrivener is especially relevant to manuscript organization, while Sudowrite is relevant to AI-assisted writing. iA Writer and Linear offer useful lessons in focus and interface discipline.

Claude Studio does not need to copy any one of them. It needs to combine their most relevant strengths without inheriting their complexity.

My recommendation: make the manuscript the product, make Claude the editorial partner, and make the interface disappear when the author wants to write.

## 2. The 10 most important problems, ranked

These are the changes I would prioritize before adding any new features. I am evaluating the design specification you supplied, not a live inspection of the deployed application.

### 01 — The screen has too many permanent interface layers (Critical)

Problem: A 272px sidebar, top toolbar, 660px manuscript, margin notes, floating review bar and 360px inspector are all competing for attention. At 1440px, this is already a dense layout before accounting for gaps and borders.

Fix: Make the workspace adaptive. Keep the manuscript central, allow the inspector to collapse, and make page annotations contextual. The review bar should appear only when a pending revision exists.

IMPLEMENTATION SPEC
- Navigation: 248px
- Inspector: 320px
- Manuscript: 640–720px
- Compact mode: Inspector hidden

Use a 12–16px gap between the manuscript and inspector. Hide the inspector or reduce the navigation to icons when space becomes constrained.

### 02 — The real-book page risks confusing editing with print preview (Critical)

Problem: The drop cap, running header, page number, shadow and print-like layout make the editor look finished, but may make ordinary editing cumbersome. Long paragraphs become harder to navigate if the author is always working inside a simulated printed page.

Fix: Separate the writing canvas from the typeset page preview. Do not remove the book-page aesthetic; use it selectively.
- Writing view: a calm, continuous manuscript with a readable measure and minimal pagination decoration.
- Book-page view: accurate page dimensions, running headers, drop caps, section styles and page numbers.
- Compare view: synchronized original and proposed versions.

The author should be able to switch between these without losing scroll position or selection.

Default to writing view when editing; default to typeset view when checking the book's visual quality.

### 03 — The AI workflow is too concentrated in the right inspector

Problem: Five tabs — Rewrite, Notes, Sources, Chat and Results — combine different jobs, while the rewrite panel also contains chapter understanding, writing instructions, five approaches, active rules and numerous tools.

Fix: Establish one persistent Claude panel with task-specific modes rather than making the author hunt across tabs.

Recommended modes:
- Ask: Discuss the chapter and ask questions.
- Revise: Select the approach, enter your idea and review the proposed changes.
- Research: Inspect references, evidence and citations.
- Notes: Read chapter notes and the AI's source-use record.

Keep the active task's output in a contextual results area. Preserve all existing capabilities; reorganize how they are accessed.

The panel should remember its last mode, but not silently change modes while the author is working.

### 04 — The five rewrite approaches need a better decision component

Problem: A radio list with one-line descriptions asks authors to understand the implications of each option through text alone. The difference between "from my book only" and "my book + cited outside sources" is fundamental to intellectual provenance.

Fix: Use five selectable option cards with a short description and an explicit source policy.

- Polish my book — Improve clarity and flow while preserving the author's meaning. Source policy: existing manuscript
- From my book only — Use only supplied manuscript material; do not introduce outside research. Source policy: manuscript only
- My book + cited sources — Add external evidence with traceable citations. Source policy: manuscript + verified references
- Research-led — Build an argument around evidence, distinguishing research from your own claims. Source policy: research with provenance
- New from outline — Draft a new chapter guided by the approved plan and its notes. Source policy: outline and book rules

Selected options should persist per task, and the chosen source policy should appear in the pending review summary. Do not imply that citations are verified simply because they were generated.

### 05 — Tracked changes rely too heavily on colour

Problem: Red strikethrough, green underline and violet citations can turn a scholarly manuscript into a visually noisy document. Red and green also create accessibility problems for some readers.

Fix: Use restrained editorial markup.
- Additions: subtle tinted background and underline.
- Deletions: strikethrough, muted red text, visible only in Changes mode.
- Citations: numbered or linked reference markers, not an entire violet text style.
- Selection: a clear outline or background distinct from revision colours.
- Each change: accept or reject individually from a contextual control.

Provide a changes summary with navigation between edits, and let the author accept all, reject all, or inspect each change. The original manuscript must remain recoverable.

### 06 — The navigation uses valuable space on redundant progress information

Problem: The four stages, chapter progress dots, project card and progress metadata may all communicate similar information. A 272px sidebar is particularly expensive when the author is concentrating on prose.

Fix: Reduce the sidebar to 248px and establish a single hierarchy:
1. Project identity and switcher.
2. Four primary stages.
3. Expandable manuscript tree.
4. Library and voice profile.
5. Engine and account status.

Show chapter completion in the tree, but reserve detailed stage completion for the relevant stage. Use one active-state treatment rather than several simultaneous dots, fills and badges.

The engine status should read "Claude Code · Automatic" with plan details and usage information in its popover. Avoid making a green dot imply that the engine is always available or that a request is currently running.

### 07 — The interface does not yet communicate intellectual provenance strongly enough

Problem: Your workflow may incorporate uploaded manuscripts, scanned pages, reference documents, outside research and generated text. In a scholarly book such as Demonology, an attractive revision is not enough. You need to know what the revision relied on.

Fix: Make provenance a first-class editorial feature.
- Link a generated passage to its originating manuscript page, source or instruction.
- Distinguish supplied evidence from newly researched evidence and AI-generated interpretation.
- Show page references and source locations where available.
- Give each chapter a readable "AI used" record.
- Flag unsupported assertions and citations that have not been verified.

The existing per-chapter notes file is the right foundation. Upgrade it into a structured, navigable source-use ledger.

Important: A source-use ledger must report what the system actually accessed and used, not merely what it was instructed to use.

### 08 — The typography needs a stronger hierarchy

Problem: Inter and Newsreader are a sensible pairing, but a 40px chapter title, 19px body text, letter-spaced running headers and small caps could make the screen feel like a fixed book mockup instead of a responsive authoring tool.

Fix: Separate interface typography from manuscript typography and give each a controlled scale.
- Chapter title — Newsreader · 34–38px · line height 1.15 — Editorial
- Manuscript body sample — Newsreader · 18px · line height 1.65–1.75
- Interface labels and controls — Inter · 13–14px · line height 1.4

Use a restrained section-heading scale and avoid applying small caps to every structural element. Let the prose itself carry the visual identity.

### 09 — The Finish screen's 3D-style cover risks looking decorative rather than useful

Problem: A floating 3D book mockup may look attractive in a marketing presentation, but it does not prove that the EPUB, PDF or print layout is correct.

Fix: Make the cover and typeset interior real previews of the current publication settings. The cover can have a subtle dimensional presentation in a secondary preview, but the default should show the actual front cover and its typography.

Put a format switcher above the preview: EPUB · Print PDF · Paperback · Audiobook. Each preview should reveal the constraints that matter for that format.

Make readiness actionable: missing front matter, unresolved placeholders, unverified references and export errors should link directly to the relevant correction. Never show "Ready" merely because all buttons have been clicked.

### 10 — The design has not defined recovery, keyboard access or states between actions

Problem: Accept, Edit, Redo and Discard are good starting actions, but what happens when a rewrite is interrupted, the wrong version is accepted, an upload fails or the API engine runs out of budget?

Fix: Design the interaction states before polishing the visuals.
- Autosave with a visible saved/saving/error state.
- Undo and redo for manuscript edits.
- Version history before and after each accepted rewrite.
- Cancel and retry for long-running tasks.
- Clear API cost and engine selection before billable requests.
- Keyboard-accessible focus, visible focus rings, labelled controls and proper screen-reader announcements.

The user should never need to wonder whether their manuscript is saved or whether a rewrite has replaced the original.

### The single biggest change

If you only implement one structural improvement, make the right panel collapsible and turn the manuscript into a first-class, uninterrupted workspace. That gives you the largest immediate gain in perceived quality, usable writing space and concentration without removing a single capability.

## 3. What the premium studios do that Claude Studio lacks

The goal is not feature parity with every competitor. Your product has a broader workflow than a conventional word processor, so you need to choose which interaction patterns provide real value to a solo author.

Priority key: P0 = essential, P1 = high value, P2 = later enhancement.

| Capability | Priority | What I would build |
|---|---|---|
| Focus mode | P0 | Hide navigation, inspector, margin notes and toolbars while keeping a minimal floating control to return |
| Version history | P0 | Named snapshots, autosaved revisions and restoration without losing newer work |
| Autosave and recovery | P0 | Persistent save state, recovery after interruption and visible errors |
| Undo/redo | P0 | Reliable manuscript-level undo independent of AI task history |
| Onboarding | P0 | A short first-project walkthrough that teaches the manuscript-to-publication workflow |
| Empty states | P0 | Purposeful first-use screens for no project, no uploads, no outline, no notes and no pending changes |
| Micro-interactions | P1 | Responsive selection, save confirmation, revision navigation, tooltips and progress feedback |
| Dark mode | P1 | An optional, carefully tuned writing theme, not merely inverted colours |
| Keyboard system | P1 | Search, navigation, formatting, focus, revisions and engine-aware task shortcuts |
| Citation and provenance inspector | P1 | Trace generated claims to sources, manuscript pages and verification status |
| Export validation | P1 | Detect formatting problems and missing metadata before publication |
| Voice profile management | P1 | Preview, edit, compare and update the learned writing profile |
| Motion | P1 | Small transitions that communicate state and preserve orientation |
| Collaboration | P2 | Shared review, comments, suggestions and permissions |
| Series management | P2 | Relationships between books, shared rules, terminology and continuity |
| Publishing analytics | P2 | Useful after publication, if distribution or reader feedback becomes part of the product |

### What to borrow from each competitor

- Vellum — publication fidelity. Borrow the idea that a book should be evaluated as a real finished artifact. Your Finish stage should preview actual page layouts, typography and export output rather than merely decorate a mockup.
- Atticus — writing-to-formatting continuity. Make the transition from manuscript to typeset book feel natural. Avoid treating Finish as an unrelated collection of export buttons.
- Reedsy Studio — approachable long-form writing. Borrow clear manuscript navigation, accessible formatting controls and an obvious path from draft to final book.
- Sudowrite — contextual AI assistance. Make the AI understand what is selected, what the author wants to accomplish and what constraints apply. Avoid forcing the author to reconstruct context in every request.
- Scrivener — project structure. Retain the manuscript binder, research material, chapter notes and front/back matter. Improve the visual hierarchy rather than removing this organizational strength.
- iA Writer — concentration. Borrow the principle that writing should be quiet. Your author should be able to work on one paragraph without seeing project progress, AI tools and publishing tasks simultaneously.
- Linear — interaction precision. Borrow consistency, restrained borders, keyboard-first navigation, fast search and excellent loading and error states. Do not borrow its dense project-management layout for the manuscript itself.

These are design lessons, not claims that each product lacks the other capabilities. The image references are illustrative, not verified current screenshots of each product.

### Which additions matter most for a solo author?

My ranking is:
1. Recovery and version history. A manuscript is valuable intellectual property. The author must be able to reverse a bad AI decision.
2. Focus mode. A long scholarly chapter requires sustained attention. Every permanent panel creates another visual demand.
3. Source traceability. This is particularly important when working with historical arguments, scripture, references and scanned source material.
4. A trustworthy writing workflow. The author should always know whether they are editing the original, reviewing a proposal or working on a previously accepted version.
5. Export fidelity. The final published book must reflect the work shown in the preview.
6. Autosave and recovery. Saving should be automatic, reliable and visible without becoming intrusive.
7. Keyboard access and micro-interactions. These make a frequently used studio feel professional over time.
8. Dark mode. Valuable for personal preference and prolonged writing, but not a reason to delay the fundamentals.

Collaboration is much less urgent if Claude Studio is primarily your private workspace. I would not spend the first design cycle building social features while manuscript recovery and revision history remain undefined.

### Motion: restrained, not theatrical

Use motion to explain changes of state.
- Sidebar collapse: 160–200ms.
- Inspector slide or resize: 180–220ms.
- Opening a revision result: 140–180ms.
- Save confirmation: a subtle icon or label transition.
- AI task progress: discrete, named stages with completed, active and failed states.
- Reduced-motion preference: suppress nonessential transitions.

Avoid pulsing gradients, animated borders around the rewrite button, bouncing AI avatars and decorative page flips. Those details make a scholarly product feel less serious rather than more premium.

## 4. Is Sources → Plan → Write → Finish the right workflow?

Yes as the primary journey. No as a rigid, one-way sequence.

Your four-stage structure is intuitive because it mirrors how an author creates a book. I would preserve it. The problem is making every author pass through those stages in a fixed order even when they need to revisit an earlier decision.

For example, while rewriting chapter two, the author might discover that a source is missing, a chapter's argument is wrong or the book outline needs to change. That should not feel like leaving the writing environment and restarting another workflow.

### The recommended information architecture

- 01 · Sources — Ground the book. Manuscripts, scans, OCR, joined files, comparisons, reference documents, terminology, forbidden words, book-wide rules and voice profile.
- 02 · Plan — Shape the book. Outline, chapter and page notes, chapter sequence, outline styles, series planning and links to the source material supporting each chapter.
- 03 · Write — Primary workspace. Manuscript, chapter binder, Claude panel, revision review, source-use notes, front/back matter and version history.
- 04 · Finish — Prepare and publish. Cover, six interior styles, EPUB/PDF/print, audiobook, localization, previews, publication, library, repurposing, marketing, study guide and authorship notes.

Continuous feedback loop: Sources ↔ Plan ↔ Write ↔ Finish. Revisions to one stage update the relevant downstream readiness indicators without silently overwriting accepted work.

### The essential structural improvement: separate navigation from task execution

Keep the four stages in the sidebar. Within Write, however, use a consistent workspace with three primary areas:
- Navigation: book, chapters, sections and progress.
- Canvas: the manuscript and its review state.
- Assistant: contextual AI tasks, results, source evidence and notes.

The assistant should remain optional and collapsible. A user who wants to write manually should not have to look at an AI prompt box for the entire session.

### How the Write workflow should behave

1. Understand the chapter — Show a concise "What this chapter says" summary, with links to the relevant source passages. The author can inspect it, correct it or ask questions before generating anything.
2. Give direction — The author enters their idea, selects one of the five approaches and sees the applicable rules and source policy. Existing book-level instructions are inherited automatically.
3. Generate a proposal — Show progress in the assistant panel, not over the manuscript. Report what actually happened: source retrieval, drafting, rule checks and any failed verification. Allow cancellation.
4. Review and accept — The author compares the proposal with the current manuscript, navigates between changes, edits individual passages, accepts selected changes or rejects the whole proposal.
5. Preserve the record — Store the accepted version, preserve the previous version and record the instructions, source-use information and changes associated with that operation.

One important detail: "Accept" must mean something precise. I would define it as applying the pending proposal to the current manuscript while preserving the previous version. It should not mean approving every factual claim or certifying every citation.

Likewise, "Redo" should retain the current manuscript and allow a new proposal to be generated against it. "Discard" should remove the pending proposal, not delete the source manuscript.

### What should happen to the existing top-bar controls?

Keep Changes, Clean, Original, Side by side and Write myself, but make them a contextual view switcher, not the main navigation for the entire product.
- Changes: compare the current text with the pending proposal.
- Clean: view the current manuscript without revision markup.
- Original: view the chosen source or previous manuscript version.
- Side by side: compare synchronized versions.
- Write myself: hide AI editing affordances and focus on manual editing.

The selected view should persist as the author navigates chapters where appropriate. The title bar should always identify the active chapter and whether the author is editing, reviewing a proposal or viewing an earlier version.

## 5. Concrete design specifications for the developer

I would establish a design system before implementing the individual screens. Your existing palette is close; it needs refinement rather than a complete visual rebrand.

### A. Colour system

Your blue-to-violet gradient is suitable as an occasional action accent. The problem would be using it to brand every panel, status, selected control and AI interaction.

Recommended palette:
- Canvas `#F7F6F2` — Warm editorial background
- Surface `#FFFFFF` — Pages and inspector
- Primary text `#172033` — Softer than pure black
- Secondary text `#64748B` — Metadata and labels
- Borders `#E6E8ED` — Subtle separators
- Primary action `#2563EB` — One main action per screen

Optional brand gradient: Use for the primary AI action or a selected brand moment, not as a universal background treatment.

I would change the current near-black sidebar from `#0B0F1A` to a softer navy such as `#172033`, while preserving a darker variant if you want stronger separation between navigation and content.

For the writing canvas, I would test both `#FFFFFF` and a warm white. Scholarly books often benefit from a warmer page colour, but it should be a user preference rather than a compulsory tint across the entire product.

### B. Layout measurements

1440px desktop reference layout: Navigation 248px · Manuscript canvas flexible · Claude panel 320px.

Illustrative proportions, not a pixel-accurate screenshot. At 1440px, the remaining 872px must accommodate the canvas, margins and gaps. The manuscript page should shrink or the inspector should collapse when necessary.

Recommended component dimensions:

| Component | Specification |
|---|---|
| Sidebar | 248px expanded; 64px collapsed |
| Top bar | 56–60px high |
| Inspector | 320px default; 280px compact; collapsible |
| Manuscript page | 640–720px target width |
| Reading measure | 65–80 characters per line for continuous text |
| Main page padding | 64–80px horizontally where space permits |
| Inspector padding | 20–24px |
| Standard control height | 36–40px |
| Main action height | 44px |
| Input radius | 8px |
| Panel radius | 10–12px |
| Standard spacing | 4px base grid; common gaps 8, 12, 16, 24, 32px |
| Border | 1px solid neutral border |
| Shadow | Minimal; reserve stronger shadow for menus and floating overlays |

Do not force the full 640–720px page into every viewport. The page should respond to available space. On smaller screens, prioritise readable text and a collapsible assistant over maintaining a fixed desk-like composition.

### C. Typography

- Interface: Inter, with 13–14px for controls, 14–15px for standard interface copy and 20–24px for section titles.
- Manuscript: Newsreader, 18px default, 1.65–1.75 line height.
- Chapter titles: Newsreader, 34–38px in the writing view; adjust to the chosen typesetting style in publication preview.
- Metadata: Inter, 12px, used sparingly.
- Running headers: Inter or Newsreader small caps, 10–11px, only in book preview.
- Section headings: Newsreader, 23–28px depending on hierarchy.

Support a reader-controlled manuscript size and line spacing. Keep interface scaling separate from manuscript typography.

### D. Component behaviour

| Component | Required behaviour |
|---|---|
| Manuscript binder | Expand/collapse sections; drag to reorder only when reordering is permitted; show progress and unresolved issues accessibly |
| Chapter page | Preserve cursor and scroll position across view changes |
| Revision toolbar | Appear when a proposal exists; never cover the current paragraph or important page content |
| Margin notes | Anchor to stable text ranges or page references; open in a contextual panel |
| Rule chips | Display a concise summary; clicking opens the full rule editor |
| Command palette | Search tools, chapters, files and actions; show keyboard shortcuts and context-aware results |
| Engine switcher | Expose Automatic, Claude Code only and API only, plus availability and relevant usage information |
| AI progress | Show named stages, elapsed state where useful, cancellation and actionable errors |
| Export | Open a format and publication-settings dialog; run validation before creating the final output |
| Source-use notes | Link claims and revisions to their actual source records and verification state |

### E. Design all meaningful states

For each major screen, specify at least these states:
- Empty and first-use.
- Loading.
- Ready.
- Editing.
- Pending AI proposal.
- Partially accepted revision.
- Failed operation.
- Offline or interrupted.
- Saved and unsaved.
- Read-only or unavailable engine.
- Recovery from an interrupted session.

A polished interface is not just a beautiful ready state. It is an interface that remains clear when something goes wrong.

## 6. A few design decisions I would make now

Keep
- The four-stage Sources → Plan → Write → Finish workflow.
- The manuscript binder.
- Newsreader for the manuscript and Inter for the interface.
- The book-page preview as a defining visual identity.
- The five rewrite approaches.
- Inline changes, margin notes and the review actions.
- The engine switcher.
- The command palette.
- The per-chapter AI-use notes.

Change
- The fixed, crowded three-column arrangement into an adaptive workspace.
- The always-visible rewrite interface into a collapsible, persistent Claude panel.
- The five inspector tabs into task-oriented modes.
- The 3D-style cover emphasis into a faithful publication preview.
- The colour-dependent tracked changes into restrained, accessible editorial markup.
- The static progress indicators into actionable, truthful states.
- The one-way four-stage journey into a workflow that supports deliberate movement between stages.

Add before launch
- Autosave and recovery.
- Version history and reliable undo.
- Focus mode.
- Source provenance and verification status.
- Empty states and first-project onboarding.
- A clear distinction between the original manuscript, the working manuscript and pending AI proposals.

These changes improve the product without deleting or reducing any of your specified capabilities.

## 7. Implementation order

I would implement the redesign in three passes rather than changing everything at once.

Pass 1 — Establish the workspace (Highest priority). Redesign the sidebar, top bar, manuscript canvas, inspector and responsive layout. Define typography, colour, spacing and component states. Preserve every existing feature and workflow operation.

Pass 2 — Make writing trustworthy. Implement the revision review experience, source-use ledger, version history, autosave feedback, focus mode and keyboard interactions. Test what happens when a proposal fails, is rejected or is only partially accepted.

Pass 3 — Refine the publishing experience. Bring Sources and Plan into the same visual system, redesign Finish around genuine publication previews, then add optional dark mode, motion refinements and onboarding polish.

## Final verdict

Claude Studio's opportunity is not to become another AI writing app. It is to become a serious editorial and publishing environment in which an author can transform source material into a finished book without losing control of the original argument, their voice or the evidence behind their writing.

Your proposed design is already pointed in that direction, but its density and the lack of a clearly defined revision lifecycle are holding it back.

I would aim for three qualities:
1. The calm of iA Writer when writing.
2. The organizational strength of Scrivener when managing a book.
3. The publishing confidence of Vellum when preparing the finished work.

Then make Claude's contribution contextual, transparent and reversible.

That is the design direction I would pursue for Polished Pages: an editorial studio that feels premium because it is clear, dependable and respectful of the author's work — not because it contains more panels, gradients or decorative effects.
