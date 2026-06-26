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
- **No obvious stock-photo poses** — no smiling-at-camera, no handshake-over-a-
  contract clichés. Presiding, signing, deliberating, at work.

### Prefer compositions with no identifiable faces

A free-license image grants the photographer's copyright but **not** a model
release. Right-of-publicity means we cannot imply a recognizable person endorses
Dispatch. So favour frames where **no face is identifiable** — and it reads more
institutional anyway:

- hands signing, a pen on a document, a gavel, a seal or mace
- a wide council chamber, a bench, an empty boardroom mid-session
- figures from behind, in silhouette, or against a window
- detail and architecture over portraits

Where a face does appear, only use the frame if a model release is on record,
and aim for diverse international representation across Africa, Europe, Asia, the
Middle East and the Americas.

### Sourcing plan

- **Phase 1 (now) — free-license, no recognizable faces:** Pull dark, cinematic,
  face-free frames from **Unsplash, Pexels or Pixabay** (all permit commercial
  use, no attribution). Curate hard — only the top few percent meet the standard.
  Grade to match the page and log each in `CREDITS.md`. Zero cost, zero release
  risk.
- **Phase 1b (optional):** License from Magnum (commercial), Gallery Stock or
  Stocksy **only** when you specifically need a recognizable, released
  institutional figure that free, face-free frames cannot give.
- **Phase 2 (later):** Replace with commissioned originals shot to this art
  direction so the imagery is unique to Dispatch.

## Required files (institution cards)

Scenes are written face-free by default — hands, architecture, room — so a
free-license frame carries no model-release risk.

| File | Institution | Scene (no identifiable face) |
|------|-------------|------------------------------|
| `government.webp` | Government | Hands signing legislation; a seal or flag soft behind |
| `universities.webp` | Universities | A senate hall or great library, low light, from the floor |
| `healthcare.webp` | Healthcare | An empty hospital board room mid-session, papers on the table |
| `justice.webp` | Justice | A gavel, a bench, or court columns in shadow |
| `enterprise.webp` | Enterprise | A boardroom table and skyline at dusk, no faces |
| `regulators.webp` | Regulators | A central-bank façade or trading-floor architecture |

> To change the cards (order, copy, scenes), edit `INSTITUTIONS` in
> `src/pages/Landing.tsx`. Each entry's `slug` maps to `<slug>.webp` here.
> The role roster below the cards ("Across every institution") is text-only.
