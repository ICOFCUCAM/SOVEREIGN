# ADR-013 — AI Art-Direction Engine for the Institutional Illustration Library

- Status: Accepted
- Date: 2026-06-26
- Relates to: relaxes ADR-012's "no AI imagery on the homepage" for engine-produced,
  text-free, human-approved illustrations; complements ADR-004 (AI dependency scope).
- Context: The product needs a coherent illustration set (homepage sector cards,
  vertical pages, brand still lifes). Licensed/commissioned editorial photography
  remains the gold standard (ADR-012), but is slow and costly to source. We need a
  way to produce a consistent, high-quality interim library now, under control.

## Decision

Build an **Art Direction Engine** (`services/image-engine`) that generates the
illustration library through a governed pipeline rather than ad-hoc prompting:

1. **No handwritten prompts.** Every prompt is composed from layered config —
   Brand DNA · Style · Camera · Lighting · Composition · Scene · Quality ·
   Negative. The brand grade and the negative rules (no text, logos, flags, UI,
   charts, holograms, deformed anatomy…) are applied to *every* image.
2. **Generate-evaluate-select-refine.** Each scene yields N candidates; each is
   scored 0–100 on weighted criteria (architecture, atmosphere, lighting,
   composition, hand/face realism, brand consistency, artifact/ prohibited
   absence…). The best above threshold (default 92) is selected; below it the
   prompt is refined programmatically and regenerated, up to a max.
3. **Continuity-checked.** A candidate is rejected if it drifts from the
   already-approved set's grade/lighting.
4. **Human-approved.** The engine marks a winner `in_review`; a person approves
   before it ships. Generation is **manual / on-demand** from the admin CLI (and
   `report.html`), never automatic.
5. **Provider-agnostic.** OpenAI (`gpt-image-1` + `gpt-4o` vision scoring) is the
   default behind an `ImageProvider`/`Scorer` abstraction; swapping to Gemini,
   Stability, or a sovereign model is a registry case, not a rewrite. The
   OpenAI key may be supplied directly (`OPENAI_API_KEY`) or proxied via the
   Sovereign Supabase project.

## How this relaxes ADR-012

ADR-012 banned AI imagery on the homepage because synthetic, slogan-laden stock
erodes trust. That concern is addressed structurally here: engine outputs are
**text-free by construction** (negative rules), **graded to one institutional
look** (brand + continuity), and **human-approved**. Engine images are therefore
an **accepted interim** for the illustration library, recorded honestly in
`public/people/CREDITS.md`. Real licensed/commissioned photography remains the
long-term target; the engine makes swapping any image a drop-in.

## Consequences

- A new `services/image-engine` package: config-driven, typed, unit-tested
  (offline mock provider/scorer), with a CLI admin surface and HTML contact sheet.
- Live generation incurs OpenAI cost and is run deliberately, scene by scene.
- The five open homepage sector cards (universities, healthcare, justice,
  enterprise, regulators) and other-page illustrations are produced through this
  engine and reviewed before placement.
- No auto-generation: the library grows only when an operator triggers a scene.
