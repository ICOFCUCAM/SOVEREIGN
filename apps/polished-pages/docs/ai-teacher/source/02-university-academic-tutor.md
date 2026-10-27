# Source document (verbatim): University AI Tutor System — upgrade of the AI Teacher

Received from the owner on 27 October 2026 (forwarded with "the above?") and adopted as binding together with the blueprint. Original text as pasted, word for word; only headings, lists and tables were restored where the paste flattened them. Where `../BLUEPRINT.md` is shorter or silent, **this text governs**. The question it ends with was answered by the owner: "ok i support both" (see `03-course-model.md`).

---

Yes. I would upgrade the design substantially, but I would not throw away the work above or rebuild everything from scratch. I would keep the book-grounded AI Teacher as the foundation and evolve it into a University AI Tutor System suitable for universities, seminaries, colleges and other higher-education institutions.

The important distinction is that a university AI tutor is not merely a chatbot that teaches a book. It is a learning system that connects approved academic materials, course objectives, teaching activities, assessments, student progress and instructor oversight.

For Polished Pages, I would build this as a new capability within the Educational Studio, with the existing single-book teacher serving as its first teaching mode.

## 1. What system would a university use?

I would call the product Polished Pages Academic Tutor.

**Polished Pages Academic Tutor** — An institution-controlled AI teaching and learning environment.
- **Academic knowledge** — Books, lecture notes, approved readings, research papers and course materials.
- **Personal tutoring** — Explanations, guided questions, worked examples and study support.
- **Assessment** — Quizzes, practice exams, rubrics, feedback and mastery tracking.
- **University oversight** — Instructor controls, course configuration, privacy, audit records and academic integrity settings.

I would study three established approaches before building it:
- Khanmigo for guided learning and educational feedback.
- NotebookLM for answers grounded in supplied source material.
- Moodle and Canvas LMS for course organization, assignments, instructor roles and student records.

However, I would not build a replacement for an entire university's learning management system in the first release. I would build an AI teaching layer that can operate independently for a course and later integrate with an institution's existing LMS.

## 2. Would I rewrite or upgrade the existing design?

I would rewrite the product specification, upgrade the architecture, and preserve the working components that already solve the right problems.

Here is how I would treat each existing component.

| Existing component | Decision | University-grade upgrade |
|---|---|---|
| Book-specific AI teacher | Keep | Make it one mode inside a course-level tutor |
| Author Knowledge Base | Upgrade | Separate author preferences, course rules, approved terminology and institutional policies |
| Markdown documents | Keep initially | Add structured documents, versioning and reliable source locations |
| Chapter splitter | Upgrade | Parse chapters, headings, learning objectives, figures, tables, footnotes and references |
| Vector retrieval | Upgrade | Hybrid search, evidence validation, citations and retrieval evaluation |
| Lesson generator | Upgrade | Align lessons with course learning outcomes and approved readings |
| Quiz and exam generator | Upgrade | Question banks, instructor approval, rubrics and assessment controls |
| TTS narration | Keep | Add accessible read-along and optional spoken tutoring |
| Progress tracking | Upgrade | Track concepts, outcomes, attempts and review schedules |
| Plan gating and metering | Keep | Add institution, department, course and student-seat entitlements |
| Claude API Edge Functions | Keep | Add a central Teacher Runtime with model routing and validated outputs |
| Owner-only Claude Code tool | Keep separate | Never expose it to university customers or use it as a customer fallback |

The most important architectural change is to separate the knowledge being taught, the teaching policy, the assessment policy and the institution's administration. These should not all be one large system prompt.

For example, a professor's preferred terminology should not override a university's privacy rules. A student's request should not override the instructor's examination settings. A book's theological position should be taught faithfully without being represented as a universal university position.

## 3. The university system I would build

I would organize it into six connected subsystems.

- **Institution & Governance** — Institutions · departments · roles · policies · privacy · audit
- **Academic Knowledge System** — Books · readings · lectures · source versions · retrieval · citations
- **AI Teacher Runtime** — Grounding · teaching modes · model calls · safety · output validation
- **Learning Studio** — Lessons, explanations, practice and revision.
- **Assessment Engine** — Questions, rubrics, feedback and exam controls.
- **Learning Records & Instructor Dashboard** — Progress · concept mastery · course analytics · interventions · audit trail

### Subsystem 1 — Institution and governance

This is what separates a university-ready product from a consumer chatbot.

It should support:
- Institution and department administration.
- Instructors, teaching assistants, students and administrators.
- Course enrolment and permissions.
- Course-specific AI rules and approved source collections.
- Student-data retention and deletion policies.
- Institutional usage budgets and quotas.
- Audit logs for consequential operations.
- Configurable assessment and academic-integrity policies.

A university should be able to configure a course without granting every lecturer access to every student's private conversations.

