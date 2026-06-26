# Homepage imagery — "Trusted by Institutions Worldwide"

Drop a photograph here for each institution card and it appears on the homepage
automatically. Until then the card shows a dignified per-sector editorial
placeholder — never a broken image.

- **Format:** `.webp`, landscape **16:10** (e.g. 1600×1000).
- **Filename:** exactly the slug below — `<slug>.webp`.
- **Direction:** premium editorial photography of institutional **leadership at
  work** — presiding, signing, deliberating. Not smiling office clichés, not a
  stock-photo feel. International representation across Africa, Europe, Asia, the
  Middle East and the Americas, with equal representation of men and women.

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
