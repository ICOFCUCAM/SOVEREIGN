# Category Lexicon — Protected Vocabulary

Category creation succeeds through **repetition and consistency**. From now on,
every surface — UI, docs, sales, support, code comments — uses the **same** word
for the same concept. Drift dilutes the category; discipline compounds it.

## The canonical terms (always use these)

| Term | Means | Never call it |
|------|-------|----------------|
| **Official Record** | A governed, versioned, classified institutional document of record | "document", "file", "the institutional record" (singular collective) |
| **Governance Policy** | The executable, versioned rule for how a class of records is governed | "workflow", "template" |
| **Approval chain** | The ordered authorities a record clears (a property of the policy) | "review chain", "governance chain" |
| **Publication Authority** | The named role empowered to release a record; never the approver | generic "governance authority" when the publisher is meant |
| **Governance Certificate** | Proof a publication satisfied its policy (COMPLIANT verdict, required-vs-actual chain, integrity proof) | "compliance badge", "verdict" used loosely |
| **Preservation Certificate** | Proof a record is permanently sealed (preservation timestamp + SHA-256) | "archive receipt" |
| **Evidence Chain** | The append-only, hash-stamped trail from creation to preservation | "hash-verified" (wrong operation), "log" |
| **Dispatch Standard** | The operating standard for institutional records the platform defines | "our feature set", "the product" |

## Lifecycle verbs (consistent triad)
- **Govern** → a record clears its approval chain.
- **Publish** → the Publication Authority releases it (Governance Certificate sealed).
- **Preserve** (archive) → the record is sealed, terminal (Preservation Certificate issued).

The canonical journey, stated the same way everywhere:
**Create → Govern → Publish → Preserve.**

## Rules
1. **One word per concept.** If you catch a synonym, fix it — don't add a gloss.
2. **"Official Record", not "document"** on every operator-facing surface.
3. **"Approval chain"** for the policy's ordered authorities; "approval sequence"
   only for the certificate's record of who satisfied it, in order.
4. **"hash-stamped"** for the evidence trail and artifacts — never "hash-verified".
5. Audited periodically; the Launch Readiness Review already aligned the surfaces —
   keep them aligned.