### Subsystem 2 — Academic Knowledge System

A university course may have multiple sources, unlike your initial single-book tutor.

It should handle:
- Textbooks and monographs.
- Lecture notes and slide decks.
- Research papers and bibliographies.
- Scanned documents with OCR.
- Instructor-created notes and approved reference materials.
- Learning objectives and course outlines.
- Multiple editions and versioned reading lists.

Each source should retain its provenance, access rights, version and location metadata.

For a course on Demonology, the professor could make your book the required primary source, add approved lecture notes and explicitly disable outside theological sources. Another professor could authorize a wider scholarly reading list for a comparative course.

The course's source policy must determine what the tutor can use. The AI should not decide on its own that a web search would improve an answer.

### Subsystem 3 — AI Teacher Runtime

This should be a single server-side orchestration layer used by all four Polished Pages studios where appropriate.

Its responsibilities would include:
- Authenticate and authorize the request.
- Resolve the course, student, teaching mode and policies.
- Retrieve permitted evidence.
- Build a structured context.
- Call the configured model through your server-side API.
- Validate citations, terminology and output structure.
- Record usage and relevant evaluation metadata.
- Return the response and update the student's learning record where appropriate.

Keep the runtime model-independent. Claude can remain your default model, but the system should not need a full redesign if you later introduce another model for a particular task.

### Subsystem 4 — Learning Studio

The student experience should support several modes, rather than treating every interaction as a chat.

- **Learn** — Structured lessons, learning objectives, key concepts, worked passages, summaries and knowledge checks.
- **Ask** — A grounded tutor that explains the course material with clickable citations and honest uncertainty.
- **Practise** — Retrieval practice, spaced repetition, quizzes and exercises tailored to the student's learning needs.
- **Prepare for assessment** — Revision plans, practice exams and feedback aligned with the instructor's approved assessment criteria.

### Subsystem 5 — Assessment Engine

Keep low-stakes practice and formal assessment separate.

In practice mode, the tutor can explain mistakes, offer hints and generate alternate questions.

In formal assessment mode, instructor-defined rules determine whether AI assistance is permitted. The tutor should not provide answers during a restricted exam simply because a student requests them.

Start with practice quizzes and instructor-approved question banks. Add more advanced grading workflows only after you have validated their reliability and established human review for consequential decisions.

### Subsystem 6 — Learning records and instructor dashboard

An instructor needs to see more than a list of student chat messages.

The dashboard should answer:
- Which learning outcomes are students struggling with?
- Which concepts are frequently misunderstood?
- Which questions have high failure rates?
- Which lessons need revision?
- Which students may benefit from additional support?
- How much is AI tutoring costing per course and per student?

For privacy, default to aggregated learning analytics. Access to an individual's activity should be based on a defined educational purpose and institutional permissions, not unrestricted surveillance.

## 4. How I would adapt your existing architecture

You do not need to replace Vite, React, TypeScript, Supabase or Vercel to start.

I would add the following logical layers to your existing system.

| Layer | Recommendation |
|---|---|
| Frontend | Keep Vite + React + TypeScript; add role-specific views and accessible learning components |
| Authentication | Keep Supabase Auth; add institution membership, course enrolment and role-based authorization |
| Database | Keep Postgres; add institution, course, source-version, learning-outcome and assessment schemas |
| Retrieval | Keep pgvector; add PostgreSQL full-text search, evidence fusion, source-span tracking and evaluation |
| AI runtime | Deno Edge Functions are sufficient initially; separate the orchestration logic into reusable server-side modules |
| Background jobs | Add a durable job worker when ingestion, OCR, indexing or audio generation exceed suitable edge-function execution limits |
| Storage | Keep Supabase Storage with private buckets, access policies and signed access where appropriate |
| Usage management | Extend plan gating into institution-level budgets, per-course quotas and per-student limits |
| Monitoring | Add request IDs, latency, model cost, retrieval quality, validation failures and privacy-aware error logging |
| Integrations | Add LMS interoperability when there is a real institutional pilot requiring it |

### Database structure I would introduce

Do not put everything into a single documents table. Keep your current table if it is useful, but introduce distinct entities and explicit relationships.

Core academic entities:

| Entity | Purpose |
|---|---|
| institutions | Universities, colleges and schools |
| institution_memberships | User roles within each institution |
| courses | Course identity, settings and teaching policies |
| course_enrollments | Student and instructor membership |
| course_sources | Books, documents, editions and permissions |
| source_versions | Immutable versions of source content |
| source_chunks | Searchable passages with exact locations |
| learning_outcomes | What students should learn |
| teacher_lessons | Versioned, approved lesson content |
| teacher_concepts | Concepts and their evidence links |
| assessment_items | Questions, answer keys and rubrics |
| assessment_attempts | Student answers, scores and feedback |
| concept_mastery | Student progress per learning objective |
| teacher_conversations | Private, access-controlled interactions |
| ai_usage_events | Usage, costs and model metadata |
| audit_events | Security and consequential administrative actions |

