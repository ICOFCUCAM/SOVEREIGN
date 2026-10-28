# Source — Book Rewrite Control Panel (verbatim)

Given by the owner on 28 October 2026, together with the Demonology transformation instruction (`2026-10-demonology-transformation.md`), with the request: "when the Book is to be rewritten, there is a page that opens for instructions. Put this under a button which when selected will add the following command for Claude to follow for the redesigning (…) and create or just BUILD A BOOK REWRITE CONTROL PANEL WITH CHECKBOXES". Recorded verbatim; DESIGN-SPEC.md §20 implements it.

---

BUILD A BOOK REWRITE CONTROL PANEL WITH CHECKBOXES
Create a professional, reusable Book Rewrite Control Panel for my manuscript projects.
The purpose is to let me choose the exact editorial operations I want Claude to perform before beginning a book rewrite. I must be able to tick or untick individual options, select presets, and generate one complete instruction prompt from my selections.
Do not start rewriting the book when implementing this control panel. First inspect the existing project, determine its current framework and architecture, and build the control panel using the existing design system and conventions.
1. Project configuration
Provide editable fields for:

* Book title
* Book subtitle
* Source manuscript path or selected file
* Output folder
* Preferred language
* Author name, optional
* Project notes
* Target audience
* Intended publishing format

2. Editorial operation checkboxes
Organise the following options into clear, collapsible groups. Every option must have a checkbox, a descriptive label, and a short explanation.
A. Manuscript analysis

* Read the entire original manuscript before rewriting.
* Identify the author's central thesis and purpose.
* Identify the author's theological or intellectual position.
* Map all major arguments and supporting evidence.
* Identify important personal testimonies and examples.
* Identify the intended audience and writing style.
* Detect duplicate chapters, repeated paragraphs, and overlapping arguments.
* Identify incomplete sections, missing references, and structural problems.
* Produce a manuscript analysis report before rewriting.

B. Book structure

* Create a completely new table of contents.
* Reorganise the manuscript into parts and chapters.
* Rename weak or confusing chapter titles.
* Reorder chapters to improve logical progression.
* Split chapters containing unrelated subjects.
* Merge genuinely overlapping chapters.
* Improve the introduction and conclusion.
* Create meaningful section headings and subsections.
* Create transitions between chapters.
* Require approval of the proposed table of contents before rewriting.

C. Prose rewriting

* Rewrite every substantive paragraph.
* Improve grammar, spelling, punctuation, and syntax.
* Improve clarity, vocabulary, precision, and readability.
* Improve paragraph development and sentence rhythm.
* Add meaningful transitions and connective explanations.
* Strengthen the presentation of existing arguments.
* Remove awkward, fragmented, or repetitive writing.
* Preserve the author's distinctive voice and convictions.
* Avoid generic AI-style language and unnecessary academic complexity.
* Make the book read as one continuous, professionally edited work.

D. Content preservation

* Preserve every major argument.
* Preserve important qualifications and nuances.
* Preserve meaningful personal testimonies and experiences.
* Preserve important examples and illustrations.
* Preserve relevant biblical references and quotations.
* Preserve historical information and citations.
* Preserve the author's original conclusions.
* Track where every original chapter and major argument appears in the rewrite.
* Record all substantial omissions or consolidations.
* Do not silently remove unique or important content.

E. Content reduction

* Remove accidental duplication.
* Consolidate repeated explanations.
* Remove empty or redundant transitions.
* Remove irrelevant material that interrupts the book's purpose.
* Convert classroom notes into suitable book prose where appropriate.
* Remove malformed headings, editorial debris, and accidental formatting.
* Preserve distinct arguments even when they overlap.
* Record substantial proposed omissions for review.
* Do not shorten the manuscript merely to meet a word-count target.

F. Expansion and explanation

* Add transitions where the existing argument needs a connection.
* Clarify ambiguous sentences when the intended meaning is clear.
* Add brief explanations of concepts already present in the manuscript.
* Add chapter introductions and conclusions where useful.
* Expand underdeveloped arguments using material already in the source.
* Avoid padding and unnecessary repetition.
* Do not invent arguments, evidence, sources, or testimonies.
* Record substantive additions separately for approval.
* Set an optional target word count, without treating it as a reason to add filler.

G. Theology, terminology, and doctrine

