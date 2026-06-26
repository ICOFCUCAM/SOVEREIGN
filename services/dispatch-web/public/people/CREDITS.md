# Image credits & license register

Every photograph that ships on the homepage must have a row here **before** it
is committed. This is a governance platform — using an editorial-use-only or
unreleased image to market the product is a license breach, so we keep the proof
of rights with the asset.

## Rules

- **License must permit commercial use.** Accepted: a free commercial license
  (**Unsplash / Pexels / Pixabay**) or a paid royalty-free / rights-managed
  *commercial* license. **Editorial-use-only is NOT permitted** for the homepage.
- **No identifiable faces is the default path.** A free license grants the
  photographer's copyright but **not** a model release, so prefer frames with no
  recognizable person — then `Recognizable person` = `none` and no release is
  needed.
- **If a recognizable person appears**, a **model release** is required →
  `Release` must say `yes` (with a paid library that carries one). Otherwise the
  frame cannot ship.
- **Property release** for a recognizable private building/interior → `yes` or
  `n/a`. Public buildings and architecture shot from public space are fine.
- **No AI-generated imagery.** Source must be a real licensed or free-license frame.
- Keep any paid receipt off the repo; store the `License ref` (order/contract no.,
  or the source image URL for free-license frames) so it can be retrieved.

## Register

| File | Source | License | Recognizable person | Release | License ref / URL | Acquired |
|------|--------|---------|---------------------|---------|-------------------|----------|
| `government.webp`   | **AI-generated (interim)** | owned render | none (synthetic, not real people) | n/a | uploaded 2026-06-26 | 2026-06-26 |
| `officialpublication.webp` | **AI-generated (interim)** | owned render | none (brand still life, no people) | n/a | uploaded 2026-06-26 | 2026-06-26 |
| `universities.webp` | **AI-generated (interim)** — Art Direction Engine → gpt-image-1 | owned render | none (no people to camera) | n/a | image-engine, via Sovereign Supabase | 2026-06-26 |
| `healthcare.webp`   | **AI-generated (interim)** — Art Direction Engine → gpt-image-1 | owned render | none (no people) | n/a | image-engine, via Sovereign Supabase | 2026-06-26 |
| `justice.webp`      | **AI-generated (interim)** — Art Direction Engine → gpt-image-1 | owned render | none (no people) | n/a | image-engine, via Sovereign Supabase | 2026-06-26 |
| `enterprise.webp`   | **AI-generated (interim)** — Art Direction Engine → gpt-image-1 | owned render | none (no people) | n/a | image-engine, via Sovereign Supabase | 2026-06-26 |
| `regulators.webp`   | **AI-generated (interim)** — Art Direction Engine → gpt-image-1 | owned render | none (distant silhouettes only) | n/a | image-engine, via Sovereign Supabase | 2026-06-26 |

> **Interim exception (recorded honestly).** All seven homepage images above are
> **AI-generated** renders, accepted by explicit decision on 2026-06-26 (see
> ADR-013). The five sector cards (universities, healthcare, justice, enterprise,
> regulators) were produced through the Art Direction Engine
> (`services/image-engine`) → `gpt-image-1`, using the OpenAI key wired into the
> Sovereign Supabase project; each is **text-free, has no recognizable real
> people**, was cropped to 16:10, exposure-lifted and optimized to webp. The no-AI
> standard remains the long-term target: replace any of these with real
> licensed/commissioned photography when available — they are drop-in by filename.

> Replace a row's `_pending_` cells as each image is sourced. For a free-license,
> face-free frame: `Source` = Unsplash/Pexels/Pixabay, `License` = that license,
> `Recognizable person` = none, `Release` = n/a, `License ref / URL` = the image
> page URL. See `README.md` for the art direction and the scene per file.
