# Organization Foundation Report

**Polished Pages — Organization Experience Premiumization**
_Final pass / Circle 10 audit_

## Mission

Transform organizations from a backend capability into a first-class experience,
so a publisher, school, NGO, ministry, or company feels Polished Pages was
designed specifically for their institution — not adapted from an individual
creator product.

No new generators, studios, or AI tools were added. Billing, seats, and pricing
remain intentionally out of scope. No fabricated organizations, content, or
metrics were introduced.

---

## What shipped, by circle

| Circle | Scope | Status |
|---|---|---|
| 1 | Organization Command Center | ✅ `/organizations/:slug` — institutional banner, focus lenses, Organization Health, content/category mix, repositories, members, governance, settings |
| 2 | Publisher experience | ✅ Type-aware focus on catalog, editions & localization, series/publishing collections, editorial team |
| 3 | School experience | ✅ Curriculum & assessments, grade/subject collections, educational-asset tracking, teachers & staff |
| 4 | NGO & ministry experience | ✅ Programs & campaigns, languages & regional reach, initiatives via program/curriculum collections |
| 5 | Organization storefronts | ✅ Type-branded accents and institutional catalog framing at `/org/:slug` |
| 6 | Organization analytics | ✅ Works, published, views, downloads, languages, editions, members, collections + content/category breakdowns |
| 7 | Shared repositories | ✅ Typed collections: curriculum / publishing / program / series / general |
| 8 | Institutional trust | ✅ Append-only audit log wired into every mutating RPC; manager-only read; ownership & last-owner protections; server-enforced permissions |
| 9 | Showcase system | ✅ Public `/institutions` — real published content only, grouped by type |
| 10 | Final pass | ✅ This report |

---

## Architecture notes

- **Access model.** Every organization operation goes through `SECURITY DEFINER`
  RPCs that check role server-side (`polished.org_can_manage` / `org_can_edit` /
  `org_is_member`). RLS is enabled on all org tables; reads of sensitive data
  (members, invitations, audit) are gated inside the RPCs. This matches the
  existing document-access pattern in the project.
- **Truthful analytics.** Every figure is derived from real rows in
  `polished.documents` and the org tables. "Editions" counts documents with a
  parent (localized editions); "Languages" counts distinct `edition_language`;
  "Educational assets" sums published works in the educational categories.
  Nothing is invented or seeded.
- **Type presentation.** A single `ORG_PRESENTATION` config maps each
  organization type to its language, accent, focus lenses, and suggested
  repository types — so publisher/school/NGO/ministry/company experiences
  diverge without duplicating page code.

---

## Readiness scores

Scored 1–10 on how complete the institution-grade experience is today.

| Audience | Score | Rationale |
|---|---|---|
| **Publisher** | 7.5 | Command center, branded storefront, editions/localization view, series & publishing repositories, editorial roles. Gap: one-click "publish to org library" from the Library, and distribution beyond the storefront link. |
| **School** | 7.5 | Curriculum/subject repositories, educational-asset tracking, assessment/teacher categories, roles that fit staff. Gap: same library-wiring gap; class/student concepts are deliberately not modeled. |
| **NGO** | 7.0 | Program repositories, language/reach metrics, campaign framing. Gap: program-level analytics are still shallow (no per-program rollups). |
| **Ministry** | 6.5 | National/regional framing, languages and editions, educational-asset view. Gap: "region" is not yet a first-class data dimension — reach is expressed through languages/editions only. |
| **Enterprise** | 6.5 | Server-enforced roles, ownership protections, and an audit trail give a real governance story. Gap: SSO/SCIM, data export, admin-driven verification, and billing are not implemented (billing intentionally deferred). |

---

## Remaining weaknesses (prioritized)

1. **Populate the shared library from the UI.** The `polished_org_set_document`
   RPC exists and is permission-checked, but there is no "Move to organization"
   / "Publish to org" affordance in the Library yet. This is the single highest-
   leverage next step: without it, an org's shared library and storefront stay
   empty in normal use.
2. **Invitation redemption flow.** Invites generate a token and
   `acceptInvite(token)` exists, but there is no `/invite/:token` page to redeem
   one and no email delivery. Today an invited user must already be reachable
   through another channel.
3. **Real content / go-to-market.** Production currently holds only test
   listings. The showcase and storefronts are intentionally empty until real
   institutions publish — this is a content/onboarding task, not a code gap.
4. **Organization verification.** The `verified` flag is honored everywhere in
   the UI but has no admin granting flow yet.
5. **Region as a dimension** (ministry) and **per-program analytics** (NGO)
   would deepen the two program-oriented audiences.

---

## Verdict against the success metric

> _A publisher, school, NGO, ministry, or company should feel that Polished Pages
> was designed specifically for their organization rather than adapted from an
> individual creator product._

**Met for the in-product experience.** The command center, type-specific focus
lenses, typed repositories, branded storefronts, governance log, and
institutional showcase together make the organization a first-class surface with
a distinct feel per institution type. The remaining gaps are about **getting real
content into organizations** (library wiring + invitations + onboarding) rather
than about whether the institution experience exists — and those are the clear
next steps.
