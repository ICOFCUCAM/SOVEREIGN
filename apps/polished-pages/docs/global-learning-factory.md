# Global Learning Factory — product plan

> Status: **planning** (not yet built). This document is the spec; nothing here ships
> until we decide to build it. Authored during Platform Maturity Mode, after the
> recommendation to validate before expanding.

## 1. The vision

One teacher, anywhere, produces a **complete, locally-appropriate set of educational
materials** from a single brief — then publishes it globally in many languages.

```
Teacher
  → country (USA / Norway / Kenya / Brazil / India / Japan …)
  → language of instruction
  → age group / grade
  → curriculum style
  → subject + topic
  → generates: textbook · workbook · teacher guide · assessment (+ answer key) · illustrations
  → localizes the whole set into N languages, each culturally native
  → publishes to the marketplace / exports for distribution
```

The differentiator is not "AI makes a worksheet". It is **the same source material
becoming locally appropriate content for many cultures at once** — which aligns with the
core goal that *all cultures are represented authentically*.

## 2. What already exists (building blocks)

Most of the engine is built. The Factory is mostly **orchestration + batch**, not new generators.

| Capability | Today |
|---|---|
| School-content engine (20 doc types) | ✅ `generate-school-content` |
| Multi-document packs | ✅ `SchoolStudioPage` (Primary Book Factory, Classroom Packs, Curriculum Builder, Teacher Resource Center, Exam & Assessment Pack) |
| Answer-key/marking-guide matched to source | ✅ pack source-chaining |
| Curriculum / country / grade / language inputs | ✅ fields on the school tools |
| Cultural localization engine | ✅ `translate-localize` (deep, culture-native) |
| Multi-language editions (per book) | ✅ Edition Manager (`parent_document_id`, `edition_culture`) |
| Reading-level adaptation | ✅ age bands (children's) + grade context (school) |
| Illustrations | ✅ `generate-illustration` (+ character reference engine) |
| Assessment Bank | ✅ reusable, by subject/grade |
| Distribution / export | ✅ Distribution Center (EPUB/KDP/IngramSpark) |
| Publishing intelligence | ✅ AI Publishing Advisor |

## 3. The gaps (genuinely-new work)

1. **Unified "Learning Factory" flow.** A single entry that captures
   country + language + age/grade + curriculum style + subject/topic **once**, then
   generates the full set in sequence (reusing the pack engine) — instead of the teacher
   visiting several separate tools.
2. **Batch localization.** Localize an entire pack (or a single source) into **many
   languages in one action**, each as a linked, locale-tagged edition. Today localization
   is one document → one language at a time (Edition Manager / Translate & Publish).
3. **Save school output into the Assessment Bank.** Today only the Assessment Bank page
   writes to the bank; Classroom Packs / Exam Pack / etc. save to the Library instead.
   The Factory should let any generated assessment land in the bank.
4. **Region-appropriate examples baked in.** The localize engine already adapts culture;
   the Factory should pass the **country/region** through every step (not just language)
   so examples, currency, measurement and curriculum framing are local from generation,
   not only at localization.
5. **Pack-level publishing.** Publish a whole Factory output as a **collection / series**
   to the marketplace in one step (Collections + Series already exist; wire pack → collection).

## 4. Proposed flow & data model

- **New page `/learning-factory`** (Educational studio, Professional+):
  - Step 1 — *Context*: country, language, grade/age, curriculum style, subject, topic.
  - Step 2 — *Choose outputs*: checkboxes over the pack parts (textbook, workbook,
    teacher guide, assessment, answer key, illustrations on/off).
  - Step 3 — *Generate*: runs the existing pack engine in sequence with the shared context;
    shows progress; saves each to the Library (and assessments to the Assessment Bank).
  - Step 4 — *Localize*: pick N target languages/cultures → **batch** localize the whole set
    via `translate-localize`, saving each as a linked edition (`edition_culture`).
  - Step 5 — *Publish/Export*: bundle into a Collection, publish to the marketplace, and/or
    hand off to the Distribution Center.
- **No new DB tables required** beyond what exists (documents, editions, series, collections,
  assessment_bank). A `pack_id`/collection grouping ties a Factory run together.

## 5. Honest constraints (decide before building)

- **Cost.** Batch localization is real AI work: N languages × M documents = N·M text
  generations; illustrated output adds image credits. The Factory must show an explicit
  credit estimate before running, and respect plan limits. This is the main reason to
  validate demand first.
- **Quality needs real runs.** Localization and curriculum quality across cultures can only
  be judged by generating and reviewing — not provable headless. Pilot a few country/language
  pairs (e.g. Norway, Kenya, Brazil, Japan) and review before promising "20 languages".
- **Storybooks ≠ markdown.** Picture books aren't markdown, so the markdown localization/
  edition path doesn't cover them; the Factory should scope to **text-based school content**
  first (textbooks/workbooks/assessments), with illustrated/storybook localization as a later phase.

## 6. Suggested sequencing

1. **Pilot first (validation):** generate a full set for 2–3 country/language pairs and
   review quality. Cheap, decisive.
2. **Build the unified flow** (Steps 1–3) on top of the existing pack engine.
3. **Add batch localization** (Step 4) with a credit estimate gate.
4. **Wire pack → Collection/series publishing** (Step 5).
5. **Save-to-Assessment-Bank** from the Factory and the other school tools.

This keeps it as *packaging existing, proven engines into one global teacher workflow* —
high differentiation, modest new surface — rather than another set of generators.
