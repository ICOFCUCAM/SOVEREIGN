# Source document (verbatim): the course as the teaching unit

The owner answered the question that ends `02-university-academic-tutor.md` with **"ok i support both"** (published books and private institution materials), forwarding the recommendation below. Adopted as binding. Original text as pasted, word for word; only lists and tables were restored. Where `../BLUEPRINT.md` is shorter or silent, **this text governs**.

---

Then I recommend designing Polished Pages Academic Tutor as a dual-source academic teaching platform: universities can use published books from Polished Pages and combine them with their own private course materials, while authors can still offer a dedicated tutor for an individual book.

The key architectural decision is to make the course the teaching unit, not the document.

A course can contain a published book such as Demonology, private lecture notes, scanned readings, research papers and instructor-created lessons. The tutor uses only the sources authorized for that course, with the instructor controlling which materials are required, supplementary or excluded.

This supports three use cases without building three separate products:
- Author mode: An author enables a tutor for one published book.
- Course mode: A lecturer combines published books with private academic materials.
- Institution mode: A university manages courses, users, policies and budgets across departments.

## 1. The recommended architecture

**Academic Tutor** — One learning interface for students, authors and instructors
- **Published Library** — Polished Pages books, approved editions, author-created lessons and quizzes. *Licensed access*
- **Private Course Library** — University lecture notes, papers, scans, slides and instructor-created materials. *Restricted access*
- **Course Knowledge Layer** — Versioned sources · permissions · chapter metadata · hybrid retrieval · citations
- **Teacher Runtime** — Grounded answers · lessons · assessments · progress · policy enforcement

## 2. Five design decisions to make now

| Decision | Recommendation |
|---|---|
| Source ownership | Keep published books and private university documents as separate source types. |
| Course configuration | Let instructors select the allowed sources and mark them required, supplementary or excluded. |
| Search and citations | Search across all permitted sources, but label every citation with its book/document title, chapter or section, and page where available. |
| Author rules | Preserve each book's approved terminology and teaching instructions. Course-level rules may add constraints, but conflicts must be detected rather than silently resolved. |
| Privacy | Keep private university documents isolated from the public marketplace and other institutions. Never use them in another course's retrieval results. |

## 3. What this means for your existing Supabase architecture

I would introduce four core relationships:
- courses — the course and its teaching policies.
- course_sources — which published books or private documents are authorized for the course.
- source_versions — immutable versions of each source.
- source_chunks — indexed passages with exact source locations and retrieval metadata.

Your existing documents table can remain the starting point for stored content. You do not need to migrate everything immediately; introduce these relationships incrementally.

One important rule: a document being indexed must never automatically make it available to every tutor. Retrieval must always be scoped to the authenticated student's course, its permitted sources and the relevant document version.

## 4. What I would build first

I would now write a single definitive product and technical specification covering:
- The three operating modes: Author, Course and Institution.
- The academic knowledge and document-ingestion system.
- The Teacher Runtime and evidence-grounded response pipeline.
- Lessons, assessments, concept mastery and student progress.
- Instructor and institutional administration.
- Permissions, privacy, security and usage metering.
- The React and Supabase implementation plan, including database migrations and Edge Functions.
- Evaluation criteria and staged rollout.

I would use your existing Demonology book as the first reference implementation, then test the same system with a private university lecture pack. That validates both source types before you expand into a larger institutional deployment.

The result should be one extensible academic platform, not a separate chatbot for every book and another disconnected chatbot for every university.