* Preserve the author's theological position.
* Preserve the author's interpretation of spiritual warfare and related doctrines.
* Apply the project's approved divine-name terminology.
* Preserve direct quotations and bibliographic titles accurately.
* Distinguish explicit biblical statements from interpretation and inference.
* Distinguish personal testimony from independently verified facts.
* Flag apparent contradictions without silently changing the author's position.
* Flag questionable historical or doctrinal claims for review.
* Do not introduce new doctrines or theological arguments without approval.

H. Scripture and citations

* Preserve all relevant Scripture references.
* Check chapter and verse numbering.
* Preserve the Bible translation where identified.
* Verify quotations against the identified translation when source access permits.
* Check whether cited passages support the claims being made.
* Preserve non-biblical citations and references.
* Identify incomplete or inconsistent citations.
* Record proposed corrections and their reasons.
* Never invent quotations, references, authors, page numbers, or sources.
* Keep unresolved citation issues in a separate review report.

I. Style and consistency

* Create a project-specific style sheet.
* Standardise terminology and spelling.
* Standardise chapter numbering and heading hierarchy.
* Standardise Scripture citation formatting.
* Standardise punctuation, italics, and quotation marks.
* Maintain a consistent narrative voice.
* Check consistency across all chapters.
* Check that cross-references point to the correct chapters.
* Remove unfinished headings and editorial placeholders.

J. Quality assurance

* Compare the final manuscript with the complete original.
* Verify that every original chapter has been accounted for.
* Verify that major arguments and meaningful testimonies are preserved.
* Check for missing or truncated sections.
* Check for accidental duplicate passages.
* Check Scripture references and other citations.
* Check the table of contents against the final headings.
* Calculate the actual word count from the saved final file.
* Verify that all requested output files exist and contain the complete text.
* Produce a fidelity report.
* Produce an editorial report.
* Do not claim completion until the final checks have actually been performed.

K. Deliverables

* Complete rewritten manuscript in DOCX.
* Complete rewritten manuscript in Markdown.
* Clean table of contents.
* Manuscript analysis report.
* Source-to-rewrite traceability report.
* Editorial style sheet.
* Citation and Scripture review report.
* Editorial queries requiring author decisions.
* Final editorial report.
* Final fidelity and completeness report.
* Final word count and original-versus-final comparison.

3. Presets
Create these selectable presets:
Faithful Professional Rewrite
Select the full prose rewrite, structural improvement, content preservation, consistency checks, and final audit. Do not introduce new substantive material.
Complete Book Transformation
Select full analysis, new book architecture, full prose rewriting, transitions, controlled clarification, duplicate removal, terminology consistency, and all quality checks.
Faithful Rewrite — No Content Removal
Select all relevant rewriting and structural operations, but disable content deletion and chapter merging unless explicitly approved. Preserve all substantive source material.
Publication Preparation
Focus on copyediting, formatting, heading consistency, references, cross-references, front matter supplied by the author, and final quality assurance. Do not perform a major restructuring unless separately selected.
Theological and Scripture Audit
Focus on argument traceability, biblical references, quotation integrity, doctrinal consistency, historical claims, and editorial queries. Do not rewrite the entire manuscript unless that option is also selected.
Custom
Allow me to select each operation individually.
Presets must update the checkboxes. I must be able to change individual selections after choosing a preset.
4. Execution controls
Include these controls:

* Select all relevant options.
* Clear all selections.
* Choose a preset.
* Save the current configuration.
* Reset to defaults.
* Generate the final Claude instruction.
* Copy the generated instruction.
* Preview the complete instruction before copying.

The generated prompt must contain only the selected operations, the project details, and mandatory safety and completeness rules.
Never allow a preset to silently override a manually changed checkbox.
5. Workflow mode
Provide two workflow choices:
Approval mode: Analyse the entire manuscript, produce the new table of contents and editorial plan, and wait for my approval before rewriting.
Autonomous mode: Analyse, restructure, rewrite, integrate, and audit the manuscript without stopping for approval at every stage. Pause only when a substantive decision cannot safely be inferred from the source.
In both modes, the original manuscript must remain untouched.
6. Persistence and reliability
Persist the selected configuration using the application's existing supported storage mechanism. If no suitable mechanism exists, implement the simplest reliable option consistent with the current project.
The panel must:

* Display the number of selected operations.
* Show which preset is active, if any.
* Indicate when manual changes have modified a preset.
* Preserve configuration when moving between sections.
* Generate a readable, complete prompt rather than a raw list of checkbox labels.
* Avoid duplicate or contradictory instructions.
* Include a preview of the final generated prompt.

Build this as a fully functional interface, not a static mockup. Follow the current application's visual identity and existing component library. Keep the interface clean, professional, responsive, and easy to use.
