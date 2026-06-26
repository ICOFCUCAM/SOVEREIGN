# ADR-010 — Multi-Institution Scope & Inter-Institutional Interaction

- Status: Accepted (decision to **defer**; design direction recorded)
- Date: 2026-06-26
- Supersedes: none (constrains future scope above ADR-009 autonomy)
- Context: Sovereign Dispatch now operates as a **complete single institution**.
  A tenant carries Institution → Departments → Offices → People → office
  assignments → acting appointments → governance policies (referencing office
  keys, never accounts) → record lifecycle → preservation → certificates.
  This was validated by operating the platform as a real ministry end to end:
  28 distinct governance behaviours proven across two lifecycle harnesses
  (`services/test/lifecycle-e2e.test.mjs`, `lifecycle-edge.test.mjs`), 0 engine
  bugs, 1 production data bug found and fixed (publication-authority key).

## Problem

The pull is to build a **"Nation → Ministries"** hierarchy as the next
architectural layer. Examined directly, that framing is wrong twice over:

1. **"Nation" is one specialization, not the architecture.** University of
   Oslo, the European Commission, the United Nations, the Red Cross, the World
   Bank, an NHS Trust, a multinational group — none fit "Nation → Ministries."
   The general shape is an **Organization Group**, of which "Nation" is one case.

2. **Two different missing concepts were being conflated.** They are orthogonal
   and must not be merged into one feature:

   - **Organization Group (vertical — management & visibility).** A *content-blind*
     parent over institutions: sees institutions, status, and aggregate
     governance counts (policies / offices / users) — and **never** record
     content, evidence, drafts, or certificates. Its value is administrative
     convenience (central oversight, provisioning, health). No institution's
     lifecycle is blocked without it.

   - **Institution-to-institution exchange (horizontal — interaction).** One
     sovereign body transmits a *governed official record* to another (Finance →
     Justice; a regulator → a university; a hospital → a regulator), with
     provenance and receipt. This is a genuine institutional act and is arguably
     more core to Dispatch than any dashboard.

   Critically, **the group does not deliver the interaction.** Two institutions
   can exchange records with **no shared parent at all** (a ministry sending to a
   *foreign* ministry; a hospital submitting to an independent regulator), and a
   group can exist with **zero exchange** (a corporate parent that only wants a
   health board). Building the group does not get you the interaction, and the
   interaction does not require the group.

## Decision

**Defer both. Build neither speculatively.** Each is justified only by a named
customer with a concrete need, not by an org-chart diagram. This is the same
discipline applied to SSO (ADR-002 future path) — it is an *integration*
milestone, not the architecture — applied again here.

When a real need arrives, the design directions are fixed in advance:

- **Organization Group** is the correct generalization of "Nation," it is
  **optional**, and it is **content-blind**. The parent is never a super-user:
  it may read institutional metadata and aggregate counts only. Tenant isolation
  (RLS FORCE) is preserved unchanged; the parent gets no path to child records,
  evidence, drafts, or certificates.
- **Inter-institutional exchange** is a **separate capability** that does **not**
  depend on, and must not be coupled to, the Organization Group. It is a
  peer-to-peer governed transmission with provenance and receipt.

The next non-speculative work — valuable regardless of which axis (if either)
later becomes real — is **depth within one institution**: more record types
(`policy_paper`, `board_report`) with their own required sections, withdrawal /
re-publication, retention / disposal runs, and concurrent multi-office load.
None of that is wasted whichever way scope later expands.

## Advantages

- Avoids building administrative or messaging infrastructure with no customer —
  the second near-miss at solving the wrong problem.
- Keeps the proven single-institution model the product's centre of gravity.
- Records the design directions so they are not re-litigated a third time, and
  so neither concept is accidentally merged into the other.

## Disadvantages

- Multi-institution customers (a government, a university system) cannot be
  served centrally until the Organization Group is built — accepted, because no
  such customer is yet named.
- Cross-institution workflows remain manual (out-of-band) until exchange is
  built — accepted, same reason.

## Trigger to revisit

Revisit when **any** of the following becomes concrete (not hypothetical):

1. A named customer needs **central oversight** of several institutions they own
   (→ build Organization Group, content-blind).
2. A named scenario requires **Body A to send a governed record to Body B**
   (→ design inter-institutional exchange, independent of any group).
3. Single-institution depth work surfaces a structural limit that one of the two
   concepts naturally resolves.

Until one of these is real, this ADR stands and the answer is: deepen the single
institution. **Do not forget to revisit.**

## Evidence

Single-institution completeness proven by `services/test/lifecycle-e2e.test.mjs`
(18 checks: build institution → offices → office-holders → policy-over-offices →
submit → ordered-chain enforcement → approve → render → publish → COMPLIANT
certificate → preserve → separation of duties) and `lifecycle-edge.test.mjs`
(10 checks: rejection, return-for-revision, quorum > 1 with distinct holders,
acting appointment on behalf of an office, no-office principal refused). All
green against real Postgres + the live API.
