# Marketplace Growth Report

**Polished Pages — Phase D: Real Marketplace Growth**
_Final pass / Circle 10 audit_

## Mission

Transform the marketplace from a catalog of listings into a knowledge
ecosystem — optimizing for **valuable** listings (institutional, educational,
multilingual) rather than more listings. No generators, studios, or AI tools
were added. No billing or seats. No fabricated organizations, content, or
metrics — every surface is driven by real, listed rows and degrades to an
honest empty state when data is absent.

---

## What shipped, by circle

| Circle | Scope | Status |
|---|---|---|
| 1 | Featured institutions | ✅ Featured-institutions rail on the marketplace; `/institutions` groups real publishers, schools, NGOs and ministries by type |
| 2 | Institution showcases | ✅ Branded org storefronts + institution cards showing collections, languages, works |
| 3 | Educational collections | ✅ "For education" discovery band (curriculum, classroom, teacher resources, textbooks, workbooks, readers) into the filtered catalog |
| 4 | Multilingual discovery | ✅ "Multilingual knowledge": most-translated works + language-breadth strip, from real edition data |
| 5 | Publisher brands | ✅ Brand stats bar on storefronts (works, languages, editions, series, collections) |
| 6 | Search excellence | ✅ Cross-field, multi-word, relevance-ranked search (now incl. institution name) + **institution and language filters** on the catalog; collection/repository-level filtering remains a future facet |
| 7 | Trending knowledge | ✅ Trending institutions by real engagement; trending-in-education and trending-multilingual shelves; most-translated and recently-published shelves |
| 8 | Marketplace trust | ✅ Per-listing provenance ("Published by {institution}" + verified institution badge) on every catalog card; verified badges through institution discovery |
| 9 | Knowledge network | ✅ Ecosystem band on `/institutions` (institutions · works · collections · languages) as a distinctive identity, from real aggregates |
| 10 | Final pass | ✅ This report |

---

## New data layer (all real, public, membership-agnostic reads)

- `polished_org_showcase` — institutions with published content (+ collections, created_at)
- `polished_org_storefront_stats` — per-storefront brand stats
- `polished_marketplace_languages` — listed works by language
- `polished_marketplace_most_localized` — originals ranked by localized editions
- `polished_marketplace_trending_orgs` — institutions by real engagement
- `polished_catalog` (extended) — institution + language filters and per-listing
  provenance (owning organization, verified) on every marketplace card

Each inner-joins to listed + shared + tokenized works, so only genuine
marketplace content ever appears.

---

## Readiness scores

Scored 1–10 on how complete the marketplace ecosystem is for each audience.

| Audience | Score | Rationale |
|---|---|---|
| **Creator** | 8.0 | Mature: featured/trending/top-rated shelves, creator rails, storefronts, cross-field search, ratings. The original, strongest surface. |
| **Publisher** | 8.0 | Branded storefronts with catalog/series/language stats, featured + trending placement, multilingual surfacing, **per-listing provenance and institution filtering**. |
| **School** | 7.5 | Educational discovery band, curriculum/teacher-resource surfaces, institution showcases, institution + language filters. Gap: dedicated primary/secondary structuring depends on richer category data. |
| **NGO** | 6.5 | Program institutions discoverable with regional/language coverage on their workspace; marketplace-side program discovery is lighter. |
| **Ministry** | 6.5 | Institutional storefronts + regional/language coverage; national-rollout discovery surfaces are nascent. |
| **Marketplace maturity** | 7.5 | The ecosystem layer (institutions, multilingual, trending, provenance, filters) is in place over a solid creator marketplace. The binding constraint is real content, not structure. |

---

## The honest constraint

Production currently holds only a handful of QA listings and no organizations
with published content. Every ecosystem surface built here is **infrastructure
that activates the moment real institutions publish** — and until then renders
truthful empty states ("The first institutions are coming"). This is by design:
no placeholder institutions, no invented engagement, no fake languages.

The single highest-leverage growth lever now is **not more marketplace code —
it is real institutional content** (onboarding publishers, schools and
ministries to publish their catalogs through the adoption layer already built).

---

## Remaining opportunities (prioritized)

1. **Collection / repository filtering (Circle 6).** Institution and language
   filters now ship; exposing organization repositories as public marketplace
   facets is the remaining filter dimension.
2. **A live relationship graph (Circle 9).** Upgrade the ecosystem band into an
   interactive author ↔ institution ↔ collection ↔ language graph as the
   network grows.
3. **Real institutional content.** The single highest-leverage lever — onboard
   institutions to publish so every surface above fills with genuine data.

---

## Verdict against the success metric

> _The marketplace should feel less like a storefront and more like the world's
> library of publishable, localizable and distributable knowledge._

**Structurally met.** The marketplace now presents institutions as brands,
elevates educational and multilingual knowledge, ranks institutions by real
engagement, and makes trust and provenance visible — over a mature creator
marketplace. The ecosystem reads as a knowledge library rather than a store.
What remains is **content density**: the surfaces are built and real; they need
real institutions publishing into them to come fully alive.
