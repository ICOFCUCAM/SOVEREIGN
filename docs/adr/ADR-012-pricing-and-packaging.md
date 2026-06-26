# ADR-012 — Pricing & Packaging: Price the Institution, Never the Seat

- Status: Accepted (philosophy + public list pricing; contracts negotiated per institution)
- Date: 2026-06-26
- Supersedes: none (extends ADR-011 platform-positioning; complements ADR-010)
- Context: Dispatch is repeatedly mis-anchored against the wrong category. Priced
  like a document store (SharePoint, Dropbox, Drive) or an e-signature tool
  (DocuSign), it would be cheap, commoditised, and judged on storage and seats.
  Its actual value proposition is **governance, institutional authority,
  publication infrastructure, evidence, compliance and sovereignty** — high-value
  capabilities institutions buy because the cost of getting them *wrong* is
  enormous. The pricing model must reflect that, and must fit how public-sector
  and enterprise buyers actually budget.

## Decision — what we charge for, and what we never charge for

**Never charge for** storage, PDFs, documents-as-files, or **seats**. A ministry
with 8,000 employees must feel free to add every relevant person; per-seat pricing
($20/user × 8,000 = $160k/month for accounts that mostly log in rarely) is exactly
the model public-sector buyers reject, and it would re-frame Dispatch as a SaaS
collaboration tool.

**Charge for** the capability and the institution: governance, institutional
authority, compliance, sovereignty, deployment model, support level, and API
integration. The differentiator between tiers is **institution size and capability**
(departments, governance policies, deployment, support, integrations) — not the
number of people who can sign in.

### The meter is the governance event, not the file

Where volume is metered (Professional), the unit is the **governed publication** —
the act of placing institutional authority, an evidence chain and a permanent
Record ID behind something. That is the value event. The product surfaces and
pricing copy must say "governed publications", never "PDFs" or "documents", so the
meter never reads as charging per file (which the philosophy forbids). Business and
above are unlimited.

### Tiers

