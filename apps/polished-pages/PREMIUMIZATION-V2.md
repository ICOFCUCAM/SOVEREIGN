# Polished Pages V2 — Premiumization Report

Scope: `apps/polished-pages`. Verification gate on every change: `tsc --noEmit`
clean, `vite build` clean, ESLint clean on touched files, the vitest suite green,
and DB/RPC round-trips checked. Edge functions are deployed; the frontend deploys
from `main` via Vercel.

This V2 pass turns the studio from "Career + Publishing + Document Transformation"
into a platform that also serves **children's publishing, schools, teachers and
curriculum** — the highest-value expansion identified.

---

## Before → After (audit)

**Before V2.** Career tools (CV, Tailor, Cover Letter), Book Creator + Transform,
a global app shell with command palette, a document Library (CVs/letters/books/
covers), and a first Children's Studio (Storybook, Personalized, Coloring,
Educational Readers, Classroom Packs).

**After V2.**
- **Children's Publishing Studio** completed: story **types** (Classic, Bedtime,
  Adventure, Cartoon, Educational, Moral), **language** selection, **educational
  objective**, and **personalization** (child as hero). Coloring presets.
- **Educational publishing engine** expanded to **20 document types** powering
  four new products from one component: **Primary School Book Factory**,
  **Workbook Generator**, **Curriculum Builder**, **Teacher Resource Center** —
  with consistent answer keys / marking guides generated against the real paper.
- **Library** gained **favorites**, **universal search**, and **recent documents**
  on the dashboard; illustrated storybooks and covers persist (images in a
  per-user storage bucket; rows stay small).
- **Test suite** (22 tests) and **proper DOCX import** landed in the preceding
  pass and continue to guard regressions.

---

## Circles — status

| # | Circle | Status |
|---|---|---|
| 1 | Children's Publishing Studio | **Done** — Storybook (6 story types, language, objective, hero personalization), Personalized, Coloring (with presets). |
| 2 | Primary School Book Factory | **Done** — subject + grade → textbook, workbook, teacher guide, exam, marking guide. |
| 3 | Workbook Generator | **Done** — practice / activity / revision / exam-prep / homework, with exercise-type selection. |
| 4 | Coloring Book Studio | **Done** — themed line-art pages + cover, preset themes (alphabet, animals, cultural, …), print PDF. |
| 5 | Curriculum Builder | **Done** — country + grade + subject + term → scheme of work, weekly/lesson plan, objectives, assessment. |
| 6 | Teacher Resource Center | **Done** — lesson notes, worksheet, quiz, exam, matching marking guide. |
| 7 | Educational Illustration Engine | **Partial** — generate-illustration powers storybook/coloring/diagram art; standalone diagram/poster studio + Library save is the next step. |
| 8 | School Content Marketplace | **Roadmap** — needs a sharing/licensing data model (see below). |
| 9 | Publishing Marketplace Exports (KDP/IngramSpark/Kobo/Lulu) | **Roadmap** — trim-size/bleed PDF profiles + validators. |
| 10 | Platform Premiumization | **Advanced** — global nav, command palette, dashboard, **favorites + search + recents** added; favorites/recents close the "nothing hidden" goal. |

---

## Business impact

- **New buyer segments.** Schools, teachers, NGOs and homeschoolers are now
  first-class — a market with recurring, seat-based demand, distinct from the
  one-off career buyer. The Classroom Pack / Curriculum / Teacher Center outputs
  are the kind of work teachers currently do by hand for hours.
- **Higher willingness to pay.** Children's books (especially **personalized**)
  and **classroom packs** are proven high-conversion AI-publishing products.
- **Retention.** Persistence (Library, favorites, recents) plus multi-document
  packs increase return visits and documents-per-user.
- **Defensibility.** Curriculum/country customization and the African-schools
  framing differentiate from generic self-publishing tools.

## Revenue opportunities & proposed tiers

Image generation (covers, illustrations) is the natural premium lever — it has
real per-unit cost and high perceived value. Proposed plans:

| Tier | For | Headline gates |
|---|---|---|
| **Free** | Trial | Monthly generation quota; text features; classic templates. |
| **Creator Pro** | Authors / job seekers | Unlimited generations, premium CV families, AI covers, book transform. |
| **Education Pro** | Parents / tutors | Storybooks + illustrations, personalized books, coloring books, educational readers. |
| **Teacher Pro** | Individual teachers | Classroom packs, workbooks, teacher resources, marking guides; bulk export. |
| **Publisher Pro** | Indie publishers | KDP/IngramSpark-ready exports, cover + interior design, EPUB with images. |
| **Enterprise Education** | Schools / NGOs | Curriculum Builder, multi-seat, shared Library, branded exports, licensing. |

