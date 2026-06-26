# Homepage imagery — "Built for the world's leading institutions"

Drop a photograph here for each institution card and it appears on the homepage
automatically. Until then the card shows a dignified per-sector editorial line
glyph — never a broken image, never a synthetic-looking placeholder.

- **Format:** `.webp`, landscape **16:10** (e.g. 1600×1000).
- **Filename:** exactly the slug below — `<slug>.webp`.

## Art direction — non-negotiable

This is a trust and governance platform. Procurement officers can sense
synthetic imagery, and it quietly erodes the credibility the rest of the page
works to build. **Do not use AI-generated images for the homepage.** Use real,
licensed or commissioned editorial photography only.

The standard is **annual-report quality** — the photography a sovereign wealth
fund or a central bank would put in its yearly report:

- **Dark, premium grading** — colour-graded to sit on the `#070707` page; deep
  shadows, restrained highlights, gold-adjacent warmth where light falls.
- **Cinematic lighting** — directional, editorial, a single considered source;
  not flat office fluorescent.
- **Realistic institutional environments** — actual chambers, benches,
  boardrooms, council floors; not generic glass-and-laptop stock sets.
- **Diverse international representation** — across Africa, Europe, Asia, the
  Middle East and the Americas, with equal representation of men and women.
- **No obvious stock-photo poses** — no smiling-at-camera, no handshake-over-a-
  contract clichés. People presiding, signing, deliberating, at work.

### Sourcing plan

- **Phase 1 (now):** License premium editorial frames that meet the standard
  above from a quality editorial library, graded to match. Drop them in here.
- **Phase 2 (later):** Replace them with commissioned originals shot to this
  art direction so the imagery is unique to Dispatch.

## Required files (institution cards)

| File | Institution | Scene to photograph |
|------|-------------|---------------------|
| `government.webp` | Government | A minister signing legislation |
| `universities.webp` | Universities | A vice chancellor with senate members |
| `healthcare.webp` | Healthcare | A hospital executive board |
| `justice.webp` | Justice | A judge or court administrator |
| `enterprise.webp` | Enterprise | A corporate boardroom |
| `regulators.webp` | Regulators | A financial regulator |

> To change the cards (order, copy, scenes), edit `INSTITUTIONS` in
> `src/pages/Landing.tsx`. Each entry's `slug` maps to `<slug>.webp` here.
> The role roster below the cards ("Across every institution") is text-only.
