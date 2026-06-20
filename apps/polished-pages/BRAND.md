# Polished Pages — Brand System

The single source of truth for how Polished Pages looks, sounds and feels.
The visual tokens live in `src/index.css` (CSS variables) and `tailwind.config.ts`;
the four-studio identity lives in `src/lib/studio-theme.ts`. Keep this document and
those files in sync — if you change a token, update both.

---

## 1. Brand mission

**Polished Pages is the AI platform to create, publish and distribute professional
documents, books and educational content — and sell them to the world.**

It is not a document generator. It is a creation-and-publishing **ecosystem** made of
four studios and a marketplace:

- **Career Studio** — CVs, job tailoring, cover letters.
- **Publishing Studio** — books, illustration, covers, multi-language editions, store distribution.
- **Educational Studio** — children's storybooks and series, classrooms, workbooks, curricula, assessments.
- **Marketplace** — discovery, author pages, reviews, distribution.

**Desired first impression:** *"This is a premium publishing and education ecosystem."*
**Never:** *"This is a cover-letter website."*

### Voice & tone
- Confident, modern, warm — an enterprise-grade platform that still feels human.
- Plain, specific language. We describe real capabilities, never vanity metrics or
  unverifiable social proof ("join thousands…"). If a number isn't real, it doesn't ship.
- Respectful and globally-minded: all cultures represented authentically, never as cliché.

---

## 2. Color palette

A modern SaaS system: a navy/blue spine with four studio accents. **Gold is retired
as the dominant colour;** amber survives only as the Marketplace accent, used sparingly.

### Core (defined as HSL CSS variables in `src/index.css`)

| Role | Token | HSL | Hex | Usage |
|------|-------|-----|-----|-------|
| Foreground | `--foreground` | `222 47% 11%` | `#0F172A` | Deep navy — text, dark structure |
| Primary | `--primary` | `221 83% 53%` | `#2563EB` | Royal blue — CTAs, links, focus, icons |
| Background | `--background` | `0 0% 100%` | `#FFFFFF` | Clean white |
| Card | `--card` | `210 40% 99%` | near-white | Surfaces |
| Muted text | `--muted-foreground` | `215 16% 47%` | slate | Secondary text |
| Border | `--border` | `215 24% 90%` | cool grey | Dividers, outlines |
| Accent (sparing) | `--gold` | `38 92% 50%` | `#F59E0B` | Amber — Marketplace / "Featured" chips only |
| Destructive | `--destructive` | `0 72% 50%` | red | Errors, delete |

### Brand gradient
`--gold-gradient` and `--text-gradient` are **blue → purple** (`#2563EB → #7C3AED`).
Used for the headline highlight (`.text-gradient-gold`) and the primary `hero` button.
> Class names still say "gold" for backwards-compatibility; visually they are the
> blue→purple brand gradient. Don't reintroduce literal gold.

### Four-pillar accents

| Studio | Token | HSL | Hex |
|--------|-------|-----|-----|
| Career | `--career` | `221 83% 53%` | `#2563EB` (blue) |
| Publishing | `--publishing` | `262 83% 58%` | `#7C3AED` (purple) |
| Educational | `--educational` | `160 84% 36%` | `#10B981`-ish (emerald) |
| Marketplace | `--marketplace` | `38 92% 50%` | `#F59E0B` (amber) |

Tailwind exposes them as `text-career`, `bg-publishing/10`, `hover:border-educational/50`,
`bg-marketplace`, etc. **Always go through the tokens / `STUDIO_THEME`** — never hard-code hex.

---

## 3. Typography

Typography is one of the strongest parts of the brand. **Do not change the families.**

- **Headings:** `Playfair Display` (serif). Class: `font-serif`. Weights 400–700, plus italic
  for the highlighted phrase. Used for H1–H3 and card titles.
- **Body & UI:** `Inter` (sans). Class: `font-sans`. Weights 300–700.
- Loaded via Google Fonts in `src/index.css`; applied globally (`h1–h6 → Playfair`, `body → Inter`).

### Scale (Tailwind)
| Element | Classes |
|---------|---------|
| Hero H1 | `text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]` |
| Section H2 | `text-3xl md:text-5xl font-bold` |
| Card title | `font-serif text-base–text-xl font-semibold` |
| Body | `text-base / text-sm text-muted-foreground` |
| Eyebrow | `text-xs font-semibold uppercase tracking-wide text-muted-foreground` |

### Spacing
Generous and premium: section rhythm `py-20`–`py-24`, card padding `p-4`–`p-6`,
container `max-w-5xl/6xl mx-auto px-6`, radius `--radius: 0.75rem` (`rounded-xl/2xl`).
Shadow: `shadow-premium` (`--shadow-premium`).

---

## 4. Studio identities

Each studio has a colour, an icon and a voice so a user always knows where they are.
Defined in `src/lib/studio-theme.ts` (`STUDIO_THEME`).

| Studio | Colour | Icon (lucide) | Covers | Feeling |
|--------|--------|---------------|--------|---------|
| **Career** | Blue | `Briefcase` / `FileText` | CV, Tailor, Cover Letters | Sharp, professional, trustworthy |
| **Publishing** | Purple | `BookOpen` | Book Creator, Transform, Illustration, Editions, Distribution | Creative, expressive, ambitious |
| **Educational** | Emerald | `GraduationCap` / `BookHeart` | Children's, Storybooks, Coloring, School content, Curriculum, Assessment Bank | Warm, nurturing, trustworthy |
| **Marketplace** | Amber | `Store` | Discover, Authors, Reviews, Trending, Distribution | Lively, social, discovery-driven |