Tier **names reinforce positioning** (institution, not SaaS): Evaluation /
Institutional / Institutional Plus / Enterprise / Sovereign — an obvious ladder
where "Institutional Plus" reads as a step up from Institutional without colliding
with the Enterprise tier (rejected: "Organization", too broad; "Enterprise
Organization", collides with Enterprise).

Each tier carries a **one-line purpose** so the upgrade path is legible in seconds,
and each step **inherits everything below it** ("Everything in X, plus"):

- Evaluation — *Evaluate Dispatch end to end.*
- Institutional — *Run one institution with production governance.*
- Institutional Plus — *Operate multiple departments with enterprise oversight and advanced governance.*
- Enterprise — *Connect Dispatch to your identity, infrastructure and compliance environment.*
- Sovereign — *Own the entire platform under your jurisdiction.*

Every paid card shows **unlimited institutional users** and a **visual Deployment
stack** (glyph + label per option: Managed → Private → On-Prem → Sovereign /
Air-Gapped) — answering the procurement officer's first question ("can we own this
ourselves?") on the card, because procurement filters on deployment *before* it
compares features. "Unlimited institutional users" is not merely listed but
**explained** (licensed to institutions, not employees — the explicit contrast with
M365 / Workspace / Atlassian). A **"Every paid plan includes"** reassurance grid
states the governance floor (enforcement, evidence chain, certificates, integrity,
audit, API, docs) so the core platform never reads as an add-on. The page **closes
on evaluation confidence, not price** (Launch Evaluation + Download Procurement
Package + architecture/security/deployment links).

| Plan | Price (public) | Deployment | Target | Core inclusions |
|------|----------------|------------|--------|-----------------|
| **Evaluation** | Free | Managed Cloud (eval) | Product evaluation | Up to 5 users, 10 governed publications, full governance engine, certificates, preservation, limited API — **watermarked, not an official record** |
| **Institutional** | US$299/mo | Managed Cloud | NGOs, municipalities, schools, small companies | Unlimited institutional users, 500 governed publications/mo, governance, preservation, API, SSO-ready, email support |
| **Institutional Plus** | US$999/mo | Managed or Private Cloud | Universities, hospitals, mid-market, agencies | Unlimited governed publications, multiple departments, office hierarchy, advanced governance policies, analytics, executive dashboard, priority support |
| **Enterprise** | **From US$3,500/mo** (Contact) | Managed, Private, or On-Premises | Ministries, national agencies, large enterprises | Everything unlimited, SSO (Azure AD / Okta), advanced governance, audit exports, HA + SLA, enterprise support, dedicated onboarding |
| **Sovereign** | **Custom engagement** (Contact) | Sovereign / Air-Gapped / On-Premises | National governments, central banks, defence, supreme courts, election commissions | Sovereign hosting / private cloud, source escrow (if negotiated), custom integrations, migration & training, dedicated support, white-glove deployment |

**No published range for the top tiers.** Enterprise shows only "From US$3,500/mo"
and Sovereign only "Custom engagement". Publishing a range (e.g. "$3,500–7,500")
makes buyers anchor on the lowest number; the internal Sovereign engagement band
(~US$50k–500k+/yr) is for sales context only and is **not** shown on the public page.

### API as its own product (à la ADR-011, two buyers)

The API is a second product for the API-first buyer who is **not** licensing the
Console. Platform plans include API at a fair-use call ceiling; the standalone API
tiers stand alone:

- **Developer** — Free: sandbox, 500 calls/mo.
- **API Professional** — US$199/mo: 50,000 calls, OAuth, webhooks, support.
- **API Enterprise** — Custom: unlimited.

This avoids a Business customer seeing two prices for "API": the console plan's API
is included up to fair use; the standalone tiers are for integration-only buyers.

### Professional services (a real revenue line — but off the pricing grid)

Deployment, migration, policy design, governance consulting, identity integration,
training, custom record templates. Indicative: US$2,000–5,000/day consulting;
fixed-price implementations from US$20,000. **Not shown as priced tiers on the
public page** — services must not visually compete with the subscription plans.
The page instead carries a single "Need deployment, migration or governance
consulting?" band with a *Talk to our implementation team* CTA, signalling that
enterprise help exists while keeping the pricing page focused on software.

## How prices are displayed publicly

Concrete public prices for **Evaluation / Professional / Business** (self-serve
credibility); **"From $3,500/mo" + Contact** for Enterprise and **Custom + Contact**
for Sovereign. Publishing exact numbers for the top tiers anchors the high end
*low* against a ministry's real budget and removes negotiating room; the
institutional norm is to qualify those engagements.

## Integrity constraint — evaluation must not pollute the trust namespace

Evaluation (free) publications **must not** receive real permanent Record IDs in the
public verification registry (`SD-YYYY-NNNNNNNN`). If they did, anyone could mint
"official-looking" records for free and they would verify as genuine on
`/verify/:id`, destroying the un-copyable guarantee the whole product rests on.
Evaluation records use a separate, visibly-marked namespace (e.g. `EVAL-…`) and the
public portal labels them **not an official record**. (Implementation deferred until
the free tier is provisioned; recorded here as a binding requirement.)

## Consequences

- Marketing and the `/pricing` page reflect this immediately (public list pricing +
  Contact on the top two tiers). The page is the artefact of this ADR.
- The free tier's evaluation-namespace isolation is a tracked prerequisite before
  self-serve signup mints anything that touches the verification registry.
- Seat-based metering is explicitly out of scope, permanently, by decision.
- Quote/contract terms (Enterprise SLA figures, Sovereign engagement scope) remain
  negotiated per institution and are never asserted as guarantees on public surfaces.

## Status of related builds

- **Now:** public `/pricing` page; ADR recorded.
- **Trigger — first free-tier signup that publishes:** implement the `EVAL-`
  namespace + portal labelling before any evaluation artefact can reach `/verify`.
- **Trigger — first metered Professional customer:** wire the governed-publication
  monthly counter and soft cap (no hard file/storage metering, ever).
- **Deferred:** billing/subscription system, usage metering store, invoice/quote
  generation — none built until a paying customer requires it.
