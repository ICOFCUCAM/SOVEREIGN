# Premiumization Review — Operations

**Mission:** the platform is architecturally mature but visually communicates only
a fraction of its value. Make the existing backend sophistication *visible*. No
new features, domains, or backend systems — expose what already exists.

**Diagnosis (first-time institutional evaluator's eyes):** the Operations console
reads like an internal form builder, not the front door to a governed publication
system. The governance engine already computes the governing policy, the ordered
approval authorities, the publication authority, the certificates produced, and
the evidence chain — but the UI buried these in small sidebar boxes or omitted
them, and never used the institutional gravity (serif, engraved surfaces) the
marketing site uses. So 70% of the value was invisible.

The fix makes five things legible on every operator surface:
**Governance · Authority · Publication · Certificate · Evidence.**

---

## Centerpiece — the Governance Instrument
A new reusable component (`components/GovernanceInstrument.tsx`) renders, from the
**real resolved policy** for the chosen record type + classification, a five-stage
instrument:

1. **Governing policy** — the named, versioned policy that governs this record.
2. **Approval authority** — the ordered authorities, with per-step quorum and
   sequential/parallel semantics (the chips an evaluator immediately understands).
3. **Publication authority** — the single named role that may release it, with the
   separation-of-duties rule stated.
4. **Certificate produced** — the Governance Certificate sealed at publication
   (required-vs-actual chain, integrity proof, COMPLIANT verdict) + the
   Preservation Certificate on archive.
5. **Evidence chain** — the append-only, hash-stamped trail end to end.

Nothing is fabricated: every authority, quorum, and name is read from the policy
bound to the record. When no named policy exists it states the honest
platform-default path. This is the single highest-leverage change — it turns
"author a form" into "commission a governed Official Record."

---

## Screen-by-screen audit

| Screen | Where backend sophistication was invisible | What was exposed |
|--------|---------------------------------------------|------------------|
| **Create** (front door) | Governance shown only as a cramped 4-line sidebar box; the form dominated, so it read as a form builder. The policy, authorities, publication authority, and the certificate it would produce were computed but visually trivial. | Re-sequenced as a governed procedure: **1 Define the record → 2 Understand the governance → 3 Author**. The Governance Instrument is now a full-width hero that updates live with type/classification. Serif title + institutional copy ("the front door to a governed publication system, not a document editor"). Submit reads **"Submit for governance →"**. |
| **Dashboard** | Generic operational landing; no institutional gravity; pipeline plates flat. | Serif headline + "Operations Command" eyebrow; "In pipeline" elevated to an engraved plate; pipeline stages restyled as governed-lifecycle plates with seal-accent counts; lifecycle stated **Submit → Govern → Approve → Render → Publish → Preserve**. |
| **Review & Approve** | The approver saw title/type/age but not where the decision sat in the chain, nor that it seals into evidence. Separation of duties was a footnote. | Serif header that states the SoD guarantee up front. A **"Your decision advances"** mini-lifecycle (In Review → Approved → Rendered → Published → Preserved) and the note that publication produces a Governance Certificate and every decision is sealed into the evidence chain. |
| **Document (the record)** | Already carries rich Governance + Preservation certificate panels with certifying statements (from the launch review). Title weight was generic. | Serif record title for gravity, consistent with the rest of Operations. The lifecycle stage chips and certificate instruments were already strong and left intact. |
| **Library / Archives** | Reads as a table; the institutional framing ("the register / preservation") was absent. | Serif headline + eyebrow ("The Register" / "Preservation"). Terminology already aligned to *Official Record* in the launch review. |

---

## Design language applied
- **Serif (Fraunces) headlines** across Operations — the gravity the marketing
  site already used, previously unused in the console.
- **Engraved surfaces** — `bg-gradient-to-b from-white/[0.045]` with an inset top
  highlight, replacing flat boxes (the Stripe/Linear material cue).
- **Seal-accent numerals & authority chips** — counts and authorities read as
  instruments, not form fields; mono for versions and proofs.
- **Numbered procedure cadence** — Create reads as a governed procedure, not a
  single flat form.

## Constraints honored
No new features, domains, or backend systems. Every value rendered is computed by
the existing governance engine and read from the existing API (`GovernancePolicy`,
lifecycle, certificates, audit). This is exposure and presentation only.

## Verification
- `tsc -b` and `vite build` clean.
- No headless browser is available in this environment, so screenshots could not
  be captured here — a visual pass should be done in the running console
  (`/console/create` is the centerpiece).
