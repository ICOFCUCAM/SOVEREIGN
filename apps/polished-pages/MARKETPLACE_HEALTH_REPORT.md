# Marketplace Health Report

**Polished Pages — real production data**
_Pulled live from the production database. No estimates, projections, or
fabricated numbers._

## Headline metrics (production, as measured)

| Metric | Real value |
|---|---|
| Registered user accounts (`auth.users`) | **1** |
| Marketplace listings (listed + shared + token) | **6** |
| — paid / free | 3 / 3 |
| Total views across all listings | **8** |
| Total downloads across all listings | **1** |
| Listed categories | "Children's storybooks", "Other", (uncategorized) |
| Organizations | **0** |
| Publishing organizations | **0** |
| Organization repositories | **0** |
| Creator collections (any) | **0** |
| Public collections with listed works | **0** |
| Languages on listed works | **0** |
| Documents total | 16 |
| Documents assigned to an organization | **0** |

> Note on creators: 16 documents reference 11 historical `user_id`s and 6 of
> those have listed works, but only **1** of those accounts still exists in
> `auth.users`. The rest are orphaned seed/QA rows. The honest active-user count
> is **1**.

## Verdict

The platform is **infrastructure-rich and content-empty**. Every ecosystem
surface built over the recent phases — organizations, repositories, storefronts,
collections, multilingual discovery, institutional showcases, trending — is
backed by **zero real records**:

- 0 organizations → every institutional surface is empty.
- 0 collections / repositories → "Featured Collections" would show nothing.
- 0 multilingual listings → "Localization Spotlights" would show nothing.
- 6 QA-grade listings, 1 real user → the marketplace itself is pre-launch.

This directly answers the question this report exists to answer:

> _Are we increasing ecosystem density, or merely improving infrastructure?_

**We are improving infrastructure.** Density has not moved, because there is
essentially no real content or real users yet.

## What this means for Phase F

Building Featured Collections, Educational Spotlights, Localization Spotlights,
and Featured Institutions **right now would produce four empty surfaces.** The
activation funnel (publish-at-creation, draft recovery, bulk/unified publishing,
collection suggestions) is built and correct — but it has almost nothing to act
on, because there are almost no users creating content.

The binding constraint is no longer engineering. It is **supply and adoption**:

1. **Real users.** One registered account cannot populate a marketplace. The
   first lever is getting creators and institutions onto the platform at all.
2. **Real institutions.** Zero organizations exist. A single onboarded
   publisher or school publishing a real catalog would do more for "density"
   than any amount of discovery UI.
3. **Then visibility.** Once real collections, institutions and multilingual
   works exist, the Phase F discovery surfaces become worth building — and the
   infrastructure to support them is already in place.

## Recommendation

Do not spend the next cycle building discovery surfaces over empty data. The
highest-leverage work now is **getting real content and real institutions in** —
a go-to-market and seeding effort, not a feature. The product is ready for it.

When density exists (even a handful of real organizations and collections), the
Phase F surfaces are a fast follow on infrastructure that already exists.