**How to apply (always via `STUDIO_THEME[studio]`):**
- `theme.text` — icon / accent foreground (`text-publishing`).
- `theme.bg` — tinted icon chip (`bg-publishing/10`).
- `theme.dot` — solid colour dot for nav/badges (`bg-publishing`).
- `theme.hoverBorder` — card hover (`hover:border-publishing/50`).
- `theme.eyebrowBorder` / `theme.eyebrowBg` — pill/eyebrow on studio pages.

Applied across: navigation dots, dashboard "Create new" tiles, homepage pillar cards,
studio page eyebrows, and dashboard section icons.

---

## 5. Iconography

- **Library:** [`lucide-react`](https://lucide.dev) only. Consistent line icons, never mix sets.
- **Stroke:** default (1.5–2px). Do not fill except for status dots / stars.
- **Sizes:** `h-3.5 w-3.5` (inline), `h-4 w-4` (buttons/labels), `h-5 w-5`–`h-6 w-6` (feature chips).
- **Colour:** inherit `currentColor`; tint with the studio token where the icon represents a studio,
  otherwise `text-primary` (blue) or `text-muted-foreground`. Amber (`text-gold`) only for
  Marketplace/"Featured".
- Each studio has a representative icon (see table in §4). Use it consistently for that studio.

---

## 6. Illustration style

Two distinct image registers — never use literal document/stationery photography or
"legal-office" imagery again.

### a) Generated content art (`gpt-image-1`)
- **Children's & picture-book art:** soft, warm, rounded, friendly; gentle palettes;
  child-safe and wholesome; **no text in images**.
- **Character consistency:** a saved **reference portrait (model sheet)** per character
  keeps a hero recognisable across a series (see the Character Bible + image-to-image engine).
- **Coloring pages:** clean black-and-white line art, bold outlines, white space.
- **Covers:** bookstore-quality, strong typographic hierarchy.
- **Cultural authenticity:** localized editions adapt names, places, food, festivals and
  dress to feel native to the culture — concrete specificity, never stereotype.

### b) Brand/marketing imagery
- **Abstract, not literal.** The hero uses soft blurred colour fields in the four pillar
  colours over white — it signals the ecosystem without selling "documents".
- Prefer gradient/mesh backgrounds + real product UI over stock photography.
- If a marketing block has no authentic image, use an **on-brand gradient panel with
  capability chips** instead of a mismatched stock photo (see `FeaturesSection`).

---

## 7. Marketplace style

The marketplace must feel distinct and trustworthy — its identity colour is **amber**.

- **Discovery-first homepage:** curated sections — **Featured** (admin-curated / staff picks),
  **Trending now** (real downloads+views), **Recently published**, **Browse by category**.
- **Cards** (`CatalogCard`): category + price chip, title, author link, **star rating + review
  count**, view/download counts, license. Hover lifts with `hover:border-primary/50 shadow-premium`.
- **Trust signals (all real data):** ⭐ ratings & reviews, **Verified creator** badge
  (`BadgeCheck`, admin-curated), Featured/Editor's-pick, trending and author reach stats.
- **Author pages:** bio, verified badge, aggregate reach (works/views/downloads), their catalogue.
- Use amber sparingly as the accent (price chips, "Featured"); keep blue as the primary action colour.

---

## 8. Accessibility rules

- **Contrast:** body and UI text must meet WCAG AA (≥ 4.5:1). Navy `#0F172A` on white and
  white on royal-blue/emerald/purple pass; **amber is decorative only** — never put small
  text in amber on white, and never use amber as a button background with white text at small sizes.
- **Colour is never the only signal.** Studio colour is always paired with a **label and/or
  icon** (nav dots sit beside the word; pillar cards name the studio). Status uses icon + text
  (e.g. "Published" with a check), not colour alone.
- **Focus:** keep the visible focus ring (`--ring` = primary blue). Never remove `:focus-visible`
  outlines on interactive elements.
- **Targets:** interactive controls ≥ 32px; buttons use the shared `Button` sizes.
- **Images:** every `<img>` has a meaningful `alt`. Generated illustrations describe the scene.
- **Motion:** animations are subtle and short (Framer Motion, ~0.4–0.6s). Avoid motion that
  conveys essential information; respect `prefers-reduced-motion` for any future large motion.
- **Semantics:** use real headings in order, `<button>`/`<a>` for actions, `aria-label` on
  icon-only controls (already applied on icon buttons across the app).

---

## Quick reference

```
Primary action ........ text-primary / bg-primary           (royal blue)
Brand highlight ........ .text-gradient-gold / hero button   (blue → purple)
Career ................. text-career  bg-career/10  bg-career
Publishing ............. text-publishing  bg-publishing/10
Educational ............ text-educational  bg-educational/10
Marketplace / Featured . text-marketplace / text-gold (amber, sparing)
Headings ............... font-serif (Playfair Display)
Body / UI .............. font-sans (Inter)
Studio theming ......... STUDIO_THEME from src/lib/studio-theme.ts
```
