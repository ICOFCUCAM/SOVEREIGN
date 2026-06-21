# Marketplace Maturity Report

**Polished Pages — Phase F: Marketplace Density**
_Scores reflect real production data (measured live). No fabricated metrics._

## Phase F delivery, by circle

| Circle | Scope | Status |
|---|---|---|
| 1 | Featured collections | ✅ Public collections that contain listed works surface as a first-class discovery rail (`polished_marketplace_collections`); real collections only |
| 2 | Educational spotlights | ✅ "For education" discovery band + trending-in-education shelf (curriculum, classroom, teacher resources) |
| 3 | Localization spotlights | ✅ Multilingual section: most-translated works, language breadth, trending-multilingual shelf |
| 4 | Featured institutions | ✅ Featured + trending institutions (real engagement), grouped by type on `/institutions` |
| 5 | Marketplace health dashboard | ✅ `/marketplace-health` (admin) — live ecosystem + engagement metrics, no estimates |
| 6 | Discovery optimization | ✅ Institution + language filters, per-listing provenance, education/collections navigation |
| 7 | Knowledge network | ✅ Ecosystem band on `/institutions` (institutions · works · collections · languages) |
| 8 | Marketplace trust | ✅ Per-listing provenance ("Published by {institution}" + verified badges) |
| 9 | Content density audit | ✅ Built into the health dashboard: orphaned content, unpublished works, empty storefronts/repositories |
| 10 | Maturity report | ✅ This document |

The discovery, trust and visibility **infrastructure** for Phase F is complete.

## Real production data (measured)

| Metric | Value |
|---|---|
| Registered users (`auth.users`) | **1** |
| Marketplace listings | **6** (3 paid / 3 free) |
| Listing views / downloads | 8 / 1 |
| Organizations | **0** |
| Publishing organizations (storefronts) | **0** |
| Repositories | **0** |
| Public collections | **0** |
| Languages on listed works | **0** |
| Documents total | 16 |
| — unpublished | 10 |
| — orphaned (owner no longer exists) | **15** |
| Documents assigned to an organization | **0** |

## Readiness scores

Scored 1–10. Two axes are separated deliberately: **capability** (is the
ecosystem built?) vs **density** (is there real content in it?).

| Ecosystem | Capability | Density (real data) |
|---|---|---|
| **Creator** | 8.5 | **1.0** — 6 QA listings, 1 real user |
| **Publisher** | 8.0 | **0.0** — no organizations exist |
| **School** | 7.5 | **0.0** — no organizations exist |
| **NGO** | 6.5 | **0.0** — no organizations exist |
| **Ministry** | 6.5 | **0.0** — no organizations exist |
| **Marketplace density** | — | **0.5** — effectively pre-launch |
| **Discovery quality** | 8.0 | n/a — strong, but discovering near-empty data |

## Verdict

**Capability is high; density is ~zero.** Phase F's surfaces — featured
collections, educational and localization spotlights, featured institutions,
the knowledge band, trust/provenance — are all built and correct, and every one
renders **only real data with honest empty states**. But there is essentially
nothing for them to show: 0 organizations, 0 collections, 0 multilingual
listings, 1 real user, and 15 of 16 documents are orphaned seed rows.

This is not a feature gap. The marketplace does not yet "feel like a living
global knowledge ecosystem" for one reason only: **there is no ecosystem content
yet.**

## What actually moves the metric now

Not more discovery surfaces — they are built and waiting. The only levers that
change the real numbers above are:

1. **Acquire real users.** One registered account cannot populate a marketplace.
2. **Onboard the first real institutions.** A single publisher or school
   publishing a genuine catalog would move every Phase F surface from empty to
   alive — the activation funnel (publish-at-creation, draft recovery,
   bulk/unified publishing, collection suggestions) is built to make that fast.
3. **Clean up seed data.** 15 orphaned documents and the QA listings inflate
   counts; clearing them gives an honest baseline to grow from.

The product is ready for content. The next phase is **getting real content and
real institutions in** — a go-to-market effort, not an engineering one. Track
progress on `/marketplace-health`, which now reports these numbers live.