Implementation note: the metering layer already distinguishes Free vs Pro per
user; adding the above is a Stripe-products + a plan-level column change, plus
mapping each premium feature to a required tier (the cover generator already
demonstrates per-feature gating).

## UX improvements implemented

- Studio framing (not a flat list of generators); career studios + Children's
  Publishing Studio hub with live products and an honest roadmap.
- One reusable config-driven page powers four educational products (consistent
  UX, less surface area to maintain).
- Designed interiors + edit-before-final + themed PDF across all books.
- Library favorites, search, recents; dashboard recents — discoverability.

## Remaining roadmap (recommended order)

1. **Publishing Marketplace Exports (Circle 9).** Trim-size profiles (6×9, 8.5×11,
   square picture-book), bleed/margin validation, and EPUB-with-images. Highest
   willingness-to-pay; "solves publication requirements."
2. **Library: autosave, version history, draft recovery.** Periodic autosave of
   in-progress work to a `drafts` store; version snapshots on save.
3. **Educational Illustration Engine (Circle 7).** A diagrams/poster studio that
   saves standalone illustrations to the Library (reuse the media bucket).
4. **School Content Marketplace (Circle 8).** A `shared`/`licensed` flag + a
   public catalog view + premium downloads; foundation before any payments.
5. **Tier rollout.** Stripe products for the five Pro tiers + per-feature gating.

---

## V2.1 — Global Children's Publishing Platform

Turning the studio into "create, translate, localize, illustrate, publish and
distribute globally."

- **Native multi-language creation.** A 23-language catalogue (English → French,
  Spanish, Portuguese, German, Italian, Dutch, Norwegian, Swedish, Danish,
  Finnish, Arabic, Swahili, Lingala, Hausa, Fulfulde, Zulu, Chinese, Japanese,
  Korean, Hindi, Bengali, Tamil — plus any language typed free-form). Storybooks
  and educational documents generate directly in the chosen language.
- **Cultural localization (not just translation).** The Storybook Creator takes a
  **cultural setting** so a story is set authentically in, say, Norway vs Cameroon
  vs Japan — names, landscapes, animals, foods and traditions adapted respectfully
  (illustration prompts too).
- **Translate & Localize (multi-language publishing).** `/translate`: one
  document → editions in many languages at once, as a faithful **translation** or
  a culturally **localized** edition per culture. Long documents are chunked;
  each edition gets a designed interior, edit, PDF + EPUB export and Library save.
- **Cultural preservation.** Folktale and Legend/Heritage story types for
  publishing traditional tales, local heroes and origin stories under-represented
  in mainstream publishing.
- **Global distribution exports.** A real **EPUB 3** export (with NCX fallback)
  from any book and from illustrated picture books (cover + per-page art),
  accepted directly by Kobo, Apple Books, Google Play Books and Draft2Digital —
  and by KDP/IngramSpark alongside print PDF.

### V2.2 — delivered since
- **Educational Illustration Studio** (`/illustrations`) — diagrams, science/
  geography visuals, historical scenes, posters and line art, saved to the
  Library (new `illustration` kind; images in the media bucket).
- **Autosave / draft recovery** — `usePersistentState` autosaves the long-form
  editors (Transform, Translate, Storybook) and restores them on return.
- **Print trim sizes + EPUB** — the book reader exports EPUB and a Print PDF at a
  chosen trim (6×9, 5×8, US letter, square, A5); a **Publish & Distribute** page
  maps each store's format and computes cover spine / full wrap dimensions.

### Still on the roadmap (honest)
- **KDP-validated text PDF interiors** — today's print PDF is image-based
  (great for picture books and proofs); KDP's strictest interior validator
  prefers selectable, embedded-font text PDFs. A text-layout PDF path is next.
- **Server-side version history** — autosave/draft recovery is done client-side;
  full version snapshots + an update-in-place flow (vs. insert-new) remain.
- **Per-edition picture-book localization** — `/translate` localizes text and
  storybook text; re-pairing localized text with existing illustrations into a
  saved picture book is a follow-up.
- **School Content Marketplace (Circle 8)** — sharing/licensing model + catalog.

## Honest limitations

- Live image flows (illustrations, covers) require a signed-in Pro account and
  paid OpenAI calls; verified by deploy + build + tests + DB round-trips + UI, not
  a live end-to-end image.
- `gpt-image-1` has no true cross-image character lock; consistency is
  prompt-driven (character appearances restated per page) — close, not identical.
- Themed/illustrated PDF is image-based (html2canvas); very long books are better
  served by the text export path until the KDP profiles land.