This is a logical starting schema, not a requirement to create all 16 tables before testing a prototype. Some entities can be combined initially; others should be separate from the beginning, particularly institution membership, source versions, assessments and access-controlled student records.

Important: Enforce authorization in the database and server-side runtime, not just by hiding controls in React. Test Supabase Row Level Security against cross-institution and cross-course access.

### Should you move away from Edge Functions?

Not immediately.

Use Edge Functions for authenticated interactive requests, retrieval and model calls while the workload remains within their operational limits.

Move long-running tasks such as OCR, large document ingestion, extensive audio generation and batch assessment preparation into a durable job-processing service when needed. Jobs should support retries, idempotency, progress tracking and failure recovery.

That is an incremental change, not a reason to rewrite your whole stack.

## 5. What makes this suitable for a real university?

I would establish five requirements before approaching a university with a production pilot.

1. **Institutional control** — Each institution controls its own courses, membership, policies, data access and budgets. An institution must never be able to access another institution's student records through a guessed identifier or a modified request.
2. **Academic traceability** — Answers link to the actual assigned source material. The system distinguishes the source's explicit claims, the tutor's explanation and any inference. Authors and instructors can review the material used to generate lessons and assessments.
3. **Assessment integrity** — Instructors define the rules for practice, assignments and formal exams. AI-generated grades must be validated, explainable and subject to appropriate human review. The system should not make consequential academic decisions autonomously.
4. **Privacy and accessibility** — Define data retention, deletion, student disclosures, instructor permissions, incident response and model-provider data handling. Design for keyboard use, screen readers, captions and readable text. Review applicable privacy and accessibility requirements before deployment.
5. **Reliability and evaluation** — Measure retrieval accuracy, citation correctness, unsupported-answer rates, terminology compliance, latency, cost and student learning outcomes. Maintain a repeatable evaluation set for every supported teaching configuration.

I would also plan for LMS integration through standards such as LTI 1.3 and, where relevant, learning-record interoperability. These integrations are valuable when a university wants students to launch the tutor from its existing course system and exchange grades or learning activity. I would not make them a prerequisite for proving the core product.

## 6. How I would roll this out

Do not attempt to launch a full university platform in one release. Build the capabilities in a sequence that lets you validate the product at each stage.

**Phase 1 — Book Tutor (Start here)** — One book, one author, one learner or small study group.
- Verified source retrieval and citations.
- Approved lessons and quizzes.
- Ask the book, concept practice and progress tracking.
- Author terminology and teaching controls.
- Cost limits and evaluation.

**Phase 2 — Course Tutor (Expansion)** — One course with several approved materials and an instructor.
- Multiple books, lecture notes and readings.
- Learning outcomes and course-level teaching policies.
- Instructor dashboard and question-bank approval.
- Assignments, study plans and aggregated progress.

**Phase 3 — Institutional Tutor (Enterprise)** — Multiple courses, departments and institutional administrators.
- Institution membership and delegated administration.
- LMS integration and course roster management.
- Institution-wide budgets and audit controls.
- Data retention, governance and operational reporting.

**Phase 4 — Academic Learning Platform (Long-term)** — A broader teaching platform across the Educational Studio.
- Curriculum and course authoring.
- Advanced assessment workflows.
- Research and study-group capabilities.
- Cross-course concept mapping and institution-wide learning analytics.

The first pilot should use one real book and one instructor who can review the answers and assessments. Measure both accuracy and learning: whether students can explain the material more accurately after using the tutor, not simply whether they like the interface.

## 7. My final recommendation

Yes, I would rewrite the specification as a university-grade system, but I would preserve the existing single-book teacher as its first working implementation.

I would make three decisions now:
1. Build a common AI Teacher Runtime that can serve the Publishing and Educational Studios without exposing your private Claude Code subscription.
2. Separate book-level teaching from course-level and institution-level controls. A single book can have its author's rules; a course can combine approved sources; an institution can govern access, privacy and assessment policies.
3. Prove the product on one book before expanding. Establish reliable citations, faithful answers, approved lessons, assessments and student progress before investing in a large university administration layer.

The strategic opportunity is that Polished Pages already combines publishing, educational content and assessment generation. You can let an author turn a book into a teaching product, then let a lecturer adopt that book as part of a course, and eventually let an institution deploy tutors across multiple courses.

That gives you a coherent path from your current product to a university offering without having to rebuild everything at once.

One question determines the next architectural decision: Do you want the university tutor to teach only books and course materials published through Polished Pages, or should universities also be able to upload their own private lecture notes, research papers and course documents? I would support both eventually, but the answer determines how much emphasis the first release needs to place on institutional knowledge management and permissions.
