# Authoring spec — concept page (Layer 3, /learn)

Produce ONE JSON object (or an array for a batch) matching the `concept` schema:
slug, term, category, kicker, headline, lead, definition, why[3], how[3×{t,d}],
faqs[3×{q,a}], relatedIndustries[3-4], relatedProblems[3-4], diagram, metaTitle,
metaDescription.

Rules:
- slug: unique kebab-case; must not collide with an existing concept slug.
- definition: 1–2 sentences, snippet-ready, BEGINNING with the term.
- headline: benefit-led, ~6–11 words. faqs[0].a restates the definition plainly.
- relatedIndustries: only real industry slugs. diagram ∈ chain|seal|lifecycle|
  shield|ledger|workflow. metaTitle ≤60, metaDescription ≤160.

Tone: authoritative, precise, honest. NEVER promise guaranteed outcomes. Prefer
"tamper-evident" over "tamper-proof". Treat compliance frameworks as alignment,
not certification. (The engine's fact-verification stage enforces these.)
