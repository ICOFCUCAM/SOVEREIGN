# Authoring spec — industry page (Layer 2, /industries)

Produce ONE JSON object matching the `Industry` interface in
services/dispatch-web/src/lib/industries.ts: slug, name, forLabel, banner,
headline, intro, publications[6], authorities[5], problems[3×{t,d}],
frameworks[4], metaTitle, metaDescription. banner = slug (a /people/<slug>.webp
image is generated separately by the image-engine). Differentiated, sector-true
content; same honesty rules as concept.md.
